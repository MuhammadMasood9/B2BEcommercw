import { Request } from 'express';
import { db } from './db';
import { 
  users, 
  supplierProfiles, 
  buyers, 
  adminUsers, 
  products, 
  orders, 
  inquiries, 
  quotations, 
  rfqs,
  conversations,
  disputes
} from '@shared/schema';
import { eq, and, or } from 'drizzle-orm';

export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface RolePermissions {
  [resource: string]: string[];
}

/**
 * Role-Based Access Control Service
 */
export class RBACService {
  
  /**
   * Default permissions for each role
   */
  private static readonly DEFAULT_PERMISSIONS: Record<string, RolePermissions> = {
    admin: {
      // Admin has full access to platform management
      suppliers: ['read', 'write', 'approve', 'suspend', 'delete'],
      buyers: ['read', 'write', 'suspend', 'delete'],
      products: ['read', 'write', 'approve', 'reject', 'delete'],
      orders: ['read', 'write', 'cancel', 'refund', 'intervene'],
      disputes: ['read', 'write', 'mediate', 'resolve'],
      commissions: ['read', 'write', 'adjust'],
      payouts: ['read', 'write', 'process'],
      analytics: ['read', 'export'],
      settings: ['read', 'write'],
      users: ['read', 'write', 'suspend', 'delete'],
      reports: ['read', 'generate', 'export'],
      system: ['read', 'write', 'monitor']
    },
    
    supplier: {
      // Supplier manages their own business
      products: ['read', 'write', 'delete'], // Own products only
      orders: ['read', 'write', 'fulfill'], // Own orders only
      inquiries: ['read', 'write', 'respond'], // Received inquiries only
      quotations: ['read', 'write', 'send'], // Own quotations only
      rfqs: ['read', 'respond'], // Relevant RFQs only
      customers: ['read', 'communicate'], // Own customers only
      analytics: ['read'], // Own analytics only
      profile: ['read', 'write'],
      staff: ['read', 'write', 'manage'], // Own staff only
      payouts: ['read'], // Own payouts only
      conversations: ['read', 'write'], // Own conversations only
      disputes: ['read', 'respond'] // Own disputes only
    },
    
    buyer: {
      // Buyer manages their purchasing activities
      products: ['read', 'search', 'favorite'], // All products (read-only)
      orders: ['read', 'write', 'cancel'], // Own orders only
      inquiries: ['read', 'write', 'send'], // Own inquiries only
      quotations: ['read', 'compare', 'accept'], // Received quotations only
      rfqs: ['read', 'write', 'create'], // Own RFQs only
      suppliers: ['read', 'contact'], // All suppliers (read-only)
      profile: ['read', 'write'],
      conversations: ['read', 'write'], // Own conversations only
      disputes: ['read', 'write', 'create'], // Own disputes only
      reviews: ['read', 'write'] // Own reviews only
    }
  };

  /**
   * Check if user has permission for a specific action on a resource
   */
  static async hasPermission(
    userId: string, 
    userRole: string, 
    resource: string, 
    action: string, 
    context?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Get role permissions
      const rolePermissions = this.DEFAULT_PERMISSIONS[userRole];
      
      if (!rolePermissions || !rolePermissions[resource]) {
        return false;
      }
      
      // Check if action is allowed for this role and resource
      if (!rolePermissions[resource].includes(action)) {
        return false;
      }
      
      // Apply context-specific checks
      if (context) {
        return await this.checkContextualPermissions(userId, userRole, resource, action, context);
      }
      
      return true;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  /**
   * Check contextual permissions (ownership, relationships, etc.)
   */
  private static async checkContextualPermissions(
    userId: string,
    userRole: string,
    resource: string,
    action: string,
    context: Record<string, any>
  ): Promise<boolean> {
    try {
      // Admin has access to everything
      if (userRole === 'admin') {
        return true;
      }

      // Resource-specific ownership checks
      switch (resource) {
        case 'products':
          return await this.checkProductAccess(userId, userRole, action, context);
        
        case 'orders':
          return await this.checkOrderAccess(userId, userRole, action, context);
        
        case 'inquiries':
          return await this.checkInquiryAccess(userId, userRole, action, context);
        
        case 'quotations':
          return await this.checkQuotationAccess(userId, userRole, action, context);
        
        case 'rfqs':
          return await this.checkRFQAccess(userId, userRole, action, context);
        
        case 'conversations':
          return await this.checkConversationAccess(userId, userRole, action, context);
        
        case 'disputes':
          return await this.checkDisputeAccess(userId, userRole, action, context);
        
        default:
          return true; // Default allow for other resources
      }
    } catch (error) {
      console.error('Contextual permission check error:', error);
      return false;
    }
  }

  /**
   * Check product access permissions
   */
  private static async checkProductAccess(
    userId: string,
    userRole: string,
    action: string,
    context: Record<string, any>
  ): Promise<boolean> {
    const productId = context.productId || context.id;
    
    if (!productId) {
      return action === 'read' || action === 'search'; // Allow general read/search
    }

    if (userRole === 'supplier') {
      // Suppliers can only manage their own products
      const product = await db.select({ supplierId: products.supplierId })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);
      
      if (product.length === 0) return false;
      
      // Check if user owns this supplier profile or is staff
      const userSupplier = await this.getUserSupplierProfile(userId);
      return userSupplier?.id === product[0].supplierId;
    }
    
    if (userRole === 'buyer') {
      // Buyers can read all products, but can't modify
      return ['read', 'search', 'favorite'].includes(action);
    }
    
    return false;
  }

