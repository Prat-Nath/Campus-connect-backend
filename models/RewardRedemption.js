const mongoose = require('mongoose');

const rewardRedemptionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  stall_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodStall',
    required: [true, 'Stall ID is required']
  },
  points_used: {
    type: Number,
    required: [true, 'Points used is required'],
    min: [1, 'Points used must be at least 1']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'redeemed', 'rejected'],
    default: 'pending'
  },
  redeemed_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes
rewardRedemptionSchema.index({ user_id: 1 });
rewardRedemptionSchema.index({ stall_id: 1 });
rewardRedemptionSchema.index({ status: 1 });

module.exports = mongoose.model('RewardRedemption', rewardRedemptionSchema);
