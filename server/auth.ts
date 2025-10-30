import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { users, User, supplierProfiles, staffMembers } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface User {
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
      // Supplier-specific session data
      supplierId?: string;
      supplierStatus?: string;
      membershipTier?: string;
      // Staff member data
      isStaffMember?: boolean;
      staffMemberId?: string;
      staffRole?: string;
      staffPermissions?: Record<string, string[]>;
    }
  }
}

// Configure passport local strategy
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email: string, password: string, done: any) => {
    try {
      // Find user by email
      const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      if (userResult.length === 0) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      const user = userResult[0];

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize user for session
passport.serializeUser((user: any, done: any) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done: any) => {
  try {
    const userResult = await db.select().from(users).where(eq(users.id, id)).limit(1);
    
    if (userResult.length === 0) {
      return done(null, false);
    }

    const user = userResult[0];
    const { password: _, ...userWithoutPassword } = user;
    
    // If user is a supplier, fetch supplier-specific data
    if (user.role === 'supplier') {
      const supplierResult = await db.select({
        id: supplierProfiles.id,
        status: supplierProfiles.status,
        membershipTier: supplierProfiles.membershipTier,
      }).from(supplierProfiles).where(eq(supplierProfiles.userId, user.id)).limit(1);
      
      if (supplierResult.length > 0) {
        const supplierData = supplierResult[0];
        (userWithoutPassword as any).supplierId = supplierData.id;
        (userWithoutPassword as any).supplierStatus = supplierData.status;
        (userWithoutPassword as any).membershipTier = supplierData.membershipTier;
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
            (userWithoutPassword as any).isStaffMember = true;
            (userWithoutPassword as any).staffMemberId = staffData.id;
            (userWithoutPassword as any).supplierId = staffData.supplierId;
            (userWithoutPassword as any).staffRole = staffData.role;
            (userWithoutPassword as any).staffPermissions = staffData.permissions;
          }
        }
      }
    }
    
    done(null, userWithoutPassword);
  } catch (error) {
    done(error);
  }
});

// Auth middleware
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

// Role-specific middleware
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user?.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Forbidden: Admin access required' });
};

export const supplierMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user?.role === 'supplier') {
    return next();
  }
  res.status(403).json({ error: 'Forbidden: Supplier access required' });
};

export const buyerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user?.role === 'buyer') {
    return next();
  }
  res.status(403).json({ error: 'Forbidden: Buyer access required' });
};

// Combined middleware for multiple roles
export const adminOrSupplierMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && (req.user?.role === 'admin' || req.user?.role === 'supplier')) {
    return next();
  }
  res.status(403).json({ error: 'Forbidden: Admin or Supplier access required' });
};

// Generic auth requirement middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

// Role requirement middleware factory
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Forbidden: Requires one of the following roles: ${allowedRoles.join(', ')}` 
      });
    }
    
    next();
  };
};

export { passport };
