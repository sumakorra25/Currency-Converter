const express = require('express');
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const {
  createConversion,
  listConversions,
  getConversion,
  updateConversion,
  deleteConversion,
  getConversionStats,
} = require('../controllers/conversionController');

const router = express.Router();

router.get(
  '/',
  authMiddleware,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('page must be an integer greater than 0'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('limit must be an integer between 1 and 50'),
  ],
  listConversions
);

router.post(
  '/',
  authMiddleware,
  [
    body('from')
      .trim()
      .matches(/^[A-Za-z]{3}$/)
      .withMessage('from must be a 3-letter currency code'),
    body('to')
      .trim()
      .matches(/^[A-Za-z]{3}$/)
      .withMessage('to must be a 3-letter currency code'),
    body('amount')
      .isFloat({ gt: 0 })
      .withMessage('amount must be a number greater than 0'),
  ],
  createConversion
);

router.get('/stats', authMiddleware, getConversionStats);

router.get(
  '/:id',
  authMiddleware,
  [param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId')],
  getConversion
);

router.put(
  '/:id',
  authMiddleware,
  [
    param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId'),
    body('from')
      .optional()
      .trim()
      .matches(/^[A-Za-z]{3}$/)
      .withMessage('from must be a 3-letter currency code'),
    body('to')
      .optional()
      .trim()
      .matches(/^[A-Za-z]{3}$/)
      .withMessage('to must be a 3-letter currency code'),
    body('amount')
      .optional()
      .isFloat({ gt: 0 })
      .withMessage('amount must be a number greater than 0'),
  ],
  updateConversion
);

router.delete(
  '/:id',
  authMiddleware,
  [param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId')],
  deleteConversion
);

module.exports = router;
