const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errors');
const { isValidDate, todayInTz, getRange } = require('../utils/dates');
const { SLOT_KEYS } = require('../utils/constants');

const router = express.Router();
router.use(auth);

// GET /api/reports?type=daily|mtd|monthly&date=YYYY-MM-DD (date defaults to today)
router.get('/', asyncHandler(async (req, res) => {
  const type = req.query.type;
  if (!['daily', 'mtd', 'monthly'].includes(type)) {
    return res.status(400).json({ message: 'type must be daily, mtd or monthly.' });
  }
  const date = req.query.date || todayInTz();
  if (!isValidDate(date)) return res.status(400).json({ message: 'Please select a valid date.' });

  const { from, to } = getRange(type, date);
  const { rows } = await pool.query(
    `SELECT MAX(value) AS highest, MIN(value) AS lowest,
            ROUND(AVG(value)::numeric, 1) AS average, COUNT(*)::int AS count
     FROM readings WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [req.userId, from, to]
  );
  const s = rows[0];
  const report = {
    type, from, to,
    count: s.count,
    highest: s.count ? s.highest : null,
    lowest: s.count ? s.lowest : null,
    average: s.count ? Number(s.average) : null,
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

module.exports = router;
