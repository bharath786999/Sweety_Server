const { getRange, isValidDate } = require('../src/utils/dates');

describe('getRange (selected date 15 Oct 2026)', () => {
  test('daily is the selected date', () => {
    expect(getRange('daily', '2026-10-15')).toEqual({ from: '2026-10-15', to: '2026-10-15' });
  });
  test('month-to-date runs from the 1st to the selected date', () => {
    expect(getRange('mtd', '2026-10-15')).toEqual({ from: '2026-10-01', to: '2026-10-15' });
  });
  test('monthly is the whole previous month', () => {
    expect(getRange('monthly', '2026-10-15')).toEqual({ from: '2026-09-01', to: '2026-09-30' });
  });
  test('monthly handles January (previous December) and leap February', () => {
    expect(getRange('monthly', '2026-01-10')).toEqual({ from: '2025-12-01', to: '2025-12-31' });
    expect(getRange('monthly', '2024-03-05')).toEqual({ from: '2024-02-01', to: '2024-02-29' });
  });
});

test('isValidDate', () => {
  expect(isValidDate('2026-10-15')).toBe(true);
  expect(isValidDate('2026-13-01')).toBe(false);
  expect(isValidDate('15-10-2026')).toBe(false);
});
