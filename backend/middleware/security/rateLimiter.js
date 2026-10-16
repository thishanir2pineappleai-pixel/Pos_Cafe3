// Sliding-window rate limiter kept in memory (temporary: the counters reset when the server restarts, and they are
// per server process; a multi-server deployment needs a shared store such as Redis).
// rateLimit({ name, windowMs, max, key }) counts EVERY request that reaches it and answers 429 with Retry-After once a
// key has made `max` requests inside the window. `key(req)` must not depend on whether an account exists.
const { store } = require('../../repositories/memory/store');
const { ERROR_CODES } = require('../../config/constants/errors');
const { MESSAGES } = require('../../config/constants/messages');
const { AppError } = require('../../responses/error');
const clock = require('../../utils/clock');

function rateLimit({ name, windowMs, max, key }) {
  return (req, res, next) => {
    const now = clock.now();
    const id = `${name}:${key(req)}`;
    const hits = (store.rateLimits.get(id) || []).filter((t) => now - t < windowMs);
    if (hits.length >= max) {
      const err = new AppError(429, ERROR_CODES.TOO_MANY_REQUESTS, MESSAGES.TOO_MANY);
      err.retryAfterSeconds = Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000));
      store.rateLimits.set(id, hits);
      return next(err);
    }
    hits.push(now);
    store.rateLimits.set(id, hits);
    return next();
  };
}

// Key helpers. Emails are lower-cased so "A@x.com" and "a@x.com" share one bucket.
const byIp = (req) => req.ip;
const byEmail = (req) => String(req.body?.email ?? '').trim().toLowerCase();
const byIpAndEmail = (req) => `${req.ip}|${byEmail(req)}`;

module.exports = { rateLimit, byIp, byEmail, byIpAndEmail };
