// Background script for Chrome Extension

// On extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  
  // Create an alarm to fetch emails periodically (every 5 minutes)
  chrome.alarms.create('checkEmails', { periodInMinutes: 5 });

  // Set an event listener for the alarm
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'checkEmails') {
      fetchAndAnalyzeEmails(); // Trigger email fetching and analysis
    }
  });
});

// Fetch and analyze emails when the alarm is triggered
function fetchAndAnalyzeEmails() {
  chrome.identity.getAuthToken({ interactive: false }, function(token) {
    if (!token) {
      console.error("Failed to retrieve token");
      return;
    }

    console.log('Fetching emails with token:', token);

    // Gmail API call to get the user's inbox messages
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
          console.log(`Fetched ${data.messages.length} emails.`);
          // Fetch each email's details and analyze them
          const emailDetails = await Promise.all(data.messages.map((msg) => fetchEmailDetails(token, msg.id)));
          analyzeEmails(emailDetails);
        } else {
          console.log('No emails found.');
        }
      })
      .catch((error) => {
        console.error('Error fetching emails:', error);
      });
  });
}

// Fetch email details from Gmail API for a specific message ID
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

    // Extract email details such as subject, from, and body
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
  .catch(error => {
    console.error('Error fetching email details:', error);
    return null;
  });
}

// Extract the body from the email payload
function extractEmailBody(payload) {
  let body = '';

  if (payload.parts) {
    const htmlPart = payload.parts.find(part => part.mimeType === 'text/html');
    if (htmlPart && htmlPart.body && htmlPart.body.data) {
      body = atob(htmlPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    }
  } else if (payload.body && payload.body.data) {
    body = atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
  }

  return body || 'No body content available';
}

// Basic phishing detection logic  
function emailIsSuspicious(email) {
  const phishingKeywords = ['urgent', 'password', 'suspicious', 'reset', 'verify'];
  const isPhishing = phishingKeywords.some(keyword => email.subject && email.subject.toLowerCase().includes(keyword));
  
  // Check if the sender's email domain is @gmail.com
  const isGmailSender = email.from && email.from.toLowerCase().includes('@gmail.com');
  
  // Add a flag property to the email object
  email.isFlagged = isPhishing || isGmailSender;
  
  return email.isFlagged;
}

// Helper function to parse a header value from email headers
function parseHeader(headers, name) {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : 'Unknown';
}
