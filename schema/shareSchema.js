const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
  shareId: {
    type: String,
    required: true,
    unique: true,
  },
  deepLink: {
    type: String,
    required: true,
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Share', shareSchema);
