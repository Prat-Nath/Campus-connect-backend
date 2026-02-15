const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  refresh_token: {
    type: String,
    required: [true, 'Refresh token is required']
  },
  device_info: {
    type: String,
    default: null
  },
  expires_at: {
    type: Date,
    required: [true, 'Expiration date is required']
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes
userSessionSchema.index({ user_id: 1 });
userSessionSchema.index({ refresh_token: 1 });

// Automatically delete expired sessions (TTL index also creates the regular index)
userSessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('UserSession', userSessionSchema);
