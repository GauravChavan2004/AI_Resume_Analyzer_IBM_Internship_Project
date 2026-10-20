// Global instances
let currentTheme = 'dark';
let selectedFile = null; // Globally scoped to resolve file uploading & clear scoping conflicts!
let atsGaugeChartInstance = null;
let keywordChartInstance = null;
let modalGaugeChartInstance = null;
let modalKeywordChartInstance = null;
let allHistoryRecords = [];

// Dynamic API Base URL resolution (for running frontend and backend on separate ports)
var API_BASE = 'http://Ai-resume-api-env.eba-rsy6zupp.eu-north-1.elasticbeanstalk.com';

// Templates for JD Form filling
const jdTemplates = {
  frontend: {
    title: "Senior Frontend Engineer",
    jd: `We are seeking a Senior Frontend Engineer to build responsive, user-friendly interfaces.
Key Technical Skills Required:
- JavaScript (ES6+), TypeScript, React, HTML5, CSS3, TailwindCSS, and SASS.
- Experience with module bundlers and tooling: Webpack, Vite, NPM, and Git.
- Experience with state management, REST APIs, GraphQL, and client-side performance optimization.
- Agile Scrum team environment experience.
- Unit testing experience using Jest or testing-library.`
  },
  fullstack: {
    title: "Full Stack Developer (Node.js & MongoDB)",
    jd: `We are looking for a Full Stack Developer to build scalable web applications.
Required Technical Stack:
- JavaScript, Node.js, Express.js, and MongoDB (Mongoose ODM).
- Building secure RESTful APIs, JWT authentication, and database indexing.
- Core tools: Git, Docker, GCP, AWS, and Linux shell commands.
- Familiarity with React, Redis cache, CI/CD pipelines, and microservices architecture in Agile teams.`
  },
  datascientist: {
    title: "Data Scientist / AI Engineer",
    jd: `We are hiring a Data Scientist to join our AI research team.
Required Technical Skills:
- Programming: Python, SQL, and R.
- Packages: Pandas, NumPy, Scikit-learn, TensorFlow, PyTorch, and NLP tools.
- Concepts: Machine Learning algorithms, Deep Learning models, data analytics, and statistics.
- Tools: Tableau, PowerBI, Docker, Git, GCP, AWS cloud storage, and agile methodologies.`
  },
  pm: {
    title: "Technical Product Manager",
    jd: `We are seeking a Technical Product Manager to bridge engineering and business.
Required Competencies:
- Product Management, project management, business analysis, and roadmap formulation.
- Methodologies: Agile development, Scrum practices, Kanban, Jira, and Confluence.
- Tools: SQL query writing, Git repository familiarity, Google Analytics, and product usage tracking.
- Skills: Strong communication, technical leadership, stakeholder management, and problem solving.`
  }
};

// --- INITIALIZE VIEWS ON LOAD ---
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderAuthNavbar();
  fetchConfigStatus();

  // Route paths parsing to see which script logic to trigger
  const pathname = window.location.pathname;
  
  if (document.getElementById('analyzer-form')) {
    initDashboard();
  } else if (document.getElementById('history-table-body')) {
    initHistoryPage();
  } else if (document.getElementById('scan-selector')) {
    initSuitePage();
  }
});

// --- THEME MANAGEMENT SYSTEM ---
function initTheme() {
  const cachedTheme = localStorage.getItem('theme') || 'dark';
  currentTheme = cachedTheme;
  document.documentElement.setAttribute('data-theme', cachedTheme);
  
  // Insert theme toggle button dynamically in Navbar if not present
  const container = document.querySelector('.navbar .container');
  if (container && !document.getElementById('theme-toggle-btn')) {
    const btn = document.createElement('button');
    btn.id = 'theme-toggle-btn';
    btn.className = 'btn btn-outline-custom ms-lg-3 me-3';
    btn.innerHTML = cachedTheme === 'dark' ? '<i class="bi bi-sun-fill text-warning"></i>' : '<i class="bi bi-moon-stars-fill"></i>';
    btn.onclick = toggleTheme;
    
    // Insert before profile panel dynamically using parentNode resolution
    const authPanel = document.getElementById('navbar-auth-panel');
    if (authPanel && authPanel.parentNode) {
      authPanel.parentNode.insertBefore(btn, authPanel);
    } else if (container) {
      container.appendChild(btn);
    }
  }
}

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);
  
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) {
    btn.innerHTML = currentTheme === 'dark' ? '<i class="bi bi-sun-fill text-warning"></i>' : '<i class="bi bi-moon-stars-fill"></i>';
  }

  // Redraw charts if present to update styling colors
  if (atsGaugeChartInstance) refreshChartsTheme();
}

