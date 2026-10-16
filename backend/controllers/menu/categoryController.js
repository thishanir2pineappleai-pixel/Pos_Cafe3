const asyncHandler = require('../../middleware/error/asyncHandler');
const { MESSAGES } = require('../../config/constants/messages');
const { sendSuccess } = require('../../responses/success');
const categoryService = require('../../services/menu/categoryService');

const list = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await categoryService.list() });
});

const create = asyncHandler(async (req, res) => {
  sendSuccess(res, { status: 201, message: MESSAGES.CATEGORY_CREATED, data: await categoryService.create(req.valid.body) });
});

module.exports = { list, create };
