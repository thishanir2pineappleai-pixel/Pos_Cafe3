const express = require('express');
const cors = require('cors');
const { env, uploads } = require('./config');
const routes = require('./routes');
const notFound = require('./middleware/error/notFound');
const errorHandler = require('./middleware/error/errorHandler');

// Builds the Express app (server.js starts it; the tests start it on a random local port).
//
// DEVELOPMENT ONLY: there is no authentication or authorization yet. Do not expose this server
// publicly. Both must be added before any deployment.
function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: env.corsOrigins })); // local Vite origin(s) only
  app.use(express.json({ limit: '100kb' }));

  // Product images only (not the other folders under uploads/). nosniff stops browsers guessing a type.
  app.use(uploads.publicPath, express.static(uploads.productsDir, {
    index: false,
    dotfiles: 'deny',
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  }));

  // Settings images (shop logo, admin picture) are served from their own folder.
  app.use(uploads.settingsPublicPath, express.static(uploads.settingsDir, {
    index: false,
    dotfiles: 'deny',
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  }));

  app.use('/api', routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
