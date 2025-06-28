const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transaction_id: String,
  order_code: String,
  amount: Number,
  payment_method: String,
  status: { type: String, enum: ['success', 'failed', 'pending'], default: 'success' },
  payment_date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
