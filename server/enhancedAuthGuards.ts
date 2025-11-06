import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { 
  users, 
  supplierProfiles, 
  buyers, 
  staffMembers,
  products,
  orders,
  inquiries,
  quotations,
  rfqs,
  conversations,
  disputes
} from '@shared/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import { AuthenticatedUser } from './authMiddleware';

// Enhanced error codes for detailed responses
export enum AuthorizationErrorCodes {
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  INSUFFICIENT_ROLE = 'INSUFFICIENT_ROLE',
  SUPPLIER_NOT_APPROVED = 'SUPPLIER_NOT_APPROVED',
  SUPPLIER_SUSPENDED = 'SUPPLIER_SUSPENDED',
  STAFF_PERMISSIONS_MISSING = 'STAFF_PERMISSIONS_MISSING',
  INSUFFICIENT_STAFF_PERMISSIONS = 'INSUFFICIENT_STAFF_PERMISSIONS',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ACCESS_DENIED = 'RESOURCE_ACCESS_DENIED',
  SUPPLIER_OWNERSHIP_REQUIRED = 'SUPPLIER_OWNERSHIP_REQUIRED',
  BUYER_OWNERSHIP_REQUIRED = 'BUYER_OWNERSHIP_REQUIRED',
  ADMIN_ACCESS_REQUIRED = 'ADMIN_ACCESS_REQUIRED'
}

// Enhanced error response interface
export interface AuthorizationError {
  error: string;
  code: AuthorizationErrorCodes;
  details?: Record<string, any>;
  required?: Record<string, any>;
  actual?: Record<string, any>;
  timestamp: string;
}

/**
 * Create standardized authorization error response
 */
const createAuthError = (
  code: AuthorizationErrorCodes,
  message: string,
  details?: Record<string, any>,
  required?: Record<string, any>,
  actual?: Record<string, any>
): AuthorizationError => ({
  error: message,
  code,
  details,
  required,
  actual,
  timestamp: new Date().toISOString()
});

/**
 * Enhanced authentication guard with detailed error responses
 */
export const requireEnhancedAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.id) {
    return res.status(401).json(
      createAuthError(
        AuthorizationErrorCodes.AUTH_REQUIRED,
        'Authentication required. Please log in to access this resource.'
      )
    );
  }
  
  if (!req.user.isActive) {
    return res.status(403).json(
      createAuthError(
        AuthorizationErrorCodes.ACCOUNT_INACTIVE,
        'Account is inactive. Please contact support for assistance.',
        { userId: req.user.id }
      )
    );
  }
  
  next();
};

/**
 * Enhanced role-based access control with detailed error responses
 */
export const requireEnhancedRole = (allowedRoles: string[], options?: {
  requireEmailVerification?: boolean;
  requireApprovedSupplier?: boolean;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return res.status(401).json(
        createAuthError(
          AuthorizationErrorCodes.AUTH_REQUIRED,
          'Authentication required'
        )
      );
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(
        createAuthError(
          AuthorizationErrorCodes.INSUFFICIENT_ROLE,
          `Access denied. Required roles: ${allowedRoles.join(', ')}`,
          { userRole: req.user.role },
          { roles: allowedRoles },
          { role: req.user.role }
        )
      );
    }
    
    // Email verification check
    if (options?.requireEmailVerification && !req.user.emailVerified) {
      return res.status(403).json(
        createAuthError(
          AuthorizationErrorCodes.EMAIL_NOT_VERIFIED,
          'Email verification required. Please verify your email address to access this resource.',
          { userId: req.user.id, email: req.user.email }
        )
      );
    }
    
    // Supplier approval check
    if (options?.requireApprovedSupplier && req.user.role === 'supplier') {
      if (!req.user.supplierStatus || req.user.supplierStatus !== 'approved') {
        return res.status(403).json(
          createAuthError(
            AuthorizationErrorCodes.SUPPLIER_NOT_APPROVED,
            'Supplier approval required. Your supplier account must be approved to access this resource.',
            { 
              supplierId: req.user.supplierId,
              currentStatus: req.user.supplierStatus 
            },
            { status: 'approved' },
            { status: req.user.supplierStatus }
          )
        );
      }
    }
    
    next();
  };
};

/**
 * Enhanced supplier status validation middleware
 */
