require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');

const mongoose = require('mongoose');
const fs = require('fs');

// Import Upgraded Routers
const authRoutes = require('./routes/authRoutes');
const scanRoutes = require('./routes/scanRoutes');
const moduleRoutes = require('./routes/moduleRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (reverts to database_fallback.json online check)
connectDB();

// Global Request Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Resolve frontend public folder path dynamically (supports both unified and split folder architectures)
const frontendPath = fs.existsSync(path.join(__dirname, '../../frontend/public'))
  ? path.join(__dirname, '../../frontend/public')
  : path.join(__dirname, '../public');

// Serve static frontend files
app.use(express.static(frontendPath));

// Mount API Route scopes
app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/modules', moduleRoutes);

// Catch-all route to serve dashboard as fallback
app.get('*', (req, res, next) => {
  // If requesting an API, pass to next middleware (which will trigger 404)
  if (req.url.startsWith('/api')) {
    return next();
  }
  const indexPath = fs.existsSync(path.join(frontendPath, 'index.html'))
    ? path.join(frontendPath, 'index.html')
    : path.join(__dirname, '../public/index.html');
  res.sendFile(indexPath);
});

// Global Error handling middleware (catches Multer limits or parse errors)
app.use((err, req, res, next) => {
  console.error('Unhandled Global Server Error:', err.message);
  
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `File upload restriction: ${err.message}` });
  }
  
  res.status(500).json({ error: err.message || 'An internal server error occurred.' });
});

// Start listening
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 Upgraded Resume Platform running at http://localhost:${PORT}`);
  console.log(`📂 Auth & Profiles API: http://localhost:${PORT}/api/auth`);
  console.log(`📂 Match Scanning API: http://localhost:${PORT}/api/scan`);
  console.log(`📂 AI Sub-modules API: http://localhost:${PORT}/api/modules`);
  console.log(`===================================================`);
});
