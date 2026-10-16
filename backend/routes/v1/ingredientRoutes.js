const { Router } = require('express');
const ingredientController = require('../../controllers/menu/ingredientController');
const { validateIngredientBody, validateIngredientQuery } = require('../../middleware/validation/ingredientValidation');

const router = Router();

router.get('/', validateIngredientQuery, ingredientController.search);
router.post('/', validateIngredientBody, ingredientController.create);

module.exports = router;
