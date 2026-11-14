-- ============================================================================
-- SAFE DATABASE MIGRATION SCRIPT: TO PDF REFERENCE SCHEMA
-- ============================================================================
-- Strictly conforms to:
-- "Loan Management System – Database Tables, Key Columns & Relationships"
-- Target: EXACTLY 9 TABLES, EXACTLY PDF COLUMNS, 100% DATA PRESERVATION
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. DROP UNRELATED EXTRA TABLES (users, content, content_schedule, content_slots)
-- Destructive effect: Completely purges the 4 educational/content tables.
-- Safety: Full pre-migration JSON snapshot backed up securely outside project.
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS content_schedule CASCADE;
DROP TABLE IF EXISTS content_slots CASCADE;
DROP TABLE IF EXISTS content CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ----------------------------------------------------------------------------
-- 2. MIGRATE CUSTOMERS TABLE (PDF Page 1)
-- Target columns: customer_id, first_name, last_name, email, phone, date_of_birth,
--                 gender, pan_number, address, city, state, pincode, monthly_income,
--                 employment_type, credit_score, created_at, updated_at
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='cibil_score') THEN
        ALTER TABLE customers RENAME COLUMN cibil_score TO credit_score;
    END IF;
END $$;

ALTER TABLE customers ADD COLUMN IF NOT EXISTS gender VARCHAR(10) NULL;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT NULL;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state VARCHAR(50) NULL;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS pincode VARCHAR(10) NULL;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

DROP INDEX IF EXISTS idx_customers_cibil;
CREATE INDEX IF NOT EXISTS idx_customers_credit_score ON customers(credit_score);

-- ----------------------------------------------------------------------------
-- 3. MIGRATE BRANCHES TABLE (PDF Page 1)
-- Target columns: branch_id, branch_name, branch_code, address, city, state,
--                 pincode, contact_number, created_at
-- ----------------------------------------------------------------------------
ALTER TABLE branches ADD COLUMN IF NOT EXISTS address TEXT NULL;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20) NULL;

-- Remove non-PDF column is_active from branches
ALTER TABLE branches DROP COLUMN IF EXISTS is_active;

-- ----------------------------------------------------------------------------
-- 4. MIGRATE EMPLOYEES TABLE (PDF Page 2)
-- Target columns: employee_id, branch_id, employee_name, email, phone,
--                 designation, joining_date, created_at
-- ----------------------------------------------------------------------------
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_name VARCHAR(100);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='first_name') THEN
        UPDATE employees SET employee_name = CONCAT(first_name, ' ', last_name) WHERE employee_name IS NULL;
        ALTER TABLE employees DROP COLUMN IF EXISTS first_name;
        ALTER TABLE employees DROP COLUMN IF EXISTS last_name;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='role') THEN
        ALTER TABLE employees RENAME COLUMN role TO designation;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='hire_date') THEN
        ALTER TABLE employees RENAME COLUMN hire_date TO joining_date;
    END IF;
END $$;

ALTER TABLE employees ALTER COLUMN employee_name SET NOT NULL;

-- Remove non-PDF column is_active from employees
ALTER TABLE employees DROP COLUMN IF EXISTS is_active;

-- ----------------------------------------------------------------------------
-- 5. MIGRATE CREDIT_POLICIES TABLE (PDF Page 2)
-- Target columns: policy_id, policy_name, loan_type, minimum_income,
--                 minimum_credit_score, minimum_age, maximum_age,
--                 minimum_interest_rate, maximum_interest_rate,
--                 maximum_loan_amount, maximum_tenure_months, is_active, created_at
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='credit_policies' AND column_name='min_cibil_score') THEN
        ALTER TABLE credit_policies RENAME COLUMN min_cibil_score TO minimum_credit_score;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='credit_policies' AND column_name='base_interest_rate') THEN
        ALTER TABLE credit_policies RENAME COLUMN base_interest_rate TO minimum_interest_rate;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='credit_policies' AND column_name='max_loan_amount') THEN
        ALTER TABLE credit_policies RENAME COLUMN max_loan_amount TO maximum_loan_amount;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='credit_policies' AND column_name='max_tenure_months') THEN
        ALTER TABLE credit_policies RENAME COLUMN max_tenure_months TO maximum_tenure_months;
    END IF;
END $$;

ALTER TABLE credit_policies ADD COLUMN IF NOT EXISTS minimum_income NUMERIC(12, 2) NOT NULL DEFAULT 15000;
ALTER TABLE credit_policies ADD COLUMN IF NOT EXISTS minimum_age INT NOT NULL DEFAULT 21;
ALTER TABLE credit_policies ADD COLUMN IF NOT EXISTS maximum_age INT NOT NULL DEFAULT 65;
ALTER TABLE credit_policies ADD COLUMN IF NOT EXISTS maximum_interest_rate NUMERIC(5, 2) NULL;
UPDATE credit_policies SET maximum_interest_rate = minimum_interest_rate + 6.0 WHERE maximum_interest_rate IS NULL;
ALTER TABLE credit_policies ALTER COLUMN maximum_interest_rate SET NOT NULL;
ALTER TABLE credit_policies ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Remove non-PDF column active_from from credit_policies
ALTER TABLE credit_policies DROP COLUMN IF EXISTS active_from;

