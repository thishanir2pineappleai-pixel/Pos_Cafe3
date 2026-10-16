// Sales numbers computed only from orders that really exist in the repository. With no orders every number is 0 (or
// null / empty) and nothing is invented. Two groups of functions:
//   * summary(): the four Sales Management cards (all shops, unauthenticated Sales endpoint).
//   * dashboard*(): the authenticated Dashboard, ALWAYS limited to one shop of the caller's account.
const { businessProfileRepository, menuRepository, orderRepository } = require('../../repositories');
const { ERROR_CODES } = require('../../config/constants/errors');
const { MESSAGES } = require('../../config/constants/messages');
const { ORDER_STATUS } = require('../../config/constants/status');
const { AppError } = require('../../responses/error');
const { addDays, dateOf, hourLabel, hourOf, monthRange, timeLabel, weekStart } = require('../../utils/date');
const { formatItemsText } = require('../../utils/formatter');
const imageService = require('../storage/imageService');

// PENDING APPROVAL: revenue excludes Cancelled orders; Total Order counts every order in range.
const roundMoney = (n) => Math.round(n * 100) / 100;
const revenueOf = (orders) => roundMoney(orders.filter((o) => o.status !== ORDER_STATUS.CANCELLED).reduce((sum, o) => sum + o.total, 0));

// The clock hour with the most orders; ties go to the earlier hour.
function peakHour(orders) {
  const counts = new Map();
  for (const o of orders) counts.set(hourOf(o.placedAt), (counts.get(hourOf(o.placedAt)) || 0) + 1);
  let best = null;
  for (const [hour, count] of [...counts.entries()].sort((a, b) => a[0] - b[0])) {
    if (best === null || count > best.orders) best = { startHour: hour, endHour: (hour + 1) % 24, orders: count };
  }
  return best && { ...best, label: `${hourLabel(best.startHour)} – ${hourLabel(best.endHour)}` };
}

async function summary({ from, to }) {
  const orders = await orderRepository.findAll({ from, to, search: null });
  return {
    range: { from: from ?? null, to: to ?? null },
    totalRevenue: revenueOf(orders),
    totalOrders: orders.length,
    newCustomers: await orderRepository.countNewCustomers({ from, to }), // needs customerId on orders; see repository
    peakHour: peakHour(orders),
  };
}

// ---------------- Dashboard ----------------
// A shop id nobody has: used when the account has no shop, so the queries match no orders instead of every order.
const NO_SHOP = -1;

// The shop to report on: the requested one if it belongs to the caller's account (404 otherwise), else the account's
// first shop, else NO_SHOP.
async function resolveShopId(auth, requested) {
  const shops = await businessProfileRepository.listByAccount(auth.accountId);
  if (requested !== null && requested !== undefined) {
    if (!shops.some((s) => s.id === requested)) throw new AppError(404, ERROR_CODES.NOT_FOUND, MESSAGES.SHOP_NOT_FOUND);
    return requested;
  }
  const first = [...shops].sort((a, b) => a.id - b.id)[0];
  return first ? first.id : NO_SHOP;
}

const shopOut = (shopId) => (shopId === NO_SHOP ? null : shopId);
// Percentage change against the previous period, one decimal; null when there is nothing to compare with.
const changePercent = (current, previous) => (previous === 0 ? null : Math.round(((current - previous) / previous) * 1000) / 10);

// Today's cards with the change versus the day before ("+5.2% Vs Yesterday").
async function dashboardSummary({ shopId, date }) {
  const yesterday = addDays(date, -1);
  const [today, before] = await Promise.all([
    orderRepository.findAll({ from: date, to: date, shopId }),
    orderRepository.findAll({ from: yesterday, to: yesterday, shopId }),
  ]);
  const newToday = await orderRepository.countNewCustomers({ from: date, to: date, shopId });
  const newBefore = await orderRepository.countNewCustomers({ from: yesterday, to: yesterday, shopId });
  const sales = revenueOf(today);
  return {
    date,
    shopId: shopOut(shopId),
    sales: { value: sales, changePercent: changePercent(sales, revenueOf(before)) },
    orders: { value: today.length, changePercent: changePercent(today.length, before.length) },
    newCustomers: { value: newToday, changePercent: changePercent(newToday, newBefore) },
    peakHours: peakHour(today), // null when there were no orders; the design's "+5.2%" on this card has no defined meaning
  };
}

// All five statuses are always present, so the strip never has a missing card.
async function dashboardOrderStatus({ shopId, date }) {
  const orders = await orderRepository.findAll({ from: date, to: date, shopId });
  return {
    date,
    shopId: shopOut(shopId),
    statuses: Object.values(ORDER_STATUS).map((status) => ({ status, count: orders.filter((o) => o.status === status).length })),
  };
}

// PENDING APPROVAL: the design has no period for this card, so it follows the same Today / Week / Month choice (default today).
function periodRange(period, date) {
  if (period === 'week') { const from = weekStart(date); return { from, to: addDays(from, 6) }; }
  if (period === 'month') return monthRange(date);
  return { from: date, to: date };
}

// Items sold, most first. Cancelled orders are ignored. An item is matched by productId when the order line has one,
// otherwise by name; category, picture and price come from the Menu product when it can be found.
async function dashboardTopSelling({ shopId, period, date, limit }) {
  const orders = (await orderRepository.findAll({ ...periodRange(period, date), shopId })).filter((o) => o.status !== ORDER_STATUS.CANCELLED);
  const sold = new Map();
  for (const order of orders) {
    for (const item of order.items) {
      const key = item.productId ? `p${item.productId}` : `n${item.name.toLowerCase()}`;
      const entry = sold.get(key) ?? { productId: item.productId ?? null, name: item.name, sold: 0, unitPrice: item.unitPrice ?? null };
      entry.sold += item.quantity;
      if (entry.unitPrice === null && item.unitPrice !== undefined) entry.unitPrice = item.unitPrice;
      sold.set(key, entry);
    }
  }
  const top = [...sold.values()].sort((a, b) => b.sold - a.sold || a.name.localeCompare(b.name)).slice(0, limit);
  const items = [];
  for (const entry of top) {
    const product = entry.productId ? await menuRepository.findById(entry.productId) : null;
    items.push({
      productId: entry.productId,
      name: product ? product.name : entry.name,
      category: product ? product.categoryName : null,
      image: product ? imageService.productImageUrl(product.imagePath) : null,
      sold: entry.sold,
      price: product ? product.sellingPrice : entry.unitPrice,
    });
  }
  return { period, date, shopId: shopOut(shopId), items };
}

async function dashboardRecentOrders({ shopId, limit }) {
  const rows = await orderRepository.recent({ shopId, limit });
  return {
    shopId: shopOut(shopId),
    orders: rows.map((o) => ({
      id: o.id,
      orderId: o.orderNumber,
      tableId: o.tableId ?? null, // dine-in orders only
      type: o.type,
      status: o.status,
      total: o.total,
      itemsText: formatItemsText(o.items),
      time: timeLabel(o.placedAt),
      date: dateOf(o.placedAt),
    })),
  };
}

module.exports = {
  summary, peakHour, revenueOf, resolveShopId, NO_SHOP, dashboardSummary, dashboardOrderStatus, dashboardTopSelling, dashboardRecentOrders,
};
