// Skill database for local analysis
const SKILL_DATABASE = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'golang', 'rust', 'php', 'swift', 'kotlin', 'r', 'sql', 'html', 'css', 'sass', 'shell', 'bash',
  'react', 'angular', 'vue', 'next.js', 'nuxt.js', 'svelte', 'express', 'node.js', 'node', 'django', 'flask', 'spring boot', 'laravel', 'asp.net', 'jquery', 'bootstrap', 'tailwindcss',
  'mongodb', 'postgresql', 'mysql', 'sqlite', 'redis', 'cassandra', 'dynamodb', 'firebase', 'oracle', 'mssql',
  'aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'jenkins', 'ci/cd', 'git', 'github', 'gitlab', 'terraform', 'ansible', 'linux', 'unix', 'nginx',
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'nlp', 'natural language processing', 'tableau', 'powerbi', 'data analytics', 'data science',
  'agile', 'scrum', 'kanban', 'jira', 'confluence', 'webpack', 'babel', 'vite', 'graphql', 'rest api', 'soap', 'microservices', 'serverless',
  'project management', 'product management', 'business analysis', 'seo', 'marketing', 'leadership', 'communication', 'teamwork', 'problem solving'
];

const STOPWORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
  'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an',
  'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about',
  'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up',
  'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
  'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don',
  'should', 'now', 'using', 'used', 'use', 'using', 'also', 'experience', 'work', 'job', 'skills', 'ability',
  'strong', 'knowledge', 'required', 'years', 'working', 'development', 'team', 'candidate'
]);

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s\-\.\+#]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1);
}

/**
 * Perform rule-based local ATS evaluation of a resume text against a Job Description
 */
