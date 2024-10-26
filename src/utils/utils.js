// utils.js
// This is where we build the logic for the filtering utility, we can add suspicious domains from GH, filter by contacts vs. AI etc.



// Check if email is suspicious based on keywords in subject, snippet, and body
export function SuspiciousWords(email) {
  const phishingKeywords = ['urgent', 'password', 'suspicious', 'reset', 'verify'];

  // Check subject for phishing keywords
  const isPhishingInSubject = phishingKeywords.some(keyword => {
    const keywordFound = email.subject?.toLowerCase().includes(keyword);
    // console.log(`Checking keyword '${keyword}' in subject '${email.subject}':`, keywordFound);
    return keywordFound;
  });

  // Check snippet for phishing keywords
  const isPhishingInSnippet = phishingKeywords.some(keyword => {
    const keywordFound = email.snippet?.toLowerCase().includes(keyword);
    // console.log(`Checking keyword '${keyword}' in snippet '${email.snippet}':`, keywordFound);
    return keywordFound;
  });

  // Check body for phishing keywords
  const isPhishingInBody = phishingKeywords.some(keyword => {
    const keywordFound = email.body?.toLowerCase().includes(keyword);
    // console.log(`Checking keyword '${keyword}' in body:`, keywordFound);
    return keywordFound;
  });

  // If phishing is found in any part (subject, snippet, or body), flag the email
  const isPhishing = isPhishingInSubject || isPhishingInSnippet || isPhishingInBody;
 // console.log('Final phishing evaluation for email:', email.subject, 'isPhishing:', isPhishing);

  // Add a flag property to the email object
  email.isFlagged = isPhishing;

  return email.isFlagged;
}


export function parseHeader(headers, name) {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : 'Unknown';
}
