const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createOrder, getMyOrders, getOrder, cancelOrder, createPrintOrder, createInquiryOrder } = require('../controllers/orderController');

router.post('/', auth, createOrder);
router.post('/print', auth, createPrintOrder);
router.post('/inquiry', auth, createInquiryOrder);
router.get('/', auth, getMyOrders);
router.get('/:id', auth, getOrder);
router.put('/:id/cancel', auth, cancelOrder);

module.exports = router;
