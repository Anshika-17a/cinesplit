const assert = require('assert');
const { isShowBookable } = require('./src/utils/showHelpers');

console.log('--- Running Tests for isShowBookable ---');

// Mock current time
const now = new Date('2026-08-25T12:00:00Z');

// Test 1: Future show
const futureShow = { start_time: new Date('2026-08-25T15:00:00Z') };
assert.strictEqual(isShowBookable(futureShow, now), true, 'Future show should be bookable');
console.log('✅ Future show test passed');

// Test 2: Past show
const pastShow = { start_time: new Date('2026-08-25T10:00:00Z') };
assert.strictEqual(isShowBookable(pastShow, now), false, 'Past show should not be bookable');
console.log('✅ Past show test passed');

// Test 3: Exactly now (edge case)
const exactlyNowShow = { start_time: new Date('2026-08-25T12:00:00Z') };
assert.strictEqual(isShowBookable(exactlyNowShow, now), false, 'Show starting exactly now should not be bookable');
console.log('✅ Exactly now test passed');

console.log('All tests passed successfully! 🎉');
