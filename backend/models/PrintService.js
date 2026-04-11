const mongoose = require('mongoose');

const printServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  icon: {
    type: String,
    default: '🖨️'
  },
  image: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    maxlength: 500
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  options: {
    colorOptions: [{
      label: String,
      priceMultiplier: { type: Number, default: 1 }
    }],
    sizeOptions: [{
      label: String,
      priceMultiplier: { type: Number, default: 1 }
    }],
    sidesOptions: [{
      label: String,  // 'Single Side', 'Both Sides'
      priceMultiplier: { type: Number, default: 1 }
    }],
    bindingOptions: [{
      label: String,
      price: { type: Number, default: 0 }
    }],
    paperOptions: [{
      label: String,
      priceMultiplier: { type: Number, default: 1 }
    }]
  },
  requiresFile: {
    type: Boolean,
    default: true
  },
  allowedFormats: {
    type: [String],
    default: ['pdf', 'doc', 'docx', 'jpg', 'png', 'ppt', 'pptx', 'xls', 'xlsx']
  },
  maxFileSize: {
    type: Number,
    default: 50 // MB
  },
  estimatedTime: {
    type: Number,
    default: 15 // minutes
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

printServiceSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

// slug index already created by unique: true
printServiceSchema.index({ isActive: 1, sortOrder: 1 });
printServiceSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('PrintService', printServiceSchema);