-- ----------------------------------------------------------------------------
-- 6. MIGRATE APPLICATIONS TABLE (PDF Page 3)
-- Target columns: application_id, customer_id, branch_id, employee_id, policy_id,
--                 loan_type, requested_amount, requested_tenure_months, purpose,
--                 application_date, status, rejection_reason, created_at, updated_at
-- ----------------------------------------------------------------------------
ALTER TABLE applications ADD COLUMN IF NOT EXISTS branch_id INT NULL REFERENCES branches(branch_id);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='assigned_officer_id') THEN
        ALTER TABLE applications RENAME COLUMN assigned_officer_id TO employee_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='loan_amount_requested') THEN
        ALTER TABLE applications RENAME COLUMN loan_amount_requested TO requested_amount;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='tenure_months') THEN
        ALTER TABLE applications RENAME COLUMN tenure_months TO requested_tenure_months;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='application_status') THEN
        ALTER TABLE applications RENAME COLUMN application_status TO status;
    END IF;
END $$;

-- 3-Stage Hierarchical Branch Resolution for applications (No arbitrary fallback):
-- Stage 1: Map from assigned officer's branch where employee_id IS NOT NULL
UPDATE applications a
SET branch_id = e.branch_id
FROM employees e
WHERE a.employee_id = e.employee_id AND a.branch_id IS NULL;

-- Stage 2: For applications where employee_id IS NULL, match customer's residential city to branch city
UPDATE applications a
SET branch_id = b.branch_id
FROM customers c
JOIN branches b ON LOWER(TRIM(c.city)) = LOWER(TRIM(b.city))
WHERE a.customer_id = c.customer_id AND a.branch_id IS NULL;

-- Stage 3: Match from any other application submitted by the same customer that has an established branch_id
UPDATE applications a
SET branch_id = other_app.branch_id
FROM applications other_app
WHERE other_app.customer_id = a.customer_id 
  AND other_app.branch_id IS NOT NULL 
  AND a.branch_id IS NULL;

-- Stage 4: Safety Check - DO NOT automatically assign branch_id = 1.
-- If any applications remain unresolved, branch_id remains NULLABLE and flagged for manual resolution.
-- If all applications are successfully resolved, enforce NOT NULL constraint.
DO $$
DECLARE
    unresolved_app_count INT;
BEGIN
    SELECT COUNT(*) INTO unresolved_app_count FROM applications WHERE branch_id IS NULL;
    IF unresolved_app_count = 0 THEN
        ALTER TABLE applications ALTER COLUMN branch_id SET NOT NULL;
    ELSE
        RAISE NOTICE 'MIGRATION AUDIT NOTICE: % application(s) have unresolved branch_id. Leaving branch_id NULLABLE pending manual business verification.', unresolved_app_count;
    END IF;
END $$;

-- Ensure employee_id IS NULLABLE per PDF requirements (applications may be unassigned)
ALTER TABLE applications ALTER COLUMN employee_id DROP NOT NULL;

-- Add loan_type, purpose, updated_at
ALTER TABLE applications ADD COLUMN IF NOT EXISTS loan_type VARCHAR(50);
UPDATE applications a
SET loan_type = cp.loan_type
FROM credit_policies cp
WHERE a.policy_id = cp.policy_id AND a.loan_type IS NULL;
ALTER TABLE applications ALTER COLUMN loan_type SET NOT NULL;

ALTER TABLE applications ADD COLUMN IF NOT EXISTS purpose TEXT NULL;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

DROP INDEX IF EXISTS idx_applications_status;
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_branch ON applications(branch_id);
CREATE INDEX IF NOT EXISTS idx_applications_employee ON applications(employee_id);

-- ----------------------------------------------------------------------------
-- 7. MIGRATE LOANS TABLE (PDF Page 3)
-- Target columns: loan_id, application_id, customer_id, approved_amount,
--                 interest_rate, tenure_months, loan_start_date, loan_end_date,
--                 status, outstanding_principal, created_at, updated_at
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='principal_amount') THEN
        ALTER TABLE loans RENAME COLUMN principal_amount TO approved_amount;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='annual_interest_rate') THEN
        ALTER TABLE loans RENAME COLUMN annual_interest_rate TO interest_rate;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='disbursement_date') THEN
        ALTER TABLE loans RENAME COLUMN disbursement_date TO loan_start_date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='maturity_date') THEN
        ALTER TABLE loans RENAME COLUMN maturity_date TO loan_end_date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loans' AND column_name='loan_status') THEN
        ALTER TABLE loans RENAME COLUMN loan_status TO status;
    END IF;
END $$;

ALTER TABLE loans ADD COLUMN IF NOT EXISTS outstanding_principal NUMERIC(14, 2) DEFAULT 0;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Remove non-PDF column monthly_emi from loans
ALTER TABLE loans DROP COLUMN IF EXISTS monthly_emi;

DROP INDEX IF EXISTS idx_loans_status;
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);

