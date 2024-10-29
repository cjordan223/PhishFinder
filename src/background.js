import { isEmailProcessed, markEmailAsProcessed, parseHeader, analyzeEmailContent, extractEmailBody, linkAnalysis } from './utils/utils.js';
import DOMPurify from 'dompurify';
// Fetch and analyze emails
// This function fetches emails from the Gmail API and analyzes them for suspicious content.
// Referenced in: chrome.runtime.onInstalled, chrome.runtime.onStartup, chrome.alarms.onAlarm
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

// Analyze emails (src/background.js)
// This function analyzes a list of emails for suspicious content and saves flagged emails to local storage and backend.
// Referenced in: fetchAndAnalyzeEmails
async function analyzeEmails(emails) {
  const flaggedEmails = [];

  for (const email of emails) {
    // Analyze email content for suspicious flags
    const analyzedEmail = await analyzeEmailContent(email, sendToBackendForAnalysis);
    
    // More detailed logging
    console.log('Email Analysis:', {
      subject: analyzedEmail.subject,
      keywordMatch: analyzedEmail.keywordMatch || 'none', 
      linkRisks: analyzedEmail.linkRisks || [],
      isFlagged: analyzedEmail.isFlagged
    });

    if (analyzedEmail.isFlagged) {
      flaggedEmails.push(analyzedEmail);
    }

    // Clean the email body using DOMPurify
    const cleanBody = (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) 
      ? DOMPurify.sanitize(email.body, { USE_PROFILES: { html: true } })
      : email.body; // Fallback to raw body if DOMPurify is unavailable

    // Prepare data for backend storage
    const emailData = {
      id: email.id,
      sender: email.from,
      subject: email.subject,
      body: cleanBody,
      extractedUrls: linkAnalysis(email.body),
      timestamp: new Date(email.date).toISOString(),
      safebrowsingFlag: analyzedEmail.isFlagged ? 'yes' : 'no',
    };

    // Store each analyzed email in the backend database if not processed
    await saveEmailToBackend(emailData);
  }

  // Save flagged emails to local storage if any found
  if (flaggedEmails.length > 0) {
    chrome.storage.local.set({ flaggedEmails }, () => {
      console.log('Flagged emails saved to storage:', flaggedEmails);
    });
  }
}



// Save email data to the backend only if not already processed
// This function saves email data to the backend if it has not been processed before.
// Referenced in: analyzeEmails
async function saveEmailToBackend(emailData) {
  const isProcessed = await isEmailProcessed(emailData.id);
  if (isProcessed) {
    console.log(`Email with ID ${emailData.id} is already processed. Skipping backend call.`);
    return;
  }

  try {
    const response = await fetch('http://localhost:8080/api/saveEmailAnalysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData),
    });

    const result = await response.json();
    if (result.success) {
      console.log('Email analysis saved successfully:', result.id);
      await markEmailAsProcessed(emailData.id); // Mark as processed after successful save
    } else {
      console.error('Failed to save email analysis:', result.error);
    }
  } catch (error) {
    console.error('Error saving email to backend:', error);
  }
}

// Send email content to the backend for analysis
// This function sends email content to the backend for analysis and returns whether it is flagged as suspicious.
// Referenced in: analyzeEmailContent
async function sendToBackendForAnalysis(text) {
  try {
    const response = await fetch('http://localhost:8080/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    const result = await response.json();
    return result.isSuspicious || false; // Return true if flagged, false otherwise
  } catch (error) {
    console.error('Error calling backend API:', error);
    return false;
  }
}
// Fetch email details
// This function fetches detailed information about an email from the Gmail API.
// Referenced in: fetchAndAnalyzeEmails
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


// EVENT LISTENERS

// On extension installation
// This event listener is triggered when the extension is installed. It clears the flagged emails cache and fetches and analyzes emails.
// Referenced in: chrome.runtime.onInstalled
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  chrome.storage.local.remove(['flaggedEmails'], () => {
    console.log('Cleared flagged emails cache');
  });
  fetchAndAnalyzeEmails();
});

// On browser startup
// This event listener is triggered when the browser starts up. It fetches and analyzes emails.
// Referenced in: chrome.runtime.onStartup
chrome.runtime.onStartup.addListener(() => {
  console.log('Browser started up');
  fetchAndAnalyzeEmails();
});

// Periodic alarm to check emails
// This event listener is triggered periodically by an alarm to fetch and analyze emails.
// Referenced in: chrome.alarms.create, chrome.alarms.onAlarm
chrome.alarms.create('checkEmails', { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log('Alarm triggered:', alarm.name);
  if (alarm.name === 'checkEmails') {
    fetchAndAnalyzeEmails(); 
  }
});
