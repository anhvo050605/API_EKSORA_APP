const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tour_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
  booking_date: { type: Date, default: Date.now },
  travel_date: { type: Date, required: true },
  coin: { type: Number, default: 0 },
  quantity_nguoiLon: { type: Number, default: 0 },
  quantity_treEm: { type: Number, default: 0 },
  // price_nguoiLon: { type: Number, default: 0 },
  // price_treEm: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 },
  transaction_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  order_code: { type: Number, default: null } ,
  voucher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' },
  status: {
    type: String,
    enum: [
      'pending',            // Đang chờ xác nhận
      'paid',               // Đã thanh toán
      'ongoing',            // Đang diễn ra
      'completed',          // Đã hoàn thành
      'canceled',           // Đã huỷ
      // 'refund_requested',   // Yêu cầu hoàn tiền
      // 'refunded',           // Đã hoàn tiền
      'expired'             // Quá hạn thanh toán
    ],
    default: 'pending'
  },
  created_at: { type: Date, default: Date.now },
  last_update: {type: Date, default: Date.now },
});

module.exports = mongoose.model('Booking', bookingSchema);
