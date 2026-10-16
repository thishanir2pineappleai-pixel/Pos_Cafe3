// Signed access tokens (JWT format, HS256) built on Node's crypto, so no JWT package is needed.
// verify() accepts ONLY alg HS256 (a token that claims "none" or anything else is rejected), checks the signature in
// constant time, then the issuer and expiry. It returns the payload, or null for any problem.
const crypto = require('node:crypto');
const jwtConfig = require('../../config/auth/jwt');
const clock = require('../../utils/clock');

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const hmac = (data) => crypto.createHmac('sha256', jwtConfig.secret).update(data).digest();

function sign(claims, { ttlSeconds = jwtConfig.ttlSeconds } = {}) {
  const iat = Math.floor(clock.now() / 1000);
  const body = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ ...claims, iss: jwtConfig.issuer, iat, exp: iat + ttlSeconds })}`;
  return { token: `${body}.${hmac(body).toString('base64url')}`, expiresAt: (iat + ttlSeconds) * 1000 };
}

function verify(token) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (header.alg !== 'HS256') return null;
    const given = Buffer.from(parts[2], 'base64url');
    const expected = hmac(`${parts[0]}.${parts[1]}`);
    if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (payload.iss !== jwtConfig.issuer || typeof payload.exp !== 'number' || payload.exp * 1000 <= clock.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

module.exports = { sign, verify };
