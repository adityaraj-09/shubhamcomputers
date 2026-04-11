const express = require('express');
const router = express.Router();
const { getProducts, getProduct, getCategories, quickSearch } = require('../controllers/productController');

// Public routes (no auth needed to browse)
router.get('/categories/all', getCategories);
router.get('/search/quick', quickSearch);
router.get('/', getProducts);
router.get('/:id', getProduct);

module.exports = router;
