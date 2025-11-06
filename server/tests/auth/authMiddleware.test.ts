import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  jwtAuthMiddleware,
  optionalJwtAuthMiddleware,
  sessionAuthMiddleware,
  hybridAuthMiddleware,
  handleTokenRefresh,
  handleLogout,
  AuthenticatedUser
} from '../../authMiddleware';
import { EnhancedAuthService } from '../../enhancedAuthService';
import { db } from '../../db';

// Mock dependencies
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
  }
}));

vi.mock('../../enhancedAuthService', () => ({
  EnhancedAuthService: {
    verifyAccessToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
    refreshToken: vi.fn(),
    blacklistToken: vi.fn(),
    validateSession: vi.fn(),
    invalidateSession: vi.fn(),
  }
}));

describe('Auth Middleware Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: vi.Mock;
  let mockStatus: vi.Mock;
  let mockCookie: vi.Mock;
  let mockClearCookie: vi.Mock;

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'buyer',
    emailVerified: true,
    isActive: true,
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    mockCookie = vi.fn();
    mockClearCookie = vi.fn();
    
    mockReq = {
      headers: {},
      cookies: {},
      session: {},
      ip: '127.0.0.1',
      get: vi.fn().mockReturnValue('test-user-agent'),
    };
    
    mockRes = {
      status: mockStatus,
      json: mockJson,
      cookie: mockCookie,
      clearCookie: mockClearCookie,
    };
    
    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('JWT Auth Middleware', () => {
    it('should authenticate valid JWT token', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      
      (EnhancedAuthService.verifyAccessToken as any).mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'buyer',
        sessionId: 'session-123',
      });

      // Mock user lookup
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([{
                    users: mockUser,
                    supplierProfiles: null,
                    buyers: null,
                    staffMembers: null,
                  }])
                })
              })
            })
          })
        })
      });
      
      (db.select as any).mockImplementation(mockSelect);

      await jwtAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(EnhancedAuthService.verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it('should reject invalid JWT token', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };
      
      (EnhancedAuthService.verifyAccessToken as any).mockRejectedValue(new Error('Invalid token'));

      await jwtAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid access token',
        code: 'INVALID_TOKEN'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request without token', async () => {
      mockReq.headers = {};

      await jwtAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Access token required',
        code: 'TOKEN_REQUIRED'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle inactive user', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      
      (EnhancedAuthService.verifyAccessToken as any).mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'buyer',
        sessionId: 'session-123',
      });

      const inactiveUser = { ...mockUser, isActive: false };
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([{
                    users: inactiveUser,
                    supplierProfiles: null,
                    buyers: null,
                    staffMembers: null,
                  }])
                })
              })
            })
          })
        })
      });
      
      (db.select as any).mockImplementation(mockSelect);

      await jwtAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Account is inactive',
        code: 'ACCOUNT_INACTIVE'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Session Auth Middleware', () => {
    it('should authenticate valid session', async () => {
      mockReq.session = { sessionId: 'session-123' };
      
      (EnhancedAuthService.validateSession as any).mockResolvedValue({
        valid: true,
        userId: 'user-123',
        sessionData: { ipAddress: '127.0.0.1' }
      });

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([{
                    users: mockUser,
                    supplierProfiles: null,
                    buyers: null,
                    staffMembers: null,
                  }])
                })
              })
            })
          })
        })
      });
      
      (db.select as any).mockImplementation(mockSelect);

      await sessionAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(EnhancedAuthService.validateSession).toHaveBeenCalledWith('session-123');
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject invalid session', async () => {
      mockReq.session = { sessionId: 'invalid-session' };
      
      (EnhancedAuthService.validateSession as any).mockResolvedValue({
        valid: false
      });

      await sessionAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid session',
        code: 'INVALID_SESSION'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request without session', async () => {
      mockReq.session = {};

      await sessionAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Session required',
        code: 'SESSION_REQUIRED'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Hybrid Auth Middleware', () => {
    it('should authenticate with JWT when available', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      mockReq.session = { sessionId: 'session-123' };
      
      (EnhancedAuthService.verifyAccessToken as any).mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'buyer',
        sessionId: 'session-123',
      });

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([{
                    users: mockUser,
                    supplierProfiles: null,
                    buyers: null,
                    staffMembers: null,
                  }])
                })
              })
            })
          })
        })
      });
      
      (db.select as any).mockImplementation(mockSelect);

      await hybridAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(EnhancedAuthService.verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(EnhancedAuthService.validateSession).not.toHaveBeenCalled();
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should fallback to session when JWT fails', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };
      mockReq.session = { sessionId: 'session-123' };
      
      (EnhancedAuthService.verifyAccessToken as any).mockRejectedValue(new Error('Invalid token'));
      (EnhancedAuthService.validateSession as any).mockResolvedValue({
        valid: true,
        userId: 'user-123',
        sessionData: { ipAddress: '127.0.0.1' }
      });

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([{
                    users: mockUser,
                    supplierProfiles: null,
                    buyers: null,
                    staffMembers: null,
                  }])
                })
              })
            })
          })
        })
      });
      
      (db.select as any).mockImplementation(mockSelect);

      await hybridAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(EnhancedAuthService.verifyAccessToken).toHaveBeenCalledWith('invalid-token');
      expect(EnhancedAuthService.validateSession).toHaveBeenCalledWith('session-123');
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail when both JWT and session are invalid', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };
      mockReq.session = { sessionId: 'invalid-session' };
      
      (EnhancedAuthService.verifyAccessToken as any).mockRejectedValue(new Error('Invalid token'));
      (EnhancedAuthService.validateSession as any).mockResolvedValue({
        valid: false
      });

      await hybridAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Optional JWT Auth Middleware', () => {
    it('should authenticate when token is provided', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      
      (EnhancedAuthService.verifyAccessToken as any).mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'buyer',
        sessionId: 'session-123',
      });

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([{
                    users: mockUser,
                    supplierProfiles: null,
                    buyers: null,
                    staffMembers: null,
                  }])
                })
              })
            })
          })
        })
      });
      
      (db.select as any).mockImplementation(mockSelect);

      await optionalJwtAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it('should continue without authentication when no token provided', async () => {
      mockReq.headers = {};

      await optionalJwtAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it('should continue without authentication when token is invalid', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };
      
      (EnhancedAuthService.verifyAccessToken as any).mockRejectedValue(new Error('Invalid token'));

      await optionalJwtAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockStatus).not.toHaveBeenCalled();
    });
  });

  describe('Token Refresh Handler', () => {
    it('should refresh token successfully', async () => {
      mockReq.cookies = { refreshToken: 'valid-refresh-token' };
      
      (EnhancedAuthService.refreshToken as any).mockResolvedValue({
        success: true,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: mockUser
      });

      await handleTokenRefresh(mockReq as Request, mockRes as Response);

      expect(EnhancedAuthService.refreshToken).toHaveBeenCalledWith(
        'valid-refresh-token',
        '127.0.0.1',
        'test-user-agent'
      );
      expect(mockCookie).toHaveBeenCalledWith('refreshToken', 'new-refresh-token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        accessToken: 'new-access-token',
        user: mockUser
      });
    });

    it('should fail refresh with invalid token', async () => {
      mockReq.cookies = { refreshToken: 'invalid-refresh-token' };
      
      (EnhancedAuthService.refreshToken as any).mockResolvedValue({
        success: false,
        error: 'Invalid refresh token',
        errorCode: 'INVALID_TOKEN'
      });

      await handleTokenRefresh(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid refresh token',
        code: 'INVALID_TOKEN'
      });
    });

    it('should fail refresh without token', async () => {
      mockReq.cookies = {};

      await handleTokenRefresh(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Refresh token required',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    });
  });

  describe('Logout Handler', () => {
    it('should logout successfully with JWT', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      mockReq.cookies = { refreshToken: 'refresh-token' };
      mockReq.session = { sessionId: 'session-123' };
      
      (EnhancedAuthService.blacklistToken as any).mockResolvedValue(undefined);
      (EnhancedAuthService.invalidateSession as any).mockResolvedValue(undefined);

      await handleLogout(mockReq as Request, mockRes as Response);

      expect(EnhancedAuthService.blacklistToken).toHaveBeenCalledTimes(2); // access and refresh tokens
      expect(EnhancedAuthService.invalidateSession).toHaveBeenCalledWith('session-123');
      expect(mockClearCookie).toHaveBeenCalledWith('refreshToken');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully'
      });
    });

    it('should logout successfully with session only', async () => {
      mockReq.headers = {};
      mockReq.cookies = {};
      mockReq.session = { sessionId: 'session-123' };
      
      (EnhancedAuthService.invalidateSession as any).mockResolvedValue(undefined);

      await handleLogout(mockReq as Request, mockRes as Response);

      expect(EnhancedAuthService.blacklistToken).not.toHaveBeenCalled();
      expect(EnhancedAuthService.invalidateSession).toHaveBeenCalledWith('session-123');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully'
      });
    });

    it('should handle logout without authentication', async () => {
      mockReq.headers = {};
      mockReq.cookies = {};
      mockReq.session = {};

      await handleLogout(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully'
      });
    });
  });
});
    