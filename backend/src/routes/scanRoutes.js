const express = require('express');
const router = express.Router();
const multer = require('multer');
const { analyze, getHistory, getDetails, remove, downloadPDF } = require('../controllers/scanController');
const authMiddleware = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'resume_saas_super_secret_key';

// Configure Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(pdf|docx|txt)$/i;
    if (allowedExtensions.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT documents are allowed.'));
    }
  }
});

/**
 * Soft authentication middleware.
 * Inspects for valid JWT. If present, attaches credentials to req.user.
 * If missing or invalid, proceeds without failing (req.user = null).
 */
function softAuth(req, res, next) {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers.cookie) {
    // Basic parser for inline cookies
    const cookies = {};
    req.headers.cookie.split(';').forEach(c => {
      const parts = c.split('=');
      if (parts.length === 2) cookies[parts[0].trim()] = parts[1].trim();
    });
    token = cookies.token;
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    req.user = null; // Proceed as guest if token expired/invalid
  }
  next();
}

// Routes mapping
router.post('/analyze', softAuth, upload.single('resume'), analyze);
router.get('/history', authMiddleware, getHistory);
router.get('/config', (req, res) => res.json({ status: 'active' }));
router.get('/details/status', (req, res) => res.json({ active: true }));
router.get('/details/:id', softAuth, getDetails);
router.delete('/:id', authMiddleware, remove);
router.get('/report/:id', downloadPDF); // Server-side PDF generation stream

module.exports = router;