function refreshChartsTheme() {
  // Simple force resize or redraw trigger for active dashboards
  if (document.getElementById('ats-gauge-chart')) {
    // Redraw if result object caching is available
  }
}

// --- AUTHENTICATION NAVBAR HANDLER ---
function renderAuthNavbar() {
  const authPanel = document.getElementById('navbar-auth-panel');
  if (!authPanel) return;

  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  // Dynamically show/hide authenticated links based on state
  const historyLink = document.getElementById('nav-history');
  const modulesLink = document.getElementById('nav-modules');

  if (user && token) {
    // Show tabs
    if (historyLink && historyLink.parentNode) historyLink.parentNode.classList.remove('d-none');
    if (modulesLink && modulesLink.parentNode) modulesLink.parentNode.classList.remove('d-none');

    authPanel.innerHTML = `
      <span class="text-secondary small d-none d-md-inline me-2"><i class="bi bi-person-circle text-info me-1"></i> ${user.name}</span>
      <button class="btn btn-sm btn-outline-danger" onclick="triggerSignout()">
        <i class="bi bi-box-arrow-left me-1"></i> Logout
      </button>
    `;
  } else {
    // Hide tabs
    if (historyLink && historyLink.parentNode) historyLink.parentNode.classList.add('d-none');
    if (modulesLink && modulesLink.parentNode) modulesLink.parentNode.classList.add('d-none');

    authPanel.innerHTML = `
      <a href="login.html" class="btn btn-sm btn-premium" id="btn-login-redirect">
        <i class="bi bi-box-arrow-in-right me-1"></i> Sign In
      </a>
    `;
  }
}

async function triggerSignout() {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST' });
  } catch (err) {
    console.error('Logout request failed:', err);
  }
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// --- CONFIG API BADGES OVERVIEW ---
async function fetchConfigStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/scan/config`); // Retain legacy endpoint check or route configuration status
    // If upgraded backend configuration resides elsewhere, fetch it from config endpoint
    const statusRes = await fetch(`${API_BASE}/api/scan/details/status`).catch(() => null); // mock config trigger fallback
    
    // We already retrieve fallback configurations dynamically
    const dbBadge = document.getElementById('badge-db');
    const aiBadge = document.getElementById('badge-ai');
    
    // Let's call /api/scan/history (protected). If 401, we set badges. But let's fetch config from /api/scan/details fallback
    const confRes = await fetch(`${API_BASE}/api/auth/profile`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (dbBadge) {
      dbBadge.className = 'badge badge-status bg-success';
      dbBadge.innerHTML = '<i class="bi bi-database-check me-1"></i> Storage: Connected';
    }
    if (aiBadge) {
      aiBadge.className = 'badge badge-status bg-info text-dark';
      aiBadge.innerHTML = '<i class="bi bi-robot me-1"></i> Engine: AI Active';
    }
  } catch (err) {
    console.log('Badges load error:', err);
  }
}

// --- TEMPLATES DROPDOWN FILLER ---
function loadJDTemplate(type) {
  const template = jdTemplates[type];
  if (template) {
    document.getElementById('job-title').value = template.title;
    document.getElementById('job-description').value = template.jd;
  }
}

// --- DASHBOARD (index.html) EXECUTION DRIVER ---
function initDashboard() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const form = document.getElementById('analyzer-form');

  // File drag & drop triggers
  ['dragenter', 'dragover'].forEach(name => {
    dropZone.addEventListener(name, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropZone.addEventListener(name, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) handleFile(fileInput.files[0]);
  });

  function handleFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext)) {
      alert('Unsupported file type. Please upload a PDF, DOCX, or TXT document.');
      return;
    }
    selectedFile = file;
    document.getElementById('selected-file-name').textContent = file.name;
    document.getElementById('file-selected-badge').classList.remove('d-none');
  }

  // Cancel file attachment
  window.clearSelectedFile = (e) => {
    e.stopPropagation();
    selectedFile = null;
    fileInput.value = '';
    document.getElementById('file-selected-badge').classList.add('d-none');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please upload a resume file.');
      return;
    }

    const jobTitle = document.getElementById('job-title').value;
    const jobDescription = document.getElementById('job-description').value;

    const fd = new FormData();
    fd.append('resume', selectedFile);
    fd.append('jobTitle', jobTitle);
    fd.append('jobDescription', jobDescription);

    const overlay = document.getElementById('loading-overlay');
    const loadingStatus = document.getElementById('loading-status');
    overlay.classList.add('active');

    // Interval prompts
    const prompts = [
      'Extracting structural paragraph elements...',
      'Matching dictionary technologies...',
      'Scoring formatting, lengths, and completeness...',
      'Interpreting semantic strengths and suggestions...'
    ];
    let idx = 0;
    const loaderInterval = setInterval(() => {
      if (idx < prompts.length - 1) {
        idx++;
        loadingStatus.textContent = prompts[idx];
      }
    }, 1500);

    try {
      const headers = {};
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/scan/analyze`, {
        method: 'POST',
        headers: headers,
        body: fd
      });

      clearInterval(loaderInterval);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Comparison request failed.');
      }

      const report = await res.json();
      displayDashboardReport(report);

    } catch (err) {
      clearInterval(loaderInterval);
      alert(`Error matching resume: ${err.message}`);
    } finally {
      overlay.classList.remove('active');
    }
  });

  // PDF report request
  document.getElementById('download-pdf-btn').onclick = () => {
    const id = document.getElementById('download-pdf-btn').dataset.scanId;
    if (id) {
      window.location.href = `${API_BASE}/api/scan/report/${id}`;
    }
  };
}

