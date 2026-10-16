// TEMPORARY IN-MEMORY STORAGE (development only, no database).
//
//   * Every product, category, ingredient and discount lives in these Maps.
//   * ALL DATA IS LOST WHEN THE BACKEND RESTARTS. Nothing is seeded: every collection starts empty.
//   * Uploaded image FILES are written to backend/uploads/products and are NOT lost on restart, but the
//     products that reference them are, so old files become orphans until MySQL integration exists.
//
// When MySQL is approved, repositories/index.js is switched to repositories/mysql/* (same method names, mysql2
// parameterized SQL) and this folder can be deleted. Services and controllers do not touch this file.
const emptyStore = () => ({
  categories: new Map(), // id -> { id, name, createdAt }
  discounts: new Map(), // id -> { id, name, percentage, createdAt }
  ingredients: new Map(), // id -> { id, name, createdAt }
  products: new Map(), // id -> product row (foreign keys as ids, like the future SQL columns)
  productIngredients: new Map(), // productId -> [{ ingredientId, quantity }]
  // Sales Management. `orders` is READ-ONLY for the API: there is no order-creation feature yet, so it stays empty
  // at runtime (the tests put temporary rows in it and reset() wipes them). Row shape the future orders tables must provide:
  // { id, orderNumber, type, customerId?, customerName, items: [{ productId?, name, quantity, unitPrice? }], total, status,
  //   placedAt: 'YYYY-MM-DDTHH:mm:ss', shopId?, tableId? }  (shopId scopes the Dashboard; tableId is the "T - 01" of dine-in orders)
  orders: new Map(),
  // id -> { id, discountId, startDate, endDate, status, appliesToAll, productIds, createdAt, updatedAt }
  discountApplications: new Map(),
  // Settings. Both start empty and are never seeded.
  // shopProfiles: id -> { id, name, address, phone, email, website, timezone, imagePath, createdAt, updatedAt }
  shopProfiles: new Map(),
  // adminProfiles: id -> { id, firstName, lastName, phone, email, passwordHash, imagePath, createdAt, updatedAt }
  // Only a salted scrypt HASH is ever kept, never the password itself.
  adminProfiles: new Map(),
  // Authentication (all in memory, lost on restart). adminProfiles above are the login users: an account's
  // Owner (created at signup activation) and the Admins the owner adds in Settings.
  registrations: new Map(), // unfinished and finished signups: hashed token, hashed password, step status, hashed access key
  otps: new Map(), // verification codes and reset tokens, stored only as keyed hashes
  sessions: new Map(), // sid -> { sid, userId, accountId, expiresAt, revokedAt }
  // Staff Management (all in memory like the rest; every row carries accountId + shopId so each shop only sees its own data).
  staff: new Map(), // id -> staff row (password HASH only, never the password)
  staffRoles: new Map(), // id -> { id, accountId, shopId, name, grants: { 'Staff Management': ['view', ...] } }
  staffTeams: new Map(), // id -> { id, accountId, shopId, name }
  shifts: new Map(), // id -> { id, accountId, shopId, name, startTime, endTime, active }
  roster: new Map(), // staffId -> { mon: shiftId | 'off', tue: ... } (a missing day = nothing assigned yet)
  attendance: new Map(), // id -> { id, accountId, shopId, staffId, date, checkInAt, checkOutAt }
  leaves: new Map(), // id -> leave row
  payrollRecords: new Map(), // id -> payroll row
  payrollRewards: new Map(),
  payrollDeductions: new Map(),
  rateLimits: new Map(), // "name:key" -> [timestamps]
  outbox: [], // messages captured by MESSAGE_DELIVERY=dev-outbox (local testing only, never in production)
  clockOffsetMs: 0, // lets the tests move time forward (see utils/clock.js)
  lastId: {
    categories: 0, discounts: 0, ingredients: 0, products: 0, orders: 0, discountApplications: 0, shopProfiles: 0,
    adminProfiles: 0, registrations: 0, otps: 0, accounts: 0,
    staff: 0, staffRoles: 0, staffTeams: 0, shifts: 0, attendance: 0, leaves: 0, payrollRecords: 0, payrollRewards: 0, payrollDeductions: 0,
  },
});

const store = emptyStore();

function nextId(table) {
  store.lastId[table] += 1;
  return store.lastId[table];
}

// Used by the automated tests to start from empty collections.
function reset() {
  Object.assign(store, emptyStore());
}

const clone = (value) => structuredClone(value);
const now = () => new Date().toISOString();

module.exports = { store, nextId, reset, clone, now };
