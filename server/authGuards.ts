import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { supplierProfiles, buyers, adminUsers } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Base authentication guard - ensures user is authenticated
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.id) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (!req.user.isActive) {
    return res.status(403).json({ 
      error: 'Account is inactive',
      code: 'ACCOUNT_INACTIVE'
    });
  }
  
  next();
};

/**
 * Admin role guard - ensures user is an admin
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.id) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }
  
  if (!req.user.isActive) {
    return res.status(403).json({ 
      error: 'Admin account is inactive',
      code: 'ADMIN_INACTIVE'
    });
  }
  
  next();
};

/**
 * Supplier role guard - ensures user is a supplier
 */
export const requireSupplier = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.id) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (req.user.role !== 'supplier') {
    return res.status(403).json({ 
      error: 'Supplier access required',
      code: 'SUPPLIER_REQUIRED'
    });
  }
  
  if (!req.user.isActive) {
    return res.status(403).json({ 
      error: 'Supplier account is inactive',
      code: 'SUPPLIER_INACTIVE'
    });
  }
  
  next();
};

/**
 * Buyer role guard - ensures user is a buyer
 */
export const requireBuyer = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.id) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (req.user.role !== 'buyer') {
    return res.status(403).json({ 
      error: 'Buyer access required',
      code: 'BUYER_REQUIRED'
    });
  }
  
  if (!req.user.isActive) {
    return res.status(403).json({ 
      error: 'Buyer account is inactive',
      code: 'BUYER_INACTIVE'
    });
  }
  
  next();
};

/**
 * Multiple roles guard - allows access to users with any of the specified roles
 */
export const requireRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        code: 'INSUFFICIENT_ROLE',
        required: allowedRoles,
        actual: req.user.role
      });
    }
    
    if (!req.user.isActive) {
      return res.status(403).json({ 
        error: 'Account is inactive',
        code: 'ACCOUNT_INACTIVE'
      });
    }
    
    next();
  };
};

/**
 * Supplier ownership guard - ensures supplier can only access their own resources
 */
export const requireSupplierOwnership = (getSupplierIdFromRequest: (req: Request) => string | undefined) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id || req.user.role !== 'supplier') {
        return res.status(403).json({ 
          error: 'Supplier access required',
          code: 'SUPPLIER_REQUIRED'
        });
      }
      
      const requestedSupplierId = getSupplierIdFromRequest(req);
      
      if (!requestedSupplierId) {
        return res.status(400).json({ 
          error: 'Supplier ID not found in request',
          code: 'SUPPLIER_ID_MISSING'
        });
      }
      
      // Check if user owns this supplier profile or is a staff member
      if (req.user.supplierId === requestedSupplierId) {
        return next();
      }
      
      // Check if user is a staff member of this supplier
      if (req.user.isStaffMember && req.user.supplierId === requestedSupplierId) {
        return next();
      }
      
      return res.status(403).json({ 
        error: 'Access denied. You can only access your own supplier resources',
        code: 'SUPPLIER_OWNERSHIP_REQUIRED'
      });
    } catch (error) {
      console.error('Supplier ownership validation error:', error);
      return res.status(500).json({ 
        error: 'Ownership validation failed',
        code: 'OWNERSHIP_ERROR'
      });
    }
  };
};

/**
 * Buyer ownership guard - ensures buyer can only access their own resources
 */
export const requireBuyerOwnership = (getBuyerIdFromRequest: (req: Request) => string | undefined) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id || req.user.role !== 'buyer') {
        return res.status(403).json({ 
          error: 'Buyer access required',
          code: 'BUYER_REQUIRED'
        });
      }
      
      const requestedBuyerId = getBuyerIdFromRequest(req);
      
      if (!requestedBuyerId) {
        return res.status(400).json({ 
          error: 'Buyer ID not found in request',
          code: 'BUYER_ID_MISSING'
        });
      }
      
      // Check if user owns this buyer profile
      if (req.user.buyerId === requestedBuyerId) {
        return next();
      }
      
      return res.status(403).json({ 
        error: 'Access denied. You can only access your own buyer resources',
        code: 'BUYER_OWNERSHIP_REQUIRED'
      });
    } catch (error) {
      console.error('Buyer ownership validation error:', error);
      return res.status(500).json({ 
        error: 'Ownership validation failed',
        code: 'OWNERSHIP_ERROR'
      });
    }
  };
};

/**
 * Resource ownership guard - generic ownership validation
 */
