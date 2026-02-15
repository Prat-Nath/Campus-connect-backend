const mongoose = require('mongoose');

const foodRequestAcceptanceSchema = new mongoose.Schema({
  request_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodRequest',
    required: [true, 'Request ID is required'],
    unique: true
  },
  accepted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Accepted by user ID is required']
  },
  accepted_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes
foodRequestAcceptanceSchema.index({ request_id: 1 }, { unique: true });
foodRequestAcceptanceSchema.index({ accepted_by: 1 });

module.exports = mongoose.model('FoodRequestAcceptance', foodRequestAcceptanceSchema);
