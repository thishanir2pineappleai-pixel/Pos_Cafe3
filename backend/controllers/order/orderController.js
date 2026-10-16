// Read-only: lists orders and exports them. Creating orders is a separate, later feature.
const asyncHandler = require('../../middleware/error/asyncHandler');
const { ERROR_CODES } = require('../../config/constants/errors');
const { MESSAGES } = require('../../config/constants/messages');
const { AppError } = require('../../responses/error');
const { sendSuccess } = require('../../responses/success');
const orderService = require('../../services/order/orderService');

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await orderService.list(req.valid.query);
  sendSuccess(res, { data: items, meta });
});

// CSV only. PDF and XLS need a format decision and a library, so they answer 501 for now.
const exportOrders = asyncHandler(async (req, res) => {
  const { format, ...filters } = req.valid.query;
  if (format !== 'csv') throw new AppError(501, ERROR_CODES.NOT_IMPLEMENTED, MESSAGES.EXPORT_FORMAT_NOT_IMPLEMENTED);
  const csv = await orderService.exportCsv(filters);
  res.status(200)
    .set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="sales-orders.csv"' })
    .send(csv);
});

module.exports = { list, exportOrders };
