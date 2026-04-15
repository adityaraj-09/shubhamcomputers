const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');
const PrintService = require('../models/PrintService');
const WalletTransaction = require('../models/WalletTransaction');
const { deleteOrderFilesFromCloudinary } = require('../config/cloudinary');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalOrders,
      todayOrders,
      totalProducts,
      totalRevenue,
      todayRevenue,
      pendingOrders,
      recentOrders
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Product.countDocuments({ isActive: true }),
      Order.aggregate([
        { $match: { status: { $nin: ['cancelled'] }, 'payment.status': { $nin: ['failed', 'refunded'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: today }, status: { $nin: ['cancelled'] }, 'payment.status': { $nin: ['failed', 'refunded'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Order.countDocuments({ status: { $in: ['placed', 'confirmed', 'processing'] } }),
      Order.find()
        .populate('customer', 'name phone')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalOrders,
        todayOrders,
        totalProducts,
        revenue: totalRevenue[0]?.total || 0,
        todayRevenue: todayRevenue[0]?.total || 0,
        pendingOrders
      },
      recentOrders
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard.' });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let filter = {};
    if (req.query.search) {
      const regex = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter = { $or: [{ name: regex }, { phone: regex }] };
    }
    if (req.query.role) {
      filter.role = req.query.role;
    }

    const users = await User.find(filter)
      .select('-otp')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/admin/orders
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.date) {
      const day = new Date(req.query.date);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.createdAt = { $gte: day, $lt: nextDay };
    }

    const orders = await Order.find(filter)
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const validStatuses = ['delivered', 'contacted', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const order = await Order.findById(req.params.id);
    const prevStatus = order.status;

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Handle cancellation refund
    if (status === 'cancelled' && order.payment.status === 'paid') {
      const user = await User.findById(order.customer);
      user.walletBalance += order.amount;
      await user.save();

      await WalletTransaction.create({
        user: order.customer,
        type: 'refund',
        amount: order.amount,
        balanceAfter: user.walletBalance,
        description: `Refund for order ${order.orderId} (admin cancelled)`,
        reference: order.orderId,
        status: 'completed'
      });

      order.payment.status = 'refunded';
    }

    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    order.status = status;
    if (adminNote) order.adminNote = adminNote;
    await order.save();

    // Print shop cleanup: once an order reaches terminal states, remove uploaded files.
    const movedToTerminal =
      prevStatus !== status && (status === 'cancelled' || status === 'delivered');
    if (movedToTerminal) {
      deleteOrderFilesFromCloudinary(order.items).catch(err =>
        console.error('Cloudinary cleanup failed (admin status update):', err?.message || err)
      );
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('Update Order Status Error:', error);
    res.status(500).json({ error: 'Failed to update order.' });
  }
};

// @desc    Add product (admin)
// @route   POST /api/admin/products
exports.addProduct = async (req, res) => {
  try {
    const { name, description, category, price, mrp, image, stock, unit, brand, tags, isFeatured } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: 'Name, category, and price are required.' });
    }

    const product = await Product.create({
      name, description, category, price, mrp, image, stock, unit, brand, 
      tags: tags || [], isFeatured: isFeatured || false
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Add Product Error:', error);
    res.status(500).json({ error: 'Failed to add product.' });
  }
};

// @desc    Update product (admin)
// @route   PUT /api/admin/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product.' });
  }
};

// @desc    Delete product (soft delete)
// @route   DELETE /api/admin/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json({ success: true, message: 'Product deactivated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product.' });
  }
};

// @desc    Add category (admin)
// @route   POST /api/admin/categories
exports.addCategory = async (req, res) => {
  try {
    const { name, icon, image, description, sortOrder } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }
    const category = await Category.create({ name, icon, image, description, sortOrder });
    res.status(201).json({ success: true, category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Category name already exists.' });
    }
    res.status(500).json({ error: 'Failed to add category.' });
  }
};

// @desc    Add admin role to user
// @route   PUT /api/admin/users/:id/make-admin
exports.makeAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'admin' },
      { new: true }
    ).select('-otp');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user role.' });
  }
};

// @desc    Add/Update print services
// @route   POST /api/admin/print-services
exports.addPrintService = async (req, res) => {
  try {
    const service = await PrintService.create(req.body);
    res.status(201).json({ success: true, service });
  } catch (error) {
    console.error('Add Print Service Error:', error);
    res.status(500).json({ error: 'Failed to add print service.' });
  }
};

// @desc    Update print service
// @route   PUT /api/admin/print-services/:id
exports.updatePrintService = async (req, res) => {
  try {
    const service = await PrintService.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!service) {
      return res.status(404).json({ error: 'Print service not found.' });
    }
    res.json({ success: true, service });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update print service.' });
  }
};
