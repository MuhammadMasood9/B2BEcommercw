import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

describe('Simple API Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic API Functionality', () => {
    it('should handle GET request', async () => {
      app.get('/api/test', (req, res) => {
        res.json({ success: true, message: 'Test endpoint working' });
      });

      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Test endpoint working');
    });

    it('should handle POST request with data', async () => {
      app.post('/api/test', (req, res) => {
        const { name } = req.body;
        res.status(201).json({ success: true, data: { name } });
      });

      const response = await request(app)
        .post('/api/test')
        .send({ name: 'Test User' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test User');
    });

    it('should handle error responses', async () => {
      app.get('/api/error', (req, res) => {
        res.status(400).json({ error: 'Bad request' });
      });

      const response = await request(app)
        .get('/api/error')
        .expect(400);

      expect(response.body.error).toBe('Bad request');
    });
  });
});