const { getAnalysisById, updateAnalysis } = require('../models/Analysis');
const aiService = require('../services/aiService');

/**
 * Generate a custom tailored Cover Letter
 */
async function getCoverLetter(req, res) {
  try {
    const { analysisId } = req.body;
    if (!analysisId) {
      return res.status(400).json({ error: 'Analysis ID is required.' });
    }

    const analysis = await getAnalysisById(analysisId);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis record not found.' });
    }

    // AI Cache check
    if (analysis.coverLetter && analysis.coverLetter.trim() !== '') {
      console.log(`Returning cached Cover Letter for record ${analysisId}`);
      return res.json({ coverLetter: analysis.coverLetter });
    }

    // Call AI service
    const coverLetter = await aiService.generateCoverLetter(
      analysis.rawText,
      analysis.jobDescription,
      analysis.candidateName,
      analysis.jobTitle
    );

    // Persist/cache in database
    await updateAnalysis(analysisId, { coverLetter });

    res.json({ coverLetter });

  } catch (err) {
    console.error('Cover Letter API Error:', err);
    res.status(500).json({ error: 'Failed to generate cover letter.' });
  }
}

/**
 * Generate LinkedIn profile optimization suggestions
 */
async function getLinkedInOptimization(req, res) {
  try {
    const { analysisId } = req.body;
    if (!analysisId) {
      return res.status(400).json({ error: 'Analysis ID is required.' });
    }

    const analysis = await getAnalysisById(analysisId);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis record not found.' });
    }

    // AI Cache check
    if (analysis.linkedinOptimization && analysis.linkedinOptimization.headline) {
      console.log(`Returning cached LinkedIn optimization for record ${analysisId}`);
      return res.json(analysis.linkedinOptimization);
    }

    // Call AI service with target job title context
    const linkedinOptimization = await aiService.optimizeLinkedIn(analysis.rawText, analysis.jobTitle);

    // Cache in DB
    await updateAnalysis(analysisId, { linkedinOptimization });

    res.json(linkedinOptimization);

  } catch (err) {
    console.error('LinkedIn API Error:', err);
    res.status(500).json({ error: 'Failed to optimize LinkedIn suggestions.' });
  }
}

/**
 * Generate technical and behavioral interview preparation guides
 */
async function getInterviewQuestions(req, res) {
  try {
    const { analysisId } = req.body;
    if (!analysisId) {
      return res.status(400).json({ error: 'Analysis ID is required.' });
    }

    const analysis = await getAnalysisById(analysisId);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis record not found.' });
    }

    // AI Cache check
    if (analysis.interviewQuestions && analysis.interviewQuestions.length > 0) {
      console.log(`Returning cached Interview Questions for record ${analysisId}`);
      return res.json(analysis.interviewQuestions);
    }

    // Call AI service with target job title context
    const interviewQuestions = await aiService.generateInterviewQuestions(
      analysis.rawText,
      analysis.jobDescription,
      analysis.jobTitle
    );

    // Cache in DB
    await updateAnalysis(analysisId, { interviewQuestions });

    res.json(interviewQuestions);

  } catch (err) {
    console.error('Interview Questions API Error:', err);
    res.status(500).json({ error: 'Failed to build interview questions checklist.' });
  }
}

/**
 * Generate Skill Gap roadmap suggestions
 */
async function getSkillsGapAnalysis(req, res) {
  try {
    const { analysisId } = req.body;
    if (!analysisId) {
      return res.status(400).json({ error: 'Analysis ID is required.' });
    }

    const analysis = await getAnalysisById(analysisId);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis record not found.' });
    }

    // AI Cache check
    if (analysis.skillsGapAnalysis && analysis.skillsGapAnalysis.gaps && analysis.skillsGapAnalysis.gaps.length > 0) {
      console.log(`Returning cached Skill Gap analysis for record ${analysisId}`);
      return res.json(analysis.skillsGapAnalysis);
    }

    // Call AI service with target job title context
    const skillsGapAnalysis = await aiService.analyzeSkillsGap(
      analysis.rawText,
      analysis.jobDescription,
      analysis.jobTitle
    );

    // Cache in DB
    await updateAnalysis(analysisId, { skillsGapAnalysis });

    res.json(skillsGapAnalysis);

  } catch (err) {
    console.error('Skills Gap API Error:', err);
    res.status(500).json({ error: 'Failed to perform skills gap analysis.' });
  }
}

module.exports = {
  getCoverLetter,
  getLinkedInOptimization,
  getInterviewQuestions,
  getSkillsGapAnalysis
};
