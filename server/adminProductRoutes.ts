import { Router } from 'express';
import { db } from './db';
import { 
  products, 
  categories, 
  supplierProfiles, 
  users,
  notifications,
  activity_logs,
  InsertNotification,
  InsertActivityLog 
} from '@shared/schema';
import { eq, and, or, ilike, desc, sql, count, inArray } from 'drizzle-orm';
import { adminMiddleware } from './auth';
import { z } from 'zod';
import { logAdminActivity } from './adminOversightService';

const router = Router();

// Apply admin middleware to all routes
router.use(adminMiddleware);

// Validation schemas
const bulkActionSchema = z.object({
  productIds: z.array(z.string()),
  action: z.enum(['approve', 'reject', 'feature', 'unfeature', 'delete']),
  notes: z.string().optional(),
});

const productActionSchema = z.object({
  notes: z.string().optional(),
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

// GET /api/admin/products - Get all products with filters
router.get('/', async (req, res) => {
  try {
    const { 
      limit = '50', 
      offset = '0', 
      search, 
      status, 
      category, 
      supplier, 
      featured, 
      inStock 
    } = req.query;
    
    // Build where conditions
    const conditions = [];

    // Search filter
    if (search) {
      const searchTerm = `%${search}%`;
      const searchConditions = or(
        ilike(products.name, searchTerm),
        ilike(products.description, searchTerm),
        ilike(products.sku, searchTerm)
      );
      if (searchConditions) {
        conditions.push(searchConditions);
      }
    }

    // Status filter
    if (status) {
      const statusArray = Array.isArray(status) ? status : [status];
      if (statusArray.length > 0) {
        conditions.push(inArray(products.status, statusArray as string[]));
      }
    }

    // Category filter
    if (category) {
      conditions.push(eq(products.categoryId, category as string));
    }

    // Supplier filter
    if (supplier) {
      conditions.push(eq(products.supplierId, supplier as string));
    }

    // Featured filter
    if (featured === 'true') {
      conditions.push(eq(products.isFeatured, true));
    }

    // In stock filter
    if (inStock === 'true') {
      conditions.push(eq(products.inStock, true));
    }

    // Get products with supplier and category info
    let query = db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        shortDescription: products.shortDescription,
        description: products.description,
        categoryId: products.categoryId,
        categoryName: categories.name,
        images: products.images,
        supplierId: products.supplierId,
        supplierName: supplierProfiles.businessName,
        supplierTier: supplierProfiles.membershipTier,
        status: products.status,
        isApproved: products.isApproved,
        isPublished: products.isPublished,
        isFeatured: products.isFeatured,
        minOrderQuantity: products.minOrderQuantity,
        sampleAvailable: products.sampleAvailable,
        samplePrice: products.samplePrice,
        customizationAvailable: products.customizationAvailable,
        inStock: products.inStock,
        stockQuantity: products.stockQuantity,
        views: products.views,
        inquiries: products.inquiries,
        tags: products.tags,
        sku: products.sku,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        approvedAt: products.approvedAt,
        approvedBy: products.approvedBy,
        rejectionReason: products.rejectionReason,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(supplierProfiles, eq(products.supplierId, supplierProfiles.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const productResults = await query
      .orderBy(desc(products.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    // Get stats
    const statsQuery = db
      .select({
        totalProducts: count(),
        publishedProducts: sql<number>`COUNT(CASE WHEN ${products.isPublished} = true THEN 1 END)`,
        draftProducts: sql<number>`COUNT(CASE WHEN ${products.status} = 'draft' THEN 1 END)`,
        featuredProducts: sql<number>`COUNT(CASE WHEN ${products.isFeatured} = true THEN 1 END)`,
        outOfStockProducts: sql<number>`COUNT(CASE WHEN ${products.inStock} = false THEN 1 END)`,
        totalViews: sql<number>`COALESCE(SUM(${products.views}), 0)`,
        totalInquiries: sql<number>`COALESCE(SUM(${products.inquiries}), 0)`,
      })
      .from(products);

    const [statsResult] = await statsQuery;

    const stats = {
      totalProducts: Number(statsResult.totalProducts),
      publishedProducts: Number(statsResult.publishedProducts),
      draftProducts: Number(statsResult.draftProducts),
      featuredProducts: Number(statsResult.featuredProducts),
      outOfStockProducts: Number(statsResult.outOfStockProducts),
      totalViews: Number(statsResult.totalViews),
      totalInquiries: Number(statsResult.totalInquiries),
      conversionRate: Number(statsResult.totalViews) > 0 ? 
        (Number(statsResult.totalInquiries) / Number(statsResult.totalViews)) * 100 : 0,
      highPerformers: productResults.filter(p => (p.views || 0) + ((p.inquiries || 0) * 10) >= 100).length
    };

    // Log admin activity
    await logAdminActivity(req.user!.id, 'product_list_viewed', 'products', null, {
      filters: { search, status, category, supplier, featured, inStock },
      resultCount: productResults.length
    });

    res.json({
      success: true,
      products: productResults,
      stats,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: stats.totalProducts
      }
    });

  } catch (error) {
    console.error('Get admin products error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch products' 
    });
  }
});

// POST /api/admin/products/:id/approve - Approve a product
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = productActionSchema.parse(req.body);

    // Get product details
    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        supplierId: products.supplierId,
        status: products.status
      })
      .from(products)
      .where(eq(products.id, id));

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
    }

    // Update product status
    await db
      .update(products)
      .set({
        status: 'approved',
        isApproved: true,
        isPublished: true,
        approvedAt: new Date(),
        approvedBy: req.user!.id,
        updatedAt: new Date()
      })
      .where(eq(products.id, id));

    // Create notification for supplier
    if (product.supplierId) {
      const [supplier] = await db
        .select({ userId: supplierProfiles.userId })
        .from(supplierProfiles)
        .where(eq(supplierProfiles.id, product.supplierId));

      if (supplier) {
        await createNotification({
          userId: supplier.userId,
          type: 'product_approved',
          title: 'Product Approved',
          message: `Your product "${product.name}" has been approved and is now live.`,
          data: { productId: id, notes },
          isRead: false
        });
      }
    }

    // Log admin activity
    await logAdminActivity(req.user!.id, 'product_approved', 'products', id, {
      productName: product.name,
      notes
    });

    res.json({
      success: true,
      message: 'Product approved successfully'
    });

  } catch (error) {
    console.error('Approve product error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to approve product' 
    });
  }
});

