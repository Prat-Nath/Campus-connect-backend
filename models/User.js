const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  college_email: {
    type: String,
    required: [true, 'College email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password_hash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  full_name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  hostel_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    default: null
  },
  room_number: {
    type: String,
    trim: true,
    default: null
  },
  batch: {
    type: String,
    trim: true,
    default: null
  },
  role_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: [true, 'Role is required']
  },
  account_status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'deleted'],
    default: 'active'
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  reward_points: {
    type: Number,
    default: 0,
    min: [0, 'Reward points cannot be negative']
  },
  reputation_score: {
    type: Number,
    default: 0
  },
  last_login: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes
// college_email index is created automatically by unique: true in schema
userSchema.index({ hostel_id: 1 });
userSchema.index({ role_id: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

// Virtual for sessions
userSchema.virtual('sessions', {
  ref: 'UserSession',
  localField: '_id',
  foreignField: 'user_id'
});

module.exports = mongoose.model('User', userSchema);
