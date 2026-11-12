const { validateReading, validateSignup } = require('../src/utils/validate');

const TODAY = '2026-10-15';
const ok = { date: '2026-10-15', slot: 'morning', value: 110 };

describe('validateReading', () => {
  test('accepts a valid reading', () => {
    expect(validateReading(ok, TODAY).clean).toEqual(ok);
  });

  test.each([undefined, null, '', '  '])('requires a value (%p)', (value) => {
    expect(validateReading({ ...ok, value }, TODAY).error).toBe('Please enter a glucose value.');
  });

  test.each([39, 601, 100.5, 'abc', -5])('rejects out-of-range or non-integer value %p', (value) => {
    expect(validateReading({ ...ok, value }, TODAY).error).toBe('Value must be between 40 and 600 mg/dl.');
  });

  test('accepts the boundary values 40 and 600', () => {
    expect(validateReading({ ...ok, value: 40 }, TODAY).error).toBeUndefined();
    expect(validateReading({ ...ok, value: 600 }, TODAY).error).toBeUndefined();
  });

  test('rejects a future date but allows today', () => {
    expect(validateReading({ ...ok, date: '2026-10-16' }, TODAY).error).toBe('Date cannot be in the future.');
    expect(validateReading(ok, TODAY).error).toBeUndefined();
  });

  test('rejects invalid dates and slots', () => {
    expect(validateReading({ ...ok, date: '2026-02-30' }, TODAY).error).toBe('Please select a valid date.');
    expect(validateReading({ ...ok, slot: 'midnight' }, TODAY).error).toBe('Please select a time slot.');
  });
});

describe('validateSignup', () => {
  test('requires name, valid email and 8+ char password', () => {
    expect(validateSignup({ name: '', email: 'a@b.co', password: 'password1' })).toMatch(/name/i);
    expect(validateSignup({ name: 'A', email: 'nope', password: 'password1' })).toMatch(/email/i);
    expect(validateSignup({ name: 'A', email: 'a@b.co', password: 'short' })).toMatch(/8 characters/);
    expect(validateSignup({ name: 'A', email: 'a@b.co', password: 'password1' })).toBeNull();
  });
});
