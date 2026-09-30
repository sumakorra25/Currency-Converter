const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const getMe = (req, res) => {
  res.status(200).json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    },
  });
};

const login = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Invalid login request',
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const register = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Invalid input',
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    return next(error);
  }
};

module.exports = { register, getMe, login };
