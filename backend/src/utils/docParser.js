const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts plain text, emails, and phone numbers from document buffers
 * @param {Buffer} buffer - File buffer
 * @param {string} originalName - Name of the uploaded file
 * @returns {Promise<Object>} - Parsed raw text and extracted contact details
 */
async function parseDocument(buffer, originalName) {
  const extension = originalName.split('.').pop().toLowerCase();
  
  if (!buffer) {
    throw new Error('No file buffer provided.');
  }

  let rawText = '';

  switch (extension) {
    case 'pdf':
      rawText = await parsePDF(buffer);
      break;
    case 'docx':
      rawText = await parseDOCX(buffer);
      break;
    case 'txt':
      rawText = parseTXT(buffer);
      break;
    default:
      throw new Error(`Unsupported file format: .${extension}. Only PDF, DOCX, and TXT are supported.`);
  }

  // Extract contact info using regular expressions
  const email = extractEmail(rawText);
  const phone = extractPhone(rawText);

  return {
    rawText,
    email,
    phone
  };
}

async function parsePDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    if (!data || !data.text) {
      throw new Error('No readable text found in the PDF.');
    }
    return data.text;
  } catch (err) {
    console.error('PDF parsing error:', err);
    throw new Error('Failed to parse PDF file. The file may be corrupt or secured.');
  }
}

async function parseDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer: buffer });
    if (!result || !result.value) {
      throw new Error('No readable text found in the Word document.');
    }
    return result.value;
  } catch (err) {
    console.error('DOCX parsing error:', err);
    throw new Error('Failed to parse DOCX Word document.');
  }
}

function parseTXT(buffer) {
  try {
    const text = buffer.toString('utf8');
    if (!text.trim()) {
      throw new Error('The text file is empty.');
    }
    return text;
  } catch (err) {
    console.error('TXT parsing error:', err);
    throw new Error('Failed to parse TXT file.');
  }
}

// Contact parsing helpers
function extractEmail(text) {
  const emailRegex = /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : '';
}

function extractPhone(text) {
  // Regex supporting various international phone formats, e.g. +1-234-567-8900, (234) 567 8900, etc.
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const match = text.match(phoneRegex);
  return match ? match[0] : '';
}

module.exports = {
  parseDocument
};
