const mongoose = require('mongoose');

const lostFoundClaimSchema = new mongoose.Schema({
  post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LostFoundPost',
    required: [true, 'Post ID is required']
  },
  claimant_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Claimant user ID is required']
  },
  owner_confirmed: {
    type: Boolean,
    default: false
  },
  confirmed_at: {
    type: Date,
    default: null
  },
  reward_transaction_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RewardTransaction',
    default: null
  },
  claimed_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes
lostFoundClaimSchema.index({ post_id: 1 });
lostFoundClaimSchema.index({ claimant_user_id: 1 });

module.exports = mongoose.model('LostFoundClaim', lostFoundClaimSchema);
