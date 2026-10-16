const { Router } = require('express');
const dashboard = require('../../controllers/reports/dashboardController');
const authenticate = require('../../middleware/auth/authenticate');
const { validateDashboardQuery } = require('../../middleware/validation/orderValidation');

const router = Router();

// Every Dashboard route needs a signed-in user and only reports on a shop of that user's account.
router.use(authenticate, validateDashboardQuery);
router.get('/summary', dashboard.summary);
router.get('/sales-trend', dashboard.salesTrend);
router.get('/top-selling', dashboard.topSelling);
router.get('/order-status', dashboard.orderStatus);
router.get('/stock', dashboard.stock);
router.get('/recent-orders', dashboard.recentOrders);

module.exports = router;