export const requireSupplierStatus = (requiredStatuses: string[], options?: {
  allowStaffAccess?: boolean;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id || req.user.role !== 'supplier') {
        return res.status(403).json(
          createAuthError(
            AuthorizationErrorCodes.INSUFFICIENT_ROLE,
            'Supplier access required',
            { userRole: req.user?.role }
          )
        );
      }
      
      // Check if user is a staff member and staff access is allowed
      if (options?.allowStaffAccess && req.user.isStaffMember) {
        // Verify staff member is active and belongs to an approved supplier
        if (!req.user.supplierId) {
          return res.status(403).json(
            createAuthError(
              AuthorizationErrorCodes.SUPPLIER_OWNERSHIP_REQUIRED,
              'Staff member must be associated with a supplier'
            )
          );
        }
        
        // Get supplier status for staff member's supplier
        const supplierResult = await db.select({ status: supplierProfiles.status })
          .from(supplierProfiles)
          .where(eq(supplierProfiles.id, req.user.supplierId))
          .limit(1);
        
        if (supplierResult.length === 0) {
          return res.status(404).json(
            createAuthError(
              AuthorizationErrorCodes.RESOURCE_NOT_FOUND,
              'Supplier profile not found'
            )
          );
        }
        
        const supplierStatus = supplierResult[0].status;
        
        if (!requiredStatuses.includes(supplierStatus)) {
          return res.status(403).json(
            createAuthError(
              AuthorizationErrorCodes.SUPPLIER_NOT_APPROVED,
              `Supplier status '${supplierStatus}' is not sufficient. Required: ${requiredStatuses.join(', ')}`,
              { supplierId: req.user.supplierId },
              { statuses: requiredStatuses },
              { status: supplierStatus }
            )
          );
        }
        
        return next();
      }
      
      // Regular supplier status check
      if (!req.user.supplierStatus) {
        return res.status(403).json(
          createAuthError(
            AuthorizationErrorCodes.SUPPLIER_NOT_APPROVED,
            'Supplier status not found',
            { supplierId: req.user.supplierId }
          )
        );
      }
      
      if (!requiredStatuses.includes(req.user.supplierStatus)) {
        return res.status(403).json(
          createAuthError(
            AuthorizationErrorCodes.SUPPLIER_NOT_APPROVED,
            `Supplier status '${req.user.supplierStatus}' is not sufficient. Required: ${requiredStatuses.join(', ')}`,
            { supplierId: req.user.supplierId },
            { statuses: requiredStatuses },
            { status: req.user.supplierStatus }
          )
        );
      }
      
      next();
    } catch (error) {
      console.error('Supplier status validation error:', error);
      return res.status(500).json(
        createAuthError(
          AuthorizationErrorCodes.RESOURCE_ACCESS_DENIED,
          'Supplier status validation failed'
        )
      );
    }
  };
};

/**
 * Enhanced staff permission checking middleware
 */
export const requireStaffPermission = (resource: string, action: string, options?: {
  allowOwnerAccess?: boolean;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id || req.user.role !== 'supplier') {
        return res.status(403).json(
          createAuthError(
            AuthorizationErrorCodes.INSUFFICIENT_ROLE,
            'Supplier access required'
          )
        );
      }
      
      // If user is the supplier owner and owner access is allowed, grant access
      if (options?.allowOwnerAccess !== false && req.user.supplierId && !req.user.isStaffMember) {
        return next();
      }
      
      // Check staff permissions
      if (!req.user.isStaffMember || !req.user.staffPermissions) {
        return res.status(403).json(
          createAuthError(
            AuthorizationErrorCodes.STAFF_PERMISSIONS_MISSING,
            'Staff permissions not found. You must be a staff member to access this resource.',
            { 
              userId: req.user.id,
              isStaffMember: req.user.isStaffMember 
            }
          )
        );
      }
      
      const resourcePermissions = req.user.staffPermissions[resource];
      
      if (!resourcePermissions || !resourcePermissions.includes(action)) {
        return res.status(403).json(
          createAuthError(
            AuthorizationErrorCodes.INSUFFICIENT_STAFF_PERMISSIONS,
            `Insufficient staff permissions for ${action} on ${resource}`,
            { 
              staffMemberId: req.user.staffMemberId,
              staffRole: req.user.staffRole 
            },
            { resource, action },
            { permissions: req.user.staffPermissions }
          )
        );
      }
      
      next();
    } catch (error) {
      console.error('Staff permission validation error:', error);
      return res.status(500).json(
        createAuthError(
          AuthorizationErrorCodes.RESOURCE_ACCESS_DENIED,
          'Staff permission validation failed'
        )
      );
    }
  };
};

