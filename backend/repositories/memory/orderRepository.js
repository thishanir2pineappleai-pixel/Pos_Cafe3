// In-memory order READER (temporary, see store.js). There is deliberately no create/update/delete here:
// order creation is a separate POS feature that does not exist yet, so at runtime this collection is empty and every
// Sales metric is zero. With MySQL these methods become SELECTs over the orders / order_items / customers tables.
const { store, clone } = require('./store');
const { dateOf, inDateRange, timeLabel } = require('../../utils/date');
const { formatItemsText } = require('../../utils/formatter');

const searchableText = (o) => [o.orderNumber, o.type, o.customerName, formatItemsText(o.items), o.status, timeLabel(o.placedAt)];

// Newest first (the order shown in the Figma table is assumed to be newest first: PENDING APPROVAL).
const newestFirst = (a, b) => (a.placedAt < b.placedAt ? 1 : a.placedAt > b.placedAt ? -1 : b.id - a.id);

// `shopId` is optional: the unauthenticated Sales endpoints pass none and see every order; the authenticated Dashboard
// always passes the caller's shop, and an order without that shopId is never returned.
function matching({ from, to, search, shopId }) {
  const needle = search ? search.toLowerCase() : null;
  return [...store.orders.values()]
    .filter((o) => shopId === undefined || shopId === null ? true : o.shopId === shopId)
    .filter((o) => inDateRange(dateOf(o.placedAt), { from, to }))
    .filter((o) => !needle || searchableText(o).some((text) => text.toLowerCase().includes(needle)))
    .sort(newestFirst);
}

module.exports = {
  // filters: { from, to, search } (dates 'YYYY-MM-DD', inclusive; all optional)
  async list({ from, to, search, offset, limit }) {
    const rows = matching({ from, to, search });
    return { total: rows.length, rows: rows.slice(offset, offset + limit).map(clone) };
  },

  // Every matching row, no paging (summary numbers and CSV export use the same filters as the list).
  async findAll({ from, to, search, shopId }) {
    return matching({ from, to, search, shopId }).map(clone);
  },

  // Newest orders first. A shopId is REQUIRED here (the Dashboard never lists orders across shops).
  async recent({ shopId, limit }) {
    return matching({ shopId: shopId ?? -1 }).slice(0, limit).map(clone);
  },

  // PENDING APPROVAL: a "new customer" is a customerId whose very first order (any status) falls inside the range.
  // Orders without a customerId can not be counted. Real answers need the future Customer data.
  async countNewCustomers({ from, to, shopId }) {
    const firstOrder = new Map();
    for (const o of store.orders.values()) {
      if (o.customerId === undefined || o.customerId === null) continue;
      if (shopId !== undefined && shopId !== null && o.shopId !== shopId) continue;
      const date = dateOf(o.placedAt);
      if (!firstOrder.has(o.customerId) || date < firstOrder.get(o.customerId)) firstOrder.set(o.customerId, date);
    }
    return [...firstOrder.values()].filter((date) => inDateRange(date, { from, to })).length;
  },
};