function localEvaluate(resumeText, jdText, candidateEmail = '', candidatePhone = '') {
  const resumeTokens = tokenize(resumeText);
  const jdTokens = tokenize(jdText);
  const resumeTokenSet = new Set(resumeTokens);
  const jdTokenSet = new Set(jdTokens);

  // 1. Extract required skills and keywords
  const jdSkills = SKILL_DATABASE.filter(skill => {
    if (skill.includes(' ')) {
      return jdText.toLowerCase().includes(skill);
    }
    return jdTokenSet.has(skill);
  });

  const matchedSkills = [];
  const missingSkills = [];

  jdSkills.forEach(skill => {
    const matched = skill.includes(' ') 
      ? resumeText.toLowerCase().includes(skill)
      : resumeTokenSet.has(skill);

    if (matched) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  // Extract general keywords
  const skillWords = new Set(SKILL_DATABASE.map(s => s.split(' ')).flat());
  const extractKeywords = (tokens) => {
    const counts = {};
    tokens.forEach(token => {
      if (!STOPWORDS.has(token) && !skillWords.has(token) && isNaN(token) && token.length > 3) {
        counts[token] = (counts[token] || 0) + 1;
      }
    });
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  };

  const jdKeywords = extractKeywords(jdTokens).slice(0, 30);
  const resumeKeywords = new Set(extractKeywords(resumeTokens));
  const matchedKeywords = [];
  const missingKeywords = [];

  jdKeywords.forEach(keyword => {
    if (resumeKeywords.has(keyword)) {
      matchedKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  });

  // 2. Structuring checks
  const sectionChecks = {
    experience: /experience|work\s+history|employment|career|history/i.test(resumeText),
    education: /education|academic|university|degree|college/i.test(resumeText),
    projects: /project|portfolio|personal\s+work/i.test(resumeText),
    skills: /skills|expertise|technical\s+skills|proficiencies|technologies/i.test(resumeText),
    contact: /email|phone|contact|address|linkedin|github/i.test(resumeText) || candidateEmail || candidatePhone
  };

  // 3. Formatting check (Headers, bullet lists, contact info presence)
  let formattingScore = 100;
  const suggestions = [];

  if (!sectionChecks.contact) {
    formattingScore -= 15;
    suggestions.push('Add your direct contact info (email, phone) in a prominent header at the top.');
  }
  if (!sectionChecks.experience) {
    formattingScore -= 15;
    suggestions.push('Format your work history with a distinct "Professional Experience" header.');
  }
  if (!sectionChecks.education) {
    formattingScore -= 15;
    suggestions.push('Create a dedicated "Education" section list.');
  }
  if (!sectionChecks.skills) {
    formattingScore -= 15;
    suggestions.push('Organize your skills in a searchable "Technical Skills" table or bullet block.');
  }
  
  // Bullet point format check (checking for typical list markers)
  const hasBullets = /[\u2022\u25E6\u2023\u2043\u2219•*-]\s+\w+/m.test(resumeText);
  if (!hasBullets) {
    formattingScore -= 15;
    suggestions.push('Format job achievements with bullet points instead of long paragraph paragraphs.');
  }
  formattingScore = Math.max(40, formattingScore);

  // 4. Length check (Count words)
  const wordCount = resumeText.split(/\s+/).filter(w => w.length > 0).length;
  let lengthScore = 100;
  if (wordCount < 200) {
    lengthScore = 40;
    suggestions.push('Your resume is extremely short (under 200 words). Expand descriptions of work and skills.');
  } else if (wordCount < 400) {
    lengthScore = 70;
    suggestions.push('Your resume is brief (under 400 words). Incorporate detailed project descriptions to showcase depth.');
  } else if (wordCount > 1000 && wordCount <= 1500) {
    lengthScore = 80;
    suggestions.push('Your resume is slightly long (over 1000 words). Keep it concise and within 1-2 pages.');
  } else if (wordCount > 1500) {
    lengthScore = 55;
    suggestions.push('Your resume is wordy (over 1500 words). Distill achievements and remove older, irrelevant tasks.');
  }

  // 5. Compute overall weighted score
  const skillMatchRate = jdSkills.length > 0 ? (matchedSkills.length / jdSkills.length) : 1;
  const keywordMatchRate = jdKeywords.length > 0 ? (matchedKeywords.length / jdKeywords.length) : 1;
  const structureCount = Object.values(sectionChecks).filter(Boolean).length;
  const structureScore = structureCount / 5;

  let atsScore = Math.round(
    (skillMatchRate * 45) + 
    (keywordMatchRate * 25) + 
    (formattingScore * 0.15) + 
    (lengthScore * 0.15)
  );
  atsScore = Math.max(0, Math.min(100, atsScore));

  // 6. Strengths and Weaknesses
  const strengths = [];
  const weaknesses = [];

  if (formattingScore >= 80) strengths.push('Strong structural layout. Standard section headers are easily parseable.');
  if (lengthScore >= 90) strengths.push('Optimal document length matching recruiter and ATS expectations.');
  if (matchedSkills.length >= 5) strengths.push(`Strong core capability matches (found ${matchedSkills.length} matches, including ${matchedSkills.slice(0, 3).join(', ')}).`);
  if (hasBullets) strengths.push('Good use of lists/bullet points to present responsibilities.');

  if (missingSkills.length > 0) {
    weaknesses.push(`Missing critical technical skills: ${missingSkills.slice(0, 4).join(', ')}.`);
  }
  if (wordCount < 350) {
    weaknesses.push('Insufficient resume details. The document word count is below recruiter standard guidelines.');
  }
  if (!sectionChecks.projects) {
    weaknesses.push('Lacks a distinct Projects portfolio section to display applied development.');
  }

  // Action verbs check
  const actionVerbs = ['led', 'managed', 'developed', 'designed', 'implemented', 'created', 'built', 'optimized', 'increased', 'reduced', 'collaborated', 'engineered'];
  const hasActionVerbs = actionVerbs.some(verb => resumeText.toLowerCase().includes(verb));
  if (!hasActionVerbs) {
    suggestions.push('Begin descriptive sentences with strong action verbs (e.g., engineered, optimized, developed) to capture impact.');
    weaknesses.push('Lacks strong action verbs; phrasing relies on passive descriptions.');
  }

  // Quantitative results check
  const hasMetrics = /\b\d+%\b|\b\$\d+|\b\d+\s+(users|clients|leads|developers|servers|percent)\b/i.test(resumeText);
  if (!hasMetrics) {
    suggestions.push('Add numeric metrics (e.g., "improved loading speed by 25%", "served 10,000+ users") to prove your projects\' real-world impact.');
    weaknesses.push('Lacks quantifiable metrics. Results are described in purely qualitative terms.');
  }

  // Get Candidate name (First line heuristics)
  let candidateName = 'Resume Candidate';
  const lines = resumeText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length > 0 && lines[0].length < 45 && !/resume|cv|curriculum/i.test(lines[0])) {
    candidateName = lines[0];
  }

  return {
    candidateName,
    atsScore,
    formattingScore,
    lengthScore,
    matchDetails: {
      matchedSkills,
      missingSkills,
      matchedKeywords,
      missingKeywords
    },
    suggestions,
    strengths,
    weaknesses
  };
}

module.exports = {
  localEvaluate
};
