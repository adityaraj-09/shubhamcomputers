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

const PENDING_TIMEOUT_MS = 30 * 60 * 1000;

async function creditPendingTopup(tx, { razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  if (!tx || tx.status !== 'pending') return tx;

  const user = await User.findByIdAndUpdate(
    tx.user,
    { $inc: { walletBalance: tx.amount } },
    { new: true }
  );

  tx.status = 'completed';
  tx.balanceAfter = user.walletBalance;
  tx.razorpayOrderId = razorpayOrderId || tx.razorpayOrderId;
  tx.razorpayPaymentId = razorpayPaymentId || tx.razorpayPaymentId;
  tx.razorpaySignature = razorpaySignature || tx.razorpaySignature;
  tx.pendingExpiresAt = null;
  await tx.save();

  return { tx, user };
}

function verifyRazorpaySignature(orderId, paymentId, signature) {
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
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
      status: 'pending',
      pendingExpiresAt: new Date(Date.now() + PENDING_TIMEOUT_MS)
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
      currency: order.currency,
      expiresAt: transaction.pendingExpiresAt
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

    const tx = await WalletTransaction.findOne({
      _id: transactionId,
      user: req.user._id,
      type: 'topup'
    });

    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    if (tx.status === 'completed') {
      const user = await User.findById(req.user._id);
      return res.json({
        success: true,
        message: `₹${tx.amount} already added to wallet.`,
        balance: user.walletBalance,
        transaction: tx,
      });
    }

    if (tx.status === 'failed') {
      return res.status(400).json({ error: 'This top-up session has already failed. Please start again.' });
    }

    if (tx.pendingExpiresAt && new Date() > tx.pendingExpiresAt) {
      tx.status = 'failed';
      await tx.save();
      return res.status(400).json({ error: 'This top-up session expired. Please try again.' });
    }

    if (tx.razorpayOrderId && tx.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ error: 'Order ID mismatch for this transaction.' });
    }

    if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      tx.status = 'failed';
      tx.razorpayOrderId = razorpay_order_id;
      tx.razorpayPaymentId = razorpay_payment_id;
      tx.razorpaySignature = razorpay_signature;
      await tx.save();
      return res.status(400).json({ error: 'Payment signature verification failed.' });
    }

    const existingCompletedByPayment = await WalletTransaction.findOne({
      razorpayPaymentId: razorpay_payment_id,
      status: 'completed',
      type: 'topup'
    });

    if (existingCompletedByPayment && String(existingCompletedByPayment._id) !== String(tx._id)) {
      tx.status = 'failed';
      tx.razorpayPaymentId = razorpay_payment_id;
      tx.razorpaySignature = razorpay_signature;
      await tx.save();
      const user = await User.findById(req.user._id);
      return res.json({
        success: true,
        message: 'Payment was already processed.',
        balance: user.walletBalance,
        transaction: existingCompletedByPayment,
      });
    }

    const credited = await creditPendingTopup(tx, {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    res.json({
      success: true,
      message: `₹${credited.tx.amount} added to wallet.`,
      balance: credited.user.walletBalance,
      transaction: credited.tx
    });
  } catch (error) {
    console.error('Topup Confirmation Error:', error);
    res.status(500).json({ error: 'Failed to confirm top-up.' });
  }
};

// @desc    Mark pending top-up as cancelled/failed
// @route   POST /api/wallet/topup/cancel
exports.cancelTopup = async (req, res) => {
  try {
    const { transactionId } = req.body;
    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required.' });
    }

    const tx = await WalletTransaction.findOne({
      _id: transactionId,
      user: req.user._id,
      type: 'topup'
    });

    if (!tx) return res.status(404).json({ error: 'Transaction not found.' });
    if (tx.status === 'completed') {
      return res.json({ success: true, message: 'Already completed.' });
    }

    tx.status = 'failed';
    await tx.save();
    return res.json({ success: true, message: 'Top-up cancelled.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel top-up.' });
  }
};

// @desc    Razorpay webhook for wallet top-up completion
// @route   POST /api/wallet/topup/webhook
exports.razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return res.status(500).json({ error: 'Webhook secret not configured.' });
    }

    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (!signature || signature !== expected) {
      return res.status(400).json({ error: 'Invalid webhook signature.' });
    }

    const event = JSON.parse(body.toString('utf8'));
    if (!['payment.captured', 'order.paid'].includes(event.event)) {
      return res.json({ success: true, ignored: true });
    }

    const payment = event.payload?.payment?.entity || {};
    const order = event.payload?.order?.entity || {};
    const orderId = payment.order_id || order.id;
    const paymentId = payment.id;
    if (!orderId || !paymentId) {
      return res.json({ success: true, ignored: true, reason: 'missing ids' });
    }

    let tx = await WalletTransaction.findOne({
      razorpayOrderId: orderId,
      type: 'topup',
      status: 'pending',
    });

    if (!tx) {
      const already = await WalletTransaction.findOne({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        type: 'topup',
        status: 'completed',
      });
      if (already) return res.json({ success: true, alreadyProcessed: true });
      return res.json({ success: true, ignored: true, reason: 'pending tx not found' });
    }

    if (tx.pendingExpiresAt && new Date() > tx.pendingExpiresAt) {
      tx.status = 'failed';
      await tx.save();
      return res.json({ success: true, ignored: true, reason: 'expired' });
    }

    await creditPendingTopup(tx, {
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: tx.razorpaySignature || null,
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Razorpay Webhook Error:', error);
    return res.status(500).json({ error: 'Webhook processing failed.' });
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
