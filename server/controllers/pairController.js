const { validationResult } = require('express-validator');
const FavouritePair = require('../models/FavouritePair');
const { isSupportedCurrency } = require('../services/rateService');
const {
  getPagination,
  createPaginationResponse,
} = require('../utils/pagination');

const getPair = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Invalid favourite pair ID',
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  try {
    const pair = await FavouritePair.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).lean();

    if (!pair) {
      return res.status(404).json({ message: 'Favourite pair not found' });
    }

    return res.status(200).json(pair);
  } catch (error) {
    return next(error);
  }
};

const updatePair = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Invalid favourite pair update',
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  const hasEditableField = ['from', 'to'].some((field) =>
    Object.prototype.hasOwnProperty.call(req.body, field)
  );

  if (!hasEditableField) {
    return res.status(400).json({
      message: 'At least one of from or to is required',
    });
  }

  try {
    const existingPair = await FavouritePair.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).lean();

    if (!existingPair) {
      return res.status(404).json({ message: 'Favourite pair not found' });
    }

    const from = req.body.from === undefined
      ? existingPair.from
      : req.body.from.toUpperCase();
    const to = req.body.to === undefined
      ? existingPair.to
      : req.body.to.toUpperCase();

    if (from === to) {
      return res.status(400).json({
        message: 'from and to currencies must be different',
      });
    }

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

    const pair = await FavouritePair.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { from, to } },
      { new: true, runValidators: true }
    ).lean();

    if (!pair) {
      return res.status(404).json({ message: 'Favourite pair not found' });
    }

    return res.status(200).json(pair);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Favourite pair already exists' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid favourite pair' });
    }

    if (error.statusCode === 502 || error.message === 'Currency provider is unavailable') {
      return res.status(502).json({ message: error.message });
    }

    return next(error);
  }
};

const deletePair = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Invalid favourite pair ID',
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  try {
    const deletedPair = await FavouritePair.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!deletedPair) {
      return res.status(404).json({ message: 'Favourite pair not found' });
    }

    return res.status(200).json({ message: 'Pair deleted' });
  } catch (error) {
    return next(error);
  }
};

const listPairs = async (req, res, next) => {
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
      FavouritePair.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FavouritePair.countDocuments(filter),
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

const createPair = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Invalid favourite pair',
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  const from = req.body.from.toUpperCase();
  const to = req.body.to.toUpperCase();

  if (from === to) {
    return res.status(400).json({
      message: 'from and to currencies must be different',
    });
  }

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

    const pair = await FavouritePair.create({
      user: req.user._id,
      from,
      to,
    });

    return res.status(201).json(pair);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Favourite pair already exists' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid favourite pair' });
    }

    if (error.statusCode === 502 || error.message === 'Currency provider is unavailable') {
      return res.status(502).json({ message: error.message });
    }

    return next(error);
  }
};

module.exports = {
  createPair,
  listPairs,
  getPair,
  updatePair,
  deletePair,
};
