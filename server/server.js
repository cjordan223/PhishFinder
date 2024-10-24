import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3001;

// List of allowed origins 
const allowedOrigins = [
  'http://localhost:3000',  //  frontend
  'chrome-extension://ogajmmpomfocfpjhalbfjhjeikidgkef'  // Chrome extension ID
];

// CORS configuration to allow multiple origins
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g., mobile apps, Postman) or requests from allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type,Authorization'
};

app.use(cors(corsOptions));  // Apply the CORS middleware

app.use(express.json());

app.post('/api/analyze', async (req, res) => {
  const { text } = req.body;

  try {
    const response = await fetch('https://api.gowinston.ai/v2/ai-content-detection', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer w4Lxw9etv3FgQ2nd8n87ai5N9a7M6ysN6vNqXMnK75a9866e', // Replace 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        version: 'latest',
        sentences: true,
        language: 'en',
      }),
    });

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Error making request to Winston AI:', error);
    res.status(500).json({ error: 'Error analyzing content' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
