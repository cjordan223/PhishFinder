# PhishFinder Application Overview

## Key Files

1. **README.md**
   - Provides an overview of the project, technical implementation, installation, usage, and security features.
   - Relevant lines: 1-104

2. **public/manifest.json**
   - Contains the Chrome extension manifest configuration, including permissions and OAuth setup.
   - Relevant lines: 1-45

3. **src/components/email/EmailDetailPage.vue**
   - Vue component for displaying detailed email information and security analysis.
   - Relevant lines: 1-543

4. **src/utils/utils.js**
   - Utility functions for API interactions and email analysis.
   - Relevant lines: 295-381

5. **src/views/EmailPage.vue**
   - Main Vue component for displaying and managing the list of emails.
   - Relevant lines: 65-210

6. **src/background.js**
   - Background script for handling email processing and communication with the backend.
   - Relevant lines: 1-200

7. **src/components/security/UrlStatus.vue**
   - Vue component for displaying URL security status within emails.
   - Relevant lines: 3-136

8. **src/utils/emailAuth.js**
   - Handles email authentication checks like SPF, DKIM, and DMARC.
   - Relevant lines: 3-49

9. **src/views/browser/CustomMetricsPage.vue**
   - Vue component for displaying user-specific security metrics and analytics.
   - Relevant lines: 44-320

10. **package.json**
    - Contains project dependencies and scripts for building and running the application.
    - Relevant lines: 1-44

## Starting the Application

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/cjordan223/PhishFinder
   cd PhishFinder
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Build the Extension:**
   ```bash
   npm run build
   ```

4. **Load in Chrome:**
   - Open Chrome Extensions (chrome://extensions/)
   - Enable Developer Mode
   - Click "Load unpacked"
   - Select the `dist` folder

5. **Run the Backend:**
   - Ensure the backend services are running to support the extension's functionality.
   - Refer to the backend repository for setup instructions: [PhishFinder-Backend](https://github.com/cjordan223/PhishFinder-Backend/)

6. **Usage:**
   - Click the PhishFinder icon in the Chrome toolbar.
   - Login with your Gmail account.
   - Grant necessary permissions.
   - Access email security analysis and view detailed security metrics.
