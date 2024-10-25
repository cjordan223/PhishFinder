import { emailIsSuspicious, parseHeader } from './utils/utils.js';

//src/background.js
// Function to fetch and analyze emails
function fetchAndAnalyzeEmails() {
  console.log('fetchAndAnalyzeEmails called');
  chrome.identity.getAuthToken({ interactive: false }, function(token) {
    if (!token) {
      console.error('Failed to retrieve token');
      return;
    }
    console.log('Token retrieved:', token);

    const url = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=10';

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
,
    })
      .then(response => {
        console.log('Response status:', response.status);
        return response.json();
      })
      .then(async (data) => {
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
      })
      .catch(error => console.error('Error fetching emails:', error));
  });
}

// Analyze emails and flag suspicious ones
// background.js

function analyzeEmails(emails) {
  const flaggedEmails = [];

  emails.forEach(email => {
    email.isFlagged = emailIsSuspicious(email);
    console.log('Analyzed email:', email.subject, '| isFlagged:', email.isFlagged);

    if (email.isFlagged) {
      console.log('Suspicious email detected:', email);
      flaggedEmails.push(email); // Add flagged email to the list
    }
  });

  if (flaggedEmails.length > 0) {
    // Save flagged emails to Chrome storage
    chrome.storage.local.set({ flaggedEmails }, () => {
      console.log('Flagged emails saved to storage:', flaggedEmails);
    });
  }
}


// Fetch email details
function fetchEmailDetails(token, messageId) {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;

  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(response => response.json())
    .then(email => {
      if (!email.payload || !email.payload.headers) {
        return null;
      }

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

// Helper function to extract email body
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
