-- ============================================================================
-- LOAN MANAGEMENT SYSTEM - DATABASE SCHEMA (PostgreSQL / Neon)
-- ============================================================================
-- Strictly structured according to:
-- "Loan Management System – Database Tables, Key Columns & Relationships"
--
-- Target Structure: EXACTLY 9 TABLES
-- 1. customers
-- 2. branches
-- 3. employees
-- 4. credit_policies
-- 5. applications
-- 6. loans
-- 7. emi_schedule
-- 8. payments
-- 9. disbursements
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE 1: CUSTOMERS
-- Purpose: Unique customer profile, KYC identification, and credit scoring.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    date_of_birth DATE NOT NULL CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '18 years'),
    gender VARCHAR(10) NULL,
    pan_number CHAR(10) NOT NULL UNIQUE CHECK (pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'),
    address TEXT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NULL,
    pincode VARCHAR(10) NULL,
    monthly_income NUMERIC(12, 2) NOT NULL CHECK (monthly_income > 0),
    employment_type VARCHAR(30) NOT NULL CHECK (employment_type IN ('Salaried', 'Self-Employed', 'Business Owner', 'Retired')),
    credit_score INT NOT NULL CHECK (credit_score BETWEEN 300 AND 900),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- TABLE 2: BRANCHES
-- Purpose: Physical bank branch identifier, locations, and contact details.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS branches (
    branch_id SERIAL PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL,
    branch_code VARCHAR(10) NOT NULL UNIQUE,
    address TEXT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    contact_number VARCHAR(20) NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- TABLE 3: EMPLOYEES
-- Purpose: Bank personnel handling underwriting and branch operations.
-- Relationship: Many employees belong to one branch (N:1).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
    employee_id SERIAL PRIMARY KEY,
    branch_id INT NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    employee_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    designation VARCHAR(50) NOT NULL,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- TABLE 4: CREDIT_POLICIES
-- Purpose: Lending eligibility criteria, interest rate bands, and limits.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS credit_policies (
    policy_id SERIAL PRIMARY KEY,
    policy_name VARCHAR(100) NOT NULL UNIQUE,
    loan_type VARCHAR(50) NOT NULL CHECK (loan_type IN ('Personal', 'Home', 'Auto', 'Business')),
    minimum_income NUMERIC(12, 2) NOT NULL DEFAULT 15000 CHECK (minimum_income > 0),
    minimum_credit_score INT NOT NULL CHECK (minimum_credit_score BETWEEN 300 AND 900),
    minimum_age INT NOT NULL DEFAULT 21 CHECK (minimum_age >= 18),
    maximum_age INT NOT NULL DEFAULT 65 CHECK (maximum_age > minimum_age),
    minimum_interest_rate NUMERIC(5, 2) NOT NULL CHECK (minimum_interest_rate > 0),
    maximum_interest_rate NUMERIC(5, 2) NOT NULL CHECK (maximum_interest_rate >= minimum_interest_rate),
    maximum_loan_amount NUMERIC(14, 2) NOT NULL CHECK (maximum_loan_amount > 0),
    maximum_tenure_months INT NOT NULL CHECK (maximum_tenure_months BETWEEN 6 AND 360),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- TABLE 5: APPLICATIONS
-- Purpose: Customer loan requests for credit assessment.
-- Relationships:
--   - customers (1:N)
--   - branches (1:N)
--   - employees (1:N, employee_id IS NULLABLE)
--   - credit_policies (1:N)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
    application_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
    branch_id INT NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    employee_id INT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
    policy_id INT NOT NULL REFERENCES credit_policies(policy_id) ON DELETE RESTRICT,
    loan_type VARCHAR(50) NOT NULL,
    requested_amount NUMERIC(14, 2) NOT NULL CHECK (requested_amount >= 10000),
    requested_tenure_months INT NOT NULL CHECK (requested_tenure_months BETWEEN 6 AND 360),
    purpose TEXT NULL,
    application_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'Submitted' 
        CHECK (status IN ('Submitted', 'Under_Review', 'Approved', 'Rejected')),
    rejection_reason TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- TABLE 6: LOANS
-- Purpose: Sanctioned loan contracts.
-- Relationships:
--   - applications (1:0..1, application_id IS UNIQUE FK)
--   - customers (1:N)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loans (
    loan_id SERIAL PRIMARY KEY,
    application_id INT NOT NULL UNIQUE REFERENCES applications(application_id) ON DELETE RESTRICT,
    customer_id INT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
    approved_amount NUMERIC(14, 2) NOT NULL CHECK (approved_amount > 0),
    interest_rate NUMERIC(5, 2) NOT NULL CHECK (interest_rate > 0),
    tenure_months INT NOT NULL CHECK (tenure_months > 0),
    loan_start_date DATE NOT NULL,
    loan_end_date DATE NOT NULL CHECK (loan_end_date > loan_start_date),
    status VARCHAR(30) NOT NULL DEFAULT 'Disbursed'
        CHECK (status IN ('Disbursed', 'Active', 'Closed', 'Defaulted')),
    outstanding_principal NUMERIC(14, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- TABLE 7: EMI_SCHEDULE
-- Purpose: Amortization schedule per loan installment.
-- Relationships:
--   - loans (1:N, ON DELETE CASCADE)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emi_schedule (
    emi_id SERIAL PRIMARY KEY,
    loan_id INT NOT NULL REFERENCES loans(loan_id) ON DELETE CASCADE,
    installment_number INT NOT NULL CHECK (installment_number > 0),
    due_date DATE NOT NULL,
    principal_amount NUMERIC(12, 2) NOT NULL CHECK (principal_amount >= 0),
    interest_amount NUMERIC(12, 2) NOT NULL CHECK (interest_amount >= 0),
    total_emi NUMERIC(12, 2) NOT NULL CHECK (total_emi > 0),
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' 
        CHECK (status IN ('Pending', 'Paid', 'Overdue')),
    paid_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (loan_id, installment_number)
);

-- ----------------------------------------------------------------------------
-- TABLE 8: PAYMENTS
-- Purpose: Inward borrower repayments towards loan / EMI.
-- Direction: Borrower -> Bank.
-- Relationships:
--   - loans (1:N)
--   - emi_schedule (1:N, emi_id IS NULLABLE FK, ON DELETE SET NULL)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    payment_id SERIAL PRIMARY KEY,
    loan_id INT NOT NULL REFERENCES loans(loan_id) ON DELETE RESTRICT,
    emi_id INT NULL REFERENCES emi_schedule(emi_id) ON DELETE SET NULL,
    transaction_reference VARCHAR(50) NOT NULL UNIQUE,
    payment_amount NUMERIC(12, 2) NOT NULL CHECK (payment_amount > 0),
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('UPI', 'NetBanking', 'DebitCard', 'AutoDebit', 'Cash')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'Success' 
        CHECK (payment_status IN ('Success', 'Failed', 'Pending')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- TABLE 9: DISBURSEMENTS
-- Purpose: Outward capital releases to borrowers upon loan sanction.
-- Direction: Bank -> Borrower.
-- Relationships:
--   - loans (1:N)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS disbursements (
    disbursement_id SERIAL PRIMARY KEY,
    loan_id INT NOT NULL REFERENCES loans(loan_id) ON DELETE RESTRICT,
    disbursement_amount NUMERIC(14, 2) NOT NULL CHECK (disbursement_amount > 0),
    disbursement_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    transaction_reference VARCHAR(50) NOT NULL UNIQUE,
    disbursement_status VARCHAR(20) NOT NULL DEFAULT 'Success' 
        CHECK (disbursement_status IN ('Success', 'Failed', 'Pending')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PERFORMANCE & INTEGRITY INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_customers_pan ON customers(pan_number);
CREATE INDEX IF NOT EXISTS idx_customers_credit_score ON customers(credit_score);
CREATE INDEX IF NOT EXISTS idx_applications_customer ON applications(customer_id);
CREATE INDEX IF NOT EXISTS idx_applications_branch ON applications(branch_id);
CREATE INDEX IF NOT EXISTS idx_applications_employee ON applications(employee_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_loans_customer ON loans(customer_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_emi_loan_due ON emi_schedule(loan_id, due_date);
CREATE INDEX IF NOT EXISTS idx_emi_status ON emi_schedule(status);
CREATE INDEX IF NOT EXISTS idx_payments_loan ON payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_payments_emi ON payments(emi_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_disbursements_loan ON disbursements(loan_id);
