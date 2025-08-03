const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  first_name: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  last_name: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  password: {
    type: String,
    required: function() {
      return this.loginType === 'normal' || !this.loginType;
    },
    minlength: [6, 'Password must be at least 6 characters'],
    default: ''
  },
  phone: {
    type: String,
    required: function() {
      if (this.isNew && (this.loginType === 'facebook' || this.loginType === 'google')) {
        return false;
      }
      return this.loginType === 'normal' || !this.loginType;
    },
    default: '',
    validate: {
      validator: function(v) {
        if (!v || v === '') return true;
        return /^[0-9]{10,15}$/.test(v);
      },
      message: 'Phone number must be 10-15 digits'
    }
  },
  avatar: {
    type: String,
    default: '',
    trim: true
  },
  loginType: {
    type: String,
    enum: ['normal', 'facebook', 'google'],
    default: 'normal'
  },
  facebookUid: {
    type: String,
    sparse: true,
    unique: true,
    validate: {
      validator: function(v) {
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
    unique: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'supplier'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
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

// Only KEEP indexes that are NOT duplicate with unique constraints
userSchema.index({ loginType: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.first_name} ${this.last_name}`.trim();
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

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password; // Never return password in JSON
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