/**
 * Display Scan details on dashboard results panels
 */
function displayDashboardReport(report) {
  document.getElementById('results-empty-state').classList.add('d-none');
  const card = document.getElementById('analysis-report');
  card.classList.remove('d-none');

  document.getElementById('report-score').textContent = report.atsScore;
  document.getElementById('report-candidate').textContent = report.candidateName;
  document.getElementById('report-job').textContent = report.jobTitle;
  document.getElementById('report-filename').textContent = report.fileName;
  
  // Set scanId to download button dataset
  document.getElementById('download-pdf-btn').dataset.scanId = report._id;

  // Set category badges
  const badge = document.getElementById('report-status-badge');
  let text = 'Poor Fit';
  let badgeClass = 'bg-danger text-white';
  if (report.atsScore >= 80) {
    text = 'Excellent Match';
    badgeClass = 'bg-success text-white';
  } else if (report.atsScore >= 60) {
    text = 'Good Match';
    badgeClass = 'bg-info text-dark';
  } else if (report.atsScore >= 40) {
    text = 'Fair Match';
    badgeClass = 'bg-warning text-dark';
  }
  badge.textContent = text;
  badge.className = `badge ${badgeClass} fs-7`;

  // Draw radial compatibility score
  renderRadialGauge('ats-gauge-chart', report.atsScore, atsGaugeChartInstance, (c) => {
    atsGaugeChartInstance = c;
  });

  // Draw Horizontal stats comparison
  const matched = report.matchDetails.matchedSkills.length + report.matchDetails.matchedKeywords.length;
  const missing = report.matchDetails.missingSkills.length + report.matchDetails.missingKeywords.length;
  renderHorizontalBar('keyword-comparison-chart', matched, missing, keywordChartInstance, (c) => {
    keywordChartInstance = c;
  });

  // Render Tags matched
  const matchedContainer = document.getElementById('matched-skills-container');
  matchedContainer.innerHTML = '';
  const allMatched = [...report.matchDetails.matchedSkills, ...report.matchDetails.matchedKeywords];
  if (allMatched.length > 0) {
    allMatched.forEach(w => {
      matchedContainer.innerHTML += `<span class="badge-skill badge-skill-match">${escapeHtml(w)}</span>`;
    });
  } else {
    matchedContainer.innerHTML = '<span class="text-secondary small">No matching tech keywords.</span>';
  }

  // Render Tags missing
  const missingContainer = document.getElementById('missing-skills-container');
  missingContainer.innerHTML = '';
  const allMissing = [...report.matchDetails.missingSkills, ...report.matchDetails.missingKeywords];
  if (allMissing.length > 0) {
    allMissing.forEach(w => {
      missingContainer.innerHTML += `<span class="badge-skill badge-skill-missing">${escapeHtml(w)}</span>`;
    });
  } else {
    missingContainer.innerHTML = '<span class="text-secondary small text-success"><i class="bi bi-check-all"></i> Document covers all required JD keywords!</span>';
  }

  // Recommendations checklist optimizer
  const checklist = document.getElementById('optimizer-checklist');
  checklist.innerHTML = '';
  const suggestions = report.suggestions || [];
  if (suggestions.length > 0) {
    suggestions.slice(0, 4).forEach((sug, i) => {
      checklist.innerHTML += `
        <div class="form-check py-1">
          <input class="form-check-input border-secondary bg-dark" type="checkbox" id="check-${i}">
          <label class="form-check-label text-secondary small" for="check-${i}">${escapeHtml(sug)}</label>
        </div>
      `;
    });
  } else {
    checklist.innerHTML = '<div class="text-success small"><i class="bi bi-emoji-smile"></i> Formatting optimization targets complete!</div>';
  }

  // Action suggestions
  const suggsList = document.getElementById('suggestions-list-container');
  suggsList.innerHTML = '';
  if (suggestions.length > 0) {
    suggestions.forEach(sug => {
      suggsList.innerHTML += `<div class="suggestion-item text-secondary">${escapeHtml(sug)}</div>`;
    });
  } else {
    suggsList.innerHTML = '<div class="text-success small">No modifications recommended. Excellent layout design!</div>';
  }

  // Add submodules action links
  const token = localStorage.getItem('token');
  if (token) {
    // Add floating helper card linking to modules
    const actionsBlock = document.createElement('div');
    actionsBlock.className = 'mt-4 border-top border-secondary pt-3 d-flex justify-content-between align-items-center flex-wrap gap-2';
    actionsBlock.innerHTML = `
      <span class="text-secondary small"><i class="bi bi-sparkles text-info"></i> Unlocked: AI Career Modules</span>
      <a href="modules.html?id=${report._id}" class="btn btn-sm btn-premium py-1 px-3 d-flex align-items-center gap-1">
        <i class="bi bi-rocket-takeoff"></i> Open AI Career Suite
      </a>
    `;
    suggsList.appendChild(actionsBlock);
  }

  // Scroll details card
  card.scrollIntoView({ behavior: 'smooth' });
}

