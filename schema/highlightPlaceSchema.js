const mongoose = require('mongoose');

const highlightPlaceSchema = new mongoose.Schema({
  location_name: { type: String, required: true },      // Tên địa điểm (ví dụ: Tam Cốc)
  image_url: { type: String, required: true },          // Link hình ảnh địa điểm
  description: { type: String },                        // Mô tả địa điểm (tùy chọn)
  province: { type: String, required: true },           // Tỉnh/thành phố (ví dụ: Ninh Binh)
  created_at: { type: Date, default: Date.now },
});

const HighlightPlace = mongoose.model('HighlightPlace', highlightPlaceSchema);

module.exports = HighlightPlace;
