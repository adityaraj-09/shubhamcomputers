const crypto = require('crypto');
const Razorpay = require('razorpay');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');

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

// @desc    Create Razorpay order for Standard Web Checkout
// @route   POST /api/create-order
exports.createOrder = async (req, res) => {
  try {
    const amount = Number(req.body?.amount);
    const currency = req.body?.currency || 'INR';
    const receipt = req.body?.receipt || `wallet_${Date.now()}`;

    if (!Number.isFinite(amount) || amount < 100) {
      return res.status(400).json({ error: 'Amount must be at least 100 paise.' });
    }

    const razorpay = getRazorpayClient();

    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency,
      receipt,
      notes: {
        userId: String(req.user._id),
        purpose: 'wallet_topup_web',
      },
    });

    const user = await User.findById(req.user._id).select('walletBalance');
    const tx = await WalletTransaction.create({
      user: req.user._id,
      type: 'topup',
      amount: order.amount / 100,
      balanceAfter: user.walletBalance,
      description: `Wallet top-up of ₹${(order.amount / 100).toFixed(0)}`,
      reference: receipt,
      razorpayOrderId: order.id,
      status: 'pending',
      pendingExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    return res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      transaction_id: tx._id,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create Order Error:', error);

    if (error.statusCode === 401) {
      return res.status(401).json({ error: 'Razorpay authentication failed.' });
    }

    return res.status(500).json({ error: 'Failed to create order.' });
  }
};

// @desc    Verify Razorpay payment signature and credit wallet
// @route   POST /api/verify-payment
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification fields.' });
    }

    const generated = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature.' });
    }

    const alreadyPaid = await WalletTransaction.findOne({
      user: req.user._id,
      razorpayPaymentId: razorpay_payment_id,
      type: 'topup',
      status: 'completed',
    });

    if (alreadyPaid) {
      const user = await User.findById(req.user._id).select('walletBalance');
      return res.json({
        success: true,
        message: 'Payment already verified.',
        balance: user.walletBalance,
      });
    }

    const tx = await WalletTransaction.findOne({
      user: req.user._id,
      razorpayOrderId: razorpay_order_id,
      type: 'topup',
      status: 'pending',
    });

    if (!tx) {
      return res.status(404).json({ error: 'Pending top-up transaction not found.' });
    }

    if (tx.pendingExpiresAt && new Date() > tx.pendingExpiresAt) {
      tx.status = 'failed';
      await tx.save();
      return res.status(400).json({ error: 'Top-up session expired. Please try again.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { walletBalance: tx.amount } },
      { new: true }
    ).select('walletBalance');

    tx.status = 'completed';
    tx.razorpayPaymentId = razorpay_payment_id;
    tx.razorpaySignature = razorpay_signature;
    tx.balanceAfter = user.walletBalance;
    tx.pendingExpiresAt = null;
    await tx.save();

    return res.json({
      success: true,
      message: 'Payment verified successfully.',
      balance: user.walletBalance,
    });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    return res.status(500).json({ error: 'Failed to verify payment.' });
  }
};
