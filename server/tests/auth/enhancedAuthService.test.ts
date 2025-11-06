import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { EnhancedAuthService } from '../../enhancedAuthService';
import { db } from '../../db';
import { users, tokenBlacklist, userSessions } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Mock database
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}));

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  }
}));

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
    decode: vi.fn(),
  }
}));

// Mock audit log service
vi.mock('../../auditLogService', () => ({
  AuditLogService: {
    logEvent: vi.fn(),
  }
}));

// Mock password security service
vi.mock('../../passwordSecurityService', () => ({
  PasswordSecurityService: {
    isPasswordInHistory: vi.fn(),
    addPasswordToHistory: vi.fn(),
  }
}));

describe('EnhancedAuthService', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: '$2a$12$hashedpassword',
    role: 'buyer',
    isActive: true,
    emailVerified: true,
    loginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDbSelect = vi.fn();
  const mockDbInsert = vi.fn();
  const mockDbUpdate = vi.fn();
  const mockDbDelete = vi.fn();

  beforeAll(() => {
    // Set test environment variables
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.MAX_LOGIN_ATTEMPTS = '5';
    process.env.LOCKOUT_TIME_MINUTES = '15';
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup database mocks
    (db.select as any) = mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });
    
    (db.insert as any) = mockDbInsert.mockReturnValue({
      values: vi.fn().mockResolvedValue({}),
    });
    
    (db.update as any) = mockDbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    });
    
    (db.delete as any) = mockDbDelete.mockReturnValue({
      where: vi.fn().mockResolvedValue({}),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    // Clean up environment variables
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_EXPIRES_IN;
    delete process.env.JWT_REFRESH_EXPIRES_IN;
    delete process.env.MAX_LOGIN_ATTEMPTS;
    delete process.env.LOCKOUT_TIME_MINUTES;
  });

  describe('Token Generation', () => {
    it('should generate valid access token with correct payload', () => {
      const mockToken = 'mock-access-token';
      (jwt.sign as any) = vi.fn().mockReturnValue(mockToken);

      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'buyer' as const,
        sessionId: 'session-123',
        sessionMetadata: {
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          loginTime: Date.now(),
        },
      };

      const token = EnhancedAuthService.generateAccessToken(payload);

      expect(token).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          ...payload,
          jti: expect.stringMatching(/^access-user-123-\d+-[a-z0-9]+$/),
        }),
        'test-jwt-secret',
        {
          expiresIn: '15m',
          issuer: 'b2b-marketplace',
          audience: 'b2b-marketplace-users',
        }
      );
    });

    it('should generate valid refresh token with correct payload', () => {
      const mockToken = 'mock-refresh-token';
      (jwt.sign as any) = vi.fn().mockReturnValue(mockToken);

      const payload = {
        userId: 'user-123',
        sessionId: 'session-123',
        tokenVersion: 1,
        ipAddress: '127.0.0.1',
      };

      const token = EnhancedAuthService.generateRefreshToken(payload);

      expect(token).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          ...payload,
          jti: expect.stringMatching(/^refresh-user-123-\d+-[a-z0-9]+$/),
        }),
        'test-refresh-secret',
        {
          expiresIn: '7d',
          issuer: 'b2b-marketplace',
          audience: 'b2b-marketplace-refresh',
        }
      );
    });
  });

  describe('Token Verification', () => {
    it('should verify valid access token', async () => {
      const mockDecoded = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'buyer',
        sessionId: 'session-123',
        jti: 'token-jti',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      (jwt.verify as any) = vi.fn().mockReturnValue(mockDecoded);
      
      // Mock token not blacklisted
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await EnhancedAuthService.verifyAccessToken('valid-token');

      expect(result).toEqual(mockDecoded);
      expect(jwt.verify).toHaveBeenCalledWith(
        'valid-token',
        'test-jwt-secret',
        {
          issuer: 'b2b-marketplace',
          audience: 'b2b-marketplace-users',
        }
      );
    });

    it('should reject blacklisted token', async () => {
      const mockDecoded = {
        userId: 'user-123',
        jti: 'blacklisted-jti',
      };

      (jwt.verify as any) = vi.fn().mockReturnValue(mockDecoded);
      
      // Mock token is blacklisted
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ jti: 'blacklisted-jti' }]),
          }),
        }),
      });

      await expect(EnhancedAuthService.verifyAccessToken('blacklisted-token'))
        .rejects.toThrow('Invalid access token');
    });

    it('should reject invalid token', async () => {
      (jwt.verify as any) = vi.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(EnhancedAuthService.verifyAccessToken('invalid-token'))
        .rejects.toThrow('Invalid access token');
    });
  });

  describe('Token Blacklisting', () => {
    it('should blacklist token successfully', async () => {
      const mockInsert = vi.fn().mockResolvedValue({});
      mockDbInsert.mockReturnValue({
        values: mockInsert,
      });

      const jti = 'token-jti';
      const userId = 'user-123';
      const expiresAt = new Date();

      await EnhancedAuthService.blacklistToken(jti, userId, 'access', expiresAt, 'logout');

      expect(mockInsert).toHaveBeenCalledWith({
        jti,
        userId,
        tokenType: 'access',
        expiresAt,
        reason: 'logout',
      });
    });

    it('should check if token is blacklisted', async () => {
      // Mock blacklisted token
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ jti: 'blacklisted-jti' }]),
          }),
        }),
      });

      const isBlacklisted = await EnhancedAuthService.isTokenBlacklisted('blacklisted-jti');
      expect(isBlacklisted).toBe(true);

      // Mock non-blacklisted token
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const isNotBlacklisted = await EnhancedAuthService.isTokenBlacklisted('valid-jti');
      expect(isNotBlacklisted).toBe(false);
    });
  });

  describe('Account Locking', () => {
    it('should check if account is locked', async () => {
      const lockedUntil = new Date(Date.now() + 60000); // 1 minute from now
      
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ lockedUntil }]),
          }),
        }),
      });

      const isLocked = await EnhancedAuthService.isAccountLocked('user-123');
      expect(isLocked).toBe(true);
    });

    it('should handle failed login attempts', async () => {
      // Mock current user with 4 attempts
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ loginAttempts: 4 }]),
          }),
        }),
      });

      const mockUpdate = vi.fn().mockResolvedValue({});
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: mockUpdate,
        }),
      });

      const result = await EnhancedAuthService.handleFailedLogin('user-123', '127.0.0.1');

      expect(result.locked).toBe(true);
      expect(result.lockoutUntil).toBeInstanceOf(Date);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should reset login attempts on successful login', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({});
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: mockUpdate,
        }),
      });

      await EnhancedAuthService.resetLoginAttempts('user-123', '127.0.0.1');

      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should create session successfully', async () => {
      const mockInsert = vi.fn().mockResolvedValue({});
      mockDbInsert.mockReturnValue({
        values: mockInsert,
      });

      const sessionId = await EnhancedAuthService.createSession('user-123', '127.0.0.1', 'test-agent');

      expect(sessionId).toMatch(/^session-user-123-\d+-[a-z0-9]+$/);
      expect(mockInsert).toHaveBeenCalledWith({
        userId: 'user-123',
        sessionId: expect.stringMatching(/^session-user-123-\d+-[a-z0-9]+$/),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        isActive: true,
        expiresAt: expect.any(Date),
      });
    });

    it('should validate active session', async () => {
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ userId: 'user-123', sessionId: 'session-123' }]),
          }),
        }),
      });

      const mockUpdate = vi.fn().mockResolvedValue({});
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: mockUpdate,
        }),
      });

      const result = await EnhancedAuthService.validateSession('session-123');

      expect(result.valid).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(mockUpdate).toHaveBeenCalled(); // lastAccessedAt update
    });

    it('should invalidate expired session', async () => {
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await EnhancedAuthService.validateSession('expired-session');

      expect(result.valid).toBe(false);
      expect(result.userId).toBeUndefined();
    });

    it('should invalidate session', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({});
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: mockUpdate,
        }),
      });

      await EnhancedAuthService.invalidateSession('session-123');

      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('Login Process', () => {
    it('should login successfully with valid credentials', async () => {
      // Mock user found
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      // Mock password comparison
      (bcrypt.compare as any) = vi.fn().mockResolvedValue(true);

      // Mock token generation
      (jwt.sign as any) = vi.fn()
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      // Mock session creation
      const mockInsert = vi.fn().mockResolvedValue({});
      mockDbInsert.mockReturnValue({
        values: mockInsert,
      });

      // Mock login attempts reset
      const mockUpdate = vi.fn().mockResolvedValue({});
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: mockUpdate,
        }),
      });

      const result = await EnhancedAuthService.login(
        'test@example.com',
        'password123',
        '127.0.0.1',
        'test-agent',
        true
      );

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password);
    });

    it('should fail login with invalid email', async () => {
      // Mock user not found
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await EnhancedAuthService.login(
        'nonexistent@example.com',
        'password123',
        '127.0.0.1',
        'test-agent'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
      expect(result.errorCode).toBe('INVALID_CREDENTIALS');
    });

    it('should fail login with invalid password', async () => {
      // Mock user found
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      // Mock password comparison failure
      (bcrypt.compare as any) = vi.fn().mockResolvedValue(false);

      // Mock failed login handling
      const mockUpdate = vi.fn().mockResolvedValue({});
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: mockUpdate,
        }),
      });

      const result = await EnhancedAuthService.login(
        'test@example.com',
        'wrongpassword',
        '127.0.0.1',
        'test-agent'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
      expect(result.errorCode).toBe('INVALID_CREDENTIALS');
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', mockUser.password);
    });

    it('should fail login for locked account', async () => {
      const lockedUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() + 60000), // 1 minute from now
      };

      // Mock locked user found
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([lockedUser]),
          }),
        }),
      });

      const result = await EnhancedAuthService.login(
        'test@example.com',
        'password123',
        '127.0.0.1',
        'test-agent'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('temporarily locked');
      expect(result.errorCode).toBe('ACCOUNT_LOCKED');
      expect(result.lockoutUntil).toEqual(lockedUser.lockedUntil);
    });

    it('should fail login for inactive account', async () => {
      const inactiveUser = {
        ...mockUser,
        isActive: false,
      };

      // Mock inactive user found
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([inactiveUser]),
          }),
        }),
      });

      // Mock password comparison success
      (bcrypt.compare as any) = vi.fn().mockResolvedValue(true);

      const result = await EnhancedAuthService.login(
        'test@example.com',
        'password123',
        '127.0.0.1',
        'test-agent'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Account is inactive');
      expect(result.errorCode).toBe('ACCOUNT_INACTIVE');
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token successfully', async () => {
      const mockDecoded = {
        userId: 'user-123',
        sessionId: 'session-123',
        tokenVersion: 1,
        jti: 'refresh-jti',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      // Mock refresh token verification
      (jwt.verify as any) = vi.fn().mockReturnValue(mockDecoded);
      
      // Mock token not blacklisted
      mockDbSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        })
        // Mock user found and active
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{
                id: 'user-123',
                email: 'test@example.com',
                role: 'buyer',
                isActive: true,
              }]),
            }),
          }),
        })
        // Mock session validation
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ userId: 'user-123' }]),
            }),
          }),
        });

      // Mock token generation
      (jwt.sign as any) = vi.fn()
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      // Mock token decode for JTI extraction
      (jwt.decode as any) = vi.fn().mockReturnValue({ jti: 'new-refresh-jti' });

      // Mock database updates
      const mockUpdate = vi.fn().mockResolvedValue({});
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: mockUpdate,
        }),
      });

      // Mock token blacklisting
      const mockInsert = vi.fn().mockResolvedValue({});
      mockDbInsert.mockReturnValue({
        values: mockInsert,
      });

      const result = await EnhancedAuthService.refreshToken(
        'valid-refresh-token',
        '127.0.0.1',
        'test-agent'
      );

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: 'buyer',
      });
    });

    it('should fail refresh with invalid token', async () => {
      (jwt.verify as any) = vi.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await EnhancedAuthService.refreshToken(
        'invalid-refresh-token',
        '127.0.0.1',
        'test-agent'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid refresh token');
      expect(result.errorCode).toBe('INVALID_TOKEN');
    });

    it('should fail refresh for inactive user', async () => {
      const mockDecoded = {
        userId: 'user-123',
        sessionId: 'session-123',
        tokenVersion: 1,
      };

      // Mock refresh token verification
      (jwt.verify as any) = vi.fn().mockReturnValue(mockDecoded);
      
      // Mock token not blacklisted
      mockDbSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        })
        // Mock inactive user
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{
                id: 'user-123',
                email: 'test@example.com',
                role: 'buyer',
                isActive: false,
              }]),
            }),
          }),
        });

      const result = await EnhancedAuthService.refreshToken(
        'valid-refresh-token',
        '127.0.0.1',
        'test-agent'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found or inactive');
      expect(result.errorCode).toBe('USER_INACTIVE');
    });
  });

  describe('Cleanup Operations', () => {
    it('should cleanup expired data', async () => {
      const mockDelete = vi.fn().mockResolvedValue({});
      mockDbDelete.mockReturnValue({
        where: mockDelete,
      });

      await EnhancedAuthService.cleanupExpiredData();

      // Should delete expired tokens, sessions, and old audit logs
      expect(mockDelete).toHaveBeenCalledTimes(3);
    });
  });
});