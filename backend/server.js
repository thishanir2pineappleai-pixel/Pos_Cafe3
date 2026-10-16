const { env } = require('./config');
const { createApp } = require('./app');

const app = createApp();

// env.host is always a loopback address (checked in config/env), so the server is reachable from this machine only.
app.listen(env.port, env.host, () => {
  console.log(`Menu, Sales and Settings API listening on http://${env.host}:${env.port}/api/v1`);
  console.warn('DEVELOPMENT ONLY: all data is kept in memory (lost on restart) and no database is connected.');
  console.warn('Menu and Sales endpoints are still unauthenticated and not shop-scoped; Settings, Dashboard and Staff Management require a signed-in user.');
  if (env.jwtSecretIsEphemeral) console.warn('JWT_SECRET is not set: a temporary signing key is used, so every sign-in ends when the server restarts.');
  console.warn(`Message delivery: ${env.messageDelivery === 'none' ? 'none (no email/SMS provider is configured; codes are NOT sent)' : env.messageDelivery}`);
});
