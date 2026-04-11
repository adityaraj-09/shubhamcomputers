const express = require('express');
const router = express.Router();
const { getPrintServices, getPrintService, searchPrintServices } = require('../controllers/printServiceController');

router.get('/search', searchPrintServices);
router.get('/', getPrintServices);
router.get('/:id', getPrintService);

module.exports = router;
