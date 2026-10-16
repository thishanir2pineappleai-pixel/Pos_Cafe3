// Integration tests for the Settings API (shop profiles, admin profiles, password change, profile images) now that it
// needs a signed-in user and works only on that user's own account. Real Express app on a random 127.0.0.1 port,
// in-memory repositories, no MySQL, no sample data. The signed-in owner is a fast fixture with id 9000 (so ids of
// profiles created through the API still start at 1) and is excluded from the admin lists below.
const { test, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { store } = require('../../repositories/memory/store');
const { verifyPassword } = require('../../services/auth/bcryptService');
const { uploads } = require('../../config');
const { useTestServer, createUser, tokenFor, addShop } = require('./helpers');

const { ctx, api } = useTestServer();
const S = '/api/v1/settings';
const OWNER_ID = 9000;
const uploaded = new Set();

beforeEach(async () => {
  await createUser({ id: OWNER_ID, accountId: 1, role: 'owner', email: 'owner@poscafe.com', firstName: 'Olivia', lastName: 'Owner' });
  ctx.token = (await tokenFor(OWNER_ID)).token;
});

after(() => {
  for (const f of uploaded) fs.rmSync(path.join(uploads.settingsDir, f), { force: true });
  try { fs.rmdirSync(uploads.settingsDir); } catch { /* not empty or missing: fine */ }
});

const TZ = '(GMT +05:30) India / Colombo';
const shopBody = (over = {}) => ({
  name: 'POS CAFE', address: 'P.O. Box 57, Ramanathan Road, Thirunelvely, Jaffna', phone: '+94 71 23 45 678',
  email: 'michel.admin@poscafe.com', website: 'www.poscafe.com', timezone: TZ, ...over,
});
const adminBody = (over = {}) => ({
  firstName: 'Michel', lastName: 'Parede', phone: '+94 71 23 45 678', email: 'michel.admin@poscafe.com', password: 'Abc@1234', ...over,
});
const fieldsOf = (res) => (res.body.errors || []).map((e) => e.field);
const makeShop = async (over) => { const r = await api('POST', `${S}/shops`, { json: shopBody(over) }); assert.equal(r.status, 201, JSON.stringify(r.body)); return r.body.data; };
const makeAdmin = async (over) => { const r = await api('POST', `${S}/admins`, { json: adminBody(over) }); assert.equal(r.status, 201, JSON.stringify(r.body)); return r.body.data; };
const admins = async () => (await api('GET', `${S}/admins`)).body.data.filter((a) => a.id !== OWNER_ID);
const as = (token) => ({ headers: { authorization: `Bearer ${token}` } });

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]), Buffer.from('JFIF\0'), Buffer.alloc(24, 7), Buffer.from([0xff, 0xd9])]);
const imageForm = (buffer, filename = 'logo.png', field = 'image') => {
  const form = new FormData();
  form.append(field, new Blob([buffer]), filename);
  return form;
};
const listDir = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(png|jpg)$/.test(f)) : []);

// Records everything written to the console while `fn` runs.
async function captureConsole(fn) {
  const methods = ['log', 'info', 'warn', 'error', 'debug'];
  const original = {};
  const lines = [];
  for (const m of methods) { original[m] = console[m]; console[m] = (...args) => lines.push(args.map(String).join(' ')); }
  try { await fn(); } finally { for (const m of methods) console[m] = original[m]; }
  return lines;
}

// ---------- empty and read-only shape ----------
test('Settings collections start empty, timezones are the five from the design, and nothing can be deleted', async () => {
  assert.deepEqual((await api('GET', `${S}/shops`)).body.data, []);
  assert.deepEqual(await admins(), []);
  assert.deepEqual((await api('GET', `${S}/timezones`)).body.data, [
    '(GMT +00:00) UTC', '(GMT +04:00) Dubai', '(GMT +05:30) India / Colombo', '(GMT +08:00) Singapore', '(GMT +10:00) Australia/Sydney',
  ]);
  const shop = await makeShop();
  const admin = await makeAdmin();
  assert.equal((await api('DELETE', `${S}/shops/${shop.id}`)).status, 404); // the designs show no delete
  assert.equal((await api('DELETE', `${S}/admins/${admin.id}`)).status, 404);
  assert.equal((await api('GET', `${S}/shops/${shop.id}`)).status, 200);
  assert.equal(store.products.size + store.categories.size + store.orders.size, 0, 'Menu and Sales data are untouched');
});

