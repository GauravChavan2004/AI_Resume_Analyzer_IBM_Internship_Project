const express = require('express');
const router = express.Router();
const { getCoverLetter, getLinkedInOptimization, getInterviewQuestions, getSkillsGapAnalysis } = require('../controllers/moduleController');

// Reuse softAuth check for accessing AI additions
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'resume_saas_super_secret_key';

function softAuth(req, res, next) {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers.cookie) {
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
    req.user = null;
  }
  next();
}

// Sub-module endpoints mapping
router.post('/cover-letter', softAuth, getCoverLetter);
router.post('/linkedin', softAuth, getLinkedInOptimization);
router.post('/interview', softAuth, getInterviewQuestions);
router.post('/gap', softAuth, getSkillsGapAnalysis);

module.exports = router;
