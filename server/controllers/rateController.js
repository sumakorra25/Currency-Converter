const { validationResult } = require('express-validator');
const {
  getLatestRates,
  isSupportedCurrency,
} = require('../services/rateService');

const getLatest = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Invalid base currency',
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  const base = (req.query.base || 'USD').toUpperCase();

  try {
    const supported = await isSupportedCurrency(base);

    if (!supported) {
      return res.status(400).json({
        message: `Unsupported currency: ${base}`,
      });
    }

    const latestRates = await getLatestRates(base);
    return res.status(200).json(latestRates);
  } catch (error) {
    return res.status(502).json({
      message: error.message || 'Unable to fetch latest exchange rates',
    });
  }
};

module.exports = { getLatest };
