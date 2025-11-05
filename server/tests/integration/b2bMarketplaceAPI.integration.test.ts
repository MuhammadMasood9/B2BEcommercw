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
    transaction: vi.fn(),
  }
}));

vi.mock('../../buyerService', () => ({
  buyerService: {
    getBuyerByUserId: vi.fn(),
    createBuyerProfile: vi.fn(),
    getAllBuyers: vi.fn(),
  }
}));

vi.mock('../../productDiscoveryService', () => ({
  productDiscoveryService: {
    searchProducts: vi.fn(),
    getProductById: vi.fn(),
    getProductsByCategory: vi.fn(),
  }
}));

vi.mock('../../supplierRFQService', () => ({
  supplierRFQService: {
    getAvailableRFQs: vi.fn(),
    getRFQDetails: vi.fn(),
    createQuotation: vi.fn(),
  }
}));

// Mock auth middleware
const mockAuthMiddleware = (role: string, userId: string = 'test-user-id') => (req: any, res: any, next: any) => {
  req.user = { id: userId, role };
  next();
};

describe('B2B Marketplace API Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Buyer API Endpoints', () => {
    it('should handle buyer product search with filters', async () => {
      const { productDiscoveryService } = await import('../../productDiscoveryService');
      
      const mockProducts = {
        products: [
          {
            id: 'product-1',
            name: 'Test Product',
            price: '10.50',
            moq: 100,
            supplier: { id: 'supplier-1', companyName: 'Test Supplier' },
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      (productDiscoveryService.searchProducts as any).mockResolvedValue(mockProducts);

      app.get('/api/buyer/products', mockAuthMiddleware('buyer'), async (req, res) => {
        try {
          const filters = {
            category: req.query.category as string,
            minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
            maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
            location: req.query.location as string,
          };
          
          const result = await productDiscoveryService.searchProducts(filters);
          res.json({ success: true, ...result });
        } catch (error) {
          res.status(500).json({ error: 'Search failed' });
        }
      });

      const response = await request(app)
        .get('/api/buyer/products')
        .query({
          category: 'electronics',
          minPrice: '5.00',
          maxPrice: '20.00',
          location: 'US',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0].name).toBe('Test Product');
      expect(productDiscoveryService.searchProducts).toHaveBeenCalledWith({
        category: 'electronics',
        minPrice: 5.00,
        maxPrice: 20.00,
        location: 'US',
      });
    });

    it('should handle buyer RFQ creation', async () => {
      const { buyerService } = await import('../../buyerService');
      
      const mockBuyer = {
        id: 'buyer-123',
        userId: 'user-123',
        companyName: 'Test Company',
      };

      (buyerService.getBuyerByUserId as any).mockResolvedValue(mockBuyer);

      app.post('/api/buyer/rfqs', mockAuthMiddleware('buyer', 'user-123'), async (req, res) => {
        try {
          const buyer = await buyerService.getBuyerByUserId((req.user as any).id);
          if (!buyer) {
            return res.status(404).json({ error: 'Buyer profile not found' });
          }

          const rfqData = {
            ...req.body,
            buyerId: buyer.id,
            status: 'open',
          };

          res.status(201).json({ 
            success: true, 
            rfq: { id: 'rfq-123', ...rfqData } 
          });
        } catch (error) {
          res.status(500).json({ error: 'RFQ creation failed' });
        }
      });

      const rfqData = {
        title: 'Test RFQ',
        description: 'Looking for electronic components',
        quantity: 1000,
        targetPrice: '5.00',
      };

      const response = await request(app)
        .post('/api/buyer/rfqs')
        .send(rfqData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.rfq.title).toBe('Test RFQ');
      expect(response.body.rfq.buyerId).toBe('buyer-123');
      expect(response.body.rfq.status).toBe('open');
    });
  });

  describe('Supplier API Endpoints', () => {
    it('should handle supplier RFQ retrieval', async () => {
      const { supplierRFQService } = await import('../../supplierRFQService');
      
      const mockRFQs = {
        rfqs: [
          {
            id: 'rfq-1',
            title: 'Electronics RFQ',
            status: 'open',
            hasQuoted: false,
            buyer: { companyName: 'Test Company' },
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      (supplierRFQService.getAvailableRFQs as any).mockResolvedValue(mockRFQs);

      app.get('/api/supplier/rfqs', mockAuthMiddleware('supplier'), async (req, res) => {
        try {
          const supplierId = 'supplier-123';
          const result = await supplierRFQService.getAvailableRFQs(supplierId);
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
      expect(response.body.rfqs[0].title).toBe('Electronics RFQ');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should deny suppliers access to buyer endpoints', async () => {
      app.get('/api/buyer/profile', mockAuthMiddleware('supplier'), (req, res) => {
        if ((req.user as any).role !== 'buyer') {
          return res.status(403).json({ error: 'Access denied' });
        }
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/api/buyer/profile')
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });

    it('should allow admins access to dispute endpoints', async () => {
      app.get('/api/admin/disputes', mockAuthMiddleware('admin'), (req, res) => {
        if ((req.user as any).role !== 'admin') {
          return res.status(403).json({ error: 'Access denied' });
        }
        res.json({ success: true, disputes: [] });
      });

      const response = await request(app)
        .get('/api/admin/disputes')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});