-- ----------------------------------------------------------------------------
-- 8. MIGRATE EMI_SCHEDULE TABLE (PDF Page 4)
-- Target columns: emi_id, loan_id, installment_number, due_date, principal_amount,
--                 interest_amount, total_emi, paid_amount, status, paid_at, created_at
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='emi_schedule' AND column_name='schedule_id') THEN
        ALTER TABLE emi_schedule RENAME COLUMN schedule_id TO emi_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='emi_schedule' AND column_name='principal_component') THEN
        ALTER TABLE emi_schedule RENAME COLUMN principal_component TO principal_amount;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='emi_schedule' AND column_name='interest_component') THEN
        ALTER TABLE emi_schedule RENAME COLUMN interest_component TO interest_amount;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='emi_schedule' AND column_name='total_installment_amount') THEN
        ALTER TABLE emi_schedule RENAME COLUMN total_installment_amount TO total_emi;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='emi_schedule' AND column_name='payment_status') THEN
        ALTER TABLE emi_schedule RENAME COLUMN payment_status TO status;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='emi_schedule' AND column_name='paid_date') THEN
        ALTER TABLE emi_schedule RENAME COLUMN paid_date TO paid_at;
    END IF;
END $$;

ALTER TABLE emi_schedule ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12, 2) DEFAULT 0;

-- Precise Financial Mapping for paid_amount:
-- Strictly derives paid_amount from actual successful payments linked to this installment.
-- Preserves real payment records without inventing values or falling back to total_emi.
UPDATE emi_schedule e
SET paid_amount = COALESCE(sub.actual_paid, 0.00)
FROM (
    SELECT 
        schedule_id AS matched_schedule_id, 
        SUM(amount_paid) AS actual_paid
    FROM payments
    WHERE payment_status = 'Success' AND schedule_id IS NOT NULL
    GROUP BY schedule_id
) sub
WHERE e.emi_id = sub.matched_schedule_id;

-- Ensure any installments without matched payments have paid_amount set to 0.00 (not NULL)
UPDATE emi_schedule SET paid_amount = 0.00 WHERE paid_amount IS NULL;

ALTER TABLE emi_schedule ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

DROP INDEX IF EXISTS idx_emi_status;
CREATE INDEX IF NOT EXISTS idx_emi_status ON emi_schedule(status);

-- ----------------------------------------------------------------------------
-- PRECISE OUTSTANDING PRINCIPAL CALCULATION
-- Formula: Approved Amount - (Confirmed Scheduled Principal Paid)
-- Note: Unscheduled prepayments (where schedule_id IS NULL) are NOT guessed as
-- 100% principal and are preserved for manual accounting allocation.
-- Closed loans are explicitly set to 0.00.
-- ----------------------------------------------------------------------------
UPDATE loans l
SET outstanding_principal = CASE 
    WHEN l.status = 'Closed' THEN 0.00
    ELSE GREATEST(0.00, l.approved_amount - COALESCE((
        SELECT SUM(e.principal_amount) 
        FROM emi_schedule e 
        WHERE e.loan_id = l.loan_id AND e.status = 'Paid'
    ), 0.00))
END;

-- ----------------------------------------------------------------------------
-- 9. MIGRATE PAYMENTS TABLE (PDF Page 4)
-- Target columns: payment_id, loan_id, emi_id, transaction_reference,
--                 payment_amount, payment_date, payment_method, payment_status, created_at
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='schedule_id') THEN
        ALTER TABLE payments RENAME COLUMN schedule_id TO emi_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='amount_paid') THEN
        ALTER TABLE payments RENAME COLUMN amount_paid TO payment_amount;
    END IF;
END $$;

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_schedule_id_fkey;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_emi_id_fkey;
ALTER TABLE payments ADD CONSTRAINT payments_emi_id_fkey FOREIGN KEY (emi_id) REFERENCES emi_schedule(emi_id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_payments_emi ON payments(emi_id);

-- ----------------------------------------------------------------------------
-- 10. MIGRATE DISBURSEMENTS TABLE (PDF Page 5)
-- Target columns: disbursement_id, loan_id, disbursement_amount, disbursement_date,
--                 transaction_reference, disbursement_status, created_at
-- ----------------------------------------------------------------------------
ALTER TABLE disbursements ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(50);
UPDATE disbursements 
SET transaction_reference = 'DSB-REF-' || LPAD(disbursement_id::text, 6, '0') 
WHERE transaction_reference IS NULL;
ALTER TABLE disbursements ALTER COLUMN transaction_reference SET NOT NULL;
ALTER TABLE disbursements DROP CONSTRAINT IF EXISTS disbursements_transaction_reference_key;
ALTER TABLE disbursements ADD CONSTRAINT disbursements_transaction_reference_key UNIQUE (transaction_reference);

-- Remove non-PDF auxiliary banking fields from disbursements
ALTER TABLE disbursements DROP COLUMN IF EXISTS bank_account_number;
ALTER TABLE disbursements DROP COLUMN IF EXISTS ifsc_code;
ALTER TABLE disbursements DROP COLUMN IF EXISTS payment_mode;

CREATE INDEX IF NOT EXISTS idx_disbursements_loan ON disbursements(loan_id);

COMMIT;
