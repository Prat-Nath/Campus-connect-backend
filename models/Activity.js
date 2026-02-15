const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  creator_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator ID is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  activity_type: {
    type: String,
    required: [true, 'Activity type is required'],
    enum: ['sports', 'study', 'gaming', 'entertainment', 'food', 'travel', 'other'],
    lowercase: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  activity_time: {
    type: Date,
    required: [true, 'Activity time is required']
  },
  required_participants: {
    type: Number,
    default: 1,
    min: [1, 'Required participants must be at least 1']
  },
  max_participants: {
    type: Number,
    required: [true, 'Max participants is required'],
    min: [1, 'Max participants must be at least 1']
  },
  status: {
    type: String,
    enum: ['open', 'full', 'ongoing', 'completed', 'cancelled'],
    default: 'open'
  },
  is_private: {
    type: Boolean,
    default: false
  },
  is_deleted: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes
activitySchema.index({ creator_id: 1 });
activitySchema.index({ activity_type: 1 });
activitySchema.index({ status: 1 });
activitySchema.index({ activity_time: 1 });
activitySchema.index({ is_deleted: 1 });

module.exports = mongoose.model('Activity', activitySchema);
