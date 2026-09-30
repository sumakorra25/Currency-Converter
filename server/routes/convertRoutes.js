const express = require('express');
const { query } = require('express-validator');
const { convertAmount } = require('../controllers/convertController');

const router = express.Router();

router.get(
  '/',
  [
    query('from')
      .trim()
      .matches(/^[A-Za-z]{3}$/)
      .withMessage('from must be a 3-letter currency code'),
    query('to')
      .trim()
      .matches(/^[A-Za-z]{3}$/)
      .withMessage('to must be a 3-letter currency code'),
    query('amount')
      .isFloat({ gt: 0 })
      .withMessage('amount must be a number greater than 0'),
  ],
  convertAmount
);

module.exports = router;
