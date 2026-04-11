const { google } = require('googleapis');
const stream = require('stream');

// Initialize Google Drive API using OAuth2 + refresh token
const initDrive = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('⚠️  Google OAuth2 credentials not set (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN). File uploads to Google Drive will not work.');
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost:3000/oauth2callback');
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.drive({ version: 'v3', auth: oauth2Client });
};

let driveInstance = null;

const getDrive = () => {
  if (!driveInstance) {
    driveInstance = initDrive();
  }
  return driveInstance;
};

/**
 * Upload a file to Google Drive
 * @param {Object} file - Multer file object { buffer, originalname, mimetype }
 * @param {string} fileName - Desired file name on Drive
 * @returns {Object} { fileId, webViewLink, webContentLink }
 */
const uploadToDrive = async (file, fileName) => {
  const drive = getDrive();
  if (!drive) {
    throw new Error('Google Drive is not configured. Please set up service account credentials.');
  }

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID not set in environment variables.');
  }

  // Create a readable stream from the buffer
  const bufferStream = new stream.PassThrough();
  bufferStream.end(file.buffer);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId]
    },
    media: {
      mimeType: file.mimetype,
      body: bufferStream
    },
    fields: 'id, webViewLink, webContentLink'
  });

  // Make file readable by anyone with the link
  await drive.permissions.create({
    fileId: response.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    }
  });

  return {
    fileId: response.data.id,
    webViewLink: response.data.webViewLink,
    webContentLink: response.data.webContentLink
  };
};

/**
 * Rename a file on Google Drive
 * @param {string} fileId - Google Drive file ID
 * @param {string} newName - New file name
 */
const renameFileOnDrive = async (fileId, newName) => {
  const drive = getDrive();
  if (!drive) return;

  await drive.files.update({
    fileId,
    requestBody: { name: newName }
  });
};

/**
 * Delete a file from Google Drive
 * @param {string} fileId - Google Drive file ID
 */
const deleteFromDrive = async (fileId) => {
  const drive = getDrive();
  if (!drive) return;

  await drive.files.delete({ fileId });
};

module.exports = { getDrive, uploadToDrive, renameFileOnDrive, deleteFromDrive };
