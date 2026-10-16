const multer = require('multer');
const { uploads } = require('../../config');

// Files are held in memory (never written by Multer), limited to one file of at most 2 MB, no extra text fields.
// There is deliberately no fileFilter on the client's MIME type: the real type is checked from the bytes afterwards.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: uploads.maxBytes, files: 1, fields: 0, parts: 2 },
});

module.exports = { upload, MulterError: multer.MulterError };
