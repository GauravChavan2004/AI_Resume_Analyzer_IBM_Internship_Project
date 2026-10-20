const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const FALLBACK_FILE = path.join(__dirname, '../../database_fallback.json');
let isFallbackMode = false;

// Initialize JSON fallback file if it doesn't exist
if (!fs.existsSync(FALLBACK_FILE)) {
  fs.writeFileSync(FALLBACK_FILE, JSON.stringify([], null, 2), 'utf8');
}

async function connectDB() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_analyzer';
  
  try {
    console.log('Connecting to MongoDB at:', mongoURI);
    // Set connection timeout to 4 seconds to avoid hanging long if DB is not running
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000
    });
    console.log('MongoDB connected successfully!');
    isFallbackMode = false;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    console.warn('⚠️ WARNING: Reverting to local JSON database fallback (database_fallback.json) in project root.');
    isFallbackMode = true;
  }
}

function isFallback() {
  return isFallbackMode;
}

// Helpers for fallback JSON DB
function readFallbackData() {
  try {
    const data = fs.readFileSync(FALLBACK_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading fallback DB:', err);
    return [];
  }
}

function writeFallbackData(data) {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing fallback DB:', err);
  }
}

module.exports = {
  connectDB,
  isFallback,
  readFallbackData,
  writeFallbackData
};
