-- ========================================================================
-- Serendib Smart Bank Database Baseline Dump: bank.sql
-- Consolidated Schema and Seed Data for MySQL 8.0+ / 8.4
-- Timezone: Asia/Colombo
-- ========================================================================

CREATE DATABASE IF NOT EXISTS `smartbank_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `smartbank_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------
-- Table structure for `role`
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `role`;
CREATE TABLE `role` (
    `role_id` INT AUTO_INCREMENT PRIMARY KEY,
    `role_name` VARCHAR(50) NOT NULL UNIQUE,
    `description` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- Table structure for `users`
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `user_id` INT AUTO_INCREMENT PRIMARY KEY,
    `role_id` INT NOT NULL,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `phone` VARCHAR(20),
    `status` VARCHAR(20) DEFAULT 'ACTIVE',
    `profile_image` VARCHAR(255),
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    `version` BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT `fk_user_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- Table structure for `customer`
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `customer`;
CREATE TABLE `customer` (
    `customer_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL UNIQUE,
    `cif_number` VARCHAR(20) UNIQUE,
    `nic` VARCHAR(20),
    `full_name` VARCHAR(100),
    `address` VARCHAR(255),
    `date_of_birth` DATE,
    `profile_image` VARCHAR(255),
    `nic_front_image` VARCHAR(255),
    `nic_back_image` VARCHAR(255),
    CONSTRAINT `fk_customer_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- Table structure for `employee`
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `employee`;
CREATE TABLE `employee` (
    `employee_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL UNIQUE,
    `department` VARCHAR(100),
    `position` VARCHAR(100),
    `date_joined` DATE,
    CONSTRAINT `fk_employee_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- Table structure for `account`
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `account`;
CREATE TABLE `account` (
    `account_id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT NOT NULL,
    `account_number` VARCHAR(50) NOT NULL UNIQUE,
    `account_type` VARCHAR(50) NOT NULL,
    `balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `open_date` DATE,
    `status` VARCHAR(50) NOT NULL,
    `kyc_data` TEXT,
    `rejection_reason` TEXT,
    `approved_by_officer_id` INT,
    `approved_by_manager_id` INT,
    `is_primary` BOOLEAN DEFAULT FALSE,
    `version` BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT `fk_account_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`),
    CONSTRAINT `fk_account_officer` FOREIGN KEY (`approved_by_officer_id`) REFERENCES `users` (`user_id`),
    CONSTRAINT `fk_account_manager` FOREIGN KEY (`approved_by_manager_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- Table structure for `transaction_record`
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `transaction_record`;
CREATE TABLE `transaction_record` (
    `transaction_id` INT AUTO_INCREMENT PRIMARY KEY,
    `from_account_id` INT,
    `to_account_id` INT,
    `initiated_by` INT,
    `amount` DECIMAL(12,2) NOT NULL,
    `transaction_type` VARCHAR(50) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255),
    `idempotency_key` VARCHAR(80),
    `request_fingerprint` VARCHAR(64),
    `failure_code` VARCHAR(80),
    `bill_type` VARCHAR(50),
    `bill_reference` VARCHAR(50),
    `external_bank` VARCHAR(100),
    `external_account_number` VARCHAR(50),
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    `completed_at` DATETIME(6),
    `authorization_expires_at` DATETIME(6),
    `version` BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT `fk_transaction_from_account` FOREIGN KEY (`from_account_id`) REFERENCES `account` (`account_id`),
    CONSTRAINT `fk_transaction_to_account` FOREIGN KEY (`to_account_id`) REFERENCES `account` (`account_id`),
    CONSTRAINT `fk_transaction_initiated_by` FOREIGN KEY (`initiated_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- Table structure for `fixed_deposit`
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `fixed_deposit`;
CREATE TABLE `fixed_deposit` (
    `fixed_deposit_id` INT AUTO_INCREMENT PRIMARY KEY,
    `account_id` INT NOT NULL,
    `principal_amount` DECIMAL(12,2) NOT NULL,
    `interest_rate` DECIMAL(5,2) NOT NULL,
    `term_months` INT NOT NULL,
    `start_date` DATE,
    `maturity_date` DATE,
    `maturity_amount` DECIMAL(12,2),
    `status` VARCHAR(40) NOT NULL,
    `opening_transaction_id` INT UNIQUE,
    `closing_transaction_id` INT UNIQUE,
    `fd_details` TEXT,
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `version` BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT `fk_fd_account` FOREIGN KEY (`account_id`) REFERENCES `account` (`account_id`),
    CONSTRAINT `fk_fd_opening_txn` FOREIGN KEY (`opening_transaction_id`) REFERENCES `transaction_record` (`transaction_id`),
    CONSTRAINT `fk_fd_closing_txn` FOREIGN KEY (`closing_transaction_id`) REFERENCES `transaction_record` (`transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- Table structure for `loan`
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `loan`;
CREATE TABLE `loan` (
    `loan_id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT NOT NULL,
    `reviewer_employee_id` INT,
    `loan_number` VARCHAR(50),
    `loan_type` VARCHAR(50) NOT NULL,
    `amount` DECIMAL(12,2) NOT NULL,
    `interest_rate` DECIMAL(5,2),
    `status` VARCHAR(40) NOT NULL,
    `apply_date` DATE,
    `review_date` DATE,
    `additional_information` TEXT,
    `scrutiny_data` TEXT,
    `account_id` INT,
    `fixed_deposit_id` INT,
    `paid_amount` DECIMAL(12,2) DEFAULT 0.00,
    `approved_by_officer_id` INT,
    `approved_by_manager_id` INT,
    `updated_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `version` BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT `fk_loan_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`),
    CONSTRAINT `fk_loan_reviewer` FOREIGN KEY (`reviewer_employee_id`) REFERENCES `employee` (`employee_id`),
    CONSTRAINT `fk_loan_target_account` FOREIGN KEY (`account_id`) REFERENCES `account` (`account_id`),
    CONSTRAINT `fk_loan_fd` FOREIGN KEY (`fixed_deposit_id`) REFERENCES `fixed_deposit` (`fixed_deposit_id`),
    CONSTRAINT `fk_loan_officer` FOREIGN KEY (`approved_by_officer_id`) REFERENCES `users` (`user_id`),
    CONSTRAINT `fk_loan_manager` FOREIGN KEY (`approved_by_manager_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- Table structure for `loan_decision`
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `loan_decision`;
CREATE TABLE `loan_decision` (
    `decision_id` INT AUTO_INCREMENT PRIMARY KEY,
    `loan_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `action` VARCHAR(80) NOT NULL,
    `reason` TEXT NOT NULL,
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT `fk_loan_decision_loan` FOREIGN KEY (`loan_id`) REFERENCES `loan` (`loan_id`),
    CONSTRAINT `fk_loan_decision_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- Table structure for `card`
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `card`;
CREATE TABLE `card` (
    `card_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT,
    `account_id` INT,
    `card_number` VARCHAR(50),
    `card_type` VARCHAR(50) NOT NULL,
    `card_product` VARCHAR(100),
    `expiry_date` DATE,
    `status` VARCHAR(50) NOT NULL,
    `credit_limit` DECIMAL(15,2),
    `available_credit` DECIMAL(15,2),
    `current_balance` DECIMAL(15,2),
    `issued_by` INT,
    `requested_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    `issued_at` DATETIME(6),
    `updated_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `full_name` VARCHAR(100),
    `nic_number` VARCHAR(20),
    `mobile_number` VARCHAR(20),
    `email_address` VARCHAR(100),
    `residential_address` VARCHAR(255),
    `housing_status` VARCHAR(50),
    `employment_type` VARCHAR(50),
    `employer_name` VARCHAR(100),
    `designation` VARCHAR(100),
    `years_of_service` INT,
    `gross_monthly_income` DECIMAL(15,2),
    `fixed_allowances` DECIMAL(15,2),
    `existing_credit_deductions` DECIMAL(15,2),
    `primary_bank_name` VARCHAR(100),
    `crib_consent` BOOLEAN,
    `pay_slips_upload` TEXT,
    `bank_statements_upload` TEXT,
    `employment_letter_upload` TEXT,
    `version` BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT `fk_card_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
    CONSTRAINT `fk_card_account` FOREIGN KEY (`account_id`) REFERENCES `account` (`account_id`),
    CONSTRAINT `fk_card_issued_by` FOREIGN KEY (`issued_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- Table structure for `bill_payment`
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `bill_payment`;
CREATE TABLE `bill_payment` (
    `payment_id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT NOT NULL,
    `account_id` INT NOT NULL,
    `transaction_id` INT UNIQUE,
    `reference_number` VARCHAR(50) NOT NULL,
    `bill_type` VARCHAR(50) NOT NULL,
    `amount` DECIMAL(12,2) NOT NULL,
    `payment_date` DATE,
    `status` VARCHAR(20) NOT NULL,
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    `completed_at` DATETIME(6),
    `version` BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT `fk_payment_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`),
    CONSTRAINT `fk_payment_account` FOREIGN KEY (`account_id`) REFERENCES `account` (`account_id`),
    CONSTRAINT `fk_payment_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `transaction_record` (`transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- Table structure for `otp`
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `otp`;
CREATE TABLE `otp` (
    `otp_id` INT AUTO_INCREMENT PRIMARY KEY,
    `transaction_id` INT NOT NULL UNIQUE,
    `otp_hash` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    `expires_at` DATETIME(6),
    `verified` BOOLEAN NOT NULL DEFAULT FALSE,
    `verified_at` DATETIME(6),
    `attempt_count` INT NOT NULL DEFAULT 0,
    `last_sent_at` DATETIME(6),
    `version` BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT `fk_otp_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `transaction_record` (`transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- Table structure for `beneficiary`
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `beneficiary`;
CREATE TABLE `beneficiary` (
    `beneficiary_id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT NOT NULL,
    `name` VARCHAR(100),
    `account_number` VARCHAR(50),
    `bank_name` VARCHAR(100),
    `relationship` VARCHAR(100),
    `active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `version` BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT `fk_beneficiary_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- Table structure for `favourite_biller`
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `favourite_biller`;
CREATE TABLE `favourite_biller` (
    `favourite_id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT NOT NULL,
    `biller_category` VARCHAR(50) NOT NULL,
    `biller_name` VARCHAR(100) NOT NULL,
    `nickname` VARCHAR(100) NOT NULL,
    `reference_number` VARCHAR(50) NOT NULL,
    `default_amount` DECIMAL(12,2),
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT `fk_favourite_biller_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- Table structure for `feedback`
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `feedback`;
CREATE TABLE `feedback` (
    `feedback_id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT NOT NULL,
    `feedback_type` VARCHAR(20) NOT NULL DEFAULT 'COMPLAINT',
    `subject` VARCHAR(200) NOT NULL,
    `message` TEXT NOT NULL,
    `rating` INT,
    `status` VARCHAR(40) NOT NULL,
    `moderator_id` INT,
    `staff_response` TEXT,
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `version` BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT `fk_feedback_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`),
    CONSTRAINT `fk_feedback_moderator` FOREIGN KEY (`moderator_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- Table structure for `notification`
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `notification`;
CREATE TABLE `notification` (
    `notification_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `title` VARCHAR(200),
    `message` TEXT,
    `event_type` VARCHAR(80),
    `status` VARCHAR(20) NOT NULL DEFAULT 'UNREAD',
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    `version` BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- Table structure for `audit_log`
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `audit_log`;
CREATE TABLE `audit_log` (
    `log_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT,
    `actor_type` VARCHAR(30) NOT NULL DEFAULT 'USER',
    `action` VARCHAR(255),
    `entity_type` VARCHAR(100),
    `entity_id` INT,
    `performed_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    `ip_address` VARCHAR(50),
    CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- Table structure for `ai_assistant`
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `ai_assistant`;
CREATE TABLE `ai_assistant` (
    `assistant_id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100),
    `version` VARCHAR(50),
    `status` VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- Table structure for `ai_chat`
-- ------------------------------------------------------------------------
DROP TABLE IF EXISTS `ai_chat`;
CREATE TABLE `ai_chat` (
    `chat_id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT NOT NULL,
    `assistant_id` INT NOT NULL,
    `question` TEXT,
    `response` TEXT,
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT `fk_chat_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`),
    CONSTRAINT `fk_chat_assistant` FOREIGN KEY (`assistant_id`) REFERENCES `ai_assistant` (`assistant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------
-- Seed Initial Data
-- Demo Password: DemoBank!2026
-- ------------------------------------------------------------------------
INSERT INTO `role` (`role_id`, `role_name`, `description`) VALUES
(1, 'Admin', 'System administration and audit'),
(2, 'Customer', 'Customer banking'),
(3, 'Manager', 'Final loan and product approval'),
(4, 'Employee', 'Customer service and loan review')
ON DUPLICATE KEY UPDATE `description`=VALUES(`description`);

INSERT INTO `users` (`user_id`, `role_id`, `username`, `password_hash`, `email`, `phone`, `status`, `created_at`, `version`) VALUES
(1, 2, 'john_customer', '$2a$10$mHPzdnVmdb2gM7Rb8arQK.dxmBhPd11I5Gv8g0NygrhTA3JW7mjiu', 'customer@test.com', '0711111111', 'ACTIVE', NOW(), 0),
(2, 2, 'jane_customer', '$2a$10$mHPzdnVmdb2gM7Rb8arQK.dxmBhPd11I5Gv8g0NygrhTA3JW7mjiu', 'jane@test.com', '0755555555', 'ACTIVE', NOW(), 0),
(3, 4, 'bank_employee', '$2a$10$mHPzdnVmdb2gM7Rb8arQK.dxmBhPd11I5Gv8g0NygrhTA3JW7mjiu', 'employee@test.com', '0722222222', 'ACTIVE', NOW(), 0),
(4, 3, 'branch_manager', '$2a$10$mHPzdnVmdb2gM7Rb8arQK.dxmBhPd11I5Gv8g0NygrhTA3JW7mjiu', 'manager@test.com', '0733333333', 'ACTIVE', NOW(), 0),
(5, 1, 'system_admin', '$2a$10$mHPzdnVmdb2gM7Rb8arQK.dxmBhPd11I5Gv8g0NygrhTA3JW7mjiu', 'admin@test.com', '0744444444', 'ACTIVE', NOW(), 0)
ON DUPLICATE KEY UPDATE `email`=VALUES(`email`), `status`=VALUES(`status`);

INSERT INTO `customer` (`customer_id`, `user_id`, `cif_number`, `nic`, `full_name`, `address`, `date_of_birth`) VALUES
(1, 1, '0000000', '199012345678', 'John Customer', 'Colombo, Sri Lanka', '1990-05-15'),
(2, 2, '0000001', '199287654321', 'Jane Customer', 'Kandy, Sri Lanka', '1992-08-20')
ON DUPLICATE KEY UPDATE `full_name`=VALUES(`full_name`), `address`=VALUES(`address`);

INSERT INTO `employee` (`employee_id`, `user_id`, `department`, `position`, `date_joined`) VALUES
(1, 3, 'Bank Operations', 'Employee', CURDATE()),
(2, 4, 'Credit & Risk Management', 'Manager', CURDATE())
ON DUPLICATE KEY UPDATE `department`=VALUES(`department`), `position`=VALUES(`position`);

INSERT INTO `account` (`account_id`, `customer_id`, `account_number`, `account_type`, `balance`, `open_date`, `status`, `is_primary`, `version`) VALUES
(1, 1, '1000000001', 'SAVINGS', 250000.00, CURDATE(), 'ACTIVE', TRUE, 0),
(2, 1, '1000000002', 'CURRENT', 80000.00, CURDATE(), 'ACTIVE', FALSE, 0),
(3, 2, '2000000001', 'SAVINGS', 175000.00, CURDATE(), 'ACTIVE', TRUE, 0)
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

INSERT INTO `beneficiary` (`beneficiary_id`, `customer_id`, `name`, `account_number`, `bank_name`, `relationship`, `active`, `created_at`, `version`) VALUES
(1, 1, 'Jane (demo recipient)', '2000000001', 'SERENDIB', 'Friend', TRUE, NOW(), 0)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `notification` (`notification_id`, `user_id`, `title`, `message`, `event_type`, `status`, `created_at`, `version`) VALUES
(1, 1, 'Welcome to Serendib Smart Bank', 'This is an academic LKR banking simulation. All balances and rates are demonstration values.', 'WELCOME', 'UNREAD', NOW(), 0),
(2, 2, 'Welcome to Serendib Smart Bank', 'This is an academic LKR banking simulation. All balances and rates are demonstration values.', 'WELCOME', 'UNREAD', NOW(), 0),
(3, 3, 'Welcome to Serendib Smart Bank Staff Portal', 'Operations management and verification center.', 'WELCOME', 'UNREAD', NOW(), 0),
(4, 4, 'Welcome to Serendib Smart Bank Management', 'Credit facility and administrative review portal.', 'WELCOME', 'UNREAD', NOW(), 0),
(5, 5, 'System Administration', 'Audit logging and user configuration center.', 'WELCOME', 'UNREAD', NOW(), 0)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

INSERT INTO `ai_assistant` (`assistant_id`, `name`, `version`, `status`) VALUES
(1, 'Serendib AI', '1.0', 'Active')
ON DUPLICATE KEY UPDATE `version`=VALUES(`version`);

INSERT INTO `transaction_record` (`transaction_id`, `to_account_id`, `initiated_by`, `amount`, `transaction_type`, `status`, `description`, `created_at`, `completed_at`, `version`) VALUES
(1, 1, 1, 10000.00, 'DEPOSIT', 'COMPLETED', 'Cash Deposit - Branch Counter #01', NOW(), NOW(), 0)
ON DUPLICATE KEY UPDATE `description`=VALUES(`description`);

SET FOREIGN_KEY_CHECKS = 1;
