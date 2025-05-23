const mongoose = require('mongoose');

const optionServiceSchema = new mongoose.Schema({
  tour_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tour', 
    required: true 
  },
  title: { 
    type: String, 
    required: true // VD: "Người lớn" / "Trẻ em"
  },
  description: { 
    type: String 
  },
  price_extra: { 
    type: Number, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['adult', 'child'], 
    required: true 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('OptionService', optionServiceSchema);