/**
 * Enhanced resource ownership validation for suppliers
 */
export const requireSupplierOwnership = (getSupplierIdFromRequest: (req: Request) => string | undefined) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id || req.user.role !== 'supplier') {
        return res.status(403).json(
          createAuthError(
            AuthorizationErrorCodes.INSUFFICIENT_ROLE,
            'Supplier access required'
          )
        );
      }
      
      const requestedSupplierId = getSupplierIdFromRequest(req);
      
      if (!requestedSupplierId) {
        return res.status(400).json(
          createAuthError(
            AuthorizationErrorCodes.RESOURCE_NOT_FOUND,
            'Supplier ID not found in request'
          )
        );
      }
      
      // Check if user owns this supplier profile
      if (req.user.supplierId === requestedSupplierId) {
        return next();
      }
      
      // Check if user is a staff member of this supplier
      if (req.user.isStaffMember && req.user.supplierId === requestedSupplierId) {
        return next();
      }
      
      return res.status(403).json(
        createAuthError(
          AuthorizationErrorCodes.SUPPLIER_OWNERSHIP_REQUIRED,
          'Access denied. You can only access your own supplier resources.',
          { 
            userSupplierId: req.user.supplierId,
            requestedSupplierId,
            isStaffMember: req.user.isStaffMember 
          }
        )
      );
    } catch (error) {
      console.error('Supplier ownership validation error:', error);
      return res.status(500).json(
        createAuthError(
          AuthorizationErrorCodes.RESOURCE_ACCESS_DENIED,
          'Ownership validation failed'
        )
      );
    }
  };
};

/**
 * Enhanced resource ownership validation for buyers
 */
export const requireBuyerOwnership = (getBuyerIdFromRequest: (req: Request) => string | undefined) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id || req.user.role !== 'buyer') {
        return res.status(403).json(
          createAuthError(
            AuthorizationErrorCodes.INSUFFICIENT_ROLE,
            'Buyer access required'
          )
        );
      }
      
      const requestedBuyerId = getBuyerIdFromRequest(req);
      
      if (!requestedBuyerId) {
        return res.status(400).json(
          createAuthError(
            AuthorizationErrorCodes.RESOURCE_NOT_FOUND,
            'Buyer ID not found in request'
          )
        );
      }
      
      // Check if user owns this buyer profile
      if (req.user.buyerId === requestedBuyerId) {
        return next();
      }
      
      return res.status(403).json(
        createAuthError(
          AuthorizationErrorCodes.BUYER_OWNERSHIP_REQUIRED,
          'Access denied. You can only access your own buyer resources.',
          { 
            userBuyerId: req.user.buyerId,
            requestedBuyerId 
          }
        )
      );
    } catch (error) {
      console.error('Buyer ownership validation error:', error);
      return res.status(500).json(
        createAuthError(
          AuthorizationErrorCodes.RESOURCE_ACCESS_DENIED,
          'Ownership validation failed'
        )
      );
    }
  };
};

/**
 * Generic resource ownership validation
 */
