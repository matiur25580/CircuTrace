import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/passport.service.js', () => ({
  getPassportManagement: vi.fn(),
  getPublicPassport: vi.fn(),
  publishPassport: vi.fn(),
  revokePassport: vi.fn(),
  updatePassport: vi.fn(),
}));

import { getPublicPassport } from '../services/passport.service.js';
import { passportRouter } from '../routes/passport.routes.js';

const app = express();
app.use('/api/v1/passports', passportRouter);
app.use((error: { statusCode?: number; message?: string }, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  response.status(error.statusCode ?? 500).json({ success: false, error: { message: error.message } });
});

beforeEach(() => vi.clearAllMocks());

describe('public passport route', () => {
  it('serves the public projection without requiring an authenticated session and disables caching', async () => {
    vi.mocked(getPublicPassport).mockResolvedValue({
      passport: { status: 'published' },
      identity: { identifier: 'CT-ORG-000001', name: 'Reusable bottle' },
    });
    const response = await request(app).get('/api/v1/passports/public/opaque-slug');

    expect(response.status).toBe(200);
    expect(response.body.data.identity.name).toBe('Reusable bottle');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-robots-tag']).toBe('noindex, nofollow');
    expect(getPublicPassport).toHaveBeenCalledWith('opaque-slug');
  });

  it('keeps no-store headers when a revoked or unknown slug returns not found', async () => {
    vi.mocked(getPublicPassport).mockRejectedValue(Object.assign(new Error('Public passport was not found.'), { statusCode: 404 }));
    const response = await request(app).get('/api/v1/passports/public/revoked-slug');

    expect(response.status).toBe(404);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-robots-tag']).toBe('noindex, nofollow');
  });
});
