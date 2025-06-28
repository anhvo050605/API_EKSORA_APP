const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  payment_method: { type: String, default: 'PayOS' },
  status: { type: String, enum: ['success', 'failed'], default: 'success' },
  payment_date: { type: Date, default: Date.now },
  transaction_id: { type: String }, // Mã giao dịch từ PayOS
  order_code: { type: String }, // Chính là booking._id từ orderCode PayOS
});

module.exports = mongoose.model('Transaction', transactionSchema);
