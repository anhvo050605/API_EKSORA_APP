const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  image: { type: String },
  cateID: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tour', tourSchema);
