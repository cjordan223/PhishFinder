// utils.js

// Analyze if email contains suspicious words
export function SuspiciousWords(email) {
  const phishingKeywords = ['urgent', 'password', 'suspicious', 'reset', 'verify'];

  const isPhishingInSubject = phishingKeywords.some(keyword => email.subject?.toLowerCase().includes(keyword));
  const isPhishingInSnippet = phishingKeywords.some(keyword => email.snippet?.toLowerCase().includes(keyword));
  const isPhishingInBody = phishingKeywords.some(keyword => email.body?.toLowerCase().includes(keyword));

  const isPhishing = isPhishingInSubject || isPhishingInSnippet || isPhishingInBody;
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


export function linkAnalysis(emailBody) {
  const risks = [];
  const anchorTagPattern = /<a\s+(?:[^>]*?\s+)?href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let match;

  while ((match = anchorTagPattern.exec(emailBody)) !== null) {
    const actualUrl = match[1];  // The URL in the href attribute
    const displayText = match[2]; // The text displayed in the link
    console.log(actualUrl);
    console.log(displayText);


    
    // If the display text looks like a URL but doesn't match the actual URL
    //THIS WORK BUT....it is simple and needs more refinement. google.com linking to https://msn.com will not get caught, only https:// links

    if (displayText.match(/https?:\/\/|www\./) && !displayText.includes(actualUrl)) {
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

  const isFlagged = isFlaggedLocally || isFlaggedByBackend || isFlaggedByLinks;
  email.isFlagged = isFlagged;
  email.linkRisks = linkRisks;

  return email;
}

