const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderCode: { type: Number, required: true, unique: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
  checkoutUrl: { type: String },
  transactionId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', paymentSchema);
