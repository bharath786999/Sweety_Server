const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errors');
const { isValidDate, todayInTz, getRange, addDays } = require('../utils/dates');
const { SLOT_KEYS } = require('../utils/constants');
const { LOW, HIGH } = require('../utils/glucose');

const router = express.Router();
router.use(auth);

const pct = (n, total) => (total ? Math.round((n / total) * 1000) / 10 : null);

function parseDate(req, res) {
  const date = req.query.date || todayInTz();
  if (!isValidDate(date)) {
    res.status(400).json({ message: 'Please select a valid date.' });
    return null;
  }
  return date;
}

// GET /api/reports?type=daily|mtd|monthly&date=YYYY-MM-DD (date defaults to today)
router.get('/', asyncHandler(async (req, res) => {
  const type = req.query.type;
  if (!['daily', 'mtd', 'monthly'].includes(type)) {
    return res.status(400).json({ message: 'type must be daily, mtd or monthly.' });
  }
  const date = parseDate(req, res);
  if (!date) return;

  const { from, to } = getRange(type, date);
  const { rows } = await pool.query(
    `SELECT MAX(value) AS highest, MIN(value) AS lowest,
            ROUND(AVG(value)::numeric, 1) AS average, COUNT(*)::int AS count,
            (COUNT(*) FILTER (WHERE value < $4))::int AS low_count,
            (COUNT(*) FILTER (WHERE value > $5))::int AS high_count
     FROM readings WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [req.userId, from, to, LOW, HIGH]
  );
  const s = rows[0];
  const inRange = s.count - s.low_count - s.high_count;
  const report = {
    type, from, to,
    count: s.count,
    highest: s.count ? s.highest : null,
    lowest: s.count ? s.lowest : null,
    average: s.count ? Number(s.average) : null,
    lowCount: s.low_count,
    highCount: s.high_count,
    inRangeCount: inRange,
    inRangePct: pct(inRange, s.count), // "time in range" share of readings
    target: { low: LOW, high: HIGH },
  };

  if (type === 'daily') {
    const list = await pool.query(
      `SELECT id, slot, value FROM readings WHERE user_id = $1 AND reading_date = $2
       ORDER BY array_position(ARRAY['${SLOT_KEYS.join("','")}'], slot::text)`,
      [req.userId, date]
    );
    report.readings = list.rows;
  }
  res.json(report);
}));

// GET /api/reports/trend?date=YYYY-MM-DD&days=30 - one point per day, for the chart.
router.get('/trend', asyncHandler(async (req, res) => {
  const date = parseDate(req, res);
  if (!date) return;
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 7), 90);
  const from = addDays(date, -(days - 1));

  const { rows } = await pool.query(
    `SELECT reading_date AS date, ROUND(AVG(value)::numeric, 1) AS avg,
            MIN(value) AS min, MAX(value) AS max, COUNT(*)::int AS count
     FROM readings WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3
     GROUP BY reading_date ORDER BY reading_date`,
    [req.userId, from, date]
  );
  res.json({
    from, to: date, target: { low: LOW, high: HIGH },
    points: rows.map((r) => ({ ...r, avg: Number(r.avg) })),
  });
}));

module.exports = router;