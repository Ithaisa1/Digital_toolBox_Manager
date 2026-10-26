import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import { isSameOrigin } from './cors.js';

describe('isSameOrigin', () => {
  it('compares origin host with request host', () => {
    expect(isSameOrigin('https://dexa.app', 'dexa.app')).toBe(true);
    expect(isSameOrigin('http://localhost:4100', 'localhost:4100')).toBe(true);
    expect(isSameOrigin('https://evil.com', 'dexa.app')).toBe(false);
    expect(isSameOrigin(undefined, 'dexa.app')).toBe(false);
    expect(isSameOrigin('nonsense', 'dexa.app')).toBe(false);
  });
});

describe('CORS', () => {
  it('accepts requests from the same domain (custom domain included)', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Host', 'dexa-manager.com')
      .set('Origin', 'https://dexa-manager.com');
    expect(res.status).not.toBe(500);
    expect(res.headers['access-control-allow-origin']).toBe('https://dexa-manager.com');
  });

  it('rejects unknown foreign origins', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'https://evil.example.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