// POST /api/admin/products/:id/reject - Reject a product
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = productActionSchema.parse(req.body);

    if (!notes || !notes.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Rejection reason is required' 
      });
    }

    // Get product details
    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        supplierId: products.supplierId,
        status: products.status
      })
      .from(products)
      .where(eq(products.id, id));

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
    }

    // Update product status
    await db
      .update(products)
      .set({
        status: 'rejected',
        isApproved: false,
        isPublished: false,
        rejectionReason: notes,
        updatedAt: new Date()
      })
      .where(eq(products.id, id));

    // Create notification for supplier
    if (product.supplierId) {
      const [supplier] = await db
        .select({ userId: supplierProfiles.userId })
        .from(supplierProfiles)
        .where(eq(supplierProfiles.id, product.supplierId));

      if (supplier) {
        await createNotification({
          userId: supplier.userId,
          type: 'product_rejected',
          title: 'Product Rejected',
          message: `Your product "${product.name}" has been rejected. Please review the feedback and resubmit.`,
          data: { productId: id, reason: notes },
          isRead: false
        });
      }
    }

    // Log admin activity
    await logAdminActivity(req.user!.id, 'product_rejected', 'products', id, {
      productName: product.name,
      reason: notes
    });

    res.json({
      success: true,
      message: 'Product rejected successfully'
    });

  } catch (error) {
    console.error('Reject product error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to reject product' 
    });
  }
});

