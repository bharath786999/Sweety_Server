const { classify } = require('../src/utils/glucose');
const { addDays } = require('../src/utils/dates');

test('classify uses 70-180 mg/dl as the target range', () => {
  expect(classify(69)).toBe('low');
  expect(classify(70)).toBe('in_range');
  expect(classify(180)).toBe('in_range');
  expect(classify(181)).toBe('high');
});

test('addDays crosses month and year boundaries', () => {
  expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
});