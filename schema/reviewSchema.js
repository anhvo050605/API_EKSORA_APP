const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  promotion_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion', required: false },
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },

  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: false },
  images: [{ type: String }], 
  status: { type: String, default: 'pending' }, // vd: 'active', 'pending', 'blocked'
  created_at: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
