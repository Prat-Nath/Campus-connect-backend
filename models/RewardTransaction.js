const mongoose = require('mongoose');

const rewardTransactionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  points: {
    type: Number,
    required: [true, 'Points is required']
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true
  },
  reference_type: {
    type: String,
    enum: ['food_delivery', 'lost_found', 'activity', 'manual', 'other'],
    required: [true, 'Reference type is required'],
    lowercase: true
  },
  reference_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes
rewardTransactionSchema.index({ user_id: 1 });
rewardTransactionSchema.index({ reference_type: 1 });
rewardTransactionSchema.index({ created_at: -1 });

module.exports = mongoose.model('RewardTransaction', rewardTransactionSchema);
