const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  tour_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: true
  },
  name: {
    type: String,
    required: true // VD: "Chỗ ở", "Ăn uống", "Di chuyển"
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Service', serviceSchema);
