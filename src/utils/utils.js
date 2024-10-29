// utils.js

// Analyze if email contains suspicious words
// This function checks if the email contains any phishing keywords and flags the email if it does.
// Referenced in: analyzeEmailContent
export function SuspiciousWords(email) {
  const phishingKeywords = [
    'urgent', 'password', 'suspicious', 'reset', 'verify', 'account', 'security', 'bank',
    'Request', 'Reconfirm Password', 'Account Alert', 'Confirmation', 'Account Reset', 'Payments', 
    'Reminder', 'Confidential', 'You Recieved', 'Voice Messages', 'Hello', 'Voicemail from', 
    'Immediate Response', 'Voic(e)Message', 'Urgent', 'VM from', 'Action Required', 'Audio Message', 
    'Account Suspended', 'Voice Recording Available', 'Password Reset', 'Received Fax Document', 
    'Sign-in attempt', 'Bill Invoice', 'RE: INVOICE', 'Missing Inv', 'New Message from', 
    'New Scanned Fax Doc-Delivery for', 'New FaxTransmission from', 'Message From', 'You have a New Message', 
    'Telephone Message for', 'Verification Required!', 'Action Required: Expiration Notice on', 
    'Password Expire', 'Attention Required. Support ID:', 'You have a Google Drive File Shared', 
    'sent you some files', 'Sales Project Files and Request for Quote', 'Your Service Request', 
    'Request Notification', 'You have received a new document', 'Document For', 'View Attached Documents', 
    'shared a document with you'
  ];
  
  const emailText = `${email.subject || ''} ${email.snippet || ''} ${email.body || ''}`.toLowerCase();
  const foundKeywords = [];

  // Find all matching keywords
  phishingKeywords.forEach(keyword => {
    if (emailText.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword);
    }
  });

  // Update the email object and return both flag and keywords
  email.isFlagged = foundKeywords.length > 0;
  email.keywords = foundKeywords;  // Store the found keywords

  return {
    isFlagged: foundKeywords.length > 0,
    keywords: foundKeywords
  };
}

// Extract header value by name
// This function extracts the value of a specific header from the email headers.
// Referenced in: Not explicitly referenced in the provided context
export function parseHeader(headers, name) {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : 'Unknown';
}


// Extract URLs from email content
// This function extracts all URLs from the email content using a regular expression.
// Referenced in: EmailModal.vue (testSafeBrowsing, analyzeDomain)
export function extractUrlsFromEmail(emailContent) {
  const urlPattern = /https?:\/\/[^\s]+/g;
  return emailContent.match(urlPattern) || [];
}

// Analyze links in email content for mismatched display text and detect IP-based URLs
// This function analyzes the email body for mismatched links and IP-based URLs, returning any risks found.
// Referenced in: EmailModal.vue (analyzeDomain), analyzeEmailContent, analyzeDomain
export function linkAnalysis(emailBody) {
  const risks = [];
  const anchorTagPattern = /<a\s+(?:[^>]*?\s+)?href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let match;

  while ((match = anchorTagPattern.exec(emailBody)) !== null) {
    const actualUrl = match[1];  // The URL in the href attribute
    const displayText = match[2]; // The text displayed in the link

    // Check if the display text looks like a URL but does not match the actual URL
    if (
      displayText.match(/https?:\/\/|www\./) && 
      !actualUrl.includes(displayText.replace(/https?:\/\//, '').replace('www.', '').split('/')[0])
    ) {
      risks.push(`Mismatched link: display text "${displayText}" does not match URL "${actualUrl}"`);
    }

    // Check for IP-based URLs in the href
    if (/https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(actualUrl)) {
      risks.push(`IP address URL detected: ${actualUrl}`);
    }
  }

  return risks;
}

// Analyze the email and check for any suspicious characteristics
// This function combines various checks (suspicious words, backend analysis, link analysis) to flag the email.
// Referenced in: Not explicitly referenced in the provided context
export async function analyzeEmailContent(email, sendToBackendForAnalysis) {
  const isFlaggedLocally = SuspiciousWords(email);
  const isFlaggedByBackend = await sendToBackendForAnalysis(email.body);
  const linkRisks = linkAnalysis(email.body);
  const isFlaggedByLinks = linkRisks.length > 0;

  // Combine flags from all sources
  const isFlagged = isFlaggedLocally || isFlaggedByBackend || isFlaggedByLinks;
  email.isFlagged = isFlagged;
  email.linkRisks = linkRisks;

    // Log comprehensive analysis
    console.log('Detailed Email Analysis:', {
      subject: email.subject,
      keywordFlag: isFlaggedLocally,
      matchedKeyword: email.keywordMatch,
      backendFlag: isFlaggedByBackend,
      linkRisks: linkRisks,
      overallFlag: email.isFlagged
    });

  return email;
}


// Extract email body from Gmail API response
// This function extracts the email body from the Gmail API response, decoding it from base64.
// Referenced in: fetchEmailDetails function in the service worker (not provided in the context)
export function extractEmailBody(payload) {
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

// Analyze domain
// This function analyzes the email body for suspicious links and alerts the user if any are found.
// Referenced in: EmailModal.vue (analyzeDomain)
export async function analyzeDomain() {
  try {
      const linkRisks = linkAnalysis(this.email.body);  // Directly call linkAnalysis here
      if (linkRisks.length > 0) {
          alert(`Suspicious links detected: ${linkRisks.join(', ')}`);
      } else {
          alert('No suspicious links detected.');
      }
  } catch (error) {
      console.error('Failed to analyze email links:', error);
      alert('An error occurred while analyzing the email links.');
  }
}

// Check if an email ID is already processed
// This function checks if an email ID has already been processed and stored in Chrome's local storage.
// Referenced in: saveEmailToBackend function in the service worker (not provided in the context)
export async function isEmailProcessed(emailId) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['processedEmails'], (result) => {
      const processedEmails = result.processedEmails || [];
      resolve(processedEmails.includes(emailId));
    });
  });
}

// Mark an email ID as processed
// This function marks an email ID as processed by storing it in Chrome's local storage.
// Referenced in: saveEmailToBackend function in the service worker (not provided in the context)
export async function markEmailAsProcessed(emailId) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['processedEmails'], (result) => {
      const processedEmails = result.processedEmails || [];
      if (!processedEmails.includes(emailId)) {
        processedEmails.push(emailId);
      }
      chrome.storage.local.set({ processedEmails }, () => resolve());
    });
  });
}