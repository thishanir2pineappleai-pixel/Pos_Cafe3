// Integration tests for the Sales Management API (orders, summary, CSV export, discount applications).
// Orders have no creation API, so the tests put TEMPORARY rows straight into the in-memory store; reset() removes
// them before every test. Production code never creates orders. No MySQL is used.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { store, nextId } = require('../../repositories/memory/store');
const { useTestServer } = require('./helpers');

const { ctx, api } = useTestServer();
const V1 = '/api/v1';

function addOrder(over) {
  const id = nextId('orders');
  store.orders.set(id, {
    id, orderNumber: `#VB-${4000 + id}`, type: 'Dine-In', customerId: null, customerName: 'Walk-in',
    items: [{ name: 'Espresso', quantity: 1 }], total: 100, status: 'Paid', placedAt: '2026-03-21T12:00:00', ...over,
  });
}

// Day A (2026-03-21): 5 orders, 3 of them in the 19:00 hour. Day B (03-22): 1 order. Day C (04-01): 1 order.
function seedOrders() {
  addOrder({ orderNumber: '#VB-4829', type: 'Take Away', customerId: 1, customerName: 'Sarah Jenkins', items: [{ name: 'Iced Latte', quantity: 1 }, { name: 'Muffin', quantity: 1 }], total: 840, status: 'Paid', placedAt: '2026-03-21T12:55:00' });
  addOrder({ orderNumber: '#VB-4828', type: 'Dine-In', customerId: 2, customerName: 'Michael Chen', items: [{ name: 'Filter Coffee', quantity: 1 }], total: 180, status: 'Preparing', placedAt: '2026-03-21T12:48:00' });
  addOrder({ orderNumber: '#VB-4827', type: 'Dine-In', customerId: 3, customerName: 'Anita Sharma', items: [{ name: 'Cappuccino', quantity: 3 }, { name: 'Croissants', quantity: 2 }], total: 1240, status: 'Paid', placedAt: '2026-03-21T19:10:00' });
  addOrder({ orderNumber: '#VB-4826', type: 'Take Away', customerId: 1, customerName: 'Donald Obama', items: [{ name: 'Cappuccino', quantity: 1 }], total: 5840, status: 'Cancelled', placedAt: '2026-03-21T19:40:00' });
  addOrder({ orderNumber: '#VB-4825', type: 'Dine-In', customerId: 3, customerName: 'Anita Sharma', items: [{ name: 'Tea', quantity: 2 }], total: 500, status: 'Delivered', placedAt: '2026-03-21T19:50:00' });
  addOrder({ orderNumber: '#VB-4830', type: 'Take Away', customerId: 4, customerName: 'Priya Nair', items: [{ name: 'Mocha', quantity: 1 }], total: 300, status: 'Pending', placedAt: '2026-03-22T08:05:00' });
  addOrder({ orderNumber: '#VB-4900', type: 'Dine-In', customerId: 1, customerName: 'Sarah Jenkins', items: [{ name: 'Latte', quantity: 1 }], total: 250, status: 'Paid', placedAt: '2026-04-01T10:00:00' });
}

const ids = (res) => res.body.data.map((o) => o.orderId);
const fieldsOf = (res) => (res.body.errors || []).map((e) => e.field);

// ---------- empty data ----------
test('with no orders every Sales number is empty or zero (nothing is invented)', async () => {
  const orders = await api('GET', `${V1}/orders`);
  assert.equal(orders.status, 200);
  assert.deepEqual(orders.body.data, []);
  assert.deepEqual(orders.body.meta, { total: 0, page: 1, limit: 10, totalPages: 1 });

  const summary = await api('GET', `${V1}/reports/sales/summary`);
  assert.equal(summary.status, 200);
  assert.deepEqual(summary.body.data, { range: { from: null, to: null }, totalRevenue: 0, totalOrders: 0, newCustomers: 0, peakHour: null });

  const csv = await api('GET', `${V1}/orders/export`);
  assert.equal(csv.status, 200);
  assert.deepEqual([...csv.bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]); // UTF-8 byte order mark for Excel
  assert.equal(csv.text, '﻿"Order ID","Order Type","Customer","Items","Total","Status","Time","Date"\r\n'); // header only
  assert.deepEqual((await api('GET', `${V1}/discounts/applications`)).body.data, []);
});

