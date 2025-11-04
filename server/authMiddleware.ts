import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { users, supplierProfiles, staffMembers, buyers } from '@shared/schema';
import { eq } from 'drizzle-orm';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Extend Express Request type to include enhanced user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        companyName?: string;
        phone?: string;
        role: 'buyer' | 'admin' | 'supplier';
        emailVerified: boolean;
        isActive: boolean;
        createdAt: Date;
        // Enhanced role-specific data
        supplierId?: string;
        supplierStatus?: string;
        membershipTier?: string;
        buyerId?: string;
        isStaffMember?: boolean;
        staffMemberId?: string;
        staffRole?: string;
        staffPermissions?: Record<string, string[]>;
      };
      tokenData?: {
        iat: number;
        exp: number;
        jti: string;
      };
    }
  }
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'buyer' | 'admin' | 'supplier';
  sessionId?: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
  jti?: string;
}

/**
 * Generate JWT access token
 */
export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp' | 'jti'>): string => {
  const jti = `${payload.userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return jwt.sign(
    { ...payload, jti },
    JWT_SECRET,
    { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'b2b-marketplace',
      audience: 'b2b-marketplace-users'
    }
  );
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (payload: Omit<RefreshTokenPayload, 'iat' | 'exp' | 'jti'>): string => {
  const jti = `refresh-${payload.userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return jwt.sign(
    { ...payload, jti },
    JWT_REFRESH_SECRET,
    { 
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'b2b-marketplace',
      audience: 'b2b-marketplace-refresh'
    }
  );
};

/**
 * Verify JWT access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'b2b-marketplace',
      audience: 'b2b-marketplace-users'
    }) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

/**
 * Verify JWT refresh token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'b2b-marketplace',
      audience: 'b2b-marketplace-refresh'
    }) as RefreshTokenPayload;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

/**
 * Load enhanced user data based on role
 */
const loadUserData = async (userId: string, role: string) => {
  // Get base user data
  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (userResult.length === 0) {
    throw new Error('User not found');
  }

  const user = userResult[0];
  const { password: _, ...userWithoutPassword } = user;
  const enhancedUser = { ...userWithoutPassword } as any;

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
      enhancedUser.supplierStatus = supplierData.status;
      enhancedUser.membershipTier = supplierData.membershipTier;
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
          enhancedUser.supplierId = staffData.supplierId;
          enhancedUser.staffRole = staffData.role;
          enhancedUser.staffPermissions = staffData.permissions;
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
      enhancedUser.companyName = buyerData.companyName || enhancedUser.companyName;
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
      const decoded = verifyAccessToken(token);
      
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
    } catch (jwtError) {
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
      const decoded = verifyAccessToken(token);
      const userData = await loadUserData(decoded.userId, decoded.role);
      
      req.user = userData;
      req.tokenData = {
        iat: decoded.iat!,
        exp: decoded.exp!,
        jti: decoded.jti!
      };
    } catch (jwtError) {
      // For optional auth, we don't fail on token errors
      console.warn('Optional JWT auth failed:', jwtError.message);
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
      const userData = await loadUserData(sessionUser.id, sessionUser.role);
      req.user = userData;
      return next();
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
 * Token refresh endpoint handler
 */
export const handleTokenRefresh = async (refreshToken: string) => {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    
    // Verify user still exists and is active
    const userResult = await db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
    }).from(users).where(eq(users.id, decoded.userId)).limit(1);
    
    if (userResult.length === 0 || !userResult[0].isActive) {
      throw new Error('User not found or inactive');
    }
    
    const user = userResult[0];
    
    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: decoded.sessionId
    });
    
    // Optionally generate new refresh token (token rotation)
    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      sessionId: decoded.sessionId,
      tokenVersion: decoded.tokenVersion + 1
    });
    
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

/**
 * Logout handler (invalidate tokens)
 */
export const handleLogout = async (req: Request) => {
  // For JWT-based auth, we could maintain a blacklist of tokens
  // For now, we'll just clear any session data
  if (req.session) {
    req.session.destroy(() => {});
  }
  
  // In a production system, you might want to:
  // 1. Add the token JTI to a blacklist/redis cache
  // 2. Invalidate all refresh tokens for the user
  // 3. Log the logout event for security monitoring
  
  return { success: true };
};