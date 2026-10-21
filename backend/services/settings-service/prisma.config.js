// Prisma CLI configuration of the Settings Service (generate, migrate). The connection URLs come from the environment
// (backend/.env or this service's .env), never from this file:
//   SETTINGS_DATABASE_URL         mysql://user:password@host:3306/pos_settings_db
//   SETTINGS_SHADOW_DATABASE_URL  mysql://user:password@host:3306/pos_settings_db_shadow   (only `migrate dev` needs it)
const { defineConfig } = require('prisma/config');
const { loadEnv } = require('@pos-cafe/shared/env');

loadEnv(__dirname);

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    url: process.env.SETTINGS_DATABASE_URL,
    shadowDatabaseUrl: process.env.SETTINGS_SHADOW_DATABASE_URL,
  },
});
