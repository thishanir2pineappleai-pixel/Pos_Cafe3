const { ERROR_CODES } = require('../../config/constants/errors');
const { MESSAGES } = require('../../config/constants/messages');
const { AppError } = require('../../responses/error');
const { toInt } = require('../../utils/validator');

const fail = (errors) => new AppError(400, ERROR_CODES.VALIDATION_ERROR, MESSAGES.VALIDATION_FAILED, errors);

// validate(parse, source): parse(req) returns { value, errors }. On success the cleaned value is stored
// in req.valid[source] ('body' or 'query'); on failure the request ends with a 400.
const validate = (parse, source = 'body') => (req, res, next) => {
  const { value, errors } = parse(req);
  if (errors.length > 0) return next(fail(errors));
  req.valid = { ...req.valid, [source]: value };
  return next();
};

// Checks a :param such as :id is a positive whole number and stores it in req.valid[name].
const idParam = (name = 'id') => (req, res, next) => {
  const id = toInt(req.params[name], { min: 1 });
  if (id === null) return next(fail([{ field: name, message: 'Must be a positive whole number' }]));
  req.valid = { ...req.valid, [name]: id };
  return next();
};

module.exports = { validate, idParam, fail };