// ---------- shop profiles ----------
test('shop profiles: create, list, get and update', async () => {
  const minimal = await api('POST', `${S}/shops`, { json: { name: ' POS  CAFE ', address: 'Jaffna', phone: '0711234567', timezone: TZ } });
  assert.equal(minimal.status, 201);
  assert.deepEqual(
    [minimal.body.data.id, minimal.body.data.name, minimal.body.data.email, minimal.body.data.website, minimal.body.data.image, minimal.body.data.status],
    [1, 'POS CAFE', null, null, null, 'Active'], // email and website are optional; text is trimmed
  );
  const full = await makeShop({ name: 'Second Shop' });
  assert.deepEqual([full.id, full.email, full.website, full.timezone], [2, 'michel.admin@poscafe.com', 'www.poscafe.com', TZ]);

  assert.deepEqual((await api('GET', `${S}/shops`)).body.data.map((s) => s.name), ['Second Shop', 'POS CAFE']);
  assert.deepEqual((await api('GET', `${S}/shops/2`)).body.data, full);

  const updated = await api('PUT', `${S}/shops/1`, { json: shopBody({ name: 'POS CAFE MAIN', timezone: '(GMT +08:00) Singapore', email: undefined, website: undefined }) });
  assert.equal(updated.status, 200);
  assert.deepEqual([updated.body.data.name, updated.body.data.timezone, updated.body.data.address], ['POS CAFE MAIN', '(GMT +08:00) Singapore', shopBody().address]);
  assert.deepEqual([updated.body.data.email, updated.body.data.website], [null, null]); // PUT replaces, so absent optional fields are cleared
  assert.ok(updated.body.data.updatedAt >= updated.body.data.createdAt);
  assert.equal((await api('GET', `${S}/shops/2`)).body.data.name, 'Second Shop'); // other profiles unchanged
});

test('shop profiles: required fields and invalid input', async () => {
  const empty = await api('POST', `${S}/shops`, { json: {} });
  assert.equal(empty.status, 400);
  assert.deepEqual(fieldsOf(empty).sort(), ['address', 'name', 'phone', 'timezone']); // email and website are not required
  const bad = async (over, field) => {
    const res = await api('POST', `${S}/shops`, { json: shopBody(over) });
    assert.equal(res.status, 400, JSON.stringify(over));
    assert.ok(fieldsOf(res).includes(field), `${JSON.stringify(over)} -> ${fieldsOf(res)}`);
  };
  await bad({ name: '' }, 'name');
  await bad({ name: 'x'.repeat(151) }, 'name');
  await bad({ name: 5 }, 'name');
  await bad({ address: '   ' }, 'address');
  await bad({ phone: 'x'.repeat(31) }, 'phone');
  await bad({ email: 'not-an-email' }, 'email');
  await bad({ email: 'a@b' }, 'email');
  await bad({ website: 'w'.repeat(256) }, 'website');
  await bad({ timezone: '(GMT +05:30) Colombo' }, 'timezone'); // not one of the five options
  await bad({ timezone: 'Asia/Colombo' }, 'timezone');
  await bad({ timezone: undefined }, 'timezone');
  for (const json of [[], 'text', null]) assert.equal((await api('POST', `${S}/shops`, { json })).status, 400);
  assert.deepEqual((await api('GET', `${S}/shops`)).body.data, []); // nothing was created
  assert.equal((await api('PUT', `${S}/shops/1`, { json: shopBody() })).status, 404);
});

test('shop profiles: unknown and malformed ids', async () => {
  for (const id of ['abc', '0', '-1', '1.5']) assert.equal((await api('GET', `${S}/shops/${id}`)).status, 400, id);
  assert.equal((await api('GET', `${S}/shops/99`)).status, 404);
  assert.equal((await api('PUT', `${S}/shops/99`, { json: shopBody() })).status, 404);
  assert.equal((await api('POST', `${S}/shops/99/image`, { form: imageForm(PNG) })).status, 404);
  assert.equal(listDir(uploads.settingsDir).length, 0, 'no file is written for an unknown profile');
});

