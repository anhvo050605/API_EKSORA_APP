const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: String,
  description: String,
  image_url: String,
  province_code: String,
  type: String, // landmark, food, nature, etc
  location: {
    lat: Number,
    lng: Number,
  },
});

module.exports = mongoose.model('Place', placeSchema);