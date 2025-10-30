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

export { router as adminSupplierRoutes };