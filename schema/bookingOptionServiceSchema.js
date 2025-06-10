const mongoose = require('mongoose');

const bookingOptionServiceSchema = new mongoose.Schema({
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  option_service_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OptionService',
    required: true,
  },
  
  status: {
    type: String,
    enum: ['active', 'cancelled'],
    default: 'active'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BookingOptionService', bookingOptionServiceSchema);
