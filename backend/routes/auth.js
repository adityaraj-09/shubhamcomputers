const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { loginWithPhone, sendOTP, verifyOTP, completeProfile, getMe, updateProfile } = require('../controllers/authController');

// Public routes
router.post('/login', loginWithPhone);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

// Protected routes
router.put('/complete-profile', auth, completeProfile);
router.put('/update-profile', auth, updateProfile);
router.get('/me', auth, getMe);

module.exports = router;
