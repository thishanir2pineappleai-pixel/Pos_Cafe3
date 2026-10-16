const { Router } = require('express');
const orderController = require('../../controllers/order/orderController');
const { validateOrderQuery, validateExportQuery } = require('../../middleware/validation/orderValidation');

const router = Router();

// Read-only. DEVELOPMENT ONLY: no authentication yet (the auth middleware files are still placeholders).
router.get('/', validateOrderQuery, orderController.list);
router.get('/export', validateExportQuery, orderController.exportOrders);

module.exports = router;
