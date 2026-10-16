const asyncHandler = require('../../middleware/error/asyncHandler');
const { MESSAGES } = require('../../config/constants/messages');
const { sendSuccess } = require('../../responses/success');
const menuService = require('../../services/menu/menuService');

// Runs after uploadImage and requireImage, so req.file is a checked JPEG or PNG.
const upload = asyncHandler(async (req, res) => {
  const product = await menuService.setImage(req.valid.id, req.file.buffer, req.imageType);
  sendSuccess(res, { message: MESSAGES.IMAGE_UPLOADED, data: product });
});

module.exports = { upload };
