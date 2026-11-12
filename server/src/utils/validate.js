const { SLOT_KEYS, MIN_VALUE, MAX_VALUE } = require('./constants');
const { isValidDate } = require('./dates');

// Validates a reading payload. Returns { error } or { clean }.
// Database-dependent rules (duplicate slot, max 4/day) live in the route.
function validateReading({ date, slot, value }, today) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return { error: 'Please enter a glucose value.' };
  }
  const num = Number(value);
  if (!Number.isInteger(num) || num < MIN_VALUE || num > MAX_VALUE) {
    return { error: `Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.` };
  }
  if (!isValidDate(date)) return { error: 'Please select a valid date.' };
  if (date > today) return { error: 'Date cannot be in the future.' };
  if (!SLOT_KEYS.includes(slot)) return { error: 'Please select a time slot.' };
  return { clean: { date, slot, value: num } };
}

function validateSignup({ name, email, password }) {
  if (!name || !String(name).trim()) return 'Please enter your name.';
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return 'Please enter a valid email.';
  if (!password || String(password).length < 8) return 'Password must be at least 8 characters.';
  return null;
}

module.exports = { validateReading, validateSignup };
