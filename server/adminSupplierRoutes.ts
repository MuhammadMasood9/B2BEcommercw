import { Router } from 'express';
import { db } from './db';
import { 
  supplierProfiles, 
  users, 
  notifications,
  activity_logs,
  products,
  categories,
  InsertNotification,
  InsertActivityLog 
} from '@shared/schema';
import { eq, and, or, ilike, desc, sql, count } from 'drizzle-orm';
import { adminMiddleware } from './auth';
import { z } from 'zod';
import { logAdminActivity } from './adminOversightService';

const router = Router();

// Apply admin middleware to all routes
router.use(adminMiddleware);

// Validation schemas
const supplierApprovalSchema = z.object({
  approvalNotes: z.string().optional(),
});

const supplierRejectionSchema = z.object({
  rejectionReason: z.string().min(1, 'Rejection reason is required'),
  rejectionNotes: z.string().optional(),
});

const supplierStatusUpdateSchema = z.object({
  status: z.enum(['approved', 'suspended', 'active']),
  reason: z.string().optional(),
});

// Helper function to create notifications
async function createNotification(data: InsertNotification) {
  try {
    await db.insert(notifications).values(data);
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

// Helper function to create activity logs
async function createActivityLog(data: InsertActivityLog) {
  try {
    await db.insert(activity_logs).values(data);
  } catch (error) {
    console.error('Failed to create activity log:', error);
  }
}

// GET /api/admin/suppliers/pending - Get pending supplier applications
router.get('/pending', async (req, res) => {
  try {
    const { limit = '20', offset = '0', search } = req.query;
    
    // Build where conditions
    const conditions = [eq(supplierProfiles.status, 'pending')];

    // Add search filter if provided
    if (search) {
      const searchTerm = `%${search}%`;
      const searchConditions = or(
        ilike(supplierProfiles.businessName, searchTerm),
        ilike(supplierProfiles.storeName, searchTerm),
        ilike(supplierProfiles.contactPerson, searchTerm),
        ilike(users.email, searchTerm)
      );
      if (searchConditions) {
        conditions.push(searchConditions);
      }
    }

    let query = db
      .select({
        id: supplierProfiles.id,
        userId: supplierProfiles.userId,
        businessName: supplierProfiles.businessName,
        businessType: supplierProfiles.businessType,
        storeName: supplierProfiles.storeName,
        storeSlug: supplierProfiles.storeSlug,
        contactPerson: supplierProfiles.contactPerson,
        phone: supplierProfiles.phone,
        email: users.email,
        country: supplierProfiles.country,
        city: supplierProfiles.city,
        membershipTier: supplierProfiles.membershipTier,
        verificationLevel: supplierProfiles.verificationLevel,
        verificationDocs: supplierProfiles.verificationDocs,
        status: supplierProfiles.status,
        createdAt: supplierProfiles.createdAt,
      })
      .from(supplierProfiles)
      .innerJoin(users, eq(supplierProfiles.userId, users.id))
      .where(and(...conditions));

    // Get total count for pagination
    const totalResult = await db
      .select({ count: count() })
      .from(supplierProfiles)
      .innerJoin(users, eq(supplierProfiles.userId, users.id))
      .where(and(...conditions));
    
    const total = totalResult[0]?.count || 0;

    // Apply pagination and ordering
    const suppliers = await query
      .orderBy(desc(supplierProfiles.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    res.json({
      suppliers,
      total,
      page: Math.floor(parseInt(offset as string) / parseInt(limit as string)) + 1,
      limit: parseInt(limit as string)
    });

  } catch (error: any) {
    console.error('Error fetching pending suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch pending suppliers' });
  }
});

// GET /api/admin/suppliers - Get all suppliers with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      limit = '20', 
      offset = '0', 
      search, 
      status, 
      membershipTier, 
      verificationLevel,
      country 
    } = req.query;
    
    let query = db
      .select({
        id: supplierProfiles.id,
        userId: supplierProfiles.userId,
        businessName: supplierProfiles.businessName,
        businessType: supplierProfiles.businessType,
        storeName: supplierProfiles.storeName,
        storeSlug: supplierProfiles.storeSlug,
        contactPerson: supplierProfiles.contactPerson,
        phone: supplierProfiles.phone,
        email: users.email,
        country: supplierProfiles.country,
        city: supplierProfiles.city,
        membershipTier: supplierProfiles.membershipTier,
        verificationLevel: supplierProfiles.verificationLevel,
        status: supplierProfiles.status,
        isActive: supplierProfiles.isActive,
        isSuspended: supplierProfiles.isSuspended,
        rating: supplierProfiles.rating,
        totalReviews: supplierProfiles.totalReviews,
        totalProducts: supplierProfiles.totalProducts,
        totalOrders: supplierProfiles.totalOrders,
        totalSales: supplierProfiles.totalSales,
        createdAt: supplierProfiles.createdAt,
        updatedAt: supplierProfiles.updatedAt,
      })
      .from(supplierProfiles)
      .innerJoin(users, eq(supplierProfiles.userId, users.id));

    // Build where conditions
    const conditions = [];

    if (status) {
      conditions.push(eq(supplierProfiles.status, status as string));
    }

    if (membershipTier) {
      conditions.push(eq(supplierProfiles.membershipTier, membershipTier as string));
    }

    if (verificationLevel) {
      conditions.push(eq(supplierProfiles.verificationLevel, verificationLevel as string));
    }

    if (country) {
      conditions.push(eq(supplierProfiles.country, country as string));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          ilike(supplierProfiles.businessName, searchTerm),
          ilike(supplierProfiles.storeName, searchTerm),
          ilike(supplierProfiles.contactPerson, searchTerm),
          ilike(users.email, searchTerm)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    // Get total count for pagination
    let countQuery = db
      .select({ count: count() })
      .from(supplierProfiles)
      .innerJoin(users, eq(supplierProfiles.userId, users.id));

    if (conditions.length > 0) {
      countQuery = countQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    const totalResult = await countQuery;
    const total = totalResult[0]?.count || 0;

    // Apply pagination and ordering
    const suppliers = await query
      .orderBy(desc(supplierProfiles.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    res.json({
      suppliers,
      total,
      page: Math.floor(parseInt(offset as string) / parseInt(limit as string)) + 1,
      limit: parseInt(limit as string)
    });

  } catch (error: any) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// GET /api/admin/suppliers/:id - Get supplier details
router.get('/:id', async (req, res) => {
  try {
    const supplierId = req.params.id;

    const supplierResult = await db
      .select({
        // Supplier profile data
        id: supplierProfiles.id,
        userId: supplierProfiles.userId,
        businessName: supplierProfiles.businessName,
        businessType: supplierProfiles.businessType,
        storeName: supplierProfiles.storeName,
        storeSlug: supplierProfiles.storeSlug,
        storeDescription: supplierProfiles.storeDescription,
        storeLogo: supplierProfiles.storeLogo,
        storeBanner: supplierProfiles.storeBanner,
        contactPerson: supplierProfiles.contactPerson,
        position: supplierProfiles.position,
        phone: supplierProfiles.phone,
        whatsapp: supplierProfiles.whatsapp,
        wechat: supplierProfiles.wechat,
        address: supplierProfiles.address,
        city: supplierProfiles.city,
        country: supplierProfiles.country,
        website: supplierProfiles.website,
        yearEstablished: supplierProfiles.yearEstablished,
        employees: supplierProfiles.employees,
        factorySize: supplierProfiles.factorySize,
        annualRevenue: supplierProfiles.annualRevenue,
        mainProducts: supplierProfiles.mainProducts,
        exportMarkets: supplierProfiles.exportMarkets,
        verificationLevel: supplierProfiles.verificationLevel,
        verificationDocs: supplierProfiles.verificationDocs,
        isVerified: supplierProfiles.isVerified,
        verifiedAt: supplierProfiles.verifiedAt,
        membershipTier: supplierProfiles.membershipTier,
        rating: supplierProfiles.rating,
        totalReviews: supplierProfiles.totalReviews,
        responseRate: supplierProfiles.responseRate,
        responseTime: supplierProfiles.responseTime,
        totalSales: supplierProfiles.totalSales,
        totalOrders: supplierProfiles.totalOrders,
        status: supplierProfiles.status,
        isActive: supplierProfiles.isActive,
        isFeatured: supplierProfiles.isFeatured,
        isSuspended: supplierProfiles.isSuspended,
        suspensionReason: supplierProfiles.suspensionReason,
        customCommissionRate: supplierProfiles.customCommissionRate,
        totalProducts: supplierProfiles.totalProducts,
        totalInquiries: supplierProfiles.totalInquiries,
        storeViews: supplierProfiles.storeViews,
        followers: supplierProfiles.followers,
        createdAt: supplierProfiles.createdAt,
        updatedAt: supplierProfiles.updatedAt,
        // User data
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        emailVerified: users.emailVerified,
        userIsActive: users.isActive,
        userCreatedAt: users.createdAt,
      })
      .from(supplierProfiles)
      .innerJoin(users, eq(supplierProfiles.userId, users.id))
      .where(eq(supplierProfiles.id, supplierId))
      .limit(1);

    if (supplierResult.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({ supplier: supplierResult[0] });

  } catch (error: any) {
    console.error('Error fetching supplier details:', error);
    res.status(500).json({ error: 'Failed to fetch supplier details' });
  }
});

// POST /api/admin/suppliers/:id/approve - Approve supplier application
router.post('/:id/approve', async (req, res) => {
  try {
    const supplierId = req.params.id;
    const adminId = req.user?.id;
    const adminName = req.user?.firstName || req.user?.email || 'Admin';
    
    const validationResult = supplierApprovalSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const { approvalNotes } = validationResult.data;

    // Check if supplier exists and is pending
    const supplierResult = await db
      .select({
        id: supplierProfiles.id,
        userId: supplierProfiles.userId,
        businessName: supplierProfiles.businessName,
        status: supplierProfiles.status,
        email: users.email,
        firstName: users.firstName,
      })
      .from(supplierProfiles)
      .innerJoin(users, eq(supplierProfiles.userId, users.id))
      .where(eq(supplierProfiles.id, supplierId))
      .limit(1);

    if (supplierResult.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const supplier = supplierResult[0];

    if (supplier.status !== 'pending') {
      return res.status(400).json({ 
        error: `Supplier is already ${supplier.status}. Only pending suppliers can be approved.` 
      });
    }

    // Update supplier status to approved
    const updatedSupplier = await db
      .update(supplierProfiles)
      .set({
        status: 'approved',
        isActive: true,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(supplierProfiles.id, supplierId))
      .returning();

    // Create notification for supplier
    await createNotification({
      userId: supplier.userId,
      type: 'success',
      title: 'Supplier Application Approved',
      message: `Congratulations! Your supplier application for "${supplier.businessName}" has been approved. You can now start managing your store and listing products.`,
      relatedId: supplierId,
      relatedType: 'supplier_approval',
    });

    // Create activity log
    await createActivityLog({
      adminId: adminId!,
      adminName,
      action: 'Approved Supplier',
      description: `Approved supplier application for "${supplier.businessName}"${approvalNotes ? `. Notes: ${approvalNotes}` : ''}`,
      entityType: 'supplier',
      entityId: supplierId,
      entityName: supplier.businessName,
    });

    res.json({
      success: true,
      message: 'Supplier approved successfully',
      supplier: updatedSupplier[0],
    });

    // TODO: Send approval email to supplier

  } catch (error: any) {
    console.error('Error approving supplier:', error);
    res.status(500).json({ error: 'Failed to approve supplier' });
  }
});

// POST /api/admin/suppliers/:id/reject - Reject supplier application
router.post('/:id/reject', async (req, res) => {
  try {
    const supplierId = req.params.id;
    const adminId = req.user?.id;
    const adminName = req.user?.firstName || req.user?.email || 'Admin';
    
    const validationResult = supplierRejectionSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const { rejectionReason, rejectionNotes } = validationResult.data;

    // Check if supplier exists and is pending
    const supplierResult = await db
      .select({
        id: supplierProfiles.id,
        userId: supplierProfiles.userId,
        businessName: supplierProfiles.businessName,
        status: supplierProfiles.status,
        email: users.email,
        firstName: users.firstName,
      })
      .from(supplierProfiles)
      .innerJoin(users, eq(supplierProfiles.userId, users.id))
      .where(eq(supplierProfiles.id, supplierId))
      .limit(1);

    if (supplierResult.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const supplier = supplierResult[0];

    if (supplier.status !== 'pending') {
      return res.status(400).json({ 
        error: `Supplier is already ${supplier.status}. Only pending suppliers can be rejected.` 
      });
    }

    // Update supplier status to rejected
    const updatedSupplier = await db
      .update(supplierProfiles)
      .set({
        status: 'rejected',
        suspensionReason: rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(supplierProfiles.id, supplierId))
      .returning();

    // Create notification for supplier
    await createNotification({
      userId: supplier.userId,
      type: 'error',
      title: 'Supplier Application Rejected',
      message: `Your supplier application for "${supplier.businessName}" has been rejected. Reason: ${rejectionReason}. Please contact support if you have questions.`,
      relatedId: supplierId,
      relatedType: 'supplier_rejection',
    });

    // Create activity log
    await createActivityLog({
      adminId: adminId!,
      adminName,
      action: 'Rejected Supplier',
      description: `Rejected supplier application for "${supplier.businessName}". Reason: ${rejectionReason}${rejectionNotes ? `. Notes: ${rejectionNotes}` : ''}`,
      entityType: 'supplier',
      entityId: supplierId,
      entityName: supplier.businessName,
    });

    res.json({
      success: true,
      message: 'Supplier rejected successfully',
      supplier: updatedSupplier[0],
    });

    // TODO: Send rejection email to supplier

  } catch (error: any) {
    console.error('Error rejecting supplier:', error);
    res.status(500).json({ error: 'Failed to reject supplier' });
  }
});

// POST /api/admin/suppliers/:id/suspend - Suspend supplier
router.post('/:id/suspend', async (req, res) => {
  try {
    const supplierId = req.params.id;
    const adminId = req.user?.id;
    const adminName = req.user?.firstName || req.user?.email || 'Admin';
    
    const validationResult = supplierStatusUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const { reason } = validationResult.data;

    // Check if supplier exists
    const supplierResult = await db
      .select({
        id: supplierProfiles.id,
        userId: supplierProfiles.userId,
        businessName: supplierProfiles.businessName,
        status: supplierProfiles.status,
        isSuspended: supplierProfiles.isSuspended,
      })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.id, supplierId))
      .limit(1);

    if (supplierResult.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const supplier = supplierResult[0];

    if (supplier.status !== 'approved') {
      return res.status(400).json({ 
        error: 'Only approved suppliers can be suspended' 
      });
    }

    if (supplier.isSuspended) {
      return res.status(400).json({ 
        error: 'Supplier is already suspended' 
      });
    }

    // Update supplier to suspended
    const updatedSupplier = await db
      .update(supplierProfiles)
      .set({
        status: 'suspended',
        isSuspended: true,
        isActive: false,
        suspensionReason: reason || 'Suspended by administrator',
        updatedAt: new Date(),
      })
      .where(eq(supplierProfiles.id, supplierId))
      .returning();

    // Create notification for supplier
    await createNotification({
      userId: supplier.userId,
      type: 'warning',
      title: 'Account Suspended',
      message: `Your supplier account has been suspended. ${reason ? `Reason: ${reason}` : ''} Please contact support for more information.`,
      relatedId: supplierId,
      relatedType: 'supplier_suspension',
    });

    // Create activity log
    await createActivityLog({
      adminId: adminId!,
      adminName,
      action: 'Suspended Supplier',
      description: `Suspended supplier "${supplier.businessName}"${reason ? `. Reason: ${reason}` : ''}`,
      entityType: 'supplier',
      entityId: supplierId,
      entityName: supplier.businessName,
    });

    res.json({
      success: true,
      message: 'Supplier suspended successfully',
      supplier: updatedSupplier[0],
    });

  } catch (error: any) {
    console.error('Error suspending supplier:', error);
    res.status(500).json({ error: 'Failed to suspend supplier' });
  }
});

// POST /api/admin/suppliers/:id/activate - Activate/unsuspend supplier
router.post('/:id/activate', async (req, res) => {
  try {
    const supplierId = req.params.id;
    const adminId = req.user?.id;
    const adminName = req.user?.firstName || req.user?.email || 'Admin';
    
    // Check if supplier exists
    const supplierResult = await db
      .select({
        id: supplierProfiles.id,
        userId: supplierProfiles.userId,
        businessName: supplierProfiles.businessName,
        status: supplierProfiles.status,
        isSuspended: supplierProfiles.isSuspended,
      })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.id, supplierId))
      .limit(1);

    if (supplierResult.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const supplier = supplierResult[0];

    if (supplier.status !== 'suspended' && !supplier.isSuspended) {
      return res.status(400).json({ 
        error: 'Supplier is not suspended' 
      });
    }

    // Update supplier to active
    const updatedSupplier = await db
      .update(supplierProfiles)
      .set({
        status: 'approved',
        isSuspended: false,
        isActive: true,
        suspensionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(supplierProfiles.id, supplierId))
      .returning();

    // Create notification for supplier
    await createNotification({
      userId: supplier.userId,
      type: 'success',
      title: 'Account Reactivated',
      message: `Your supplier account has been reactivated. You can now resume managing your store and products.`,
      relatedId: supplierId,
      relatedType: 'supplier_activation',
    });

    // Create activity log
    await createActivityLog({
      adminId: adminId!,
      adminName,
      action: 'Activated Supplier',
      description: `Reactivated supplier "${supplier.businessName}"`,
      entityType: 'supplier',
      entityId: supplierId,
      entityName: supplier.businessName,
    });

    res.json({
      success: true,
      message: 'Supplier activated successfully',
      supplier: updatedSupplier[0],
    });

  } catch (error: any) {
    console.error('Error activating supplier:', error);
    res.status(500).json({ error: 'Failed to activate supplier' });
  }
});

// GET /api/admin/suppliers/stats/overview - Get supplier statistics
router.get('/stats/overview', async (req, res) => {
  try {
    // Get supplier counts by status
    const statusStats = await db
      .select({
        status: supplierProfiles.status,
        count: count(),
      })
      .from(supplierProfiles)
      .groupBy(supplierProfiles.status);

    // Get membership tier distribution
    const tierStats = await db
      .select({
        tier: supplierProfiles.membershipTier,
        count: count(),
      })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.status, 'approved'))
      .groupBy(supplierProfiles.membershipTier);

    // Get verification level distribution
    const verificationStats = await db
      .select({
        level: supplierProfiles.verificationLevel,
        count: count(),
      })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.status, 'approved'))
      .groupBy(supplierProfiles.verificationLevel);

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRegistrations = await db
      .select({ count: count() })
      .from(supplierProfiles)
      .where(sql`${supplierProfiles.createdAt} >= ${thirtyDaysAgo}`);

    const stats = {
      statusDistribution: statusStats.reduce((acc, stat) => {
        if (stat.status) {
          acc[stat.status] = Number(stat.count);
        }
        return acc;
      }, {} as Record<string, number>),
      membershipTiers: tierStats.reduce((acc, stat) => {
        if (stat.tier) {
          acc[stat.tier] = Number(stat.count);
        }
        return acc;
      }, {} as Record<string, number>),
      verificationLevels: verificationStats.reduce((acc, stat) => {
        if (stat.level) {
          acc[stat.level] = Number(stat.count);
        }
        return acc;
      }, {} as Record<string, number>),
      recentRegistrations: Number(recentRegistrations[0]?.count || 0),
    };

    res.json(stats);

  } catch (error: any) {
    console.error('Error fetching supplier statistics:', error);
    res.status(500).json({ error: 'Failed to fetch supplier statistics' });
  }
});

// ==================== PRODUCT APPROVAL ENDPOINTS ====================

// GET /api/admin/suppliers/products/pending - Get products pending approval
router.get('/products/pending', adminMiddleware, async (req, res) => {
  try {
    const { limit, offset, supplierId } = req.query;
    
    // Build query conditions
    const conditions = [eq(products.status, 'pending_approval')];
    
    if (supplierId) {
      conditions.push(eq(products.supplierId, supplierId as string));
    }
    
    let query = db.select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      categoryId: products.categoryId,
      images: products.images,
      supplierId: products.supplierId,
      status: products.status,
      minOrderQuantity: products.minOrderQuantity,
      priceRanges: products.priceRanges,
      sampleAvailable: products.sampleAvailable,
      samplePrice: products.samplePrice,
      inStock: products.inStock,
      stockQuantity: products.stockQuantity,
      createdAt: products.createdAt,
      // Supplier information
      supplierBusinessName: supplierProfiles.businessName,
      supplierStoreName: supplierProfiles.storeName,
      supplierStoreSlug: supplierProfiles.storeSlug,
      supplierMembershipTier: supplierProfiles.membershipTier,
      // Category information
      categoryName: categories.name
    })
    .from(products)
    .leftJoin(supplierProfiles, eq(products.supplierId, supplierProfiles.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(products.createdAt));
    
    // Add pagination
    if (limit) {
      query = query.limit(parseInt(limit as string));
    }
    if (offset) {
      query = query.offset(parseInt(offset as string));
    }
    
    const pendingProducts = await query;
    
    // Get total count
    const [{ count }] = await db.select({ count: sql`count(*)` })
      .from(products)
      .where(and(...conditions));
    
    res.json({
      success: true,
      products: pendingProducts,
      total: parseInt(count as string),
      page: offset ? Math.floor(parseInt(offset as string) / (parseInt(limit as string) || 20)) + 1 : 1,
      limit: limit ? parseInt(limit as string) : pendingProducts.length
    });
    
  } catch (error: any) {
    console.error('Get pending products error:', error);
    res.status(500).json({ error: 'Failed to get pending products' });
  }
});

// POST /api/admin/suppliers/products/:id/approve - Approve product
router.post('/products/:id/approve', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;
    
    // Get product details
    const productResult = await db.select({
      id: products.id,
      name: products.name,
      supplierId: products.supplierId,
      status: products.status
    })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
    
    if (productResult.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = productResult[0];
    
    if (product.status !== 'pending_approval') {
      return res.status(400).json({ error: 'Product is not pending approval' });
    }
    
    // Approve product
    const [approvedProduct] = await db.update(products)
      .set({
        status: 'approved',
        isApproved: true,
        isPublished: true,
        approvedAt: new Date(),
        approvedBy: adminId,
        rejectionReason: null,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();
    
    // Log admin activity
    await logAdminActivity(
      adminId!,
      req.user?.firstName + ' ' + req.user?.lastName || 'Admin',
      'approve',
      `Approved product: ${product.name}`,
      'product',
      product.id,
      product.name,
      req.ip,
      req.get('User-Agent')
    );
    
    // TODO: Send notification to supplier about approval
    
    res.json({
      success: true,
      message: 'Product approved successfully',
      product: approvedProduct
    });
    
  } catch (error: any) {
    console.error('Approve product error:', error);
    res.status(500).json({ error: 'Failed to approve product' });
  }
});

// POST /api/admin/suppliers/products/:id/reject - Reject product
router.post('/products/:id/reject', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.id;
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    // Get product details
    const productResult = await db.select({
      id: products.id,
      name: products.name,
      supplierId: products.supplierId,
      status: products.status
    })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
    
    if (productResult.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = productResult[0];
    
    if (product.status !== 'pending_approval') {
      return res.status(400).json({ error: 'Product is not pending approval' });
    }
    
    // Reject product
    const [rejectedProduct] = await db.update(products)
      .set({
        status: 'rejected',
        isApproved: false,
        isPublished: false,
        rejectionReason: reason.trim(),
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();
    
    // Log admin activity
    await logAdminActivity(
      adminId!,
      req.user?.firstName + ' ' + req.user?.lastName || 'Admin',
      'reject',
      `Rejected product: ${product.name} - Reason: ${reason}`,
      'product',
      product.id,
      product.name,
      req.ip,
      req.get('User-Agent')
    );
    
    // TODO: Send notification to supplier about rejection
    
    res.json({
      success: true,
      message: 'Product rejected successfully',
      product: rejectedProduct
    });
    
  } catch (error: any) {
    console.error('Reject product error:', error);
    res.status(500).json({ error: 'Failed to reject product' });
  }
});

// GET /api/admin/suppliers/products - Get all supplier products with filtering
router.get('/products', adminMiddleware, async (req, res) => {
  try {
    const { status, supplierId, categoryId, limit, offset, search } = req.query;
    
    // Build query conditions
    const conditions = [];
    
    // Only show products from suppliers (exclude admin-created products)
    conditions.push(sql`${products.supplierId} IS NOT NULL`);
    
    if (status) {
      conditions.push(eq(products.status, status as string));
    }
    if (supplierId) {
      conditions.push(eq(products.supplierId, supplierId as string));
    }
    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId as string));
    }
    
    let query = db.select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      categoryId: products.categoryId,
      images: products.images,
      supplierId: products.supplierId,
      status: products.status,
      isApproved: products.isApproved,
      approvedAt: products.approvedAt,
      rejectionReason: products.rejectionReason,
      minOrderQuantity: products.minOrderQuantity,
      priceRanges: products.priceRanges,
      inStock: products.inStock,
      stockQuantity: products.stockQuantity,
      isPublished: products.isPublished,
      isFeatured: products.isFeatured,
      views: products.views,
      inquiries: products.inquiries,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      // Supplier information
      supplierBusinessName: supplierProfiles.businessName,
      supplierStoreName: supplierProfiles.storeName,
      supplierMembershipTier: supplierProfiles.membershipTier,
      // Category information
      categoryName: categories.name
    })
    .from(products)
    .leftJoin(supplierProfiles, eq(products.supplierId, supplierProfiles.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions));
    
    // Add search filter
    if (search) {
      const searchPattern = `%${search}%`;
      query = query.where(and(
        ...conditions,
        or(
          ilike(products.name, searchPattern),
          ilike(products.description, searchPattern),
          ilike(supplierProfiles.businessName, searchPattern),
          ilike(supplierProfiles.storeName, searchPattern)
        )
      ));
    }
    
    // Add ordering
    query = query.orderBy(desc(products.createdAt));
    
    // Add pagination
    if (limit) {
      query = query.limit(parseInt(limit as string));
    }
    if (offset) {
      query = query.offset(parseInt(offset as string));
    }
    
    const supplierProducts = await query;
    
    // Get total count
    let countQuery = db.select({ count: sql`count(*)` })
      .from(products)
      .leftJoin(supplierProfiles, eq(products.supplierId, supplierProfiles.id))
      .where(and(...conditions));
    
    if (search) {
      const searchPattern = `%${search}%`;
      countQuery = countQuery.where(and(
        ...conditions,
        or(
          ilike(products.name, searchPattern),
          ilike(products.description, searchPattern),
          ilike(supplierProfiles.businessName, searchPattern),
          ilike(supplierProfiles.storeName, searchPattern)
        )
      ));
    }
    
    const [{ count }] = await countQuery;
    
    res.json({
      success: true,
      products: supplierProducts,
      total: parseInt(count as string),
      page: offset ? Math.floor(parseInt(offset as string) / (parseInt(limit as string) || 20)) + 1 : 1,
      limit: limit ? parseInt(limit as string) : supplierProducts.length
    });
    
  } catch (error: any) {
    console.error('Get supplier products error:', error);
    res.status(500).json({ error: 'Failed to get supplier products' });
  }
});

// ==================== ENHANCED SUPPLIER APPROVAL WORKFLOW ====================

// Enhanced supplier approval schema with risk assessment
const enhancedSupplierApprovalSchema = z.object({
  approvalNotes: z.string().optional(),
  riskAssessment: z.object({
    businessVerification: z.enum(['verified', 'partial', 'unverified']),
    documentQuality: z.enum(['excellent', 'good', 'fair', 'poor']),
    businessHistory: z.enum(['established', 'moderate', 'new', 'unknown']),
    financialStability: z.enum(['strong', 'stable', 'weak', 'unknown']),
    complianceRisk: z.enum(['low', 'medium', 'high']),
    overallRisk: z.enum(['low', 'medium', 'high', 'critical']),
    riskFactors: z.array(z.string()).optional(),
    mitigationMeasures: z.array(z.string()).optional(),
  }).optional(),
  membershipTier: z.enum(['free', 'silver', 'gold', 'platinum']).optional(),
  customCommissionRate: z.number().min(0).max(100).optional(),
  verificationLevel: z.enum(['none', 'basic', 'business', 'premium', 'trade_assurance']).optional(),
  conditions: z.array(z.string()).optional(),
});

// Document verification schema
const documentVerificationSchema = z.object({
  businessLicense: z.object({
    status: z.enum(['verified', 'rejected', 'pending']),
    notes: z.string().optional(),
  }).optional(),
  taxRegistration: z.object({
    status: z.enum(['verified', 'rejected', 'pending']),
    notes: z.string().optional(),
  }).optional(),
  identityDocument: z.object({
    status: z.enum(['verified', 'rejected', 'pending']),
    notes: z.string().optional(),
  }).optional(),
});

// POST /api/admin/suppliers/enhanced-approval - Enhanced supplier approval with risk assessment
router.post('/enhanced-approval', async (req, res) => {
  try {
    const { supplierId, ...approvalData } = req.body;
    const adminId = req.user?.id;
    const adminName = req.user?.firstName || req.user?.email || 'Admin';
    
    if (!supplierId) {
      return res.status(400).json({ error: 'Supplier ID is required' });
    }

    const validationResult = enhancedSupplierApprovalSchema.safeParse(approvalData);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const { 
      approvalNotes, 
      riskAssessment, 
      membershipTier, 
      customCommissionRate, 
      verificationLevel,
      conditions 
    } = validationResult.data;

    // Check if supplier exists and is pending
    const supplierResult = await db
      .select({
        id: supplierProfiles.id,
        userId: supplierProfiles.userId,
        businessName: supplierProfiles.businessName,
        status: supplierProfiles.status,
        verificationDocs: supplierProfiles.verificationDocs,
        email: users.email,
        firstName: users.firstName,
      })
      .from(supplierProfiles)
      .innerJoin(users, eq(supplierProfiles.userId, users.id))
      .where(eq(supplierProfiles.id, supplierId))
      .limit(1);

    if (supplierResult.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const supplier = supplierResult[0];

    if (supplier.status !== 'pending') {
      return res.status(400).json({ 
        error: `Supplier is already ${supplier.status}. Only pending suppliers can be approved.` 
      });
    }

    // Perform automated document verification
    const documentVerification = await performDocumentVerification(supplier.verificationDocs);
    
    // Calculate risk score
    const riskScore = calculateSupplierRiskScore(supplier, riskAssessment, documentVerification);
    
    // Determine approval decision based on risk assessment
    const approvalDecision = determineApprovalDecision(riskScore, riskAssessment);

    // Prepare update data
    const updateData: any = {
      status: approvalDecision.status,
      isActive: approvalDecision.status === 'approved',
      verifiedAt: approvalDecision.status === 'approved' ? new Date() : null,
      updatedAt: new Date(),
    };

    // Set membership tier and verification level if provided
    if (membershipTier) {
      updateData.membershipTier = membershipTier;
    }
    if (verificationLevel) {
      updateData.verificationLevel = verificationLevel;
      updateData.isVerified = verificationLevel !== 'none';
    }
    if (customCommissionRate !== undefined) {
      updateData.customCommissionRate = customCommissionRate;
    }

    // Update supplier status
    const updatedSupplier = await db
      .update(supplierProfiles)
      .set(updateData)
      .where(eq(supplierProfiles.id, supplierId))
      .returning();

    // Create detailed notification for supplier
    const notificationMessage = createApprovalNotificationMessage(
      supplier.businessName,
      approvalDecision,
      conditions,
      riskAssessment
    );

    await createNotification({
      userId: supplier.userId,
      type: approvalDecision.status === 'approved' ? 'success' : 'warning',
      title: `Supplier Application ${approvalDecision.status === 'approved' ? 'Approved' : 'Conditionally Approved'}`,
      message: notificationMessage,
      relatedId: supplierId,
      relatedType: 'supplier_approval',
    });

    // Create comprehensive activity log
    const activityDescription = createApprovalActivityDescription(
      supplier.businessName,
      approvalDecision,
      riskScore,
      approvalNotes,
      conditions
    );

    await createActivityLog({
      adminId: adminId!,
      adminName,
      action: 'Enhanced Supplier Approval',
      description: activityDescription,
      entityType: 'supplier',
      entityId: supplierId,
      entityName: supplier.businessName,
    });

    res.json({
      success: true,
      message: `Supplier ${approvalDecision.status} successfully`,
      supplier: updatedSupplier[0],
      approvalDecision: {
        status: approvalDecision.status,
        riskScore,
        riskLevel: riskScore.level,
        documentVerification,
        conditions: conditions || [],
        nextSteps: approvalDecision.nextSteps,
      },
    });

  } catch (error: any) {
    console.error('Error in enhanced supplier approval:', error);
    res.status(500).json({ error: 'Failed to process supplier approval' });
  }
});

// POST /api/admin/suppliers/document-verification - Document verification service
router.post('/document-verification', async (req, res) => {
  try {
    const { supplierId, documentVerifications } = req.body;
    const adminId = req.user?.id;
    const adminName = req.user?.firstName || req.user?.email || 'Admin';

    if (!supplierId) {
      return res.status(400).json({ error: 'Supplier ID is required' });
    }

    const validationResult = documentVerificationSchema.safeParse(documentVerifications);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    // Get supplier
    const supplierResult = await db
      .select({
        id: supplierProfiles.id,
        businessName: supplierProfiles.businessName,
        verificationDocs: supplierProfiles.verificationDocs,
      })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.id, supplierId))
      .limit(1);

    if (supplierResult.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const supplier = supplierResult[0];

    // Update verification status in supplier's verification docs
    const currentDocs = supplier.verificationDocs || {};
    const updatedDocs = {
      ...currentDocs,
      verificationStatus: {
        ...currentDocs.verificationStatus,
        ...documentVerifications,
        lastVerifiedBy: adminId,
        lastVerifiedAt: new Date().toISOString(),
      }
    };

    // Update supplier profile
    await db
      .update(supplierProfiles)
      .set({
        verificationDocs: updatedDocs,
        updatedAt: new Date(),
      })
      .where(eq(supplierProfiles.id, supplierId));

    // Log activity
    await createActivityLog({
      adminId: adminId!,
      adminName,
      action: 'Document Verification',
      description: `Updated document verification status for supplier "${supplier.businessName}"`,
      entityType: 'supplier',
      entityId: supplierId,
      entityName: supplier.businessName,
    });

    res.json({
      success: true,
      message: 'Document verification updated successfully',
      verificationStatus: updatedDocs.verificationStatus,
    });

  } catch (error: any) {
    console.error('Error updating document verification:', error);
    res.status(500).json({ error: 'Failed to update document verification' });
  }
});

// GET /api/admin/suppliers/:id/risk-assessment - Get supplier risk assessment
router.get('/:id/risk-assessment', async (req, res) => {
  try {
    const supplierId = req.params.id;

    // Get supplier details
    const supplierResult = await db
      .select({
        id: supplierProfiles.id,
        businessName: supplierProfiles.businessName,
        businessType: supplierProfiles.businessType,
        verificationDocs: supplierProfiles.verificationDocs,
        verificationLevel: supplierProfiles.verificationLevel,
        membershipTier: supplierProfiles.membershipTier,
        rating: supplierProfiles.rating,
        totalReviews: supplierProfiles.totalReviews,
        totalSales: supplierProfiles.totalSales,
        totalOrders: supplierProfiles.totalOrders,
        createdAt: supplierProfiles.createdAt,
        country: supplierProfiles.country,
        yearEstablished: supplierProfiles.yearEstablished,
      })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.id, supplierId))
      .limit(1);

    if (supplierResult.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const supplier = supplierResult[0];

    // Perform comprehensive risk assessment
    const riskAssessment = await performComprehensiveRiskAssessment(supplier);

    res.json({
      success: true,
      riskAssessment,
    });

  } catch (error: any) {
    console.error('Error getting supplier risk assessment:', error);
    res.status(500).json({ error: 'Failed to get supplier risk assessment' });
  }
});

