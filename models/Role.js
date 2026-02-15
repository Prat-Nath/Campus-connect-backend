const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  role_name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Index
roleSchema.index({ role_name: 1 }, { unique: true });

module.exports = mongoose.model('Role', roleSchema);
