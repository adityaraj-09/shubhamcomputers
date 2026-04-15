const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    type: {
      type: String,
      enum: ['print', 'mart', 'inquiry'],
      required: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'items.refModel'
    },
    refModel: {
      type: String,
      enum: ['PrintService', 'Product']
    },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    options: { type: mongoose.Schema.Types.Mixed }, // print options (color, copies, sides, etc.)
    customNote: { type: String, maxlength: 500 },
    fileUrl: { type: String }, // uploaded document for printing
    driveFileId: { type: String } // Google Drive file ID for renaming
  }],
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  payment: {
    method: {
      type: String,
      enum: ['wallet'],
      default: 'wallet'
    },
    status: {
      type: String,
      enum: ['paid', 'pending', 'failed', 'refunded'],
      default: 'paid'
    },
    transactionId: String
  },
  status: {
    type: String,
    enum: ['placed', 'confirmed', 'contacted', 'processing', 'out-for-delivery', 'delivered', 'cancelled'],
    default: 'confirmed'
  },
  deliveryAddress: {
    label: String,
    full: String,
    lat: Number,
    lng: Number
  },
  estimatedDelivery: Date,
  deliveredAt: Date,
  adminNote: { type: String, maxlength: 500 }
}, {
  timestamps: true
});

// Auto-generate order ID before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderId = `ORD-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
// orderId index already created by unique: true

module.exports = mongoose.model('Order', orderSchema);