// Helper functions for enhanced approval workflow

async function performDocumentVerification(verificationDocs: any): Promise<any> {
  const verification = {
    businessLicense: { status: 'pending', score: 0, issues: [] as string[] },
    taxRegistration: { status: 'pending', score: 0, issues: [] as string[] },
    identityDocument: { status: 'pending', score: 0, issues: [] as string[] },
    overallScore: 0,
  };

  if (!verificationDocs) {
    return {
      ...verification,
      businessLicense: { status: 'missing', score: 0, issues: ['Document not provided'] },
      taxRegistration: { status: 'missing', score: 0, issues: ['Document not provided'] },
      identityDocument: { status: 'missing', score: 0, issues: ['Document not provided'] },
    };
  }

  // Simulate document verification (in production, this would use AI/ML services)
  let totalScore = 0;
  let documentCount = 0;

  if (verificationDocs.businessLicense) {
    verification.businessLicense = {
      status: 'verified',
      score: 85 + Math.random() * 15, // Mock score
      issues: [],
    };
    totalScore += verification.businessLicense.score;
    documentCount++;
  }

  if (verificationDocs.taxRegistration) {
    verification.taxRegistration = {
      status: 'verified',
      score: 80 + Math.random() * 20, // Mock score
      issues: [],
    };
    totalScore += verification.taxRegistration.score;
    documentCount++;
  }

  if (verificationDocs.identityDocument) {
    verification.identityDocument = {
      status: 'verified',
      score: 90 + Math.random() * 10, // Mock score
      issues: [],
    };
    totalScore += verification.identityDocument.score;
    documentCount++;
  }

  verification.overallScore = documentCount > 0 ? totalScore / documentCount : 0;

  return verification;
}

