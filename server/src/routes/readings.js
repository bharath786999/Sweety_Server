const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errors');
const { validateReading } = require('../utils/validate');
const { isValidDate, todayInTz } = require('../utils/dates');
const { SLOT_LABELS, SLOT_KEYS, MAX_PER_DAY } = require('../utils/constants');

const router = express.Router();
router.use(auth);

const COLUMNS = 'id, reading_date AS date, slot, value';
const SLOT_ORDER = `array_position(ARRAY['${SLOT_KEYS.join("','")}'], slot::text)`;

// Checks DB-dependent rules. excludeId lets an edit ignore the row being edited.
async function checkLimits(userId, date, slot, excludeId = 0) {
  const { rows } = await pool.query(
    'SELECT slot FROM readings WHERE user_id = $1 AND reading_date = $2 AND id <> $3',
    [userId, date, excludeId]
  );
  if (rows.length >= MAX_PER_DAY) return `You can add only ${MAX_PER_DAY} readings per day.`;
  if (rows.some((r) => r.slot === slot)) {
    return `You already have an ${SLOT_LABELS[slot]} reading for this date.`;
  }
  return null;
}

// GET /api/readings?date=YYYY-MM-DD&page=1&limit=20
router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const params = [req.userId];
  let where = 'user_id = $1';
  if (req.query.date) {
    if (!isValidDate(req.query.date)) return res.status(400).json({ message: 'Please select a valid date.' });
    params.push(req.query.date);
    where += ' AND reading_date = $2';
  }
  const total = (await pool.query(`SELECT COUNT(*)::int AS n FROM readings WHERE ${where}`, params)).rows[0].n;
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM readings WHERE ${where}
     ORDER BY reading_date DESC, ${SLOT_ORDER}
     LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
    params
  );
  res.json({ data: rows, page, limit, total });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { error, clean } = validateReading(req.body, todayInTz());
  if (error) return res.status(400).json({ message: error });

  const limitError = await checkLimits(req.userId, clean.date, clean.slot);
  if (limitError) return res.status(409).json({ message: limitError });

  try {
    const { rows } = await pool.query(
      `INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`,
      [req.userId, clean.date, clean.slot, clean.value]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: `You already have an ${SLOT_LABELS[clean.slot]} reading for this date.` });
    }
    throw err;
  }
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(404).json({ message: 'Reading not found.' });
  const existing = await pool.query('SELECT id FROM readings WHERE id = $1 AND user_id = $2', [id, req.userId]);
  if (!existing.rows.length) return res.status(404).json({ message: 'Reading not found.' });

  const { error, clean } = validateReading(req.body, todayInTz());
  if (error) return res.status(400).json({ message: error });

  const limitError = await checkLimits(req.userId, clean.date, clean.slot, id);
  if (limitError) return res.status(409).json({ message: limitError });

  const { rows } = await pool.query(
    `UPDATE readings SET reading_date = $1, slot = $2, value = $3
     WHERE id = $4 AND user_id = $5 RETURNING ${COLUMNS}`,
    [clean.date, clean.slot, clean.value, id, req.userId]
  );
  res.json(rows[0]);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { rowCount } = await pool.query('DELETE FROM readings WHERE id = $1 AND user_id = $2', [id || 0, req.userId]);
  if (!rowCount) return res.status(404).json({ message: 'Reading not found.' });
  res.status(204).end();
}));

module.exports = router;
