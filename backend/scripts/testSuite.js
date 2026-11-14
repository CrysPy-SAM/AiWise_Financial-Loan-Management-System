// ============================================================================
// FINANCIAL SUITE UNIT & INTEGRATION TESTS
// ============================================================================

const assert = require('assert');
const { calculateEMI, generateAmortizationSchedule, evaluateDTI } = require('../services/emiService');

function runTests() {
  console.log('🧪 RUNNING FINLOAN PRO VERIFICATION TESTS...\n');

  // Test 1: EMI Calculation
  const principal = 500000;
  const annualRate = 10.5;
  const tenure = 36;
  const emi = calculateEMI(principal, annualRate, tenure);
  assert.strictEqual(emi, 16251.22, 'Monthly EMI should equal 16251.22 for 500k @ 10.5% over 36 mos');
  console.log('  ✓ calculateEMI formula test passed (₹16,251.22).');

  // Test 2: Amortization Schedule
  const schedule = generateAmortizationSchedule(principal, annualRate, tenure);
  assert.strictEqual(schedule.length, 36, 'Schedule should have exactly 36 installments');
  assert.strictEqual(schedule[0].installment_number, 1);
  assert.strictEqual(schedule[35].installment_number, 36);
  assert.strictEqual(schedule[35].remaining_balance, 0, 'Final remaining balance must equal 0.00');
  console.log('  ✓ generateAmortizationSchedule 36-month zero-balance amortization test passed.');

  // Test 3: DTI Evaluation
  const safeDti = evaluateDTI(100000, 16251.22);
  assert.strictEqual(safeDti.status, 'Safe');
  assert.strictEqual(safeDti.is_eligible, true);

  const riskDti = evaluateDTI(30000, 16251.22);
  assert.strictEqual(riskDti.status, 'High Risk');
  assert.strictEqual(riskDti.is_eligible, false);
  console.log('  ✓ evaluateDTI safe and high-risk threshold test passed.');

  // Test 4: PAN regex validation
  const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  assert.strictEqual(PAN_REGEX.test('ABCDE1234F'), true, 'Valid PAN must pass');
  assert.strictEqual(PAN_REGEX.test('WEKJF9889D'), true, 'Valid PAN must pass');
  assert.strictEqual(PAN_REGEX.test('WEKJFBWEWD'), false, 'All-letter PAN must fail');
  assert.strictEqual(PAN_REGEX.test('12345ABCDE'), false, 'Numbers first PAN must fail');
  console.log('  ✓ PAN regex validation test passed.');

  console.log('\n🎉 ALL UNIT AND FINANCIAL LOGIC TESTS PASSED SUCCESSFULLY!\n');
}

runTests();
