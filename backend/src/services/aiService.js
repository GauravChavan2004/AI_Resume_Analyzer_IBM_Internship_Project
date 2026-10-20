const { GoogleGenerativeAI } = require('@google/generative-ai');
const { localEvaluate } = require('../utils/atsEngine');

const modelName = 'gemma-4-26b-a4b-it';

/**
 * Robustly extracts and parses a JSON block from LLM responses containing markdown/thinking details.
 */
function extractJson(text) {
  let cleanText = text.trim();
  
  // 1. Try direct parse
  try {
    return JSON.parse(cleanText);
  } catch (e) {}

  // 2. Try to extract markdown code blocks (e.g. ```json ... ```)
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = cleanText.match(codeBlockRegex);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch (e) {}
  }
  
  // 3. Try matching curly brace balance to get the first complete JSON object
  const firstBrace = cleanText.indexOf('{');
  if (firstBrace !== -1) {
    let braceCount = 0;
    let endIdx = -1;
    for (let i = firstBrace; i < cleanText.length; i++) {
      if (cleanText[i] === '{') braceCount++;
      else if (cleanText[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIdx = i;
          break;
        }
      }
    }
    if (endIdx !== -1) {
      try {
        return JSON.parse(cleanText.substring(firstBrace, endIdx + 1).trim());
      } catch (e) {}
    }
  }

  // 4. Try matching square bracket balance to get the first complete JSON array
  const firstBracket = cleanText.indexOf('[');
  if (firstBracket !== -1) {
    let bracketCount = 0;
    let endIdx = -1;
    for (let i = firstBracket; i < cleanText.length; i++) {
      if (cleanText[i] === '[') bracketCount++;
      else if (cleanText[i] === ']') {
        bracketCount--;
        if (bracketCount === 0) {
          endIdx = i;
          break;
        }
      }
    }
    if (endIdx !== -1) {
      try {
        return JSON.parse(cleanText.substring(firstBracket, endIdx + 1).trim());
      } catch (e) {}
    }
  }

  // Fallback: Try original text parse to throw default syntax error
  return JSON.parse(cleanText);
}

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * AI Core Resume scan and ATS calculation
 */
async function analyzeResume(resumeText, jdText, email = '', phone = '') {
  const ai = getAiClient();
  if (!ai) {
    console.log('No Gemini API key. Running Local Matcher...');
    return localEvaluate(resumeText, jdText, email, phone);
  }

  try {
    const model = ai.getGenerativeModel({ model: modelName });
    const prompt = `
You are an expert technical recruiter and ATS optimizer.
Compare the following candidate Resume text with the Job Description (JD).
Your response must be returned strictly as a JSON object matching this schema:
{
  "candidateName": "Extracted Candidate Name (or 'Resume Candidate')",
  "atsScore": 85, // integer 0-100 overall compatibility
  "formattingScore": 90, // integer 0-100 structure, headers, organization
  "lengthScore": 95, // integer 0-100 word count rating
  "matchDetails": {
    "matchedSkills": ["tech/business skills from JD found in resume"],
    "missingSkills": ["tech/business skills from JD missing in resume"],
    "matchedKeywords": ["industry methodologies/verbs/concepts matched"],
    "missingKeywords": ["industry methodologies/verbs/concepts missing"]
  },
  "suggestions": [
    "actionable improvements to wording/metrics/layout"
  ],
  "strengths": [
    "specific strengths in match alignment/experience"
  ],
  "weaknesses": [
    "gaps in skills/metrics/sections"
  ]
}

Ensure the output is valid JSON and nothing else. Do not wrap the JSON output in markdown tags.

Job Description:
"""
${jdText}
"""

Resume Text:
"""
${resumeText}
"""
`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const data = extractJson(result.response.text());
    return data;
  } catch (err) {
    console.error('Gemini Resume analysis failed, falling back to local:', err);
    return localEvaluate(resumeText, jdText, email, phone);
  }
}

/**
 * Cover Letter Generator module
 */
