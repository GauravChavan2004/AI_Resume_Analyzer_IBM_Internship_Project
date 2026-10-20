const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parseFile } = require('../utils/parser');
const { analyzeResume } = require('../utils/analyzer');
const { saveAnalysis, getAllAnalyses, getAnalysisById, deleteAnalysis } = require('../models/Analysis');
const { isFallback } = require('../config/db');

// Set up multer in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(pdf|docx|txt)$/i;
    if (allowedExtensions.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
  }
});

/**
 * @route   POST /api/analyze
 * @desc    Upload resume, parse text, run ATS comparison, save to database
 */
router.post('/analyze', upload.single('resume'), async (req, res) => {
  try {
    const { jobTitle, jobDescription } = req.body;
    const file = req.file;

    // Validation
    if (!jobDescription || !jobDescription.trim()) {
      return res.status(400).json({ error: 'Job description is required.' });
    }
    if (!jobTitle || !jobTitle.trim()) {
      return res.status(400).json({ error: 'Job title is required.' });
    }
    if (!file) {
      return res.status(400).json({ error: 'Resume file is required.' });
    }

    console.log(`Received scan request for title: "${jobTitle}", file: "${file.originalname}"`);

    // 1. Parse File Content to raw text
    const rawText = await parseFile(file.buffer, file.originalname);

    // 2. Perform Resume/JD Analysis
    const analysisResult = await analyzeResume(rawText, jobDescription);

    // 3. Save to database/fallback database
    const savedRecord = await saveAnalysis({
      jobTitle: jobTitle.trim(),
      jobDescription: jobDescription.trim(),
      candidateName: analysisResult.candidateName,
      fileName: file.originalname,
      atsScore: analysisResult.atsScore,
      matchDetails: analysisResult.matchDetails,
      suggestions: analysisResult.suggestions,
      rawText: rawText
    });

    res.status(201).json(savedRecord);
  } catch (err) {
    console.error('Error during analysis API execution:', err);
    res.status(500).json({ error: err.message || 'An error occurred during resume analysis.' });
  }
});

/**
 * @route   GET /api/history
 * @desc    Retrieve all past resume analyses
 */
router.get('/history', async (req, res) => {
  try {
    const list = await getAllAnalyses();
    res.json(list);
  } catch (err) {
    console.error('Failed to retrieve history:', err);
    res.status(500).json({ error: 'Failed to retrieve analysis history.' });
  }
});

/**
 * @route   GET /api/history/:id
 * @desc    Retrieve details of a single analysis by ID
 */
router.get('/history/:id', async (req, res) => {
  try {
    const record = await getAnalysisById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Analysis record not found.' });
    }
    res.json(record);
  } catch (err) {
    console.error(`Failed to retrieve record ${req.params.id}:`, err);
    res.status(500).json({ error: 'Failed to retrieve analysis details.' });
  }
});

/**
 * @route   DELETE /api/history/:id
 * @desc    Delete analysis from records
 */
router.delete('/history/:id', async (req, res) => {
  try {
    const success = await deleteAnalysis(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Record not found or already deleted.' });
    }
    res.json({ message: 'Analysis record successfully deleted.' });
  } catch (err) {
    console.error(`Failed to delete record ${req.params.id}:`, err);
    res.status(500).json({ error: 'Failed to delete record.' });
  }
});

/**
 * @route   GET /api/config
 * @desc    Retrieve backend connection status and configuration info
 */
router.get('/config', (req, res) => {
  res.json({
    databaseFallback: isFallback(),
    geminiEnabled: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '')
  });
});

module.exports = router;
