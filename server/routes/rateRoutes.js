const express = require('express');
const { query } = require('express-validator');
const { getLatest } = require('../controllers/rateController');

const router = express.Router();

router.get(
  '/latest',
  [
    query('base')
      .optional()
      .trim()
      .matches(/^[A-Za-z]{3}$/)
      .withMessage('Base currency must be a 3-letter code'),
  ],
  getLatest
);

module.exports = router;
