const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['activity', 'lost_found', 'food_request', 'roommate_issue', 'notice', 'reward', 'system', 'other'],
    lowercase: true
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true
  },
  reference_type: {
    type: String,
    enum: ['activity', 'lost_found_post', 'food_request', 'roommate_issue', 'notice', 'reward_transaction', 'other'],
    default: null,
    lowercase: true
  },
  reference_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  is_read: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes
notificationSchema.index({ user_id: 1, is_read: 1 });
notificationSchema.index({ created_at: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
