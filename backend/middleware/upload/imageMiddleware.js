const { ERROR_CODES } = require('../../config/constants/errors');
const { MESSAGES } = require('../../config/constants/messages');
const { AppError } = require('../../responses/error');
const { detectImageType } = require('../../services/storage/imageService');

// Runs after uploadImage: a file must be present and its bytes must really be a JPEG or PNG.
function requireImage(req, res, next) {
  if (!req.file) return next(new AppError(400, ERROR_CODES.VALIDATION_ERROR, MESSAGES.IMAGE_MISSING));
  const type = detectImageType(req.file.buffer);
  if (!type) return next(new AppError(415, ERROR_CODES.UNSUPPORTED_IMAGE, MESSAGES.IMAGE_UNSUPPORTED));
  req.imageType = type;
  return next();
}

module.exports = { requireImage };
