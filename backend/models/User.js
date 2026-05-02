const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    default: '',
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number']
  },
  password: {
    type: String,
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  otp: {
    code: String,
    expiresAt: Date
  },
  address: {
    label: { type: String, default: '' },
    full: { type: String, default: '' },
    lat: Number,
    lng: Number
  },
  walletBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  numOrders: {
    type: Number,
    default: 0
  },
  avatar: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for user_id display
userSchema.virtual('userId').get(function() {
  return `SC-${this._id.toString().slice(-6).toUpperCase()}`;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Index for role lookup (phone index already created by unique: true)
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
