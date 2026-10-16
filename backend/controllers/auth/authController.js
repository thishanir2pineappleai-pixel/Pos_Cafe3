const asyncHandler = require('../../middleware/error/asyncHandler');
const { sendSuccess } = require('../../responses/success');
const authService = require('../../services/auth/authService');

// The signed-in user and the shops of their account (never a password or hash).
const me = asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  sendSuccess(res, { data: await authService.me(req.auth) });
});

module.exports = { me };
