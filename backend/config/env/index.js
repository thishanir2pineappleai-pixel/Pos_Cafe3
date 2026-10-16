const crypto = require('node:crypto');
const path = require('node:path');
const dotenv = require('dotenv');

// Reads backend/.env if it exists. No database variables are used yet (no MySQL integration at this stage).
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const LOOPBACK_HOSTS = ['127.0.0.1', 'localhost', '::1'];
const DEFAULT_CORS_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173']; // the local Vite dev server

function parsePort(value) {
  const port = Number(value ?? 4000);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT must be a whole number from 0 to 65535');
  return port;
}

// Development only: refuse to bind to anything other than the local machine.
function parseHost(value) {
  const host = value || '127.0.0.1';
  if (!LOOPBACK_HOSTS.includes(host)) {
    throw new Error(`HOST must be a loopback address (${LOOPBACK_HOSTS.join(', ')}); this backend has no authentication yet and must not be exposed`);
  }
  return host;
}

function parseOrigins(value) {
  if (!value) return DEFAULT_CORS_ORIGINS;
  return value.split(',').map((o) => o.trim()).filter(Boolean);
}

const isProduction = process.env.NODE_ENV === 'production';

// Signs access tokens and keys the one-time-code hashes. Production refuses to start without a real secret.
// In development a random temporary secret is used, so sessions end whenever the server restarts.
function parseJwtSecret(value) {
  if (value) {
    if (value.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');
    return { secret: value, ephemeral: false };
  }
  if (isProduction) throw new Error('JWT_SECRET is required when NODE_ENV=production');
  return { secret: crypto.randomBytes(32).toString('hex'), ephemeral: true };
}

// How verification codes and access keys leave the server. No email or SMS provider is configured or implemented,
// so the default is "none": nothing is delivered. "dev-outbox" keeps messages in memory for local testing only.
const DELIVERY_MODES = ['none', 'dev-outbox'];
function parseDelivery(value) {
  const mode = value || 'none';
  if (!DELIVERY_MODES.includes(mode)) throw new Error(`MESSAGE_DELIVERY must be one of: ${DELIVERY_MODES.join(', ')}`);
  if (mode === 'dev-outbox' && isProduction) throw new Error('MESSAGE_DELIVERY=dev-outbox is not allowed when NODE_ENV=production');
  return mode;
}

const jwt = parseJwtSecret(process.env.JWT_SECRET);

const env = Object.freeze({
  port: parsePort(process.env.PORT),
  host: parseHost(process.env.HOST),
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN),
  isProduction,
  jwtSecret: jwt.secret,
  jwtSecretIsEphemeral: jwt.ephemeral,
  messageDelivery: parseDelivery(process.env.MESSAGE_DELIVERY),
});

module.exports = { env, parseHost, parsePort, parseJwtSecret, parseDelivery };
