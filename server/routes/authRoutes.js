const express = require('express');
const { body } = require('express-validator');
const { register, getMe, login } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', authMiddleware, getMe);

router.post(
  '/login',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('A valid email is required')
      .normalizeEmail(),
    body('password')
      .isString()
      .notEmpty()
      .withMessage('Password is required'),
  ],
  login
);

router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('A valid email is required')
      .normalizeEmail(),
    body('password')
      .isString()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  register
);

module.exports = router;
