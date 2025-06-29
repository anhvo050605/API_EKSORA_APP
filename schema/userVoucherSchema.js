const mongoose = require('mongoose');

const userVoucherSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  voucher_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher',
    required: true,
  },
  saved_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UserVoucher', userVoucherSchema);
