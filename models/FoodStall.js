const mongoose = require('mongoose');

const foodStallSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Stall name is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Index
foodStallSchema.index({ is_active: 1 });

module.exports = mongoose.model('FoodStall', foodStallSchema);
