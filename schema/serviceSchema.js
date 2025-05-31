// schema/serviceSchema.js
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  tour_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
  name: { type: String, required: true }, // Ví dụ: 'Group size', 'Guide options'
  type: {
    type: String,
    enum: ['single', 'multiple'], // 'single' = chọn 1, 'multiple' = chọn nhiều
    default: 'single'
  },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Service', serviceSchema);
