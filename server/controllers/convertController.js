const { validationResult } = require('express-validator');
const {
  getLatestRates,
  isSupportedCurrency,
} = require('../services/rateService');

const convertAmount = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Invalid conversion request',
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  const from = req.query.from.toUpperCase();
  const to = req.query.to.toUpperCase();
  const amount = Number(req.query.amount);

  try {
    const [fromSupported, toSupported] = await Promise.all([
      isSupportedCurrency(from),
      isSupportedCurrency(to),
    ]);

    if (!fromSupported || !toSupported) {
      const unsupported = !fromSupported ? from : to;
      return res.status(400).json({
        message: `Unsupported currency: ${unsupported}`,
      });
    }

    const latestRates = await getLatestRates(from);
    const rate = from === to ? 1 : latestRates.rates[to];

    if (typeof rate !== 'number') {
      return res.status(502).json({
        message: 'Exchange rate is unavailable for this currency pair',
      });
    }

    return res.status(200).json({
      from,
      to,
      amount,
      rate,
      result: amount * rate,
      date: latestRates.date,
    });
  } catch (error) {
    return res.status(502).json({
      message: error.message || 'Unable to convert currency',
    });
  }
};

module.exports = { convertAmount };
