// Error responses always look like { success: false, code, message, errors? }.
class AppError extends Error {
  constructor(status, code, message, errors) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

function sendError(res, status, code, message, errors) {
  const body = { success: false, code, message };
  if (errors) body.errors = errors;
  return res.status(status).json(body);
}

module.exports = { AppError, sendError };