async function generateCoverLetter(resumeText, jdText, candidateName = 'Resume Candidate', jobTitle = 'Target Role') {
  const ai = getAiClient();
  if (!ai) {
    console.log('Generating fallback Mock Cover Letter...');
    return `Dear Hiring Manager,

I am writing to express my strong interest in the ${jobTitle} position. With my background in software development and technical project implementation, I am confident that I can make a significant contribution to your team.

My resume highlights my experience building responsive applications, designing clean APIs, and collaborating in agile teams. I have developed a strong skill set spanning industry-standard frameworks and software methodologies, and I am excited about the opportunity to apply these skills to your company's technical goals.

Thank you for your time and consideration. I look forward to discussing how my experience aligns with your team's needs.

Sincerely,
${candidateName}`;
  }

  try {
    const model = ai.getGenerativeModel({ model: modelName });
    const prompt = `
Based on the Candidate Resume and the Job Description, write a professional, engaging, and highly tailored cover letter.
Limit the cover letter to 3-4 concise paragraphs. Write in a confident tone that connects the candidate's achievements directly to the job requirements.

Job Description:
"""
${jdText}
"""

Resume:
"""
${resumeText}
"""
`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('Gemini Cover Letter generation failed:', err);
    return 'Failed to generate cover letter due to API connection error.';
  }
}

/**
 * LinkedIn Profile Optimizer module
 */
async function optimizeLinkedIn(resumeText, jobTitle = 'Target Role') {
  const ai = getAiClient();
  if (!ai) {
    console.log('Generating fallback Mock LinkedIn details...');
    return {
      headline: `${jobTitle} | Technical Leadership & Process Optimization`,
      summary: `Results-oriented professional with specialized experience in ${jobTitle} workflows. Proven track record of executing key projects, optimizing operational timelines, and collaborating in cross-functional teams to deliver business value. Skilled in analyzing requirements, implementing process improvements, and achieving strategic targets.`,
      recommendations: [
        `Update your LinkedIn headline to highlight your primary expertise as a ${jobTitle}.`,
        `Craft an engaging 'About' summary highlighting your years of experience and core competencies in the ${jobTitle} domain.`,
        `Use active verbs in your experience descriptions (e.g., "Led", "Optimized", "Structured") to detail achievements.`,
        `List specialized certifications and professional projects relevant to ${jobTitle} positions.`
      ]
    };
  }

  try {
    const model = ai.getGenerativeModel({ model: modelName });
    const prompt = `
Based on the candidate's resume, generate suggestions to optimize their LinkedIn profile for search engines and recruiters.
Return your response strictly as a JSON object matching this schema:
{
  "headline": "A catchy, SEO-friendly LinkedIn headline suggestion (max 220 chars)",
  "summary": "An engaging, first-person LinkedIn 'About' section summary (150-200 words)",
  "recommendations": [
    "actionable recommendation 1",
    "actionable recommendation 2"
  ]
}

Ensure the output is valid JSON and nothing else.

Resume:
"""
${resumeText}
"""
`;
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    return extractJson(result.response.text());
  } catch (err) {
    console.error('Gemini LinkedIn optimization failed:', err);
    return { headline: '', summary: '', recommendations: ['Error optimizing profile.'] };
  }
}

/**
 * Interview Questions Prep module
 */
async function generateInterviewQuestions(resumeText, jdText, jobTitle = 'Target Role') {
  const ai = getAiClient();
  if (!ai) {
    console.log('Generating fallback Mock Interview Prep Questions...');
    return [
      {
        question: `Could you describe a challenging project in your work as a ${jobTitle} and how you resolved project bottlenecks?`,
        answer: `Present your response using the STAR method. Outline the business situation, the target objective for the ${jobTitle} role, the actions you executed, and the quantifiable outcomes (e.g. efficiency gained, error reduction).`,
        type: 'technical'
      },
      {
        question: `How do you stay updated with the latest tools, industry standards, and methodologies within the ${jobTitle} domain?`,
        answer: `Detail professional certifications, training programs, industry publications, and specific operational software tools you use regularly to refine your competency as a ${jobTitle}.`,
        type: 'technical'
      },
      {
        question: 'How do you handle conflict or differing professional opinions within a collaborative team environment?',
        answer: 'Focus on clear communication, active listening, referencing data, documentation, or compliance rules to resolve disputes, and prioritizing project timeline delivery.',
        type: 'hr'
      },
      {
        question: `Why do you believe you are the ideal fit for this ${jobTitle} position based on the job requirements?`,
        answer: 'Directly link your core experiences and skills to the top requirements listed in the JD. Highlight how your background prepares you to add value immediately.',
        type: 'hr'
      }
    ];
  }

  try {
    const model = ai.getGenerativeModel({ model: modelName });
    const prompt = `
Based on the candidate resume and target JD, generate 4-5 tailored interview questions.
Include:
- 2 Technical questions focusing on the stack differences/requirements.
- 2 Behavioral/HR questions.
- 1 Project-focused question based on projects listed in the resume.
Each question must include a detailed "suggested answer guidelines" that outlines what the candidate should highlight.
Return your response strictly as a JSON array matching this schema:
[
  {
    "question": "The question string",
    "answer": "Suggested bullet points or guidelines on how to answer effectively",
    "type": "technical" // or "hr" or "behavioral"
  }
]

Ensure the output is valid JSON and nothing else.

Job Description:
"""
${jdText}
"""

Resume:
"""
${resumeText}
"""
`;
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    return extractJson(result.response.text());
  } catch (err) {
    console.error('Gemini Interview questions prep failed:', err);
    return [];
  }
}

