const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { saveUser, findUserByEmail, findUserById } = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'resume_saas_super_secret_key';

/**
 * Handle user registration
 */
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // 1. Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }
    if (!email || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // 2. Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Save User
    const newUser = await saveUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword
    });

    // 5. Sign Token
    const token = jwt.sign(
      { id: newUser._id, name: newUser.name, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 6. Write JWT Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to true if deploying in production HTTPS
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days
    });

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });

  } catch (err) {
    console.error('Registration API Error:', err);
    res.status(500).json({ error: err.message || 'An error occurred during account creation.' });
  }
}

/**
 * Handle user login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // 2. Find User
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // 3. Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // 4. Sign Token
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Write JWT Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to true if deploying in production HTTPS
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days
    });

    res.json({
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error('Login API Error:', err);
    res.status(500).json({ error: 'An error occurred during login.' });
  }
}

/**
 * Clear User session / cookies
 */
function logout(req, res) {
  res.clearCookie('token');
  res.json({ message: 'Session closed and logged out successfully.' });
}

/**
 * Get profile of current logged in user
 */
async function getProfile(req, res) {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error('Get Profile API Error:', err);
    res.status(500).json({ error: 'Failed to retrieve profile details.' });
  }
}

module.exports = {
  register,
  login,
  logout,
  getProfile
};
