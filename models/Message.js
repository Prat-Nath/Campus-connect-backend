const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: [true, 'Conversation ID is required']
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true
  },
  sent_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes
messageSchema.index({ conversation_id: 1, sent_at: -1 });
messageSchema.index({ sender_id: 1 });

module.exports = mongoose.model('Message', messageSchema);
