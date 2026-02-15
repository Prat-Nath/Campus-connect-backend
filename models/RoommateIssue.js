const mongoose = require('mongoose');

const roommateIssueSchema = new mongoose.Schema({
  raised_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Raised by user ID is required']
  },
  issue_category: {
    type: String,
    required: [true, 'Issue category is required'],
    enum: ['cleanliness', 'noise', 'privacy', 'sharing', 'behavior', 'other'],
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'escalated', 'closed'],
    default: 'open'
  },
  escalated_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolution_note: {
    type: String,
    default: null,
    trim: true
  },
  resolved_at: {
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
roommateIssueSchema.index({ raised_by: 1 });
roommateIssueSchema.index({ status: 1 });
roommateIssueSchema.index({ is_deleted: 1 });

module.exports = mongoose.model('RoommateIssue', roommateIssueSchema);
