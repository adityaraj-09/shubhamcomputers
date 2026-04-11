const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
  getDashboard, getUsers, getAllOrders, updateOrderStatus,
  addProduct, updateProduct, deleteProduct, addCategory,
  makeAdmin, addPrintService, updatePrintService
} = require('../controllers/adminController');

// All admin routes require auth + admin
router.use(auth, admin);

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.put('/users/:id/make-admin', makeAdmin);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.post('/products', addProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.post('/categories', addCategory);
router.post('/print-services', addPrintService);
router.put('/print-services/:id', updatePrintService);

module.exports = router;