test('the order API is read-only: there is no way to create orders', async () => {
  for (const method of ['POST', 'PUT', 'DELETE']) {
    const res = await api(method, `${V1}/orders`, { json: { total: 5 } });
    assert.equal(res.status, 404, method);
  }
  assert.equal(store.orders.size, 0);
});

// ---------- order list ----------
test('orders: shape, newest-first order and pagination', async () => {
  seedOrders();
  const all = await api('GET', `${V1}/orders?limit=100`);
  assert.deepEqual(ids(all), ['#VB-4900', '#VB-4830', '#VB-4825', '#VB-4826', '#VB-4827', '#VB-4829', '#VB-4828']);
  assert.deepEqual(all.body.meta, { total: 7, page: 1, limit: 100, totalPages: 1 });
  const first = all.body.data[5]; // Sarah's Day A order
  assert.deepEqual(
    [first.orderId, first.type, first.customer, first.itemsText, first.total, first.status, first.time, first.date],
    ['#VB-4829', 'Take Away', 'Sarah Jenkins', '1x Iced Latte, 1x Muffin', 840, 'Paid', '12:55 PM', '2026-03-21'],
  );
  assert.deepEqual(first.items, [{ name: 'Iced Latte', quantity: 1 }, { name: 'Muffin', quantity: 1 }]);

  const p1 = await api('GET', `${V1}/orders?limit=3`);
  assert.deepEqual(p1.body.meta, { total: 7, page: 1, limit: 3, totalPages: 3 });
  assert.deepEqual(ids(p1), ['#VB-4900', '#VB-4830', '#VB-4825']);
  assert.deepEqual(ids(await api('GET', `${V1}/orders?limit=3&page=3`)), ['#VB-4828']);
  assert.equal((await api('GET', `${V1}/orders?page=9`)).body.data.length, 0);
  for (const q of ['page=0', 'page=x', 'limit=0', 'limit=101']) assert.equal((await api('GET', `${V1}/orders?${q}`)).status, 400, q);
});

test('orders: date filters', async () => {
  seedOrders();
  const count = async (q) => (await api('GET', `${V1}/orders?${q}&limit=100`)).body.meta.total;
  assert.equal(await count('from=2026-03-21&to=2026-03-21'), 5); // a single day
  assert.equal(await count('from=2026-03-22&to=2026-03-22'), 1);
  assert.equal(await count('from=2026-03-21&to=2026-03-22'), 6);
  assert.equal(await count('from=2026-03-22'), 2); // from onward
  assert.equal(await count('to=2026-03-21'), 5); // up to
  assert.equal(await count('from=2025-01-01&to=2025-12-31'), 0);
  for (const q of ['from=2026-02-30', 'to=2026-13-01', 'from=21-03-2026', 'from=abc', 'from=2026-03-22&to=2026-03-21']) {
    const res = await api('GET', `${V1}/orders?${q}`);
    assert.equal(res.status, 400, q);
    assert.ok(fieldsOf(res).length > 0);
  }
});

test('orders: search matches id, type, customer, items, status and time, and combines with dates and paging', async () => {
  seedOrders();
  const found = async (q) => ids(await api('GET', `${V1}/orders?${q}&limit=100`));
  assert.deepEqual(await found('search=sarah'), ['#VB-4900', '#VB-4829']); // customer, case-insensitive
  assert.deepEqual(await found('search=%23vb-4828'), ['#VB-4828']); // order id
  assert.deepEqual(await found('search=muffin'), ['#VB-4829']); // items
  assert.deepEqual(await found('search=cancelled'), ['#VB-4826']); // status
  assert.deepEqual(await found('search=7%3A10%20pm'), ['#VB-4827']); // time "7:10 PM"
  assert.equal((await found('search=take%20away')).length, 3); // type
  assert.equal((await found('search=zzzz')).length, 0);
  assert.deepEqual(await found('search=sarah&from=2026-03-21&to=2026-03-21'), ['#VB-4829']);
  const paged = await api('GET', `${V1}/orders?search=cappuccino&limit=1`);
  assert.deepEqual([paged.body.meta.total, paged.body.meta.totalPages], [2, 2]);
  assert.equal((await api('GET', `${V1}/orders?search=${'a'.repeat(101)}`)).status, 400);
});