  /**
   * Check order access permissions
   */
  private static async checkOrderAccess(
    userId: string,
    userRole: string,
    action: string,
    context: Record<string, any>
  ): Promise<boolean> {
    const orderId = context.orderId || context.id;
    
    if (!orderId) {
      return false; // Orders always need specific ID
    }

    const order = await db.select({
      buyerId: orders.buyerId,
      supplierId: orders.supplierId
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
    
    if (order.length === 0) return false;
    
    if (userRole === 'supplier') {
      const userSupplier = await this.getUserSupplierProfile(userId);
      return userSupplier?.id === order[0].supplierId;
    }
    
    if (userRole === 'buyer') {
      const userBuyer = await this.getUserBuyerProfile(userId);
      return userBuyer?.id === order[0].buyerId;
    }
    
    return false;
  }

  /**
   * Check inquiry access permissions
   */
  private static async checkInquiryAccess(
    userId: string,
    userRole: string,
    action: string,
    context: Record<string, any>
  ): Promise<boolean> {
    const inquiryId = context.inquiryId || context.id;
    
    if (!inquiryId) {
      return ['write', 'send', 'create'].includes(action); // Allow creating new inquiries
    }

    const inquiry = await db.select({
      buyerId: inquiries.buyerId,
      supplierId: inquiries.supplierId
    })
    .from(inquiries)
    .where(eq(inquiries.id, inquiryId))
    .limit(1);
    
    if (inquiry.length === 0) return false;
    
    if (userRole === 'supplier') {
      const userSupplier = await this.getUserSupplierProfile(userId);
      return userSupplier?.id === inquiry[0].supplierId;
    }
    
    if (userRole === 'buyer') {
      const userBuyer = await this.getUserBuyerProfile(userId);
      return userBuyer?.id === inquiry[0].buyerId;
    }
    
    return false;
  }

  /**
   * Check quotation access permissions
   */
  private static async checkQuotationAccess(
    userId: string,
    userRole: string,
    action: string,
    context: Record<string, any>
  ): Promise<boolean> {
    const quotationId = context.quotationId || context.id;
    
    if (!quotationId) {
      return ['write', 'send', 'create'].includes(action); // Allow creating new quotations
    }

    const quotation = await db.select({
      supplierId: quotations.supplierId,
      rfqId: quotations.rfqId,
      inquiryId: quotations.inquiryId
    })
    .from(quotations)
    .where(eq(quotations.id, quotationId))
    .limit(1);
    
    if (quotation.length === 0) return false;
    
    if (userRole === 'supplier') {
      const userSupplier = await this.getUserSupplierProfile(userId);
      return userSupplier?.id === quotation[0].supplierId;
    }
    
    if (userRole === 'buyer') {
      // Buyers can access quotations for their RFQs/inquiries
      const userBuyer = await this.getUserBuyerProfile(userId);
      if (!userBuyer) return false;
      
      // Check if this quotation is for buyer's RFQ or inquiry
      if (quotation[0].rfqId) {
        const rfq = await db.select({ buyerId: rfqs.buyerId })
          .from(rfqs)
          .where(eq(rfqs.id, quotation[0].rfqId))
          .limit(1);
        return rfq.length > 0 && rfq[0].buyerId === userBuyer.id;
      }
      
      if (quotation[0].inquiryId) {
        const inquiry = await db.select({ buyerId: inquiries.buyerId })
          .from(inquiries)
          .where(eq(inquiries.id, quotation[0].inquiryId))
          .limit(1);
        return inquiry.length > 0 && inquiry[0].buyerId === userBuyer.id;
      }
    }
    
    return false;
  }

  /**
   * Check RFQ access permissions
   */
  private static async checkRFQAccess(
    userId: string,
    userRole: string,
    action: string,
    context: Record<string, any>
  ): Promise<boolean> {
    const rfqId = context.rfqId || context.id;
    
    if (!rfqId) {
      return ['write', 'create'].includes(action); // Allow creating new RFQs
    }

    const rfq = await db.select({ buyerId: rfqs.buyerId })
      .from(rfqs)
      .where(eq(rfqs.id, rfqId))
      .limit(1);
    
    if (rfq.length === 0) return false;
    
    if (userRole === 'buyer') {
      const userBuyer = await this.getUserBuyerProfile(userId);
      return userBuyer?.id === rfq[0].buyerId;
    }
    
    if (userRole === 'supplier') {
      // Suppliers can read and respond to RFQs (but not modify them)
      return ['read', 'respond'].includes(action);
    }
    
    return false;
  }

  /**
   * Check conversation access permissions
   */
  private static async checkConversationAccess(
    userId: string,
    userRole: string,
    action: string,
    context: Record<string, any>
  ): Promise<boolean> {
    const conversationId = context.conversationId || context.id;
    
    if (!conversationId) {
      return ['write', 'create'].includes(action); // Allow creating new conversations
    }

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
    
    if (userRole === 'buyer') {
      const userBuyer = await this.getUserBuyerProfile(userId);
      return userBuyer?.id === conv.buyerId;
    }
    
    if (userRole === 'supplier') {
      const userSupplier = await this.getUserSupplierProfile(userId);
      return userSupplier?.id === conv.supplierId;
    }
    
    if (userRole === 'admin') {
      return conv.adminId === userId;
    }
    
    return false;
  }

  /**
   * Check dispute access permissions
   */
  private static async checkDisputeAccess(
    userId: string,
    userRole: string,
    action: string,
    context: Record<string, any>
  ): Promise<boolean> {
    const disputeId = context.disputeId || context.id;
    
    if (!disputeId) {
      return ['write', 'create'].includes(action); // Allow creating new disputes
    }

    const dispute = await db.select({
      buyerId: disputes.buyerId,
      supplierId: disputes.supplierId
    })
    .from(disputes)
    .where(eq(disputes.id, disputeId))
    .limit(1);
    
    if (dispute.length === 0) return false;
    
    if (userRole === 'buyer') {
      const userBuyer = await this.getUserBuyerProfile(userId);
      return userBuyer?.id === dispute[0].buyerId;
    }
    
    if (userRole === 'supplier') {
      const userSupplier = await this.getUserSupplierProfile(userId);
      return userSupplier?.id === dispute[0].supplierId;
    }
    
    return false;
  }

  /**
   * Get user's supplier profile
   */
  private static async getUserSupplierProfile(userId: string) {
    const result = await db.select({
      id: supplierProfiles.id,
      status: supplierProfiles.status
    })
    .from(supplierProfiles)
    .where(eq(supplierProfiles.userId, userId))
    .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get user's buyer profile
   */
  private static async getUserBuyerProfile(userId: string) {
    const result = await db.select({
      id: buyers.id
    })
    .from(buyers)
    .where(eq(buyers.userId, userId))
    .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get all permissions for a user role
   */
  static getRolePermissions(role: string): RolePermissions {
    return this.DEFAULT_PERMISSIONS[role] || {};
  }

  /**
   * Check if user can access a specific resource type
   */
  static canAccessResource(userRole: string, resource: string): boolean {
    const permissions = this.DEFAULT_PERMISSIONS[userRole];
    return permissions && permissions[resource] && permissions[resource].length > 0;
  }

  /**
   * Get allowed actions for a user role on a specific resource
   */
  static getAllowedActions(userRole: string, resource: string): string[] {
    const permissions = this.DEFAULT_PERMISSIONS[userRole];
    return permissions && permissions[resource] ? permissions[resource] : [];
  }

  /**
   * Middleware factory for permission checking
   */
  static requirePermission(resource: string, action: string, contextExtractor?: (req: Request) => Record<string, any>) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          return res.status(401).json({ 
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
          });
        }

        const context = contextExtractor ? contextExtractor(req) : {};
        
        const hasPermission = await RBACService.hasPermission(
          req.user.id,
          req.user.role,
          resource,
          action,
          context
        );

        if (!hasPermission) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            code: 'PERMISSION_DENIED',
            required: { resource, action },
            userRole: req.user.role
          });
        }

        next();
      } catch (error) {
        console.error('Permission middleware error:', error);
        res.status(500).json({ 
          error: 'Permission check failed',
          code: 'PERMISSION_ERROR'
        });
      }
    };
  }
}

export default RBACService;