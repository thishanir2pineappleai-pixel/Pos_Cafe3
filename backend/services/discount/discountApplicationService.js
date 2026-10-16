// Sales discount APPLICATIONS: a Menu discount definition applied over a period to all products or to chosen products.
// The definition itself (name and percentage) always comes from the shared Menu discount repository.
// NO price is calculated here. How a product's own Menu discount and a dated application relate (stacking, priority)
// has not been approved, so this service only stores and returns the applications.
const { discountApplicationRepository, discountRepository, menuRepository } = require('../../repositories');
const { ERROR_CODES } = require('../../config/constants/errors');
const { MESSAGES } = require('../../config/constants/messages');
const { DISCOUNT_APPLICATION_STATUS } = require('../../config/constants/status');
const { AppError } = require('../../responses/error');
const { formatAppliesTo } = require('../../utils/formatter');
const { buildMeta } = require('../../utils/pagination');

const notFound = () => new AppError(404, ERROR_CODES.NOT_FOUND, MESSAGES.APPLICATION_NOT_FOUND);
const invalid = (errors) => new AppError(400, ERROR_CODES.VALIDATION_ERROR, MESSAGES.VALIDATION_FAILED, errors);

function toDto(row) {
  return {
    id: row.id,
    discountId: row.discountId,
    discountName: row.discountName,
    type: 'Percentage', // only percentage discounts exist in the designs
    value: row.discountPercentage,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status,
    appliesToAll: row.appliesToAll,
    appliesTo: formatAppliesTo(row.appliesToAll, row.productIds.length), // "All Products" / "8 Products"
    productIds: row.productIds, // only products that still exist
    productCount: row.productIds.length,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// Checks the referenced discount definition and products exist.
async function checkReferences(value) {
  const errors = [];
  if (!(await discountRepository.findById(value.discountId))) errors.push({ field: 'discountId', message: 'Discount does not exist' });
  if (!value.appliesToAll) {
    const found = new Set(await menuRepository.existingIds(value.productIds));
    const missing = value.productIds.filter((id) => !found.has(id));
    if (missing.length) errors.push({ field: 'productIds', message: `Products do not exist: ${missing.join(', ')}` });
  }
  if (errors.length) throw invalid(errors);
}

async function list({ search, page, limit }) {
  const { rows, total } = await discountApplicationRepository.list({ search, offset: (page - 1) * limit, limit });
  return { items: rows.map(toDto), meta: buildMeta(total, page, limit) };
}

async function get(id) {
  const row = await discountApplicationRepository.findById(id);
  if (!row) throw notFound();
  return toDto(row);
}

async function create(value) {
  await checkReferences(value);
  // PENDING APPROVAL: a new application is Active unless a status is given (the Figma list shows new rows as Active).
  const status = value.status ?? DISCOUNT_APPLICATION_STATUS.ACTIVE;
  return toDto(await discountApplicationRepository.create({ ...value, status }));
}

// Replaces the discount, period and products. The status is kept unless one is given.
async function update(id, value) {
  const existing = await discountApplicationRepository.findById(id);
  if (!existing) throw notFound();
  await checkReferences(value);
  return toDto(await discountApplicationRepository.update(id, { ...value, status: value.status ?? existing.status }));
}

async function setStatus(id, status) {
  const row = await discountApplicationRepository.setStatus(id, status);
  if (!row) throw notFound();
  return toDto(row);
}

async function remove(id) {
  if (!(await discountApplicationRepository.remove(id))) throw notFound();
}

module.exports = { list, get, create, update, setStatus, remove };
