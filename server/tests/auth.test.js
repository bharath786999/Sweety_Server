const request = require('supertest');
const app = require('../src/app');

describe('route protection', () => {
  test.each(['/api/readings', '/api/reports?type=daily'])('%s requires a token', async (url) => {
    const res = await request(app).get(url);
    expect(res.status).toBe(401);
  });

  test('rejects an invalid token', async () => {
    const res = await request(app).get('/api/readings').set('Authorization', 'Bearer nonsense');
    expect(res.status).toBe(401);
  });

  test('signup validates input before touching the database', async () => {
    const res = await request(app).post('/api/auth/signup').send({ name: 'A', email: 'bad', password: 'x' });
    expect(res.status).toBe(400);
  });

  test('health check', async () => {
    expect((await request(app).get('/api/health')).body).toEqual({ status: 'ok' });
  });
});
