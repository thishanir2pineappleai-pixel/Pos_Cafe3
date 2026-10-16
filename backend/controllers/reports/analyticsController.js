const asyncHandler = require('../../middleware/error/asyncHandler');
const { sendSuccess } = require('../../responses/success');
const salesAnalyticsService = require('../../services/analytics/salesAnalyticsService');

const salesSummary = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await salesAnalyticsService.summary(req.valid.query) });
});

module.exports = { salesSummary };
