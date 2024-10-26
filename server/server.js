import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3001;
const SAFE_BROWSING_API_KEY = process.env.SAFE_BROWSING_API_KEY;
const SAFE_BROWSING_URL = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${SAFE_BROWSING_API_KEY}`;

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3001',
  'chrome-extension://ogajmmpomfocfpjhalbfjhjeikidgkef',
];

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type,Authorization',
};

app.use(cors(corsOptions)); // Apply the CORS middleware
app.use(express.json());

// Enhanced URL extraction from HTML content
function extractUrlsFromHtml(htmlContent) {
  // First try to extract URLs from href attributes
  const hrefRegex = /href=["'](https?:\/\/[^"']+)["']/g;
  const hrefMatches = [...htmlContent.matchAll(hrefRegex)].map(match => match[1]);
  
  // Then try to extract URLs from anchor text
  const anchorRegex = />https?:\/\/[^<\s]+</g;
  const anchorMatches = [...htmlContent.matchAll(anchorRegex)]
    .map(match => match[0].slice(1, -1)); // Remove > and <
  
  // Combine and clean up URLs
  const allUrls = [...new Set([...hrefMatches, ...anchorMatches])]
    .map(url => {
      // Clean up the URL
      return url
        .trim()
        .replace(/['"<>]/g, '') // Remove quotes and angle brackets
        .split(/[|\s]/)[0] // Take only the first part if URL contains spaces or pipes
        .replace(/&amp;/g, '&') // Replace HTML entities
        .replace(/\/$/, ''); // Remove trailing slash
    })
    .filter(url => {
      // Validate URL format
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });

  console.log('Extracted URLs from HTML:', allUrls);
  return allUrls;
}

// Extract URLs from plain text
function extractUrlsFromText(text) {
  const urlRegex = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/g;
  const matches = text.match(urlRegex) || [];
  
  const cleanedUrls = matches
    .map(url => {
      return url
        .trim()
        .replace(/['"]/g, '') // Remove quotes
        .split(/[|\s]/)[0] // Take only the first part if URL contains spaces or pipes
        .replace(/&amp;/g, '&') // Replace HTML entities
        .replace(/\/$/, ''); // Remove trailing slash
    })
    .filter(url => {
      // Validate URL format
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });

  console.log('Extracted URLs from text:', cleanedUrls);
  return cleanedUrls;
}

// Safe Browsing API URL check with deduplication
async function checkUrlsWithSafeBrowsing(urls) {
  if (!urls || urls.length === 0) return [];

  // Remove duplicate URLs
  const uniqueUrls = [...new Set(urls)];

  const requestBody = {
    client: {
      clientId: "phishfinder-extension",
      clientVersion: "1.0",
    },
    threatInfo: {
      threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: uniqueUrls.map(url => ({ url })),
    },
  };

  try {
    const response = await fetch(SAFE_BROWSING_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("Safe Browsing API error:", response.statusText);
      return [];
    }

    const data = await response.json();
    // Return unique flagged URLs only
    const flaggedUrls = data.matches ? data.matches.map(match => ({ url: match.threat.url, threatType: match.threatType })) : [];
    return [...new Set(flaggedUrls.map(JSON.stringify))].map(JSON.parse); // Deduplicate flagged URLs
  } catch (error) {
    console.error("Safe Browsing API error:", error);
    return [];
  }
}

app.post('/api/analyze', async (req, res) => {
  try {
    let { text, isHtml } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No content provided.' });
    }

    const urls = isHtml ? extractUrlsFromHtml(text) : extractUrlsFromText(text);
    console.log('Extracted URLs:', urls);

    // Check URLs with Safe Browsing API
    const flaggedUrls = await checkUrlsWithSafeBrowsing(urls);
    console.log('Flagged URLs:', flaggedUrls);

    const isSuspicious = flaggedUrls.length > 0;

    res.json({
      isSuspicious,
      flaggedUrls,
      analysis: {
        totalUrls: urls.length,
        suspiciousUrls: flaggedUrls.length,
      }
    });
  } catch (error) {
    console.error('Error analyzing content:', error);
    res.status(500).json({
      error: 'Error analyzing content.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
