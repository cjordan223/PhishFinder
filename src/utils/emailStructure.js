import { emailHelpers } from './utils';

export const createEmailObject = (rawEmail) => {
  console.log('Processing raw email:', rawEmail.id);
  
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

  // Get body content with detailed logging
  console.log('Extracting body from payload:', {
    mimeType: rawEmail.payload.mimeType,
    hasBody: !!rawEmail.payload.body,
    hasParts: !!rawEmail.payload.parts,
    partsCount: rawEmail.payload.parts?.length
  });

  const body = emailHelpers.getEmailBody(rawEmail.payload);
  
  // Log the extracted content
  console.log('Body extraction results:', {
    bodyLength: body?.length,
    bodyPreview: body?.substring(0, 100),
    hasContent: !!body
  });

  const emailObject = {
    id: rawEmail.id,
    metadata,
    sender: senderInfo,
    content: {
      body,
      sanitizedBody: emailHelpers.sanitizeEmailBody(body),
      urls: emailHelpers.extractUrlsFromEmail(body),
      rawPayload: rawEmail.payload
    },
    raw: rawEmail
  };

  return emailObject;
};