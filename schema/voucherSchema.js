const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  discount: {
    type: Number,
    required: true // Phần trăm giảm giá
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'used'],
    default: 'active'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Voucher', voucherSchema);
