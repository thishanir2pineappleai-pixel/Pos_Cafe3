const { Router } = require('express');
const analyticsController = require('../../controllers/reports/analyticsController');
const { validateSummaryQuery } = require('../../middleware/validation/orderValidation');

const router = Router();

// The four Sales Management cards. Only what the designs show: there is no Peak Hour Analysis design yet.
router.get('/sales/summary', validateSummaryQuery, analyticsController.salesSummary);

module.exports = router;
