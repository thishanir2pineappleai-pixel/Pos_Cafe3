// Dashboard data for the signed-in user. Every response is limited to ONE shop of the caller's account (the requested
// `shopId` if it is theirs, otherwise their first shop) and comes from real stored data, never from fixed sample numbers.
// With no data the same structure comes back with zeros, empty lists and nulls.
const asyncHandler = require('../../middleware/error/asyncHandler');
const { sendSuccess } = require('../../responses/success');
const clock = require('../../utils/clock');
const { localDate } = require('../../utils/date');
const sales = require('../../services/analytics/salesAnalyticsService');
const inventory = require('../../services/analytics/inventoryAnalyticsService');
const trend = require('../../services/analytics/trendAnalysisService');

// Resolves the query into { shopId, date, period, limit }. `date` defaults to today in the server's local time.
async function scope(req, defaultLimit) {
  const { date, period, shopId, limit } = req.valid.query;
  return {
    shopId: await sales.resolveShopId(req.auth, shopId),
    date: date ?? localDate(clock.now()),
    period,
    limit: limit ?? defaultLimit,
  };
}

const summary = asyncHandler(async (req, res) => sendSuccess(res, { data: await sales.dashboardSummary(await scope(req, 0)) }));
const salesTrend = asyncHandler(async (req, res) => sendSuccess(res, { data: await trend.salesTrend(await scope(req, 0)) }));
const topSelling = asyncHandler(async (req, res) => sendSuccess(res, { data: await sales.dashboardTopSelling(await scope(req, 4)) }));
const orderStatus = asyncHandler(async (req, res) => sendSuccess(res, { data: await sales.dashboardOrderStatus(await scope(req, 0)) }));
const recentOrders = asyncHandler(async (req, res) => sendSuccess(res, { data: await sales.dashboardRecentOrders(await scope(req, 5)) }));
const stock = asyncHandler(async (req, res) => sendSuccess(res, { data: await inventory.stockSummary(await scope(req, 4)) }));

module.exports = { summary, salesTrend, topSelling, orderStatus, recentOrders, stock };
