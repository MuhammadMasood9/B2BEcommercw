import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { users, supplierProfiles, staffMembers, buyers } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { EnhancedAuthService, EnhancedJWTPayload, EnhancedRefreshTokenPayload } from './enhancedAuthService';

// JWT Configuration
const JWT_SECRET: string = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';
const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret-change-in-production';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN: string = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Enhanced user interface for authentication
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  phone?: string | null;
  role: 'buyer' | 'admin' | 'supplier';
  emailVerified: boolean | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date | null;
  // Enhanced role-specific data
  supplierId?: string;
  supplierStatus?: string;
  membershipTier?: string;
  buyerId?: string;
  isStaffMember?: boolean;
  staffMemberId?: string;
  staffRole?: string;
  staffPermissions?: Record<string, string[]>;
}

export interface TokenData {
  iat: number;
  exp: number;
  jti: string;
}

// Extend Express Request type to include enhanced user data
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
    tokenData?: TokenData;
  }
}

// Re-export enhanced interfaces
export type JWTPayload = EnhancedJWTPayload;
export type RefreshTokenPayload = EnhancedRefreshTokenPayload;

/**
 * Generate JWT access token (delegated to EnhancedAuthService)
 */
export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp' | 'jti'>): string => {
  return EnhancedAuthService.generateAccessToken(payload);
};

/**
 * Generate JWT refresh token (delegated to EnhancedAuthService)
 */
export const generateRefreshToken = (payload: Omit<RefreshTokenPayload, 'iat' | 'exp' | 'jti'>): string => {
  return EnhancedAuthService.generateRefreshToken(payload);
};

/**
 * Verify JWT access token (delegated to EnhancedAuthService)
 */
export const verifyAccessToken = async (token: string): Promise<JWTPayload> => {
  return await EnhancedAuthService.verifyAccessToken(token);
};

/**
 * Verify JWT refresh token (delegated to EnhancedAuthService)
 */
export const verifyRefreshToken = async (token: string): Promise<RefreshTokenPayload> => {
  return await EnhancedAuthService.verifyRefreshToken(token);
};

/**
 * Load enhanced user data based on role
 */
const loadUserData = async (userId: string, role: 'buyer' | 'admin' | 'supplier'): Promise<AuthenticatedUser> => {
  // Get base user data
  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (userResult.length === 0) {
    throw new Error('User not found');
  }

  const user = userResult[0];
  const { password: _, ...userWithoutPassword } = user;
  const enhancedUser: AuthenticatedUser = {
    ...userWithoutPassword,
    role: user.role as 'buyer' | 'admin' | 'supplier',
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
    companyName: user.companyName || undefined,
    phone: user.phone || undefined,
    isActive: user.isActive ?? true,
    emailVerified: user.emailVerified ?? false,
    createdAt: user.createdAt || new Date()
  };

  // Load role-specific data
  if (role === 'supplier') {
    // Check if this is a supplier profile owner
    const supplierResult = await db.select({
      id: supplierProfiles.id,
      status: supplierProfiles.status,
      membershipTier: supplierProfiles.membershipTier,
    }).from(supplierProfiles).where(eq(supplierProfiles.userId, userId)).limit(1);

    if (supplierResult.length > 0) {
      const supplierData = supplierResult[0];
      enhancedUser.supplierId = supplierData.id;
      enhancedUser.supplierStatus = supplierData.status || undefined;
      enhancedUser.membershipTier = supplierData.membershipTier || undefined;
    } else {
      // Check if this is a staff member
      const staffResult = await db.select({
        id: staffMembers.id,
        supplierId: staffMembers.supplierId,
        role: staffMembers.role,
        permissions: staffMembers.permissions,
        isActive: staffMembers.isActive,
      }).from(staffMembers).where(eq(staffMembers.email, user.email)).limit(1);

      if (staffResult.length > 0) {
        const staffData = staffResult[0];
        if (staffData.isActive) {
          enhancedUser.isStaffMember = true;
          enhancedUser.staffMemberId = staffData.id;
          enhancedUser.supplierId = staffData.supplierId || undefined;
          enhancedUser.staffRole = staffData.role || undefined;
          enhancedUser.staffPermissions = staffData.permissions as Record<string, string[]> | undefined;
        }
      }
    }
  } else if (role === 'buyer') {
    // Load buyer-specific data
    const buyerResult = await db.select({
      id: buyers.id,
      companyName: buyers.companyName,
      industry: buyers.industry,
      businessType: buyers.businessType,
    }).from(buyers).where(eq(buyers.userId, userId)).limit(1);

    if (buyerResult.length > 0) {
      const buyerData = buyerResult[0];
      enhancedUser.buyerId = buyerData.id;
      enhancedUser.companyName = buyerData.companyName || enhancedUser.companyName || undefined;
    }
  }

  return enhancedUser;
};

