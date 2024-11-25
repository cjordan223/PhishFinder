import { emailHelpers, storageHelpers, analysisHelpers, apiHelpers } from './utils/utils';
import { createEmailObject } from './utils/emailStructure';

class EmailProcessor {
  constructor() {
    this.emailQueue = [];
    this.isProcessing = false;
    this.maxEmails = 200;
    this.emailsPerBatch = 20;
    this.nextPageToken = null;
  }

  // Initialize the email processor and set up event listeners
  async initialize() {
    chrome.runtime.onInstalled.addListener(() => this.onInstalled());
    chrome.runtime.onStartup.addListener(() => this.startEmailProcessing());
    chrome.alarms.create('processEmails', { periodInMinutes: 5 });
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'processEmails') this.startEmailProcessing();
    });
    chrome.runtime.onMessage.addListener(this.handleMessages.bind(this));
  }

  // Handle extension installation
  async onInstalled() {
    console.log('Extension installed');
    await chrome.storage.local.clear();
    this.startEmailProcessing();
  }

  // Start processing emails
  async startEmailProcessing() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const token = await apiHelpers.getAuthToken();
      await this.fetchEmails(token);
      await this.processEmailQueue();
    } catch (error) {
      console.error('Error in email processing:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Fetch emails from Gmail API
  async fetchEmails(token) {
    try {
      let totalFetched = 0;
      while (totalFetched < this.maxEmails) {
        const url = this.buildGmailApiUrl();
        const response = await fetch(url, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          mode: 'cors'
        });

        if (response.status === 401) {
          // Token expired, refresh it
          console.log('Token expired, refreshing...'); // Debug log
          token = await apiHelpers.refreshAuthToken();
          console.log('New token obtained:', token); // Debug log
          continue; // Retry with the new token
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.messages) break;

        for (const msg of data.messages) {
          if (!(await storageHelpers.isEmailProcessed(msg.id))) {
            this.emailQueue.push(msg);
          }
        }

        totalFetched += data.messages.length;
        this.nextPageToken = data.nextPageToken;
        if (!this.nextPageToken) break;
      }
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }

  // Process the email queue in batches
  async processEmailQueue() {
    while (this.emailQueue.length > 0) {
      const batch = this.emailQueue.splice(0, this.emailsPerBatch);
      await Promise.all(batch.map(msg => this.processEmail(msg.id)));
    }
  }

  // Process a single email
  async processEmail(messageId) {
    const token = await apiHelpers.getAuthToken();
    if (!token) return;

    try {
      // Fetch email data from Gmail
      const emailData = await emailHelpers.fetchEmailDetails(token, messageId);
      console.log('Fetched email data:', emailData);
      if (!emailData) return;

      // Create basic email object
      const basicEmailObject = createEmailObject(emailData);
      console.log('Created basic email object:', basicEmailObject);

      // Send to backend for analysis
      const analyzedEmail = await this.sendToBackendForAnalysis(basicEmailObject);
      console.log('Received analyzed email from backend:', analyzedEmail);

      // Save the analyzed email
      await storageHelpers.saveAnalyzedEmail(messageId, analyzedEmail);       
      await storageHelpers.markEmailAsProcessed(messageId);

      return analyzedEmail;
    } catch (error) {
      console.error(`Error processing email ${messageId}:`, error);
    }
  }

  // Send email object to backend for analysis
  async sendToBackendForAnalysis(emailObject) {
    try {
      const response = await fetch('http://localhost:8080/analysis/saveEmailAnalysis', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          id: emailObject.id,
          sender: emailObject.sender,
          subject: emailObject.metadata.subject,
          body: emailObject.content.body,
          htmlBody: emailObject.content.htmlBody,
          timestamp: emailObject.metadata.date,
          rawPayload: emailObject.content.rawPayload,
          headers: emailObject.raw.payload.headers,
          parts: emailObject.raw.payload.parts,
          labels: emailObject.metadata.labels,
          historyId: emailObject.raw.historyId,
          internalDate: emailObject.raw.internalDate,
          sizeEstimate: emailObject.raw.sizeEstimate
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const analyzedEmail = await response.json();
      return {
        ...emailObject,
        security: analyzedEmail.security,
        analysis: analyzedEmail.analysis
      };
    } catch (error) {
      console.error('Error in backend analysis:', error);
      throw error;
    }
  }

  // Save analyzed email object to backend
  async saveToBackend(emailObject) {
    try {
      const response = await fetch('http://localhost:8080/analysis/saveEmailAnalysis', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(emailObject)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error('Failed to save email analysis');
      }
    } catch (error) {
      console.error('Error saving to backend:', error);
    }
  }

  // Build Gmail API URL for fetching emails
  buildGmailApiUrl() {
    const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
    url.searchParams.append('maxResults', this.emailsPerBatch.toString());
    url.searchParams.append('labelIds', 'INBOX');
    if (this.nextPageToken) {
      url.searchParams.append('pageToken', this.nextPageToken);
    }
    return url.toString();
  }

  // Handle incoming messages from the frontend
  async handleMessages(request, sender, sendResponse) {
    try {
        if (request.action === 'fetchEmailDetails') {
            const response = await this.handleFetchEmailDetails(request);
            sendResponse(response);
            return true; // Keep the message channel open
        }
        if (request.action === 'performWhoisLookup') {
            const response = await this.handleWhoisLookup(request);
            sendResponse(response);
            return true; // Keep the message channel open
        }
        if (request.action === 'analyzeEmail') {
            const response = await this.sendToBackendForAnalysis(request.email);
            sendResponse(response);
            return true; // Keep the message channel open
        }
    } catch (error) {
        console.error('Error in handleMessages:', error);
        sendResponse({ error: error.message });
        return true; // Keep the message channel open even on error
    }
  }

  // Handle fetch email details request
  async handleFetchEmailDetails(request) {
    try {
        const storedEmail = await storageHelpers.getAnalyzedEmail(request.messageId);
        if (storedEmail) {
            return this.normalizeEmailData(storedEmail);
        }

        const token = await apiHelpers.getAuthToken();
        if (!token) {
            return { error: 'Failed to retrieve token' };
        }

        const emailDetails = await emailHelpers.fetchEmailDetails(token, request.messageId);
        const analyzedEmail = await this.sendToBackendForAnalysis(emailDetails);
        
        await storageHelpers.saveAnalyzedEmail(request.messageId, analyzedEmail);
        await storageHelpers.markEmailAsProcessed(request.messageId);

        return analyzedEmail;
    } catch (error) {
        console.error('Error handling fetch email details:', error);
        return { error: error.message };
    }
  }

  async handleWhoisLookup(request) {
    try {
      const response = await fetch(`http://localhost:8080/whois/${request.domain}/${request.emailId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          domain: request.domain,
          emailId: request.emailId,
          forceCheck: true
        })
      });

      if (!response.ok) {
        throw new Error(`WHOIS lookup failed: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('WHOIS lookup error:', error);
      return { success: false, error: error.message };
    }
  }
  normalizeEmailData(emailData) {
    if (!emailData) return null;

 
    
    const security = emailData.security ? {
        authentication: {
            spf: emailData.security.authentication?.spf || 'N/A',
            dkim: emailData.security.authentication?.dkim || 'N/A',
            dmarc: emailData.security.authentication?.dmarc || 'N/A'
        },
        analysis: emailData.security.analysis || {},
        flags: emailData.security.flags || {}
    } : null;

 
    const normalized = {
        ...emailData,
        security
    };

     return normalized;
}
}

// Initialize the email processor
const emailProcessor = new EmailProcessor();
emailProcessor.initialize();