// POST /api/admin/products/:id/feature - Feature a product
router.post('/:id/feature', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = productActionSchema.parse(req.body);

    // Get product details
    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        supplierId: products.supplierId,
        isFeatured: products.isFeatured,
        isApproved: products.isApproved
      })
      .from(products)
      .where(eq(products.id, id));

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
    }

    if (!product.isApproved) {
      return res.status(400).json({ 
        success: false, 
        error: 'Only approved products can be featured' 
      });
    }

    // Update product featured status
    await db
      .update(products)
      .set({
        isFeatured: true,
        updatedAt: new Date()
      })
      .where(eq(products.id, id));

    // Create notification for supplier
    if (product.supplierId) {
      const [supplier] = await db
        .select({ userId: supplierProfiles.userId })
        .from(supplierProfiles)
        .where(eq(supplierProfiles.id, product.supplierId));

      if (supplier) {
        await createNotification({
          userId: supplier.userId,
          type: 'product_featured',
          title: 'Product Featured',
          message: `Your product "${product.name}" has been featured on the platform!`,
          data: { productId: id, notes },
          isRead: false
        });
      }
    }

    // Log admin activity
    await logAdminActivity(req.user!.id, 'product_featured', 'products', id, {
      productName: product.name,
      notes
    });

    res.json({
      success: true,
      message: 'Product featured successfully'
    });

  } catch (error) {
    console.error('Feature product error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to feature product' 
    });
  }
});

// POST /api/admin/products/:id/unfeature - Unfeature a product
router.post('/:id/unfeature', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = productActionSchema.parse(req.body);

    // Get product details
    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        supplierId: products.supplierId,
        isFeatured: products.isFeatured
      })
      .from(products)
      .where(eq(products.id, id));

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
    }

    // Update product featured status
    await db
      .update(products)
      .set({
        isFeatured: false,
        updatedAt: new Date()
      })
      .where(eq(products.id, id));

    // Log admin activity
    await logAdminActivity(req.user!.id, 'product_unfeatured', 'products', id, {
      productName: product.name,
      notes
    });

    res.json({
      success: true,
      message: 'Product unfeatured successfully'
    });

  } catch (error) {
    console.error('Unfeature product error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to unfeature product' 
    });
  }
});

// POST /api/admin/products/:id/delete - Delete a product
router.post('/:id/delete', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = productActionSchema.parse(req.body);

    // Get product details
    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        supplierId: products.supplierId
      })
      .from(products)
      .where(eq(products.id, id));

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
    }

    // Delete product
    await db.delete(products).where(eq(products.id, id));

    // Create notification for supplier
    if (product.supplierId) {
      const [supplier] = await db
        .select({ userId: supplierProfiles.userId })
        .from(supplierProfiles)
        .where(eq(supplierProfiles.id, product.supplierId));

      if (supplier) {
        await createNotification({
          userId: supplier.userId,
          type: 'product_deleted',
          title: 'Product Deleted',
          message: `Your product "${product.name}" has been removed from the platform.`,
          data: { productName: product.name, reason: notes },
          isRead: false
        });
      }
    }

    // Log admin activity
    await logAdminActivity(req.user!.id, 'product_deleted', 'products', id, {
      productName: product.name,
      reason: notes
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete product' 
    });
  }
});

