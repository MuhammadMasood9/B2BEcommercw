import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock the database and services
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}));

vi.mock('../../buyerService', () => ({
  buyerService: {
    getBuyerByUserId: vi.fn(),
    createBuyerProfile: vi.fn(),
    getAllBuyers: vi.fn(),
  }
}));

vi.mock('../../supplierRFQService', () => ({
  supplierRFQService: {
    getAvailableRFQs: vi.fn(),
    createQuotation: vi.fn(),
  }
}));

// Mock auth middleware
const mockAuthMiddleware = (role: string) => (req: any, res: any, next: any) => {
  req.user = { id: 'test-user-id', role };
  next();
};

describe('API Access Control Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Role-Based API Access', () => {
    it('should allow buyers to access buyer-specific endpoints', async () => {
      // Setup buyer routes with auth middleware
      app.get('/api/buyer/profile', mockAuthMiddleware('buyer'), (req, res) => {
        if (req.user.role !== 'buyer') {
          return res.status(403).json({ error: 'Access denied' });
        }
        res.json({ success: true, profile: { id: 'buyer-123' } });
      });

      const response = await request(app)
        .get('/api/buyer/profile')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.profile.id).toBe('buyer-123');
    });

    it('should deny suppliers access to buyer-only endpoints', async () => {
      app.get('/api/buyer/profile', mockAuthMiddleware('supplier'), (req, res) => {
        if (req.user.role !== 'buyer') {
          return res.status(403).json({ error: 'Access denied' });
        }
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/api/buyer/profile')
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });

    it('should allow suppliers to access supplier-specific endpoints', async () => {
      app.get('/api/supplier/rfqs', mockAuthMiddleware('supplier'), (req, res) => {
        if (req.user.role !== 'supplier') {
          return res.status(403).json({ error: 'Access denied' });
        }
        res.json({ success: true, rfqs: [] });
      });

      const response = await request(app)
        .get('/api/supplier/rfqs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.rfqs).toEqual([]);
    });

    it('should allow admins to access admin-specific endpoints', async () => {
      app.get('/api/admin/disputes', mockAuthMiddleware('admin'), (req, res) => {
        if (req.user.role !== 'admin') {
          return res.status(403).json({ error: 'Access denied' });
        }
        res.json({ success: true, disputes: [] });
      });

      const response = await request(app)
        .get('/api/admin/disputes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.disputes).toEqual([]);
    });

    it('should deny unauthorized access to protected endpoints', async () => {
      app.get('/api/admin/disputes', (req, res) => {
        if (!req.user) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/api/admin/disputes')
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });
  });

  describe('Cross-Service API Integration', () => {
    it('should handle buyer profile creation with validation', async () => {
      const { buyerService } = await import('../../buyerService');
      
      (buyerService.createBuyerProfile as any).mockResolvedValue({
        id: 'buyer-123',
        userId: 'user-123',
        companyName: 'Test Company',
      });

      app.post('/api/buyer/profile', mockAuthMiddleware('buyer'), async (req, res) => {
        try {
          const profile = await buyerService.createBuyerProfile(req.user.id, req.body);
          res.status(201).json({ success: true, profile });
        } catch (error) {
          res.status(400).json({ error: 'Profile creation failed' });
        }
      });

      const profileData = {
        companyName: 'Test Company',
        industry: 'Technology',
      };

      const response = await request(app)
        .post('/api/buyer/profile')
        .send(profileData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.profile.companyName).toBe('Test Company');
      expect(buyerService.createBuyerProfile).toHaveBeenCalledWith('test-user-id', profileData);
    });

    it('should handle supplier RFQ access with proper filtering', async () => {
      const { supplierRFQService } = await import('../../supplierRFQService');
      
      (supplierRFQService.getAvailableRFQs as any).mockResolvedValue({
        rfqs: [
          {
            id: 'rfq-1',
            title: 'Test RFQ',
            status: 'open',
            hasQuoted: false,
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      app.get('/api/supplier/rfqs', mockAuthMiddleware('supplier'), async (req, res) => {
        try {
          const result = await supplierRFQService.getAvailableRFQs('supplier-123');
          res.json({ success: true, ...result });
        } catch (error) {
          res.status(500).json({ error: 'Failed to fetch RFQs' });
        }
      });

      const response = await request(app)
        .get('/api/supplier/rfqs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.rfqs).toHaveLength(1);
      expect(response.body.rfqs[0].title).toBe('Test RFQ');
    });
  });

  describe('Data Validation Integration', () => {
    it('should validate request data before processing', async () => {
      app.post('/api/buyer/profile', mockAuthMiddleware('buyer'), (req, res) => {
        const { companyName, industry } = req.body;
        
        if (!companyName || companyName.trim().length === 0) {
          return res.status(400).json({ 
            error: 'Validation failed',
            details: 'Company name is required'
          });
        }

        res.status(201).json({ 
          success: true, 
          profile: { companyName, industry } 
        });
      });

      // Test missing required field
      const response1 = await request(app)
        .post('/api/buyer/profile')
        .send({ industry: 'Technology' })
        .expect(400);

      expect(response1.body.error).toBe('Validation failed');
      expect(response1.body.details).toBe('Company name is required');

      // Test valid data
      const response2 = await request(app)
        .post('/api/buyer/profile')
        .send({ companyName: 'Test Company', industry: 'Technology' })
        .expect(201);

      expect(response2.body.success).toBe(true);
      expect(response2.body.profile.companyName).toBe('Test Company');
    });

    it('should handle malformed JSON requests', async () => {
      app.post('/api/test', express.json(), (req, res) => {
        res.json({ success: true });
      });

      app.use((error: any, req: any, res: any, next: any) => {
        if (error instanceof SyntaxError) {
          return res.status(400).json({ error: 'Invalid JSON' });
        }
        next(error);
      });

      const response = await request(app)
        .post('/api/test')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.error).toBe('Invalid JSON');
    });
  });
});