function calculateSupplierRiskScore(supplier: any, riskAssessment: any, documentVerification: any) {
  let riskScore = 0;
  const factors: string[] = [];

  // Document verification score (30% weight)
  const docScore = documentVerification.overallScore || 0;
  if (docScore < 60) {
    riskScore += 30;
    factors.push('Poor document verification score');
  } else if (docScore < 80) {
    riskScore += 15;
    factors.push('Moderate document verification concerns');
  }

  // Business history (25% weight)
  if (riskAssessment?.businessHistory === 'new') {
    riskScore += 20;
    factors.push('New business with limited history');
  } else if (riskAssessment?.businessHistory === 'unknown') {
    riskScore += 25;
    factors.push('Unknown business history');
  }

  // Financial stability (20% weight)
  if (riskAssessment?.financialStability === 'weak') {
    riskScore += 20;
    factors.push('Weak financial stability indicators');
  } else if (riskAssessment?.financialStability === 'unknown') {
    riskScore += 15;
    factors.push('Unknown financial stability');
  }

  // Compliance risk (15% weight)
  if (riskAssessment?.complianceRisk === 'high') {
    riskScore += 15;
    factors.push('High compliance risk');
  } else if (riskAssessment?.complianceRisk === 'medium') {
    riskScore += 8;
    factors.push('Medium compliance risk');
  }

  // Geographic risk (10% weight)
  const highRiskCountries = ['Unknown', 'Unspecified'];
  if (highRiskCountries.includes(supplier.country || '')) {
    riskScore += 10;
    factors.push('High-risk geographic location');
  }

  // Determine risk level
  let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (riskScore >= 70) {
    level = 'critical';
  } else if (riskScore >= 50) {
    level = 'high';
  } else if (riskScore >= 25) {
    level = 'medium';
  }

  return {
    score: riskScore,
    level,
    factors,
    documentScore: docScore,
    recommendations: generateRiskRecommendations(riskScore, level, factors),
  };
}

