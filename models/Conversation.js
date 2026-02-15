const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  entity_type: {
    type: String,
    required: [true, 'Entity type is required'],
    enum: ['activity', 'roommate_issue', 'food_request', 'direct_message', 'group', 'other'],
    lowercase: true
  },
  entity_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes
conversationSchema.index({ entity_type: 1, entity_id: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
