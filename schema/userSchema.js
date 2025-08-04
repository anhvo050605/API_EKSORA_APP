const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
  },
  first_name: { type: String },
  last_name: { type: String },
  phone: { 
    type: String,
   
  },
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
  
  // Reset password fields
  resetPasswordOTP: { type: String },
  resetPasswordExpires: { type: Date },
  
  // OTP fields
  otp: { type: String },
  otpExpiry: { type: Date },
  
  // Social login fields
  
});

// Middleware to update updatedAt before saving


module.exports = mongoose.model('User', userSchema);