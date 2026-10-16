const { Router } = require('express');
const categoryController = require('../../controllers/menu/categoryController');
const { validateCategoryBody } = require('../../middleware/validation/munuValidation');

const router = Router();

router.get('/', categoryController.list);
router.post('/', validateCategoryBody, categoryController.create);

module.exports = router;
