const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  title: { type: String },
  link: { type: String }, // link khi click banner (nếu cần)
});

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;
