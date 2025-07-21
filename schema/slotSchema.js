const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  tour_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tour",
    required: true,
  },
  travel_date: {
    type: Date,
    required: true,
  },
  remainingTickets: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("Slot", slotSchema);