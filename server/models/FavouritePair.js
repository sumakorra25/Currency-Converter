const mongoose = require('mongoose');

const favouritePairSchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);

favouritePairSchema.index({ user: 1, from: 1, to: 1 }, { unique: true });

module.exports = mongoose.model('FavouritePair', favouritePairSchema);
