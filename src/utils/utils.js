// utils.js

// Check if email is suspicious based on keywords and domain
export function emailIsSuspicious(email) {
    const phishingKeywords = ['urgent', 'password', 'suspicious', 'reset', 'verify'];
    const isPhishing = phishingKeywords.some(keyword => email.subject?.toLowerCase().includes(keyword));
    
    // Check if the sender's email domain is @gmail.com
    // const isGmailSender = email.from?.toLowerCase().includes('@gmail.com');
    
    // Add a flag property to the email object
    email.isFlagged = isPhishing;
    
    return email.isFlagged;
  }
  
  // Parse a header from email headers
  export function parseHeader(headers, name) {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : 'Unknown';
  }
  