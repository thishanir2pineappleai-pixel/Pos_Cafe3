const path = require('node:path');
const {
  loadEnv, parsePort, parseHost, parseSecret, parseUrl, parsePositiveInt, parseRepositoryDriver, parseDatabaseUrl,
} = require('@pos-cafe/shared/env');

loadEnv(path.resolve(__dirname, '../..'));

const isProduction = process.env.NODE_ENV === 'production';

// How verification codes and access keys leave the service. No email or SMS provider is configured or implemented,
// so the default is "none": nothing is delivered. "dev-outbox" keeps messages in memory for local testing only.
const DELIVERY_MODES = ['none', 'dev-outbox'];
function parseDelivery(value) {
  const mode = value || 'none';
  if (!DELIVERY_MODES.includes(mode)) throw new Error(`MESSAGE_DELIVERY must be one of: ${DELIVERY_MODES.join(', ')}`);
  if (mode === 'dev-outbox' && isProduction) throw new Error('MESSAGE_DELIVERY=dev-outbox is not allowed when NODE_ENV=production');
  return mode;
}

const jwt = parseSecret('JWT_SECRET', process.env.JWT_SECRET, isProduction);
const internal = parseSecret('INTERNAL_SERVICE_KEY', process.env.INTERNAL_SERVICE_KEY, isProduction);

const repositoryDriver = parseRepositoryDriver(process.env.REPOSITORY_DRIVER, isProduction);

const env = Object.freeze({
  repositoryDriver,
  // Connection settings parsed from AUTH_DATABASE_URL (null in memory mode). The URL itself is never kept or printed.
  database: repositoryDriver === 'prisma' ? parseDatabaseUrl('AUTH_DATABASE_URL', process.env.AUTH_DATABASE_URL) : null,
  port: parsePort(process.env.AUTH_SERVICE_PORT, 4001),
  host: parseHost(process.env.HOST),
  isProduction,
  jwtSecret: jwt.secret,
  jwtSecretIsEphemeral: jwt.ephemeral,
  internalKey: internal.secret,
  internalKeyIsEphemeral: internal.ephemeral,
  messageDelivery: parseDelivery(process.env.MESSAGE_DELIVERY),
  // The Settings Service owns shops: signup activation creates the first shop there and GET /auth/me lists an account's shops from it.
  settingsServiceUrl: parseUrl('SETTINGS_SERVICE_URL', process.env.SETTINGS_SERVICE_URL, 'http://127.0.0.1:4002'),
  settingsTimeoutMs: parsePositiveInt('SETTINGS_TIMEOUT_MS', process.env.SETTINGS_TIMEOUT_MS, 3000),
});

module.exports = { env, parseDelivery };
