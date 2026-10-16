const { ERROR_CODES } = require('../../config/constants/errors');
const { MESSAGES } = require('../../config/constants/messages');
const { holds } = require('../../config/constants/roles');
const { AppError } = require('../../responses/error');

const forbidden = () => new AppError(403, ERROR_CODES.FORBIDDEN, MESSAGES.FORBIDDEN);

// Use after authenticate: requireRole('owner') lets only users with that server-assigned role through (403 otherwise).
const requireRole = (...roles) => (req, res, next) => (
  req.auth && roles.includes(req.auth.role) ? next() : next(forbidden())
);

// requirePermission('Staff Management', 'edit'): the caller's ACCOUNT role must hold that permission
// (see config/constants/roles.js: the Owner holds all, an Admin holds view/add/edit but not delete).
const requirePermission = (module, action) => (req, res, next) => (
  req.auth && holds(req.auth.role, module, action) ? next() : next(forbidden())
);

module.exports = { requireRole, requirePermission };
