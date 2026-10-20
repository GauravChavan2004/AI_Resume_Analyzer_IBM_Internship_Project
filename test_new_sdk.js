const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log('Testing with key (first 10 chars):', apiKey ? apiKey.substring(0, 10) + '...' : 'NONE');

if (!apiKey) {
  console.log('Error: GEMINI_API_KEY is not defined.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function testConnection() {
  try {
    console.log('Attempting generateContent with @google/genai...');
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: "Respond with only 'OK' if you see this."
    });
    console.log('API Response:', response.text.trim());
    console.log('SUCCESS! The new unified SDK is working!');
  } catch (err) {
    console.error('API Call Failed:', err.message);
  }
}

testConnection();
