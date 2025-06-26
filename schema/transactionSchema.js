const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  amount: { type: Number, required: true },
  payment_method: { type: String, required: true }, // 'PayOS', 'ZaloPay', ...
  status: { type: String, enum: ['success', 'failed'], required: true },
  payment_date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transaction', transactionSchema);
