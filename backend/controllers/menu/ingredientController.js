const asyncHandler = require('../../middleware/error/asyncHandler');
const { MESSAGES } = require('../../config/constants/messages');
const { sendSuccess } = require('../../responses/success');
const ingredientService = require('../../services/ingredient/ingredientService');

const search = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await ingredientService.search(req.valid.query) });
});

const create = asyncHandler(async (req, res) => {
  sendSuccess(res, { status: 201, message: MESSAGES.INGREDIENT_CREATED, data: await ingredientService.create(req.valid.body) });
});

module.exports = { search, create };
