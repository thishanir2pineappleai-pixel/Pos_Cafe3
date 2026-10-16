// SMS provider boundary. send({ to, text }) resolves to { delivered, reason? } and NEVER throws.
// NO REAL PROVIDER IS CONFIGURED OR IMPLEMENTED (the project structure mentions Notify.lk, but no account or key exists).
// Behaviour matches emailProvider.js: "none" delivers nothing; "dev-outbox" (never in production) keeps the message in memory.
const { env } = require('../../config');
const { store } = require('../../repositories/memory/store');
const clock = require('../../utils/clock');

async function send(message) {
  if (env.messageDelivery === 'dev-outbox') {
    store.outbox.push({ channel: 'sms', ...message, at: new Date(clock.now()).toISOString() });
    return { delivered: false, reason: 'captured_in_dev_outbox' };
  }
  return { delivered: false, reason: 'not_configured' };
}

module.exports = { send };
