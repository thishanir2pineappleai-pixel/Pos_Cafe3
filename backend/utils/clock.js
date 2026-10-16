// The one place that reads the time for security rules (expiry, cooldowns, rate limits), so tests can move it.
// advance() is a TEST HOOK: production code never calls it, and reset() in the store sets the offset back to 0.
const { store } = require('../repositories/memory/store');

const now = () => Date.now() + store.clockOffsetMs;
const advance = (ms) => { store.clockOffsetMs += ms; };

module.exports = { now, advance };