/**
 * Skills Gap Analysis module
 */
async function analyzeSkillsGap(resumeText, jdText, jobTitle = 'Target Role') {
  const ai = getAiClient();
  if (!ai) {
    console.log('Generating fallback Mock Skill Gap Analysis...');
    const normalizedRole = jobTitle.toLowerCase();
    
    if (normalizedRole.includes('developer') || normalizedRole.includes('engineer') || normalizedRole.includes('frontend') || normalizedRole.includes('backend') || normalizedRole.includes('fullstack') || normalizedRole.includes('programmer') || normalizedRole.includes('data')) {
      return {
        gaps: ['Cloud architecture (AWS/GCP)', 'Container Orchestration (Docker/Kubernetes)', 'Unit/Integration Testing (Jest/Mocha)'],
        courses: [
          'Ultimate AWS Certified Solutions Architect Associate Course',
          'Docker & Kubernetes: The Practical Guide (Udemy)',
          'Testing JavaScript Applications & React testing-library tutorials'
        ]
      };
    } else if (normalizedRole.includes('accounts') || normalizedRole.includes('accountant') || normalizedRole.includes('finance') || normalizedRole.includes('accounting') || normalizedRole.includes('tax') || normalizedRole.includes('audit') || normalizedRole.includes('billing') || normalizedRole.includes('clerk')) {
      return {
        gaps: ['Advanced Financial Analysis & Modeling', 'Enterprise Resource Planning (ERP - SAP/Oracle)', 'Tax Compliance & International Regulations'],
        courses: [
          'Financial Modeling & Valuation Analyst (FMVA) Certification',
          'ERP Training: SAP Financial Accounting (FICO) Essentials',
          'Corporate Tax & Accounting Masterclass'
        ]
      };
    } else if (normalizedRole.includes('manager') || normalizedRole.includes('product') || normalizedRole.includes('pm') || normalizedRole.includes('scrum') || normalizedRole.includes('owner') || normalizedRole.includes('project')) {
      return {
        gaps: ['Strategic Product Roadmap Formulation', 'Advanced Agile Product Management (Jira/Scrum)', 'Customer Data Analytics & User Behavior Mapping'],
        courses: [
          'Product Management First Steps (LinkedIn Learning)',
          'Certified Scrum Product Owner (CSPO) Preparation',
          'Google Analytics Certification & Product Analytics Masterclass'
        ]
      };
    } else {
      // General professional role fallback
      return {
        gaps: ['Project Lifecycle Management (PMI/Agile)', 'Advanced Business Analytics & Data Visualization', 'Stakeholder Communication & Change Management'],
        courses: [
          'Project Management Professional (PMP) Training Course',
          'Microsoft PowerBI / Tableau Data Analytics Masterclass',
          'High-Impact Communication & Corporate Leadership Strategy'
        ]
      };
    }
  }

  try {
    const model = ai.getGenerativeModel({ model: modelName });
    const prompt = `
Based on the resume and the JD, detect the critical skill gaps. Suggest a roadmap of course topics and learning resources.
Return your response strictly as a JSON object matching this schema:
{
  "gaps": ["critical skill/keyword gap 1", "critical skill/keyword gap 2"],
  "courses": ["suggested training certification or course title 1", "suggested training certification or course title 2"]
}

Ensure the output is valid JSON and nothing else.

Job Description:
"""
${jdText}
"""

Resume:
"""
${resumeText}
"""
`;
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    return extractJson(result.response.text());
  } catch (err) {
    console.error('Gemini Skills gap analysis failed:', err);
    return { gaps: [], courses: [] };
  }
}

module.exports = {
  analyzeResume,
  generateCoverLetter,
  optimizeLinkedIn,
  generateInterviewQuestions,
  analyzeSkillsGap
};