// ---------- summary ----------
test('summary: revenue, orders, new customers and peak hour for a date range', async () => {
  seedOrders();
  const get = async (q = '') => (await api('GET', `${V1}/reports/sales/summary${q}`)).body.data;

  const dayA = await get('?from=2026-03-21&to=2026-03-21');
  assert.equal(dayA.totalRevenue, 2760); // 840 + 180 + 1240 + 500; the cancelled order is excluded
  assert.equal(dayA.totalOrders, 5);
  assert.equal(dayA.newCustomers, 3); // customers 1, 2 and 3 placed their first order that day
  assert.deepEqual(dayA.peakHour, { startHour: 19, endHour: 20, orders: 3, label: '7:00 PM – 8:00 PM' });
  assert.deepEqual(dayA.range, { from: '2026-03-21', to: '2026-03-21' });

  const dayB = await get('?from=2026-03-22&to=2026-03-22');
  assert.deepEqual([dayB.totalRevenue, dayB.totalOrders, dayB.newCustomers, dayB.peakHour.label], [300, 1, 1, '8:00 AM – 9:00 AM']);

  const dayC = await get('?from=2026-04-01&to=2026-04-01'); // customer 1 already ordered before
  assert.deepEqual([dayC.totalRevenue, dayC.totalOrders, dayC.newCustomers], [250, 1, 0]);

  const everything = await get();
  assert.deepEqual([everything.totalRevenue, everything.totalOrders, everything.newCustomers, everything.peakHour.startHour], [3310, 7, 4, 19]);

  const none = await get('?from=2025-01-01&to=2025-01-31');
  assert.deepEqual([none.totalRevenue, none.totalOrders, none.newCustomers, none.peakHour], [0, 0, 0, null]);

  assert.equal((await api('GET', `${V1}/reports/sales/summary?from=2026-03-22&to=2026-03-21`)).status, 400);
  assert.equal((await api('GET', `${V1}/reports/sales/summary?from=nope`)).status, 400);
});

test('summary peak hour: ties go to the earlier hour, midnight wraps', async () => {
  addOrder({ placedAt: '2026-03-21T09:10:00' });
  addOrder({ placedAt: '2026-03-21T15:10:00' });
  assert.equal((await api('GET', `${V1}/reports/sales/summary`)).body.data.peakHour.label, '9:00 AM – 10:00 AM');
  addOrder({ placedAt: '2026-03-21T23:30:00' });
  addOrder({ placedAt: '2026-03-21T23:45:00' });
  assert.equal((await api('GET', `${V1}/reports/sales/summary`)).body.data.peakHour.label, '11:00 PM – 12:00 AM');
});

// ---------- CSV export ----------
test('export: CSV uses the same filters as the list, with all rows and safe cells', async () => {
  seedOrders();
  addOrder({ orderNumber: '#VB-5000', customerName: '=HYPERLINK("http://x")', items: [{ name: 'Say "hi", ok', quantity: 1 }], total: 10, placedAt: '2026-03-23T10:00:00' });

  const res = await api('GET', `${V1}/orders/export`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^text\/csv; charset=utf-8/);
  assert.equal(res.headers.get('content-disposition'), 'attachment; filename="sales-orders.csv"');
  const lines = res.text.replace('﻿', '').trimEnd().split('\r\n');
  assert.equal(lines.length, 9); // header + all 8 orders (not just one page)
  assert.equal(lines[0], '"Order ID","Order Type","Customer","Items","Total","Status","Time","Date"');
  assert.ok(res.text.includes('"#VB-4829","Take Away","Sarah Jenkins","1x Iced Latte, 1x Muffin","840","Paid","12:55 PM","2026-03-21"'));
  assert.ok(res.text.includes(`"'=HYPERLINK(""http://x"")"`), 'formula-looking text is neutralized');
  assert.ok(res.text.includes('"1x Say ""hi"", ok"'), 'quotes and commas are escaped');

  const filtered = await api('GET', `${V1}/orders/export?from=2026-03-21&to=2026-03-21&search=anita`);
  assert.equal(filtered.text.trimEnd().split('\r\n').length, 3); // header + 2 rows
  const list = await api('GET', `${V1}/orders?from=2026-03-21&to=2026-03-21&search=anita`);
  assert.equal(list.body.meta.total, 2); // list and export agree

  assert.equal((await api('GET', `${V1}/orders/export?format=csv`)).status, 200);
  for (const format of ['pdf', 'xls']) {
    const res501 = await api('GET', `${V1}/orders/export?format=${format}`);
    assert.equal(res501.status, 501, format);
    assert.equal(res501.body.code, 'NOT_IMPLEMENTED');
  }
  assert.equal((await api('GET', `${V1}/orders/export?format=txt`)).status, 400);
  assert.equal((await api('GET', `${V1}/orders/export?from=2026-02-31`)).status, 400);
});

