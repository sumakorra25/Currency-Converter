const { getSupportedCurrencies } = require('../services/rateService');

const listCurrencies = async (req, res) => {
  try {
    const currencies = await getSupportedCurrencies();
    return res.status(200).json(currencies);
  } catch (error) {
    return res.status(error.statusCode || 503).json({
      message: error.message || 'Currency provider is unavailable',
    });
  }
};

module.exports = { listCurrencies };
