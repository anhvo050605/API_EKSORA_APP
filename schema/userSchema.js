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
    required: function() {
      // Không require password cho Google/Facebook login
      return this.loginType === 'normal' || !this.loginType;
    },
    default: ''
  },
  first_name: { type: String },
  last_name: { type: String },
  phone: { 
    type: String,
    required: function() {
      // Chỉ require phone cho normal login, không require cho Facebook/Google login
      if (this.isNew && (this.loginType === 'facebook' || this.loginType === 'google')) {
        return false;
      }
      return this.loginType === 'normal' || !this.loginType;
    },
    unique: true,
    sparse: true, // Cho phép nhiều giá trị null/undefined nhưng unique khi có giá trị
    default: ''
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
  loginType: {
    type: String,
    enum: ['normal', 'facebook', 'google'],
    default: 'normal'
  },
  
  facebookUid: {
    type: String,
    sparse: true, // Allows multiple null/undefined values
    unique: true, // But unique when it exists
    validate: {
      validator: function(v) {
        // Nếu loginType là facebook thì phải có facebookUid
        if (this.loginType === 'facebook') {
          return v && v.length > 0;
        }
        return true;
      },
      message: 'Facebook UID is required for Facebook login'
    }
  },
  
  googleUid: {
    type: String,
    sparse: true,
    unique: true,
    validate: {
      validator: function(v) {
        // Nếu loginType là google thì phải có googleUid
        if (this.loginType === 'google') {
          return v && v.length > 0;
        }
        return true;
      },
      message: 'Google UID is required for Google login'
    }
  },
  
  lastLogin: {
    type: Date,
    default: null
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update updatedAt before saving
userSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = new Date();
  }
  next();
});

// Middleware to update lastLogin for social login
userSchema.pre('save', function(next) {
  if (this.loginType === 'facebook' || this.loginType === 'google') {
    this.lastLogin = new Date();
  }
  next();
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ facebookUid: 1 });
userSchema.index({ googleUid: 1 });
userSchema.index({ loginType: 1 });
userSchema.index({ created_at: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.first_name || ''} ${this.last_name || ''}`.trim();
});

// Method to check if user is social login
userSchema.methods.isSocialLogin = function() {
  return this.loginType === 'facebook' || this.loginType === 'google';
};

// Static method to find by social UID
userSchema.statics.findBySocialUid = function(uid, provider) {
  const field = provider === 'facebook' ? 'facebookUid' : 'googleUid';
  return this.findOne({ [field]: uid });
};

// Static method to find or create social user
userSchema.statics.findOrCreateSocialUser = async function(profile, provider) {
  try {
    // Tìm user bằng social UID
    let user = await this.findBySocialUid(profile.id, provider);
    
    if (user) {
      // Update lastLogin và return user
      user.lastLogin = new Date();
      await user.save();
      return user;
    }
    
    // Tìm user bằng email nếu có
    if (profile.email) {
      user = await this.findOne({ email: profile.email });
      if (user) {
        // Link social account với existing user
        if (provider === 'facebook') {
          user.facebookUid = profile.id;
        } else {
          user.googleUid = profile.id;
        }
        user.loginType = provider;
        user.lastLogin = new Date();
        await user.save();
        return user;
      }
    }
    
    // Tạo user mới
    const newUserData = {
      email: profile.email || '',
      first_name: profile.first_name || profile.name?.split(' ')[0] || '',
      last_name: profile.last_name || profile.name?.split(' ').slice(1).join(' ') || '',
      avatar: profile.picture || profile.photos?.[0]?.value || '',
      loginType: provider,
      lastLogin: new Date()
    };
    
    if (provider === 'facebook') {
      newUserData.facebookUid = profile.id;
    } else {
      newUserData.googleUid = profile.id;
    }
    
    user = new this(newUserData);
    await user.save();
    return user;
    
  } catch (error) {
    throw error;
  }
};

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password; // Never return password in JSON
    delete ret.resetPasswordOTP; // Don't return sensitive OTP data
    delete ret.otp; // Don't return OTP
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);