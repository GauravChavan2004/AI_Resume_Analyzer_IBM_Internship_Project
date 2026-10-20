const mongoose = require('mongoose');
const { isFallback, readFallbackData, writeFallbackData } = require('../config/db');

// Define MongoDB Schema
const AnalysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Linked to User (optional for guests)
  jobTitle: { type: String, required: true },
  jobDescription: { type: String, required: true },
  candidateName: { type: String, default: 'Resume Candidate' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  fileName: { type: String, required: true },
  atsScore: { type: Number, required: true },
  formattingScore: { type: Number, default: 80 },
  lengthScore: { type: Number, default: 80 },
  matchDetails: {
    matchedSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    matchedKeywords: { type: [String], default: [] },
    missingKeywords: { type: [String], default: [] }
  },
  suggestions: { type: [String], default: [] },
  strengths: { type: [String], default: [] },
  weaknesses: { type: [String], default: [] },
  
  // AI Module Integrations (Stored directly with analysis context)
  interviewQuestions: [{
    question: { type: String },
    answer: { type: String },
    type: { type: String } // 'technical', 'hr', 'behavioral'
  }],
  coverLetter: { type: String, default: '' },
  linkedinOptimization: {
    headline: { type: String, default: '' },
    summary: { type: String, default: '' },
    recommendations: { type: [String], default: [] }
  },
  skillsGapAnalysis: {
    gaps: { type: [String], default: [] },
    courses: { type: [String], default: [] } // Recommended course titles / topics
  },

  rawText: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const MongoAnalysis = mongoose.model('Analysis', AnalysisSchema);

// CRUD repository methods wrapping Mongoose or Fallback DB
async function saveAnalysis(data) {
  if (isFallback()) {
    const list = readFallbackData();
    const newRecord = {
      _id: Date.now().toString(),
      userId: data.userId || null,
      jobTitle: data.jobTitle,
      jobDescription: data.jobDescription,
      candidateName: data.candidateName || 'Resume Candidate',
      email: data.email || '',
      phone: data.phone || '',
      fileName: data.fileName,
      atsScore: Number(data.atsScore),
      formattingScore: Number(data.formattingScore || 80),
      lengthScore: Number(data.lengthScore || 80),
      matchDetails: {
        matchedSkills: data.matchDetails?.matchedSkills || [],
        missingSkills: data.matchDetails?.missingSkills || [],
        matchedKeywords: data.matchDetails?.matchedKeywords || [],
        missingKeywords: data.matchDetails?.missingKeywords || []
      },
      suggestions: data.suggestions || [],
      strengths: data.strengths || [],
      weaknesses: data.weaknesses || [],
      
      interviewQuestions: data.interviewQuestions || [],
      coverLetter: data.coverLetter || '',
      linkedinOptimization: {
        headline: data.linkedinOptimization?.headline || '',
        summary: data.linkedinOptimization?.summary || '',
        recommendations: data.linkedinOptimization?.recommendations || []
      },
      skillsGapAnalysis: {
        gaps: data.skillsGapAnalysis?.gaps || [],
        courses: data.skillsGapAnalysis?.courses || []
      },
      
      rawText: data.rawText || '',
      createdAt: new Date().toISOString()
    };
    list.push(newRecord);
    writeFallbackData(list);
    return newRecord;
  } else {
    const record = new MongoAnalysis(data);
    return await record.save();
  }
}

async function getAllAnalyses(userId = null) {
  if (isFallback()) {
    const list = readFallbackData();
    // Filter records that match userId, or return all if guest queries
    // Also ignore user account profiles (which have password fields)
    const filtered = list.filter(item => !item.password && (userId === null || item.userId === userId));
    return filtered.slice().reverse();
  } else {
    const query = userId ? { userId } : {};
    return await MongoAnalysis.find(query).sort({ createdAt: -1 });
  }
}

async function getAnalysisById(id) {
  if (isFallback()) {
    const list = readFallbackData();
    return list.find(item => item._id === id && !item.password) || null;
  } else {
    return await MongoAnalysis.findById(id);
  }
}

async function deleteAnalysis(id) {
  if (isFallback()) {
    let list = readFallbackData();
    const initialLen = list.length;
    list = list.filter(item => item._id !== id);
    if (list.length !== initialLen) {
      writeFallbackData(list);
      return true;
    }
    return false;
  } else {
    const res = await MongoAnalysis.findByIdAndDelete(id);
    return !!res;
  }
}

// Custom wrapper to update specific fields on an analysis (like Cover Letter / Interview prep additions)
async function updateAnalysis(id, updateData) {
  if (isFallback()) {
    const list = readFallbackData();
    const idx = list.findIndex(item => item._id === id && !item.password);
    if (idx === -1) return null;
    
    // Deep merge for nested objects
    const item = list[idx];
    list[idx] = {
      ...item,
      ...updateData,
      linkedinOptimization: {
        ...item.linkedinOptimization,
        ...updateData.linkedinOptimization
      },
      skillsGapAnalysis: {
        ...item.skillsGapAnalysis,
        ...updateData.skillsGapAnalysis
      }
    };
    writeFallbackData(list);
    return list[idx];
  } else {
    return await MongoAnalysis.findByIdAndUpdate(id, { $set: updateData }, { new: true });
  }
}

module.exports = {
  MongoAnalysis,
  saveAnalysis,
  getAllAnalyses,
  getAnalysisById,
  deleteAnalysis,
  updateAnalysis
};
