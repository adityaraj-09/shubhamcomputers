const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const crypto = require('crypto');

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

// @desc    Initiate wallet top-up (generates UPI intent)
// @route   POST /api/wallet/topup
exports.initiateTopup = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 50) {
      return res.status(400).json({ error: 'Minimum top-up amount is ₹50.' });
    }

    if (amount > 10000) {
      return res.status(400).json({ error: 'Maximum top-up amount is ₹10,000.' });
    }

    // Generate a unique transaction reference
    const txnRef = `SC-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    // Create pending transaction
    const transaction = await WalletTransaction.create({
      user: req.user._id,
      type: 'topup',
      amount,
      balanceAfter: req.user.walletBalance, // will update on confirmation
      description: `Wallet top-up of ₹${amount}`,
      reference: txnRef,
      status: 'pending'
    });

    // Generate UPI deep link
    const merchantName = process.env.UPI_MERCHANT_NAME || 'ShubhamComputers';
    const merchantUPI = process.env.UPI_MERCHANT_ID || 'merchant@upi';
    const upiLink = `upi://pay?pa=${encodeURIComponent(merchantUPI)}&pn=${encodeURIComponent(merchantName)}&am=${amount}&tn=${encodeURIComponent(`Wallet TopUp ${txnRef}`)}&tr=${txnRef}&cu=INR`;

    res.json({
      success: true,
      transactionId: transaction._id,
      txnRef,
      amount,
      upiLink,
      // Intent URLs for popular UPI apps
      intents: {
        generic: upiLink,
        gpay: upiLink.replace('upi://', 'gpay://'),
        phonepe: upiLink.replace('upi://', 'phonepe://'),
        paytm: upiLink.replace('upi://', 'paytmmp://')
      }
    });
  } catch (error) {
    console.error('Topup Initiation Error:', error);
    res.status(500).json({ error: 'Failed to initiate top-up.' });
  }
};

// @desc    Confirm wallet top-up (after UPI payment)
// @route   POST /api/wallet/topup/confirm
exports.confirmTopup = async (req, res) => {
  try {
    const { transactionId, upiTransactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required.' });
    }

    const transaction = await WalletTransaction.findOne({
      _id: transactionId,
      user: req.user._id,
      status: 'pending',
      type: 'topup'
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Pending transaction not found.' });
    }

    // Update wallet balance
    const user = await User.findById(req.user._id);
    user.walletBalance += transaction.amount;
    await user.save();

    // Update transaction
    transaction.status = 'completed';
    transaction.balanceAfter = user.walletBalance;
    transaction.upiTransactionId = upiTransactionId || '';
    await transaction.save();

    res.json({
      success: true,
      message: `₹${transaction.amount} added to wallet.`,
      balance: user.walletBalance,
      transaction
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
