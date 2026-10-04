-- ========================================================================
-- Serendib Smart Bank Seed Migration: V2__seed_initial_data.sql
-- Demo accounts password: DemoBank!2026
-- Password hash generated using Spring Security BCrypt
-- ========================================================================

-- 1. Standard Roles
INSERT IGNORE INTO role(role_id, role_name, description) VALUES
(1, 'Admin', 'System administration and audit'),
(2, 'Customer', 'Customer banking'),
(3, 'Manager', 'Final loan and product approval'),
(4, 'Employee', 'Customer service and loan review');

-- 2. Demo Users (Password: DemoBank!2026)
INSERT IGNORE INTO users(user_id, role_id, username, password_hash, email, phone, status, created_at, version) VALUES
(1, 2, 'john_customer', '$2a$10$mHPzdnVmdb2gM7Rb8arQK.dxmBhPd11I5Gv8g0NygrhTA3JW7mjiu', 'customer@test.com', '0711111111', 'ACTIVE', NOW(), 0),
(2, 2, 'jane_customer', '$2a$10$mHPzdnVmdb2gM7Rb8arQK.dxmBhPd11I5Gv8g0NygrhTA3JW7mjiu', 'jane@test.com', '0755555555', 'ACTIVE', NOW(), 0),
(3, 4, 'bank_employee', '$2a$10$mHPzdnVmdb2gM7Rb8arQK.dxmBhPd11I5Gv8g0NygrhTA3JW7mjiu', 'employee@test.com', '0722222222', 'ACTIVE', NOW(), 0),
(4, 3, 'branch_manager', '$2a$10$mHPzdnVmdb2gM7Rb8arQK.dxmBhPd11I5Gv8g0NygrhTA3JW7mjiu', 'manager@test.com', '0733333333', 'ACTIVE', NOW(), 0),
(5, 1, 'system_admin', '$2a$10$mHPzdnVmdb2gM7Rb8arQK.dxmBhPd11I5Gv8g0NygrhTA3JW7mjiu', 'admin@test.com', '0744444444', 'ACTIVE', NOW(), 0);

-- 3. Customer Profiles with CIF Numbers
INSERT IGNORE INTO customer(customer_id, user_id, cif_number, nic, full_name, address, date_of_birth) VALUES
(1, 1, '0000000', '199012345678', 'John Customer', 'Colombo, Sri Lanka', '1990-05-15'),
(2, 2, '0000001', '199287654321', 'Jane Customer', 'Kandy, Sri Lanka', '1992-08-20');

-- 4. Employee Profiles
INSERT IGNORE INTO employee(employee_id, user_id, department, position, date_joined) VALUES
(1, 3, 'Bank Operations', 'Employee', CURDATE()),
(2, 4, 'Credit & Risk Management', 'Manager', CURDATE());

-- 5. Demo Accounts
INSERT IGNORE INTO account(account_id, customer_id, account_number, account_type, balance, open_date, status, is_primary, version) VALUES
(1, 1, '1000000001', 'SAVINGS', 250000.00, CURDATE(), 'ACTIVE', TRUE, 0),
(2, 1, '1000000002', 'CURRENT', 80000.00, CURDATE(), 'ACTIVE', FALSE, 0),
(3, 2, '2000000001', 'SAVINGS', 175000.00, CURDATE(), 'ACTIVE', TRUE, 0);

-- 6. Demo Beneficiaries
INSERT IGNORE INTO beneficiary(beneficiary_id, customer_id, name, account_number, bank_name, relationship, active, created_at, version) VALUES
(1, 1, 'Jane (demo recipient)', '2000000001', 'SERENDIB', 'Friend', TRUE, NOW(), 0);

-- 7. Demo Welcome Notifications
INSERT IGNORE INTO notification(notification_id, user_id, title, message, event_type, status, created_at, version) VALUES
(1, 1, 'Welcome to Serendib Smart Bank', 'This is an academic LKR banking simulation. All balances and rates are demonstration values.', 'WELCOME', 'UNREAD', NOW(), 0),
(2, 2, 'Welcome to Serendib Smart Bank', 'This is an academic LKR banking simulation. All balances and rates are demonstration values.', 'WELCOME', 'UNREAD', NOW(), 0),
(3, 3, 'Welcome to Serendib Smart Bank Staff Portal', 'Operations management and verification center.', 'WELCOME', 'UNREAD', NOW(), 0),
(4, 4, 'Welcome to Serendib Smart Bank Management', 'Credit facility and administrative review portal.', 'WELCOME', 'UNREAD', NOW(), 0),
(5, 5, 'System Administration', 'Audit logging and user configuration center.', 'WELCOME', 'UNREAD', NOW(), 0);

-- 8. AI Assistant Configuration
INSERT IGNORE INTO ai_assistant(assistant_id, name, version, status) VALUES
(1, 'Serendib AI', '1.0', 'Active');

-- 9. Sample Initial Transaction Record
INSERT IGNORE INTO transaction_record(transaction_id, to_account_id, initiated_by, amount, transaction_type, status, description, created_at, completed_at, version) VALUES
(1, 1, 1, 10000.00, 'DEPOSIT', 'COMPLETED', 'Cash Deposit - Branch Counter #01', NOW(), NOW(), 0);
