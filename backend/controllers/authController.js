const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Login or register with name + phone (no OTP)
// @route   POST /api/auth/login
exports.loginWithPhone = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: 'Please provide a valid 10-digit Indian phone number.' });
    }
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Please provide a valid name (at least 2 characters).' });
    }

    let user = await User.findOne({ phone });
    const isNewUser = !user;

    if (!user) {
      user = new User({ phone, name: name.trim() });
      await user.save();
    } else if (!user.name || user.name.trim().length === 0) {
      user.name = name.trim();
      await user.save();
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      isNewUser,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        phone: user.phone,
        role: user.role,
        address: user.address,
        walletBalance: user.walletBalance,
        numOrders: user.numOrders,
        avatar: user.avatar || ''
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

// @desc    Send OTP to phone number
// @route   POST /api/auth/send-otp
exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: 'Please provide a valid 10-digit Indian phone number.' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Find or create user
    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({ phone, name: '' });
    }

    user.otp = { code: otp, expiresAt: otpExpiry };
    await user.save();

    // In production, send via Twilio
    if (process.env.NODE_ENV === 'production' && process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid') {
      const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await twilio.messages.create({
        body: `Your Shubham Computers OTP is: ${otp}. Valid for 5 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+91${phone}`
      });
    } else {
      // Development: log OTP to console
      console.log(`📱 OTP for ${phone}: ${otp}`);
    }

    res.json({ 
      success: true, 
      message: 'OTP sent successfully.',
      // Only in development
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp })
    });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
};

// @desc    Verify OTP and login
// @route   POST /api/auth/verify-otp
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP are required.' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: 'User not found. Please request OTP first.' });
    }

    if (!user.otp || !user.otp.code) {
      return res.status(400).json({ error: 'No OTP requested. Please request a new OTP.' });
    }

    if (new Date() > user.otp.expiresAt) {
      user.otp = { code: null, expiresAt: null };
      await user.save();
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({ error: 'Invalid OTP.' });
    }

    // Clear OTP after successful verification
    user.otp = { code: null, expiresAt: null };
    await user.save();

    const token = generateToken(user._id);
    const isNewUser = !user.name;

    res.json({
      success: true,
      token,
      isNewUser,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        phone: user.phone,
        role: user.role,
        address: user.address,
        walletBalance: user.walletBalance,
        numOrders: user.numOrders,
        avatar: user.avatar || ''
      }
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
};

// @desc    Complete profile (set name after first login)
// @route   PUT /api/auth/complete-profile
exports.completeProfile = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Please provide a valid name (at least 2 characters).' });
    }

    const user = await User.findById(req.user._id);
    user.name = name.trim();
    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        phone: user.phone,
        role: user.role,
        address: user.address,
        walletBalance: user.walletBalance,
        avatar: user.avatar || ''
      }
    });
  } catch (error) {
    console.error('Complete Profile Error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

// @desc    Update profile (name and/or avatar)
// @route   PUT /api/auth/update-profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'Name must be at least 2 characters.' });
      }
      user.name = name.trim();
    }
    if (avatar !== undefined) {
      user.avatar = avatar;
    }
    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        phone: user.phone,
        role: user.role,
        address: user.address,
        walletBalance: user.walletBalance,
        numOrders: user.numOrders,
        avatar: user.avatar || '',
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-otp');
    res.json({
      success: true,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        phone: user.phone,
        role: user.role,
        address: user.address,
        walletBalance: user.walletBalance,
        numOrders: user.numOrders,
        avatar: user.avatar || '',
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
};
