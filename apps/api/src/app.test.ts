import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from './app.js';

describe('CircuTrace API foundation', () => {
  it('returns service health metadata', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { status: 'ok', service: 'circutrace-api' },
    });
    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('returns a consistent 404 response for unknown routes', async () => {
    const response = await request(app).get('/api/v1/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});
