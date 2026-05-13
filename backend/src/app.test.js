import request from 'supertest';
import { describe, expect, it } from '@jest/globals';
import app from './app.js';

describe('GET /api/health', () => {
  it('returns a healthy status response', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      message: 'ToolBox Manager API is running',
    });
  });
});
