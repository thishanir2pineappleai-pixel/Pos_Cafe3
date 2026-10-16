// In-memory ADMIN profile repository (temporary, see store.js: lost on restart, starts empty).
// Rows hold a password HASH only. Callers that build API output must drop `passwordHash` (the service does).
const { store, nextId, clone, now } = require('./store');

module.exports = {
  async list() {
    return [...store.adminProfiles.values()].sort((a, b) => b.id - a.id).map(clone); // newest first
  },
  async findById(id) {
    const row = store.adminProfiles.get(id);
    return row ? clone(row) : null;
  },
  // Users of one account only (Settings never shows another account's people).
  async listByAccount(accountId) {
    return [...store.adminProfiles.values()].filter((a) => a.accountId === accountId).sort((a, b) => b.id - a.id).map(clone);
  },
  async findByPhone(normalizedPhone) {
    const row = [...store.adminProfiles.values()].find((a) => a.phoneNormalized === normalizedPhone);
    return row ? clone(row) : null;
  },
  async remove(id) {
    store.adminProfiles.delete(id);
  },
  async touchLogin(id, at) {
    const row = store.adminProfiles.get(id);
    if (row) row.lastLoginAt = at;
  },
  async findByEmail(email) {
    const needle = email.toLowerCase();
    const row = [...store.adminProfiles.values()].find((a) => a.email.toLowerCase() === needle);
    return row ? clone(row) : null;
  },
  // data: { firstName, lastName, phone, email, passwordHash }
  async create(data) {
    const stamp = now();
    const row = { id: nextId('adminProfiles'), ...data, imagePath: null, createdAt: stamp, updatedAt: stamp };
    store.adminProfiles.set(row.id, row);
    return clone(row);
  },
  // data: { firstName, lastName, phone, email } (never touches the password)
  async update(id, data) {
    const existing = store.adminProfiles.get(id);
    if (!existing) return null;
    const row = { ...existing, ...data, updatedAt: now() };
    store.adminProfiles.set(id, row);
    return clone(row);
  },
  async setPasswordHash(id, passwordHash) {
    const row = store.adminProfiles.get(id);
    if (!row) return false;
    row.passwordHash = passwordHash;
    row.updatedAt = now();
    return true;
  },
  // Returns the previous image filename (or null), or undefined when the profile does not exist.
  async setImagePath(id, imagePath) {
    const row = store.adminProfiles.get(id);
    if (!row) return undefined;
    const previous = row.imagePath;
    row.imagePath = imagePath;
    row.updatedAt = now();
    return previous;
  },
};