// ---------- admin profiles ----------
test('admin profiles: create, list, get and update never expose a password', async () => {
  const created = await api('POST', `${S}/admins`, { json: adminBody() });
  assert.equal(created.status, 201);
  assert.deepEqual(
    [created.body.data.id, created.body.data.firstName, created.body.data.lastName, created.body.data.phone, created.body.data.email, created.body.data.role, created.body.data.image],
    [1, 'Michel', 'Parede', '+94 71 23 45 678', 'michel.admin@poscafe.com', 'Admin', null],
  );
  const second = await makeAdmin({ firstName: 'Sam', email: 'sam@poscafe.com', password: 'Zzz#9999' });

  const responses = [
    created.text, (await api('GET', `${S}/admins`)).text, (await api('GET', `${S}/admins/1`)).text,
    (await api('PUT', `${S}/admins/1`, { json: { firstName: 'Michael', lastName: 'Parede', phone: '1', email: 'michel.admin@poscafe.com' } })).text,
  ];
  for (const text of responses) {
    assert.ok(!/password|hash|scrypt|Abc@1234|Zzz#9999/i.test(text), `leaked: ${text}`);
  }
  assert.deepEqual((await admins()).map((a) => a.firstName), ['Sam', 'Michael']); // newest first, update applied
  assert.deepEqual(Object.keys(second).sort(), ['createdAt', 'email', 'firstName', 'id', 'image', 'lastName', 'phone', 'role', 'updatedAt']);
  assert.equal((await api('GET', `${S}/admins/1`)).headers.get('cache-control'), 'no-store');
});

test('admin profiles: only a salted hash is stored', async () => {
  const admin = await makeAdmin();
  const stored = store.adminProfiles.get(admin.id);
  assert.ok(stored.passwordHash.startsWith('scrypt$'));
  assert.ok(!JSON.stringify(stored).includes('Abc@1234'), 'the plaintext password is not stored anywhere in the row');
  assert.equal(await verifyPassword('Abc@1234', stored.passwordHash), true);
  assert.equal(await verifyPassword('wrong', stored.passwordHash), false);
  const other = await makeAdmin({ email: 'other@poscafe.com' }); // same password, different salt
  assert.notEqual(store.adminProfiles.get(other.id).passwordHash, stored.passwordHash);
});

test('admin profiles: validation, duplicates and the password rule on update', async () => {
  const empty = await api('POST', `${S}/admins`, { json: {} });
  assert.equal(empty.status, 400);
  assert.deepEqual(fieldsOf(empty).sort(), ['email', 'firstName', 'lastName', 'password', 'phone']);
  const bad = async (over, field) => {
    const res = await api('POST', `${S}/admins`, { json: adminBody(over) });
    assert.equal(res.status, 400, JSON.stringify(over));
    assert.ok(fieldsOf(res).includes(field), `${JSON.stringify(over)} -> ${fieldsOf(res)}`);
    assert.ok(!JSON.stringify(res.body).includes('Abc@1234'), 'errors never echo the password');
  };
  await bad({ firstName: '' }, 'firstName');
  await bad({ lastName: 'x'.repeat(101) }, 'lastName');
  await bad({ phone: '' }, 'phone');
  await bad({ email: 'nope' }, 'email');
  await bad({ email: '' }, 'email');
  await bad({ password: '' }, 'password');
  await bad({ password: 12345678 }, 'password');
  await bad({ password: 'x'.repeat(129) }, 'password');
  await bad({ password: 'weakpass' }, 'password'); // the shared rule: 8 characters with upper, lower, number and symbol, no spaces
  await bad({ password: 'Has Space1!' }, 'password');
  await bad({ password: undefined }, 'password');
  assert.equal((await api('POST', `${S}/admins`, { json: [] })).status, 400);
  assert.deepEqual(await admins(), []);

  const a = await makeAdmin();
  const dup = await api('POST', `${S}/admins`, { json: adminBody({ email: 'MICHEL.ADMIN@poscafe.com' }) });
  assert.equal(dup.status, 409); // unique ignoring case
  assert.equal(dup.body.code, 'DUPLICATE');
  assert.equal((await api('POST', `${S}/admins`, { json: adminBody({ email: 'owner@poscafe.com' }) })).status, 409, 'unique across the whole system, owner included');
  const b = await makeAdmin({ email: 'sam@poscafe.com' });
  const profile = (over) => ({ firstName: 'A', lastName: 'B', phone: '1', email: 'sam@poscafe.com', ...over });
  assert.equal((await api('PUT', `${S}/admins/${a.id}`, { json: profile({ email: 'Sam@PosCafe.com' }) })).status, 409); // another admin's email
  assert.equal((await api('PUT', `${S}/admins/${b.id}`, { json: profile({}) })).status, 200); // keeping your own email is fine
  const withPassword = await api('PUT', `${S}/admins/${b.id}`, { json: profile({ password: 'New@1234' }) });
  assert.equal(withPassword.status, 400); // refused, not silently ignored
  assert.deepEqual(fieldsOf(withPassword), ['password']);
  assert.ok(!JSON.stringify(withPassword.body).includes('New@1234'));
  assert.equal(await verifyPassword('Abc@1234', store.adminProfiles.get(b.id).passwordHash), true, 'the password is unchanged');
  assert.equal((await api('PUT', `${S}/admins/${b.id}`, { json: { firstName: 'A' } })).status, 400);
});

test('admin profiles: unknown and malformed ids', async () => {
  for (const id of ['abc', '0']) assert.equal((await api('GET', `${S}/admins/${id}`)).status, 400, id);
  assert.equal((await api('GET', `${S}/admins/99`)).status, 404);
  assert.equal((await api('PUT', `${S}/admins/99`, { json: { firstName: 'A', lastName: 'B', phone: '1', email: 'a@b.co' } })).status, 404);
  assert.equal((await api('PUT', `${S}/admins/99/password`, { json: { password: 'Abc@1234' } })).status, 404);
  assert.equal((await api('POST', `${S}/admins/99/image`, { form: imageForm(PNG) })).status, 404);
  assert.equal(listDir(uploads.settingsDir).length, 0);
});

// ---------- change password ----------
test('change password: stores a new salted hash and returns no password data', async () => {
  const admin = await makeAdmin();
  const before = store.adminProfiles.get(admin.id).passwordHash;
  const res = await api('PUT', `${S}/admins/${admin.id}/password`, { json: { password: 'Mic@1234' } });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { success: true, message: 'Password updated' }); // no data, no echo
  assert.ok(!/Mic@1234|scrypt/.test(res.text));
  const after = store.adminProfiles.get(admin.id).passwordHash;
  assert.notEqual(after, before);
  assert.equal(await verifyPassword('Mic@1234', after), true);
  assert.equal(await verifyPassword('Abc@1234', after), false, 'the old password stops working');
  assert.ok(!(await api('GET', `${S}/admins/${admin.id}`)).text.includes('Mic@1234'));
});

