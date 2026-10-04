-- ========================================================================
-- Serendib Smart Bank Schema Migration: V1__init_schema.sql
-- Engine: MySQL 8.0+ / 8.4
-- Timezone: Asia/Colombo
-- ========================================================================

-- 1. Role Table
CREATE TABLE IF NOT EXISTS role (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    profile_image VARCHAR(255),
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES role(role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Customer Table
CREATE TABLE IF NOT EXISTS customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    cif_number VARCHAR(20) UNIQUE,
    nic VARCHAR(20),
    full_name VARCHAR(100),
    address VARCHAR(255),
    date_of_birth DATE,
    profile_image VARCHAR(255),
    nic_front_image VARCHAR(255),
    nic_back_image VARCHAR(255),
    CONSTRAINT fk_customer_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Employee Table
CREATE TABLE IF NOT EXISTS employee (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    department VARCHAR(100),
    position VARCHAR(100),
    date_joined DATE,
    CONSTRAINT fk_employee_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Account Table
CREATE TABLE IF NOT EXISTS account (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    account_number VARCHAR(50) NOT NULL UNIQUE,
    account_type VARCHAR(50) NOT NULL,
    balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    open_date DATE,
    status VARCHAR(50) NOT NULL,
    kyc_data TEXT,
    rejection_reason TEXT,
    approved_by_officer_id INT,
    approved_by_manager_id INT,
    is_primary BOOLEAN DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_account_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    CONSTRAINT fk_account_officer FOREIGN KEY (approved_by_officer_id) REFERENCES users(user_id),
    CONSTRAINT fk_account_manager FOREIGN KEY (approved_by_manager_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Transaction Record Table
CREATE TABLE IF NOT EXISTS transaction_record (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    from_account_id INT,
    to_account_id INT,
    initiated_by INT,
    amount DECIMAL(12,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    idempotency_key VARCHAR(80),
    request_fingerprint VARCHAR(64),
    failure_code VARCHAR(80),
    bill_type VARCHAR(50),
    bill_reference VARCHAR(50),
    external_bank VARCHAR(100),
    external_account_number VARCHAR(50),
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    completed_at DATETIME(6),
    authorization_expires_at DATETIME(6),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_transaction_from_account FOREIGN KEY (from_account_id) REFERENCES account(account_id),
    CONSTRAINT fk_transaction_to_account FOREIGN KEY (to_account_id) REFERENCES account(account_id),
    CONSTRAINT fk_transaction_initiated_by FOREIGN KEY (initiated_by) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Fixed Deposit Table
CREATE TABLE IF NOT EXISTS fixed_deposit (
    fixed_deposit_id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    principal_amount DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    term_months INT NOT NULL,
    start_date DATE,
    maturity_date DATE,
    maturity_amount DECIMAL(12,2),
    status VARCHAR(40) NOT NULL,
    opening_transaction_id INT UNIQUE,
    closing_transaction_id INT UNIQUE,
    fd_details TEXT,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_fd_account FOREIGN KEY (account_id) REFERENCES account(account_id),
    CONSTRAINT fk_fd_opening_txn FOREIGN KEY (opening_transaction_id) REFERENCES transaction_record(transaction_id),
    CONSTRAINT fk_fd_closing_txn FOREIGN KEY (closing_transaction_id) REFERENCES transaction_record(transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Loan Table
CREATE TABLE IF NOT EXISTS loan (
    loan_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    reviewer_employee_id INT,
    loan_number VARCHAR(50),
    loan_type VARCHAR(50) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(5,2),
    status VARCHAR(40) NOT NULL,
    apply_date DATE,
    review_date DATE,
    additional_information TEXT,
    scrutiny_data TEXT,
    account_id INT,
    fixed_deposit_id INT,
    paid_amount DECIMAL(12,2) DEFAULT 0.00,
    approved_by_officer_id INT,
    approved_by_manager_id INT,
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_loan_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    CONSTRAINT fk_loan_reviewer FOREIGN KEY (reviewer_employee_id) REFERENCES employee(employee_id),
    CONSTRAINT fk_loan_target_account FOREIGN KEY (account_id) REFERENCES account(account_id),
    CONSTRAINT fk_loan_fd FOREIGN KEY (fixed_deposit_id) REFERENCES fixed_deposit(fixed_deposit_id),
    CONSTRAINT fk_loan_officer FOREIGN KEY (approved_by_officer_id) REFERENCES users(user_id),
    CONSTRAINT fk_loan_manager FOREIGN KEY (approved_by_manager_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Loan Decision Table
CREATE TABLE IF NOT EXISTS loan_decision (
    decision_id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id INT NOT NULL,
    user_id INT NOT NULL,
    action VARCHAR(80) NOT NULL,
    reason TEXT NOT NULL,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_loan_decision_loan FOREIGN KEY (loan_id) REFERENCES loan(loan_id),
    CONSTRAINT fk_loan_decision_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Card Table
CREATE TABLE IF NOT EXISTS card (
    card_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    account_id INT,
    card_number VARCHAR(50),
    card_type VARCHAR(50) NOT NULL,
    card_product VARCHAR(100),
    expiry_date DATE,
    status VARCHAR(50) NOT NULL,
    credit_limit DECIMAL(15,2),
    available_credit DECIMAL(15,2),
    current_balance DECIMAL(15,2),
    issued_by INT,
    requested_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    issued_at DATETIME(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    full_name VARCHAR(100),
    nic_number VARCHAR(20),
    mobile_number VARCHAR(20),
    email_address VARCHAR(100),
    residential_address VARCHAR(255),
    housing_status VARCHAR(50),
    employment_type VARCHAR(50),
    employer_name VARCHAR(100),
    designation VARCHAR(100),
    years_of_service INT,
    gross_monthly_income DECIMAL(15,2),
    fixed_allowances DECIMAL(15,2),
    existing_credit_deductions DECIMAL(15,2),
    primary_bank_name VARCHAR(100),
    crib_consent BOOLEAN,
    pay_slips_upload TEXT,
    bank_statements_upload TEXT,
    employment_letter_upload TEXT,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_card_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_card_account FOREIGN KEY (account_id) REFERENCES account(account_id),
    CONSTRAINT fk_card_issued_by FOREIGN KEY (issued_by) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Bill Payment Table
CREATE TABLE IF NOT EXISTS bill_payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    account_id INT NOT NULL,
    transaction_id INT UNIQUE,
    reference_number VARCHAR(50) NOT NULL,
    bill_type VARCHAR(50) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE,
    status VARCHAR(20) NOT NULL,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    completed_at DATETIME(6),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_payment_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    CONSTRAINT fk_payment_account FOREIGN KEY (account_id) REFERENCES account(account_id),
    CONSTRAINT fk_payment_transaction FOREIGN KEY (transaction_id) REFERENCES transaction_record(transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. OTP Table
CREATE TABLE IF NOT EXISTS otp (
    otp_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL UNIQUE,
    otp_hash VARCHAR(255) NOT NULL,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    expires_at DATETIME(6),
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at DATETIME(6),
    attempt_count INT NOT NULL DEFAULT 0,
    last_sent_at DATETIME(6),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_otp_transaction FOREIGN KEY (transaction_id) REFERENCES transaction_record(transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Beneficiary Table
CREATE TABLE IF NOT EXISTS beneficiary (
    beneficiary_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    name VARCHAR(100),
    account_number VARCHAR(50),
    bank_name VARCHAR(100),
    relationship VARCHAR(100),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_beneficiary_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Favourite Biller Table
CREATE TABLE IF NOT EXISTS favourite_biller (
    favourite_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    biller_category VARCHAR(50) NOT NULL,
    biller_name VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    reference_number VARCHAR(50) NOT NULL,
    default_amount DECIMAL(12,2),
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_favourite_biller_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    feedback_type VARCHAR(20) NOT NULL DEFAULT 'COMPLAINT',
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    rating INT,
    status VARCHAR(40) NOT NULL,
    moderator_id INT,
    staff_response TEXT,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_feedback_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    CONSTRAINT fk_feedback_moderator FOREIGN KEY (moderator_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Notification Table
CREATE TABLE IF NOT EXISTS notification (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200),
    message TEXT,
    event_type VARCHAR(80),
    status VARCHAR(20) NOT NULL DEFAULT 'UNREAD',
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Audit Log Table
CREATE TABLE IF NOT EXISTS audit_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    actor_type VARCHAR(30) NOT NULL DEFAULT 'USER',
    action VARCHAR(255),
    entity_type VARCHAR(100),
    entity_id INT,
    performed_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    ip_address VARCHAR(50),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. AI Assistant Table
CREATE TABLE IF NOT EXISTS ai_assistant (
    assistant_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    version VARCHAR(50),
    status VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. AI Chat Table
CREATE TABLE IF NOT EXISTS ai_chat (
    chat_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    assistant_id INT NOT NULL,
    question TEXT,
    response TEXT,
    created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_chat_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    CONSTRAINT fk_chat_assistant FOREIGN KEY (assistant_id) REFERENCES ai_assistant(assistant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================================
-- Indexes for query optimization
-- ========================================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_customer_cif ON customer(cif_number);
CREATE INDEX idx_account_customer ON account(customer_id);
CREATE INDEX idx_account_number ON account(account_number);
CREATE INDEX idx_transaction_from_account ON transaction_record(from_account_id, created_at DESC);
CREATE INDEX idx_transaction_to_account ON transaction_record(to_account_id, created_at DESC);
CREATE INDEX idx_fixed_deposit_account ON fixed_deposit(account_id);
CREATE INDEX idx_loan_customer ON loan(customer_id);
CREATE INDEX idx_card_user ON card(user_id);
CREATE INDEX idx_card_account ON card(account_id);
CREATE INDEX idx_bill_customer ON bill_payment(customer_id, created_at DESC);
CREATE INDEX idx_beneficiary_customer ON beneficiary(customer_id);
CREATE INDEX idx_favourite_biller_customer ON favourite_biller(customer_id);
CREATE INDEX idx_feedback_customer ON feedback(customer_id);
CREATE INDEX idx_notification_user ON notification(user_id, status, created_at DESC);
CREATE INDEX idx_audit_actor ON audit_log(user_id, performed_at DESC);
CREATE INDEX idx_audit_action ON audit_log(action, performed_at DESC);
