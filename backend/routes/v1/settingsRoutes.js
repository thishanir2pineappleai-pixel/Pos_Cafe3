const { Router } = require('express');
const businessController = require('../../controllers/settings/businessController');
const settingsController = require('../../controllers/settings/settingsController');
const authenticate = require('../../middleware/auth/authenticate');
const { requireRole } = require('../../middleware/auth/authorize');
const { idParam } = require('../../middleware/validation/validate');
const {
  validateShopBody, validateAdminCreateBody, validateAdminUpdateBody, validatePasswordBody,
} = require('../../middleware/validation/settingsValidation');
const { uploadImage } = require('../../middleware/upload/uploadMiddleware');
const { requireImage } = require('../../middleware/upload/imageMiddleware');

const router = Router();

// Every Settings route needs a signed-in user and works only on that user's own account (see the services).
// Creating shops and admins is for the account's owner; editing is the owner, or an admin on their own profile.
router.use(authenticate);
const owner = requireRole('owner');
const noStore = (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); };

router.get('/timezones', settingsController.timezones);

// Shop profiles
router.get('/shops', businessController.list);
router.post('/shops', owner, validateShopBody, businessController.create);
router.get('/shops/:id', idParam('id'), businessController.get);
router.put('/shops/:id', idParam('id'), validateShopBody, businessController.update);
router.post('/shops/:id/image', idParam('id'), uploadImage, requireImage, businessController.uploadImage);

// Admin profiles (never return a password or hash)
router.use('/admins', noStore);
router.get('/admins', settingsController.listAdmins);
router.post('/admins', owner, validateAdminCreateBody, settingsController.createAdmin);
router.get('/admins/:id', idParam('id'), settingsController.getAdmin);
router.put('/admins/:id', idParam('id'), validateAdminUpdateBody, settingsController.updateAdmin);
router.put('/admins/:id/password', idParam('id'), validatePasswordBody, settingsController.changePassword);
router.post('/admins/:id/image', idParam('id'), uploadImage, requireImage, settingsController.uploadAdminImage);

module.exports = router;
