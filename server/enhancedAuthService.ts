import { Request } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { 
  users, 
  tokenBlacklist, 
  authenticationAuditLogs, 
  passwordHistory, 
  userSessions,
  supplierProfiles,
  staffMembers,
  buyers,
  User,
  InsertTokenBlacklist,
  InsertAuthenticationAuditLog,
  InsertPasswordHistory,
  InsertUserSession
} from '@shared/schema';
import { eq, and, desc, lt, gte } from 'drizzle-orm';
import { AuditLogService } from './auditLogService';
import { PasswordSecurityService } from './passwordSecurityService';

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
const LOCKOUT_TIME_MINUTES = parseInt(process.env.LOCKOUT_TIME_MINUTES || '15');
const PASSWORD_HISTORY_LIMIT = 5;

// Enhanced interfaces
export interface EnhancedJWTPayload {
  userId: string;
  email: string;
  role: 'buyer' | 'admin' | 'supplier';
  sessionId: string;
  sessionMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    loginTime?: number;
  };
  iat?: number;
  exp?: number;
  jti?: string;
}

export interface EnhancedRefreshTokenPayload {
  userId: string;
  sessionId: string;
  tokenVersion: number;
  ipAddress?: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

export interface AuthenticationResult {
  success: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
  errorCode?: string;
  lockoutUntil?: Date;
}

export interface TokenRefreshResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: { id: string; email: string; role: string };
  error?: string;
  errorCode?: string;
}

