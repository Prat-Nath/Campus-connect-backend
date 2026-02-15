const mongoose = require('mongoose');

const lostFoundPostSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  post_type: {
    type: String,
    required: [true, 'Post type is required'],
    enum: ['lost', 'found'],
    lowercase: true
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
  image_url: {
    type: String,
    default: null
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  incident_time: {
    type: Date,
    required: [true, 'Incident time is required']
  },
  status: {
    type: String,
    enum: ['active', 'claimed', 'resolved', 'closed'],
    default: 'active'
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
lostFoundPostSchema.index({ user_id: 1 });
lostFoundPostSchema.index({ post_type: 1 });
lostFoundPostSchema.index({ status: 1 });
lostFoundPostSchema.index({ is_deleted: 1 });

module.exports = mongoose.model('LostFoundPost', lostFoundPostSchema);
