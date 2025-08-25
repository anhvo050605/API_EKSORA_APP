const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  price_child: { type: Number },
  image: [{ type: String }],
  // duration: { type: String },
  location: { type: String },
  rating: { type: Number },
  cateID: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // province: { type: String, required: true },
  opening_time: { type: String }, // giờ mở cửa
  closing_time: { type: String }, // giờ đóng cửa
  max_tickets_per_day: { type: Number, default: 50 },
  status: {
    type: String,
    enum: ['requested', 'active', 'deactive'],
    default: 'active'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
  },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tour', tourSchema);