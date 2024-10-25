import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3001;

// List of allowed origins
const allowedOrigins = [
  'http://localhost:3001', // Frontend
  'chrome-extension://ogajmmpomfocfpjhalbfjhjeikidgkef', // Chrome extension ID
];

// CORS configuration to allow multiple origins
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin or requests from allowed origins
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

app.post('/api/analyze', async (req, res) => {
  let { text } = req.body;

  // Trim the text to a maximum of 298 words to account for API discrepancies
  let wordsArray = text.trim().split(/\s+/); // Split by spaces
  const wordCount = wordsArray.length;

  console.log(`Received text with word count: ${wordCount}`);

  if (wordCount > 298) {
    console.log('Text exceeds 298 words. Trimming to 298 words.');
    wordsArray = wordsArray.slice(0, 298); // Keep the first 298 words
    text = wordsArray.join(' '); // Rebuild the text from the trimmed array
  }

  // Ensure the text has at least 10 words after trimming
  if (wordsArray.length < 10) {
    console.error('Text length validation failed: Less than 10 words.');
    return res.status(400).json({ error: 'Text must be between 10 and 298 words.' });
  }

  console.log('API Token:', process.env.API_TOKEN); // Log the token for debugging

  try {
    const response = await fetch('https://www.freedetector.ai/api/content_detector/', {
      method: 'POST',
      headers: {
        'Authorization': process.env.API_TOKEN, // Ensure the token is loaded
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    console.log('Status:', response.status); // Log the status code
    console.log('Response Headers:', response.headers); // Log the headers for debugging
    
    const result = await response.json();
    console.log('AI Detector API Response:', result);

    if (result.success) {
      res.json({ score: result.score });
    } else {
      console.error('API returned error:', result);
      res.status(500).json({ error: result.message || 'API error occurred.' });
    }
  } catch (error) {
    console.error('Error making request to AI Detector API:', error);
    res.status(500).json({ error: 'Error analyzing content.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
