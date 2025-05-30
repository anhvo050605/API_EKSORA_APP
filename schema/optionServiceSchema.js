const mongoose = require('mongoose');

const optionServiceSchema = new mongoose.Schema({
  service_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  title: {
    type: String,
    required: true // VD: "Khách sạn 3 sao", "Homestay"
  },
  description: String,
  price_extra: {
    type: Number,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('OptionService', optionServiceSchema);
