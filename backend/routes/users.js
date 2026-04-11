const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { updateAddress, updateProfile, checkLocation } = require('../controllers/userController');

router.put('/address', auth, updateAddress);
router.put('/profile', auth, updateProfile);
router.post('/check-location', auth, checkLocation);

module.exports = router;
