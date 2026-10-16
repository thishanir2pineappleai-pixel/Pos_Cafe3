// Email provider boundary. send({ to, subject, text }) resolves to { delivered, reason? } and NEVER throws.
//
// NO REAL PROVIDER IS CONFIGURED OR IMPLEMENTED (no SMTP or email-API settings exist, and sending SMTP needs a package
// that is not approved). So:
//   * MESSAGE_DELIVERY=none (default): nothing leaves the server and the result is { delivered: false, reason: 'not_configured' }.
//   * MESSAGE_DELIVERY=dev-outbox (never in production): the message, which contains the raw code, is kept in memory so a
//     developer or test can read it; the result is still delivered:false because nothing was actually sent.
// To add a real provider, branch on env.messageDelivery here and return { delivered: true } only after the provider accepted it.
const { env } = require('../../config');
const { store } = require('../../repositories/memory/store');
const clock = require('../../utils/clock');

async function send(message) {
  if (env.messageDelivery === 'dev-outbox') {
    store.outbox.push({ channel: 'email', ...message, at: new Date(clock.now()).toISOString() });
    return { delivered: false, reason: 'captured_in_dev_outbox' };
  }
  return { delivered: false, reason: 'not_configured' };
}

// Whether a REAL provider is configured. False until one is implemented. Public responses may show this because it is
// the same for every request and so reveals nothing about any account.
const isConfigured = () => false;

module.exports = { send, isConfigured };
