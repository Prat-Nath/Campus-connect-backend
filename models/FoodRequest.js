const mongoose = require('mongoose');

const foodRequestSchema = new mongoose.Schema({
  requester_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester ID is required']
  },
  stall_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodStall',
    required: [true, 'Stall ID is required']
  },
  item_name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  service_charge: {
    type: Number,
    required: [true, 'Service charge is required'],
    min: [0, 'Service charge cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'picked_up', 'delivered', 'cancelled'],
    default: 'pending'
  },
  is_paid: {
    type: Boolean,
    default: false
  },
  delivered_confirmed: {
    type: Boolean,
    default: false
  },
  is_deleted: {
    type: Boolean,
    default: false
  },
  request_time: {
    type: Date,
    default: Date.now
  }
});

// Indexes
foodRequestSchema.index({ requester_id: 1 });
foodRequestSchema.index({ stall_id: 1 });
foodRequestSchema.index({ status: 1 });
foodRequestSchema.index({ is_paid: 1 });
foodRequestSchema.index({ is_deleted: 1 });

module.exports = mongoose.model('FoodRequest', foodRequestSchema);
