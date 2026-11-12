const { timezone } = require('../config');

const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => d.toISOString().slice(0, 10);

function isValidDate(str) {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(`${str}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && fmt(d) === str;
}

// Today's date (YYYY-MM-DD) in the app time zone (IST by default).
function todayInTz(tz = timezone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
}

// Date range for each report type, relative to the selected date.
function getRange(type, dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  switch (type) {
    case 'daily':
      return { from: dateStr, to: dateStr };
    case 'mtd':
      return { from: `${y}-${pad(m)}-01`, to: dateStr };
    case 'monthly': {
      const first = new Date(Date.UTC(y, m - 2, 1));
      const last = new Date(Date.UTC(y, m - 1, 0));
      return { from: fmt(first), to: fmt(last) };
    }
    default:
      throw new Error('Unknown report type');
  }
}

module.exports = { isValidDate, todayInTz, getRange };