// ---------- discount applications ----------
async function setup() {
  const category = (await api('POST', `${V1}/categories`, { json: { name: 'Coffee' } })).body.data;
  const discount = (await api('POST', `${V1}/discounts`, { json: { name: 'Seasonal Discount', percentage: 5 } })).body.data;
  const products = [];
  for (const name of ['Espresso', 'Latte', 'Mocha']) {
    const res = await api('POST', `${V1}/products`, { json: { name, categoryId: category.id, sellingPrice: 100, quantity: 10 } });
    products.push(res.body.data);
  }
  return { discount, products };
}
const appBody = (discountId, over = {}) => ({ discountId, startDate: '2026-05-01', endDate: '2026-05-31', appliesToAll: true, ...over });
async function makeApp(discountId, over) {
  const res = await api('POST', `${V1}/discounts/applications`, { json: appBody(discountId, over) });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body.data;
}

test('applications: create for All Products, using the shared Menu discount definition', async () => {
  const { discount } = await setup();
  const app = await makeApp(discount.id);
  assert.deepEqual(
    [app.id, app.discountId, app.discountName, app.type, app.value, app.startDate, app.endDate, app.status, app.appliesToAll, app.appliesTo, app.productCount],
    [1, discount.id, 'Seasonal Discount', 'Percentage', 5, '2026-05-01', '2026-05-31', 'Active', true, 'All Products', 0],
  );
  assert.deepEqual(app.productIds, []);
  assert.equal(Object.keys(app).some((k) => /price/i.test(k)), false, 'no price is calculated');
  // no second discount-name store: the definitions list is unchanged
  assert.equal((await api('GET', `${V1}/discounts`)).body.data.length, 1);
  assert.equal((await api('POST', `${V1}/discounts`, { json: { name: 'seasonal discount', percentage: 9 } })).status, 409); // Menu behaviour intact
  // a definition renamed/added through the Menu API is what applications read
  const other = (await api('POST', `${V1}/discounts`, { json: { name: 'Staff', percentage: 20 } })).body.data;
  const staffApp = await makeApp(other.id);
  assert.deepEqual([staffApp.discountName, staffApp.value], ['Staff', 20]);
});

test('applications: selected products, and All Products versus selected rules', async () => {
  const { discount, products } = await setup();
  const two = await makeApp(discount.id, { appliesToAll: false, productIds: [products[0].id, products[1].id] });
  assert.deepEqual([two.appliesToAll, two.appliesTo, two.productCount, two.productIds], [false, '2 Products', 2, [products[0].id, products[1].id]]);
  const one = await makeApp(discount.id, { appliesToAll: false, productIds: [products[2].id] });
  assert.equal(one.appliesTo, '1 Product');
  assert.equal((await makeApp(discount.id, { appliesToAll: true, productIds: [] })).appliesTo, 'All Products');

  const bad = async (over, field) => {
    const res = await api('POST', `${V1}/discounts/applications`, { json: appBody(discount.id, over) });
    assert.equal(res.status, 400, JSON.stringify(over));
    assert.ok(fieldsOf(res).includes(field), `${JSON.stringify(over)} -> ${fieldsOf(res)}`);
  };
  await bad({ appliesToAll: true, productIds: [products[0].id] }, 'productIds'); // all + a list
  await bad({ appliesToAll: false }, 'productIds'); // selected but none
  await bad({ appliesToAll: false, productIds: [] }, 'productIds');
  await bad({ appliesToAll: false, productIds: [products[0].id, products[0].id] }, 'productIds'); // duplicate ids
  await bad({ appliesToAll: false, productIds: [999] }, 'productIds'); // unknown product
  await bad({ appliesToAll: false, productIds: [products[0].id, 'x'] }, 'productIds');
  await bad({ appliesToAll: 'yes' }, 'appliesToAll');
  await bad({ appliesToAll: undefined }, 'appliesToAll');
});