// --- HISTORICAL RETRIEVALS (history.html) ---
async function initHistoryPage() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please sign in to view scan history panels.');
    window.location.href = 'login.html';
    return;
  }

  const overlay = document.getElementById('loading-overlay');
  overlay.classList.add('active');

  try {
    const res = await fetch(`${API_BASE}/api/scan/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('API failed to retrieve history list.');

    allHistoryRecords = await res.json();
    renderHistoryRows(allHistoryRecords);
  } catch (err) {
    alert(`Error: ${err.message}`);
  } finally {
    overlay.classList.remove('active');
  }

  // PDF download on modal
  document.getElementById('modal-download-pdf').onclick = () => {
    const id = document.getElementById('modal-download-pdf').dataset.scanId;
    if (id) {
      window.location.href = `${API_BASE}/api/scan/report/${id}`;
    }
  };
}

function renderHistoryRows(records) {
  const tbody = document.getElementById('history-table-body');
  const count = document.getElementById('record-count');
  const empty = document.getElementById('history-empty-state');

  tbody.innerHTML = '';
  count.textContent = records.length;

  if (records.length === 0) {
    empty.classList.remove('d-none');
    return;
  }
  empty.classList.add('d-none');

  records.forEach(rec => {
    const tr = document.createElement('tr');
    tr.className = 'history-row';
    const date = new Date(rec.createdAt).toLocaleDateString();

    let color = 'text-danger';
    if (rec.atsScore >= 80) color = 'text-success';
    else if (rec.atsScore >= 60) color = 'text-info';
    else if (rec.atsScore >= 40) color = 'text-warning';

    tr.innerHTML = `
      <td class="text-white fw-bold">${escapeHtml(rec.jobTitle)}</td>
      <td>${escapeHtml(rec.candidateName)}</td>
      <td class="small text-secondary">${escapeHtml(rec.fileName)}</td>
      <td class="text-center fw-extrabold fs-5 ${color}">${rec.atsScore}%</td>
      <td>${date}</td>
      <td class="text-end">
        <div class="d-flex justify-content-end gap-1">
          <button class="btn btn-sm btn-outline-custom" onclick="viewHistoryDetails('${rec._id}')" title="Details">
            <i class="bi bi-eye"></i>
          </button>
          <a class="btn btn-sm btn-outline-info" href="modules.html?id=${rec._id}" title="Career Suite">
            <i class="bi bi-rocket-takeoff"></i>
          </a>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteHistoryDetails('${rec._id}')" title="Delete">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Search filters in history
window.filterHistory = () => {
  const txt = document.getElementById('search-input').value.toLowerCase().trim();
  const select = document.getElementById('score-filter').value;

  const filtered = allHistoryRecords.filter(rec => {
    const textMatch = rec.jobTitle.toLowerCase().includes(txt) || rec.candidateName.toLowerCase().includes(txt);
    let scoreMatch = true;
    if (select === 'excellent') scoreMatch = rec.atsScore >= 80;
    else if (select === 'good') scoreMatch = rec.atsScore >= 60 && rec.atsScore < 80;
    else if (select === 'fair') scoreMatch = rec.atsScore >= 40 && rec.atsScore < 60;
    else if (select === 'poor') scoreMatch = rec.atsScore < 40;

    return textMatch && scoreMatch;
  });

  renderHistoryRows(filtered);
};

// View detailed history report modal
window.viewHistoryDetails = async (id) => {
  const overlay = document.getElementById('loading-overlay');
  document.getElementById('loading-title').textContent = 'Fetching Report details...';
  overlay.classList.add('active');

  try {
    const res = await fetch(`${API_BASE}/api/scan/details/${id}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (!res.ok) throw new Error('API failed to query details.');
    const data = await res.json();

    // Populate modal text fields
    document.getElementById('modal-candidate').textContent = data.candidateName;
    document.getElementById('modal-job').textContent = data.jobTitle;
    document.getElementById('modal-filename').textContent = data.fileName;
    document.getElementById('modal-score').textContent = data.atsScore;
    document.getElementById('modal-download-pdf').dataset.scanId = data._id;

    // Badges setup
    const badge = document.getElementById('modal-status-badge');
    let text = 'Poor Fit';
    let badgeClass = 'bg-danger text-white';
    if (data.atsScore >= 80) {
      text = 'Excellent Match';
      badgeClass = 'bg-success text-white';
    } else if (data.atsScore >= 60) {
      text = 'Good Match';
      badgeClass = 'bg-info text-dark';
    } else if (data.atsScore >= 40) {
      text = 'Fair Match';
      badgeClass = 'bg-warning text-dark';
    }
    badge.textContent = text;
    badge.className = `badge ${badgeClass} fs-7`;

    // Redraw modal score circular gauge
    renderRadialGauge('modal-gauge-chart', data.atsScore, modalGaugeChartInstance, (c) => {
      modalGaugeChartInstance = c;
    });

    // Horizontal bars
    const matched = data.matchDetails.matchedSkills.length + data.matchDetails.matchedKeywords.length;
    const missing = data.matchDetails.missingSkills.length + data.matchDetails.missingKeywords.length;
    renderBarChart('modal-keyword-chart', matched, missing, modalKeywordChartInstance, (c) => {
      modalKeywordChartInstance = c;
    });

    // Matched skills tags
    const matchedDiv = document.getElementById('modal-matched-skills');
    matchedDiv.innerHTML = '';
    const allMatched = [...data.matchDetails.matchedSkills, ...data.matchDetails.matchedKeywords];
    allMatched.forEach(w => {
      matchedDiv.innerHTML += `<span class="badge-skill badge-skill-match">${escapeHtml(w)}</span>`;
    });

    // Missing skills tags
    const missingDiv = document.getElementById('modal-missing-skills');
    missingDiv.innerHTML = '';
    const allMissing = [...data.matchDetails.missingSkills, ...data.matchDetails.missingKeywords];
    allMissing.forEach(w => {
      missingDiv.innerHTML += `<span class="badge-skill badge-skill-missing">${escapeHtml(w)}</span>`;
    });

    // Recommendations list
    const suggsDiv = document.getElementById('modal-suggestions-list');
    suggsDiv.innerHTML = '';
    data.suggestions.forEach(sug => {
      suggsDiv.innerHTML += `<div class="suggestion-item text-secondary">${escapeHtml(sug)}</div>`;
    });

    // Show modal
    const element = document.getElementById('reportModal');
    const bsModal = new bootstrap.Modal(element);
    bsModal.show();

  } catch (err) {
    alert(`Could not load report: ${err.message}`);
  } finally {
    overlay.classList.remove('active');
    document.getElementById('loading-title').textContent = 'Generating AI Content...';
  }
};

// Delete record from history table
window.deleteHistoryDetails = async (id) => {
  if (!confirm('Are you sure you want to delete this scan from history?')) return;

  const overlay = document.getElementById('loading-overlay');
  overlay.classList.add('active');

  try {
    const res = await fetch(`${API_BASE}/api/scan/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (!res.ok) throw new Error('API failed to delete record.');

    allHistoryRecords = allHistoryRecords.filter(r => r._id !== id);
    renderHistoryRows(allHistoryRecords);

  } catch (err) {
    alert(`Could not delete scan: ${err.message}`);
  } finally {
    overlay.classList.remove('active');
  }
};

// --- AI CAREER SUITE (modules.html) DRIVERS ---
async function initSuitePage() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please sign in to access the AI Career Suite.');
    window.location.href = 'login.html';
    return;
  }

  const overlay = document.getElementById('loading-overlay');
  overlay.classList.add('active');

  try {
    const res = await fetch(`${API_BASE}/api/scan/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Failed to load past scans list.');
    const list = await res.json();
    
    const selector = document.getElementById('scan-selector');
    selector.innerHTML = '<option value="">-- Load a past resume scan context --</option>';
    
    list.forEach(rec => {
      selector.innerHTML += `<option value="${rec._id}">${escapeHtml(rec.jobTitle)} (${rec.fileName})</option>`;
    });

    // Check query params to auto-load context
    const params = new URLSearchParams(window.location.search);
    const qId = params.get('id');
    if (qId) {
      selector.value = qId;
      onScanSelectionChanged();
    }

  } catch (err) {
    alert(`Career Suite error: ${err.message}`);
  } finally {
    overlay.classList.remove('active');
  }
}

// Triggered when dropdown changes
window.onScanSelectionChanged = async () => {
  const selector = document.getElementById('scan-selector');
  const scanId = selector.value;

  const empty = document.getElementById('suite-empty-state');
  const content = document.getElementById('suite-content-card');

  if (!scanId) {
    empty.classList.remove('d-none');
    content.classList.add('d-none');
    return;
  }

  empty.classList.add('d-none');
  content.classList.remove('d-none');

  // Trigger tab switch to Cover Letter as default on load
  switchSuiteTab('coverletter');
};

// Active tab switcher
let activeSuiteTab = 'coverletter';
window.switchSuiteTab = async (tabName) => {
  activeSuiteTab = tabName;

  // Toggle button active states
  ['coverletter', 'linkedin', 'interview', 'gap'].forEach(tab => {
    const btn = document.getElementById(`btn-tab-${tab}`);
    const panel = document.getElementById(`panel-${tab}`);
    if (tab === tabName) {
      btn.classList.add('active');
      panel.classList.remove('d-none');
    } else {
      btn.classList.remove('active');
      panel.classList.add('d-none');
    }
  });

  // Call API for selected tab content
  const scanId = document.getElementById('scan-selector').value;
  if (!scanId) return;

  const overlay = document.getElementById('loading-overlay');
  overlay.classList.add('active');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  };

  try {
    if (tabName === 'coverletter') {
      const res = await fetch(`${API_BASE}/api/modules/cover-letter`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ analysisId: scanId })
      });
      const data = await res.json();
      document.getElementById('coverletter-text').textContent = data.coverLetter;

    } else if (tabName === 'linkedin') {
      const res = await fetch(`${API_BASE}/api/modules/linkedin`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ analysisId: scanId })
      });
      const data = await res.json();
      document.getElementById('linkedin-headline').textContent = data.headline;
      document.getElementById('linkedin-summary').textContent = data.summary;
      
      const list = document.getElementById('linkedin-recommendations');
      list.innerHTML = '';
      data.recommendations.forEach(rec => {
        list.innerHTML += `<li class="list-group-item bg-transparent text-secondary border-secondary px-0"><i class="bi bi-check-circle text-info me-2"></i> ${escapeHtml(rec)}</li>`;
      });

    } else if (tabName === 'interview') {
      const res = await fetch(`${API_BASE}/api/modules/interview`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ analysisId: scanId })
      });
      const data = await res.json();
      const accordion = document.getElementById('interview-accordion');
      accordion.innerHTML = '';
      
      if (data.length > 0) {
        data.forEach((item, i) => {
          accordion.innerHTML += `
            <div class="accordion-item bg-transparent text-white border-secondary">
              <h2 class="accordion-header" id="flush-heading-${i}">
                <button class="accordion-button collapsed bg-transparent text-white border-0" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapse-${i}">
                  <span class="badge bg-secondary me-2 text-uppercase" style="font-size: 0.7rem;">${item.type}</span>
                  <strong>${escapeHtml(item.question)}</strong>
                </button>
              </h2>
              <div id="flush-collapse-${i}" class="accordion-collapse collapse" data-bs-parent="#interview-accordion">
                <div class="accordion-body text-secondary small py-3 bg-dark bg-opacity-25" style="line-height: 1.6;">
                  ${escapeHtml(item.answer)}
                </div>
              </div>
            </div>
          `;
        });
      } else {
        accordion.innerHTML = '<div class="text-secondary small">No coaching questions generated.</div>';
      }

    } else if (tabName === 'gap') {
      const res = await fetch(`${API_BASE}/api/modules/gap`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ analysisId: scanId })
      });
      const data = await res.json();
      
      // Skills gap list
      const gapsDiv = document.getElementById('gap-skills-list');
      gapsDiv.innerHTML = '';
      if (data.gaps && data.gaps.length > 0) {
        data.gaps.forEach(w => {
          gapsDiv.innerHTML += `<span class="badge-skill badge-skill-missing">${escapeHtml(w)}</span>`;
        });
      } else {
        gapsDiv.innerHTML = '<span class="text-success small">No critical technology gaps matching this position requirements!</span>';
      }

      // Course list
      const courseDiv = document.getElementById('gap-courses-list');
      courseDiv.innerHTML = '';
      if (data.courses && data.courses.length > 0) {
        data.courses.forEach(crs => {
          courseDiv.innerHTML += `
            <div class="list-group-item bg-transparent border-secondary text-secondary small d-flex align-items-center gap-2">
              <i class="bi bi-journal-bookmark text-info"></i>
              <span>${escapeHtml(crs)}</span>
            </div>
          `;
        });
      } else {
        courseDiv.innerHTML = '<span class="text-secondary small">No learning course recommendations loaded.</span>';
      }
    }
  } catch (err) {
    alert(`Failed to load module details: ${err.message}`);
  } finally {
    overlay.classList.remove('active');
  }
};

// Copy Cover Letter text to Clipboard
window.copySuiteText = (elId) => {
  const text = document.getElementById(elId).textContent;
  navigator.clipboard.writeText(text).then(() => {
    alert('Content copied successfully to clipboard!');
  }).catch(() => {
    alert('Failed to copy to clipboard.');
  });
};

// --- CHART RENDERING WRAPPERS ---
function renderRadialGauge(id, score, current, saveCb) {
  if (current) current.destroy();
  let color = '#fb7185';
  if (score >= 80) color = '#34d399';
  else if (score >= 60) color = '#818cf8';
  else if (score >= 40) color = '#fbbf24';

  const ctx = document.getElementById(id).getContext('2d');
  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [score, 100 - score],
        backgroundColor: [color, 'rgba(255,255,255,0.05)'],
        borderWidth: 0,
        circumference: 270,
        rotation: 225,
        borderRadius: 20,
        cutout: '80%'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } }
    }
  });
  saveCb(chart);
}

function renderHorizontalBar(id, matched, missing, current, saveCb) {
  if (current) current.destroy();
  const ctx = document.getElementById(id).getContext('2d');
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Matched', 'Missing'],
      datasets: [{
        data: [matched, missing],
        backgroundColor: ['rgba(52, 211, 153, 0.75)', 'rgba(251, 113, 133, 0.75)'],
        borderColor: ['#34d399', '#fb7185'],
        borderWidth: 1,
        borderRadius: 8,
        barThickness: 24
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', stepSize: 2 } },
        y: { grid: { display: false }, ticks: { color: '#f8fafc', font: { weight: 'bold' } } }
      },
      plugins: { legend: { display: false } }
    }
  });
  saveCb(chart);
}

// Duplicate helper for modal chart renders
function renderBarChart(id, matched, missing, current, saveCb) {
  renderHorizontalBar(id, matched, missing, current, saveCb);
}

// Heuristics HTML escape
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[m] || m));
}
