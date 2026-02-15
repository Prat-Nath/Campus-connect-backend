const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reported_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reported by user ID is required']
  },
  entity_type: {
    type: String,
    required: [true, 'Entity type is required'],
    enum: ['user', 'activity', 'lost_found_post', 'food_request', 'notice', 'message', 'other'],
    lowercase: true
  },
  entity_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Entity ID is required']
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'dismissed'],
    default: 'pending'
  },
  reviewed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolved_at: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes
reportSchema.index({ reported_by: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ entity_type: 1 });
reportSchema.index({ entity_id: 1 });

module.exports = mongoose.model('Report', reportSchema);