// POST /api/admin/products/bulk - Bulk actions on products
router.post('/bulk', async (req, res) => {
  try {
    const { productIds, action, notes } = bulkActionSchema.parse(req.body);

    if (productIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No products selected' 
      });
    }

    if (action === 'reject' && (!notes || !notes.trim())) {
      return res.status(400).json({ 
        success: false, 
        error: 'Rejection reason is required for bulk reject' 
      });
    }

    // Get product details
    const productDetails = await db
      .select({
        id: products.id,
        name: products.name,
        supplierId: products.supplierId,
        status: products.status,
        isApproved: products.isApproved,
        isFeatured: products.isFeatured
      })
      .from(products)
      .where(inArray(products.id, productIds));

    if (productDetails.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No products found' 
      });
    }

    let updateData: any = { updatedAt: new Date() };
    let notificationType = '';
    let notificationTitle = '';
    let notificationMessage = '';

    switch (action) {
      case 'approve':
        updateData = {
          ...updateData,
          status: 'approved',
          isApproved: true,
          isPublished: true,
          approvedAt: new Date(),
          approvedBy: req.user!.id
        };
        notificationType = 'products_approved';
        notificationTitle = 'Products Approved';
        notificationMessage = `${productIds.length} of your products have been approved and are now live.`;
        break;

      case 'reject':
        updateData = {
          ...updateData,
          status: 'rejected',
          isApproved: false,
          isPublished: false,
          rejectionReason: notes
        };
        notificationType = 'products_rejected';
        notificationTitle = 'Products Rejected';
        notificationMessage = `${productIds.length} of your products have been rejected. Please review the feedback.`;
        break;

      case 'feature':
        // Only feature approved products
        const approvedProducts = productDetails.filter(p => p.isApproved);
        if (approvedProducts.length === 0) {
          return res.status(400).json({ 
            success: false, 
            error: 'Only approved products can be featured' 
          });
        }
        updateData = { ...updateData, isFeatured: true };
        notificationType = 'products_featured';
        notificationTitle = 'Products Featured';
        notificationMessage = `${approvedProducts.length} of your products have been featured!`;
        break;

      case 'unfeature':
        updateData = { ...updateData, isFeatured: false };
        break;

      case 'delete':
        // Delete products
        await db.delete(products).where(inArray(products.id, productIds));
        
        // Create notifications for suppliers
        const supplierNotifications = new Map();
        for (const product of productDetails) {
          if (product.supplierId) {
            if (!supplierNotifications.has(product.supplierId)) {
              supplierNotifications.set(product.supplierId, []);
            }
            supplierNotifications.get(product.supplierId).push(product.name);
          }
        }

        for (const [supplierId, productNames] of supplierNotifications) {
          const [supplier] = await db
            .select({ userId: supplierProfiles.userId })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.id, supplierId));

          if (supplier) {
            await createNotification({
              userId: supplier.userId,
              type: 'products_deleted',
              title: 'Products Deleted',
              message: `${productNames.length} of your products have been removed: ${productNames.join(', ')}`,
              data: { productNames, reason: notes },
              isRead: false
            });
          }
        }

        // Log admin activity
        await logAdminActivity(req.user!.id, 'products_bulk_deleted', 'products', null, {
          productIds,
          productCount: productIds.length,
          reason: notes
        });

        return res.json({
          success: true,
          message: `${productIds.length} products deleted successfully`
        });
    }

    // Update products (for non-delete actions)
    if (action !== 'delete') {
      await db
        .update(products)
        .set(updateData)
        .where(inArray(products.id, productIds));

      // Create notifications for suppliers
      if (notificationType) {
        const supplierNotifications = new Map();
        for (const product of productDetails) {
          if (product.supplierId) {
            if (!supplierNotifications.has(product.supplierId)) {
              supplierNotifications.set(product.supplierId, 0);
            }
            supplierNotifications.set(product.supplierId, supplierNotifications.get(product.supplierId) + 1);
          }
        }

        for (const [supplierId, count] of supplierNotifications) {
          const [supplier] = await db
            .select({ userId: supplierProfiles.userId })
            .from(supplierProfiles)
            .where(eq(supplierProfiles.id, supplierId));

          if (supplier) {
            await createNotification({
              userId: supplier.userId,
              type: notificationType,
              title: notificationTitle,
              message: count === 1 ? notificationMessage.replace(`${productIds.length}`, '1') : notificationMessage,
              data: { productIds: productDetails.filter(p => p.supplierId === supplierId).map(p => p.id), notes },
              isRead: false
            });
          }
        }
      }

      // Log admin activity
      await logAdminActivity(req.user!.id, `products_bulk_${action}`, 'products', null, {
        productIds,
        productCount: productIds.length,
        notes
      });
    }

    res.json({
      success: true,
      message: `${productIds.length} products ${action}${action.endsWith('e') ? 'd' : 'ed'} successfully`
    });

  } catch (error) {
    console.error('Bulk product action error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to perform bulk action' 
    });
  }
});

export { router as adminProductRoutes };