export const requireResourceOwnership = (
  resourceType: 'product' | 'order' | 'inquiry' | 'quotation' | 'rfq' | 'conversation' | 'dispute',
  getResourceIdFromRequest: (req: Request) => string | undefined
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json(
          createAuthError(
            AuthorizationErrorCodes.AUTH_REQUIRED,
            'Authentication required'
          )
        );
      }
      
      const resourceId = getResourceIdFromRequest(req);
      
      if (!resourceId) {
        return res.status(400).json(
          createAuthError(
            AuthorizationErrorCodes.RESOURCE_NOT_FOUND,
            `${resourceType} ID not found in request`
          )
        );
      }
      
      // Admin has access to all resources
      if (req.user.role === 'admin') {
        return next();
      }
      
      let hasAccess = false;
      
      // Check ownership based on resource type
      switch (resourceType) {
        case 'product':
          hasAccess = await checkProductOwnership(req.user, resourceId);
          break;
        case 'order':
          hasAccess = await checkOrderOwnership(req.user, resourceId);
          break;
        case 'inquiry':
          hasAccess = await checkInquiryOwnership(req.user, resourceId);
          break;
        case 'quotation':
          hasAccess = await checkQuotationOwnership(req.user, resourceId);
          break;
        case 'rfq':
          hasAccess = await checkRFQOwnership(req.user, resourceId);
          break;
        case 'conversation':
          hasAccess = await checkConversationOwnership(req.user, resourceId);
          break;
        case 'dispute':
          hasAccess = await checkDisputeOwnership(req.user, resourceId);
          break;
        default:
          hasAccess = false;
      }
      
      if (!hasAccess) {
        return res.status(403).json(
          createAuthError(
            AuthorizationErrorCodes.RESOURCE_ACCESS_DENIED,
            `Access denied. Insufficient permissions for this ${resourceType}.`,
            { 
              resourceType,
              resourceId,
              userRole: req.user.role,
              userId: req.user.id 
            }
          )
        );
      }
      
      next();
    } catch (error) {
      console.error('Resource ownership validation error:', error);
      return res.status(500).json(
        createAuthError(
          AuthorizationErrorCodes.RESOURCE_ACCESS_DENIED,
          'Resource ownership validation failed'
        )
      );
    }
  };
};

// Helper functions for ownership checks
async function checkProductOwnership(user: AuthenticatedUser, productId: string): Promise<boolean> {
  if (user.role !== 'supplier') return false;
  
  const product = await db.select({ supplierId: products.supplierId })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  
  if (product.length === 0) return false;
  
  return product[0].supplierId === user.supplierId;
}

async function checkOrderOwnership(user: AuthenticatedUser, orderId: string): Promise<boolean> {
  const order = await db.select({
    buyerId: orders.buyerId,
    supplierId: orders.supplierId
  })
  .from(orders)
  .where(eq(orders.id, orderId))
  .limit(1);
  
  if (order.length === 0) return false;
  
  if (user.role === 'buyer') {
    return order[0].buyerId === user.buyerId;
  } else if (user.role === 'supplier') {
    return order[0].supplierId === user.supplierId;
  }
  
  return false;
}

async function checkInquiryOwnership(user: AuthenticatedUser, inquiryId: string): Promise<boolean> {
  const inquiry = await db.select({
    buyerId: inquiries.buyerId,
    supplierId: inquiries.supplierId
  })
  .from(inquiries)
  .where(eq(inquiries.id, inquiryId))
  .limit(1);
  
  if (inquiry.length === 0) return false;
  
  if (user.role === 'buyer') {
    return inquiry[0].buyerId === user.buyerId;
  } else if (user.role === 'supplier') {
    return inquiry[0].supplierId === user.supplierId;
  }
  
  return false;
}

async function checkQuotationOwnership(user: AuthenticatedUser, quotationId: string): Promise<boolean> {
  const quotation = await db.select({
    supplierId: quotations.supplierId,
    rfqId: quotations.rfqId,
    inquiryId: quotations.inquiryId
  })
  .from(quotations)
  .where(eq(quotations.id, quotationId))
  .limit(1);
  
  if (quotation.length === 0) return false;
  
  if (user.role === 'supplier') {
    return quotation[0].supplierId === user.supplierId;
  } else if (user.role === 'buyer') {
    // Check if quotation is for buyer's RFQ or inquiry
    if (quotation[0].rfqId) {
      const rfq = await db.select({ buyerId: rfqs.buyerId })
        .from(rfqs)
        .where(eq(rfqs.id, quotation[0].rfqId))
        .limit(1);
      return rfq.length > 0 && rfq[0].buyerId === user.buyerId;
    }
    
    if (quotation[0].inquiryId) {
      const inquiry = await db.select({ buyerId: inquiries.buyerId })
        .from(inquiries)
        .where(eq(inquiries.id, quotation[0].inquiryId))
        .limit(1);
      return inquiry.length > 0 && inquiry[0].buyerId === user.buyerId;
    }
  }
  
  return false;
}

