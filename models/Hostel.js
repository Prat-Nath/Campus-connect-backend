const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hostel name is required'],
    trim: true
  },
  block: {
    type: String,
    required: [true, 'Block is required'],
    trim: true
  },
  gender_type: {
    type: String,
    required: [true, 'Gender type is required'],
    enum: ['male', 'female', 'co-ed'],
    lowercase: true
  },
  total_rooms: {
    type: Number,
    required: [true, 'Total rooms is required'],
    min: [1, 'Total rooms must be at least 1']
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes
hostelSchema.index({ name: 1 });
hostelSchema.index({ block: 1 });

module.exports = mongoose.model('Hostel', hostelSchema);