test('applications: date, status and discount id validation', async () => {
  const { discount } = await setup();
  const url = `${V1}/discounts/applications`;
  const bad = async (json, field) => {
    const res = await api('POST', url, { json });
    assert.equal(res.status, 400, JSON.stringify(json));
    assert.ok(fieldsOf(res).includes(field), `${JSON.stringify(json)} -> ${fieldsOf(res)}`);
  };
  const empty = await api('POST', url, { json: {} });
  assert.deepEqual(fieldsOf(empty).sort(), ['appliesToAll', 'discountId', 'endDate', 'startDate']);
  await bad(appBody(discount.id, { startDate: '2026-02-30' }), 'startDate'); // not a real date
  await bad(appBody(discount.id, { endDate: '31/05/2026' }), 'endDate');
  await bad(appBody(discount.id, { startDate: 20260501 }), 'startDate');
  await bad(appBody(discount.id, { startDate: '2026-06-01', endDate: '2026-05-31' }), 'endDate'); // end before start
  await bad(appBody(999), 'discountId'); // unknown definition
  await bad(appBody('x'), 'discountId');
  await bad(appBody(discount.id, { status: 'active' }), 'status'); // exact labels only
  await bad(appBody(discount.id, { status: 'Paused' }), 'status');
  assert.equal((await api('POST', url, { json: [] })).status, 400);
  assert.equal((await api('POST', url, { json: appBody(discount.id, { startDate: '2026-05-10', endDate: '2026-05-10' }) })).status, 201); // one-day period
  assert.equal((await api('POST', url, { json: appBody(discount.id, { status: 'Inactive' }) })).body.data.status, 'Inactive');
  assert.equal((await api('GET', url)).body.data.length, 2); // rejected requests created nothing
});

test('applications: get, list (search, paging, order), unknown and malformed ids', async () => {
  const { discount, products } = await setup();
  const staff = (await api('POST', `${V1}/discounts`, { json: { name: 'Staff', percentage: 20 } })).body.data;
  const a1 = await makeApp(discount.id);
  const a2 = await makeApp(staff.id, { appliesToAll: false, productIds: [products[0].id] });
  await api('PATCH', `${V1}/discounts/applications/${a1.id}/status`, { json: { status: 'Inactive' } });
  for (let i = 0; i < 4; i += 1) await makeApp(discount.id);

  assert.deepEqual((await api('GET', `${V1}/discounts/applications/${a2.id}`)).body.data, (await api('GET', `${V1}/discounts/applications?search=staff`)).body.data[0]);
  const list = await api('GET', `${V1}/discounts/applications?limit=4`);
  assert.deepEqual(list.body.meta, { total: 6, page: 1, limit: 4, totalPages: 2 });
  assert.equal(list.body.data[0].id, 6); // newest first
  assert.equal((await api('GET', `${V1}/discounts/applications?limit=4&page=2`)).body.data.length, 2);
  const names = async (q) => (await api('GET', `${V1}/discounts/applications?${q}&limit=100`)).body.data.length;
  assert.equal(await names('search=seasonal'), 5);
  assert.equal(await names('search=inactive'), 1);
  assert.equal(await names('search=1%20product'), 1);
  assert.equal(await names('search=all%20products'), 5);
  assert.equal(await names('search=20%20%25'), 1); // value "20 %"
  assert.equal(await names('search=zzzz'), 0);
  for (const q of ['page=0', 'limit=101', `search=${'a'.repeat(101)}`]) assert.equal((await api('GET', `${V1}/discounts/applications?${q}`)).status, 400, q);

  for (const id of ['abc', '0', '-1']) assert.equal((await api('GET', `${V1}/discounts/applications/${id}`)).status, 400, id);
  const url = `${V1}/discounts/applications/99`;
  assert.equal((await api('GET', url)).status, 404);
  assert.equal((await api('PUT', url, { json: appBody(discount.id) })).status, 404);
  assert.equal((await api('PATCH', `${url}/status`, { json: { status: 'Active' } })).status, 404);
  assert.equal((await api('DELETE', url)).status, 404);
});