function determineApprovalDecision(riskScore: any, riskAssessment: any) {
  if (riskScore.level === 'critical' || riskScore.score >= 80) {
    return {
      status: 'rejected',
      reason: 'High risk profile exceeds acceptable thresholds',
      nextSteps: [
        'Provide additional documentation',
        'Complete enhanced verification process',
        'Submit business references',
      ],
    };
  }

  if (riskScore.level === 'high' || riskScore.score >= 50) {
    return {
      status: 'conditional_approval',
      reason: 'Approved with conditions due to elevated risk factors',
      nextSteps: [
        'Complete additional verification within 30 days',
        'Provide monthly compliance reports',
        'Limited initial product listing capacity',
      ],
    };
  }

  return {
    status: 'approved',
    reason: 'Low risk profile meets all approval criteria',
    nextSteps: [
      'Complete supplier onboarding process',
      'Set up payment and commission details',
      'Begin product listing and store setup',
    ],
  };
}

function generateRiskRecommendations(riskScore: number, level: string, factors: string[]): string[] {
  const recommendations: string[] = [];

  if (level === 'critical' || level === 'high') {
    recommendations.push('Require enhanced due diligence');
    recommendations.push('Implement additional monitoring measures');
    recommendations.push('Request additional documentation');
  }

  if (factors.includes('Poor document verification score')) {
    recommendations.push('Request re-submission of documents with better quality');
  }

  if (factors.includes('New business with limited history')) {
    recommendations.push('Require business references and bank statements');
    recommendations.push('Start with limited product listing capacity');
  }

  if (factors.includes('Weak financial stability indicators')) {
    recommendations.push('Request financial statements and credit reports');
    recommendations.push('Consider requiring security deposit');
  }

  if (level === 'medium') {
    recommendations.push('Implement standard monitoring procedures');
    recommendations.push('Schedule quarterly compliance reviews');
  }

  if (level === 'low') {
    recommendations.push('Apply standard onboarding process');
    recommendations.push('Implement routine monitoring');
  }

  return recommendations;
}

function createApprovalNotificationMessage(
  businessName: string,
  approvalDecision: any,
  conditions?: string[],
  riskAssessment?: any
): string {
  let message = `Your supplier application for "${businessName}" has been ${approvalDecision.status}.`;

  if (approvalDecision.status === 'approved') {
    message += ' You can now start managing your store and listing products.';
  } else if (approvalDecision.status === 'conditional_approval') {
    message += ' Please note the following conditions that must be met:';
    if (conditions && conditions.length > 0) {
      message += '\n\nConditions:\n' + conditions.map(c => `• ${c}`).join('\n');
    }
  } else {
    message += ` Reason: ${approvalDecision.reason}`;
    if (approvalDecision.nextSteps && approvalDecision.nextSteps.length > 0) {
      message += '\n\nNext steps:\n' + approvalDecision.nextSteps.map((s: string) => `• ${s}`).join('\n');
    }
  }

  return message;
}

function createApprovalActivityDescription(
  businessName: string,
  approvalDecision: any,
  riskScore: any,
  approvalNotes?: string,
  conditions?: string[]
): string {
  let description = `${approvalDecision.status === 'approved' ? 'Approved' : 
    approvalDecision.status === 'conditional_approval' ? 'Conditionally approved' : 'Rejected'} supplier "${businessName}"`;

  description += ` (Risk Score: ${riskScore.score}/100, Level: ${riskScore.level})`;

  if (conditions && conditions.length > 0) {
    description += `. Conditions: ${conditions.join(', ')}`;
  }

  if (approvalNotes) {
    description += `. Notes: ${approvalNotes}`;
  }

  return description;
}

async function performComprehensiveRiskAssessment(supplier: any) {
  // Business age assessment
  const businessAge = supplier.yearEstablished ? 
    new Date().getFullYear() - supplier.yearEstablished : 0;
  
  const ageRisk = businessAge < 2 ? 'high' : businessAge < 5 ? 'medium' : 'low';

  // Performance assessment
  const performanceRisk = (supplier.rating || 0) < 3.5 ? 'high' : 
    (supplier.rating || 0) < 4.0 ? 'medium' : 'low';

  // Volume assessment
  const volumeRisk = (supplier.totalOrders || 0) === 0 ? 'high' : 
    (supplier.totalOrders || 0) < 10 ? 'medium' : 'low';

  // Geographic assessment
  const geoRisk = assessGeographicRisk(supplier.country);

  // Overall risk calculation
  const riskFactors = [ageRisk, performanceRisk, volumeRisk, geoRisk];
  const highRiskCount = riskFactors.filter(r => r === 'high').length;
  const mediumRiskCount = riskFactors.filter(r => r === 'medium').length;

  let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (highRiskCount >= 3) {
    overallRisk = 'critical';
  } else if (highRiskCount >= 2) {
    overallRisk = 'high';
  } else if (highRiskCount >= 1 || mediumRiskCount >= 2) {
    overallRisk = 'medium';
  }

  return {
    overallRisk,
    businessAge: {
      years: businessAge,
      risk: ageRisk,
    },
    performance: {
      rating: supplier.rating || 0,
      totalReviews: supplier.totalReviews || 0,
      risk: performanceRisk,
    },
    volume: {
      totalOrders: supplier.totalOrders || 0,
      totalSales: supplier.totalSales || 0,
      risk: volumeRisk,
    },
    geographic: {
      country: supplier.country,
      risk: geoRisk,
    },
    recommendations: generateComprehensiveRecommendations(overallRisk, {
      ageRisk,
      performanceRisk,
      volumeRisk,
      geoRisk,
    }),
  };
}

function assessGeographicRisk(country: string): 'low' | 'medium' | 'high' {
  // Simplified geographic risk assessment
  const lowRiskCountries = ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Japan', 'Australia'];
  const mediumRiskCountries = ['China', 'India', 'Brazil', 'Mexico', 'Turkey', 'Thailand', 'Vietnam'];
  
  if (lowRiskCountries.includes(country)) return 'low';
  if (mediumRiskCountries.includes(country)) return 'medium';
  return 'high';
}

function generateComprehensiveRecommendations(
  overallRisk: string,
  risks: { ageRisk: string; performanceRisk: string; volumeRisk: string; geoRisk: string }
): string[] {
  const recommendations: string[] = [];

  if (overallRisk === 'critical') {
    recommendations.push('Reject application or require extensive additional documentation');
    recommendations.push('Implement enhanced due diligence procedures');
  } else if (overallRisk === 'high') {
    recommendations.push('Approve with strict conditions and monitoring');
    recommendations.push('Require security deposit or guarantee');
    recommendations.push('Limit initial product listing capacity');
  } else if (overallRisk === 'medium') {
    recommendations.push('Approve with standard conditions');
    recommendations.push('Implement regular performance monitoring');
  } else {
    recommendations.push('Approve with standard onboarding process');
  }

  if (risks.ageRisk === 'high') {
    recommendations.push('Request business references and financial statements');
  }

  if (risks.performanceRisk === 'high') {
    recommendations.push('Provide additional training and support');
  }

  if (risks.volumeRisk === 'high') {
    recommendations.push('Start with trial period and gradual capacity increase');
  }

  if (risks.geoRisk === 'high') {
    recommendations.push('Implement additional compliance and monitoring measures');
  }

  return recommendations;
}

// ==================== SUPPLIER PERFORMANCE MONITORING SYSTEM ====================

// GET /api/admin/suppliers/performance/comprehensive - Comprehensive performance monitoring
router.get('/performance/comprehensive', async (req, res) => {
  try {
    const { 
      supplierId, 
      limit = '50', 
      offset = '0', 
      sortBy = 'totalSales', 
      sortOrder = 'desc',
      riskLevel,
      membershipTier,
      performanceThreshold 
    } = req.query;

    // Get comprehensive supplier performance metrics
    const performanceData = await getComprehensiveSupplierPerformance({
      supplierId: supplierId as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      riskLevel: riskLevel as string,
      membershipTier: membershipTier as string,
      performanceThreshold: performanceThreshold ? parseFloat(performanceThreshold as string) : undefined,
    });

    res.json({
      success: true,
      ...performanceData,
    });

  } catch (error: any) {
    console.error('Error getting comprehensive supplier performance:', error);
    res.status(500).json({ error: 'Failed to get supplier performance data' });
  }
});

// GET /api/admin/suppliers/:id/performance/detailed - Detailed performance for specific supplier
router.get('/:id/performance/detailed', async (req, res) => {
  try {
    const supplierId = req.params.id;

    // Get detailed performance metrics for specific supplier
    const detailedPerformance = await getDetailedSupplierPerformance(supplierId);

    res.json({
      success: true,
      performance: detailedPerformance,
    });

  } catch (error: any) {
    console.error('Error getting detailed supplier performance:', error);
    res.status(500).json({ error: 'Failed to get detailed supplier performance' });
  }
});

