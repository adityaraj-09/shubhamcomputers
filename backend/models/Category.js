const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    maxlength: 100
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  icon: {
    type: String,
    default: '📦'
  },
  image: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    maxlength: 500
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

// slug index already created by unique: true
categorySchema.index({ sortOrder: 1 });

module.exports = mongoose.model('Category', categorySchema);
