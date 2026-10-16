const { Router } = require('express');
const menuController = require('../../controllers/menu/menuController');
const imageController = require('../../controllers/menu/imageController');
const { idParam } = require('../../middleware/validation/validate');
const {
  validateProductBody, validateProductQuery, validateIngredientQuantityBody,
} = require('../../middleware/validation/munuValidation');
const { uploadImage } = require('../../middleware/upload/uploadMiddleware');
const { requireImage } = require('../../middleware/upload/imageMiddleware');

const router = Router();

router.get('/', validateProductQuery, menuController.list);
router.get('/summary', menuController.summary); // must stay above '/:id'
router.get('/:id', idParam('id'), menuController.get);
router.post('/', validateProductBody, menuController.create);
router.put('/:id', idParam('id'), validateProductBody, menuController.update);
router.delete('/:id', idParam('id'), menuController.remove);
router.patch('/:id/ingredients/:ingredientId', idParam('id'), idParam('ingredientId'), validateIngredientQuantityBody, menuController.updateIngredient);
router.post('/:id/image', idParam('id'), uploadImage, requireImage, imageController.upload);

module.exports = router;
