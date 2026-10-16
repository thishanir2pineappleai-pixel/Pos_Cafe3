const { ERROR_CODES } = require('../../config/constants/errors');
const { MESSAGES } = require('../../config/constants/messages');
const { AppError } = require('../../responses/error');

const notFound = (req, res, next) => next(new AppError(404, ERROR_CODES.NOT_FOUND, MESSAGES.ROUTE_NOT_FOUND));

module.exports = notFound;