/**
 * JWT Authentication middleware
 */
export const jwtAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = await verifyAccessToken(token);

      // Load enhanced user data
      const userData = await loadUserData(decoded.userId, decoded.role);

      // Attach user data to request
      req.user = userData;
      req.tokenData = {
        iat: decoded.iat!,
        exp: decoded.exp!,
        jti: decoded.jti!
      };

      next();
    } catch (jwtError: unknown) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          error: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      } else if (jwtError instanceof Error && jwtError.message.includes('revoked')) {
        return res.status(401).json({
          error: 'Token has been revoked',
          code: 'TOKEN_REVOKED'
        });
      } else {
        throw jwtError;
      }
    }
  } catch (error) {
    console.error('JWT authentication error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Optional JWT Authentication middleware (doesn't fail if no token)
 */
export const optionalJwtAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = await verifyAccessToken(token);
      const userData = await loadUserData(decoded.userId, decoded.role);

      req.user = userData;
      req.tokenData = {
        iat: decoded.iat!,
        exp: decoded.exp!,
        jti: decoded.jti!
      };
    } catch (jwtError: unknown) {
      // For optional auth, we don't fail on token errors
      const errorMessage = jwtError instanceof Error ? jwtError.message : 'Unknown error';
      console.warn('Optional JWT auth failed:', errorMessage);
    }

    next();
  } catch (error) {
    console.error('Optional JWT authentication error:', error);
    next();
  }
};

/**
 * Session-based authentication middleware (fallback for existing sessions)
 */
export const sessionAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.isAuthenticated && req.isAuthenticated()) {
      // Load enhanced user data for session-based auth
      const sessionUser = req.user as any;
      if (sessionUser && sessionUser.id && sessionUser.role) {
        const userRole = sessionUser.role as 'buyer' | 'admin' | 'supplier';
        const userData = await loadUserData(sessionUser.id, userRole);
        req.user = userData as any;
        return next();
      }
    }

    return res.status(401).json({
      error: 'Authentication required',
      code: 'NO_SESSION'
    });
  } catch (error) {
    console.error('Session authentication error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      code: 'SESSION_ERROR'
    });
  }
};

/**
 * Hybrid authentication middleware (tries JWT first, then session)
 */
export const hybridAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Try JWT authentication first
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return jwtAuthMiddleware(req, res, next);
  }

  // Fall back to session authentication
  return sessionAuthMiddleware(req, res, next);
};

/**
 * Token refresh endpoint handler (delegated to EnhancedAuthService)
 */
export const handleTokenRefresh = async (refreshToken: string, ipAddress: string, userAgent?: string) => {
  const result = await EnhancedAuthService.refreshToken(refreshToken, ipAddress, userAgent);
  
  if (!result.success) {
    throw new Error(result.error || 'Token refresh failed');
  }

  return {
    accessToken: result.accessToken!,
    refreshToken: result.refreshToken!,
    user: result.user!
  };
};

/**
 * Logout handler (delegated to EnhancedAuthService)
 */
export const handleLogout = async (req: Request): Promise<{ success: boolean; message?: string }> => {
  return await EnhancedAuthService.logout(req);
};