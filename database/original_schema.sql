-- ============================================================================
-- ORIGINAL DATABASE SCHEMA (13 TABLES PRE-MIGRATION STATE)
-- ============================================================================
-- Purpose: Canonical recovery definition used by the full rollback strategy.
-- Contains all 9 original loan tables + 4 original content/user tables.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. branches (original)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS branches (
    branch_id SERIAL PRIMARY KEY,
    branch_code VARCHAR(10) NOT NULL UNIQUE,
    branch_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. employees (original)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
    employee_id SERIAL PRIMARY KEY,
    branch_id INT NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Loan Officer', 'Credit Analyst', 'Branch Manager', 'Operations Executive')),
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. credit_policies (original)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS credit_policies (
    policy_id SERIAL PRIMARY KEY,
    policy_name VARCHAR(100) NOT NULL UNIQUE,
    loan_type VARCHAR(50) NOT NULL CHECK (loan_type IN ('Personal', 'Home', 'Auto', 'Business')),
    min_cibil_score INT NOT NULL CHECK (min_cibil_score BETWEEN 300 AND 900),
    max_loan_amount NUMERIC(14, 2) NOT NULL CHECK (max_loan_amount > 0),
    base_interest_rate NUMERIC(5, 2) NOT NULL CHECK (base_interest_rate > 0 AND base_interest_rate <= 40),
    max_tenure_months INT NOT NULL CHECK (max_tenure_months BETWEEN 6 AND 360),
    active_from DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ----------------------------------------------------------------------------
-- 4. customers (original)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    customer_id SERIAL PRIMARY KEY,
    pan_number CHAR(10) NOT NULL UNIQUE CHECK (pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    date_of_birth DATE NOT NULL CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '18 years'),
    monthly_income NUMERIC(12, 2) NOT NULL CHECK (monthly_income > 0),
    employment_type VARCHAR(30) NOT NULL CHECK (employment_type IN ('Salaried', 'Self-Employed', 'Business Owner', 'Retired')),
    cibil_score INT NOT NULL CHECK (cibil_score BETWEEN 300 AND 900),
    city VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. applications (original)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
    application_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
    assigned_officer_id INT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
    policy_id INT NOT NULL REFERENCES credit_policies(policy_id) ON DELETE RESTRICT,
    loan_amount_requested NUMERIC(14, 2) NOT NULL CHECK (loan_amount_requested >= 10000),
    tenure_months INT NOT NULL CHECK (tenure_months BETWEEN 6 AND 360),
    application_status VARCHAR(30) NOT NULL DEFAULT 'Submitted' CHECK (application_status IN ('Submitted', 'Under_Review', 'Approved', 'Rejected')),
    rejection_reason TEXT NULL,
    application_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 6. loans (original)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loans (
    loan_id SERIAL PRIMARY KEY,
    application_id INT NOT NULL UNIQUE REFERENCES applications(application_id) ON DELETE RESTRICT,
    customer_id INT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
    principal_amount NUMERIC(14, 2) NOT NULL CHECK (principal_amount > 0),
    annual_interest_rate NUMERIC(5, 2) NOT NULL CHECK (annual_interest_rate > 0),
    tenure_months INT NOT NULL CHECK (tenure_months > 0),
    monthly_emi NUMERIC(12, 2) NOT NULL CHECK (monthly_emi > 0),
    loan_status VARCHAR(30) NOT NULL DEFAULT 'Disbursed' CHECK (loan_status IN ('Disbursed', 'Active', 'Closed', 'Defaulted')),
    disbursement_date DATE NOT NULL,
    maturity_date DATE NOT NULL CHECK (maturity_date > disbursement_date),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 7. disbursements (original)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS disbursements (
    disbursement_id SERIAL PRIMARY KEY,
    loan_id INT NOT NULL REFERENCES loans(loan_id) ON DELETE RESTRICT,
    disbursement_amount NUMERIC(14, 2) NOT NULL CHECK (disbursement_amount > 0),
    disbursement_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    bank_account_number VARCHAR(20) NOT NULL,
    ifsc_code VARCHAR(11) NOT NULL CHECK (ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
    payment_mode VARCHAR(20) NOT NULL CHECK (payment_mode IN ('NEFT', 'RTGS', 'IMPS')),
    disbursement_status VARCHAR(20) NOT NULL DEFAULT 'Success' CHECK (disbursement_status IN ('Success', 'Failed', 'Pending'))
);

-- ----------------------------------------------------------------------------
-- 8. emi_schedule (original)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emi_schedule (
    schedule_id SERIAL PRIMARY KEY,
    loan_id INT NOT NULL REFERENCES loans(loan_id) ON DELETE CASCADE,
    installment_number INT NOT NULL CHECK (installment_number > 0),
    due_date DATE NOT NULL,
    principal_component NUMERIC(12, 2) NOT NULL CHECK (principal_component >= 0),
    interest_component NUMERIC(12, 2) NOT NULL CHECK (interest_component >= 0),
    total_installment_amount NUMERIC(12, 2) NOT NULL CHECK (total_installment_amount > 0),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Overdue')),
    paid_date DATE NULL,
    UNIQUE (loan_id, installment_number)
);

-- ----------------------------------------------------------------------------
-- 9. payments (original)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    payment_id SERIAL PRIMARY KEY,
    loan_id INT NOT NULL REFERENCES loans(loan_id) ON DELETE RESTRICT,
    schedule_id INT NULL REFERENCES emi_schedule(schedule_id) ON DELETE SET NULL,
    amount_paid NUMERIC(12, 2) NOT NULL CHECK (amount_paid > 0),
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('UPI', 'NetBanking', 'DebitCard', 'AutoDebit', 'Cash')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'Success' CHECK (payment_status IN ('Success', 'Failed', 'Pending')),
    transaction_reference VARCHAR(50) NOT NULL UNIQUE
);

-- ----------------------------------------------------------------------------
-- 10. users (original extra table)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 11. content (original extra table)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT NULL,
    subject VARCHAR(100) NOT NULL,
    file_url VARCHAR(1000) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    rejection_reason TEXT NULL,
    approved_by UUID NULL REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE NULL,
    start_time TIMESTAMP WITH TIME ZONE NULL,
    end_time TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 12. content_slots (original extra table)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject VARCHAR(100) NOT NULL,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (subject, teacher_id)
);

-- ----------------------------------------------------------------------------
-- 13. content_schedule (original extra table)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    slot_id UUID NOT NULL REFERENCES content_slots(id) ON DELETE CASCADE,
    rotation_order INT NOT NULL DEFAULT 0,
    duration INT NOT NULL DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (content_id, slot_id)
);

-- ----------------------------------------------------------------------------
-- ORIGINAL INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_customers_pan ON customers(pan_number);
CREATE INDEX IF NOT EXISTS idx_customers_cibil ON customers(cibil_score);
CREATE INDEX IF NOT EXISTS idx_applications_customer ON applications(customer_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(application_status);
CREATE INDEX IF NOT EXISTS idx_loans_customer ON loans(customer_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(loan_status);
CREATE INDEX IF NOT EXISTS idx_emi_loan_due ON emi_schedule(loan_id, due_date);
CREATE INDEX IF NOT EXISTS idx_emi_status ON emi_schedule(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_loan ON payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_subject ON content(subject);
CREATE INDEX IF NOT EXISTS idx_content_uploaded_by ON content(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_slots_teacher ON content_slots(teacher_id);
CREATE INDEX IF NOT EXISTS idx_schedule_content_id ON content_schedule(content_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slot_id ON content_schedule(slot_id);
