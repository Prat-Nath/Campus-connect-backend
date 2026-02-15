const mongoose = require('mongoose');

const activityParticipantSchema = new mongoose.Schema({
  activity_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: [true, 'Activity ID is required']
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'left'],
    default: 'accepted'
  },
  joined_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes
activityParticipantSchema.index({ activity_id: 1, user_id: 1 }, { unique: true });
activityParticipantSchema.index({ user_id: 1 });

module.exports = mongoose.model('ActivityParticipant', activityParticipantSchema);
