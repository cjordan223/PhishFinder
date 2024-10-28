// utils.js

// Analyze if email contains suspicious words
export function SuspiciousWords(email) {
  const phishingKeywords = ['urgent', 'password', 'suspicious', 'reset', 'verify', 'account', 'security', 'bank'];
  const emailText = `${email.subject || ''} ${email.snippet || ''} ${email.body || ''}`.toLowerCase();

  const isPhishing = phishingKeywords.some(keyword => emailText.includes(keyword));
  email.isFlagged = isPhishing;
  return email.isFlagged;
}

// Extract header value by name
export function parseHeader(headers, name) {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : 'Unknown';
}

// Extract URLs from email content
export function extractUrlsFromEmail(emailContent) {
  const urlPattern = /https?:\/\/[^\s]+/g;
  return emailContent.match(urlPattern) || [];
}

// Analyze links in email content for mismatched display text and detect IP-based URLs
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
export async function analyzeEmailContent(email, sendToBackendForAnalysis) {
  const isFlaggedLocally = SuspiciousWords(email);
  const isFlaggedByBackend = await sendToBackendForAnalysis(email.body);
  const linkRisks = linkAnalysis(email.body);
  const isFlaggedByLinks = linkRisks.length > 0;

  // Combine flags from all sources
  const isFlagged = isFlaggedLocally || isFlaggedByBackend || isFlaggedByLinks;
  email.isFlagged = isFlagged;
  email.linkRisks = linkRisks;

  return email;
}


// Extract email body from Gmail API response for fetchEmailDetails fxn in service worker
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

// analyze domain 
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

// Check if an email ID is already processed for saveEmailToBackend fxn in service worker
export async function isEmailProcessed(emailId) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['processedEmails'], (result) => {
      const processedEmails = result.processedEmails || [];
      resolve(processedEmails.includes(emailId));
    });
  });
}

// Mark an email ID as processed for saveEmailToBackend fxn in service worker
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