// Dashboard endpoints: sign-in required, shop-scoped, date/period filters, empty data and real calculated numbers.
// Orders have no creation API, so the tests put TEMPORARY rows in memory (wiped before every test). No MySQL.
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const clock = require('../../utils/clock');
const { localDate } = require('../../utils/date');
const { useTestServer, createUser, tokenFor, addShop, addOrder } = require('./helpers');

const { ctx, api } = useTestServer();
const D = '/api/v1/dashboard';
const DATE = '2026-03-21'; // a Saturday; its week is Monday 2026-03-16 to Sunday 2026-03-22
const as = (token) => ({ headers: { authorization: `Bearer ${token}` } });
const get = async (path, query = `date=${DATE}`, token = ctx.token) => api('GET', `${D}${path}?${query}`, as(token));

let shopA;
let shopB;
let rivalToken;
beforeEach(async () => {
  await createUser({ id: 1, accountId: 1, email: 'owner@poscafe.com' });
  await createUser({ id: 2, accountId: 2, email: 'rival@other.com' });
  shopA = (await addShop(1, 'Shop A')).id;
  shopB = (await addShop(2, 'Shop B')).id;
  ctx.token = (await tokenFor(1)).token;
  rivalToken = (await tokenFor(2)).token;
});

// Shop A: six orders on DATE (one cancelled), one the day before, a few other days. Shop B and a shop-less order must never show up.
function seedOrders(productId = null) {
  const a = (over) => addOrder({ shopId: shopA, ...over });
  a({ orderNumber: '#A1', tableId: 'T - 01', customerId: 1, total: 840, status: 'Paid', placedAt: `${DATE}T12:55:00`, items: [{ name: 'Iced Latte', quantity: 2, unitPrice: 320 }, { name: 'Muffin', quantity: 1 }] });
  a({ orderNumber: '#A2', tableId: 'T - 22', customerId: 2, total: 180, status: 'Preparing', placedAt: `${DATE}T12:48:00`, items: [{ name: 'Filter Coffee', quantity: 1 }] });
  a({ orderNumber: '#A3', tableId: 'T - 07', customerId: 3, total: 1240, status: 'Paid', placedAt: `${DATE}T19:10:00`, items: [{ productId, name: 'Cappuccino', quantity: 3 }, { name: 'Croissants', quantity: 2 }] });
  a({ orderNumber: '#A4', tableId: 'T - 06', customerId: 1, total: 5840, status: 'Cancelled', placedAt: `${DATE}T19:40:00`, items: [{ productId, name: 'Cappuccino', quantity: 4 }] });
  a({ orderNumber: '#A5', tableId: 'T - 03', customerId: 3, total: 500, status: 'Delivered', placedAt: `${DATE}T19:50:00`, items: [{ name: 'Iced Latte', quantity: 1 }] });
  a({ orderNumber: '#A6', tableId: null, type: 'Take Away', customerId: 4, total: 300, status: 'Pending', placedAt: `${DATE}T05:30:00`, items: [{ name: 'Iced Latte', quantity: 1 }] });
  a({ orderNumber: '#Y1', customerId: 5, total: 1000, status: 'Paid', placedAt: '2026-03-20T10:00:00' }); // the day before
  a({ orderNumber: '#MON', customerId: 6, total: 700, status: 'Paid', placedAt: '2026-03-16T09:15:00', items: [{ name: 'Espresso', quantity: 5 }] });
  a({ orderNumber: '#SUN', customerId: 7, total: 200, status: 'Paid', placedAt: '2026-03-22T08:00:00' });
  a({ orderNumber: '#APR', customerId: 8, total: 400, status: 'Paid', placedAt: '2026-04-05T10:00:00' });
  a({ orderNumber: '#JAN', customerId: 9, total: 100, status: 'Paid', placedAt: '2026-01-10T10:00:00' });
  addOrder({ shopId: shopB, orderNumber: '#B1', tableId: 'T - 99', customerId: 1, total: 9999, status: 'Paid', placedAt: `${DATE}T12:00:00` });
  addOrder({ shopId: shopB, orderNumber: '#B2', customerId: 50, total: 1, status: 'Paid', placedAt: `${DATE}T13:00:00` });
  addOrder({ shopId: null, orderNumber: '#NOSHOP', customerId: 60, total: 7777, status: 'Paid', placedAt: `${DATE}T14:00:00` });
}

