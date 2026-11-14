// ============================================================================
// FRONTEND LOGIC & MATH TEST SUITE
// ============================================================================
// Purpose: Validates financial formulas, PAN regex, DTI assessment, and formatting.
// ============================================================================

import assert from 'assert';
import {
  computeClientEMI,
  formatCurrencyINR,
  validatePAN,
  evaluateDTI
} from '../src/utils/financialMath.js';

console.log('============================================================');
console.log('🧪 RUNNING FINLOAN PRO REACT FRONTEND TEST SUITE');
console.log('============================================================');

// Test 1: Reducing balance EMI formula
const emiResult = computeClientEMI(500000, 10.5, 36);
assert.strictEqual(emiResult.monthly_emi, 16251.22, 'Monthly EMI must equal ₹16,251.22');
assert.strictEqual(emiResult.total_payable, 585043.98, 'Total payable must equal ₹5,85,043.98');
assert.strictEqual(emiResult.total_interest, 85043.98, 'Total interest must equal ₹85,043.98');
console.log('✓ Reducing-balance EMI math verified: ₹16,251.22 / month');

// Test 2: PAN Validation
assert.strictEqual(validatePAN('ABCDE1234F'), true, 'Valid PAN should return true');
assert.strictEqual(validatePAN('abcde1234f'), true, 'Lowercase valid PAN should return true (case-insensitive check)');
assert.strictEqual(validatePAN('12345ABCDE'), false, 'Invalid format should return false');
assert.strictEqual(validatePAN('ABCDE1234'), false, 'Short PAN should return false');
assert.strictEqual(validatePAN(''), false, 'Empty PAN should return false');
console.log('✓ Indian PAN 10-character regex verification verified');

// Test 3: Currency Formatter
const formattedCurrency = formatCurrencyINR(500000);
assert.ok(formattedCurrency.includes('5,00,000'), 'Should format in Indian lakhs format');
console.log('✓ INR currency formatting verified');

// Test 4: Debt-To-Income (DTI) Assessment
const safeDti = evaluateDTI(95000, 16251.22);
assert.strictEqual(safeDti.isSafe, true, 'DTI 17.1% should be categorized as Safe');
assert.strictEqual(safeDti.statusText, 'Safe', 'Status text should be Safe');

const riskyDti = evaluateDTI(30000, 16251.22);
assert.strictEqual(riskyDti.isSafe, false, 'DTI 54.2% should be categorized as High Risk');
assert.strictEqual(riskyDti.statusText, 'High Risk', 'Status text should be High Risk');
console.log('✓ Debt-To-Income ratio evaluation verified (Safe <= 50% vs High Risk > 50%)');

console.log('============================================================');
console.log('🎉 ALL REACT FRONTEND UNIT TESTS PASSED SUCCESSFULLY!');
console.log('============================================================');
