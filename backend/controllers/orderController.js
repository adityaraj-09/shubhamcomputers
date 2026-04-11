const Order = require('../models/Order');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const Inquiry = require('../models/Inquiry');
const { renameFilesForOrder } = require('./uploadController');

// @desc    Create new order (payment from wallet)
// @route   POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const { items, customNote, deliveryAddress } = req.body;
    const user = await User.findById(req.user._id);

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item.' });
    }

    if (!user.address || !user.address.lat) {
      return res.status(400).json({ error: 'Please set your delivery address first.' });
    }

    // Calculate total amount 
    let totalAmount = 0;
    const orderItems = items.map(item => {
      const itemTotal = item.price * item.quantity;
      totalAmount += itemTotal;
      return {
        type: item.type,
        product: item.productId,
        refModel: item.type === 'print' ? 'PrintService' : 'Product',
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        options: item.options || {},
        customNote: item.customNote || '',
        fileUrl: item.fileUrl || '',
        driveFileId: item.driveFileId || ''
      };
    });

    // Check wallet balance
    if (user.walletBalance < totalAmount) {
      return res.status(400).json({ 
        error: 'Insufficient wallet balance.',
        required: totalAmount,
        current: user.walletBalance,
        shortfall: totalAmount - user.walletBalance
      });
    }

    // Deduct from wallet
    user.walletBalance -= totalAmount;
    user.numOrders += 1;
    await user.save();

    // Create wallet transaction
    await WalletTransaction.create({
      user: user._id,
      type: 'debit',
      amount: totalAmount,
      balanceAfter: user.walletBalance,
      description: `Order payment`,
      status: 'completed'
    });

    // Create order
    const order = await Order.create({
      customer: user._id,
      items: orderItems,
      amount: totalAmount,
      payment: {
        method: 'wallet',
        status: 'paid'
      },
      deliveryAddress: deliveryAddress
        ? { ...user.address, full: deliveryAddress, label: deliveryAddress }
        : user.address,
      estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
    });

    // Populate the order for response
    const populatedOrder = await Order.findById(order._id).populate('customer', 'name phone');

    // Rename uploaded files on Google Drive with orderId
    const filesForRename = orderItems
      .filter(item => item.fileUrl && item.driveFileId)
      .map(item => ({ driveFileId: item.driveFileId, originalName: item.name }));
    if (filesForRename.length > 0) {
      renameFilesForOrder(populatedOrder.orderId, filesForRename).catch(err => 
        console.error('Background file rename failed:', err)
      );
    }

    res.status(201).json({
      success: true,
      order: populatedOrder
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ error: 'Failed to create order.' });
  }
};

// @desc    Get user's orders
// @route   GET /api/orders
exports.getMyOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ customer: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ customer: req.user._id });

    res.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
};

// @desc    Get single order detail
// @route   GET /api/orders/:id
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id, 
      customer: req.user._id 
    }).populate('customer', 'name phone');

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order.' });
  }
};

// @desc    Cancel order (if still in placed/confirmed status)
// @route   PUT /api/orders/:id/cancel
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id, 
      customer: req.user._id 
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.status !== 'confirmed') {
      return res.status(400).json({ error: 'Order cannot be cancelled at this stage.' });
    }

    // Refund to wallet
    const user = await User.findById(req.user._id);
    user.walletBalance += order.amount;
    await user.save();

    // Create refund transaction
    await WalletTransaction.create({
      user: user._id,
      type: 'refund',
      amount: order.amount,
      balanceAfter: user.walletBalance,
      description: `Refund for cancelled order ${order.orderId}`,
      reference: order.orderId,
      status: 'completed'
    });

    order.status = 'cancelled';
    order.payment.status = 'refunded';
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled. Amount refunded to wallet.',
      walletBalance: user.walletBalance
    });
  } catch (error) {
    console.error('Cancel Order Error:', error);
    res.status(500).json({ error: 'Failed to cancel order.' });
  }
};

// @desc    Create print order (upload files → configure → place)
// @route   POST /api/orders/print
exports.createPrintOrder = async (req, res) => {
  try {
    const { items, totalAmount } = req.body;
    const user = await User.findById(req.user._id);

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No print items provided.' });
    }

    const calcTotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const amount = totalAmount || calcTotal;

    if (user.walletBalance < amount) {
      return res.status(400).json({
        error: 'Insufficient wallet balance.',
        required: amount,
        current: user.walletBalance,
        shortfall: amount - user.walletBalance
      });
    }

    user.walletBalance -= amount;
    user.numOrders += 1;
    await user.save();

    await WalletTransaction.create({
      user: user._id,
      type: 'debit',
      amount,
      balanceAfter: user.walletBalance,
      description: 'Print order payment',
      status: 'completed'
    });

    const orderItems = items.map(item => ({
      type: 'print',
      refModel: 'PrintService',
      name: item.name || item.fileName || 'Print Job',
      quantity: item.copies || 1,
      price: item.totalPrice || 0,
      driveFileId: item.fileId || '',
      options: {
        pages: item.pages,
        color: item.color,
        orientation: item.orientation,
        sides: item.sides,
        copies: item.copies
      }
    }));

    const order = await Order.create({
      customer: user._id,
      items: orderItems,
      amount,
      payment: { method: 'wallet', status: 'paid' },
      deliveryAddress: user.address || { lat: 0, lng: 0, formatted: 'In-store pickup' },
      estimatedDelivery: new Date(Date.now() + 60 * 60 * 1000)
    });

    const populatedOrder = await Order.findById(order._id).populate('customer', 'name phone');

    res.status(201).json({ success: true, order: populatedOrder });
  } catch (error) {
    console.error('Create Print Order Error:', error);
    res.status(500).json({ error: 'Failed to create print order.' });
  }
};

// @desc    Create bulk/custom inquiry order (no wallet deduction — quote pending)
// @route   POST /api/orders/inquiry
exports.createInquiryOrder = async (req, res) => {
  try {
    const { requirements, quantity } = req.body;
    const user = await User.findById(req.user._id);

    if (!requirements || !requirements.trim()) {
      return res.status(400).json({ error: 'Requirements are required.' });
    }

    // Also persist in the Inquiry collection for contact management
    await Inquiry.create({
      name: user.name,
      phone: user.phone,
      requirements: requirements.trim().slice(0, 2000),
      quantity: quantity ? String(quantity).trim().slice(0, 200) : '',
    });

    user.numOrders += 1;
    await user.save();

    const order = await Order.create({
      customer: user._id,
      items: [{
        type: 'inquiry',
        name: 'Bulk / Custom Order',
        quantity: 1,
        price: 0,
        options: {
          requirements: requirements.trim(),
          quantity: quantity || '',
          contactPhone: user.phone,
        },
      }],
      amount: 0,
      payment: { method: 'wallet', status: 'pending' },
      deliveryAddress: user.address || { label: 'To be discussed', full: 'To be discussed' },
    });

    const populatedOrder = await Order.findById(order._id).populate('customer', 'name phone');
    res.status(201).json({ success: true, order: populatedOrder });
  } catch (error) {
    console.error('Create Inquiry Order Error:', error);
    res.status(500).json({ error: 'Failed to create order.' });
  }
};

