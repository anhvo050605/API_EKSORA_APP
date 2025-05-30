const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  payment_id: { type: String, required: true, unique: true },
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  sepay_transaction_id: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'VND' },
  payment_method_gateway: { type: String, default: 'SePay' },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  gateway_response_code: { type: String },
  payment_url: { type: String },
  paid_at: { type: Date },
}, { timestamps: true }); // createdAt & updatedAt auto

module.exports = mongoose.model('Payment', paymentSchema);
