const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  tour_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: false // Nếu null thì là voucher toàn app
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  discount: {
    type: Number,
    required: true // phần trăm giảm giá
  },
  condition: {
    type: String,
    default: '' // điều kiện (ví dụ: "Đơn hàng từ 1.000.000đ")
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
