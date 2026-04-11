const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getWallet, initiateTopup, confirmTopup, getTransactions } = require('../controllers/walletController');

router.get('/', auth, getWallet);
router.post('/topup', auth, initiateTopup);
router.post('/topup/confirm', auth, confirmTopup);
router.get('/transactions', auth, getTransactions);

module.exports = router;