// GET /api/admin/suppliers/performance/benchmarks - Performance benchmarks and rankings
router.get('/performance/benchmarks', async (req, res) => {
  try {
    const { membershipTier, category } = req.query;

    const benchmarks = await getSupplierPerformanceBenchmarks({
      membershipTier: membershipTier as string,
      category: category as string,
    });

    res.json({
      success: true,
      benchmarks,
    });

  } catch (error: any) {
    console.error('Error getting performance benchmarks:', error);
    res.status(500).json({ error: 'Failed to get performance benchmarks' });
  }
});

// GET /api/admin/suppliers/performance/alerts - Performance alerts and threshold monitoring
router.get('/performance/alerts', async (req, res) => {
  try {
    const { severity, status, limit = '50', offset = '0' } = req.query;

    const alerts = await getPerformanceAlerts({
      severity: severity as string,
      status: status as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json({
      success: true,
      ...alerts,
    });

  } catch (error: any) {
    console.error('Error getting performance alerts:', error);
    res.status(500).json({ error: 'Failed to get performance alerts' });
  }
});

// POST /api/admin/suppliers/performance/thresholds - Configure performance thresholds
router.post('/performance/thresholds', async (req, res) => {
  try {
    const adminId = req.user?.id;
    const adminName = req.user?.firstName || req.user?.email || 'Admin';
    
    const thresholds = req.body;

    // Validate thresholds
    const thresholdSchema = z.object({
      responseRate: z.object({
        warning: z.number().min(0).max(100),
        critical: z.number().min(0).max(100),
      }),
      rating: z.object({
        warning: z.number().min(0).max(5),
        critical: z.number().min(0).max(5),
      }),
      orderFulfillment: z.object({
        warning: z.number().min(0).max(100),
        critical: z.number().min(0).max(100),
      }),
      disputeRate: z.object({
        warning: z.number().min(0).max(100),
        critical: z.number().min(0).max(100),
      }),
    });

    const validationResult = thresholdSchema.safeParse(thresholds);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    // Save thresholds (in production, this would be stored in a configuration table)
    await savePerformanceThresholds(validationResult.data);

    // Log activity
    await createActivityLog({
      adminId: adminId!,
      adminName,
      action: 'Update Performance Thresholds',
      description: 'Updated supplier performance monitoring thresholds',
      entityType: 'system',
      entityId: 'performance_thresholds',
      entityName: 'Performance Thresholds',
    });

    res.json({
      success: true,
      message: 'Performance thresholds updated successfully',
      thresholds: validationResult.data,
    });

  } catch (error: any) {
    console.error('Error updating performance thresholds:', error);
    res.status(500).json({ error: 'Failed to update performance thresholds' });
  }
});

// POST /api/admin/suppliers/:id/performance/flag - Flag supplier for performance issues
router.post('/:id/performance/flag', async (req, res) => {
  try {
    const supplierId = req.params.id;
    const adminId = req.user?.id;
    const adminName = req.user?.firstName || req.user?.email || 'Admin';
    
    const { reason, severity, notes } = req.body;

    if (!reason || !severity) {
      return res.status(400).json({ error: 'Reason and severity are required' });
    }

    // Get supplier details
    const supplierResult = await db
      .select({
        id: supplierProfiles.id,
        businessName: supplierProfiles.businessName,
        userId: supplierProfiles.userId,
      })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.id, supplierId))
      .limit(1);

    if (supplierResult.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const supplier = supplierResult[0];

    // Create performance flag
    const performanceFlag = await createPerformanceFlag({
      supplierId,
      reason,
      severity,
      notes,
      flaggedBy: adminId!,
      flaggedByName: adminName,
    });

    // Create notification for supplier
    await createNotification({
      userId: supplier.userId,
      type: severity === 'critical' ? 'error' : 'warning',
      title: 'Performance Alert',
      message: `Your account has been flagged for performance issues: ${reason}. ${notes ? `Notes: ${notes}` : ''}`,
      relatedId: supplierId,
      relatedType: 'performance_flag',
    });

    // Log activity
    await createActivityLog({
      adminId: adminId!,
      adminName,
      action: 'Flag Supplier Performance',
      description: `Flagged supplier "${supplier.businessName}" for performance issues: ${reason}`,
      entityType: 'supplier',
      entityId: supplierId,
      entityName: supplier.businessName,
    });

    res.json({
      success: true,
      message: 'Supplier flagged for performance issues',
      flag: performanceFlag,
    });

  } catch (error: any) {
    console.error('Error flagging supplier performance:', error);
    res.status(500).json({ error: 'Failed to flag supplier performance' });
  }
});

// Helper functions for supplier performance monitoring

async function getComprehensiveSupplierPerformance(options: {
  supplierId?: string;
  limit: number;
  offset: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  riskLevel?: string;
  membershipTier?: string;
  performanceThreshold?: number;
}) {
  const { supplierId, limit, offset, sortBy, sortOrder, riskLevel, membershipTier, performanceThreshold } = options;

  // Build query conditions
  const conditions = [eq(supplierProfiles.status, 'approved')];

  if (supplierId) {
    conditions.push(eq(supplierProfiles.id, supplierId));
  }
  if (membershipTier) {
    conditions.push(eq(supplierProfiles.membershipTier, membershipTier));
  }

  // Get suppliers with performance metrics
  let query = db
    .select({
      id: supplierProfiles.id,
      businessName: supplierProfiles.businessName,
      storeName: supplierProfiles.storeName,
      membershipTier: supplierProfiles.membershipTier,
      verificationLevel: supplierProfiles.verificationLevel,
      rating: supplierProfiles.rating,
      totalReviews: supplierProfiles.totalReviews,
      responseRate: supplierProfiles.responseRate,
      responseTime: supplierProfiles.responseTime,
      totalSales: supplierProfiles.totalSales,
      totalOrders: supplierProfiles.totalOrders,
      totalProducts: supplierProfiles.totalProducts,
      isActive: supplierProfiles.isActive,
      isSuspended: supplierProfiles.isSuspended,
      createdAt: supplierProfiles.createdAt,
      updatedAt: supplierProfiles.updatedAt,
    })
    .from(supplierProfiles)
    .where(and(...conditions));

  // Apply sorting
  const sortColumn = getSortColumn(sortBy);
  if (sortColumn) {
    query = sortOrder === 'desc' ? 
      query.orderBy(desc(sortColumn)) : 
      query.orderBy(sortColumn);
  }

  // Apply pagination
  query = query.limit(limit).offset(offset);

  const suppliers = await query;

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(supplierProfiles)
    .where(and(...conditions));

  const total = totalResult[0]?.count || 0;

  // Enhance with performance calculations
  const enhancedSuppliers = await Promise.all(
    suppliers.map(async (supplier) => {
      const performance = await calculateSupplierPerformanceMetrics(supplier);
      
      // Apply filters
      if (riskLevel && performance.riskLevel !== riskLevel) {
        return null;
      }
      if (performanceThreshold && performance.performanceScore < performanceThreshold) {
        return null;
      }

      return {
        ...supplier,
        performance,
      };
    })
  );

  // Filter out null results
  const filteredSuppliers = enhancedSuppliers.filter(s => s !== null);

  return {
    suppliers: filteredSuppliers,
    total: Number(total),
    page: Math.floor(offset / limit) + 1,
    limit,
  };
}

async function getDetailedSupplierPerformance(supplierId: string) {
  // Get supplier basic info
  const supplierResult = await db
    .select()
    .from(supplierProfiles)
    .where(eq(supplierProfiles.id, supplierId))
    .limit(1);

  if (supplierResult.length === 0) {
    throw new Error('Supplier not found');
  }

  const supplier = supplierResult[0];

  // Calculate comprehensive performance metrics
  const performance = await calculateSupplierPerformanceMetrics(supplier);

  // Get performance history (last 12 months)
  const performanceHistory = await getSupplierPerformanceHistory(supplierId, 12);

  // Get recent performance alerts
  const recentAlerts = await getSupplierPerformanceAlerts(supplierId, 10);

  // Get product performance breakdown
  const productPerformance = await getSupplierProductPerformance(supplierId);

  // Get order fulfillment metrics
  const fulfillmentMetrics = await getSupplierFulfillmentMetrics(supplierId);

  return {
    supplier: {
      id: supplier.id,
      businessName: supplier.businessName,
      storeName: supplier.storeName,
      membershipTier: supplier.membershipTier,
      verificationLevel: supplier.verificationLevel,
    },
    performance,
    performanceHistory,
    recentAlerts,
    productPerformance,
    fulfillmentMetrics,
    recommendations: generatePerformanceRecommendations(performance),
  };
}

async function calculateSupplierPerformanceMetrics(supplier: any) {
  // Calculate various performance metrics
  const responseRate = Number(supplier.responseRate || 0);
  const rating = Number(supplier.rating || 0);
  const totalSales = Number(supplier.totalSales || 0);
  const totalOrders = supplier.totalOrders || 0;
  const totalProducts = supplier.totalProducts || 0;

  // Calculate average order value
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Calculate performance score (weighted average)
  const performanceScore = (
    (responseRate * 0.25) +
    (rating * 20 * 0.25) + // Convert 5-star rating to 100-point scale
    (Math.min(totalOrders / 10, 10) * 10 * 0.2) + // Order volume score
    (Math.min(totalProducts / 5, 10) * 10 * 0.15) + // Product diversity score
    (Math.min(averageOrderValue / 1000, 10) * 10 * 0.15) // Order value score
  );

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (performanceScore < 30) {
    riskLevel = 'critical';
  } else if (performanceScore < 50) {
    riskLevel = 'high';
  } else if (performanceScore < 70) {
    riskLevel = 'medium';
  }

  // Calculate trends (mock data for now)
  const trends = {
    salesTrend: Math.random() > 0.5 ? 'up' : 'down',
    orderTrend: Math.random() > 0.5 ? 'up' : 'down',
    ratingTrend: Math.random() > 0.5 ? 'up' : 'down',
    responseTrend: Math.random() > 0.5 ? 'up' : 'down',
  };

  return {
    performanceScore: Math.round(performanceScore * 100) / 100,
    riskLevel,
    responseRate,
    rating,
    totalSales,
    totalOrders,
    totalProducts,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    trends,
    lastUpdated: new Date(),
  };
}

async function getSupplierPerformanceBenchmarks(options: {
  membershipTier?: string;
  category?: string;
}) {
  // Get industry benchmarks
  const conditions = [eq(supplierProfiles.status, 'approved')];
  
  if (options.membershipTier) {
    conditions.push(eq(supplierProfiles.membershipTier, options.membershipTier));
  }

  const benchmarkData = await db
    .select({
      avgRating: avg(supplierProfiles.rating),
      avgResponseRate: avg(supplierProfiles.responseRate),
      avgTotalSales: avg(supplierProfiles.totalSales),
      avgTotalOrders: avg(supplierProfiles.totalOrders),
    })
    .from(supplierProfiles)
    .where(and(...conditions));

  const benchmarks = benchmarkData[0];

  // Get percentile rankings
  const percentiles = await calculatePerformancePercentiles(options);

  return {
    industry: {
      averageRating: Number(benchmarks?.avgRating || 0),
      averageResponseRate: Number(benchmarks?.avgResponseRate || 0),
      averageSales: Number(benchmarks?.avgTotalSales || 0),
      averageOrders: Number(benchmarks?.avgTotalOrders || 0),
    },
    percentiles,
    topPerformers: await getTopPerformers(5, options),
    membershipTierComparison: await getMembershipTierComparison(),
  };
}

async function getPerformanceAlerts(options: {
  severity?: string;
  status?: string;
  limit: number;
  offset: number;
}) {
  // Mock performance alerts (in production, this would come from a dedicated alerts table)
  const mockAlerts = [
    {
      id: '1',
      supplierId: 'supplier1',
      supplierName: 'Sample Supplier 1',
      alertType: 'low_response_rate',
      severity: 'warning',
      message: 'Response rate dropped below 80%',
      currentValue: 75,
      threshold: 80,
      status: 'open',
      createdAt: new Date(),
    },
    {
      id: '2',
      supplierId: 'supplier2',
      supplierName: 'Sample Supplier 2',
      alertType: 'low_rating',
      severity: 'critical',
      message: 'Customer rating dropped below 3.5',
      currentValue: 3.2,
      threshold: 3.5,
      status: 'investigating',
      createdAt: new Date(),
    },
  ];

  // Apply filters
  let filteredAlerts = mockAlerts;
  if (options.severity) {
    filteredAlerts = filteredAlerts.filter(alert => alert.severity === options.severity);
  }
  if (options.status) {
    filteredAlerts = filteredAlerts.filter(alert => alert.status === options.status);
  }

  // Apply pagination
  const paginatedAlerts = filteredAlerts.slice(options.offset, options.offset + options.limit);

  return {
    alerts: paginatedAlerts,
    total: filteredAlerts.length,
    page: Math.floor(options.offset / options.limit) + 1,
    limit: options.limit,
  };
}

// Additional helper functions

function getSortColumn(sortBy: string) {
  const sortColumns: Record<string, any> = {
    businessName: supplierProfiles.businessName,
    rating: supplierProfiles.rating,
    totalSales: supplierProfiles.totalSales,
    totalOrders: supplierProfiles.totalOrders,
    responseRate: supplierProfiles.responseRate,
    createdAt: supplierProfiles.createdAt,
  };
  return sortColumns[sortBy];
}

async function savePerformanceThresholds(thresholds: any) {
  // In production, save to configuration table
  console.log('Saving performance thresholds:', thresholds);
}

async function createPerformanceFlag(flagData: any) {
  // In production, save to performance flags table
  return {
    id: `flag_${Date.now()}`,
    ...flagData,
    createdAt: new Date(),
    status: 'open',
  };
}

async function getSupplierPerformanceHistory(supplierId: string, months: number) {
  // Mock historical data
  const history = [];
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    history.push({
      month: date.toISOString().slice(0, 7),
      performanceScore: 60 + Math.random() * 30,
      sales: Math.random() * 50000,
      orders: Math.floor(Math.random() * 100),
      rating: 3.5 + Math.random() * 1.5,
      responseRate: 70 + Math.random() * 30,
    });
  }
  return history;
}

