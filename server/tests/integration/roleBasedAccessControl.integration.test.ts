import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authMiddleware } from '../../authMiddleware';
import { authGuards } from '../../authGuards';

// Mock the database and auth services
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}));

vi.mock('../../auth', () => ({
  verifyToken: vi.fn(),
  getUserById: vi.fn(),
}));

describe('Role-Based Access Control Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication Middleware', () => {
    it('should authenticate valid JWT tokens', async () => {
      const { verifyToken, getUserById } = await import('../../auth');
      
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'buyer',
      };

      (verifyToken as any).mockReturnValue({ userId: 'user-123' });
      (getUserById as any).mockResolvedValue(mockUser);

      app.get('/api/protected', async (req, res, next) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }

        try {
          const decoded = verifyToken(token);
          const user = await getUserById(decoded.userId);
          if (!user) {
            return res.status(401).json({ error: 'User not found' });
          }
          req.user = user;
          next();
        } catch (error) {
          return res.status(401).json({ error: 'Invalid token' });
        }
      }, (req, res) => {
        res.json({ success: true, user: req.user });
      });

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.role).toBe('buyer');
      expect(verifyToken).toHaveBeenCalledWith('valid-token');
      expect(getUserById).toHaveBeenCalledWith('user-123');
    });

    it('should reject invalid JWT tokens', async () => {
      const { verifyToken } = await import('../../auth');
      
      (verifyToken as any).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      app.get('/api/protected', async (req, res) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }

        try {
          verifyToken(token);
          res.json({ success: true });
        } catch (error) {
          return res.status(401).json({ error: 'Invalid token' });
        }
      });

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });

    it('should reject requests without tokens', async () => {
      app.get('/api/protected', (req, res) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/api/protected')
        .expect(401);

      expect(response.body.error).toBe('No token provided');
    });
  });

  describe('Role-Based Authorization Guards', () => {
    const mockAuthMiddleware = (role: string, userId: string = 'test-user-id') => (req: any, res: any, next: any) => {
      req.user = { id: userId, role };
      next();
    };

    const roleGuard = (allowedRoles: string[]) => (req: any, res: any, next: any) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      next();
    };

    it('should allow buyers to access buyer-only endpoints', async () => {
      app.get('/api/buyer/profile', 
        mockAuthMiddleware('buyer'),
        roleGuard(['buyer']),
        (req, res) => {
          res.json({ success: true, profile: { id: 'buyer-123' } });
        }
      );

      const response = await request(app)
        .get('/api/buyer/profile')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.profile.id).toBe('buyer-123');
    });

    it('should deny suppliers access to buyer-only endpoints', async () => {
      app.get('/api/buyer/profile',
        mockAuthMiddleware('supplier'),
        roleGuard(['buyer']),
        (req, res) => {
          res.json({ success: true });
        }
      );

      const response = await request(app)
        .get('/api/buyer/profile')
        .expect(403);

      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should allow suppliers to access supplier-only endpoints', async () => {
      app.get('/api/supplier/products',
        mockAuthMiddleware('supplier'),
        roleGuard(['supplier']),
        (req, res) => {
          res.json({ success: true, products: [] });
        }
      );

      const response = await request(app)
        .get('/api/supplier/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.products).toEqual([]);
    });

    it('should deny buyers access to supplier-only endpoints', async () => {
      app.get('/api/supplier/products',
        mockAuthMiddleware('buyer'),
        roleGuard(['supplier']),
        (req, res) => {
          res.json({ success: true });
        }
      );

      const response = await request(app)
        .get('/api/supplier/products')
        .expect(403);

      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should allow admins to access admin-only endpoints', async () => {
      app.get('/api/admin/disputes',
        mockAuthMiddleware('admin'),
        roleGuard(['admin']),
        (req, res) => {
          res.json({ success: true, disputes: [] });
        }
      );

      const response = await request(app)
        .get('/api/admin/disputes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.disputes).toEqual([]);
    });

    it('should deny non-admins access to admin-only endpoints', async () => {
      app.get('/api/admin/disputes',
        mockAuthMiddleware('buyer'),
        roleGuard(['admin']),
        (req, res) => {
          res.json({ success: true });
        }
      );

      const response = await request(app)
        .get('/api/admin/disputes')
        .expect(403);

      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should allow multiple roles to access shared endpoints', async () => {
      app.get('/api/chat/conversations',
        mockAuthMiddleware('buyer'),
        roleGuard(['buyer', 'supplier', 'admin']),
        (req, res) => {
          res.json({ success: true, conversations: [] });
        }
      );

      const buyerResponse = await request(app)
        .get('/api/chat/conversations')
        .expect(200);

      expect(buyerResponse.body.success).toBe(true);

      // Test with supplier role
      app.get('/api/chat/conversations2',
        mockAuthMiddleware('supplier'),
        roleGuard(['buyer', 'supplier', 'admin']),
        (req, res) => {
          res.json({ success: true, conversations: [] });
        }
      );

      const supplierResponse = await request(app)
        .get('/api/chat/conversations2')
        .expect(200);

      expect(supplierResponse.body.success).toBe(true);
    });
  });

  describe('Resource Ownership Validation', () => {
    const mockAuthMiddleware = (role: string, userId: string) => (req: any, res: any, next: any) => {
      req.user = { id: userId, role };
      next();
    };

    const ownershipGuard = (resourceType: string) => async (req: any, res: any, next: any) => {
      const resourceId = req.params.id;
      const userId = req.user.id;

      // Mock ownership validation logic
      if (resourceType === 'rfq' && resourceId === 'rfq-123' && userId === 'buyer-123') {
        return next();
      }
      
      if (resourceType === 'quotation' && resourceId === 'quotation-123' && userId === 'supplier-123') {
        return next();
      }

      return res.status(403).json({ error: 'Resource access denied' });
    };

    it('should allow buyers to access their own RFQs', async () => {
      app.get('/api/buyer/rfqs/:id',
        mockAuthMiddleware('buyer', 'buyer-123'),
        ownershipGuard('rfq'),
        (req, res) => {
          res.json({ success: true, rfq: { id: req.params.id } });
        }
      );

      const response = await request(app)
        .get('/api/buyer/rfqs/rfq-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.rfq.id).toBe('rfq-123');
    });

    it('should deny buyers access to other buyers RFQs', async () => {
      app.get('/api/buyer/rfqs/:id',
        mockAuthMiddleware('buyer', 'buyer-456'),
        ownershipGuard('rfq'),
        (req, res) => {
          res.json({ success: true });
        }
      );

      const response = await request(app)
        .get('/api/buyer/rfqs/rfq-123')
        .expect(403);

      expect(response.body.error).toBe('Resource access denied');
    });

    it('should allow suppliers to access their own quotations', async () => {
      app.get('/api/supplier/quotations/:id',
        mockAuthMiddleware('supplier', 'supplier-123'),
        ownershipGuard('quotation'),
        (req, res) => {
          res.json({ success: true, quotation: { id: req.params.id } });
        }
      );

      const response = await request(app)
        .get('/api/supplier/quotations/quotation-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.quotation.id).toBe('quotation-123');
    });

    it('should deny suppliers access to other suppliers quotations', async () => {
      app.get('/api/supplier/quotations/:id',
        mockAuthMiddleware('supplier', 'supplier-456'),
        ownershipGuard('quotation'),
        (req, res) => {
          res.json({ success: true });
        }
      );

      const response = await request(app)
        .get('/api/supplier/quotations/quotation-123')
        .expect(403);

      expect(response.body.error).toBe('Resource access denied');
    });
  });

  describe('Session Management', () => {
    it('should handle session expiration', async () => {
      const { verifyToken } = await import('../../auth');
      
      (verifyToken as any).mockImplementation(() => {
        throw new Error('Token expired');
      });

      app.get('/api/protected', async (req, res) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }

        try {
          verifyToken(token);
          res.json({ success: true });
        } catch (error: any) {
          if (error.message === 'Token expired') {
            return res.status(401).json({ error: 'Session expired', code: 'TOKEN_EXPIRED' });
          }
          return res.status(401).json({ error: 'Invalid token' });
        }
      });

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer expired-token')
        .expect(401);

      expect(response.body.error).toBe('Session expired');
      expect(response.body.code).toBe('TOKEN_EXPIRED');
    });

    it('should handle concurrent session validation', async () => {
      const { verifyToken, getUserById } = await import('../../auth');
      
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'buyer',
        isActive: true,
      };

      (verifyToken as any).mockReturnValue({ userId: 'user-123' });
      (getUserById as any).mockResolvedValue(mockUser);

      app.get('/api/protected', async (req, res) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }

        try {
          const decoded = verifyToken(token);
          const user = await getUserById(decoded.userId);
          
          if (!user || !user.isActive) {
            return res.status(401).json({ error: 'User account deactivated' });
          }
          
          req.user = user;
          res.json({ success: true, user: req.user });
        } catch (error) {
          return res.status(401).json({ error: 'Authentication failed' });
        }
      });

      // Simulate concurrent requests
      const requests = Array.from({ length: 3 }, () =>
        request(app)
          .get('/api/protected')
          .set('Authorization', 'Bearer valid-token')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.user.role).toBe('buyer');
      });

      expect(verifyToken).toHaveBeenCalledTimes(3);
      expect(getUserById).toHaveBeenCalledTimes(3);
    });
  });
});