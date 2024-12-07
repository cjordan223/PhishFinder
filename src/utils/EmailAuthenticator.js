import { authenticate } from 'mailauth';

export class EmailAuthenticator {
  constructor() {
    this.options = {
      mta: 'phishfinder.extension',
      trustReceived: true,
      minBitLength: 1024
    };
  }

  async authenticateEmail(emailData) {
    try {
      const message = this.convertToRFC822(emailData);
      console.log('Raw email message:', message); // Debug log
      
      const authResult = await authenticate(message, {
        ...this.options,
        sender: this.extractSender(emailData),
        ip: this.extractIP(emailData),
        helo: this.extractHelo(emailData)
      });

      console.log('Authentication result:', authResult); // Debug log

      return {
        spf: {
          result: this.normalizeResult(authResult.spf?.status?.result),
          details: this.getSpfDetails(authResult.spf)
        },
        dkim: {
          result: this.normalizeResult(authResult.dkim?.status?.result),
          details: this.getDkimDetails(authResult.dkim)
        },
        dmarc: {
          result: this.normalizeResult(authResult.dmarc?.status?.result),
          details: this.getDmarcDetails(authResult.dmarc)
        }
      };
    } catch (error) {
      console.error('Email authentication error:', error);
      return {
        spf: { result: 'neutral', details: 'Authentication error' },
        dkim: { result: 'neutral', details: 'Authentication error' },
        dmarc: { result: 'neutral', details: 'Authentication error' }
      };
    }
  }

  normalizeResult(result) {
    if (!result) return 'neutral';
    result = result.toLowerCase();
    return ['pass', 'fail', 'neutral'].includes(result) ? result : 'neutral';
  }

  getSpfDetails(spf) {
    if (!spf?.status) return 'No SPF record';
    return spf.status.comment || 'SPF check completed';
  }

  getDkimDetails(dkim) {
    if (!dkim?.status) return 'No DKIM signature';
    return dkim.status.comment || 'DKIM check completed';
  }

  getDmarcDetails(dmarc) {
    if (!dmarc?.status) return 'No DMARC policy';
    return dmarc.status.comment || 'DMARC check completed';
  }

  convertToRFC822(emailData) {
    let rfc822 = '';
    
    // Add headers
    const headers = emailData.payload.headers || [];
    headers.forEach(header => {
      rfc822 += `${header.name}: ${header.value}\r\n`;
    });
    
    // Add blank line between headers and body
    rfc822 += '\r\n';
    
    // Add body
    if (emailData.payload.body?.data) {
      rfc822 += Buffer.from(emailData.payload.body.data, 'base64').toString();
    } else if (emailData.payload.parts) {
      emailData.payload.parts.forEach(part => {
        if (part.body?.data) {
          rfc822 += Buffer.from(part.body.data, 'base64').toString();
        }
      });
    }
    
    return rfc822;
  }

  extractSender(emailData) {
    const from = emailData.payload.headers.find(h => h.name.toLowerCase() === 'from')?.value;
    if (!from) return '';
    
    // Try to extract email from "Name <email>" format
    const match = from.match(/<([^>]+)>/) || from.match(/([^\s<>]+@[^\s<>]+)/);
    return match?.[1] || from;
  }

  extractIP(emailData) {
    const received = emailData.payload.headers.find(h => h.name.toLowerCase() === 'received')?.value;
    if (!received) return '';
    
    const match = received.match(/\[(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\]/);
    return match?.[1] || '';
  }

  extractHelo(emailData) {
    const received = emailData.payload.headers.find(h => h.name.toLowerCase() === 'received')?.value;
    if (!received) return '';
    
    const match = received.match(/helo=([^\s]+)/i);
    return match?.[1] || '';
  }
}