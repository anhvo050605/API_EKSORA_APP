const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  price_child: { type: Number, required: true },
  image: [{ type: String }],
  // duration: { type: String },
  location: { type: String },
  rating: { type: Number },
  cateID: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  // province: { type: String, required: true },
  opening_time: { type: String }, // giờ mở cửa
  closing_time: { type: String }, // giờ đóng cửa
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tour', tourSchema);