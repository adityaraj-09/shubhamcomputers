const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadMiddleware, uploadFiles } = require('../controllers/uploadController');

// POST /api/upload — Upload files to Google Drive (auth required)
router.post('/', auth, uploadMiddleware, uploadFiles);

module.exports = router;
