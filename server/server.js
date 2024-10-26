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
  'http://localhost:3001', // Frontend
  'chrome-extension://ogajmmpomfocfpjhalbfjhjeikidgkef', // Chrome extension ID
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

// Extract URLs from HTML content
function extractUrlsFromHtml(htmlContent) {
  const urlRegex = /href=["'](https?:\/\/[^"']+)["']/g;
  const matches = [...htmlContent.matchAll(urlRegex)];
  return matches.map(match => match[1]);
}

// Extract URLs from plain text
function extractUrlsFromText(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

// Check URLs with Safe Browsing API
async function checkUrlsWithSafeBrowsing(urls) {
  if (!urls || urls.length === 0) return [];

  const requestBody = {
    client: {
      clientId: "phishfinder-extension",
      clientVersion: "1.0",
    },
    threatInfo: {
      threatTypes: [
        "MALWARE",
        "SOCIAL_ENGINEERING",
        "UNWANTED_SOFTWARE",
        "POTENTIALLY_HARMFUL_APPLICATION"
      ],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: urls.map((url) => ({ url })),
    },
  };

  try {
    const response = await fetch(SAFE_BROWSING_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("Safe Browsing API error:", response.statusText);
      return [];
    }

    const data = await response.json();
    return data.matches ? data.matches.map(match => ({
      url: match.threat.url,
      threatType: match.threatType
    })) : [];
  } catch (error) {
    console.error("Safe Browsing API error:", error);
    return [];
  }
}

// Analyze email content and URLs
app.post('/api/analyze', async (req, res) => {
  try {
    let { text, isHtml } = req.body;

    // Validate the provided text
    if (!text) {
      return res.status(400).json({ error: 'No content provided.' });
    }

    // Extract URLs based on content type
    const urls = isHtml ? extractUrlsFromHtml(text) : extractUrlsFromText(text);
    console.log('Extracted URLs:', urls);

    // Check URLs with Safe Browsing API
    const flaggedUrls = await checkUrlsWithSafeBrowsing(urls);
    console.log('Flagged URLs:', flaggedUrls);

    // AI content analysis
    let aiResult = { score: 1.0 }; // Default score
    try {
      const aiResponse = await fetch('https://www.freedetector.ai/api/content_detector/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: isHtml ? text.replace(/<[^>]*>/g, '') : text // Strip HTML tags if present
        }),
      });

      if (!aiResponse.ok) {
        throw new Error(`AI API returned ${aiResponse.status}`);
      }

      aiResult = await aiResponse.json();
      console.log('AI Analysis result:', aiResult);
    } catch (aiError) {
      console.error('AI Analysis error:', aiError);
      // Continue with default score if AI analysis fails
    }

    const isSuspicious = flaggedUrls.length > 0 || (aiResult && aiResult.score < 0.5);

    res.json({
      isSuspicious,
      aiScore: aiResult.score,
      flaggedUrls,
      analysis: {
        totalUrls: urls.length,
        suspiciousUrls: flaggedUrls.length,
        aiDetectionScore: aiResult.score
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
