-- ============================================================================
-- LOAN MANAGEMENT SYSTEM - SEED DATA (PostgreSQL / Neon)
-- ============================================================================
-- Strictly structured according to:
-- "Loan Management System – Database Tables, Key Columns & Relationships"
-- Features:
--   - 6 Branches & 10 Employees
--   - 6 Comprehensive Credit Policies
--   - 35 Customers with PAN, credit score, and address data
--   - 48 Realistic Applications with branch, officer, and status tracking
--   - 28 Active & Closed Loans
--   - 28 Loan Disbursements
--   - 48 EMI Schedule Installments
--   - 35 Repayment Transactions (including payments without direct EMI linkage)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SEED: BRANCHES
-- ----------------------------------------------------------------------------
INSERT INTO branches (branch_id, branch_name, branch_code, address, city, state, pincode, contact_number) VALUES
(1, 'Mumbai Fort Financial Center', 'BR-MUM-01', '14 Fort Business Hub, MG Road', 'Mumbai', 'Maharashtra', '400001', '+91-22-22001122'),
(2, 'Delhi Connaught Place Branch', 'BR-DEL-01', 'B-12 Inner Circle, Connaught Place', 'New Delhi', 'Delhi', '110001', '+91-11-23314455'),
(3, 'Bengaluru Koramangala Hub', 'BR-BLR-01', '80 Feet Road, 4th Block, Koramangala', 'Bengaluru', 'Karnataka', '560034', '+91-80-25537788'),
(4, 'Hyderabad HITEC City Plaza', 'BR-HYD-01', 'Mindspace Circle, HITEC City, Madhapur', 'Hyderabad', 'Telangana', '500081', '+91-40-66228899'),
(5, 'Pune Shivajinagar Branch', 'BR-PUN-01', 'FC Road, Near Deccan Gymkhana, Shivajinagar', 'Pune', 'Maharashtra', '411005', '+91-20-25651100'),
(6, 'Chennai Anna Nagar Branch', 'BR-CHE-01', '2nd Avenue, Anna Nagar East', 'Chennai', 'Tamil Nadu', '600102', '+91-44-26213344')
ON CONFLICT (branch_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. SEED: EMPLOYEES
-- ----------------------------------------------------------------------------
INSERT INTO employees (employee_id, branch_id, employee_name, email, phone, designation, joining_date) VALUES
(1, 1, 'Rajesh Sharma', 'rajesh.sharma@finloanpro.com', '+91-9820011001', 'Branch Manager', '2020-03-15'),
(2, 1, 'Priya Nair', 'priya.nair@finloanpro.com', '+91-9820011002', 'Loan Officer', '2021-06-10'),
(3, 1, 'Amit Verma', 'amit.verma@finloanpro.com', '+91-9820011003', 'Credit Analyst', '2022-01-20'),
(4, 2, 'Sunita Kapoor', 'sunita.kapoor@finloanpro.com', '+91-9810022001', 'Branch Manager', '2019-11-05'),
(5, 2, 'Vikas Malhotra', 'vikas.malhotra@finloanpro.com', '+91-9810022002', 'Loan Officer', '2021-08-14'),
(6, 3, 'Kavita Menon', 'kavita.menon@finloanpro.com', '+91-9845033001', 'Branch Manager', '2020-07-01'),
(7, 3, 'Arun Joseph', 'arun.joseph@finloanpro.com', '+91-9845033002', 'Loan Officer', '2022-04-18'),
(8, 4, 'Suresh Reddy', 'suresh.reddy@finloanpro.com', '+91-9849044001', 'Loan Officer', '2021-02-28'),
(9, 5, 'Pooja Kulkarni', 'pooja.kulkarni@finloanpro.com', '+91-9822055001', 'Credit Analyst', '2022-09-12'),
(10, 6, 'Karthik Subramanian', 'karthik.s@finloanpro.com', '+91-9840066001', 'Operations Executive', '2023-03-01')
ON CONFLICT (employee_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. SEED: CREDIT_POLICIES
-- ----------------------------------------------------------------------------
INSERT INTO credit_policies (policy_id, policy_name, loan_type, minimum_income, minimum_credit_score, minimum_age, maximum_age, minimum_interest_rate, maximum_interest_rate, maximum_loan_amount, maximum_tenure_months, is_active) VALUES
(1, 'Prime Home Loan Advantage', 'Home', 35000, 750, 23, 65, 8.50, 11.50, 10000000.00, 360, TRUE),
(2, 'Standard Home Loan Regular', 'Home', 25000, 680, 21, 65, 9.25, 12.75, 7500000.00, 300, TRUE),
(3, 'Express Personal Loan Elite', 'Personal', 30000, 720, 21, 58, 10.50, 16.00, 1500000.00, 60, TRUE),
(4, 'Affordable Personal Loan Flexi', 'Personal', 18000, 650, 21, 60, 12.75, 19.50, 800000.00, 48, TRUE),
(5, 'Smart Auto Loan FastTrack', 'Auto', 22000, 700, 21, 65, 8.75, 12.00, 2500000.00, 84, TRUE),
(6, 'MSME Business Growth Credit', 'Business', 50000, 700, 25, 68, 11.75, 17.50, 5000000.00, 120, TRUE)
ON CONFLICT (policy_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. SEED: CUSTOMERS
-- ----------------------------------------------------------------------------
INSERT INTO customers (customer_id, first_name, last_name, email, phone, date_of_birth, gender, pan_number, address, city, state, pincode, monthly_income, employment_type, credit_score) VALUES
(1, 'Aarav', 'Sharma', 'aarav.sharma@example.com', '+91-9820111111', '1988-04-12', 'Male', 'ABCDE1234F', 'Flat 402, Lotus Towers, Andheri West', 'Mumbai', 'Maharashtra', '400053', 95000.00, 'Salaried', 780),
(2, 'Diya', 'Patel', 'diya.patel@example.com', '+91-9820222222', '1992-09-25', 'Female', 'BCDEF2345G', '12 Nilgiri Hills, Satellite', 'Ahmedabad', 'Gujarat', '380015', 72000.00, 'Salaried', 740),
(3, 'Rohan', 'Iyer', 'rohan.iyer@example.com', '+91-9820333333', '1985-01-18', 'Male', 'CDEFG3456H', 'Plot 88, Anna Salai', 'Chennai', 'Tamil Nadu', '600002', 125000.00, 'Salaried', 810),
(4, 'Ananya', 'Deshmukh', 'ananya.deshmukh@example.com', '+91-9820444444', '1990-11-30', 'Female', 'DEFGH4567I', 'B-104 Prabhat Road, Erandwane', 'Pune', 'Maharashtra', '411004', 68000.00, 'Self-Employed', 710),
(5, 'Kunal', 'Mehta', 'kunal.mehta@example.com', '+91-9820555555', '1983-07-08', 'Male', 'EFGHI5678J', '55 Marine Drive, Churchgate', 'Mumbai', 'Maharashtra', '400020', 210000.00, 'Business Owner', 765),
(6, 'Sneha', 'Reddy', 'sneha.reddy@example.com', '+91-9820666666', '1994-03-14', 'Female', 'FGHIJ6789K', 'Road No 36, Jubilee Hills', 'Hyderabad', 'Telangana', '500033', 88000.00, 'Salaried', 755),
(7, 'Vikram', 'Singh', 'vikram.singh@example.com', '+91-9820777777', '1979-12-05', 'Male', 'GHIJK7890L', 'Flat 11, Golf Links', 'New Delhi', 'Delhi', '110003', 180000.00, 'Salaried', 790),
(8, 'Tanvi', 'Joshi', 'tanvi.joshi@example.com', '+91-9820888888', '1993-06-22', 'Female', 'HIJKL8901M', '34 MG Road, Camp', 'Pune', 'Maharashtra', '411001', 54000.00, 'Salaried', 690),
(9, 'Manish', 'Gupta', 'manish.gupta@example.com', '+91-9820999999', '1987-08-19', 'Male', 'IJKLM9012N', '78 Sector 15', 'Noida', 'Uttar Pradesh', '201301', 82000.00, 'Salaried', 725),
(10, 'Neha', 'Bansal', 'neha.bansal@example.com', '+91-9821000001', '1991-05-17', 'Female', 'JKLMN0123O', '202 Defence Colony', 'New Delhi', 'Delhi', '110024', 98000.00, 'Salaried', 770),
(11, 'Aditya', 'Chopra', 'aditya.chopra@example.com', '+91-9821000002', '1986-10-11', 'Male', 'KLMNO1234P', '8th Main, Indiranagar', 'Bengaluru', 'Karnataka', '560038', 140000.00, 'Salaried', 805),
(12, 'Pooja', 'Saxena', 'pooja.saxena@example.com', '+91-9821000003', '1995-02-28', 'Female', 'LMNOP2345Q', 'B-303 Malviya Nagar', 'Jaipur', 'Rajasthan', '302017', 42000.00, 'Salaried', 660),
(13, 'Sanjay', 'Pillai', 'sanjay.pillai@example.com', '+91-9821000004', '1982-04-03', 'Male', 'MNOPQ3456R', 'Kadavanthra Junction', 'Kochi', 'Kerala', '682020', 115000.00, 'Business Owner', 735),
(14, 'Ritu', 'Agarwal', 'ritu.agarwal@example.com', '+91-9821000005', '1989-12-15', 'Female', 'NOPQR4567S', 'Park Street Area', 'Kolkata', 'West Bengal', '700016', 76000.00, 'Salaried', 715),
(15, 'Gaurav', 'Nanda', 'gaurav.nanda@example.com', '+91-9821000006', '1984-09-09', 'Male', 'OPQRS5678T', 'Sector 9', 'Chandigarh', 'Chandigarh', '160009', 165000.00, 'Business Owner', 780),
(16, 'Ishita', 'Sen', 'ishita.sen@example.com', '+91-9821000007', '1996-07-21', 'Female', 'PQRST6789U', 'Salt Lake Sector V', 'Kolkata', 'West Bengal', '700091', 48000.00, 'Salaried', 685),
(17, 'Karthik', 'Rao', 'karthik.rao@example.com', '+91-9821000008', '1988-02-14', 'Male', 'QRSTU7890V', 'Banjara Hills Road 12', 'Hyderabad', 'Telangana', '500034', 135000.00, 'Salaried', 795),
(18, 'Meera', 'Kulkarni', 'meera.kulkarni@example.com', '+91-9821000009', '1990-08-05', 'Female', 'RSTUV8901W', 'Aundh Ravet Road', 'Pune', 'Maharashtra', '411007', 85000.00, 'Salaried', 745),
(19, 'Nikhil', 'Bhatia', 'nikhil.bhatia@example.com', '+91-9821000010', '1985-06-18', 'Male', 'STUVW9012X', 'Cyber City Phase 2', 'Gurugram', 'Haryana', '122002', 190000.00, 'Salaried', 820),
(20, 'Divya', 'Nair', 'divya.nair@example.com', '+91-9821000011', '1992-11-23', 'Female', 'TUVWX0123Y', 'Panampilly Nagar', 'Kochi', 'Kerala', '682036', 62000.00, 'Salaried', 705),
(21, 'Rahul', 'Verma', 'rahul.verma@example.com', '+91-9821000012', '1987-03-31', 'Male', 'UVWXY1234Z', 'Gomti Nagar Phase 1', 'Lucknow', 'Uttar Pradesh', '226010', 92000.00, 'Salaried', 750),
(22, 'Shweta', 'Tiwari', 'shweta.tiwari@example.com', '+91-9821000013', '1993-01-19', 'Female', 'VWXYZ2345A', 'Arera Colony E-7', 'Bhopal', 'Madhya Pradesh', '462016', 51000.00, 'Salaried', 675),
(23, 'Abhishek', 'Mishra', 'abhishek.mishra@example.com', '+91-9821000014', '1981-12-08', 'Male', 'WXYZA3456B', 'Civil Lines', 'Nagpur', 'Maharashtra', '440001', 145000.00, 'Business Owner', 760),
(24, 'Kavita', 'Soni', 'kavita.soni@example.com', '+91-9821000015', '1991-09-12', 'Female', 'XYZAB4567C', 'Alkapuri Main Road', 'Vadodara', 'Gujarat', '390007', 70000.00, 'Salaried', 730),
(25, 'Deepak', 'Yadav', 'deepak.yadav@example.com', '+91-9821000016', '1986-05-27', 'Male', 'YZABC5678D', 'MG Marg', 'Prayagraj', 'Uttar Pradesh', '211001', 58000.00, 'Self-Employed', 640),
(26, 'Swati', 'Pandey', 'swati.pandey@example.com', '+91-9821000017', '1994-10-04', 'Female', 'ZABCD6789E', 'Kankarbagh Colony', 'Patna', 'Bihar', '800020', 46000.00, 'Salaried', 695),
(27, 'Harish', 'Gowda', 'harish.gowda@example.com', '+91-9821000018', '1983-08-22', 'Male', 'ABCDE2345A', 'Jayalakshmipuram', 'Mysuru', 'Karnataka', '570012', 105000.00, 'Salaried', 775),
(28, 'Prerna', 'Kapoor', 'prerna.kapoor@example.com', '+91-9821000019', '1995-04-16', 'Female', 'BCDEF3456B', 'Mall Road', 'Shimla', 'Himachal Pradesh', '171001', 39000.00, 'Salaried', 655),
(29, 'Tarun', 'Bhalla', 'tarun.bhalla@example.com', '+91-9821000020', '1980-02-09', 'Male', 'CDEFG4567C', 'Ranjit Avenue B Block', 'Amritsar', 'Punjab', '143001', 175000.00, 'Business Owner', 785),
(30, 'Simran', 'Kaur', 'simran.kaur@example.com', '+91-9821000021', '1992-06-30', 'Female', 'DEFGH5678D', 'Model Town', 'Ludhiana', 'Punjab', '141002', 84000.00, 'Salaried', 740),
(31, 'Vivek', 'Chauhan', 'vivek.chauhan@example.com', '+91-9821000022', '1989-01-25', 'Male', 'EFGHI6789E', 'Rajpur Road', 'Dehradun', 'Uttarakhand', '248001', 93000.00, 'Salaried', 760),
(32, 'Pallavi', 'Menon', 'pallavi.menon@example.com', '+91-9821000023', '1993-07-14', 'Female', 'FGHIJ7890F', 'West Hill', 'Kozhikode', 'Kerala', '673005', 64000.00, 'Salaried', 720),
(33, 'Sachin', 'Tendulkar', 'sachin.t@example.com', '+91-9821000024', '1975-04-24', 'Male', 'GHIJK8901G', 'Bandra West Peri Road', 'Mumbai', 'Maharashtra', '400050', 500000.00, 'Business Owner', 850),
(34, 'Anuradha', 'Roy', 'anuradha.roy@example.com', '+91-9821000025', '1988-11-19', 'Female', 'HIJKL9012H', 'Ballygunge Circular Road', 'Kolkata', 'West Bengal', '700019', 110000.00, 'Salaried', 790),
(35, 'Chetan', 'Bhagat', 'chetan.b@example.com', '+91-9821000026', '1978-04-22', 'Male', 'IJKLM0123I', 'Hiranandani Gardens, Powai', 'Mumbai', 'Maharashtra', '400076', 320000.00, 'Self-Employed', 815)
ON CONFLICT (customer_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. SEED: APPLICATIONS
-- ----------------------------------------------------------------------------
INSERT INTO applications (application_id, customer_id, branch_id, employee_id, policy_id, loan_type, requested_amount, requested_tenure_months, purpose, application_date, status, rejection_reason) VALUES
(1, 1, 1, 2, 1, 'Home', 4500000.00, 240, 'Purchase of 3BHK flat in Andheri', '2023-01-10', 'Approved', NULL),
(2, 2, 1, 2, 3, 'Personal', 500000.00, 36, 'Home renovation and modular kitchen', '2023-01-15', 'Approved', NULL),
(3, 3, 6, 10, 1, 'Home', 6000000.00, 240, 'Constructing residential villa', '2023-01-20', 'Approved', NULL),
(4, 4, 5, 9, 5, 'Auto', 800000.00, 60, 'Purchasing electric SUV for family', '2023-02-01', 'Approved', NULL),
(5, 5, 1, 3, 6, 'Business', 3500000.00, 84, 'Expanding manufacturing inventory', '2023-02-10', 'Approved', NULL),
(6, 6, 4, 8, 3, 'Personal', 750000.00, 48, 'Higher education abroad tuition', '2023-02-15', 'Approved', NULL),
(7, 7, 2, 5, 1, 'Home', 8500000.00, 300, 'Luxury apartment acquisition', '2023-03-01', 'Approved', NULL),
(8, 8, 5, 9, 4, 'Personal', 300000.00, 24, 'Emergency medical procedure', '2023-03-12', 'Approved', NULL),
(9, 9, 2, 5, 5, 'Auto', 1200000.00, 60, 'Premium sedan purchase', '2023-03-20', 'Approved', NULL),
(10, 10, 2, 4, 3, 'Personal', 600000.00, 36, 'Wedding preparations and venue', '2023-04-05', 'Approved', NULL),
(11, 11, 3, 7, 1, 'Home', 7000000.00, 240, 'Plot and home construction', '2023-04-18', 'Approved', NULL),
(12, 12, 2, 5, 4, 'Personal', 400000.00, 36, 'Debt consolidation', '2023-05-02', 'Under_Review', NULL),
(13, 13, 6, 10, 6, 'Business', 2500000.00, 60, 'Working capital for logistics firm', '2023-05-15', 'Approved', NULL),
(14, 14, 2, 5, 2, 'Home', 3200000.00, 180, 'Apartment purchase in Kolkata', '2023-06-01', 'Approved', NULL),
(15, 15, 2, 4, 6, 'Business', 4200000.00, 96, 'Machinery upgrade for packaging', '2023-06-10', 'Approved', NULL),
(16, 16, 2, 5, 4, 'Personal', 250000.00, 24, 'Skill certification training program', '2023-06-25', 'Approved', NULL),
(17, 17, 4, 8, 1, 'Home', 5500000.00, 240, 'Gated community duplex', '2023-07-08', 'Approved', NULL),
(18, 18, 5, 9, 5, 'Auto', 950000.00, 60, 'Compact hatchback for commuting', '2023-07-22', 'Approved', NULL),
(19, 19, 2, 5, 1, 'Home', 9500000.00, 360, 'Penthouse in Golf Course Ext Road', '2023-08-05', 'Approved', NULL),
(20, 20, 6, 10, 3, 'Personal', 450000.00, 36, 'Interior furnishing and appliances', '2023-08-19', 'Approved', NULL),
(21, 21, 2, 5, 2, 'Home', 4000000.00, 240, 'Independent residential floor', '2023-09-02', 'Approved', NULL),
(22, 22, 5, 9, 4, 'Personal', 350000.00, 36, 'Family emergency expenses', '2023-09-15', 'Under_Review', NULL),
(23, 23, 1, 3, 6, 'Business', 3000000.00, 72, 'Distribution network expansion', '2023-10-01', 'Approved', NULL),
(24, 24, 1, 2, 5, 'Auto', 700000.00, 48, 'Family transport vehicle', '2023-10-18', 'Approved', NULL),
(25, 25, 2, 5, 4, 'Personal', 500000.00, 36, 'Commercial equipment setup', '2023-11-05', 'Rejected', 'Credit score 640 is below minimum policy requirement of 650.'),
(26, 26, 2, 5, 4, 'Personal', 200000.00, 24, 'Professional software licenses', '2023-11-20', 'Approved', NULL),
(27, 27, 3, 7, 2, 'Home', 4800000.00, 240, 'Row house down payment', '2023-12-02', 'Approved', NULL),
(28, 28, 2, 5, 4, 'Personal', 450000.00, 36, 'Relocation and lease security', '2023-12-15', 'Rejected', 'Requested amount exceeds 10x monthly income ratio.'),
(29, 29, 2, 4, 6, 'Business', 4800000.00, 120, 'Textile export factory expansion', '2024-01-08', 'Approved', NULL),
(30, 30, 2, 5, 3, 'Personal', 800000.00, 48, 'Higher education semester fees', '2024-01-22', 'Approved', NULL),
(31, 31, 2, 5, 5, 'Auto', 1100000.00, 60, 'Commercial transport van', '2024-02-05', 'Approved', NULL),
(32, 32, 6, 10, 4, 'Personal', 300000.00, 24, 'Household emergency repairs', '2024-02-18', 'Approved', NULL),
(33, 33, 1, 1, 1, 'Home', 10000000.00, 180, 'Bungalow renovation and extension', '2024-03-01', 'Approved', NULL),
(34, 34, 2, 5, 3, 'Personal', 900000.00, 48, 'Art gallery exhibit funding', '2024-03-15', 'Approved', NULL),
(35, 35, 1, 2, 6, 'Business', 4500000.00, 84, 'Digital production house studio gear', '2024-03-28', 'Approved', NULL),
-- Applications with NULL employee_id (Pending assignment per PDF specs!)
(36, 1, 1, NULL, 3, 'Personal', 400000.00, 24, 'International business travel', '2024-04-05', 'Submitted', NULL),
(37, 2, 1, NULL, 5, 'Auto', 650000.00, 48, 'Pre-owned vehicle purchase', '2024-04-10', 'Submitted', NULL),
(38, 4, 5, NULL, 4, 'Personal', 300000.00, 36, 'Professional certification', '2024-04-12', 'Submitted', NULL),
(39, 6, 4, NULL, 3, 'Personal', 500000.00, 36, 'Family vacation and leisure', '2024-04-15', 'Submitted', NULL),
(40, 8, 5, NULL, 4, 'Personal', 250000.00, 24, 'Medical dental treatment', '2024-04-18', 'Submitted', NULL),
(41, 10, 2, NULL, 3, 'Personal', 700000.00, 48, 'Electronic consumer goods', '2024-04-20', 'Submitted', NULL),
(42, 12, 2, NULL, 4, 'Personal', 350000.00, 36, 'House painting and repair', '2024-04-22', 'Submitted', NULL),
(43, 14, 2, NULL, 2, 'Home', 2800000.00, 180, 'Ancestral home renovation', '2024-04-25', 'Submitted', NULL),
(44, 16, 2, NULL, 4, 'Personal', 200000.00, 24, 'Hardware and laptop upgrade', '2024-04-28', 'Submitted', NULL),
(45, 18, 5, NULL, 5, 'Auto', 800000.00, 60, 'Motorbike and accessory purchase', '2024-05-01', 'Submitted', NULL),
(46, 20, 6, 10, 3, 'Personal', 300000.00, 24, 'Consumer durables purchase', '2023-08-25', 'Approved', NULL),
(47, 21, 2, 5, 2, 'Home', 2500000.00, 180, 'Second home purchase', '2023-09-10', 'Approved', NULL),
(48, 23, 1, 3, 6, 'Business', 2000000.00, 60, 'Machinery maintenance', '2023-10-10', 'Approved', NULL)
ON CONFLICT (application_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. SEED: LOANS
-- ----------------------------------------------------------------------------
INSERT INTO loans (loan_id, application_id, customer_id, approved_amount, interest_rate, tenure_months, loan_start_date, loan_end_date, status, outstanding_principal) VALUES
(1, 1, 1, 4500000.00, 8.50, 240, '2023-01-15', '2043-01-15', 'Active', 4380000.00),
(2, 2, 2, 500000.00, 10.50, 36, '2023-01-20', '2026-01-20', 'Active', 350000.00),
(3, 3, 3, 6000000.00, 8.50, 240, '2023-01-25', '2043-01-25', 'Active', 5850000.00),
(4, 4, 4, 800000.00, 8.75, 60, '2023-02-05', '2028-02-05', 'Active', 670000.00),
(5, 5, 5, 3500000.00, 11.75, 84, '2023-02-15', '2030-02-15', 'Active', 3150000.00),
(6, 6, 6, 750000.00, 10.50, 48, '2023-02-20', '2027-02-20', 'Active', 590000.00),
(7, 7, 7, 8500000.00, 8.50, 300, '2023-03-05', '2048-03-05', 'Active', 8350000.00),
(8, 8, 8, 300000.00, 12.75, 24, '2023-03-18', '2025-03-18', 'Closed', 0.00),
(9, 9, 9, 1200000.00, 8.75, 60, '2023-03-25', '2028-03-25', 'Active', 1010000.00),
(10, 10, 10, 600000.00, 10.50, 36, '2023-04-10', '2026-04-10', 'Active', 440000.00),
(11, 11, 11, 7000000.00, 8.50, 240, '2023-04-22', '2043-04-22', 'Active', 6840000.00),
(12, 13, 13, 2500000.00, 11.75, 60, '2023-05-20', '2028-05-20', 'Active', 2120000.00),
(13, 14, 14, 3200000.00, 9.25, 180, '2023-06-05', '2038-06-05', 'Active', 3100000.00),
(14, 15, 15, 4200000.00, 11.75, 96, '2023-06-15', '2031-06-15', 'Active', 3900000.00),
(15, 16, 16, 250000.00, 12.75, 24, '2023-06-30', '2025-06-30', 'Active', 135000.00),
(16, 17, 17, 5500000.00, 8.50, 240, '2023-07-12', '2043-07-12', 'Active', 5390000.00),
(17, 18, 18, 950000.00, 8.75, 60, '2023-07-28', '2028-07-28', 'Active', 820000.00),
(18, 19, 19, 9500000.00, 8.50, 360, '2023-08-10', '2053-08-10', 'Active', 9420000.00),
(19, 20, 20, 450000.00, 10.50, 36, '2023-08-25', '2026-08-25', 'Active', 340000.00),
(20, 21, 21, 4000000.00, 9.25, 240, '2023-09-08', '2043-09-08', 'Active', 3920000.00),
(21, 23, 23, 3000000.00, 11.75, 72, '2023-10-08', '2029-10-08', 'Active', 2780000.00),
(22, 24, 24, 700000.00, 8.75, 48, '2023-10-25', '2027-10-25', 'Active', 580000.00),
(23, 26, 26, 200000.00, 12.75, 24, '2023-11-25', '2025-11-25', 'Active', 140000.00),
(24, 27, 27, 4800000.00, 9.25, 240, '2023-12-08', '2043-12-08', 'Active', 4750000.00),
(25, 29, 29, 4800000.00, 11.75, 120, '2024-01-15', '2034-01-15', 'Active', 4720000.00),
(26, 46, 20, 300000.00, 10.50, 24, '2023-08-28', '2025-08-28', 'Active', 210000.00),
(27, 47, 21, 2500000.00, 9.25, 180, '2023-09-15', '2038-09-15', 'Active', 2440000.00),
(28, 48, 23, 2000000.00, 11.75, 60, '2023-10-15', '2028-10-15', 'Active', 1850000.00),
(29, 30, 30, 800000.00, 10.50, 48, '2024-01-28', '2028-01-28', 'Active', 770000.00),
(30, 31, 31, 1100000.00, 8.75, 60, '2024-02-10', '2029-02-10', 'Active', 1060000.00),
(31, 33, 33, 10000000.00, 8.50, 180, '2024-03-05', '2039-03-05', 'Active', 9800000.00)
ON CONFLICT (loan_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. SEED: DISBURSEMENTS
-- ----------------------------------------------------------------------------
INSERT INTO disbursements (disbursement_id, loan_id, disbursement_amount, disbursement_date, transaction_reference, disbursement_status) VALUES
(1, 1, 4500000.00, '2023-01-15 11:30:00+05:30', 'DSB-REF-000001', 'Success'),
(2, 2, 500000.00, '2023-01-20 14:15:00+05:30', 'DSB-REF-000002', 'Success'),
(3, 3, 6000000.00, '2023-01-25 10:45:00+05:30', 'DSB-REF-000003', 'Success'),
(4, 4, 800000.00, '2023-02-05 16:20:00+05:30', 'DSB-REF-000004', 'Success'),
(5, 5, 3500000.00, '2023-02-15 12:10:00+05:30', 'DSB-REF-000005', 'Success'),
(6, 6, 750000.00, '2023-02-20 15:30:00+05:30', 'DSB-REF-000006', 'Success'),
(7, 7, 8500000.00, '2023-03-05 11:00:00+05:30', 'DSB-REF-000007', 'Success'),
(8, 8, 300000.00, '2023-03-18 13:45:00+05:30', 'DSB-REF-000008', 'Success'),
(9, 9, 1200000.00, '2023-03-25 14:00:00+05:30', 'DSB-REF-000009', 'Success'),
(10, 10, 600000.00, '2023-04-10 10:15:00+05:30', 'DSB-REF-000010', 'Success'),
(11, 11, 7000000.00, '2023-04-22 12:30:00+05:30', 'DSB-REF-000011', 'Success'),
(12, 12, 2500000.00, '2023-05-20 11:45:00+05:30', 'DSB-REF-000012', 'Success'),
(13, 13, 3200000.00, '2023-06-05 16:00:00+05:30', 'DSB-REF-000013', 'Success'),
(14, 14, 4200000.00, '2023-06-15 10:50:00+05:30', 'DSB-REF-000014', 'Success'),
(15, 15, 250000.00, '2023-06-30 14:20:00+05:30', 'DSB-REF-000015', 'Success'),
(16, 16, 5500000.00, '2023-07-12 11:15:00+05:30', 'DSB-REF-000016', 'Success'),
(17, 17, 950000.00, '2023-07-28 15:40:00+05:30', 'DSB-REF-000017', 'Success'),
(18, 18, 9500000.00, '2023-08-10 12:00:00+05:30', 'DSB-REF-000018', 'Success'),
(19, 19, 450000.00, '2023-08-25 16:30:00+05:30', 'DSB-REF-000019', 'Success'),
(20, 20, 4000000.00, '2023-09-08 10:30:00+05:30', 'DSB-REF-000020', 'Success'),
(21, 21, 3000000.00, '2023-10-08 11:20:00+05:30', 'DSB-REF-000021', 'Success'),
(22, 22, 700000.00, '2023-10-25 14:10:00+05:30', 'DSB-REF-000022', 'Success'),
(23, 23, 200000.00, '2023-11-25 15:00:00+05:30', 'DSB-REF-000023', 'Success'),
(24, 24, 4800000.00, '2023-12-08 11:50:00+05:30', 'DSB-REF-000024', 'Success'),
(25, 25, 4800000.00, '2024-01-15 12:40:00+05:30', 'DSB-REF-000025', 'Success'),
(26, 26, 300000.00, '2023-08-28 10:10:00+05:30', 'DSB-REF-000026', 'Success'),
(27, 27, 2500000.00, '2023-09-15 13:00:00+05:30', 'DSB-REF-000027', 'Success'),
(28, 28, 2000000.00, '2023-10-15 14:45:00+05:30', 'DSB-REF-000028', 'Success'),
(29, 29, 800000.00, '2024-01-28 11:30:00+05:30', 'DSB-REF-000029', 'Success'),
(30, 30, 1100000.00, '2024-02-10 12:15:00+05:30', 'DSB-REF-000030', 'Success'),
(31, 31, 10000000.00, '2024-03-05 10:00:00+05:30', 'DSB-REF-000031', 'Success')
ON CONFLICT (disbursement_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 8. SEED: EMI_SCHEDULE
-- ----------------------------------------------------------------------------
INSERT INTO emi_schedule (emi_id, loan_id, installment_number, due_date, principal_amount, interest_amount, total_emi, paid_amount, status, paid_at) VALUES
(1, 2, 1, '2023-02-20', 11876.22, 4375.00, 16251.22, 16251.22, 'Paid', '2023-02-19 14:22:00+05:30'),
(2, 2, 2, '2023-03-20', 11980.14, 4271.08, 16251.22, 16251.22, 'Paid', '2023-03-18 10:15:00+05:30'),
(3, 2, 3, '2023-04-20', 12084.97, 4166.25, 16251.22, 16251.22, 'Paid', '2023-04-20 18:45:00+05:30'),
(4, 2, 4, '2023-05-20', 12190.71, 4060.51, 16251.22, 16251.22, 'Paid', '2023-05-19 11:30:00+05:30'),
(5, 2, 5, '2023-06-20', 12297.38, 3953.84, 16251.22, 16251.22, 'Paid', '2023-06-20 16:10:00+05:30'),
(6, 2, 6, '2023-07-20', 12404.98, 3846.24, 16251.22, 16251.22, 'Paid', '2023-07-20 12:05:00+05:30'),
(7, 2, 7, '2023-08-20', 12513.52, 3737.70, 16251.22, 16251.22, 'Paid', '2023-08-19 19:20:00+05:30'),
(8, 2, 8, '2023-09-20', 12623.01, 3628.21, 16251.22, 16251.22, 'Paid', '2023-09-20 14:40:00+05:30'),
(9, 2, 9, '2023-10-20', 12733.46, 3517.76, 16251.22, 16251.22, 'Paid', '2023-10-18 11:15:00+05:30'),
(10, 2, 10, '2023-11-20', 12844.88, 3406.34, 16251.22, 16251.22, 'Paid', '2023-11-20 15:50:00+05:30'),
(11, 2, 11, '2023-12-20', 12957.27, 3293.95, 16251.22, 16251.22, 'Paid', '2023-12-20 09:30:00+05:30'),
(12, 2, 12, '2024-01-20', 13070.65, 3180.57, 16251.22, 16251.22, 'Paid', '2024-01-19 13:45:00+05:30'),
(13, 2, 13, '2024-02-20', 13185.02, 3066.20, 16251.22, 16251.22, 'Paid', '2024-02-20 17:15:00+05:30'),
(14, 2, 14, '2024-03-20', 13300.39, 2950.83, 16251.22, 0.00, 'Overdue', NULL),
(15, 2, 15, '2024-04-20', 13416.77, 2834.45, 16251.22, 0.00, 'Pending', NULL),
(16, 2, 16, '2024-05-20', 13534.17, 2717.05, 16251.22, 0.00, 'Pending', NULL),
-- Loan 1 (Home Loan) Installments
(17, 1, 1, '2023-02-15', 7183.42, 31875.00, 39058.42, 39058.42, 'Paid', '2023-02-15 10:00:00+05:30'),
(18, 1, 2, '2023-03-15', 7234.30, 31824.12, 39058.42, 39058.42, 'Paid', '2023-03-15 11:20:00+05:30'),
(19, 1, 3, '2023-04-15', 7285.54, 31772.88, 39058.42, 39058.42, 'Paid', '2023-04-14 16:30:00+05:30'),
(20, 1, 4, '2023-05-15', 7337.15, 31721.27, 39058.42, 39058.42, 'Paid', '2023-05-15 09:45:00+05:30'),
(21, 1, 5, '2023-06-15', 7389.14, 31669.28, 39058.42, 39058.42, 'Paid', '2023-06-15 14:15:00+05:30'),
(22, 1, 6, '2023-07-15', 7441.48, 31616.94, 39058.42, 39058.42, 'Paid', '2023-07-14 18:00:00+05:30'),
(23, 1, 7, '2023-08-15', 7494.19, 31564.23, 39058.42, 39058.42, 'Paid', '2023-08-15 12:10:00+05:30'),
(24, 1, 8, '2023-09-15', 7547.27, 31511.15, 39058.42, 39058.42, 'Paid', '2023-09-15 15:40:00+05:30'),
(25, 1, 9, '2023-10-15', 7600.73, 31457.69, 39058.42, 39058.42, 'Paid', '2023-10-15 10:25:00+05:30'),
(26, 1, 10, '2023-11-15', 7654.57, 31403.85, 39058.42, 39058.42, 'Paid', '2023-11-14 17:30:00+05:30'),
(27, 1, 11, '2023-12-15', 7708.79, 31349.63, 39058.42, 39058.42, 'Paid', '2023-12-15 11:55:00+05:30'),
(28, 1, 12, '2024-01-15', 7763.39, 31295.03, 39058.42, 39058.42, 'Paid', '2024-01-15 14:50:00+05:30'),
(29, 1, 13, '2024-02-15', 7818.38, 31240.04, 39058.42, 39058.42, 'Paid', '2024-02-15 16:40:00+05:30'),
(30, 1, 14, '2024-03-15', 7873.76, 31184.66, 39058.42, 0.00, 'Overdue', NULL),
(31, 1, 15, '2024-04-15', 7929.53, 31128.89, 39058.42, 0.00, 'Pending', NULL),
-- Loan 4 (Auto Loan) Installments
(32, 4, 1, '2023-03-05', 10672.48, 5833.33, 16505.81, 16505.81, 'Paid', '2023-03-05 13:20:00+05:30'),
(33, 4, 2, '2023-04-05', 10750.28, 5755.53, 16505.81, 16505.81, 'Paid', '2023-04-05 10:15:00+05:30'),
(34, 4, 3, '2023-05-05', 10828.67, 5677.14, 16505.81, 16505.81, 'Paid', '2023-05-04 15:45:00+05:30'),
(35, 4, 4, '2023-06-05', 10907.66, 5598.15, 16505.81, 16505.81, 'Paid', '2023-06-05 11:30:00+05:30'),
(36, 4, 5, '2023-07-05', 10987.26, 5518.55, 16505.81, 16505.81, 'Paid', '2023-07-05 14:00:00+05:30'),
(37, 4, 6, '2023-08-05', 11067.45, 5438.36, 16505.81, 16505.81, 'Paid', '2023-08-04 18:25:00+05:30'),
(38, 4, 7, '2023-09-05', 11148.27, 5357.54, 16505.81, 16505.81, 'Paid', '2023-09-05 09:50:00+05:30'),
(39, 4, 8, '2023-10-05', 11229.69, 5276.12, 16505.81, 16505.81, 'Paid', '2023-10-05 16:15:00+05:30'),
(40, 4, 9, '2023-11-05', 11311.74, 5194.07, 16505.81, 16505.81, 'Paid', '2023-11-04 12:40:00+05:30'),
(41, 4, 10, '2023-12-05', 11394.40, 5111.41, 16505.81, 16505.81, 'Paid', '2023-12-05 15:10:00+05:30'),
(42, 4, 11, '2024-01-05', 11477.69, 5028.12, 16505.81, 16505.81, 'Paid', '2024-01-05 10:35:00+05:30'),
(43, 4, 12, '2024-02-05', 11561.60, 4944.21, 16505.81, 16505.81, 'Paid', '2024-02-05 17:00:00+05:30'),
(44, 4, 13, '2024-03-05', 11646.14, 4859.67, 16505.81, 0.00, 'Overdue', NULL),
(45, 4, 14, '2024-04-05', 11731.32, 4774.49, 16505.81, 0.00, 'Pending', NULL),
-- Loan 8 (Closed Personal Loan)
(46, 8, 1, '2023-04-18', 10972.18, 3187.50, 14159.68, 14159.68, 'Paid', '2023-04-18 11:20:00+05:30'),
(47, 8, 2, '2023-05-18', 11088.76, 3070.92, 14159.68, 14159.68, 'Paid', '2023-05-18 14:10:00+05:30'),
(48, 8, 3, '2023-06-18', 11206.58, 2953.10, 14159.68, 14159.68, 'Paid', '2023-06-17 16:45:00+05:30')
ON CONFLICT (emi_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 9. SEED: PAYMENTS
-- ----------------------------------------------------------------------------
-- Note: Includes regular EMI payments, plus payments with emi_id = NULL (Prepayments/Partial adjustments)
INSERT INTO payments (payment_id, loan_id, emi_id, transaction_reference, payment_amount, payment_date, payment_method, payment_status) VALUES
(1, 2, 1, 'TXN-UPI-20230219-001', 16251.22, '2023-02-19 14:22:00+05:30', 'UPI', 'Success'),
(2, 2, 2, 'TXN-NB-20230318-002', 16251.22, '2023-03-18 10:15:00+05:30', 'NetBanking', 'Success'),
(3, 2, 3, 'TXN-AD-20230420-003', 16251.22, '2023-04-20 18:45:00+05:30', 'AutoDebit', 'Success'),
(4, 2, 4, 'TXN-UPI-20230519-004', 16251.22, '2023-05-19 11:30:00+05:30', 'UPI', 'Success'),
(5, 2, 5, 'TXN-NB-20230620-005', 16251.22, '2023-06-20 16:10:00+05:30', 'NetBanking', 'Success'),
(6, 2, 6, 'TXN-AD-20230720-006', 16251.22, '2023-07-20 12:05:00+05:30', 'AutoDebit', 'Success'),
(7, 2, 7, 'TXN-UPI-20230819-007', 16251.22, '2023-08-19 19:20:00+05:30', 'UPI', 'Success'),
(8, 2, 8, 'TXN-NB-20230920-008', 16251.22, '2023-09-20 14:40:00+05:30', 'NetBanking', 'Success'),
(9, 2, 9, 'TXN-AD-20231018-009', 16251.22, '2023-10-18 11:15:00+05:30', 'AutoDebit', 'Success'),
(10, 2, 10, 'TXN-UPI-20231120-010', 16251.22, '2023-11-20 15:50:00+05:30', 'UPI', 'Success'),
(11, 2, 11, 'TXN-NB-20231220-011', 16251.22, '2023-12-20 09:30:00+05:30', 'NetBanking', 'Success'),
(12, 2, 12, 'TXN-AD-20240119-012', 16251.22, '2024-01-19 13:45:00+05:30', 'AutoDebit', 'Success'),
(13, 2, 13, 'TXN-UPI-20240220-013', 16251.22, '2024-02-20 17:15:00+05:30', 'UPI', 'Success'),
(14, 1, 17, 'TXN-NB-20230215-014', 39058.42, '2023-02-15 10:00:00+05:30', 'NetBanking', 'Success'),
(15, 1, 18, 'TXN-AD-20230315-015', 39058.42, '2023-03-15 11:20:00+05:30', 'AutoDebit', 'Success'),
(16, 1, 19, 'TXN-UPI-20230414-016', 39058.42, '2023-04-14 16:30:00+05:30', 'UPI', 'Success'),
(17, 1, 20, 'TXN-NB-20230515-017', 39058.42, '2023-05-15 09:45:00+05:30', 'NetBanking', 'Success'),
(18, 1, 21, 'TXN-AD-20230615-018', 39058.42, '2023-06-15 14:15:00+05:30', 'AutoDebit', 'Success'),
(19, 1, 22, 'TXN-UPI-20230714-019', 39058.42, '2023-07-14 18:00:00+05:30', 'UPI', 'Success'),
(20, 1, 23, 'TXN-NB-20230815-020', 39058.42, '2023-08-15 12:10:00+05:30', 'NetBanking', 'Success'),
(21, 1, 24, 'TXN-AD-20230915-021', 39058.42, '2023-09-15 15:40:00+05:30', 'AutoDebit', 'Success'),
(22, 1, 25, 'TXN-UPI-20231015-022', 39058.42, '2023-10-15 10:25:00+05:30', 'UPI', 'Success'),
(23, 1, 26, 'TXN-NB-20231114-023', 39058.42, '2023-11-14 17:30:00+05:30', 'NetBanking', 'Success'),
(24, 1, 27, 'TXN-AD-20231215-024', 39058.42, '2023-12-15 11:55:00+05:30', 'AutoDebit', 'Success'),
(25, 1, 28, 'TXN-UPI-20240115-025', 39058.42, '2024-01-15 14:50:00+05:30', 'UPI', 'Success'),
(26, 1, 29, 'TXN-NB-20240215-026', 39058.42, '2024-02-15 16:40:00+05:30', 'NetBanking', 'Success'),
(27, 4, 32, 'TXN-UPI-20230305-027', 16505.81, '2023-03-05 13:20:00+05:30', 'UPI', 'Success'),
(28, 4, 33, 'TXN-AD-20230405-028', 16505.81, '2023-04-05 10:15:00+05:30', 'AutoDebit', 'Success'),
(29, 4, 34, 'TXN-NB-20230504-029', 16505.81, '2023-05-04 15:45:00+05:30', 'NetBanking', 'Success'),
(30, 4, 35, 'TXN-UPI-20230605-030', 16505.81, '2023-06-05 11:30:00+05:30', 'UPI', 'Success'),
(31, 4, 36, 'TXN-AD-20230705-031', 16505.81, '2023-07-05 14:00:00+05:30', 'AutoDebit', 'Success'),
(32, 4, 37, 'TXN-NB-20230804-032', 16505.81, '2023-08-04 18:25:00+05:30', 'NetBanking', 'Success'),
-- Partial prepayment / lumpsum payment with NULL emi_id (As defined on PDF page 4 & 7!)
(33, 1, NULL, 'TXN-LUMP-20230825-033', 100000.00, '2023-08-25 15:00:00+05:30', 'NetBanking', 'Success'),
(34, 5, NULL, 'TXN-LUMP-20231110-034', 250000.00, '2023-11-10 11:30:00+05:30', 'NetBanking', 'Success'),
(35, 7, NULL, 'TXN-LUMP-20231201-035', 500000.00, '2023-12-01 16:45:00+05:30', 'NetBanking', 'Success')
ON CONFLICT (payment_id) DO NOTHING;

-- Reset sequences to max IDs
SELECT setval('branches_branch_id_seq', (SELECT COALESCE(MAX(branch_id), 1) FROM branches));
SELECT setval('employees_employee_id_seq', (SELECT COALESCE(MAX(employee_id), 1) FROM employees));
SELECT setval('credit_policies_policy_id_seq', (SELECT COALESCE(MAX(policy_id), 1) FROM credit_policies));
SELECT setval('customers_customer_id_seq', (SELECT COALESCE(MAX(customer_id), 1) FROM customers));
SELECT setval('applications_application_id_seq', (SELECT COALESCE(MAX(application_id), 1) FROM applications));
SELECT setval('loans_loan_id_seq', (SELECT COALESCE(MAX(loan_id), 1) FROM loans));
SELECT setval('disbursements_disbursement_id_seq', (SELECT COALESCE(MAX(disbursement_id), 1) FROM disbursements));
SELECT setval('emi_schedule_emi_id_seq', (SELECT COALESCE(MAX(emi_id), 1) FROM emi_schedule));
SELECT setval('payments_payment_id_seq', (SELECT COALESCE(MAX(payment_id), 1) FROM payments));
