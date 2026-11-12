const bcrypt = require('bcryptjs');
const pool = require('./pool');
const { todayInTz } = require('../utils/dates');
const { SLOT_KEYS } = require('../utils/constants');

const DEMO = { name: 'Demo Patient', email: 'demo@sweety.test', password: 'Demo@1234' };
const fmt = (d) => d.toISOString().slice(0, 10);

(async () => {
  try {
    await pool.query('DELETE FROM users WHERE email = $1', [DEMO.email]);
    const hash = await bcrypt.hash(DEMO.password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [DEMO.name, DEMO.email, hash]
    );
    const userId = rows[0].id;

    // From the 1st of last month up to today, so every report has data.
    const today = todayInTz();
    const [y, m] = today.split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 2, 1));
    const end = new Date(`${today}T00:00:00Z`);

    let count = 0;
    let i = 0;
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1), i++) {
      for (let s = 0; s < SLOT_KEYS.length; s++) {
        if ((i + s) % 7 === 0) continue; // skip a few so days differ
        const value = 85 + ((i * 37 + s * 53) % 130); // 85-214 mg/dl
        await pool.query(
          'INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2, $3, $4)',
          [userId, fmt(d), SLOT_KEYS[s], value]
        );
        count++;
      }
    }
    console.log(`Seeded ${DEMO.email} / ${DEMO.password} with ${count} readings.`);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
