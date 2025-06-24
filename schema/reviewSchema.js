const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  promotion_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion', required: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },     // ✅ sửa lại dòng này
  tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },     // ✅ sửa tương tự
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: false },
  status: { type: String, default: 'pending' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);

