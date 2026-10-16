// In-memory repository for Sales discount APPLICATIONS (temporary, see store.js: all data is lost on restart).
// The discount definitions (name and percentage) are NOT stored here: rows only hold discountId and are joined with
// the Menu discount repository's store, so there is a single place where discount names live.
const { store, nextId, clone, now } = require('./store');
const { formatAppliesTo } = require('../../utils/formatter');

// Like an inner join in SQL: product ids whose product no longer exists are dropped.
function withJoins(app) {
  const discount = store.discounts.get(app.discountId);
  const productIds = app.appliesToAll ? [] : app.productIds.filter((id) => store.products.has(id));
  return {
    ...app,
    productIds,
    discountName: discount ? discount.name : null,
    discountPercentage: discount ? discount.percentage : null,
  };
}

const searchableText = (a) => [a.discountName, 'Percentage', `${a.discountPercentage} %`, formatAppliesTo(a.appliesToAll, a.productIds.length), a.status];

module.exports = {
  async list({ search, offset, limit }) {
    const needle = search ? search.toLowerCase() : null;
    const rows = [...store.discountApplications.values()]
      .map(withJoins)
      .filter((a) => !needle || searchableText(a).some((t) => t && t.toLowerCase().includes(needle)))
      .sort((a, b) => b.id - a.id); // newest first (PENDING APPROVAL)
    return { total: rows.length, rows: rows.slice(offset, offset + limit).map(clone) };
  },

  async findById(id) {
    const app = store.discountApplications.get(id);
    return app ? clone(withJoins(app)) : null;
  },

  // data: { discountId, startDate, endDate, status, appliesToAll, productIds }
  // With MySQL: one row in discount_applications plus rows in discount_application_products, in one transaction.
  async create(data) {
    const stamp = now();
    const app = { id: nextId('discountApplications'), ...data, productIds: [...data.productIds], createdAt: stamp, updatedAt: stamp };
    store.discountApplications.set(app.id, app);
    return clone(withJoins(app));
  },

  async update(id, data) {
    const existing = store.discountApplications.get(id);
    if (!existing) return null;
    const app = { ...existing, ...data, productIds: [...data.productIds], updatedAt: now() };
    store.discountApplications.set(id, app);
    return clone(withJoins(app));
  },

  async setStatus(id, status) {
    const app = store.discountApplications.get(id);
    if (!app) return null;
    app.status = status;
    app.updatedAt = now();
    return clone(withJoins(app));
  },

  // Removes only the application (never the discount definition or any product).
  async remove(id) {
    const app = store.discountApplications.get(id);
    if (!app) return null;
    store.discountApplications.delete(id);
    return clone(app);
  },
};
