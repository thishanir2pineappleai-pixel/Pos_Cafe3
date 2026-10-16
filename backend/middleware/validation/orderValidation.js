const { isBlank, toText } = require('../../utils/validator');
const { parsePagination } = require('../../utils/pagination');
const { parseDateOnly } = require('../../utils/date');
const { validate } = require('./validate');

// Filters shared by the order list, the CSV export and the sales summary, so all three always agree.
// from / to are 'YYYY-MM-DD' and inclusive. A single day is from = to. Neither given means every date
// (the Figma defaults to "Today", but the frontend sends that day explicitly).
function readFilters(query, errors, { withSearch }) {
  const value = { from: null, to: null, search: null };
  for (const field of ['from', 'to']) {
    if (isBlank(query[field])) continue;
    value[field] = parseDateOnly(query[field]);
    if (value[field] === null) errors.push({ field, message: 'Must be a real date as YYYY-MM-DD' });
  }
  if (value.from && value.to && value.from > value.to) errors.push({ field: 'to', message: 'Must not be before from' });
  if (withSearch && !isBlank(query.search)) {
    value.search = toText(query.search, { max: 100 });
    if (!value.search) errors.push({ field: 'search', message: 'Must be at most 100 characters' });
  }
  return value;
}

// GET /orders?from&to&search&page&limit
function parseOrderQuery(req) {
  const errors = [];
  const filters = readFilters(req.query, errors, { withSearch: true });
  const pagination = parsePagination(req.query);
  errors.push(...pagination.errors);
  return { value: { ...filters, page: pagination.page, limit: pagination.limit }, errors };
}

// GET /orders/export?from&to&search&format
// The Figma menu offers .pdf, .csv and .xls; only csv is implemented (the others answer 501).
const EXPORT_FORMATS = ['csv', 'pdf', 'xls'];
function parseExportQuery(req) {
  const errors = [];
  const filters = readFilters(req.query, errors, { withSearch: true });
  const format = isBlank(req.query.format) ? 'csv' : req.query.format;
  if (!EXPORT_FORMATS.includes(format)) errors.push({ field: 'format', message: `Must be one of: ${EXPORT_FORMATS.join(', ')}` });
  return { value: { ...filters, format }, errors };
}

// GET /reports/sales/summary?from&to
function parseSummaryQuery(req) {
  const errors = [];
  const { from, to } = readFilters(req.query, errors, { withSearch: false });
  return { value: { from, to }, errors };
}

// GET /dashboard/*?date&period&shopId&limit. `date` defaults to today on the server; the other fields to nothing / today.
// PENDING: default limits (top selling 4, recent orders 5, stock items 4) copy the number of rows drawn in the design.
const PERIODS = ['today', 'week', 'month'];
function parseDashboardQuery(req) {
  const errors = [];
  const q = req.query;
  const date = isBlank(q.date) ? null : parseDateOnly(q.date);
  if (!isBlank(q.date) && date === null) errors.push({ field: 'date', message: 'Must be a real date as YYYY-MM-DD' });
  const period = isBlank(q.period) ? 'today' : q.period;
  if (!PERIODS.includes(period)) errors.push({ field: 'period', message: `Must be one of: ${PERIODS.join(', ')}` });
  const intOrNull = (field, min, max) => {
    if (isBlank(q[field])) return null;
    const n = typeof q[field] === 'string' && /^\d+$/.test(q[field]) ? Number(q[field]) : NaN;
    if (!(n >= min && n <= max)) { errors.push({ field, message: `Must be a whole number from ${min} to ${max}` }); return null; }
    return n;
  };
  return { value: { date, period, shopId: intOrNull('shopId', 1, Number.MAX_SAFE_INTEGER), limit: intOrNull('limit', 1, 20) }, errors };
}

module.exports = {
  validateDashboardQuery: validate(parseDashboardQuery, 'query'),
  validateOrderQuery: validate(parseOrderQuery, 'query'),
  validateExportQuery: validate(parseExportQuery, 'query'),
  validateSummaryQuery: validate(parseSummaryQuery, 'query'),
};
