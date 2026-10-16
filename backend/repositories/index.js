// The one place that decides which storage the services use.
// TEMPORARY: in-memory repositories (data is lost on restart). For MySQL integration, point these requires
// at ./mysql/* (same method names, parameterized mysql2 queries).
module.exports = {
  // Menu Management
  menuRepository: require('./memory/menuRepository'),
  categoryRepository: require('./memory/categoryRepository'),
  ingredientRepository: require('./memory/ingredientRepository'),
  discountRepository: require('./memory/discountRepository'), // discount definitions, shared with Sales
  // Sales Management
  orderRepository: require('./memory/orderRepository'), // read-only, empty until an orders feature exists
  discountApplicationRepository: require('./memory/discountApplicationRepository'),
  // Settings
  businessProfileRepository: require('./memory/businessProfileRepository'), // shop profiles
  adminProfileRepository: require('./memory/adminProfileRepository'), // admin profiles = the login users (password hashes only)
  // Authentication
  registrationRepository: require('./memory/registrationRepository'),
  otpRepository: require('./memory/otpRepository'),
  sessionRepository: require('./memory/sessionRepository'),
  accountRepository: require('./memory/accountRepository'),
  // Staff Management (in memory too: MySQL is not configured, see README "Staff Management")
  staffRepository: require('./memory/staffRepository'),
  staffRoleRepository: require('./memory/staffRoleRepository'), // { roles, teams }
  shiftRepository: require('./memory/shiftRepository'), // shift definitions + weekly roster
  attendanceRepository: require('./memory/attendanceRepository'), // { attendance, leaves }
  payrollRepository: require('./memory/payrollRepository'), // { records, rewards, deductions }
};