async function getSupplierPerformanceAlerts(supplierId: string, limit: number) {
  // Mock recent alerts
  return [
    {
      id: '1',
      type: 'response_rate_drop',
      severity: 'warning',
      message: 'Response rate decreased by 15% this month',
      createdAt: new Date(),
    },
  ];
}

async function getSupplierProductPerformance(supplierId: string) {
  // Get product performance metrics
  const productStats = await db
    .select({
      status: products.status,
      count: count(),
      avgViews: avg(products.views),
      avgInquiries: avg(products.inquiries),
    })
    .from(products)
    .where(eq(products.supplierId, supplierId))
    .groupBy(products.status);

  return {
    totalProducts: productStats.reduce((sum, stat) => sum + Number(stat.count), 0),
    approvedProducts: productStats.find(s => s.status === 'approved')?.count || 0,
    pendingProducts: productStats.find(s => s.status === 'pending_approval')?.count || 0,
    rejectedProducts: productStats.find(s => s.status === 'rejected')?.count || 0,
    averageViews: Number(productStats.find(s => s.status === 'approved')?.avgViews || 0),
    averageInquiries: Number(productStats.find(s => s.status === 'approved')?.avgInquiries || 0),
  };
}

async function getSupplierFulfillmentMetrics(supplierId: string) {
  // Mock fulfillment metrics
  return {
    onTimeDeliveryRate: 85 + Math.random() * 15,
    averageProcessingTime: 2 + Math.random() * 3,
    orderAccuracyRate: 90 + Math.random() * 10,
    returnRate: Math.random() * 5,
    customerSatisfactionScore: 4.0 + Math.random() * 1.0,
  };
}

function generatePerformanceRecommendations(performance: any): string[] {
  const recommendations: string[] = [];

  if (performance.responseRate < 80) {
    recommendations.push('Improve response time to customer inquiries');
  }

  if (performance.rating < 4.0) {
    recommendations.push('Focus on improving customer satisfaction and service quality');
  }

  if (performance.performanceScore < 50) {
    recommendations.push('Consider performance improvement plan or additional training');
  }

  if (performance.totalProducts < 5) {
    recommendations.push('Expand product catalog to increase visibility');
  }

  if (performance.averageOrderValue < 500) {
    recommendations.push('Focus on higher-value products or bundle offerings');
  }

  return recommendations;
}

async function calculatePerformancePercentiles(options: any) {
  // Mock percentile calculations
  return {
    rating: { p25: 3.8, p50: 4.2, p75: 4.6, p90: 4.8 },
    responseRate: { p25: 75, p50: 85, p75: 92, p90: 98 },
    sales: { p25: 10000, p50: 25000, p75: 50000, p90: 100000 },
  };
}

async function getTopPerformers(limit: number, options: any) {
  const conditions = [eq(supplierProfiles.status, 'approved')];
  
  if (options.membershipTier) {
    conditions.push(eq(supplierProfiles.membershipTier, options.membershipTier));
  }

  return await db
    .select({
      id: supplierProfiles.id,
      businessName: supplierProfiles.businessName,
      rating: supplierProfiles.rating,
      totalSales: supplierProfiles.totalSales,
      responseRate: supplierProfiles.responseRate,
    })
    .from(supplierProfiles)
    .where(and(...conditions))
    .orderBy(desc(supplierProfiles.totalSales))
    .limit(limit);
}

async function getMembershipTierComparison() {
  const tierStats = await db
    .select({
      membershipTier: supplierProfiles.membershipTier,
      avgRating: avg(supplierProfiles.rating),
      avgSales: avg(supplierProfiles.totalSales),
      avgResponseRate: avg(supplierProfiles.responseRate),
      count: count(),
    })
    .from(supplierProfiles)
    .where(eq(supplierProfiles.status, 'approved'))
    .groupBy(supplierProfiles.membershipTier);

  return tierStats.map(stat => ({
    tier: stat.membershipTier,
    averageRating: Number(stat.avgRating || 0),
    averageSales: Number(stat.avgSales || 0),
    averageResponseRate: Number(stat.avgResponseRate || 0),
    supplierCount: Number(stat.count),
  }));
}

// ==================== BULK SUPPLIER OPERATIONS ====================

// Bulk operations validation schema
const bulkOperationSchema = z.object({
  supplierIds: z.array(z.string()).min(1, 'At least one supplier ID is required'),
  operation: z.enum(['approve', 'reject', 'suspend', 'activate', 'update_tier', 'update_commission', 'send_notification']),
  data: z.object({
    // For approval operations
    membershipTier: z.enum(['free', 'silver', 'gold', 'platinum']).optional(),
    verificationLevel: z.enum(['none', 'basic', 'business', 'premium', 'trade_assurance']).optional(),
    customCommissionRate: z.number().min(0).max(100).optional(),
    
    // For rejection operations
    rejectionReason: z.string().optional(),
    rejectionNotes: z.string().optional(),
    
    // For suspension operations
    suspensionReason: z.string().optional(),
    
    // For tier updates
    newTier: z.enum(['free', 'silver', 'gold', 'platinum']).optional(),
    
    // For commission updates
    newCommissionRate: z.number().min(0).max(100).optional(),
    
    // For notifications
    notificationType: z.enum(['info', 'success', 'warning', 'error']).optional(),
    notificationTitle: z.string().optional(),
    notificationMessage: z.string().optional(),
    
    // General
    notes: z.string().optional(),
  }).optional(),
});

// POST /api/admin/suppliers/bulk/operations - Bulk supplier operations
router.post('/bulk/operations', async (req, res) => {
  try {
    const adminId = req.user?.id;
    const adminName = req.user?.firstName || req.user?.email || 'Admin';
    
    const validationResult = bulkOperationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const { supplierIds, operation, data } = validationResult.data;

    // Validate that all suppliers exist
    const suppliersResult = await db
      .select({
        id: supplierProfiles.id,
        userId: supplierProfiles.userId,
        businessName: supplierProfiles.businessName,
        status: supplierProfiles.status,
        isSuspended: supplierProfiles.isSuspended,
      })
      .from(supplierProfiles)
      .where(sql`${supplierProfiles.id} = ANY(${supplierIds})`);

    if (suppliersResult.length !== supplierIds.length) {
      return res.status(404).json({ 
        error: 'Some suppliers not found',
        found: suppliersResult.length,
        requested: supplierIds.length
      });
    }

    const results = await processBulkOperation(
      operation,
      suppliersResult,
      data || {},
      adminId!,
      adminName
    );

    // Log bulk activity
    await createActivityLog({
      adminId: adminId!,
      adminName,
      action: `Bulk ${operation}`,
      description: `Performed bulk ${operation} on ${supplierIds.length} suppliers. Success: ${results.successful.length}, Failed: ${results.failed.length}`,
      entityType: 'supplier',
      entityId: 'bulk_operation',
      entityName: `Bulk Operation: ${operation}`,
    });

    res.json({
      success: true,
      message: `Bulk ${operation} completed`,
      results: {
        total: supplierIds.length,
        successful: results.successful.length,
        failed: results.failed.length,
        details: results,
      },
    });

  } catch (error: any) {
    console.error('Error in bulk supplier operations:', error);
    res.status(500).json({ error: 'Failed to process bulk operation' });
  }
});

