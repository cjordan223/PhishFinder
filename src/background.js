import { emailHelpers, apiHelpers } from './utils/utils';
import { createEmailObject } from './utils/emailStructure';

class EmailProcessor {
  constructor() {
    this.emailQueue = [];
    this.isProcessing = false;
    this.maxEmails = 200;
    this.emailsPerBatch = 20;
    this.nextPageToken = null;
  }

  async initialize() {
    chrome.runtime.onInstalled.addListener(() => this.onInstalled());
    chrome.runtime.onStartup.addListener(() => this.startEmailProcessing());
    chrome.alarms.create('processEmails', { periodInMinutes: 5 });
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'processEmails') this.startEmailProcessing();
    });
    chrome.runtime.onMessage.addListener(this.handleMessages.bind(this));
  }

  async onInstalled() {
    console.log('Extension installed');
    this.startEmailProcessing();
  }

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
          token = await apiHelpers.refreshAuthToken();
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.messages) break;

        this.emailQueue.push(...data.messages);
        
        totalFetched += data.messages.length;
        this.nextPageToken = data.nextPageToken;
        if (!this.nextPageToken) break;
      }
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }

  async processEmailQueue() {
    while (this.emailQueue.length > 0) {
      const batch = this.emailQueue.splice(0, this.emailsPerBatch);
      await Promise.all(batch.map(msg => this.processEmail(msg.id)));
    }
  }

  async processEmail(messageId) {
    const token = await apiHelpers.getAuthToken();
    if (!token) return;

    try {
      const emailData = await emailHelpers.fetchEmailDetails(token, messageId);
      if (!emailData) return;

      const basicEmailObject = createEmailObject(emailData);
      await this.sendToBackendForAnalysis(basicEmailObject);
    } catch (error) {
      console.error(`Error processing email ${messageId}:`, error);
    }
  }

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
    } catch (error) {
      console.error('Error in backend analysis:', error);
      throw error;
    }
  }

  buildGmailApiUrl() {
    const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
    url.searchParams.append('maxResults', this.emailsPerBatch.toString());
    url.searchParams.append('labelIds', 'INBOX');
    if (this.nextPageToken) {
      url.searchParams.append('pageToken', this.nextPageToken);
    }
    return url.toString();
  }

  async handleMessages(request, sender, sendResponse) {
    try {
      if (request.action === 'performWhoisLookup') {
        const response = await this.handleWhoisLookup(request);
        sendResponse(response);
        return true;
      }
    } catch (error) {
      console.error('Error in handleMessages:', error);
      sendResponse({ error: error.message });
      return true;
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
}

const emailProcessor = new EmailProcessor();
emailProcessor.initialize();