export class EnhancedAuthService {
  /**
   * Generate enhanced JWT access token with session metadata
   */
  static generateAccessToken(payload: Omit<EnhancedJWTPayload, 'iat' | 'exp' | 'jti'>): string {
    const jti = `access-${payload.userId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    return jwt.sign(
      { ...payload, jti } as object,
      JWT_SECRET as jwt.Secret,
      {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'b2b-marketplace',
        audience: 'b2b-marketplace-users'
      } as jwt.SignOptions
    );
  }

  /**
   * Generate enhanced refresh token with rotation support
   */
  static generateRefreshToken(payload: Omit<EnhancedRefreshTokenPayload, 'iat' | 'exp' | 'jti'>): string {
    const jti = `refresh-${payload.userId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    return jwt.sign(
      { ...payload, jti } as object,
      JWT_REFRESH_SECRET as jwt.Secret,
      {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
        issuer: 'b2b-marketplace',
        audience: 'b2b-marketplace-refresh'
      } as jwt.SignOptions
    );
  }

  /**
   * Verify access token and check blacklist
   */
  static async verifyAccessToken(token: string): Promise<EnhancedJWTPayload> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'b2b-marketplace',
        audience: 'b2b-marketplace-users'
      }) as EnhancedJWTPayload;

      // Check if token is blacklisted
      if (decoded.jti) {
        const blacklisted = await this.isTokenBlacklisted(decoded.jti);
        if (blacklisted) {
          throw new Error('Token has been revoked');
        }
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  /**
   * Verify refresh token and check blacklist
   */
  static async verifyRefreshToken(token: string): Promise<EnhancedRefreshTokenPayload> {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
        issuer: 'b2b-marketplace',
        audience: 'b2b-marketplace-refresh'
      }) as EnhancedRefreshTokenPayload;

      // Check if token is blacklisted
      if (decoded.jti) {
        const blacklisted = await this.isTokenBlacklisted(decoded.jti);
        if (blacklisted) {
          throw new Error('Refresh token has been revoked');
        }
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Check if token is blacklisted
   */
  static async isTokenBlacklisted(jti: string): Promise<boolean> {
    try {
      const result = await db.select()
        .from(tokenBlacklist)
        .where(and(
          eq(tokenBlacklist.jti, jti),
          gte(tokenBlacklist.expiresAt, new Date())
        ))
        .limit(1);

      return result.length > 0;
    } catch (error) {
      console.error('Error checking token blacklist:', error);
      return false;
    }
  }

  /**
   * Blacklist a token
   */
  static async blacklistToken(jti: string, userId: string, tokenType: 'access' | 'refresh', expiresAt: Date, reason: string = 'logout'): Promise<void> {
    try {
      const blacklistEntry: InsertTokenBlacklist = {
        jti,
        userId,
        tokenType,
        expiresAt,
        reason
      };

      await db.insert(tokenBlacklist).values(blacklistEntry);
    } catch (error) {
      console.error('Error blacklisting token:', error);
      throw new Error('Failed to blacklist token');
    }
  }

  /**
   * Log authentication event (delegated to AuditLogService)
   */
  static async logAuthenticationEvent(
    action: string,
    ipAddress: string,
    userAgent?: string,
    userId?: string,
    userEmail?: string,
    userRole?: string,
    success: boolean = false,
    failureReason?: string,
    sessionId?: string,
    tokenJti?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await AuditLogService.logEvent(
      action,
      ipAddress,
      userAgent,
      userId,
      userEmail,
      userRole,
      success,
      failureReason,
      sessionId,
      tokenJti,
      metadata
    );
  }

  /**
   * Check if user account is locked
   */
  static async isAccountLocked(userId: string): Promise<boolean> {
    try {
      const user = await db.select({ lockedUntil: users.lockedUntil })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) return false;

      const lockedUntil = user[0].lockedUntil;
      return lockedUntil ? new Date() < lockedUntil : false;
    } catch (error) {
      console.error('Error checking account lock status:', error);
      return false;
    }
  }

  /**
   * Increment login attempts and lock account if necessary
   */
  static async handleFailedLogin(userId: string, ipAddress: string, userAgent?: string): Promise<{ locked: boolean; lockoutUntil?: Date }> {
    try {
      // Get current login attempts
      const user = await db.select({ loginAttempts: users.loginAttempts })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        return { locked: false };
      }

      const currentAttempts = user[0].loginAttempts || 0;
      const newAttempts = currentAttempts + 1;

      let lockoutUntil: Date | undefined;
      let locked = false;

      // Lock account if max attempts reached
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        lockoutUntil = new Date(Date.now() + LOCKOUT_TIME_MINUTES * 60 * 1000);
        locked = true;

        await db.update(users)
          .set({
            loginAttempts: newAttempts,
            lockedUntil: lockoutUntil,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        // Log account lockout
        await this.logAuthenticationEvent(
          'account_locked',
          ipAddress,
          userAgent,
          userId,
          undefined,
          undefined,
          true,
          `Account locked after ${newAttempts} failed attempts`,
          undefined,
          undefined,
          { attempts: newAttempts, lockoutUntil: lockoutUntil.toISOString() }
        );
      } else {
        await db.update(users)
          .set({
            loginAttempts: newAttempts,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));
      }

      return { locked, lockoutUntil };
    } catch (error) {
      console.error('Error handling failed login:', error);
      return { locked: false };
    }
  }

  /**
   * Reset login attempts on successful login
   */
  static async resetLoginAttempts(userId: string, ipAddress: string): Promise<void> {
    try {
      await db.update(users)
        .set({
          loginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
          lastLoginIp: ipAddress,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error resetting login attempts:', error);
    }
  }

  /**
   * Create user session
   */
  static async createSession(userId: string, ipAddress: string, userAgent?: string): Promise<string> {
    try {
      const sessionId = `session-${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const sessionData: InsertUserSession = {
        userId,
        sessionId,
        ipAddress,
        userAgent,
        isActive: true,
        expiresAt
      };

      await db.insert(userSessions).values(sessionData);
      return sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  /**
   * Validate and update session
   */
  static async validateSession(sessionId: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      const session = await db.select()
        .from(userSessions)
        .where(and(
          eq(userSessions.sessionId, sessionId),
          eq(userSessions.isActive, true),
          gte(userSessions.expiresAt, new Date())
        ))
        .limit(1);

      if (session.length === 0) {
        return { valid: false };
      }

      // Update last accessed time
      await db.update(userSessions)
        .set({ lastAccessedAt: new Date() })
        .where(eq(userSessions.sessionId, sessionId));

      return { valid: true, userId: session[0].userId };
    } catch (error) {
      console.error('Error validating session:', error);
      return { valid: false };
    }
  }

  /**
   * Invalidate session
   */
  static async invalidateSession(sessionId: string): Promise<void> {
    try {
      await db.update(userSessions)
        .set({ isActive: false })
        .where(eq(userSessions.sessionId, sessionId));
    } catch (error) {
      console.error('Error invalidating session:', error);
    }
  }

  /**
   * Check password against history (delegated to PasswordSecurityService)
   */
  static async isPasswordInHistory(userId: string, newPassword: string): Promise<boolean> {
    return await PasswordSecurityService.isPasswordInHistory(userId, newPassword);
  }

  /**
   * Add password to history (delegated to PasswordSecurityService)
   */
  static async addPasswordToHistory(userId: string, passwordHash: string): Promise<void> {
    await PasswordSecurityService.addPasswordToHistory(userId, passwordHash);
  }

  /**
   * Enhanced login with comprehensive security
   */
  static async login(
    email: string, 
    password: string, 
    ipAddress: string, 
    userAgent?: string,
    useJWT: boolean = true
  ): Promise<AuthenticationResult> {
    try {
      // Log login attempt
      await this.logAuthenticationEvent(
        'login_attempt',
        ipAddress,
        userAgent,
        undefined,
        email,
        undefined,
        false,
        undefined,
        undefined,
        undefined,
        { useJWT }
      );

      // Find user
      const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      if (userResult.length === 0) {
        await this.logAuthenticationEvent(
          'login_failure',
          ipAddress,
          userAgent,
          undefined,
          email,
          undefined,
          false,
          'User not found'
        );
        return { success: false, error: 'Invalid email or password', errorCode: 'INVALID_CREDENTIALS' };
      }

      const user = userResult[0];

      // Check if account is locked
      const isLocked = await this.isAccountLocked(user.id);
      if (isLocked) {
        await this.logAuthenticationEvent(
          'login_failure',
          ipAddress,
          userAgent,
          user.id,
          user.email,
          user.role,
          false,
          'Account locked'
        );
        return { 
          success: false, 
          error: 'Account is temporarily locked due to multiple failed login attempts', 
          errorCode: 'ACCOUNT_LOCKED',
          lockoutUntil: user.lockedUntil || undefined
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        const lockResult = await this.handleFailedLogin(user.id, ipAddress, userAgent);
        
        await this.logAuthenticationEvent(
          'login_failure',
          ipAddress,
          userAgent,
          user.id,
          user.email,
          user.role,
          false,
          'Invalid password'
        );

        return { 
          success: false, 
          error: 'Invalid email or password', 
          errorCode: 'INVALID_CREDENTIALS',
          lockoutUntil: lockResult.lockoutUntil
        };
      }

      // Check if account is active
      if (!user.isActive) {
        await this.logAuthenticationEvent(
          'login_failure',
          ipAddress,
          userAgent,
          user.id,
          user.email,
          user.role,
          false,
          'Account inactive'
        );
        return { success: false, error: 'Account is inactive', errorCode: 'ACCOUNT_INACTIVE' };
      }

      // Reset login attempts on successful login
      await this.resetLoginAttempts(user.id, ipAddress);

      if (useJWT) {
        // Create session
        const sessionId = await this.createSession(user.id, ipAddress, userAgent);

        // Generate tokens
        const accessToken = this.generateAccessToken({
          userId: user.id,
          email: user.email,
          role: user.role as 'buyer' | 'admin' | 'supplier',
          sessionId,
          sessionMetadata: {
            ipAddress,
            userAgent,
            loginTime: Date.now()
          }
        });

        const refreshToken = this.generateRefreshToken({
          userId: user.id,
          sessionId,
          tokenVersion: 1,
          ipAddress
        });

        // Update session with refresh token JTI
        const refreshDecoded = jwt.decode(refreshToken) as any;
        if (refreshDecoded?.jti) {
          await db.update(userSessions)
            .set({ refreshTokenJti: refreshDecoded.jti })
            .where(eq(userSessions.sessionId, sessionId));
        }

        await this.logAuthenticationEvent(
          'login_success',
          ipAddress,
          userAgent,
          user.id,
          user.email,
          user.role,
          true,
          undefined,
          sessionId
        );

        return {
          success: true,
          user,
          accessToken,
          refreshToken
        };
      } else {
        // Session-based login (legacy support)
        await this.logAuthenticationEvent(
          'login_success',
          ipAddress,
          userAgent,
          user.id,
          user.email,
          user.role,
          true,
          undefined,
          undefined,
          undefined,
          { authType: 'session' }
        );

        return {
          success: true,
          user
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      await this.logAuthenticationEvent(
        'login_failure',
        ipAddress,
        userAgent,
        undefined,
        email,
        undefined,
        false,
        'System error'
      );
      return { success: false, error: 'Login failed due to system error', errorCode: 'SYSTEM_ERROR' };
    }
  }

  /**
   * Enhanced token refresh with rotation
   */
  static async refreshToken(refreshToken: string, ipAddress: string, userAgent?: string): Promise<TokenRefreshResult> {
    try {
      const decoded = await this.verifyRefreshToken(refreshToken);

      // Verify user still exists and is active
      const userResult = await db.select({
        id: users.id,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
      }).from(users).where(eq(users.id, decoded.userId)).limit(1);

      if (userResult.length === 0 || !userResult[0].isActive) {
        await this.logAuthenticationEvent(
          'token_refresh',
          ipAddress,
          userAgent,
          decoded.userId,
          undefined,
          undefined,
          false,
          'User not found or inactive'
        );
        return { success: false, error: 'User not found or inactive', errorCode: 'USER_INACTIVE' };
      }

      const user = userResult[0];

      // Validate session
      const sessionValid = await this.validateSession(decoded.sessionId);
      if (!sessionValid.valid) {
        await this.logAuthenticationEvent(
          'token_refresh',
          ipAddress,
          userAgent,
          user.id,
          user.email,
          user.role,
          false,
          'Invalid session'
        );
        return { success: false, error: 'Invalid session', errorCode: 'INVALID_SESSION' };
      }

      // Blacklist old refresh token
      if (decoded.jti && decoded.exp) {
        await this.blacklistToken(
          decoded.jti,
          user.id,
          'refresh',
          new Date(decoded.exp * 1000),
          'token_rotation'
        );
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role as 'buyer' | 'admin' | 'supplier',
        sessionId: decoded.sessionId,
        sessionMetadata: {
          ipAddress,
          userAgent,
          loginTime: Date.now()
        }
      });

      const newRefreshToken = this.generateRefreshToken({
        userId: user.id,
        sessionId: decoded.sessionId,
        tokenVersion: decoded.tokenVersion + 1,
        ipAddress
      });

      // Update session with new refresh token JTI
      const newRefreshDecoded = jwt.decode(newRefreshToken) as any;
      if (newRefreshDecoded?.jti) {
        await db.update(userSessions)
          .set({ 
            refreshTokenJti: newRefreshDecoded.jti,
            lastAccessedAt: new Date()
          })
          .where(eq(userSessions.sessionId, decoded.sessionId));
      }

      await this.logAuthenticationEvent(
        'token_refresh',
        ipAddress,
        userAgent,
        user.id,
        user.email,
        user.role,
        true,
        undefined,
        decoded.sessionId
      );

      return {
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.logAuthenticationEvent(
        'token_refresh',
        ipAddress,
        userAgent,
        undefined,
        undefined,
        undefined,
        false,
        'Invalid refresh token'
      );
      return { success: false, error: 'Invalid refresh token', errorCode: 'INVALID_TOKEN' };
    }
  }

  /**
   * Enhanced logout with token blacklisting
   */
  static async logout(req: Request): Promise<{ success: boolean; message?: string }> {
    try {
      const authHeader = req.headers.authorization;
      const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown') as string;
      const userAgent = req.headers['user-agent'];

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        try {
          const decoded = jwt.decode(token) as any;
          
          if (decoded?.jti && decoded?.exp && decoded?.userId) {
            // Blacklist access token
            await this.blacklistToken(
              decoded.jti,
              decoded.userId,
              'access',
              new Date(decoded.exp * 1000),
              'logout'
            );

            // Invalidate session if present
            if (decoded.sessionId) {
              await this.invalidateSession(decoded.sessionId);
              
              // Find and blacklist associated refresh token
              const session = await db.select({ refreshTokenJti: userSessions.refreshTokenJti })
                .from(userSessions)
                .where(eq(userSessions.sessionId, decoded.sessionId))
                .limit(1);

              if (session.length > 0 && session[0].refreshTokenJti) {
                // Calculate refresh token expiration (7 days from now as fallback)
                const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                await this.blacklistToken(
                  session[0].refreshTokenJti,
                  decoded.userId,
                  'refresh',
                  refreshExpiry,
                  'logout'
                );
              }
            }

            await this.logAuthenticationEvent(
              'logout',
              ipAddress,
              userAgent,
              decoded.userId,
              decoded.email,
              decoded.role,
              true,
              undefined,
              decoded.sessionId,
              decoded.jti
            );
          }
        } catch (tokenError) {
          console.error('Error processing token during logout:', tokenError);
        }
      }

      // Clear session if present
      if (req.session) {
        req.session.destroy(() => {});
      }

      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: 'Logout failed' };
    }
  }

  /**
   * Cleanup expired tokens and sessions
   */
  static async cleanupExpiredData(): Promise<void> {
    try {
      const now = new Date();

      // Remove expired blacklisted tokens
      await db.delete(tokenBlacklist).where(lt(tokenBlacklist.expiresAt, now));

      // Remove expired sessions
      await db.delete(userSessions).where(lt(userSessions.expiresAt, now));

      // Remove old audit logs (keep 90 days)
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      await db.delete(authenticationAuditLogs).where(lt(authenticationAuditLogs.createdAt, ninetyDaysAgo));

      console.log('Authentication data cleanup completed');
    } catch (error) {
      console.error('Error during authentication data cleanup:', error);
    }
  }
}

export default EnhancedAuthService;