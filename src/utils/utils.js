import DOMPurify from 'dompurify';

// Initialize DOMPurify with the extension's window object if available
const purify = typeof window !== 'undefined' ? DOMPurify(window) : {
  sanitize: (html) => html // Fallback for non-browser environments
};

// Email Processing Helpers
export const emailHelpers = {
  decodeBase64Url(data) {
    data = data.replace(/-/g, '+').replace(/_/g, '/');
    while (data.length % 4) data += '=';
    try {
      return decodeURIComponent(escape(atob(data)));
    } catch (e) {
      console.error('Failed to decode base64url data', e);
      return '';
    }
  },
  formatDate(date) {
    if (!date) return 'Unknown Date';
    const options = {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    };
    return new Date(date).toLocaleDateString(undefined, options);
  },

  getEmailBody(payload) {
    if (!payload) {
        console.warn('No payload provided');
        return '';
    }

    // Log the payload structure for debugging
    this._logPayloadStructure(payload);

    // Try to get content from parts first
    if (payload.parts) {
        const bodyContent = this._getBodyFromParts(payload.parts);
        if (bodyContent) return bodyContent;
    }

    // If no parts but has body data directly
    if (payload.body?.data) {
        return this._decodeAndFormatBody(payload);
    }

    console.warn('No readable body content found in payload');
    return '';
  },

  _getBodyFromParts(parts) {
    // Try plain text first
    const textPart = parts.find(part => part.mimeType === 'text/plain');
    if (textPart) return this._decodeAndFormatBody(textPart);

    // Then try HTML
    const htmlPart = parts.find(part => part.mimeType === 'text/html');
    if (htmlPart) return this._decodeAndFormatBody(htmlPart);

    // Check nested parts
    for (const part of parts) {
        if (part.parts) {
            const nestedBody = this.getEmailBody(part);
            if (nestedBody) return nestedBody;
        }
    }
    return null;
  },

  _decodeAndFormatBody(part) {
    if (!part.body?.data) return '';
    const decoded = this.decodeBase64Url(part.body.data);
    return part.mimeType === 'text/html' ? this._convertHtmlToText(decoded) : decoded;
  },

  _convertHtmlToText(html) {
    return html
        .replace(/<[^>]+>/g, '\n')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n\s*\n/g, '\n')
        .trim();
  },

  _logPayloadStructure(payload) {
    console.log('Processing email payload:', {
        mimeType: payload.mimeType,
        hasBody: !!payload.body,
        hasParts: !!payload.parts,
        partsLength: payload.parts?.length
    });
  },

  sanitizeEmailBody(body) {
    return purify.sanitize(body, { USE_PROFILES: { html: true } });
  },

  parseSender(from) {
    const emailMatch = from.match(/<(.+?)>/);
    const email = emailMatch ? emailMatch[1] : from;
    const displayName = emailMatch ? from.split('<')[0].trim() : '';
    const domain = email.split('@')[1] || '';

    return {
      address: email,
      displayName,
      domain
    };
  },

  extractUrlsFromEmail(body) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return body.match(urlRegex) || [];
  },

  async fetchEmailDetails(token, messageId) {
    try {
      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (!response.ok) {
        throw new Error(`Failed to fetch email details: ${response.status}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error(`Error fetching email ${messageId}:`, error);
      return null;
    }
  },

  async fetchEmailBatch(token, pageToken = null) {
    try {
      const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
      url.searchParams.append('maxResults', '20');
      if (pageToken) {
        url.searchParams.append('pageToken', pageToken);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch emails: ${response.status}`);
      }

      const data = await response.json();
      
      // Fetch details for each email
      const emailPromises = data.messages.map(msg => 
        this.fetchEmailDetails(token, msg.id)
      );
      
      const emails = await Promise.all(emailPromises);
      const validEmails = emails.filter(email => email != null);

      return {
        emails: validEmails,
        nextPageToken: data.nextPageToken || null
      };
    } catch (error) {
      console.error('Error fetching email batch:', error);
      throw error;
    }
  },

  // Add this helper method to store both HTML and plain text versions
  getEmailContent(payload) {
    const content = {
        text: '',
        html: '',
        sanitizedHtml: ''
    };

    if (payload.parts) {
        const textPart = payload.parts.find(part => part.mimeType === 'text/plain');
        const htmlPart = payload.parts.find(part => part.mimeType === 'text/html');

        if (textPart) {
            content.text = this.decodeBase64Url(textPart.body.data);
        }
        if (htmlPart) {
            content.html = this.decodeBase64Url(htmlPart.body.data);
            content.sanitizedHtml = this.sanitizeEmailBody(content.html);
        }
    }

    return content;
  }
};

// Storage Helpers
export const storageHelpers = {
  async isEmailProcessed(emailId) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['processedEmails'], (result) => {
        const processedEmails = result.processedEmails || [];
        resolve(processedEmails.includes(emailId));
      });
    });
  },

  async markEmailAsProcessed(emailId) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['processedEmails'], (result) => {
        const processedEmails = result.processedEmails || [];
        if (!processedEmails.includes(emailId)) {
          processedEmails.push(emailId);
        }
        chrome.storage.local.set({ processedEmails }, resolve);
      });
    });
  }
};

// Analysis Helpers
export const analysisHelpers = {
  async analyzeEmailSecurity(emailObject) {
    if (!emailObject?.content?.body) {
      console.warn('Email body is undefined or missing:', emailObject);
      return {
        isFlagged: false,
        suspiciousKeywords: [],
        linkRisks: [],
        safeBrowsingResult: null
      };
    }

    const keywordResults = await this.analyzeKeywords(emailObject.content.body);
    const linkResults = await this.analyzeDomainSafety(emailObject.content.urls || []);

    return {
      isFlagged: keywordResults.isFlagged || linkResults.some(link => link.isSuspicious),
      suspiciousKeywords: keywordResults.keywords || [],
      linkRisks: linkResults,
      safeBrowsingResult: null
    };
  },

  async analyzeKeywords(text) {
    // Implement keyword analysis logic
    return { isFlagged: false, keywords: [] };
  },

  async analyzeDomainSafety(urls) {
    // Implement URL safety analysis logic
    return [];
  }
};

// API Helpers
export const apiHelpers = {
  async fetchDNSRecords(domain) {
    try {
      const cleanedDomain = domain
        .trim()
        .replace(/[<>]/g, '')
        .replace(/\s+/g, '')
        .replace(/[^\w.-]/g, '')
        .toLowerCase();

      if (!cleanedDomain?.includes('.')) {
        console.warn('Invalid domain format:', domain);
        return {
          spf: null,
          dkim: null,
          dmarc: null,
          summary: 'Invalid domain format'
        };
      }

      const response = await fetch(`http://localhost:8080/dns/dns-records/${cleanedDomain}`);
      if (!response.ok) throw new Error(`DNS lookup failed: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('DNS lookup error:', error);
      return {
        spf: null,
        dkim: null,
        dmarc: null,
        summary: 'Error fetching authentication details'
      };
    }
  },

  async getAuthToken() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        if (!token) {
          reject(new Error('Failed to get auth token'));
          return;
        }
        resolve(token);
      });
    });
  }
};