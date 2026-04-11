const multer = require('multer');
const path = require('path');
const { uploadToCloudinary, renameOnCloudinary } = require('../config/cloudinary');

// Multer config — store in memory (buffer), limit 50MB per file, max 15 files
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
    files: 15
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}. Supported: PDF, JPG, PNG, WEBP, DOC, DOCX, XLS, XLSX, PPT, PPTX`), false);
    }
  }
});

// @desc    Upload files to Cloudinary (pre-order upload)
// @route   POST /api/upload
exports.uploadMiddleware = upload.array('files', 15);

exports.uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const uploadedFiles = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const result = await uploadToCloudinary(file.buffer, file.originalname, file.mimetype);

      uploadedFiles.push({
        id: result.fileId,
        name: file.originalname,
        viewLink: result.viewLink,
        thumbnailLink: result.thumbnailLink,
        mimeType: file.mimetype,
        size: file.size
      });
    }

    res.json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully.`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Upload Error:', error);
    if (error.message?.includes('File type not allowed')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to upload files. Please try again.' });
  }
};

// @desc    Rename uploaded files with orderId after order creation
// @param   {string} orderId
// @param   {Array}  files - Array of { driveFileId (publicId), originalName, mimeType }
exports.renameFilesForOrder = async (orderId, files) => {
  try {
    for (let i = 0; i < files.length; i++) {
      const { driveFileId, mimeType } = files[i];
      if (!driveFileId) continue;
      const isImage = (mimeType || '').startsWith('image/');
      const folder = process.env.CLOUDINARY_FOLDER || 'shubham-computers/uploads';
      const newPublicId = `${folder}/${orderId}_${i + 1}`;
      await renameOnCloudinary(driveFileId, newPublicId, isImage ? 'image' : 'raw');
    }
  } catch (error) {
    console.error('File rename error:', error);
    // Non-critical — files are still accessible
  }
};
