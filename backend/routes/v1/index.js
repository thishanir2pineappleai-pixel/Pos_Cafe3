const { Router } = require('express');
const { env } = require('../../config');
const { store } = require('../../repositories/memory/store');

const router = Router();

// Authentication, signup and password recovery
router.use('/auth', require('./authRoutes'));

// Menu Management
router.use('/products', require('./productRoutes'));
router.use('/categories', require('./categoryRoutes'));
router.use('/ingredients', require('./ingredientRoutes'));
router.use('/discounts', require('./discountRoutes')); // definitions (Menu) and applications (Sales)

// Sales Management
router.use('/orders', require('./orderRoutes'));
router.use('/reports', require('./reportsRoutes'));

// Settings (signed-in users only) and Dashboard (signed-in users only)
router.use('/settings', require('./settingsRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));

// Staff Management (signed-in users only; each router authenticates itself). Data lives in memory: MySQL is not configured yet.
const { permissionRoutes, roleRoutes, teamRoutes } = require('./roleRoutes');
router.use('/staff', require('./staffRoutes'));
router.use('/permissions', permissionRoutes);
router.use('/roles', roleRoutes);
router.use('/teams', teamRoutes);
router.use('/shifts', require('./shiftRoutes'));
router.use('/attendance', require('./attendanceRoutes'));
router.use('/payroll', require('./payrollRoutes'));

// LOCAL TESTING ONLY: shows the messages (including raw codes) that MESSAGE_DELIVERY=dev-outbox captured instead of sending.
// The route does not exist in any other mode, and the setting is refused when NODE_ENV=production (see config/env).
if (env.messageDelivery === 'dev-outbox') {
  router.get('/dev/outbox', (req, res) => res.json({ success: true, data: store.outbox }));
}

module.exports = router;
