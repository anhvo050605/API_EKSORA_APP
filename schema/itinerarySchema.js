const mongoose = require('mongoose');
const itinerarySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  start_date: Date,
  end_date: Date,
  plan: [
    {
      day: Number,
      location: String,
      activity: String,
      place_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Place' },
    },
  ],
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Itinerary', itinerarySchema);