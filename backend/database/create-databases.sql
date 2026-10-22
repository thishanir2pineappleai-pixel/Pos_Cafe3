-- Run manually as a MySQL administrator; this does not create tables.
-- Apply each service's Prisma migrations separately.
-- Optional user statements are commented: replace each CHANGE_ME privately before running.
-- Each user has privileges only on its owning service database.

CREATE DATABASE IF NOT EXISTS pos_auth_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CREATE USER IF NOT EXISTS 'pos_auth_app'@'127.0.0.1' IDENTIFIED BY 'CHANGE_ME';
-- GRANT ALL PRIVILEGES ON pos_auth_db.* TO 'pos_auth_app'@'127.0.0.1';

CREATE DATABASE IF NOT EXISTS pos_settings_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CREATE USER IF NOT EXISTS 'pos_settings_app'@'127.0.0.1' IDENTIFIED BY 'CHANGE_ME';
-- GRANT ALL PRIVILEGES ON pos_settings_db.* TO 'pos_settings_app'@'127.0.0.1';

CREATE DATABASE IF NOT EXISTS pos_staff_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CREATE USER IF NOT EXISTS 'pos_staff_app'@'127.0.0.1' IDENTIFIED BY 'CHANGE_ME';
-- GRANT ALL PRIVILEGES ON pos_staff_db.* TO 'pos_staff_app'@'127.0.0.1';

CREATE DATABASE IF NOT EXISTS pos_menu_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- CREATE USER IF NOT EXISTS 'pos_menu_app'@'127.0.0.1' IDENTIFIED BY 'CHANGE_ME';
-- GRANT ALL PRIVILEGES ON pos_menu_db.* TO 'pos_menu_app'@'127.0.0.1';

-- Shadow and isolated *_test databases are separate optional resources.
-- Never run repository tests on these application databases.