test('change password: validation and safeguards', async () => {
  const admin = await makeAdmin();
  const url = `${S}/admins/${admin.id}/password`;
  const hash = () => store.adminProfiles.get(admin.id).passwordHash;
  const original = hash();
  for (const json of [{}, { password: '' }, { password: null }, { password: 123 }, { password: ['a'] }, { password: 'x'.repeat(129) }, { password: 'weak' }, { password: ' spaced password ' }, [], 'text']) {
    const res = await api('PUT', url, { json });
    assert.equal(res.status, 400, JSON.stringify(json));
    assert.equal(hash(), original, 'a rejected request changes nothing');
  }
  assert.equal((await api('PUT', url, { json: { password: 'Longer#Pass-2026' } })).status, 200);
  assert.equal(await verifyPassword('Longer#Pass-2026', hash()), true, 'the password is stored exactly as typed, untrimmed');
});

test('passwords are never written to the console', async () => {
  const secret = 'S3cret!Pass-9f2c';
  const lines = await captureConsole(async () => {
    const admin = await makeAdmin({ password: secret });
    await api('PUT', `${S}/admins/${admin.id}/password`, { json: { password: `${secret}-new` } });
    await api('POST', `${S}/admins`, { json: adminBody({ email: 'bad', password: secret }) }); // validation failure
    await api('POST', `${S}/admins`, { json: adminBody({ password: secret }) }); // duplicate email
    await fetch(`${ctx.base}${S}/admins`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${ctx.token}` }, body: `{"password":"${secret}",` }); // malformed JSON
  });
  assert.ok(!lines.join('\n').includes(secret), `console output: ${lines.join(' | ')}`);
});

// ---------- authentication and ownership ----------
test('every Settings route refuses a request without a valid token', async () => {
  ctx.token = null;
  for (const [method, url] of [['GET', '/timezones'], ['GET', '/shops'], ['POST', '/shops'], ['GET', '/shops/1'], ['PUT', '/shops/1'], ['GET', '/admins'],
    ['POST', '/admins'], ['GET', '/admins/1'], ['PUT', '/admins/1'], ['PUT', '/admins/1/password'], ['POST', '/shops/1/image'], ['POST', '/admins/1/image']]) {
    const res = await api(method, `${S}${url}`, method === 'GET' ? {} : { json: {} });
    assert.equal(res.status, 401, `${method} ${url}`);
  }
  assert.equal((await api('GET', `${S}/shops`, as('not.a.token'))).status, 401);
});

test('accounts are isolated: a user sees and changes only their own account', async () => {
  await createUser({ id: 9001, accountId: 2, role: 'owner', email: 'rival@other.com' });
  const rival = (await tokenFor(9001)).token;
  const myShop = await makeShop({ name: 'My Shop' });
  const myAdmin = await makeAdmin({ email: 'mine@poscafe.com' });
  const rivalShop = (await api('POST', `${S}/shops`, { json: shopBody({ name: 'Rival Shop' }), ...as(rival) })).body.data;
  const rivalAdmin = (await api('POST', `${S}/admins`, { json: adminBody({ email: 'theirs@other.com' }), ...as(rival) })).body.data;

  assert.deepEqual((await api('GET', `${S}/shops`)).body.data.map((s) => s.name), ['My Shop']);
  assert.deepEqual((await api('GET', `${S}/shops`, as(rival))).body.data.map((s) => s.name), ['Rival Shop']);
  assert.deepEqual((await admins()).map((a) => a.email), ['mine@poscafe.com']);
  assert.deepEqual((await api('GET', `${S}/admins`, as(rival))).body.data.map((a) => a.email).sort(), ['rival@other.com', 'theirs@other.com']);
  assert.equal(store.shopProfiles.get(myShop.id).accountId, 1, 'the account comes from the token, not from the body');
  assert.equal(store.shopProfiles.get(rivalShop.id).accountId, 2);

  // Another account's records answer 404, exactly like records that do not exist.
  for (const [method, url, body] of [
    ['GET', `/shops/${rivalShop.id}`], ['PUT', `/shops/${rivalShop.id}`, shopBody()], ['POST', `/shops/${rivalShop.id}/image`],
    ['GET', `/admins/${rivalAdmin.id}`], ['PUT', `/admins/${rivalAdmin.id}`, { firstName: 'X', lastName: 'Y', phone: '1', email: 'x@y.co' }],
    ['PUT', `/admins/${rivalAdmin.id}/password`, { password: 'Hacked#2026' }], ['POST', `/admins/${rivalAdmin.id}/image`],
  ]) {
    const res = await api(method, `${S}${url}`, body ? { json: body } : method === 'POST' ? { form: imageForm(PNG) } : {});
    assert.equal(res.status, 404, `${method} ${url}`);
  }
  assert.equal(await verifyPassword('Abc@1234', store.adminProfiles.get(rivalAdmin.id).passwordHash), true, "the rival's password is unchanged");
  assert.equal((await api('GET', `${S}/shops/${myShop.id}`, as(rival))).status, 404, 'and the other way round');
  assert.equal((await api('GET', `${S}/admins/${myAdmin.id}`, as(rival))).status, 404);
  assert.equal(listDir(uploads.settingsDir).length, 0);
});

test('only the owner creates shops and admins; an admin edits only their own profile', async () => {
  const admin = await makeAdmin({ email: 'sam@poscafe.com' });
  const other = await makeAdmin({ email: 'kim@poscafe.com' });
  store.adminProfiles.get(admin.id).accountId = 1;
  const adminToken = (await tokenFor(admin.id)).token;
  const mine = { firstName: 'Sam', lastName: 'Lee', phone: '1', email: 'sam@poscafe.com' };

  assert.equal((await api('POST', `${S}/admins`, { json: adminBody({ email: 'new@poscafe.com' }), ...as(adminToken) })).status, 403);
  assert.equal((await api('POST', `${S}/shops`, { json: shopBody(), ...as(adminToken) })).status, 403);
  assert.equal((await api('PUT', `${S}/admins/${admin.id}`, { json: mine, ...as(adminToken) })).status, 200, 'their own profile');
  assert.equal((await api('PUT', `${S}/admins/${other.id}`, { json: mine, ...as(adminToken) })).status, 403, "someone else's profile");
  assert.equal((await api('PUT', `${S}/admins/${OWNER_ID}`, { json: mine, ...as(adminToken) })).status, 403, "even the owner's");
  assert.equal((await api('PUT', `${S}/admins/${OWNER_ID}/password`, { json: { password: 'Hacked#2026' }, ...as(adminToken) })).status, 403);
  assert.equal((await api('PUT', `${S}/admins/${other.id}/password`, { json: { password: 'Hacked#2026' }, ...as(adminToken) })).status, 403);
  assert.equal(await verifyPassword('Abc@1234', store.adminProfiles.get(OWNER_ID).passwordHash), true, "the owner's password is unchanged");
  assert.equal((await api('GET', `${S}/admins`, as(adminToken))).status, 200, 'admins may read their account');
  assert.equal((await api('PUT', `${S}/admins/${other.id}`, { json: { ...mine, email: 'kim@poscafe.com' } })).status, 200, 'the owner may edit anyone in the account');
});

test('role, status and verification cannot be set through the request body', async () => {
  const sneaky = { role: 'owner', status: 'disabled', accountId: 2, emailVerifiedAt: 1, phoneVerifiedAt: 1, id: 7777, isOwner: true };
  const created = await api('POST', `${S}/admins`, { json: { ...adminBody(), ...sneaky } });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.role, 'Admin');
  const row = store.adminProfiles.get(created.body.data.id);
  assert.deepEqual([row.role, row.status, row.accountId, row.emailVerifiedAt, row.phoneVerifiedAt], ['admin', 'active', 1, null, null]);
  assert.equal(created.body.data.id, 1, 'the id is assigned by the server');

  const edited = await api('PUT', `${S}/admins/${row.id}`, { json: { firstName: 'A', lastName: 'B', phone: '1', email: 'michel.admin@poscafe.com', ...sneaky } });
  assert.equal(edited.status, 200);
  const after = store.adminProfiles.get(row.id);
  assert.deepEqual([after.role, after.status, after.accountId], ['admin', 'active', 1]);

  const shop = await api('POST', `${S}/shops`, { json: { ...shopBody(), accountId: 2, ownerId: 5, id: 99 } });
  assert.deepEqual([store.shopProfiles.get(shop.body.data.id).accountId, store.shopProfiles.get(shop.body.data.id).ownerId, shop.body.data.id], [1, OWNER_ID, 1]);
});

test('changing a password signs out that user elsewhere; your own current session stays', async () => {
  const admin = await makeAdmin({ email: 'sam@poscafe.com' });
  const me = (token) => api('GET', '/api/v1/auth/me', as(token));
  const first = await tokenFor(admin.id);
  const second = await tokenFor(admin.id);
  // the owner resets Sam's password: every session of Sam ends
  assert.equal((await api('PUT', `${S}/admins/${admin.id}/password`, { json: { password: 'Reset#2026a' } })).status, 200);
  assert.equal((await me(first.token)).status, 401);
  assert.equal((await me(second.token)).status, 401);
  assert.equal((await me(ctx.token)).status, 200, "the owner's own session is untouched");

  // Sam changes their own password: other sessions end, the current one stays
  const third = await tokenFor(admin.id);
  const fourth = await tokenFor(admin.id);
  assert.equal((await api('PUT', `${S}/admins/${admin.id}/password`, { json: { password: 'Self#2026ab' }, ...as(third.token) })).status, 200);
  assert.equal((await me(third.token)).status, 200);
  assert.equal((await me(fourth.token)).status, 401);
  assert.equal((await api('POST', '/api/v1/auth/login', { json: { email: 'sam@poscafe.com', password: 'Self#2026ab' } })).status, 200);
});

// ---------- profile images ----------
test('profile images: stored in their own folder under generated names', async () => {
  const shop = await makeShop();
  const admin = await makeAdmin();
  const productFiles = listDir(uploads.productsDir);

  const logo = await api('POST', `${S}/shops/${shop.id}/image`, { form: imageForm(PNG, '../../evil name.php') });
  assert.equal(logo.status, 200, JSON.stringify(logo.body));
  assert.match(logo.body.data.image, /^\/uploads\/settings\/[0-9a-f-]{36}\.png$/); // client filename ignored
  const logoName = path.basename(logo.body.data.image);
  uploaded.add(logoName);
  assert.ok(fs.existsSync(path.join(uploads.settingsDir, logoName)));
  assert.ok(!fs.existsSync(path.join(uploads.productsDir, logoName)), 'not in the products folder');
  const served = await fetch(ctx.base + logo.body.data.image);
  assert.equal(served.status, 200);
  assert.equal(served.headers.get('content-type'), 'image/png');
  assert.equal(served.headers.get('x-content-type-options'), 'nosniff');
  assert.equal((await fetch(`${ctx.base}/uploads/products/${logoName}`)).status, 404, 'product folder does not serve it');

  const replaced = await api('POST', `${S}/shops/${shop.id}/image`, { form: imageForm(JPEG, 'photo.jpeg') });
  assert.match(replaced.body.data.image, /\.jpg$/);
  uploaded.add(path.basename(replaced.body.data.image));
  assert.ok(!fs.existsSync(path.join(uploads.settingsDir, logoName)), 'the replaced file is deleted');
  assert.equal((await api('GET', `${S}/shops/${shop.id}`)).body.data.image, replaced.body.data.image);

  const pic = await api('POST', `${S}/admins/${admin.id}/image`, { form: imageForm(PNG) });
  assert.equal(pic.status, 200);
  assert.match(pic.body.data.image, /^\/uploads\/settings\//);
  uploaded.add(path.basename(pic.body.data.image));
  assert.equal(pic.body.data.passwordHash, undefined);
  assert.deepEqual(listDir(uploads.productsDir), productFiles, 'product images are untouched');
});

test('profile images: size, content and field checks', async () => {
  const shop = await makeShop();
  const url = `${S}/shops/${shop.id}/image`;
  const before = listDir(uploads.settingsDir).length;

  const big = await api('POST', url, { form: imageForm(Buffer.concat([PNG.subarray(0, 8), Buffer.alloc(2 * 1024 * 1024 + 1, 1)])) });
  assert.equal(big.status, 413);
  assert.equal(big.body.code, 'IMAGE_TOO_LARGE');
  assert.equal((await api('POST', url, { form: imageForm(Buffer.from('<?php echo 1; ?>'), 'shell.png') })).status, 415);
  assert.equal((await api('POST', url, { form: imageForm(PNG.subarray(0, PNG.length - 6)) })).status, 415); // truncated
  assert.equal((await api('POST', url, { form: new FormData() })).status, 400); // no file
  assert.equal((await api('POST', url, { form: imageForm(PNG, 'a.png', 'logo') })).status, 400); // wrong field name
  const withText = imageForm(PNG);
  withText.append('note', 'extra');
  assert.equal((await api('POST', url, { form: withText })).status, 400);
  assert.equal((await api('POST', url, { json: { image: 'x' } })).status, 400);
  assert.equal(listDir(uploads.settingsDir).length, before, 'rejected uploads write nothing');
  assert.equal((await api('GET', `${S}/shops/${shop.id}`)).body.data.image, null);
});

// ---------- security ----------
test('Settings routes keep CORS limited to the local frontend and the server stays on 127.0.0.1', async () => {
  for (const url of [`${S}/shops`, `${S}/admins`, `${S}/timezones`]) {
    const ok = await api('GET', url, { headers: { origin: 'http://localhost:5173' } });
    assert.equal(ok.headers.get('access-control-allow-origin'), 'http://localhost:5173', url);
    const bad = await api('GET', url, { headers: { origin: 'http://evil.example' } });
    assert.equal(bad.headers.get('access-control-allow-origin'), null, url);
  }
  assert.equal(ctx.server.address().address, '127.0.0.1');
});
