const express = require('express');
const router = express.Router();
const { register, login, logout, getProfile } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Public endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected endpoints (Requires valid JWT)
router.get('/profile', authMiddleware, getProfile);

module.exports = router;
