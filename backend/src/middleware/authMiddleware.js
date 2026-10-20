const jwt = require('jsonwebtoken');

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    if (parts.length === 2) {
      cookies[parts[0].trim()] = parts[1].trim();
    }
  });
  return cookies;
}

/**
 * Authentication middleware verifying JWT tokens
 */
function authMiddleware(req, res, next) {
  let token = null;

  // 1. Check Authorization Bearer Header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // 2. Check Cookie Fallback
  else if (req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    token = cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Authentication token is missing.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'resume_saas_super_secret_key');
    req.user = decoded; // Attach user details to the request object (id, name, email)
    next();
  } catch (err) {
    console.error('JWT Token Verification Error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

module.exports = authMiddleware;
