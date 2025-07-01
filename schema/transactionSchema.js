// schema/transactionSchema.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  amount: { type: Number, required: true },
  payment_date: { type: Date, default: Date.now },
  payment_method: { type: String, required: true },
  status: { type: String, enum: ['paid', 'failed'], required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transaction', transactionSchema);
