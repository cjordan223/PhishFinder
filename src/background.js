import { emailIsSuspicious, parseHeader } from './utils/utils.js';
// On extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  // Fetch and analyze emails immediately after installation
  chrome.storage.local.remove(['flaggedEmails'], () => {
    console.log('Cleared flagged emails cache');
  });
  
  fetchAndAnalyzeEmails();
  // Create an alarm to fetch emails periodically (every 5 minutes)
  chrome.alarms.create('checkEmails', { periodInMinutes: 5 });
  // Set an event listener for the alarm
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'checkEmails') {
      fetchAndAnalyzeEmails(); // Trigger email fetching and analysis
    }
  });


});
// Fetch and analyze emails when triggered
function fetchAndAnalyzeEmails() {
  chrome.identity.getAuthToken({ interactive: false }, function(token) {
    if (!token) {
      console.error("Failed to retrieve token");
      return;
    }

    const url = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=10';
    
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(response => response.json())
    .then(async (data) => {
      if (data.error) {
        console.error('Error fetching email list:', data.error);
        return;
      }

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
function analyzeEmails(emails) {
  const flaggedEmails = [];

  emails.forEach(email => {
    if (email) {
      email.isFlagged = emailIsSuspicious(email); // Flag suspicious emails
      if (email.isFlagged) {
        console.log("Suspicious email detected:", email);
        flaggedEmails.push(email); // Add flagged email to the list
      }
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