// POST /api/admin/suppliers/bulk/approve - Bulk approve suppliers
router.post('/bulk/approve', async (req, res) => {
  try {
    const adminId = req.user?.id;
    const adminName = req.user?.firstName || req.user?.email || 'Admin';
    
    const { supplierIds, approvalSettings } = req.body;

    if (!supplierIds || !Array.isArray(supplierIds) || supplierIds.length === 0) {
      return res.status(400).json({ error: 'Supplier IDs array is required' });
    }

    const defaultSettings = {
      membershipTier: 'free',
      verificationLevel: 'basic',
      riskAssessment: {
        businessVerification: 'partial',
        documentQuality: 'fair',
        businessHistory: 'new',
        financialStability: 'unknown',
        complianceRisk: 'medium',
        overallRisk: 'medium',
      },
      approvalNotes: 'Bulk approval',
      ...approvalSettings,
    };

    const results = {
      successful: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    // Process each supplier
    for (const supplierId of supplierIds) {
      try {
        // Check if supplier exists and is pending
        const supplierResult = await db
          .select({
            id: supplierProfiles.id,
            userId: supplierProfiles.userId,
            businessName: supplierProfiles.businessName,
            status: supplierProfiles.status,
          })
          .from(supplierProfiles)
          .where(eq(supplierProfiles.id, supplierId))
          .limit(1);

        if (supplierResult.length === 0) {
          results.failed.push({ id: supplierId, error: 'Supplier not found' });
          continue;
        }

        const supplier = supplierResult[0];

        if (supplier.status !== 'pending') {
          results.failed.push({ 
            id: supplierId, 
            error: `Supplier is already ${supplier.status}` 
          });
          continue;
        }

        // Update supplier status
        await db
          .update(supplierProfiles)
          .set({
            status: 'approved',
            isActive: true,
            verifiedAt: new Date(),
            membershipTier: defaultSettings.membershipTier,
            verificationLevel: defaultSettings.verificationLevel,
            customCommissionRate: defaultSettings.customCommissionRate,
            updatedAt: new Date(),
          })
          .where(eq(supplierProfiles.id, supplierId));

        // Create notification
        await createNotification({
          userId: supplier.userId,
          type: 'success',
          title: 'Supplier Application Approved',
          message: `Your supplier application for "${supplier.businessName}" has been approved through bulk processing. You can now start managing your store and listing products.`,
          relatedId: supplierId,
          relatedType: 'supplier_approval',
        });

        results.successful.push(supplierId);

      } catch (error) {
        console.error(`Error approving supplier ${supplierId}:`, error);
        results.failed.push({ 
          id: supplierId, 
          error: 'Processing failed' 
        });
      }
    }

    // Log bulk activity
    await createActivityLog({
      adminId: adminId!,
      adminName,
      action: 'Bulk Approve Suppliers',
      description: `Bulk approved ${results.successful.length} suppliers. Failed: ${results.failed.length}`,
      entityType: 'supplier',
      entityId: 'bulk_approve',
      entityName: 'Bulk Approval Operation',
    });

    res.json({
      success: true,
      message: 'Bulk approval completed',
      results: {
        total: supplierIds.length,
        successful: results.successful.length,
        failed: results.failed.length,
        successfulIds: results.successful,
        failedDetails: results.failed,
      },
    });

  } catch (error: any) {
    console.error('Error in bulk supplier approval:', error);
    res.status(500).json({ error: 'Failed to process bulk approval' });
  }
});

// POST /api/admin/suppliers/bulk/reject - Bulk reject suppliers
router.post('/bulk/reject', async (req, res) => {
  try {
    const adminId = req.user?.id;
    const adminName = req.user?.firstName || req.user?.email || 'Admin';
    
    const { supplierIds, rejectionReason, rejectionNotes } = req.body;

    if (!supplierIds || !Array.isArray(supplierIds) || supplierIds.length === 0) {
      return res.status(400).json({ error: 'Supplier IDs array is required' });
    }

    if (!rejectionReason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const results = {
      successful: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    // Process each supplier
    for (const supplierId of supplierIds) {
      try {
        // Check if supplier exists and is pending
        const supplierResult = await db
          .select({
            id: supplierProfiles.id,
            userId: supplierProfiles.userId,
            businessName: supplierProfiles.businessName,
            status: supplierProfiles.status,
          })
          .from(supplierProfiles)
          .where(eq(supplierProfiles.id, supplierId))
          .limit(1);

        if (supplierResult.length === 0) {
          results.failed.push({ id: supplierId, error: 'Supplier not found' });
          continue;
        }

        const supplier = supplierResult[0];

        if (supplier.status !== 'pending') {
          results.failed.push({ 
            id: supplierId, 
            error: `Supplier is already ${supplier.status}` 
          });
          continue;
        }

        // Update supplier status
        await db
          .update(supplierProfiles)
          .set({
            status: 'rejected',
            suspensionReason: rejectionReason,
            updatedAt: new Date(),
          })
          .where(eq(supplierProfiles.id, supplierId));

        // Create notification
        await createNotification({
          userId: supplier.userId,
          type: 'error',
          title: 'Supplier Application Rejected',
          message: `Your supplier application for "${supplier.businessName}" has been rejected. Reason: ${rejectionReason}. ${rejectionNotes ? `Notes: ${rejectionNotes}` : ''} Please contact support if you have questions.`,
          relatedId: supplierId,
          relatedType: 'supplier_rejection',
        });

        results.successful.push(supplierId);

      } catch (error) {
        console.error(`Error rejecting supplier ${supplierId}:`, error);
        results.failed.push({ 
          id: supplierId, 
          error: 'Processing failed' 
        });
      }
    }

    // Log bulk activity
    await createActivityLog({
      adminId: adminId!,
      adminName,
      action: 'Bulk Reject Suppliers',
      description: `Bulk rejected ${results.successful.length} suppliers. Reason: ${rejectionReason}. Failed: ${results.failed.length}`,
      entityType: 'supplier',
      entityId: 'bulk_reject',
      entityName: 'Bulk Rejection Operation',
    });

    res.json({
      success: true,
      message: 'Bulk rejection completed',
      results: {
        total: supplierIds.length,
        successful: results.successful.length,
        failed: results.failed.length,
        successfulIds: results.successful,
        failedDetails: results.failed,
      },
    });

  } catch (error: any) {
    console.error('Error in bulk supplier rejection:', error);
    res.status(500).json({ error: 'Failed to process bulk rejection' });
  }
});

// POST /api/admin/suppliers/bulk/update-tier - Bulk update membership tiers
router.post('/bulk/update-tier', async (req, res) => {
  try {
    const adminId = req.user?.id;
    const adminName = req.user?.firstName || req.user?.email || 'Admin';
    
    const { supplierIds, newTier, notes } = req.body;

    if (!supplierIds || !Array.isArray(supplierIds) || supplierIds.length === 0) {
      return res.status(400).json({ error: 'Supplier IDs array is required' });
    }

    if (!newTier || !['free', 'silver', 'gold', 'platinum'].includes(newTier)) {
      return res.status(400).json({ error: 'Valid membership tier is required' });
    }

    const results = {
      successful: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    // Process each supplier
    for (const supplierId of supplierIds) {
      try {
        // Check if supplier exists
        const supplierResult = await db
          .select({
            id: supplierProfiles.id,
            userId: supplierProfiles.userId,
            businessName: supplierProfiles.businessName,
            membershipTier: supplierProfiles.membershipTier,
            status: supplierProfiles.status,
          })
          .from(supplierProfiles)
          .where(eq(supplierProfiles.id, supplierId))
          .limit(1);

        if (supplierResult.length === 0) {
          results.failed.push({ id: supplierId, error: 'Supplier not found' });
          continue;
        }

        const supplier = supplierResult[0];

        if (supplier.status !== 'approved') {
          results.failed.push({ 
            id: supplierId, 
            error: 'Only approved suppliers can have tier updates' 
          });
          continue;
        }

        if (supplier.membershipTier === newTier) {
          results.failed.push({ 
            id: supplierId, 
            error: `Supplier already has ${newTier} tier` 
          });
          continue;
        }

        // Update membership tier
        await db
          .update(supplierProfiles)
          .set({
            membershipTier: newTier,
            updatedAt: new Date(),
          })
          .where(eq(supplierProfiles.id, supplierId));

        // Create notification
        await createNotification({
          userId: supplier.userId,
          type: 'info',
          title: 'Membership Tier Updated',
          message: `Your membership tier has been updated to ${newTier.toUpperCase()}. ${notes ? `Notes: ${notes}` : ''} Enjoy your new benefits!`,
          relatedId: supplierId,
          relatedType: 'tier_update',
        });

        results.successful.push(supplierId);

      } catch (error) {
        console.error(`Error updating tier for supplier ${supplierId}:`, error);
        results.failed.push({ 
          id: supplierId, 
          error: 'Processing failed' 
        });
      }
    }

    // Log bulk activity
    await createActivityLog({
      adminId: adminId!,
      adminName,
      action: 'Bulk Update Membership Tier',
      description: `Bulk updated ${results.successful.length} suppliers to ${newTier} tier. Failed: ${results.failed.length}`,
      entityType: 'supplier',
      entityId: 'bulk_tier_update',
      entityName: 'Bulk Tier Update Operation',
    });

    res.json({
      success: true,
      message: 'Bulk tier update completed',
      results: {
        total: supplierIds.length,
        successful: results.successful.length,
        failed: results.failed.length,
        successfulIds: results.successful,
        failedDetails: results.failed,
      },
    });

  } catch (error: any) {
    console.error('Error in bulk tier update:', error);
    res.status(500).json({ error: 'Failed to process bulk tier update' });
  }
});

// POST /api/admin/suppliers/bulk/update-commission - Bulk update commission rates
router.post('/bulk/update-commission', async (req, res) => {
  try {
    const adminId = req.user?.id;
    const adminName = req.user?.firstName || req.user?.email || 'Admin';
    
    const { supplierIds, newCommissionRate, impactAnalysis, notes } = req.body;

    if (!supplierIds || !Array.isArray(supplierIds) || supplierIds.length === 0) {
      return res.status(400).json({ error: 'Supplier IDs array is required' });
    }

    if (newCommissionRate === undefined || newCommissionRate < 0 || newCommissionRate > 100) {
      return res.status(400).json({ error: 'Valid commission rate (0-100) is required' });
    }

    // Calculate impact analysis if requested
    let impact = null;
    if (impactAnalysis) {
      impact = await calculateCommissionImpactAnalysis(supplierIds, newCommissionRate);
    }

    const results = {
      successful: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    // Process each supplier
    for (const supplierId of supplierIds) {
      try {
        // Check if supplier exists
        const supplierResult = await db
          .select({
            id: supplierProfiles.id,
            userId: supplierProfiles.userId,
            businessName: supplierProfiles.businessName,
            customCommissionRate: supplierProfiles.customCommissionRate,
            status: supplierProfiles.status,
          })
          .from(supplierProfiles)
          .where(eq(supplierProfiles.id, supplierId))
          .limit(1);

        if (supplierResult.length === 0) {
          results.failed.push({ id: supplierId, error: 'Supplier not found' });
          continue;
        }

        const supplier = supplierResult[0];

        if (supplier.status !== 'approved') {
          results.failed.push({ 
            id: supplierId, 
            error: 'Only approved suppliers can have commission updates' 
          });
          continue;
        }

        // Update commission rate
        await db
          .update(supplierProfiles)
          .set({
            customCommissionRate: newCommissionRate,
            updatedAt: new Date(),
          })
          .where(eq(supplierProfiles.id, supplierId));

        // Create notification
        await createNotification({
          userId: supplier.userId,
          type: 'info',
          title: 'Commission Rate Updated',
          message: `Your commission rate has been updated to ${newCommissionRate}%. ${notes ? `Notes: ${notes}` : ''} This will apply to new orders.`,
          relatedId: supplierId,
          relatedType: 'commission_update',
        });

        results.successful.push(supplierId);

      } catch (error) {
        console.error(`Error updating commission for supplier ${supplierId}:`, error);
        results.failed.push({ 
          id: supplierId, 
          error: 'Processing failed' 
        });
      }
    }

    // Log bulk activity
    await createActivityLog({
      adminId: adminId!,
      adminName,
      action: 'Bulk Update Commission Rate',
      description: `Bulk updated commission rate to ${newCommissionRate}% for ${results.successful.length} suppliers. Failed: ${results.failed.length}`,
      entityType: 'supplier',
      entityId: 'bulk_commission_update',
      entityName: 'Bulk Commission Update Operation',
    });

    res.json({
      success: true,
      message: 'Bulk commission update completed',
      results: {
        total: supplierIds.length,
        successful: results.successful.length,
        failed: results.failed.length,
        successfulIds: results.successful,
        failedDetails: results.failed,
        impactAnalysis: impact,
      },
    });

  } catch (error: any) {
    console.error('Error in bulk commission update:', error);
    res.status(500).json({ error: 'Failed to process bulk commission update' });
  }
});

// POST /api/admin/suppliers/bulk/notify - Bulk send notifications
router.post('/bulk/notify', async (req, res) => {
  try {
    const adminId = req.user?.id;
    const adminName = req.user?.firstName || req.user?.email || 'Admin';
    
    const { supplierIds, notificationType, title, message, relatedType } = req.body;

    if (!supplierIds || !Array.isArray(supplierIds) || supplierIds.length === 0) {
      return res.status(400).json({ error: 'Supplier IDs array is required' });
    }

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const validTypes = ['info', 'success', 'warning', 'error'];
    if (!validTypes.includes(notificationType)) {
      return res.status(400).json({ error: 'Valid notification type is required' });
    }

    const results = {
      successful: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    // Get supplier user IDs
    const suppliersResult = await db
      .select({
        id: supplierProfiles.id,
        userId: supplierProfiles.userId,
        businessName: supplierProfiles.businessName,
      })
      .from(supplierProfiles)
      .where(sql`${supplierProfiles.id} = ANY(${supplierIds})`);

    // Process each supplier
    for (const supplier of suppliersResult) {
      try {
        // Create notification
        await createNotification({
          userId: supplier.userId,
          type: notificationType,
          title,
          message,
          relatedId: supplier.id,
          relatedType: relatedType || 'bulk_notification',
        });

        results.successful.push(supplier.id);

      } catch (error) {
        console.error(`Error sending notification to supplier ${supplier.id}:`, error);
        results.failed.push({ 
          id: supplier.id, 
          error: 'Notification failed' 
        });
      }
    }

    // Add failed suppliers that weren't found
    const foundIds = suppliersResult.map(s => s.id);
    const notFoundIds = supplierIds.filter(id => !foundIds.includes(id));
    notFoundIds.forEach(id => {
      results.failed.push({ id, error: 'Supplier not found' });
    });

    // Log bulk activity
    await createActivityLog({
      adminId: adminId!,
      adminName,
      action: 'Bulk Send Notification',
      description: `Sent bulk notification "${title}" to ${results.successful.length} suppliers. Failed: ${results.failed.length}`,
      entityType: 'supplier',
      entityId: 'bulk_notification',
      entityName: 'Bulk Notification Operation',
    });

    res.json({
      success: true,
      message: 'Bulk notification completed',
      results: {
        total: supplierIds.length,
        successful: results.successful.length,
        failed: results.failed.length,
        successfulIds: results.successful,
        failedDetails: results.failed,
      },
    });

  } catch (error: any) {
    console.error('Error in bulk notification:', error);
    res.status(500).json({ error: 'Failed to process bulk notification' });
  }
});

// GET /api/admin/suppliers/bulk/impact-analysis - Get impact analysis for bulk operations
router.get('/bulk/impact-analysis', async (req, res) => {
  try {
    const { supplierIds, operation, newValue } = req.query;

    if (!supplierIds) {
      return res.status(400).json({ error: 'Supplier IDs are required' });
    }

    const ids = Array.isArray(supplierIds) ? supplierIds : [supplierIds];
    let impactAnalysis = null;

    switch (operation) {
      case 'commission_update':
        if (newValue) {
          impactAnalysis = await calculateCommissionImpactAnalysis(ids, parseFloat(newValue as string));
        }
        break;
      case 'tier_update':
        if (newValue) {
          impactAnalysis = await calculateTierImpactAnalysis(ids, newValue as string);
        }
        break;
      default:
        impactAnalysis = await calculateGeneralImpactAnalysis(ids);
    }

    res.json({
      success: true,
      impactAnalysis,
    });

  } catch (error: any) {
    console.error('Error calculating impact analysis:', error);
    res.status(500).json({ error: 'Failed to calculate impact analysis' });
  }
});

// Helper functions for bulk operations

async function processBulkOperation(
  operation: string,
  suppliers: any[],
  data: any,
  adminId: string,
  adminName: string
) {
  const results = {
    successful: [] as string[],
    failed: [] as { id: string; error: string }[],
  };

  for (const supplier of suppliers) {
    try {
      switch (operation) {
        case 'approve':
          await processBulkApproval(supplier, data);
          break;
        case 'reject':
          await processBulkRejection(supplier, data);
          break;
        case 'suspend':
          await processBulkSuspension(supplier, data);
          break;
        case 'activate':
          await processBulkActivation(supplier, data);
          break;
        case 'update_tier':
          await processBulkTierUpdate(supplier, data);
          break;
        case 'update_commission':
          await processBulkCommissionUpdate(supplier, data);
          break;
        case 'send_notification':
          await processBulkNotification(supplier, data);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      results.successful.push(supplier.id);

    } catch (error) {
      console.error(`Error processing ${operation} for supplier ${supplier.id}:`, error);
      results.failed.push({
        id: supplier.id,
        error: error instanceof Error ? error.message : 'Processing failed',
      });
    }
  }

  return results;
}

async function processBulkApproval(supplier: any, data: any) {
  if (supplier.status !== 'pending') {
    throw new Error(`Supplier is already ${supplier.status}`);
  }

  await db
    .update(supplierProfiles)
    .set({
      status: 'approved',
      isActive: true,
      verifiedAt: new Date(),
      membershipTier: data.membershipTier || 'free',
      verificationLevel: data.verificationLevel || 'basic',
      customCommissionRate: data.customCommissionRate,
      updatedAt: new Date(),
    })
    .where(eq(supplierProfiles.id, supplier.id));

  await createNotification({
    userId: supplier.userId,
    type: 'success',
    title: 'Supplier Application Approved',
    message: `Your supplier application for "${supplier.businessName}" has been approved. You can now start managing your store and listing products.`,
    relatedId: supplier.id,
    relatedType: 'supplier_approval',
  });
}

async function processBulkRejection(supplier: any, data: any) {
  if (supplier.status !== 'pending') {
    throw new Error(`Supplier is already ${supplier.status}`);
  }

  await db
    .update(supplierProfiles)
    .set({
      status: 'rejected',
      suspensionReason: data.rejectionReason || 'Bulk rejection',
      updatedAt: new Date(),
    })
    .where(eq(supplierProfiles.id, supplier.id));

  await createNotification({
    userId: supplier.userId,
    type: 'error',
    title: 'Supplier Application Rejected',
    message: `Your supplier application for "${supplier.businessName}" has been rejected. Reason: ${data.rejectionReason || 'Bulk rejection'}. ${data.rejectionNotes ? `Notes: ${data.rejectionNotes}` : ''}`,
    relatedId: supplier.id,
    relatedType: 'supplier_rejection',
  });
}

async function processBulkSuspension(supplier: any, data: any) {
  if (supplier.status !== 'approved' || supplier.isSuspended) {
    throw new Error('Supplier cannot be suspended');
  }

  await db
    .update(supplierProfiles)
    .set({
      status: 'suspended',
      isSuspended: true,
      isActive: false,
      suspensionReason: data.suspensionReason || 'Bulk suspension',
      updatedAt: new Date(),
    })
    .where(eq(supplierProfiles.id, supplier.id));

  await createNotification({
    userId: supplier.userId,
    type: 'warning',
    title: 'Account Suspended',
    message: `Your supplier account has been suspended. Reason: ${data.suspensionReason || 'Bulk suspension'}. Please contact support for more information.`,
    relatedId: supplier.id,
    relatedType: 'supplier_suspension',
  });
}

async function processBulkActivation(supplier: any, data: any) {
  if (!supplier.isSuspended) {
    throw new Error('Supplier is not suspended');
  }

  await db
    .update(supplierProfiles)
    .set({
      status: 'approved',
      isSuspended: false,
      isActive: true,
      suspensionReason: null,
      updatedAt: new Date(),
    })
    .where(eq(supplierProfiles.id, supplier.id));

  await createNotification({
    userId: supplier.userId,
    type: 'success',
    title: 'Account Reactivated',
    message: `Your supplier account has been reactivated. You can now resume managing your store and products.`,
    relatedId: supplier.id,
    relatedType: 'supplier_activation',
  });
}

async function processBulkTierUpdate(supplier: any, data: any) {
  if (!data.newTier) {
    throw new Error('New tier is required');
  }

  await db
    .update(supplierProfiles)
    .set({
      membershipTier: data.newTier,
      updatedAt: new Date(),
    })
    .where(eq(supplierProfiles.id, supplier.id));

  await createNotification({
    userId: supplier.userId,
    type: 'info',
    title: 'Membership Tier Updated',
    message: `Your membership tier has been updated to ${data.newTier.toUpperCase()}. ${data.notes ? `Notes: ${data.notes}` : ''}`,
    relatedId: supplier.id,
    relatedType: 'tier_update',
  });
}

async function processBulkCommissionUpdate(supplier: any, data: any) {
  if (data.newCommissionRate === undefined) {
    throw new Error('New commission rate is required');
  }

  await db
    .update(supplierProfiles)
    .set({
      customCommissionRate: data.newCommissionRate,
      updatedAt: new Date(),
    })
    .where(eq(supplierProfiles.id, supplier.id));

  await createNotification({
    userId: supplier.userId,
    type: 'info',
    title: 'Commission Rate Updated',
    message: `Your commission rate has been updated to ${data.newCommissionRate}%. ${data.notes ? `Notes: ${data.notes}` : ''}`,
    relatedId: supplier.id,
    relatedType: 'commission_update',
  });
}

async function processBulkNotification(supplier: any, data: any) {
  if (!data.notificationTitle || !data.notificationMessage) {
    throw new Error('Notification title and message are required');
  }

  await createNotification({
    userId: supplier.userId,
    type: data.notificationType || 'info',
    title: data.notificationTitle,
    message: data.notificationMessage,
    relatedId: supplier.id,
    relatedType: 'bulk_notification',
  });
}

async function calculateCommissionImpactAnalysis(supplierIds: string[], newCommissionRate: number) {
  // Get current supplier data
  const suppliers = await db
    .select({
      id: supplierProfiles.id,
      businessName: supplierProfiles.businessName,
      customCommissionRate: supplierProfiles.customCommissionRate,
      totalSales: supplierProfiles.totalSales,
      membershipTier: supplierProfiles.membershipTier,
    })
    .from(supplierProfiles)
    .where(sql`${supplierProfiles.id} = ANY(${supplierIds})`);

  // Calculate impact
  let totalCurrentCommission = 0;
  let totalNewCommission = 0;
  const supplierImpacts = [];

  for (const supplier of suppliers) {
    const currentRate = supplier.customCommissionRate || getDefaultCommissionRate(supplier.membershipTier);
    const currentCommission = (supplier.totalSales || 0) * (currentRate / 100);
    const newCommission = (supplier.totalSales || 0) * (newCommissionRate / 100);
    
    totalCurrentCommission += currentCommission;
    totalNewCommission += newCommission;

    supplierImpacts.push({
      supplierId: supplier.id,
      businessName: supplier.businessName,
      currentRate,
      newRate: newCommissionRate,
      currentCommission,
      newCommission,
      impact: newCommission - currentCommission,
      impactPercentage: currentCommission > 0 ? ((newCommission - currentCommission) / currentCommission) * 100 : 0,
    });
  }

  return {
    totalSuppliers: suppliers.length,
    totalCurrentCommission,
    totalNewCommission,
    totalImpact: totalNewCommission - totalCurrentCommission,
    totalImpactPercentage: totalCurrentCommission > 0 ? 
      ((totalNewCommission - totalCurrentCommission) / totalCurrentCommission) * 100 : 0,
    supplierImpacts,
  };
}

async function calculateTierImpactAnalysis(supplierIds: string[], newTier: string) {
  // Get current supplier data
  const suppliers = await db
    .select({
      id: supplierProfiles.id,
      businessName: supplierProfiles.businessName,
      membershipTier: supplierProfiles.membershipTier,
      totalSales: supplierProfiles.totalSales,
    })
    .from(supplierProfiles)
    .where(sql`${supplierProfiles.id} = ANY(${supplierIds})`);

  const tierBenefits = {
    free: { features: ['Basic listing', 'Standard support'], commissionRate: 5.0 },
    silver: { features: ['Priority listing', 'Enhanced support', 'Analytics'], commissionRate: 3.0 },
    gold: { features: ['Featured listing', 'Premium support', 'Advanced analytics', 'Marketing tools'], commissionRate: 2.0 },
    platinum: { features: ['Top listing', 'Dedicated support', 'Full analytics', 'Marketing suite', 'Custom branding'], commissionRate: 1.5 },
  };

  return {
    totalSuppliers: suppliers.length,
    newTierBenefits: tierBenefits[newTier as keyof typeof tierBenefits],
    suppliersAffected: suppliers.map(supplier => ({
      supplierId: supplier.id,
      businessName: supplier.businessName,
      currentTier: supplier.membershipTier,
      newTier,
      isUpgrade: getTierLevel(newTier) > getTierLevel(supplier.membershipTier),
      isDowngrade: getTierLevel(newTier) < getTierLevel(supplier.membershipTier),
    })),
  };
}

async function calculateGeneralImpactAnalysis(supplierIds: string[]) {
  const suppliers = await db
    .select({
      id: supplierProfiles.id,
      businessName: supplierProfiles.businessName,
      status: supplierProfiles.status,
      membershipTier: supplierProfiles.membershipTier,
      totalSales: supplierProfiles.totalSales,
      totalOrders: supplierProfiles.totalOrders,
      totalProducts: supplierProfiles.totalProducts,
    })
    .from(supplierProfiles)
    .where(sql`${supplierProfiles.id} = ANY(${supplierIds})`);

  const statusCounts = suppliers.reduce((acc, supplier) => {
    acc[supplier.status] = (acc[supplier.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tierCounts = suppliers.reduce((acc, supplier) => {
    acc[supplier.membershipTier] = (acc[supplier.membershipTier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalSuppliers: suppliers.length,
    statusDistribution: statusCounts,
    tierDistribution: tierCounts,
    totalSales: suppliers.reduce((sum, s) => sum + (s.totalSales || 0), 0),
    totalOrders: suppliers.reduce((sum, s) => sum + (s.totalOrders || 0), 0),
    totalProducts: suppliers.reduce((sum, s) => sum + (s.totalProducts || 0), 0),
  };
}

function getDefaultCommissionRate(membershipTier: string): number {
  const rates = {
    free: 5.0,
    silver: 3.0,
    gold: 2.0,
    platinum: 1.5,
  };
  return rates[membershipTier as keyof typeof rates] || 5.0;
}

function getTierLevel(tier: string): number {
  const levels = {
    free: 1,
    silver: 2,
    gold: 3,
    platinum: 4,
  };
  return levels[tier as keyof typeof levels] || 1;
}

export { router as adminSupplierRoutes };