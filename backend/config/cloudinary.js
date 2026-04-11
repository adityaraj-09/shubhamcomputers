const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} buffer
 * @param {string} originalName
 * @param {string} mimeType
 * @returns {Object} { fileId, viewLink, thumbnailLink }
 */
const uploadToCloudinary = (buffer, originalName, mimeType) => {
  const isRaw = !mimeType.startsWith('image/');
  const resourceType = isRaw ? 'raw' : 'image';
  const folder = process.env.CLOUDINARY_FOLDER || 'shubham-computers/uploads';

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          fileId: result.public_id,
          viewLink: result.secure_url,
          thumbnailLink: resourceType === 'image'
            ? cloudinary.url(result.public_id, { width: 200, height: 200, crop: 'fill', quality: 'auto', fetch_format: 'auto' })
            : null,
          format: result.format,
          bytes: result.bytes
        });
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Rename a file on Cloudinary (actually re-uploads metadata via rename API)
 * @param {string} publicId - existing public_id
 * @param {string} newPublicId - new public_id (folder/name)
 */
const renameOnCloudinary = async (publicId, newPublicId, resourceType = 'raw') => {
  return cloudinary.uploader.rename(publicId, newPublicId, { resource_type: resourceType });
};

/**
 * Delete a file from Cloudinary
 */
const deleteFromCloudinary = async (publicId, resourceType = 'raw') => {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = { uploadToCloudinary, renameOnCloudinary, deleteFromCloudinary };
