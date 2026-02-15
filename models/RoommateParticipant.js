const mongoose = require('mongoose');

const roommateParticipantSchema = new mongoose.Schema({
  issue_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoommateIssue',
    required: [true, 'Issue ID is required']
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  role: {
    type: String,
    enum: ['complainant', 'subject', 'mediator', 'witness'],
    required: [true, 'Role is required'],
    lowercase: true
  }
});

// Indexes
roommateParticipantSchema.index({ issue_id: 1, user_id: 1 });
roommateParticipantSchema.index({ user_id: 1 });

module.exports = mongoose.model('RoommateParticipant', roommateParticipantSchema);