const ENDPOINTS = ['/summary', '/sales-trend', '/top-selling', '/order-status', '/stock', '/recent-orders'];

test('every Dashboard endpoint requires a signed-in user', async () => {
  for (const path of ENDPOINTS) {
    const signedIn = ctx.token;
    ctx.token = null; // the helper attaches ctx.token to every call, so clear it to send no token at all
    assert.equal((await api('GET', `${D}${path}`)).status, 401, path);
    ctx.token = signedIn;
    assert.equal((await api('GET', `${D}${path}`, as('bad.token.value'))).status, 401, path);
    assert.equal((await get(path)).status, 200, path);
  }
});

test('with no data every endpoint returns its normal structure, empty or zero', async () => {
  const summary = (await get('/summary')).body.data;
  assert.deepEqual(summary, {
    date: DATE, shopId: shopA,
    sales: { value: 0, changePercent: null }, orders: { value: 0, changePercent: null }, newCustomers: { value: 0, changePercent: null }, peakHours: null,
  });
  const trend = (await get('/sales-trend')).body.data;
  assert.deepEqual([trend.period, trend.total, trend.points.length, trend.points.every((p) => p.value === 0)], ['today', 0, 7, true]);
  assert.deepEqual((await get('/sales-trend', `date=${DATE}&period=week`)).body.data.points.map((p) => p.label), ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  assert.equal((await get('/sales-trend', `date=${DATE}&period=month`)).body.data.points.length, 12);
  assert.deepEqual((await get('/top-selling')).body.data.items, []);
  assert.deepEqual((await get('/order-status')).body.data.statuses, [
    { status: 'Paid', count: 0 }, { status: 'Preparing', count: 0 }, { status: 'Pending', count: 0 }, { status: 'Delivered', count: 0 }, { status: 'Cancelled', count: 0 },
  ]);
  assert.deepEqual((await get('/stock')).body.data, { source: 'menu_products', counts: { outOfStock: 0, lowStock: 0, inStock: 0 }, items: [] });
  assert.deepEqual((await get('/recent-orders')).body.data, { shopId: shopA, orders: [] });
});

test('summary: today, change versus yesterday, new customers and peak hours', async () => {
  seedOrders();
  const { sales, orders, newCustomers, peakHours, shopId } = (await get('/summary')).body.data;
  assert.equal(shopId, shopA);
  assert.deepEqual(sales, { value: 3060, changePercent: 206 }); // 840+180+1240+500+300, cancelled excluded; (3060-1000)/1000
  assert.deepEqual(orders, { value: 6, changePercent: 500 }); // every order counts, cancelled too
  assert.deepEqual(newCustomers, { value: 4, changePercent: 300 }); // customers 1-4 (shop B's customer 1 does not count)
  assert.deepEqual(peakHours, { startHour: 19, endHour: 20, orders: 3, label: '7:00 PM – 8:00 PM' });
  const quiet = (await get('/summary', 'date=2026-02-01')).body.data;
  assert.deepEqual([quiet.sales.value, quiet.orders.value, quiet.peakHours], [0, 0, null]);
  const first = (await get('/summary', 'date=2026-03-20')).body.data; // nothing the day before that: change is null, not infinity
  assert.deepEqual([first.sales.value, first.sales.changePercent], [1000, null]);
});

test('summary without a date uses today on the server', async () => {
  const today = localDate(clock.now());
  addOrder({ shopId: shopA, total: 250, placedAt: `${today}T10:00:00` });
  const res = await api('GET', `${D}/summary`, as(ctx.token));
  assert.deepEqual([res.body.data.date, res.body.data.sales.value, res.body.data.orders.value], [today, 250, 1]);
});

test('sales trend: today buckets, the week and the year', async () => {
  seedOrders();
  const today = (await get('/sales-trend')).body.data;
  assert.deepEqual(today.points, [
    { label: '06:00 AM', value: 0 }, { label: '09:00 AM', value: 0 }, { label: '12:00 PM', value: 1020 }, { label: '15:00 PM', value: 0 },
    { label: '18:00 PM', value: 1740 }, { label: '21:00 PM', value: 0 }, { label: '12:00 AM', value: 300 },
  ]);
  assert.equal(today.total, 3060);
  const week = (await get('/sales-trend', `date=${DATE}&period=week`)).body.data;
  assert.deepEqual(week.points.map((p) => p.value), [700, 0, 0, 0, 1000, 3060, 200]);
  assert.equal(week.total, 4960);
  const month = (await get('/sales-trend', `date=2026-03-05&period=month`)).body.data;
  assert.deepEqual(month.points.map((p) => p.value), [100, 0, 4960, 400, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(month.points.map((p) => p.label).slice(0, 3), ['Jan', 'Feb', 'Mar']);
});

test('top selling: items sold, cancelled orders ignored, product details from the Menu', async () => {
  const category = (await api('POST', '/api/v1/categories', { json: { name: 'Coffee' } })).body.data;
  const product = (await api('POST', '/api/v1/products', { json: { name: 'Cappuccino Special', categoryId: category.id, sellingPrice: 500, quantity: 9 } })).body.data;
  seedOrders(product.id);
  const items = (await get('/top-selling')).body.data.items;
  assert.deepEqual(items.map((i) => [i.name, i.sold]), [['Iced Latte', 4], ['Cappuccino Special', 3], ['Croissants', 2], ['Filter Coffee', 1]]);
  assert.deepEqual([items[0].price, items[0].category, items[0].image], [320, null, null], 'a line without a product uses the price on the order');
  assert.deepEqual([items[1].category, items[1].price, items[1].productId], ['Coffee', 500, product.id]);
  assert.equal((await get('/top-selling', `date=${DATE}&limit=2`)).body.data.items.length, 2);
  const week = (await get('/top-selling', `date=${DATE}&period=week&limit=1`)).body.data;
  // 5 on Monday's order, plus the default single Espresso on the orders that list no items (#Y1 and #SUN) in that week
  assert.deepEqual([week.period, week.items[0].name, week.items[0].sold], ['week', 'Espresso', 7]);
});

test('order status totals for the day include all five statuses', async () => {
  seedOrders();
  assert.deepEqual((await get('/order-status')).body.data.statuses, [
    { status: 'Paid', count: 2 }, { status: 'Preparing', count: 1 }, { status: 'Pending', count: 1 }, { status: 'Delivered', count: 1 }, { status: 'Cancelled', count: 1 },
  ]);
});

test('recent orders: newest first, limited, with the table id', async () => {
  seedOrders();
  const res = (await get('/recent-orders', 'limit=5')).body.data;
  assert.deepEqual(res.orders.map((o) => o.orderId), ['#APR', '#SUN', '#A5', '#A4', '#A3']);
  const a5 = res.orders[2];
  assert.deepEqual([a5.tableId, a5.status, a5.total, a5.time, a5.date, a5.type], ['T - 03', 'Delivered', 500, '7:50 PM', DATE, 'Dine-In']);
  assert.equal((await get('/recent-orders', 'limit=2')).body.data.orders.length, 2);
  assert.equal((await get('/recent-orders', '')).body.data.orders.length, 5, 'the default shows five, like the design');
  const takeAway = (await get('/recent-orders', 'limit=20')).body.data.orders.find((o) => o.orderId === '#A6');
  assert.equal(takeAway.tableId, null);
});

test('stock summary counts Menu products and lists the ones that need attention', async () => {
  const category = (await api('POST', '/api/v1/categories', { json: { name: 'Coffee' } })).body.data;
  for (const [name, quantity] of [['Out one', 0], ['Low three', 3], ['Low two', 2], ['Plenty', 50]]) {
    await api('POST', '/api/v1/products', { json: { name, categoryId: category.id, sellingPrice: 100, quantity, lowStockAlert: 5 } });
  }
  const stock = (await get('/stock')).body.data;
  assert.deepEqual(stock.counts, { outOfStock: 1, lowStock: 2, inStock: 1 });
  assert.deepEqual(stock.items.map((i) => [i.name, i.status, i.quantity]), [['Out one', 'Out of stock', 0], ['Low two', 'Low Stock', 2], ['Low three', 'Low Stock', 3]]);
  assert.equal((await get('/stock', 'limit=1')).body.data.items.length, 1);
});

// ---------- shop-level isolation ----------
test('each account sees only its own shop, and cannot ask for another account\'s shop', async () => {
  seedOrders();
  const mine = (await get('/summary')).body.data;
  const theirs = (await get('/summary', `date=${DATE}`, rivalToken)).body.data;
  assert.equal(mine.sales.value, 3060);
  assert.deepEqual([theirs.shopId, theirs.sales.value, theirs.orders.value, theirs.newCustomers.value], [shopB, 10000, 2, 2]);
  assert.deepEqual((await get('/recent-orders', 'limit=20', rivalToken)).body.data.orders.map((o) => o.orderId).sort(), ['#B1', '#B2']);

  assert.equal((await get('/summary', `date=${DATE}&shopId=${shopB}`)).status, 404, "another account's shop id");
  assert.equal((await get('/recent-orders', `shopId=${shopB}`)).status, 404);
  assert.equal((await get('/sales-trend', `date=${DATE}&shopId=${shopB}`)).status, 404);
  assert.equal((await get('/top-selling', `shopId=999`)).status, 404, 'a shop that does not exist looks the same');
  assert.equal((await get('/summary', `date=${DATE}&shopId=${shopA}`)).body.data.sales.value, 3060, 'your own shop id is fine');

  for (const path of ['/summary', '/sales-trend', '/top-selling', '/order-status', '/recent-orders']) {
    assert.ok(!JSON.stringify((await get(path, `date=${DATE}&limit=20`)).body).includes('#B1'), `${path} leaked another shop's order`);
  }
  assert.ok(!JSON.stringify((await get('/recent-orders', 'limit=20')).body).includes('#NOSHOP'), 'orders without a shop never show');
});

test('an account with no shop gets empty results, never everybody\'s orders', async () => {
  seedOrders();
  await createUser({ id: 3, accountId: 3, email: 'noshop@x.com' });
  const token = (await tokenFor(3)).token;
  const summary = (await get('/summary', `date=${DATE}`, token)).body.data;
  assert.deepEqual([summary.shopId, summary.sales.value, summary.orders.value, summary.peakHours], [null, 0, 0, null]);
  assert.deepEqual((await get('/recent-orders', 'limit=20', token)).body.data, { shopId: null, orders: [] });
  assert.equal((await get('/top-selling', `date=${DATE}`, token)).body.data.items.length, 0);
  assert.equal((await get('/sales-trend', `date=${DATE}`, token)).body.data.total, 0);
});

test('query validation', async () => {
  for (const q of ['date=2026-02-30', 'date=21-03-2026', 'period=year', 'shopId=abc', 'shopId=0', 'limit=0', 'limit=21', 'limit=x']) {
    const res = await get('/summary', q);
    assert.equal(res.status, 400, q);
    assert.ok(res.body.errors.length > 0);
  }
});

test('the existing Sales endpoints still see every order (they are not shop scoped yet)', async () => {
  seedOrders();
  const all = await api('GET', '/api/v1/orders?limit=100');
  assert.equal(all.body.meta.total, 14);
  const summary = await api('GET', `/api/v1/reports/sales/summary?from=${DATE}&to=${DATE}`);
  assert.equal(summary.body.data.totalOrders, 9);
});
