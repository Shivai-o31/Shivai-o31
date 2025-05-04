require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');

// Initialize Express app
const app = express();
app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Add a simple GET endpoint for the root path
app.get('/', (req, res) => {
  res.send('Welcome to Shivai-031! This is an AI assistant API. Use POST /ask to interact with the assistant.');
});

// API endpoint to handle queries
app.post('/ask', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4', // Agar gpt-4 nahi kaam karta, toh 'gpt-3.5-turbo' use karo
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    res.json({ response });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
