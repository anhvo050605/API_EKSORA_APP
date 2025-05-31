const mongoose = require('mongoose');

const tourServiceSchema = new mongoose.Schema({
  tour_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: true
  },
  service_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TourService', tourServiceSchema);
