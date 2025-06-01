const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  amount: Number,
  payment_date: Date,
  payment_method: String,
  status: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Transaction", transactionSchema);
