# PhishFinder-Frontend

## Project Overview

PhishFinder is a Chrome extension built with Vue.js that reads user emails using OAuth. This is the frontend Vue.js application only.


[Back End Code](https://github.com/cjordan223/PhishFinder-Backend/)

## Technical Implementation

### Frontend Architecture
- Vue.js 3 with Composition API
- Tailwind CSS for styling
- Real-time security status updates
- Responsive design for extension popup

### Security Analysis Pipeline
1. Email Authentication
   - SPF, DKIM, DMARC verification
   - Domain authentication checks
   - SSL/TLS validation

2. Content Analysis
   - Natural language processing
   - Pattern matching
   - Keyword detection
   - URL safety verification

3. Threat Detection
   - Domain spoofing detection
   - Phishing attempt identification
   - Suspicious content flagging
   - URL mismatch detection

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/cjordan223/PhishFinder
   cd PhishFinder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load in Chrome:
   - Open Chrome Extensions (chrome://extensions/)
   - Enable Developer Mode
   - Click "Load unpacked"
   - Select the `dist` folder

## Usage

1. Click the PhishFinder icon in Chrome toolbar
2. Login with Gmail account
3. Grant necessary permissions
4. Access email security analysis
5. View detailed security metrics

## Security Features

### Email Authentication
- Complete SPF, DKIM, and DMARC verification
- Domain authentication status
- SSL/TLS connection validation

### Content Analysis
- AI-powered text analysis
- Suspicious keyword detection
- URL safety verification
- Domain reputation checking

### Threat Detection
- Real-time phishing attempt detection
- Domain spoofing identification
- Suspicious content flagging
- URL mismatch alerts

## Future Enhancements
- Enhanced AI analysis capabilities
- Additional authentication methods
- Expanded metrics dashboard
- Real-time threat intelligence integration
- Advanced behavioral analysis

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## License
This project is licensed under the MIT License.

