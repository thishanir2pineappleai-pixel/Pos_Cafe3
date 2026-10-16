// Sales discount applications (a Menu discount definition applied over a period to products).
const asyncHandler = require('../../middleware/error/asyncHandler');
const { MESSAGES } = require('../../config/constants/messages');
const { sendSuccess } = require('../../responses/success');
const service = require('../../services/discount/discountApplicationService');

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await service.list(req.valid.query);
  sendSuccess(res, { data: items, meta });
});

const get = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await service.get(req.valid.id) });
});

const create = asyncHandler(async (req, res) => {
  sendSuccess(res, { status: 201, message: MESSAGES.APPLICATION_CREATED, data: await service.create(req.valid.body) });
});

const update = asyncHandler(async (req, res) => {
  sendSuccess(res, { message: MESSAGES.APPLICATION_UPDATED, data: await service.update(req.valid.id, req.valid.body) });
});

const setStatus = asyncHandler(async (req, res) => {
  sendSuccess(res, { message: MESSAGES.APPLICATION_STATUS_UPDATED, data: await service.setStatus(req.valid.id, req.valid.body.status) });
});

const remove = asyncHandler(async (req, res) => {
  await service.remove(req.valid.id);
  sendSuccess(res, { message: MESSAGES.APPLICATION_DELETED });
});

module.exports = { list, get, create, update, setStatus, remove };
