const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log('Testing with key (first 10 chars):', apiKey ? apiKey.substring(0, 10) + '...' : 'NONE');

if (!apiKey) {
  console.log('Error: GEMINI_API_KEY is not defined.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testConnection() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent("Respond with only the word 'OK' if you see this.");
    console.log('API Response:', result.response.text().trim());
    console.log('SUCCESS! The new key format is working with the updated SDK!');
  } catch (err) {
    console.error('API Call Failed:', err.message);
  }
}

testConnection();
