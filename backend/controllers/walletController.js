const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const crypto = require('crypto');
const Razorpay = require('razorpay');

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials are not configured.');
  }
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

// @desc    Get wallet balance & recent transactions
// @route   GET /api/wallet
exports.getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance');
    const transactions = await WalletTransaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      balance: user.walletBalance,
      transactions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wallet.' });
  }
};

// @desc    Initiate wallet top-up (create Razorpay order)
// @route   POST /api/wallet/topup
exports.initiateTopup = async (req, res) => {
  try {
    const amount = Number(req.body?.amount);

    if (!Number.isFinite(amount) || amount < 50) {
      return res.status(400).json({ error: 'Minimum top-up amount is ₹50.' });
    }

    if (amount > 10000) {
      return res.status(400).json({ error: 'Maximum top-up amount is ₹10,000.' });
    }

    const razorpay = getRazorpayClient();

    // Generate a unique receipt/reference
    const txnRef = `SC-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const amountPaise = Math.round(amount * 100);

    // Create order on Razorpay
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: txnRef,
      notes: {
        userId: String(req.user._id),
        purpose: 'wallet_topup',
      },
    });

    // Create pending transaction
    const transaction = await WalletTransaction.create({
      user: req.user._id,
      type: 'topup',
      amount,
      balanceAfter: req.user.walletBalance, // will update on confirmation
      description: `Wallet top-up of ₹${amount}`,
      reference: txnRef,
      razorpayOrderId: order.id,
      status: 'pending'
    });

    res.json({
      success: true,
      transactionId: transaction._id,
      txnRef,
      amount,
      amountPaise,
      keyId: process.env.RAZORPAY_KEY_ID,
      merchantName: process.env.RAZORPAY_MERCHANT_NAME || 'Shubham Prints',
      razorpayOrderId: order.id,
      currency: order.currency
    });
  } catch (error) {
    console.error('Topup Initiation Error:', error);
    res.status(500).json({ error: 'Failed to initiate top-up.' });
  }
};

// @desc    Confirm wallet top-up (after Razorpay payment)
// @route   POST /api/wallet/topup/confirm
exports.confirmTopup = async (req, res) => {
  try {
    const {
      transactionId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required.' });
    }
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Razorpay payment details are required.' });
    }

    const pendingTx = await WalletTransaction.findOne({
      _id: transactionId,
      user: req.user._id,
      status: 'pending',
      type: 'topup'
    });

    if (!pendingTx) {
      const completedTx = await WalletTransaction.findOne({
        _id: transactionId,
        user: req.user._id,
        status: 'completed',
        type: 'topup',
      });
      if (completedTx) {
        const user = await User.findById(req.user._id);
        return res.json({
          success: true,
          message: `₹${completedTx.amount} already added to wallet.`,
          balance: user.walletBalance,
          transaction: completedTx,
        });
      }
      return res.status(404).json({ error: 'Pending transaction not found.' });
    }

    if (pendingTx.razorpayOrderId && pendingTx.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ error: 'Order ID mismatch for this transaction.' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      pendingTx.status = 'failed';
      pendingTx.razorpayOrderId = razorpay_order_id;
      pendingTx.razorpayPaymentId = razorpay_payment_id;
      pendingTx.razorpaySignature = razorpay_signature;
      await pendingTx.save();
      return res.status(400).json({ error: 'Payment signature verification failed.' });
    }

    // Update wallet balance
    const user = await User.findById(req.user._id);
    user.walletBalance += pendingTx.amount;
    await user.save();

    // Update transaction
    pendingTx.status = 'completed';
    pendingTx.balanceAfter = user.walletBalance;
    pendingTx.razorpayOrderId = razorpay_order_id;
    pendingTx.razorpayPaymentId = razorpay_payment_id;
    pendingTx.razorpaySignature = razorpay_signature;
    await pendingTx.save();

    res.json({
      success: true,
      message: `₹${pendingTx.amount} added to wallet.`,
      balance: user.walletBalance,
      transaction: pendingTx
    });
  } catch (error) {
    console.error('Topup Confirmation Error:', error);
    res.status(500).json({ error: 'Failed to confirm top-up.' });
  }
};

// @desc    Get all wallet transactions
// @route   GET /api/wallet/transactions
exports.getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let filter = { user: req.user._id };
    if (req.query.type) {
      filter.type = req.query.type;
    }

    const transactions = await WalletTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await WalletTransaction.countDocuments(filter);

    res.json({
      success: true,
      transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
};
