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

    // Try to get content from parts first
    if (payload.parts) {
      const bodyContent = this._getBodyFromParts(payload.parts, 'text/plain');
      if (bodyContent) return bodyContent;
    }

    // If no parts but has body data directly
    if (payload.body?.data) {
      return this._decodeAndFormatBody(payload);
    }

    console.warn('No readable body content found in payload');
    return '';
  },

  getEmailHtmlBody(payload) {
    if (!payload) {
      console.warn('No payload provided');
      return '';
    }

    // Try to get content from parts first
    if (payload.parts) {
      const bodyContent = this._getBodyFromParts(payload.parts, 'text/html');
      if (bodyContent) return bodyContent;
    }

    // If no parts but has body data directly
    if (payload.body?.data) {
      return this._decodeAndFormatBody(payload);
    }

    console.warn('No readable HTML body content found in payload');
    return '';
  },

  _getBodyFromParts(parts, mimeType) {
    const part = parts.find(part => part.mimeType === mimeType);
    if (part) return this._decodeAndFormatBody(part);

    // Check nested parts
    for (const part of parts) {
      if (part.parts) {
        const nestedBody = this._getBodyFromParts(part.parts, mimeType);
        if (nestedBody) return nestedBody;
      }
    }
    return null;
  },

  _decodeAndFormatBody(part) {
    if (!part.body?.data) return '';
    const decoded = this.decodeBase64Url(part.body.data);
    return part.mimeType === 'text/html' ? decoded : this._convertHtmlToText(decoded);
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

  sanitizeEmailBody(body) {
    return purify.sanitize(body, { USE_PROFILES: { html: true } });
  },

  parseSender(from) {
    // Clean up any double wrapping of angle brackets
    from = from.replace(/^<(.+)>$/, '$1');
    
    // Match either "Name <email>" or just "email" format
    const emailMatch = from.match(/<([^>]+)>/) || from.match(/([^\s<>]+@[^\s<>]+)/);
    const email = emailMatch ? emailMatch[1] : from;
    
    // Get display name: everything before the email, or email username if no display name
    let displayName = from.split('<')[0].trim();
    if (!displayName || displayName === email) {
        displayName = email.split('@')[0]; // fallback to email username
    }
    
    // Clean any remaining angle brackets from display name
    displayName = displayName.replace(/[<>]/g, '').trim();
    
    const domain = email.split('@')[1] || '';

    return {
        address: email.trim(),
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
    },

    async saveAnalyzedEmail(emailId, analyzedEmail) {
      return new Promise((resolve) => {
          chrome.storage.local.get(['analyzedEmails'], (result) => {
              const analyzedEmails = result.analyzedEmails || {};
              analyzedEmails[emailId] = analyzedEmail;
              chrome.storage.local.set({ analyzedEmails }, () => {
                  console.log(`Saved analyzed email for ID ${emailId}:`, analyzedEmail);
                  resolve();
              });
          });
      });
  },

  async getAnalyzedEmail(emailId) {
      return new Promise((resolve) => {
          chrome.storage.local.get(['analyzedEmails'], (result) => {
              const analyzedEmails = result.analyzedEmails || {};
              const email = analyzedEmails[emailId] || null;
              console.log(`Retrieved analyzed email for ID ${emailId}:`, email);
              resolve(email);
          });
      });
  }
};

// Analysis Helpers
export const analysisHelpers = {
  analyzeEmail(email) {
    // Example analysis function
    return {
      security: 'safe',
      analysis: 'No issues found'
    };
  }
};

// API Helpers
export const apiHelpers = {
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
  },

  async refreshAuthToken() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        chrome.identity.removeCachedAuthToken({ token }, () => {
          chrome.identity.getAuthToken({ interactive: true }, (newToken) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
              return;
            }
            if (!newToken) {
              reject(new Error('Failed to refresh auth token'));
              return;
            }
            resolve(newToken);
          });
        });
      });
    });
  },

  // created to resolve object passing issues. endpoint to return security data within the vue component. modifed version of main analysis without persistence
  async getEmailAnalysis(emailId, emailData) {
    try {
      console.log('🔍 Vue Component: Requesting analysis for email:', emailId);
      
      const response = await fetch(`http://localhost:8080/analysis/analyze-only/${emailId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        console.error('❌ Vue Component: Analysis request failed:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Vue Component: Analysis result:', {
        emailId,
        security: result.security,
        flags: result.security?.analysis?.flags
      });
      
      return result;
    } catch (error) {
      console.error('❌ Vue Component: Analysis error:', error);
      return null;
    }
  }
};