test('applications: update, status changes and delete', async () => {
  const { discount, products } = await setup();
  const staff = (await api('POST', `${V1}/discounts`, { json: { name: 'Staff', percentage: 20 } })).body.data;
  const app = await makeApp(discount.id);
  const url = `${V1}/discounts/applications/${app.id}`;

  const status = async (value) => api('PATCH', `${url}/status`, { json: { status: value } });
  const off = await status('Inactive');
  assert.equal(off.status, 200);
  assert.equal(off.body.data.status, 'Inactive');
  assert.equal((await status('Active')).body.data.status, 'Active');
  for (const value of ['active', 'Paused', '', null, 5]) assert.equal((await status(value)).status, 400, String(value));
  assert.equal((await api('PATCH', `${url}/status`, { json: {} })).status, 400);

  await status('Inactive');
  const updated = await api('PUT', url, { json: appBody(staff.id, { startDate: '2026-06-01', endDate: '2026-06-30', appliesToAll: false, productIds: [products[1].id, products[2].id] }) });
  assert.equal(updated.status, 200);
  assert.deepEqual(
    [updated.body.data.discountName, updated.body.data.value, updated.body.data.startDate, updated.body.data.endDate, updated.body.data.appliesTo, updated.body.data.status],
    ['Staff', 20, '2026-06-01', '2026-06-30', '2 Products', 'Inactive'], // PUT keeps the status unless one is sent
  );
  const reactivated = await api('PUT', url, { json: appBody(staff.id, { status: 'Active' }) });
  assert.deepEqual([reactivated.body.data.status, reactivated.body.data.appliesTo], ['Active', 'All Products']);
  assert.equal((await api('PUT', url, { json: appBody(999) })).status, 400); // unknown discount, nothing changed
  assert.equal((await api('GET', url)).body.data.discountName, 'Staff');

  assert.equal((await api('DELETE', url)).status, 200);
  assert.equal((await api('GET', url)).status, 404);
  assert.equal((await api('DELETE', url)).status, 404);
  // deleting an application leaves definitions and products alone
  assert.equal((await api('GET', `${V1}/discounts`)).body.data.length, 2);
  assert.equal((await api('GET', `${V1}/products`)).body.meta.total, 3);
});

test('applications follow the Menu: a deleted product drops out of selected applications', async () => {
  const { discount, products } = await setup();
  const app = await makeApp(discount.id, { appliesToAll: false, productIds: [products[0].id, products[1].id] });
  assert.equal((await api('DELETE', `${V1}/products/${products[0].id}`)).status, 200);
  const after = (await api('GET', `${V1}/discounts/applications/${app.id}`)).body.data;
  assert.deepEqual([after.productCount, after.appliesTo, after.productIds], [1, '1 Product', [products[1].id]]);
  assert.equal((await api('PUT', `${V1}/discounts/applications/${app.id}`, { json: appBody(discount.id, { appliesToAll: false, productIds: [products[0].id] }) })).status, 400);
});

test('Menu endpoints still work next to the Sales endpoints', async () => {
  const { products } = await setup();
  assert.equal((await api('GET', `${V1}/products/${products[0].id}`)).status, 200);
  assert.deepEqual((await api('GET', `${V1}/products/summary`)).body.data, { total: 3, active: 3, outOfStock: 0, categories: 1 });
  assert.equal((await api('GET', `${V1}/discounts`)).body.data.length, 1);
});

// ---------- security ----------
test('Sales routes keep CORS limited to the local frontend and the server stays on 127.0.0.1', async () => {
  for (const url of [`${V1}/orders`, `${V1}/reports/sales/summary`, `${V1}/discounts/applications`]) {
    const ok = await api('GET', url, { headers: { origin: 'http://localhost:5173' } });
    assert.equal(ok.headers.get('access-control-allow-origin'), 'http://localhost:5173', url);
    const bad = await api('GET', url, { headers: { origin: 'http://evil.example' } });
    assert.equal(bad.headers.get('access-control-allow-origin'), null, url);
  }
  assert.equal(ctx.server.address().address, '127.0.0.1');
});
