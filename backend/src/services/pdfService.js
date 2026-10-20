const PDFDocument = require('pdfkit');

/**
 * Generates a styled, multi-page PDF report for a resume analysis and streams it
 * @param {Object} analysis - The database scan record
 * @param {WritableStream} stream - The writable stream (e.g. Express HTTP response)
 */
function generateAnalysisPDF(analysis, stream) {
  const doc = new PDFDocument({ margin: 50, size: 'LETTER', bufferPages: true });

  // Pipe output stream
  doc.pipe(stream);

  // Helper color variables (Light/Dark themes matching branding)
  const cDark = '#0f172a';
  const cSlate = '#334155';
  const cText = '#475569';
  const cBlue = '#38bdf8';
  const cPurple = '#818cf8';
  const cGreen = '#10b981';
  const cRed = '#f43f5e';

  // --- PAGE 1: HEADER & SCORE OVERVIEW ---
  
  // Platform Title
  doc.fontSize(10).fillColor(cPurple).text('AI RESUME ANALYZER - COMPARISON REPORT', { characterSpacing: 1.5 });
  doc.moveDown(0.5);
  
  // Divider
  doc.lineWidth(1).strokeColor('#e2e8f0').moveTo(50, 70).lineTo(562, 70).stroke();
  doc.moveDown(1.5);

  // Target Role & Candidate Details
  doc.fontSize(22).fillColor(cDark).text(analysis.jobTitle, { font: 'Helvetica-Bold' });
  doc.fontSize(12).fillColor(cSlate).text(`Candidate: ${analysis.candidateName}`, { font: 'Helvetica' });
  doc.fontSize(10).fillColor(cText).text(`File Analysed: ${analysis.fileName}  |  Scanned on: ${new Date(analysis.createdAt).toLocaleDateString()}`);
  doc.moveDown(2);

  // Score Card (Background highlight card)
  doc.rect(50, 160, 512, 100).fill('#f8fafc');
  
  // Dynamic Score Category Colors
  let scoreColor = cRed;
  let scoreText = 'Poor Fit';
  if (analysis.atsScore >= 80) {
    scoreColor = cGreen;
    scoreText = 'Excellent Match';
  } else if (analysis.atsScore >= 60) {
    scoreColor = cPurple;
    scoreText = 'Good Match';
  } else if (analysis.atsScore >= 40) {
    scoreColor = '#d97706'; // Amber
    scoreText = 'Fair Match';
  }

  // Draw big score number
  doc.fillColor(scoreColor).fontSize(42).text(`${analysis.atsScore}%`, 70, 180, { font: 'Helvetica-Bold' });
  doc.fontSize(11).fillColor(cText).text('Overall ATS Score', 70, 230, { font: 'Helvetica' });

  // Draw formatting & length sub-scores
  doc.fillColor(cSlate).fontSize(14).text(`Formatting Score: ${analysis.formattingScore || 80}%`, 250, 185, { font: 'Helvetica-Bold' });
  doc.fontSize(14).text(`Resume Length Score: ${analysis.lengthScore || 80}%`, 250, 210);
  doc.fillColor(scoreColor).fontSize(12).text(`Category: ${scoreText}`, 250, 235);
  doc.moveDown(4);

  // Resume Strengths & Weaknesses
  let currentY = 290;
  doc.fillColor(cDark).fontSize(14).text('Profile Strengths', 50, currentY, { font: 'Helvetica-Bold' });
  doc.fillColor(cDark).fontSize(14).text('Profile Weaknesses', 310, currentY);
  
  doc.lineWidth(1).strokeColor('#e2e8f0').moveTo(50, currentY + 18).lineTo(280, currentY + 18).stroke();
  doc.moveTo(310, currentY + 18).lineTo(562, currentY + 18).stroke();

  let leftY = currentY + 30;
  doc.fillColor(cText).fontSize(10);
  const strengths = analysis.strengths || [];
  if (strengths.length > 0) {
    strengths.slice(0, 3).forEach(str => {
      doc.text(`* ${str}`, 50, leftY, { width: 230, font: 'Helvetica' });
      leftY += doc.heightOfString(`* ${str}`, { width: 230 }) + 8;
    });
  } else {
    doc.text('No core strengths parsed.', 50, leftY);
  }

  let rightY = currentY + 30;
  const weaknesses = analysis.weaknesses || [];
  if (weaknesses.length > 0) {
    weaknesses.slice(0, 3).forEach(wk => {
      doc.text(`* ${wk}`, 310, rightY, { width: 250 });
      rightY += doc.heightOfString(`* ${wk}`, { width: 250 }) + 8;
    });
  } else {
    doc.text('No core weaknesses detected.', 310, rightY);
  }

  // --- PAGE 2: SKILLS GAP & SUGGESTIONS ---
  doc.addPage();
  
  doc.fontSize(10).fillColor(cPurple).text('AI RESUME ANALYZER - SKILLS & KEYWORDS', { characterSpacing: 1.5 });
  doc.lineWidth(1).strokeColor('#e2e8f0').moveTo(50, 70).lineTo(562, 70).stroke();
  doc.moveDown(2);

  doc.fontSize(14).fillColor(cDark).text('Technical Skill Breakdown', 50, 85, { font: 'Helvetica-Bold' });
  doc.moveDown(1);

  // Matched Skills list
  doc.fontSize(11).fillColor(cGreen).text('Matched Skills/Keywords (Found in Resume):', { font: 'Helvetica-Bold' });
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor(cText);
  const matched = [...(analysis.matchDetails?.matchedSkills || []), ...(analysis.matchDetails?.matchedKeywords || [])];
  if (matched.length > 0) {
    doc.text(matched.join('  |  '), { width: 512, lineGap: 4 });
  } else {
    doc.text('No matching technical keywords found.');
  }
  doc.moveDown(2.5);

  // Missing Skills list
  doc.fontSize(11).fillColor(cRed).text('Missing Skills/Keywords (Absent in Resume):', 50, doc.y, { font: 'Helvetica-Bold' });
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor(cText);
  const missing = [...(analysis.matchDetails?.missingSkills || []), ...(analysis.matchDetails?.missingKeywords || [])];
  if (missing.length > 0) {
    doc.text(missing.slice(0, 35).join('  |  '), { width: 512, lineGap: 4 });
  } else {
    doc.text('No major missing skills identified.');
  }
  doc.moveDown(3);

  // Recommended improvements list
  doc.fontSize(14).fillColor(cDark).text('Actionable Suggestions for Improvement', 50, doc.y, { font: 'Helvetica-Bold' });
  doc.lineWidth(1).strokeColor('#e2e8f0').moveTo(50, doc.y + 4).lineTo(562, doc.y + 4).stroke();
  doc.moveDown(1.5);
  
  doc.fontSize(9.5).fillColor(cText);
  const suggestions = analysis.suggestions || [];
  if (suggestions.length > 0) {
    suggestions.forEach(sug => {
      doc.text(`- ${sug}`, { width: 512, lineGap: 6 });
      doc.moveDown(0.3);
    });
  } else {
    doc.text('Resume layout and syntax are excellent! No suggested improvements.');
  }

  // --- PAGE 3: INTERVIEW PREPARATION (IF GENERATED) ---
  const qList = analysis.interviewQuestions || [];
  if (qList.length > 0) {
    doc.addPage();
    doc.fontSize(10).fillColor(cPurple).text('AI RESUME ANALYZER - INTERVIEW PREPARATION', { characterSpacing: 1.5 });
    doc.lineWidth(1).strokeColor('#e2e8f0').moveTo(50, 70).lineTo(562, 70).stroke();
    doc.moveDown(2);

    doc.fontSize(14).fillColor(cDark).text('Tailored Interview Questions & Answers', 50, 85, { font: 'Helvetica-Bold' });
    doc.moveDown(1.5);

    qList.forEach((item, index) => {
      doc.fontSize(11).fillColor(cDark).text(`Q${index + 1}. [${item.type.toUpperCase()}] ${item.question}`, { font: 'Helvetica-Bold' });
      doc.moveDown(0.3);
      doc.fontSize(9.5).fillColor(cText).text(`Suggested Answer: ${item.answer}`, { font: 'Helvetica', lineGap: 3 });
      doc.moveDown(1.5);
    });
  }

  // Finalize PDF
  doc.end();
}

module.exports = {
  generateAnalysisPDF
};
