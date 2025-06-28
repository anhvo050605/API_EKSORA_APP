const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  first_name: { type: String },
  last_name: { type: String },
  phone: { type: String },
  address: { type: String },

  role: {
    type: String,
    enum: ['user', 'admin', 'supplier'],
    default: 'user'
  },

  avatar: { type: String },           
  is_active: { type: Boolean, default: true },

  coin_total: { type: Number, default: 0 },   
  created_at: { type: Date, default: Date.now },

  resetPasswordOTP: { type: String },
  resetPasswordExpires: { type: Date },

  otp: { type: String },
  otpExpiry: { type: Date }
});
module.exports = mongoose.model('User', userSchema);