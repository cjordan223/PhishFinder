import { authenticate } from 'mailauth';

export class EmailAuthenticator {
  constructor() {
    this.options = {
      mta: 'phishfinder.extension',
      trustReceived: true,
      minBitLength: 1024,
      disableArc: false,
      disableDmarc: false,
      disableBimi: false
    };
  }

  async authenticateEmail(emailData) {
    try {
      // Convert Gmail API format to RFC822 format
      const message = this.convertToRFC822(emailData);
      
      // Perform authentication
      const authResult = await authenticate(message, {
        ...this.options,
        sender: this.extractSender(emailData),
        ip: this.extractIP(emailData),
        helo: this.extractHelo(emailData)
      });

      return {
        spf: {
          result: authResult.spf?.status?.result || 'neutral',
          details: authResult.spf?.status?.comment || 'No SPF record found'
        },
        dkim: {
          result: authResult.dkim?.status?.result || 'neutral',
          details: authResult.dkim?.status?.comment || 'No DKIM signature found'
        },
        dmarc: {
          result: authResult.dmarc?.status?.result || 'neutral',
          details: authResult.dmarc?.status?.comment || 'No DMARC policy found'
        },
        bimi: authResult.bimi || null,
        arc: authResult.arc || null,
        receivedChain: authResult.receivedChain || []
      };
    } catch (error) {
      console.error('Email authentication error:', error);
      return null;
    }
  }

  convertToRFC822(emailData) {
    const headers = emailData.payload.headers;
    let rfc822 = '';

    // Add headers
    headers.forEach(header => {
      rfc822 += `${header.name}: ${header.value}\r\n`;
    });

    // Add blank line between headers and body
    rfc822 += '\r\n';

    // Add body
    if (emailData.payload.body.data) {
      rfc822 += Buffer.from(emailData.payload.body.data, 'base64').toString();
    } else if (emailData.payload.parts) {
      // Handle multipart messages
      emailData.payload.parts.forEach(part => {
        if (part.body.data) {
          rfc822 += Buffer.from(part.body.data, 'base64').toString();
        }
      });
    }

    return rfc822;
  }

  extractSender(emailData) {
    const from = emailData.payload.headers.find(h => h.name.toLowerCase() === 'from')?.value;
    const match = from?.match(/<([^>]+)>/) || from?.match(/([^\s<>]+@[^\s<>]+)/);
    return match?.[1] || '';
  }

  extractIP(emailData) {
    const received = emailData.payload.headers.find(h => h.name.toLowerCase() === 'received');
    const match = received?.value.match(/\[(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\]/);
    return match?.[1] || '';
  }

  extractHelo(emailData) {
    const received = emailData.payload.headers.find(h => h.name.toLowerCase() === 'received');
    const match = received?.value.match(/helo=([^\s]+)/i);
    return match?.[1] || '';
  }
}