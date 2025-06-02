const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  orderCode: { type: Number, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: 'PENDING' }, // PENDING | SUCCESS | FAILED
  payUrl: { type: String },
  returnUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
