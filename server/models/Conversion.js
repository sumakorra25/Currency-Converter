const mongoose = require('mongoose');

const conversionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    from: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    to: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    result: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

conversionSchema.index({ user: 1 });

module.exports = mongoose.model('Conversion', conversionSchema);