async function checkRFQOwnership(user: AuthenticatedUser, rfqId: string): Promise<boolean> {
  const rfq = await db.select({ buyerId: rfqs.buyerId })
    .from(rfqs)
    .where(eq(rfqs.id, rfqId))
    .limit(1);
  
  if (rfq.length === 0) return false;
  
  if (user.role === 'buyer') {
    return rfq[0].buyerId === user.buyerId;
  } else if (user.role === 'supplier') {
    // Suppliers can read RFQs but not modify them
    return true;
  }
  
  return false;
}

async function checkConversationOwnership(user: AuthenticatedUser, conversationId: string): Promise<boolean> {
  const conversation = await db.select({
    buyerId: conversations.buyerId,
    supplierId: conversations.supplierId,
    adminId: conversations.adminId
  })
  .from(conversations)
  .where(eq(conversations.id, conversationId))
  .limit(1);
  
  if (conversation.length === 0) return false;
  
  const conv = conversation[0];
  
  if (user.role === 'buyer') {
    return conv.buyerId === user.buyerId;
  } else if (user.role === 'supplier') {
    return conv.supplierId === user.supplierId;
  } else if (user.role === 'admin') {
    return conv.adminId === user.id;
  }
  
  return false;
}

async function checkDisputeOwnership(user: AuthenticatedUser, disputeId: string): Promise<boolean> {
  const dispute = await db.select({
    buyerId: disputes.buyerId,
    supplierId: disputes.supplierId
  })
  .from(disputes)
  .where(eq(disputes.id, disputeId))
  .limit(1);
  
  if (dispute.length === 0) return false;
  
  if (user.role === 'buyer') {
    return dispute[0].buyerId === user.buyerId;
  } else if (user.role === 'supplier') {
    return dispute[0].supplierId === user.supplierId;
  }
  
  return false;
}

// Helper functions for extracting IDs from requests
export const getIdFromParams = (req: Request): string | undefined => {
  return req.params.id;
};

export const getSupplierIdFromParams = (req: Request): string | undefined => {
  return req.params.supplierId || req.params.id;
};

export const getBuyerIdFromParams = (req: Request): string | undefined => {
  return req.params.buyerId || req.params.id;
};

export const getProductIdFromParams = (req: Request): string | undefined => {
  return req.params.productId || req.params.id;
};

export const getOrderIdFromParams = (req: Request): string | undefined => {
  return req.params.orderId || req.params.id;
};

export const getInquiryIdFromParams = (req: Request): string | undefined => {
  return req.params.inquiryId || req.params.id;
};

export const getQuotationIdFromParams = (req: Request): string | undefined => {
  return req.params.quotationId || req.params.id;
};

export const getRFQIdFromParams = (req: Request): string | undefined => {
  return req.params.rfqId || req.params.id;
};

export const getConversationIdFromParams = (req: Request): string | undefined => {
  return req.params.conversationId || req.params.id;
};

export const getDisputeIdFromParams = (req: Request): string | undefined => {
  return req.params.disputeId || req.params.id;
};

// Composite guards for common patterns
export const requireAuthenticatedUser = [requireEnhancedAuth];
export const requireAdminUser = [requireEnhancedAuth, requireEnhancedRole(['admin'])];
export const requireSupplierUser = [requireEnhancedAuth, requireEnhancedRole(['supplier'])];
export const requireBuyerUser = [requireEnhancedAuth, requireEnhancedRole(['buyer'])];
export const requireVerifiedSupplier = [requireEnhancedAuth, requireEnhancedRole(['supplier'], { requireEmailVerification: true })];
export const requireVerifiedBuyer = [requireEnhancedAuth, requireEnhancedRole(['buyer'], { requireEmailVerification: true })];
export const requireApprovedSupplier = [requireEnhancedAuth, requireEnhancedRole(['supplier'], { requireApprovedSupplier: true })];
export const requireMultiRole = (roles: string[]) => [requireEnhancedAuth, requireEnhancedRole(roles)];

export default {
  requireEnhancedAuth,
  requireEnhancedRole,
  requireSupplierStatus,
  requireStaffPermission,
  requireSupplierOwnership,
  requireBuyerOwnership,
  requireResourceOwnership,
  AuthorizationErrorCodes,
  createAuthError
};