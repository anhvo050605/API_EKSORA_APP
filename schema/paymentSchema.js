const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  amount: { type: Number, required: true },
  payment_date: { type: Date, default: Date.now },
  payment_method: { type: String, enum: ["PayOS", "VNPay", "Momo", "Cash"], required: true },
  status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "PENDING" },
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);
