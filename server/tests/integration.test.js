// Runs only when TEST_DATABASE_URL is set (a throw-away Postgres database
// with the schema applied: DATABASE_URL=$TEST_DATABASE_URL npm run db:init).
const run = process.env.TEST_DATABASE_URL ? describe : describe.skip;

run('API integration', () => {
  let request, pool, tokenA, tokenB;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    request = require('supertest')(require('../src/app'));
    pool = require('../src/db/pool');
    await pool.query('TRUNCATE users RESTART IDENTITY CASCADE');
    const a = await request.post('/api/auth/signup').send({ name: 'A', email: 'a@t.co', password: 'password1' });
    const b = await request.post('/api/auth/signup').send({ name: 'B', email: 'b@t.co', password: 'password1' });
    tokenA = a.body.token;
    tokenB = b.body.token;
  });
  afterAll(() => pool.end());

  const add = (token, body) => request.post('/api/readings').set('Authorization', `Bearer ${token}`).send(body);
  const day = '2026-01-10';

  test('stores a hashed password', async () => {
    const { rows } = await pool.query("SELECT password_hash FROM users WHERE email = 'a@t.co'");
    expect(rows[0].password_hash).not.toBe('password1');
  });

  test('rejects a duplicate slot on the same day', async () => {
    expect((await add(tokenA, { date: day, slot: 'after_lunch', value: 120 })).status).toBe(201);
    const dup = await add(tokenA, { date: day, slot: 'after_lunch', value: 130 });
    expect(dup.status).toBe(409);
    expect(dup.body.message).toBe('You already have an After lunch reading for this date.');
  });

  test('rejects a 5th reading in a day', async () => {
    for (const slot of ['morning', 'after_breakfast', 'after_dinner']) {
      await add(tokenA, { date: day, slot, value: 100 });
    }
    const res = await add(tokenA, { date: day, slot: 'morning', value: 100 });
    expect(res.body.message).toBe('You can add only 4 readings per day.');
  });

  test('daily report calculates stats', async () => {
    const res = await request.get(`/api/reports?type=daily&date=${day}`).set('Authorization', `Bearer ${tokenA}`);
    expect(res.body).toMatchObject({ count: 4, highest: 120, lowest: 100, average: 105 });
    expect(res.body.readings).toHaveLength(4);
  });

  test('time-in-range, trend and CSV export', async () => {
    await add(tokenA, { date: '2026-01-09', slot: 'after_dinner', value: 250 });
    const auth = { Authorization: `Bearer ${tokenA}` };
    const mtd = await request.get(`/api/reports?type=mtd&date=${day}`).set(auth);
    expect(mtd.body).toMatchObject({ count: 5, highCount: 1, lowCount: 0, inRangePct: 80 });
    const trend = await request.get(`/api/reports/trend?date=${day}`).set(auth);
    expect(trend.body.points).toHaveLength(2);
    expect(trend.body.points[1]).toMatchObject({ date: day, avg: 105 });
    const csv = await request.get('/api/readings/export.csv').set(auth);
    expect(csv.status).toBe(200);
    expect(csv.text.startsWith('date,slot,value_mg_dl,status')).toBe(true);
    expect(csv.text).toContain('2026-01-09,After dinner,250,high');
  });

  test('empty report returns zero count and nulls', async () => {
    const res = await request.get(`/api/reports?type=monthly&date=${day}`).set('Authorization', `Bearer ${tokenA}`);
    expect(res.body).toMatchObject({ count: 0, highest: null, lowest: null, average: null });
  });

  test("a user cannot see or delete another user's readings", async () => {
    const list = await request.get('/api/readings').set('Authorization', `Bearer ${tokenB}`);
    expect(list.body.data).toHaveLength(0);
    const { rows } = await pool.query('SELECT id FROM readings LIMIT 1');
    const del = await request.delete(`/api/readings/${rows[0].id}`).set('Authorization', `Bearer ${tokenB}`);
    expect(del.status).toBe(404);
  });
});