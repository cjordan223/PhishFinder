import { emailHelpers } from './utils';

export const createEmailObject = (rawEmail) => {
  if (!rawEmail || !rawEmail.payload) {
    console.error('Invalid raw email data:', rawEmail);
    return null;
  }

  const headers = rawEmail.payload.headers || [];
  
  // Extract email information
  const metadata = {
    subject: headers.find(h => h.name.toLowerCase() === 'subject')?.value || 'No Subject',
    date: headers.find(h => h.name.toLowerCase() === 'date')?.value,
    snippet: rawEmail.snippet || 'No Snippet',
    labels: rawEmail.labelIds || [],
  };

  const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
  const senderInfo = emailHelpers.parseSender(from);

  const body = emailHelpers.getEmailBody(rawEmail.payload);
  const htmlBody = emailHelpers.getEmailHtmlBody(rawEmail.payload); // Get HTML body

  const emailObject = {
    id: rawEmail.id,
    metadata,
    sender: senderInfo,
    content: {
      body,
      htmlBody, // Include HTML body
      sanitizedBody: emailHelpers.sanitizeEmailBody(body),
      urls: emailHelpers.extractUrlsFromEmail(body),
      rawPayload: rawEmail.payload
    },
    raw: rawEmail
  };

  return emailObject;
};