# Phish-Finder 2.0

## Project Overview

PhishFinder is a Chrome extension built with Vue.js that reads user emails using OAuth. The project is structured to include both the frontend Vue.js application and the backend server.

## Installation and Setup

```
git clone https://github.com/cjordan223/PhishFinder
cd PhishFinder
npm install
npm run build
```

1. **Load the Extension:**
   - Open Chrome's Extensions Manager.
   - Select the **dist** folder after clicking **Load Unpacked**.
   - Pin the extension, click login with google and follow the OAuth steps
  

### Key Files and Directories

 - **public/**: Contains static assets like images and the manifest file for the Chrome extension.
- **server/**: Contains the backend server code. 
  - **server.js**: The main server file. Need to start server for API's to work.
 - **src/**: code for the Vue.js application.
   - **background.js**: The background script (service worker) for the Chrome extension.
   - **router/**: Contains the Vue Router configuration.
  - **utils/**: Contains utility functions for service worker.
  - **views/**: Contains Vue components for different views/pages.
 - **vite.config.js**: Configuration for Vite, the build tool.

4. **Load the extension in Chrome:**
   - Open Chrome's Extensions Manager.
   - Select the **dist** folder after clicking **Load Unpacked**.
   - Pin the extension, click login with Google, and follow the OAuth steps.



3. **Build and Reload:**
   - After making any changes, rebuild
     ```bash
     npm run build
     ```
   - Once the build completes, reload the **dist** folder in the Extensions Manager to see chnages. (idk if this is needed)

