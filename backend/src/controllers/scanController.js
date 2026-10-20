const { parseDocument } = require('../utils/docParser');
const { analyzeResume } = require('../services/aiService');
const { saveAnalysis, getAllAnalyses, getAnalysisById, deleteAnalysis } = require('../models/Analysis');
const { generateAnalysisPDF } = require('../services/pdfService');

/**
 * Upload resume, parse, evaluate ATS compatibility and save record
 */
async function analyze(req, res) {
  try {
    const { jobTitle, jobDescription } = req.body;
    const file = req.file;

    // 1. Validation
    if (!jobDescription || !jobDescription.trim()) {
      return res.status(400).json({ error: 'Job description is required.' });
    }
    if (!jobTitle || !jobTitle.trim()) {
      return res.status(400).json({ error: 'Job title is required.' });
    }
    if (!file) {
      return res.status(400).json({ error: 'Resume file is required.' });
    }

    // 2. Parse file raw text and extract email/phone using docParser
    const { rawText, email, phone } = await parseDocument(file.buffer, file.originalname);

    // 3. Trigger evaluation (handles Gemini API or Local fallback automatically)
    const analysisResult = await analyzeResume(rawText, jobDescription, email, phone);

    // 4. Save to Database (linking to logged-in user if available)
    const userId = req.user ? req.user.id : null;
    const savedRecord = await saveAnalysis({
      userId,
      jobTitle: jobTitle.trim(),
      jobDescription: jobDescription.trim(),
      candidateName: analysisResult.candidateName,
      email: email || analysisResult.email || '',
      phone: phone || analysisResult.phone || '',
      fileName: file.originalname,
      atsScore: analysisResult.atsScore,
      formattingScore: analysisResult.formattingScore || 80,
      lengthScore: analysisResult.lengthScore || 80,
      matchDetails: analysisResult.matchDetails,
      suggestions: analysisResult.suggestions,
      strengths: analysisResult.strengths,
      weaknesses: analysisResult.weaknesses,
      rawText
    });

    res.status(201).json(savedRecord);

  } catch (err) {
    console.error('Scan Controller Error:', err);
    res.status(500).json({ error: err.message || 'An error occurred during resume analysis.' });
  }
}

/**
 * Fetch scan history for the current logged-in user
 */
async function getHistory(req, res) {
  try {
    // Scope history search to current user
    const userId = req.user ? req.user.id : null;
    const list = await getAllAnalyses(userId);
    res.json(list);
  } catch (err) {
    console.error('Failed to retrieve history:', err);
    res.status(500).json({ error: 'Failed to retrieve analysis history.' });
  }
}

/**
 * Fetch single report by ID
 */
async function getDetails(req, res) {
  try {
    const record = await getAnalysisById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Scan record not found.' });
    }

    // Security check: restrict records to their creators if not public/guest scans
    if (record.userId && (!req.user || req.user.id !== record.userId.toString())) {
      return res.status(403).json({ error: 'Access denied. You do not own this record.' });
    }

    res.json(record);
  } catch (err) {
    console.error('Failed to retrieve details:', err);
    res.status(500).json({ error: 'Failed to retrieve analysis details.' });
  }
}

/**
 * Delete a past analysis record
 */
async function remove(req, res) {
  try {
    const record = await getAnalysisById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Scan record not found.' });
    }

    if (record.userId && (!req.user || req.user.id !== record.userId.toString())) {
      return res.status(403).json({ error: 'Access denied. You do not own this record.' });
    }

    await deleteAnalysis(req.params.id);
    res.json({ message: 'Analysis record successfully deleted.' });
  } catch (err) {
    console.error('Failed to delete scan:', err);
    res.status(500).json({ error: 'Failed to delete record.' });
  }
}

/**
 * Stream server-side compiled PDF report to user downloads
 */
async function downloadPDF(req, res) {
  try {
    const record = await getAnalysisById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Analysis record not found.' });
    }

    // Format download file name
    const safeName = record.candidateName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const safeJob = record.jobTitle.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    
    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ATS_Report_${safeName}_${safeJob}.pdf"`);

    // Stream PDFKit bytes to Express output
    generateAnalysisPDF(record, res);
  } catch (err) {
    console.error('PDF Download Service Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to compile and download PDF report.' });
    }
  }
}

module.exports = {
  analyze,
  getHistory,
  getDetails,
  remove,
  downloadPDF
};
