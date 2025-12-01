const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  logout,
} = require('../controllers/authController');
const protect = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');
const {
  registerValidator,
  loginValidator,
} = require('../validators/authValidator');

// Public routes
router.post('/register', authLimiter, registerValidator, register);
router.post('/login', authLimiter, loginValidator, login);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
