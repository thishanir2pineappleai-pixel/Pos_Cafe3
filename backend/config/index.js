const path = require('node:path');
const { env } = require('./env');

// Product and Settings images are stored in separate folders. The folders are created on first upload.
const uploads = Object.freeze({
  productsDir: path.resolve(__dirname, '../uploads/products'),
  publicPath: '/uploads/products',
  settingsDir: path.resolve(__dirname, '../uploads/settings'),
  settingsPublicPath: '/uploads/settings',
  // Staff pictures and staff documents: private folders, never served statically (see services/storage/uploadService.js).
  staffDir: path.resolve(__dirname, '../uploads/staff'),
  staffDocumentsDir: path.resolve(__dirname, '../uploads/staff-documents'),
  maxBytes: 2 * 1024 * 1024, // CONFIRMED for product photos (Figma): JPG/PNG, maximum 2 MB.
  // PENDING APPROVAL: the Settings designs show a camera/upload control but state no formats or size, so Settings
  // images reuse the same JPG/PNG, 2 MB rule instead of a new one.
});

module.exports = { env, uploads, policy: require('./auth/policy') };
