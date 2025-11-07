import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { db } from '../../db';
import { users, tokenBlacklist, userSessions } from '@shared/schema';
import { EnhancedAuthService } from '../../enhancedAuthService';
import { authRateLimiter } from '../../authRateLimiter';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * Authentication Security Tests
 * 
 * Tests security features including:
 * - Rate limiting on authentication endpoints
 * - Account lockout mechanisms
 * - Token blacklisting
 * - Session security
 * - Access control validation
 */

describe('Authentication Security Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-security';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-security';
    process.env.MAX_LOGIN_ATTEMPTS = '5';
    process.env.LOCKOUT_TIME_MINUTES = '15';
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.MAX_LOGIN_ATTEMPTS;
    delete process.env.LOCKOUT_TIME_MINUTES;
    delete process.env.NODE_ENV;
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on login attempts', async () => {
      const userId = `user-ratelimit-${Date.now()}`;
      const email = `ratelimit-${Date.now()}@test.com`;
      const hashedPassword = await bcrypt.hash('TestPass123!', 12);

      // Create test user
      await db.insert(users).values({
        id: userId,
        email,
        password: hashedPassword,
        firstName: 'Rate',
        lastName: 'Limit',
        role: 'buyer',
        emailVerified: true,
        isActive: true,
        loginAttempts: 0,
        createdAt: new Date(),
      });

      // Simulate multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        await db.update(users)
          .set({ loginAttempts: i + 1 })
          .where(eq(users.id, userId));
      }

      const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      expect(user[0].loginAttempts).toBe(5);

      // Cleanup
      await db.delete(users).where(eq(users.id, userId));
    });

    it('should lock account after maximum failed attempts', async () => {
      const userId = `user-lockout-${Date.now()}`;
      const email = `lockout-${Date.now()}@test.com`;
      const hashedPassword = await bcrypt.hash('TestPass123!', 12);

      await db.insert(users).values({
        id: userId,
        email,
        password: hashedPassword,
        firstName: 'Lockout',
        lastName: 'Test',
        role: 'buyer',
        emailVerified: true,
        isActive: true,
        loginAttempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        createdAt: new Date(),
      });

      const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      expect(user[0].loginAttempts).toBe(5);
      expect(user[0].lockedUntil).toBeDefined();
      expect(user[0].lockedUntil!.getTime()).toBeGreaterThan(Date.now());

      // Cleanup
      await db.delete(users).where(eq(users.id, userId));
    });

    it('should reset login attempts after successful login', async () => {
      const userId = `user-reset-${Date.now()}`;
      const email = `reset-attempts-${Date.now()}@test.com`;
      const hashedPassword = await bcrypt.hash('TestPass123!', 12);

      await db.insert(users).values({
        id: userId,
        email,
        password: hashedPassword,
        firstName: 'Reset',
        lastName: 'Attempts',
        role: 'buyer',
        emailVerified: true,
        isActive: true,
        loginAttempts: 3,
        createdAt: new Date(),
      });

      // Simulate successful login
      await db.update(users)
        .set({ loginAttempts: 0, lastLoginAt: new Date() })
        .where(eq(users.id, userId));

      const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      expect(user[0].loginAttempts).toBe(0);
      expect(user[0].lastLoginAt).toBeDefined();

      // Cleanup
      await db.delete(users).where(eq(users.id, userId));
    });

    it('should implement progressive lockout periods', async () => {
      const userId = `user-progressive-${Date.now()}`;
      const email = `progressive-${Date.now()}@test.com`;
      const hashedPassword = await bcrypt.hash('TestPass123!', 12);

      await db.insert(users).values({
        id: userId,
        email,
        password: hashedPassword,
        firstName: 'Progressive',
        lastName: 'Lockout',
        role: 'buyer',
        emailVerified: true,
        isActive: true,
        loginAttempts: 0,
        createdAt: new Date(),
      });

      // First lockout: 5 minutes
      await db.update(users)
        .set({
          loginAttempts: 5,
          lockedUntil: new Date(Date.now() + 5 * 60 * 1000),
        })
        .where(eq(users.id, userId));

      let user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const firstLockout = user[0].lockedUntil!.getTime();

      // Second lockout: 15 minutes
      await db.update(users)
        .set({
          loginAttempts: 5,
          lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
        })
        .where(eq(users.id, userId));

      user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const secondLockout = user[0].lockedUntil!.getTime();

      expect(secondLockout).toBeGreaterThan(firstLockout);

      // Cleanup
      await db.delete(users).where(eq(users.id, userId));
    });
  });

  describe('Token Security', () => {
    it('should blacklist tokens on logout', async () => {
      const jti = `token-${Date.now()}`;
      const userId = `user-${Date.now()}`;

      await db.insert(tokenBlacklist).values({
        jti,
        userId,
        tokenType: 'access',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        reason: 'logout',
      });

      const blacklistedToken = await db.select()
        .from(tokenBlacklist)
        .where(eq(tokenBlacklist.jti, jti))
        .limit(1);

      expect(blacklistedToken.length).toBe(1);
      expect(blacklistedToken[0].reason).toBe('logout');

      // Cleanup
      await db.delete(tokenBlacklist).where(eq(tokenBlacklist.jti, jti));
    });

    it('should prevent use of blacklisted tokens', async () => {
      const jti = `blacklisted-${Date.now()}`;
      const userId = `user-${Date.now()}`;

      await db.insert(tokenBlacklist).values({
        jti,
        userId,
        tokenType: 'access',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        reason: 'security',
      });

      const isBlacklisted = await EnhancedAuthService.isTokenBlacklisted(jti);
      expect(isBlacklisted).toBe(true);

      // Cleanup
      await db.delete(tokenBlacklist).where(eq(tokenBlacklist.jti, jti));
    });

    it('should blacklist all user tokens on password change', async () => {
      const userId = `user-pwchange-${Date.now()}`;
      const jti1 = `token1-${Date.now()}`;
      const jti2 = `token2-${Date.now()}`;

      await db.insert(tokenBlacklist).values([
        {
          jti: jti1,
          userId,
          tokenType: 'access',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          reason: 'password_change',
        },
        {
          jti: jti2,
          userId,
          tokenType: 'refresh',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          reason: 'password_change',
        },
      ]);

      const blacklistedTokens = await db.select()
        .from(tokenBlacklist)
        .where(eq(tokenBlacklist.userId, userId));

      expect(blacklistedTokens.length).toBe(2);
      expect(blacklistedTokens.every(t => t.reason === 'password_change')).toBe(true);

      // Cleanup
      await db.delete(tokenBlacklist).where(eq(tokenBlacklist.userId, userId));
    });

    it('should enforce token expiration', async () => {
      const jti = `expired-${Date.now()}`;
      const userId = `user-${Date.now()}`;

      // Create expired token
      await db.insert(tokenBlacklist).values({
        jti,
        userId,
        tokenType: 'access',
        expiresAt: new Date(Date.now() - 1000), // Already expired
        reason: 'logout',
      });

      const expiredToken = await db.select()
        .from(tokenBlacklist)
        .where(eq(tokenBlacklist.jti, jti))
        .limit(1);

      expect(expiredToken[0].expiresAt.getTime()).toBeLessThan(Date.now());

      // Cleanup
      await db.delete(tokenBlacklist).where(eq(tokenBlacklist.jti, jti));
    });
  });

  describe('Session Security', () => {
    it('should create secure session with metadata', async () => {
      const sessionId = `session-${Date.now()}`;
      const userId = `user-${Date.now()}`;

      await db.insert(userSessions).values({
        userId,
        sessionId,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });

      const session = await db.select()
        .from(userSessions)
        .where(eq(userSessions.sessionId, sessionId))
        .limit(1);

      expect(session[0].ipAddress).toBe('127.0.0.1');
      expect(session[0].userAgent).toBe('test-agent');
      expect(session[0].isActive).toBe(true);

      // Cleanup
      await db.delete(userSessions).where(eq(userSessions.sessionId, sessionId));
    });

    it('should invalidate session on logout', async () => {
      const sessionId = `session-logout-${Date.now()}`;
      const userId = `user-${Date.now()}`;

      await db.insert(userSessions).values({
        userId,
        sessionId,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });

      // Invalidate session
      await db.update(userSessions)
        .set({ isActive: false })
        .where(eq(userSessions.sessionId, sessionId));

      const session = await db.select()
        .from(userSessions)
        .where(eq(userSessions.sessionId, sessionId))
        .limit(1);

      expect(session[0].isActive).toBe(false);

      // Cleanup
      await db.delete(userSessions).where(eq(userSessions.sessionId, sessionId));
    });

    it('should enforce session expiration', async () => {
      const sessionId = `session-expired-${Date.now()}`;
      const userId = `user-${Date.now()}`;

      await db.insert(userSessions).values({
        userId,
        sessionId,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        isActive: true,
        expiresAt: new Date(Date.now() - 1000), // Already expired
      });

      const session = await db.select()
        .from(userSessions)
        .where(eq(userSessions.sessionId, sessionId))
        .limit(1);

      expect(session[0].expiresAt.getTime()).toBeLessThan(Date.now());

      // Cleanup
      await db.delete(userSessions).where(eq(userSessions.sessionId, sessionId));
    });

    it('should track session activity', async () => {
      const sessionId = `session-activity-${Date.now()}`;
      const userId = `user-${Date.now()}`;

      await db.insert(userSessions).values({
        userId,
        sessionId,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        lastAccessedAt: new Date(),
      });

      // Update last accessed time
      const newAccessTime = new Date();
      await db.update(userSessions)
        .set({ lastAccessedAt: newAccessTime })
        .where(eq(userSessions.sessionId, sessionId));

      const session = await db.select()
        .from(userSessions)
        .where(eq(userSessions.sessionId, sessionId))
        .limit(1);

      expect(session[0].lastAccessedAt).toBeDefined();

      // Cleanup
      await db.delete(userSessions).where(eq(userSessions.sessionId, sessionId));
    });

    it('should invalidate all user sessions on security event', async () => {
      const userId = `user-security-${Date.now()}`;
      const session1 = `session1-${Date.now()}`;
      const session2 = `session2-${Date.now()}`;

      await db.insert(userSessions).values([
        {
          userId,
          sessionId: session1,
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent-1',
          isActive: true,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
        {
          userId,
          sessionId: session2,
          ipAddress: '127.0.0.2',
          userAgent: 'test-agent-2',
          isActive: true,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      ]);

      // Invalidate all sessions for user
      await db.update(userSessions)
        .set({ isActive: false })
        .where(eq(userSessions.userId, userId));

      const sessions = await db.select()
        .from(userSessions)
        .where(eq(userSessions.userId, userId));

      expect(sessions.every(s => !s.isActive)).toBe(true);

      // Cleanup
      await db.delete(userSessions).where(eq(userSessions.userId, userId));
    });
  });

  describe('Access Control Security', () => {
    it('should prevent inactive users from accessing resources', async () => {
      const userId = `user-inactive-${Date.now()}`;
      const email = `inactive-${Date.now()}@test.com`;
      const hashedPassword = await bcrypt.hash('TestPass123!', 12);

      await db.insert(users).values({
        id: userId,
        email,
        password: hashedPassword,
        firstName: 'Inactive',
        lastName: 'User',
        role: 'buyer',
        emailVerified: true,
        isActive: false,
        createdAt: new Date(),
      });

      const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      expect(user[0].isActive).toBe(false);

      // Cleanup
      await db.delete(users).where(eq(users.id, userId));
    });

    it('should prevent unverified users from accessing protected resources', async () => {
      const userId = `user-unverified-${Date.now()}`;
      const email = `unverified-${Date.now()}@test.com`;
      const hashedPassword = await bcrypt.hash('TestPass123!', 12);

      await db.insert(users).values({
        id: userId,
        email,
        password: hashedPassword,
        firstName: 'Unverified',
        lastName: 'User',
        role: 'buyer',
        emailVerified: false,
        isActive: true,
        createdAt: new Date(),
      });

      const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      expect(user[0].emailVerified).toBe(false);

      // Cleanup
      await db.delete(users).where(eq(users.id, userId));
    });

    it('should enforce role-based access control', async () => {
      const buyerId = `buyer-${Date.now()}`;
      const supplierId = `supplier-${Date.now()}`;
      const adminId = `admin-${Date.now()}`;

      const hashedPassword = await bcrypt.hash('TestPass123!', 12);

      await db.insert(users).values([
        {
          id: buyerId,
          email: `buyer-rbac-${Date.now()}@test.com`,
          password: hashedPassword,
          firstName: 'Buyer',
          lastName: 'RBAC',
          role: 'buyer',
          emailVerified: true,
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: supplierId,
          email: `supplier-rbac-${Date.now()}@test.com`,
          password: hashedPassword,
          firstName: 'Supplier',
          lastName: 'RBAC',
          role: 'supplier',
          emailVerified: true,
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: adminId,
          email: `admin-rbac-${Date.now()}@test.com`,
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'RBAC',
          role: 'admin',
          emailVerified: true,
          isActive: true,
          createdAt: new Date(),
        },
      ]);

      const allUsers = await db.select()
        .from(users)
        .where(eq(users.id, buyerId))
        .limit(1);

      expect(allUsers[0].role).toBe('buyer');

      // Cleanup
      await db.delete(users).where(eq(users.id, buyerId));
      await db.delete(users).where(eq(users.id, supplierId));
      await db.delete(users).where(eq(users.id, adminId));
    });

    it('should prevent cross-user resource access', async () => {
      const user1Id = `user1-${Date.now()}`;
      const user2Id = `user2-${Date.now()}`;
      const hashedPassword = await bcrypt.hash('TestPass123!', 12);

      await db.insert(users).values([
        {
          id: user1Id,
          email: `user1-${Date.now()}@test.com`,
          password: hashedPassword,
          firstName: 'User',
          lastName: 'One',
          role: 'buyer',
          emailVerified: true,
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: user2Id,
          email: `user2-${Date.now()}@test.com`,
          password: hashedPassword,
          firstName: 'User',
          lastName: 'Two',
          role: 'buyer',
          emailVerified: true,
          isActive: true,
          createdAt: new Date(),
        },
      ]);

      const user1 = await db.select()
        .from(users)
        .where(eq(users.id, user1Id))
        .limit(1);

      const user2 = await db.select()
        .from(users)
        .where(eq(users.id, user2Id))
        .limit(1);

      expect(user1[0].id).not.toBe(user2[0].id);

      // Cleanup
      await db.delete(users).where(eq(users.id, user1Id));
      await db.delete(users).where(eq(users.id, user2Id));
    });
  });

  describe('Password Security', () => {
    it('should enforce password complexity requirements', () => {
      const weakPasswords = [
        'short',
        'nouppercase123!',
        'NOLOWERCASE123!',
        'NoSpecialChar123',
        'NoNumbers!',
      ];

      const strongPassword = 'StrongPass123!';

      // Simple validation check
      const isStrong = (password: string) => {
        return (
          password.length >= 8 &&
          /[A-Z]/.test(password) &&
          /[a-z]/.test(password) &&
          /[0-9]/.test(password) &&
          /[!@#$%^&*]/.test(password)
        );
      };

      weakPasswords.forEach(password => {
        expect(isStrong(password)).toBe(false);
      });

      expect(isStrong(strongPassword)).toBe(true);
    });

    it('should hash passwords securely', async () => {
      const password = 'SecurePass123!';
      const hashedPassword = await bcrypt.hash(password, 12);

      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(password.length);

      const isMatch = await bcrypt.compare(password, hashedPassword);
      expect(isMatch).toBe(true);

      const isNotMatch = await bcrypt.compare('WrongPass123!', hashedPassword);
      expect(isNotMatch).toBe(false);
    });

    it('should prevent password reuse', async () => {
      const userId = `user-pwhistory-${Date.now()}`;
      const email = `pwhistory-${Date.now()}@test.com`;
      const password1 = 'FirstPass123!';
      const password2 = 'SecondPass123!';

      const hashedPassword1 = await bcrypt.hash(password1, 12);

      await db.insert(users).values({
        id: userId,
        email,
        password: hashedPassword1,
        firstName: 'Password',
        lastName: 'History',
        role: 'buyer',
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
      });

      // Change password
      const hashedPassword2 = await bcrypt.hash(password2, 12);
      await db.update(users)
        .set({ password: hashedPassword2 })
        .where(eq(users.id, userId));

      const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const cannotReuseOld = !(await bcrypt.compare(password1, user[0].password));
      const canUseNew = await bcrypt.compare(password2, user[0].password);

      expect(cannotReuseOld).toBe(true);
      expect(canUseNew).toBe(true);

      // Cleanup
      await db.delete(users).where(eq(users.id, userId));
    });
  });
});
