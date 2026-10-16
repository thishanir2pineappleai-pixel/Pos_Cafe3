// Settings > Profile endpoints that are not the shop profile: the timezone options and the admin profiles of the
// signed-in user's account. There is no delete: the designs show none. Passwords are never returned.
const asyncHandler = require('../../middleware/error/asyncHandler');
const { TIMEZONES } = require('../../config/constants/timezones');
const { MESSAGES } = require('../../config/constants/messages');
const { sendSuccess } = require('../../responses/success');
const adminService = require('../../services/settings/adminProfileService');

const timezones = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: TIMEZONES });
});

const listAdmins = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await adminService.list(req.auth) });
});

const getAdmin = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await adminService.get(req.auth, req.valid.id) });
});

const createAdmin = asyncHandler(async (req, res) => {
  sendSuccess(res, { status: 201, message: MESSAGES.ADMIN_CREATED, data: await adminService.create(req.auth, req.valid.body) });
});

const updateAdmin = asyncHandler(async (req, res) => {
  sendSuccess(res, { message: MESSAGES.ADMIN_UPDATED, data: await adminService.update(req.auth, req.valid.id, req.valid.body) });
});

// No data is returned, only the confirmation.
const changePassword = asyncHandler(async (req, res) => {
  await adminService.changePassword(req.auth, req.valid.id, req.valid.body.password);
  sendSuccess(res, { message: MESSAGES.PASSWORD_UPDATED });
});

const uploadAdminImage = asyncHandler(async (req, res) => {
  sendSuccess(res, { message: MESSAGES.ADMIN_IMAGE_UPLOADED, data: await adminService.setImage(req.auth, req.valid.id, req.file.buffer, req.imageType) });
});

module.exports = { timezones, listAdmins, getAdmin, createAdmin, updateAdmin, changePassword, uploadAdminImage };
