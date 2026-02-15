const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  posted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Posted by user ID is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  notice_type: {
    type: String,
    required: [true, 'Notice type is required'],
    enum: ['announcement', 'event', 'maintenance', 'alert', 'general', 'other'],
    lowercase: true
  },
  attachment_url: {
    type: String,
    default: null
  },
  is_official: {
    type: Boolean,
    default: false
  },
  expiry_date: {
    type: Date,
    default: null
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
noticeSchema.index({ posted_by: 1 });
noticeSchema.index({ notice_type: 1 });
noticeSchema.index({ is_deleted: 1 });
noticeSchema.index({ expiry_date: 1 });
noticeSchema.index({ created_at: -1 });

module.exports = mongoose.model('Notice', noticeSchema);