export const requireResourceOwnership = (
  resourceType: 'supplier' | 'buyer' | 'order' | 'inquiry' | 'quotation',
  getResourceOwnerFromRequest: (req: Request) => Promise<{ ownerId: string; ownerType: string } | null>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      
      const resourceOwner = await getResourceOwnerFromRequest(req);
      
      if (!resourceOwner) {
        return res.status(404).json({ 
          error: 'Resource not found or access denied',
          code: 'RESOURCE_NOT_FOUND'
        });
      }
      
      // Check ownership based on user role and resource owner
      let hasAccess = false;
      
      if (req.user.role === 'admin') {
        // Admins have access to all resources
        hasAccess = true;
      } else if (req.user.role === 'supplier') {
        // Suppliers can access their own resources
        if (resourceOwner.ownerType === 'supplier' && req.user.supplierId === resourceOwner.ownerId) {
          hasAccess = true;
        }
        // Staff members can access their supplier's resources
        if (req.user.isStaffMember && req.user.supplierId === resourceOwner.ownerId) {
          hasAccess = true;
        }
      } else if (req.user.role === 'buyer') {
        // Buyers can access their own resources
        if (resourceOwner.ownerType === 'buyer' && req.user.buyerId === resourceOwner.ownerId) {
          hasAccess = true;
        }
      }
      
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Access denied. Insufficient permissions for this resource',
          code: 'RESOURCE_ACCESS_DENIED',
          resourceType
        });
      }
      
      next();
    } catch (error) {
      console.error('Resource ownership validation error:', error);
      return res.status(500).json({ 
        error: 'Resource ownership validation failed',
        code: 'OWNERSHIP_ERROR'
      });
    }
  };
};

/**
 * Supplier status guard - ensures supplier has required status
 */
export const requireSupplierStatus = (requiredStatuses: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id || req.user.role !== 'supplier') {
        return res.status(403).json({ 
          error: 'Supplier access required',
          code: 'SUPPLIER_REQUIRED'
        });
      }
      
      if (!req.user.supplierStatus) {
        return res.status(403).json({ 
          error: 'Supplier status not found',
          code: 'SUPPLIER_STATUS_MISSING'
        });
      }
      
      if (!requiredStatuses.includes(req.user.supplierStatus)) {
        return res.status(403).json({ 
          error: `Supplier status '${req.user.supplierStatus}' is not sufficient. Required: ${requiredStatuses.join(', ')}`,
          code: 'INSUFFICIENT_SUPPLIER_STATUS',
          required: requiredStatuses,
          actual: req.user.supplierStatus
        });
      }
      
      next();
    } catch (error) {
      console.error('Supplier status validation error:', error);
      return res.status(500).json({ 
        error: 'Supplier status validation failed',
        code: 'STATUS_ERROR'
      });
    }
  };
};

/**
 * Email verification guard - ensures user has verified email
 */
export const requireEmailVerification = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.id) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (!req.user.emailVerified) {
    return res.status(403).json({ 
      error: 'Email verification required',
      code: 'EMAIL_VERIFICATION_REQUIRED'
    });
  }
  
  next();
};

/**
 * Staff permission guard - validates staff member permissions
 */
export const requireStaffPermission = (resource: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id || req.user.role !== 'supplier') {
      return res.status(403).json({ 
        error: 'Supplier access required',
        code: 'SUPPLIER_REQUIRED'
      });
    }
    
    // If user is the supplier owner, they have all permissions
    if (req.user.supplierId && !req.user.isStaffMember) {
      return next();
    }
    
    // Check staff permissions
    if (!req.user.isStaffMember || !req.user.staffPermissions) {
      return res.status(403).json({ 
        error: 'Staff permissions not found',
        code: 'STAFF_PERMISSIONS_MISSING'
      });
    }
    
    const resourcePermissions = req.user.staffPermissions[resource];
    
    if (!resourcePermissions || !resourcePermissions.includes(action)) {
      return res.status(403).json({ 
        error: `Insufficient staff permissions for ${action} on ${resource}`,
        code: 'INSUFFICIENT_STAFF_PERMISSIONS',
        required: { resource, action },
        available: req.user.staffPermissions
      });
    }
    
    next();
  };
};

/**
 * Development/testing guard - only allows access in development mode
 */
export const requireDevelopment = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ 
      error: 'Not found',
      code: 'NOT_FOUND'
    });
  }
  
  next();
};

// Helper functions for common ownership patterns
export const getSupplierIdFromParams = (req: Request): string | undefined => {
  return req.params.supplierId || req.params.id;
};

export const getBuyerIdFromParams = (req: Request): string | undefined => {
  return req.params.buyerId || req.params.id;
};

export const getSupplierIdFromBody = (req: Request): string | undefined => {
  return req.body.supplierId;
};

export const getBuyerIdFromBody = (req: Request): string | undefined => {
  return req.body.buyerId;
};

export const getUserIdFromParams = (req: Request): string | undefined => {
  return req.params.userId || req.params.id;
};

// Composite guards for common patterns
export const requireSupplierAccess = [requireAuth, requireSupplier];
export const requireBuyerAccess = [requireAuth, requireBuyer];
export const requireAdminAccess = [requireAuth, requireAdmin];
export const requireVerifiedSupplier = [requireAuth, requireSupplier, requireEmailVerification];
export const requireVerifiedBuyer = [requireAuth, requireBuyer, requireEmailVerification];
export const requireApprovedSupplier = [requireAuth, requireSupplier, requireSupplierStatus(['approved'])];