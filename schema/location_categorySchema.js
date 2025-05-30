const mongoose = require('mongoose');

const CategoryTourSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

module.exports = mongoose.model('Category', CategoryTourSchema);