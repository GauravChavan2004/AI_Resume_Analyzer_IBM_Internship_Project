# AI Resume Analyzer

An interactive Applicant Tracking System (ATS) optimization web application designed to help job-seekers align resumes with Job Descriptions (JD). The application extracts text from uploaded documents (PDF, DOCX, TXT), maps skill structures, rates ATS compatibility, alerts to missing credentials/keywords, and suggests layout/context optimizations.

---

## Folder Structure

The project is structured into cleanly separated `frontend` and `backend` layers for independent or concurrent runs:

```text
AI_Resume_Analyzer/
├── backend/                   # Node.js + Express.js API server
│   ├── src/                   # Server source files
│   │   ├── config/            # DB configuration and fallback controls
│   │   ├── controllers/       # Controller routers
│   │   ├── models/            # Schema layers
│   │   ├── routes/            # Route endpoints
│   │   ├── services/          # PDF generation and LLM API services
│   │   └── server.js          # App API gateway entry
│   ├── .env                   # API server environment variables
│   ├── database_fallback.json # Local records and users repository
│   └── package.json           # Backend package configuration
│
├── frontend/                  # Static user web dashboard
│   ├── public/                # HTML, CSS, client-side JS
│   │   ├── index.html         # Resume Scan & Dashboard UI
│   │   ├── login.html         # User Authentication UI
│   │   ├── history.html       # Historical Scans overview
│   │   ├── modules.html       # AI Career Suite (Cover letter, LinkedIn, Interview Prep)
│   │   ├── css/               # Styling theme stylesheets
│   │   └── js/                # Client-side scripts
│   └── package.json           # Frontend host package configuration
│
├── package.json               # Root workspace script manager
└── README.md                  # Project instructions (This file)
```

---

## Setup & Run Instructions

### 1. Prerequisites
- **Node.js**: (Version 16 or newer recommended)
- **MongoDB**: (Optional. If offline, the app defaults to `database_fallback.json` storage seamlessly)

### 2. Dependency Installation
Run the root script to install dependencies for the root, backend, and frontend directories automatically:
```bash
npm run install:all
```

### 3. Run the Services Concurrently
To run both the backend (port `5000`) and the frontend (port `3000`) concurrently, run:
```bash
npm start
```
- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

Alternatively, for developers, run in live hot-reload development mode:
```bash
npm run dev
```

### 4. Running Services Individually
- **Running Backend Only**:
  ```bash
  npm start --prefix backend
  ```
- **Running Frontend Only**:
  ```bash
  npm start --prefix frontend
  ```
