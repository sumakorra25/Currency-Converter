const axios = require('axios');

const CURRENCIES_URL = 'https://api.frankfurter.dev/v2/currencies';
const RATES_URL = 'https://api.frankfurter.dev/v2/rates';
const CURRENCIES_CACHE_TTL = 24 * 60 * 60 * 1000;
const RATES_CACHE_TTL = 5 * 60 * 1000;

let currenciesCache = null;
let currenciesCachedAt = 0;
const ratesCache = new Map();

const getSupportedCurrencies = async () => {
  const cacheIsFresh =
    currenciesCache && Date.now() - currenciesCachedAt < CURRENCIES_CACHE_TTL;

  if (cacheIsFresh) {
    return currenciesCache;
  }

  try {
    const response = await axios.get(CURRENCIES_URL, { timeout: 10000 });
    const currencies = response.data
      .filter((currency) => currency.iso_code && currency.name)
      .map((currency) => ({
        code: currency.iso_code.toUpperCase(),
        name: currency.name,
      }));

    if (!currencies.length) {
      const error = new Error('Currency provider returned no currencies');
      error.statusCode = 502;
      throw error;
    }

    currenciesCache = currencies;
    currenciesCachedAt = Date.now();
    return currenciesCache;
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    const providerError = new Error('Currency provider is unavailable');
    providerError.statusCode = 503;
    throw providerError;
  }
};

const isSupportedCurrency = async (code) => {
  if (typeof code !== 'string') {
    return false;
  }

  const currencies = await getSupportedCurrencies();
  const normalizedCode = code.trim().toUpperCase();
  return currencies.some((currency) => currency.code === normalizedCode);
};

const getLatestRates = async (base) => {
  const normalizedBase = base.toUpperCase();
  const cachedRates = ratesCache.get(normalizedBase);

  if (cachedRates && Date.now() - cachedRates.cachedAt < RATES_CACHE_TTL) {
    return cachedRates.data;
  }

  try {
    const response = await axios.get(RATES_URL, {
      params: { base: normalizedBase },
      timeout: 10000,
    });
    const rows = response.data;

    if (!Array.isArray(rows) || !rows.length) {
      throw new Error('Rate provider returned no rates');
    }

    const rates = { [normalizedBase]: 1 };
    rows.forEach((row) => {
      if (row.quote && typeof row.rate === 'number') {
        rates[row.quote.toUpperCase()] = row.rate;
      }
    });

    const data = {
      base: normalizedBase,
      date: rows[0].date,
      rates,
    };

    ratesCache.set(normalizedBase, { data, cachedAt: Date.now() });
    return data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    const providerError = new Error('Unable to fetch latest exchange rates');
    providerError.statusCode = 502;
    throw providerError;
  }
};

module.exports = { getSupportedCurrencies, isSupportedCurrency, getLatestRates };
