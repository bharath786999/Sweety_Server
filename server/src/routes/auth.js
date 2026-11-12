const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { jwtSecret } = require('../config');
const { validateSignup } = require('../utils/validate');
const { asyncHandler } = require('../middleware/errors');

const router = express.Router();
const sign = (id) => jwt.sign({ id }, jwtSecret, { expiresIn: '7d' });

router.post('/signup', asyncHandler(async (req, res) => {
  const error = validateSignup(req.body);
  if (error) return res.status(400).json({ message: error });

  const name = req.body.name.trim();
  const email = req.body.email.trim().toLowerCase();
  const hash = await bcrypt.hash(req.body.password, 10);

  try {
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hash]
    );
    res.status(201).json({ token: sign(rows[0].id), user: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    throw err;
  }
}));

router.post('/login', asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }
  res.json({ token: sign(user.id), user: { id: user.id, name: user.name, email: user.email } });
}));

module.exports = router;
