import { SuspiciousWords, parseHeader } from './utils/utils.js';

//src/background.js


// Function to fetch and analyze emails
// src/background.js

// Function to fetch and analyze emails
function fetchAndAnalyzeEmails() {
  console.log('fetchAndAnalyzeEmails called');
  chrome.identity.getAuthToken({ interactive: false }, async (token) => {
    if (!token) {
      console.error('Failed to retrieve token');
      return;
    }
    console.log('Token retrieved:', token);

    const url = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=10';

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.error) {
        console.error('Error fetching email list:', data.error);
        return;
      }
      console.log('Email data received:', data);

      if (data.messages && data.messages.length > 0) {
        const emailDetails = await Promise.all(data.messages.map((msg) => fetchEmailDetails(token, msg.id)));
        analyzeEmails(emailDetails);
      } else {
        console.log('No emails found.');
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
  });
}

// Analyze emails by sending content to backend API
async function analyzeEmails(emails) {
  const flaggedEmails = [];

  for (const email of emails) {
    const isFlagged = await sendToBackendForAnalysis(email.body);
    console.log('Analyzed email:', email.subject, '| isFlagged:', isFlagged);

    if (isFlagged) {
      console.log('Suspicious email detected:', email);
      flaggedEmails.push(email); // Add flagged email to the list
    }
  }

  if (flaggedEmails.length > 0) {
    chrome.storage.local.set({ flaggedEmails }, () => {
      console.log('Flagged emails saved to storage:', flaggedEmails);
    });
  }
}

// Function to send email content to the backend for analysis
async function sendToBackendForAnalysis(text) {
  try {
    const response = await fetch('http://localhost:3001/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    const result = await response.json();
    return result.isSuspicious;
  } catch (error) {
    console.error('Error calling backend API:', error);
    return false;
  }
}

// Helper to fetch email details
function fetchEmailDetails(token, messageId) {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;

  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(response => response.json())
    .then(email => {
      if (!email.payload?.headers) return null;

      const body = extractEmailBody(email.payload);
      return {
        id: email.id,
        subject: parseHeader(email.payload.headers, 'Subject'),
        from: parseHeader(email.payload.headers, 'From'),
        date: parseHeader(email.payload.headers, 'Date'),
        snippet: email.snippet,
        body,
      };
    })
    .catch(error => console.error('Error fetching email details:', error));
}

// Function to extract email body from Gmail API response
function extractEmailBody(payload) {
  let body = '';
  if (payload.parts) {
    const htmlPart = payload.parts.find(part => part.mimeType === 'text/html');
    if (htmlPart?.body?.data) {
      body = atob(htmlPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    }
  } else if (payload.body?.data) {
    body = atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
  }
  return body || 'No body content available';
}


// Event Listeners

// On extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  // Clear any existing flagged emails
  chrome.storage.local.remove(['flaggedEmails'], () => {
    console.log('Cleared flagged emails cache');
  });
  // Fetch and analyze emails immediately
  fetchAndAnalyzeEmails();
});

// On browser startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Browser started up');
  // Fetch and analyze emails on startup
  fetchAndAnalyzeEmails();
});

// Create an alarm to fetch emails periodically (every 5 minutes)
chrome.alarms.create('checkEmails', { periodInMinutes: 5 });

// Set an event listener for the alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log('Alarm triggered:', alarm.name);
  if (alarm.name === 'checkEmails') {
    fetchAndAnalyzeEmails(); // Trigger email fetching and analysis
  }
});


