const { Router } = require('express');
const discountController = require('../../controllers/payment/discountController');
const applicationController = require('../../controllers/payment/discountApplicationController');
const { idParam } = require('../../middleware/validation/validate');
const {
  validateDiscountBody, validateApplicationBody, validateApplicationStatusBody, validateApplicationQuery,
} = require('../../middleware/validation/discountValidation');

const router = Router();

// Discount definitions (Menu Management): name and percentage.
router.get('/', discountController.list);
router.post('/', validateDiscountBody, discountController.create);

// Discount applications (Sales Management): a definition applied over a period to all or selected products.
// Definitions and products are read through GET /discounts and GET /products; no definition is stored here.
router.get('/applications', validateApplicationQuery, applicationController.list);
router.post('/applications', validateApplicationBody, applicationController.create);
router.get('/applications/:id', idParam('id'), applicationController.get);
router.put('/applications/:id', idParam('id'), validateApplicationBody, applicationController.update);
router.patch('/applications/:id/status', idParam('id'), validateApplicationStatusBody, applicationController.setStatus);
router.delete('/applications/:id', idParam('id'), applicationController.remove);

module.exports = router;
