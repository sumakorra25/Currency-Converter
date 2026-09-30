const { validationResult } = require('express-validator');
const Conversion = require('../models/Conversion');
const {
  getLatestRates,
  isSupportedCurrency,
} = require('../services/rateService');
const {
  getPagination,
  createPaginationResponse,
} = require('../utils/pagination');

const getConversion = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Invalid conversion ID',
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  try {
    const conversion = await Conversion.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).lean();

    if (!conversion) {
      return res.status(404).json({ message: 'Conversion not found' });
    }

    return res.status(200).json(conversion);
  } catch (error) {
    return next(error);
  }
};

const getConversionStats = async (req, res, next) => {
  try {
    const stats = await Conversion.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: { from: '$from', to: '$to' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          from: '$_id.from',
          to: '$_id.to',
          count: 1,
        },
      },
    ]);

    return res.status(200).json(stats);
  } catch (error) {
    return next(error);
  }
};

const updateConversion = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Invalid conversion update',
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  const editableFields = ['from', 'to', 'amount'];
  const hasEditableField = editableFields.some((field) =>
    Object.prototype.hasOwnProperty.call(req.body, field)
  );

  if (!hasEditableField) {
    return res.status(400).json({
      message: 'At least one of from, to, or amount is required',
    });
  }

  try {
    const existingConversion = await Conversion.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).lean();

    if (!existingConversion) {
      return res.status(404).json({ message: 'Conversion not found' });
    }

    const from = req.body.from === undefined
      ? existingConversion.from
      : req.body.from.toUpperCase();
    const to = req.body.to === undefined
      ? existingConversion.to
      : req.body.to.toUpperCase();
    const amount = req.body.amount === undefined
      ? existingConversion.amount
      : Number(req.body.amount);

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

    const conversion = await Conversion.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { from, to, amount, rate, result: amount * rate } },
      { new: true, runValidators: true }
    ).lean();

    if (!conversion) {
      return res.status(404).json({ message: 'Conversion not found' });
    }

    return res.status(200).json(conversion);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid conversion data' });
    }

    if (error.statusCode === 502 || error.message === 'Currency provider is unavailable') {
      return res.status(502).json({ message: error.message });
    }

    return next(error);
  }
};

const deleteConversion = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Invalid conversion ID',
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  try {
    const deletedConversion = await Conversion.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!deletedConversion) {
      return res.status(404).json({ message: 'Conversion not found' });
    }

    return res.status(200).json({ message: 'Conversion deleted' });
  } catch (error) {
    return next(error);
  }
};

const listConversions = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Invalid pagination parameters',
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  const { page, limit, skip } = getPagination(req.query);
  const filter = { user: req.user._id };

  try {
    const [data, total] = await Promise.all([
      Conversion.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversion.countDocuments(filter),
    ]);

    return res.status(200).json(createPaginationResponse({
      data,
      page,
      limit,
      total,
    }));
  } catch (error) {
    return next(error);
  }
};

const createConversion = async (req, res, next) => {
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

  const from = req.body.from.toUpperCase();
  const to = req.body.to.toUpperCase();
  const amount = Number(req.body.amount);

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

    const conversionData = {
      user: req.user._id,
      from,
      to,
      amount,
      rate,
      result: amount * rate,
    };

    const conversion = await Conversion.create(conversionData);
    return res.status(201).json(conversion);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid conversion data' });
    }

    if (error.statusCode === 502 || error.message === 'Currency provider is unavailable') {
      return res.status(502).json({ message: error.message });
    }

    return next(error);
  }
};

module.exports = {
  createConversion,
  listConversions,
  getConversion,
  updateConversion,
  deleteConversion,
  getConversionStats,
};
