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
