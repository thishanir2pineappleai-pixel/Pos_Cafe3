const { ERROR_CODES } = require('../../config/constants/errors');
const { MESSAGES } = require('../../config/constants/messages');
const { AppError } = require('../../responses/error');
const { upload, MulterError } = require('./multerConfig');

const single = upload.single('image');

// Reads one file from the multipart field "image" and turns Multer errors into the standard JSON errors.
function uploadImage(req, res, next) {
  single(req, res, (err) => {
    if (!err) return next();
    if (err instanceof MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return next(new AppError(413, ERROR_CODES.IMAGE_TOO_LARGE, MESSAGES.IMAGE_TOO_LARGE));
      return next(new AppError(400, ERROR_CODES.VALIDATION_ERROR, MESSAGES.IMAGE_MISSING, [{ field: 'image', message: err.message }]));
    }
    return next(err);
  });
}

module.exports = { uploadImage };
