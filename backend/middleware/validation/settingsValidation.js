const { TIMEZONES } = require('../../config/constants/timezones');
const { isBlank, isPlainObject, passwordProblem, toText } = require('../../utils/validator');
const { validate } = require('./validate');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Only "Email (Optional)" and "Website (Optional)" on the shop form are CONFIRMED optional by the Figma.
// Everything else below is PENDING APPROVAL: the Figma marks no other field as required or optional, and states
// no lengths, phone format, website format or password rules. Change them here, in one place.
const SHOP_RULES = {
  name: { required: true, max: 150 },
  address: { required: true, max: 255 },
  phone: { required: true, max: 30 }, // no phone pattern is enforced
  email: { required: false, max: 254 }, // CONFIRMED optional
  website: { required: false, max: 255 }, // CONFIRMED optional; the Figma shows "www.poscafe.com", so no URL scheme is required
};
const ADMIN_RULES = {
  firstName: { required: true, max: 100 },
  lastName: { required: true, max: 100 },
  phone: { required: true, max: 30 },
  email: { required: true, max: 254 },
};
// Passwords use the same rule as signup and password reset (utils/validator.js: 8 characters with uppercase,
// lowercase, numbers and symbols, no spaces, at most 128), because Settings passwords are now real login credentials.

function textField(body, field, rule, errors) {
  const raw = body[field];
  if (isBlank(raw)) {
    if (rule.required) errors.push({ field, message: 'Required' });
    return null;
  }
  const value = toText(raw, { max: rule.max });
  if (value === null) errors.push({ field, message: `Must be text of 1-${rule.max} characters` });
  return value;
}

function emailField(body, rules, errors) {
  const email = textField(body, 'email', rules.email, errors);
  if (email && !EMAIL.test(email)) {
    errors.push({ field: 'email', message: 'Must be a valid email address' });
    return null;
  }
  return email;
}

// Passwords are never trimmed or altered, and never appear in an error message.
function passwordField(body, errors) {
  const problem = passwordProblem(body.password);
  if (problem) { errors.push({ field: 'password', message: problem }); return null; }
  return body.password;
}

const notAnObject = () => ({ value: null, errors: [{ field: 'body', message: 'JSON object expected' }] });

// POST and PUT /settings/shops body (the logo is uploaded separately).
function parseShopBody(req) {
  const body = req.body;
  if (!isPlainObject(body)) return notAnObject();
  const errors = [];
  const value = {
    name: textField(body, 'name', SHOP_RULES.name, errors),
    address: textField(body, 'address', SHOP_RULES.address, errors),
    phone: textField(body, 'phone', SHOP_RULES.phone, errors),
    email: emailField(body, SHOP_RULES, errors),
    website: textField(body, 'website', SHOP_RULES.website, errors),
    timezone: null,
  };
  if (isBlank(body.timezone)) errors.push({ field: 'timezone', message: 'Required' });
  else if (!TIMEZONES.includes(body.timezone)) errors.push({ field: 'timezone', message: 'Must be one of the options from GET /settings/timezones' });
  else value.timezone = body.timezone;
  return { value, errors };
}

function adminFields(body, errors) {
  return {
    firstName: textField(body, 'firstName', ADMIN_RULES.firstName, errors),
    lastName: textField(body, 'lastName', ADMIN_RULES.lastName, errors),
    phone: textField(body, 'phone', ADMIN_RULES.phone, errors),
    email: emailField(body, ADMIN_RULES, errors),
  };
}

// POST /settings/admins body. The Add Admin form has a password field.
function parseAdminCreateBody(req) {
  const body = req.body;
  if (!isPlainObject(body)) return notAnObject();
  const errors = [];
  const value = { ...adminFields(body, errors), password: passwordField(body, errors) };
  return { value, errors };
}

// PUT /settings/admins/:id body. The Edit Admin form has no password field, so a password here is refused rather than
// silently ignored (otherwise the caller would think it had been changed).
function parseAdminUpdateBody(req) {
  const body = req.body;
  if (!isPlainObject(body)) return notAnObject();
  const errors = [];
  const value = adminFields(body, errors);
  if (body.password !== undefined) errors.push({ field: 'password', message: 'Not accepted here; use PUT /settings/admins/:id/password' });
  return { value, errors };
}

// PUT /settings/admins/:id/password body. The Figma has only "Enter new password": no current-password or
// confirmation field, so none is required.
function parsePasswordBody(req) {
  const body = req.body;
  if (!isPlainObject(body)) return notAnObject();
  const errors = [];
  const password = passwordField(body, errors);
  return { value: { password }, errors };
}

module.exports = {
  SHOP_RULES,
  ADMIN_RULES,
  validateShopBody: validate(parseShopBody, 'body'),
  validateAdminCreateBody: validate(parseAdminCreateBody, 'body'),
  validateAdminUpdateBody: validate(parseAdminUpdateBody, 'body'),
  validatePasswordBody: validate(parsePasswordBody, 'body'),
};
