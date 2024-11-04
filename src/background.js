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
  
      // Analyze email security
      const securityAnalysis = await analysisHelpers.analyzeEmailSecurity(basicEmailObject);
      console.log('Security analysis:', securityAnalysis);
  
      // Merge security analysis with the basic email object
      const emailWithSecurity = {
        ...basicEmailObject,
        security: securityAnalysis
      };
  
      // Log the final object being sent to the backend
      console.log('Sending email with security to backend:', {
        ...emailWithSecurity,
        headers: emailWithSecurity.raw.payload.headers,
        parts: emailWithSecurity.raw.payload.parts,
        labels: emailWithSecurity.metadata.labels
      });
  
      // Send to backend for further analysis
      const analyzedEmail = await this.sendToBackendForAnalysis(emailWithSecurity);
      console.log('Received analyzed email from backend:', analyzedEmail);
  
      // Save the analyzed email
      await storageHelpers.markEmailAsProcessed(messageId);
  
      return analyzedEmail;
    } catch (error) {
      console.error(`Error processing email ${messageId}:`, error);
    }
  }

  // Send email object to backend for analysis
  async sendToBackendForAnalysis(emailObject) {
    try {
      const response = await fetch('http://localhost:8080/analysis/analyze-email', {
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
          timestamp: emailObject.metadata.date,
          rawPayload: emailObject.content.rawPayload,
          security: emailObject.security, // Ensure security data is included
          headers: emailObject.raw.payload.headers, // Include headers
          parts: emailObject.raw.payload.parts, // Include parts
          labels: emailObject.metadata.labels, // Include labels
          historyId: emailObject.raw.historyId, // Include historyId
          internalDate: emailObject.raw.internalDate, // Include internalDate
          sizeEstimate: emailObject.raw.sizeEstimate // Include sizeEstimate
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
    if (request.action === 'fetchEmailDetails') {
      this.handleFetchEmailDetails(request, sendResponse);
      return true;
    }
    if (request.action === 'performWhoisLookup') {
      this.handleWhoisLookup(request, sendResponse);
      return true;
    }
  }

  // Handle fetch email details request
  async handleFetchEmailDetails(request, sendResponse) {
    try {
      const token = await apiHelpers.getAuthToken();
      if (!token) {
        sendResponse({ error: 'Failed to retrieve token' });
        return;
      }

      const emailDetails = await emailHelpers.fetchEmailDetails(token, request.messageId);
      sendResponse(emailDetails);
    } catch (error) {
      console.error('Error handling fetch email details:', error);
      sendResponse({ error: error.message });
    }
  }

  async handleWhoisLookup(request, sendResponse) {
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
      sendResponse({ success: true, data });
    } catch (error) {
      console.error('WHOIS lookup error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
}

// Initialize the email processor
const emailProcessor = new EmailProcessor();
emailProcessor.initialize();