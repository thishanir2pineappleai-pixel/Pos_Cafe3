const { createApp } = require('./app');
const { env } = require('./config');

const server = createApp().listen(env.port, env.host, () => {
  console.log(`Auth Service listening on http://${env.host}:${env.port} (health: /health)`);
  console.log(env.repositoryDriver === 'prisma'
    ? `Storage: MySQL database "${env.database.database}" on ${env.database.host}:${env.database.port} through Prisma (data persists).`
    : 'Storage: IN MEMORY (REPOSITORY_DRIVER=memory): all data is lost on restart and no database is used.');
  if (env.jwtSecretIsEphemeral) console.warn('JWT_SECRET is not set: a temporary signing key is used, so other services cannot verify tokens and every sign-in ends on restart.');
  if (env.internalKeyIsEphemeral) console.warn('INTERNAL_SERVICE_KEY is not set: a temporary key is used, so other services cannot confirm sessions (they answer 503).');
  console.log(`Message delivery: ${env.messageDelivery}${env.messageDelivery === 'none' ? ' (no email/SMS provider is configured; codes are NOT sent)' : ''}`);
});

server.on('error', (err) => {
  console.error(err.code === 'EADDRINUSE' ? `Port ${env.port} is already in use. Stop the other process or set AUTH_SERVICE_PORT.` : err);
  process.exit(1);
});
