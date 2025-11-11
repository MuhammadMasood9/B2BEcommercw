import { Router } from "express";
import { db } from "./db";
import { authMiddleware } from "./auth";
import { 
  commissions, payouts, orders, supplierProfiles, users,
  commissionPayments, commissionPaymentItems
} from "@shared/schema";
import { eq, and, desc, gte, lte, sql, or, inArray } from "drizzle-orm";
import { notificationService } from "./notificationService";

const router = Router();

// Default platform commission rate (can be overridden per supplier)
const DEFAULT_COMMISSION_RATE = 0.10; // 10%

// Default credit limit for suppliers
const DEFAULT_CREDIT_LIMIT = 1000.00;

// ==================== COMMISSION CALCULATION ====================

/**
 * Calculate commission for an order
 */
export async function calculateCommission(orderId: string, supplierId: string, orderAmount: number) {
  try {
    // Get supplier's custom commission rate or use default
    const supplier = await db.select({
      commissionRate: supplierProfiles.commissionRate
    })
    .from(supplierProfiles)
    .where(eq(supplierProfiles.id, supplierId))
    .limit(1);

    const commissionRate = supplier[0]?.commissionRate 
      ? parseFloat(supplier[0].commissionRate) 
      : DEFAULT_COMMISSION_RATE;

    const commissionAmount = orderAmount * commissionRate;
    const supplierAmount = orderAmount - commissionAmount;

    // Create commission record
    const [commission] = await db.insert(commissions)
      .values({
        orderId,
        supplierId,
        orderAmount: orderAmount.toString(),
        commissionRate: commissionRate.toString(),
        commissionAmount: commissionAmount.toString(),
        supplierAmount: supplierAmount.toString(),
        status: 'pending'
      })
      .returning();

    return commission;
  } catch (error) {
    console.error('Error calculating commission:', error);
    throw error;
  }
}

/**
 * Mark commission as paid when order is completed
 */
export async function markCommissionPaid(orderId: string) {
  try {
    const [commission] = await db.update(commissions)
      .set({ status: 'paid' })
      .where(eq(commissions.orderId, orderId))
      .returning();

    return commission;
  } catch (error) {
    console.error('Error marking commission as paid:', error);
    throw error;
  }
}

// ==================== SUPPLIER COMMISSION ROUTES ====================

// Get supplier's commission history
router.get("/supplier/commissions", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'supplier') {
      return res.status(403).json({ error: 'Access denied. Supplier role required.' });
    }

    // Get supplier profile
    const supplierProfile = await db.select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.userId, req.user.id))
      .limit(1);

    if (supplierProfile.length === 0) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    const supplierId = supplierProfile[0].id;

    // Simple query - get all commissions for this supplier
    const commissionsList = await db.select({
      id: commissions.id,
      orderId: commissions.orderId,
      orderAmount: commissions.orderAmount,
      commissionRate: commissions.commissionRate,
      commissionAmount: commissions.commissionAmount,
      supplierAmount: commissions.supplierAmount,
      status: commissions.status,
      createdAt: commissions.createdAt,
      // Order details
      orderNumber: orders.orderNumber,
      orderStatus: orders.status
    })
    .from(commissions)
    .leftJoin(orders, eq(commissions.orderId, orders.id))
    .where(eq(commissions.supplierId, supplierId));

    // Calculate summary statistics
    const summaryQuery = await db.select({
      totalEarnings: sql`sum(cast(${commissions.supplierAmount} as decimal))`,
      totalCommissions: sql`sum(cast(${commissions.commissionAmount} as decimal))`,
      totalOrders: sql`count(*)`,
      pendingAmount: sql`sum(case when ${commissions.status} = 'pending' then cast(${commissions.supplierAmount} as decimal) else 0 end)`,
      paidAmount: sql`sum(case when ${commissions.status} = 'paid' then cast(${commissions.supplierAmount} as decimal) else 0 end)`
    })
    .from(commissions)
    .where(eq(commissions.supplierId, supplierId));

    const summary = summaryQuery[0];

    res.json({
      success: true,
      commissions: commissionsList,
      total: commissionsList.length,
      summary: {
        totalEarnings: parseFloat(summary.totalEarnings as string || '0'),
        totalCommissions: parseFloat(summary.totalCommissions as string || '0'),
        totalOrders: parseInt(summary.totalOrders as string || '0'),
        pendingAmount: parseFloat(summary.pendingAmount as string || '0'),
        paidAmount: parseFloat(summary.paidAmount as string || '0')
      }
    });

  } catch (error: any) {
    console.error('Get supplier commissions error:', error);
    res.status(500).json({ error: 'Failed to fetch commissions' });
  }
});

// Get supplier's commission summary
router.get("/supplier/commissions/summary", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'supplier') {
      return res.status(403).json({ error: 'Access denied. Supplier role required.' });
    }

    // Get supplier profile
    const supplierProfile = await db.select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.userId, req.user.id))
      .limit(1);

    if (supplierProfile.length === 0) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    const supplierId = supplierProfile[0].id;
    const commissionRate = supplierProfile[0].commissionRate 
      ? parseFloat(supplierProfile[0].commissionRate) 
      : DEFAULT_COMMISSION_RATE;

    // Get commission statistics
    const stats = await db.select({
      totalEarnings: sql`sum(cast(${commissions.supplierAmount} as decimal))`,
      totalCommissions: sql`sum(cast(${commissions.commissionAmount} as decimal))`,
      totalOrders: sql`count(*)`,
      pendingAmount: sql`sum(case when ${commissions.status} = 'pending' then cast(${commissions.supplierAmount} as decimal) else 0 end)`,
      paidAmount: sql`sum(case when ${commissions.status} = 'paid' then cast(${commissions.supplierAmount} as decimal) else 0 end)`,
      disputedAmount: sql`sum(case when ${commissions.status} = 'disputed' then cast(${commissions.supplierAmount} as decimal) else 0 end)`
    })
    .from(commissions)
    .where(eq(commissions.supplierId, supplierId));

    const summary = stats[0];

    // Get recent commissions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentStats = await db.select({
      recentEarnings: sql`sum(cast(${commissions.supplierAmount} as decimal))`,
      recentOrders: sql`count(*)`
    })
    .from(commissions)
    .where(and(
      eq(commissions.supplierId, supplierId),
      gte(commissions.createdAt, thirtyDaysAgo)
    ));

    res.json({
      success: true,
      summary: {
        commissionRate: commissionRate * 100, // Convert to percentage
        totalEarnings: parseFloat(summary.totalEarnings as string || '0'),
        totalCommissions: parseFloat(summary.totalCommissions as string || '0'),
        totalOrders: parseInt(summary.totalOrders as string || '0'),
        pendingAmount: parseFloat(summary.pendingAmount as string || '0'),
        paidAmount: parseFloat(summary.paidAmount as string || '0'),
        disputedAmount: parseFloat(summary.disputedAmount as string || '0'),
        recentEarnings: parseFloat(recentStats[0]?.recentEarnings as string || '0'),
        recentOrders: parseInt(recentStats[0]?.recentOrders as string || '0')
      }
    });

  } catch (error: any) {
    console.error('Get commission summary error:', error);
    res.status(500).json({ error: 'Failed to fetch commission summary' });
  }
});

// ==================== SUPPLIER PAYOUT ROUTES ====================

// Get supplier's payout history
router.get("/supplier/payouts", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'supplier') {
      return res.status(403).json({ error: 'Access denied. Supplier role required.' });
    }

    // Get supplier profile
    const supplierProfile = await db.select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.userId, req.user.id))
      .limit(1);

    // If no supplier profile, return empty (not an error)
    if (supplierProfile.length === 0) {
      return res.json({
        success: true,
        payouts: [],
        total: 0
      });
    }

    const supplierId = supplierProfile[0].id;

    // Get all payouts for this supplier
    const payoutsList = await db.select()
      .from(payouts)
      .where(eq(payouts.supplierId, supplierId));

    res.json({
      success: true,
      payouts: payoutsList,
      total: payoutsList.length
    });

  } catch (error: any) {
    console.error('Get supplier payouts error:', error);
    console.error('Error stack:', error.stack);
    // Return empty instead of error for better UX
    res.json({
      success: true,
      payouts: [],
      total: 0
    });
  }
});

// Request payout (supplier initiates payout request)
router.post("/supplier/payouts/request", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'supplier') {
      return res.status(403).json({ error: 'Access denied. Supplier role required.' });
    }

    // Get supplier profile
    const supplierProfile = await db.select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.userId, req.user.id))
      .limit(1);

    if (supplierProfile.length === 0) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    const supplierId = supplierProfile[0].id;
    const { payoutMethod } = req.body;

    if (!payoutMethod || !['bank_transfer', 'paypal'].includes(payoutMethod)) {
      return res.status(400).json({ error: 'Valid payout method is required (bank_transfer or paypal)' });
    }

    // Calculate available balance (paid commissions not yet paid out)
    const availableBalance = await db.select({
      amount: sql`sum(cast(${commissions.supplierAmount} as decimal))`,
      commissionDeducted: sql`sum(cast(${commissions.commissionAmount} as decimal))`
    })
    .from(commissions)
    .where(and(
      eq(commissions.supplierId, supplierId),
      eq(commissions.status, 'paid')
    ));

    const amount = parseFloat(availableBalance[0]?.amount as string || '0');
    const commissionDeducted = parseFloat(availableBalance[0]?.commissionDeducted as string || '0');

    if (amount <= 0) {
      return res.status(400).json({ error: 'No available balance for payout' });
    }

    // Create payout request
    const [payout] = await db.insert(payouts)
      .values({
        supplierId,
        amount: amount.toString(),
        commissionDeducted: commissionDeducted.toString(),
        netAmount: amount.toString(), // Net amount is same as amount (commission already deducted)
        payoutMethod,
        status: 'pending',
        scheduledDate: new Date()
      })
      .returning();

    // Notify supplier
    await notificationService.createNotification({
      userId: req.user.id,
      type: 'success',
      title: 'Payout Requested',
      message: `Your payout request of $${amount.toFixed(2)} has been submitted and is pending review.`,
      relatedId: payout.id,
      relatedType: 'payout'
    });

    res.json({
      success: true,
      message: 'Payout request submitted successfully',
      payout
    });

  } catch (error: any) {
    console.error('Request payout error:', error);
    res.status(500).json({ error: 'Failed to request payout' });
  }
});

// ==================== ADMIN COMMISSION ROUTES ====================

// Get all commissions (admin)
router.get("/admin/commissions", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { supplierId, status, startDate, endDate, limit, offset } = req.query;

    // Build conditions array
    const conditions = [];

    if (supplierId) {
      conditions.push(eq(commissions.supplierId, supplierId as string));
    }
    if (status) {
      conditions.push(eq(commissions.status, status as string));
    }
    if (startDate) {
      conditions.push(gte(commissions.createdAt, new Date(startDate as string)));
    }
    if (endDate) {
      conditions.push(lte(commissions.createdAt, new Date(endDate as string)));
    }

    // Build base query
    let queryBuilder = db.select({
      id: commissions.id,
      orderId: commissions.orderId,
      supplierId: commissions.supplierId,
      orderAmount: commissions.orderAmount,
      commissionRate: commissions.commissionRate,
      commissionAmount: commissions.commissionAmount,
      supplierAmount: commissions.supplierAmount,
      status: commissions.status,
      createdAt: commissions.createdAt,
      // Order details
      orderNumber: orders.orderNumber,
      orderStatus: orders.status,
      // Supplier details
      supplierName: supplierProfiles.businessName,
      storeName: supplierProfiles.storeName
    })
    .from(commissions)
    .leftJoin(orders, eq(commissions.orderId, orders.id))
    .leftJoin(supplierProfiles, eq(commissions.supplierId, supplierProfiles.id));

    // Apply conditions if any
    let query = conditions.length > 0 
      ? queryBuilder.where(and(...conditions)).$dynamic()
      : queryBuilder.$dynamic();

    query = query.orderBy(desc(commissions.createdAt));

    if (limit) {
      query = query.limit(parseInt(limit as string));
    }
    if (offset) {
      query = query.offset(parseInt(offset as string));
    }

    const commissionsList = await query;

    // Get total count
    const countQueryBuilder = db.select({ count: sql`count(*)` })
      .from(commissions);
    
    const countQuery = conditions.length > 0 
      ? countQueryBuilder.where(and(...conditions))
      : countQueryBuilder;

    const [{ count }] = await countQuery;

    res.json({
      success: true,
      commissions: commissionsList,
      total: parseInt(count as string)
    });

  } catch (error: any) {
    console.error('Get all commissions error:', error);
    res.status(500).json({ error: 'Failed to fetch commissions' });
  }
});

// Get commission analytics (admin)
router.get("/admin/commissions/analytics", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    // Overall commission statistics
    const overallStats = await db.select({
      totalRevenue: sql`sum(cast(${commissions.commissionAmount} as decimal))`,
      totalOrders: sql`count(*)`,
      pendingRevenue: sql`sum(case when ${commissions.status} = 'pending' then cast(${commissions.commissionAmount} as decimal) else 0 end)`,
      paidRevenue: sql`sum(case when ${commissions.status} = 'paid' then cast(${commissions.commissionAmount} as decimal) else 0 end)`,
      disputedRevenue: sql`sum(case when ${commissions.status} = 'disputed' then cast(${commissions.commissionAmount} as decimal) else 0 end)`
    })
    .from(commissions);

    const stats = overallStats[0];

    // Revenue by supplier (top 10)
    const topSuppliers = await db.select({
      supplierId: commissions.supplierId,
      supplierName: supplierProfiles.businessName,
      storeName: supplierProfiles.storeName,
      totalCommission: sql`sum(cast(${commissions.commissionAmount} as decimal))`,
      totalOrders: sql`count(*)`,
      averageCommission: sql`avg(cast(${commissions.commissionAmount} as decimal))`
    })
    .from(commissions)
    .leftJoin(supplierProfiles, eq(commissions.supplierId, supplierProfiles.id))
    .groupBy(commissions.supplierId, supplierProfiles.businessName, supplierProfiles.storeName)
    .orderBy(desc(sql`sum(cast(${commissions.commissionAmount} as decimal))`))
    .limit(10);

    // Recent revenue (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentStats = await db.select({
      recentRevenue: sql`sum(cast(${commissions.commissionAmount} as decimal))`,
      recentOrders: sql`count(*)`
    })
    .from(commissions)
    .where(gte(commissions.createdAt, thirtyDaysAgo));

    res.json({
      success: true,
      analytics: {
        totalRevenue: parseFloat(stats.totalRevenue as string || '0'),
        totalOrders: parseInt(stats.totalOrders as string || '0'),
        pendingRevenue: parseFloat(stats.pendingRevenue as string || '0'),
        paidRevenue: parseFloat(stats.paidRevenue as string || '0'),
        disputedRevenue: parseFloat(stats.disputedRevenue as string || '0'),
        recentRevenue: parseFloat(recentStats[0]?.recentRevenue as string || '0'),
        recentOrders: parseInt(recentStats[0]?.recentOrders as string || '0'),
        topSuppliers: topSuppliers.map(s => ({
          supplierId: s.supplierId,
          supplierName: s.supplierName,
          storeName: s.storeName,
          totalCommission: parseFloat(s.totalCommission as string || '0'),
          totalOrders: parseInt(s.totalOrders as string || '0'),
          averageCommission: parseFloat(s.averageCommission as string || '0')
        }))
      }
    });

  } catch (error: any) {
    console.error('Get commission analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch commission analytics' });
  }
});

// ==================== ADMIN PAYOUT ROUTES ====================

// Get all payouts (admin)
router.get("/admin/payouts", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { supplierId, status, startDate, endDate, limit, offset } = req.query;

    // Build conditions array
    const conditions = [];

    if (supplierId) {
      conditions.push(eq(payouts.supplierId, supplierId as string));
    }
    if (status) {
      conditions.push(eq(payouts.status, status as string));
    }
    if (startDate) {
      conditions.push(gte(payouts.createdAt, new Date(startDate as string)));
    }
    if (endDate) {
      conditions.push(lte(payouts.createdAt, new Date(endDate as string)));
    }

    // Build base query
    let queryBuilder = db.select({
      id: payouts.id,
      supplierId: payouts.supplierId,
      amount: payouts.amount,
      commissionDeducted: payouts.commissionDeducted,
      netAmount: payouts.netAmount,
      payoutMethod: payouts.payoutMethod,
      status: payouts.status,
      scheduledDate: payouts.scheduledDate,
      processedDate: payouts.processedDate,
      transactionId: payouts.transactionId,
      createdAt: payouts.createdAt,
      // Supplier details
      supplierName: supplierProfiles.businessName,
      storeName: supplierProfiles.storeName,
      supplierEmail: users.email,
      supplierPhone: supplierProfiles.phone
    })
    .from(payouts)
    .leftJoin(supplierProfiles, eq(payouts.supplierId, supplierProfiles.id))
    .leftJoin(users, eq(supplierProfiles.userId, users.id));

    // Apply conditions if any
    let query = conditions.length > 0 
      ? queryBuilder.where(and(...conditions)).$dynamic()
      : queryBuilder.$dynamic();

    query = query.orderBy(desc(payouts.createdAt));

    if (limit) {
      query = query.limit(parseInt(limit as string));
    }
    if (offset) {
      query = query.offset(parseInt(offset as string));
    }

    const payoutsList = await query;

    // Get total count
    const countQueryBuilder = db.select({ count: sql`count(*)` })
      .from(payouts);
    
    const countQuery = conditions.length > 0 
      ? countQueryBuilder.where(and(...conditions))
      : countQueryBuilder;

    const [{ count }] = await countQuery;

    res.json({
      success: true,
      payouts: payoutsList,
      total: parseInt(count as string)
    });

  } catch (error: any) {
    console.error('Get all payouts error:', error);
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

// Process payout (admin approves and processes)
router.post("/admin/payouts/:id/process", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { transactionId } = req.body;

    const [payout] = await db.update(payouts)
      .set({
        status: 'processing',
        processedDate: new Date(),
        transactionId: transactionId || null
      })
      .where(eq(payouts.id, req.params.id))
      .returning();

    if (!payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    // Get supplier user ID for notification
    const supplier = await db.select({ userId: supplierProfiles.userId })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.id, payout.supplierId))
      .limit(1);

    if (supplier.length > 0) {
      await notificationService.createNotification({
        userId: supplier[0].userId,
        type: 'info',
        title: 'Payout Processing',
        message: `Your payout request of $${parseFloat(payout.netAmount).toFixed(2)} is being processed.`,
        relatedId: payout.id,
        relatedType: 'payout'
      });
    }

    res.json({
      success: true,
      message: 'Payout processing initiated',
      payout
    });

  } catch (error: any) {
    console.error('Process payout error:', error);
    res.status(500).json({ error: 'Failed to process payout' });
  }
});

// Complete payout (admin marks as completed)
router.post("/admin/payouts/:id/complete", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    const [payout] = await db.update(payouts)
      .set({
        status: 'completed',
        processedDate: new Date(),
        transactionId
      })
      .where(eq(payouts.id, req.params.id))
      .returning();

    if (!payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    // Get supplier user ID for notification
    const supplier = await db.select({ userId: supplierProfiles.userId })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.id, payout.supplierId))
      .limit(1);

    if (supplier.length > 0) {
      await notificationService.createNotification({
        userId: supplier[0].userId,
        type: 'success',
        title: 'Payout Completed',
        message: `Your payout of $${parseFloat(payout.netAmount).toFixed(2)} has been successfully transferred. Transaction ID: ${transactionId}`,
        relatedId: payout.id,
        relatedType: 'payout'
      });
    }

    res.json({
      success: true,
      message: 'Payout completed successfully',
      payout
    });

  } catch (error: any) {
    console.error('Complete payout error:', error);
    res.status(500).json({ error: 'Failed to complete payout' });
  }
});

// Fail payout (admin marks as failed)
router.post("/admin/payouts/:id/fail", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { reason } = req.body;

    const [payout] = await db.update(payouts)
      .set({
        status: 'failed',
        processedDate: new Date()
      })
      .where(eq(payouts.id, req.params.id))
      .returning();

    if (!payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    // Get supplier user ID for notification
    const supplier = await db.select({ userId: supplierProfiles.userId })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.id, payout.supplierId))
      .limit(1);

    if (supplier.length > 0) {
      await notificationService.createNotification({
        userId: supplier[0].userId,
        type: 'error',
        title: 'Payout Failed',
        message: `Your payout request of $${parseFloat(payout.netAmount).toFixed(2)} could not be processed. ${reason ? `Reason: ${reason}` : 'Please contact support for details.'}`,
        relatedId: payout.id,
        relatedType: 'payout'
      });
    }

    res.json({
      success: true,
      message: 'Payout marked as failed',
      payout,
      reason
    });

  } catch (error: any) {
    console.error('Fail payout error:', error);
    res.status(500).json({ error: 'Failed to mark payout as failed' });
  }
});

// Update supplier commission rate (admin)
router.patch("/admin/suppliers/:id/commission-rate", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { commissionRate } = req.body;

    if (commissionRate === undefined || commissionRate < 0 || commissionRate > 1) {
      return res.status(400).json({ error: 'Commission rate must be between 0 and 1 (0% to 100%)' });
    }

    const [supplier] = await db.update(supplierProfiles)
      .set({
        commissionRate: commissionRate.toString(),
        updatedAt: new Date()
      })
      .where(eq(supplierProfiles.id, req.params.id))
      .returning();

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({
      success: true,
      message: 'Commission rate updated successfully',
      supplier
    });

  } catch (error: any) {
    console.error('Update commission rate error:', error);
    res.status(500).json({ error: 'Failed to update commission rate' });
  }
});

// ==================== SUPPLIER COMMISSION PAYMENT ROUTES ====================

// Get supplier's unpaid commissions
router.get("/supplier/unpaid-commissions", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'supplier') {
      return res.status(403).json({ error: 'Access denied. Supplier role required.' });
    }

    const supplierProfile = await db.select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.userId, req.user.id))
      .limit(1);

    if (supplierProfile.length === 0) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    const supplierId = supplierProfile[0].id;

    // Get unpaid commissions
    const unpaidCommissions = await db.select({
      id: commissions.id,
      orderId: commissions.orderId,
      orderNumber: orders.orderNumber,
      orderAmount: commissions.orderAmount,
      commissionRate: commissions.commissionRate,
      commissionAmount: commissions.commissionAmount,
      status: commissions.status,
      createdAt: commissions.createdAt,
    })
    .from(commissions)
    .leftJoin(orders, eq(commissions.orderId, orders.id))
    .where(and(
      eq(commissions.supplierId, supplierId),
      or(
        eq(commissions.status, 'unpaid'),
        eq(commissions.status, 'payment_submitted')
      )
    ))
    .orderBy(desc(commissions.createdAt));

    res.json({
      success: true,
      commissions: unpaidCommissions,
      total: unpaidCommissions.length
    });

  } catch (error: any) {
    console.error('Get unpaid commissions error:', error);
    res.status(500).json({ error: 'Failed to fetch unpaid commissions' });
  }
});

// Get supplier's credit status
router.get("/supplier/credit-status", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'supplier') {
      return res.status(403).json({ error: 'Access denied. Supplier role required.' });
    }

    const supplierProfile = await db.select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.userId, req.user.id))
      .limit(1);

    if (supplierProfile.length === 0) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    const supplier = supplierProfile[0];

    res.json({
      success: true,
      creditStatus: {
        creditLimit: parseFloat(supplier.commissionCreditLimit || '1000'),
        totalUnpaid: parseFloat(supplier.totalUnpaidCommission || '0'),
        availableCredit: parseFloat(supplier.commissionCreditLimit || '1000') - parseFloat(supplier.totalUnpaidCommission || '0'),
        isRestricted: supplier.isRestricted || false,
        lastPaymentDate: supplier.lastPaymentDate
      }
    });

  } catch (error: any) {
    console.error('Get credit status error:', error);
    res.status(500).json({ error: 'Failed to fetch credit status' });
  }
});

// Submit commission payment
router.post("/supplier/submit-payment", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'supplier') {
      return res.status(403).json({ error: 'Access denied. Supplier role required.' });
    }

    const supplierProfile = await db.select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.userId, req.user.id))
      .limit(1);

    if (supplierProfile.length === 0) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    const supplierId = supplierProfile[0].id;
    const { commissionIds, paymentMethod, transactionId, paymentDate, paymentProofUrl, notes } = req.body;

    if (!commissionIds || commissionIds.length === 0) {
      return res.status(400).json({ error: 'At least one commission must be selected' });
    }

    if (!paymentMethod || !transactionId || !paymentDate) {
      return res.status(400).json({ error: 'Payment method, transaction ID, and payment date are required' });
    }

    // Get selected commissions
    const selectedCommissions = await db.select()
      .from(commissions)
      .where(and(
        eq(commissions.supplierId, supplierId),
        inArray(commissions.id, commissionIds),
        eq(commissions.status, 'unpaid')
      ));

    if (selectedCommissions.length === 0) {
      return res.status(400).json({ error: 'No valid unpaid commissions found' });
    }

    // Calculate total amount
    const totalAmount = selectedCommissions.reduce((sum, comm) => 
      sum + parseFloat(comm.commissionAmount), 0
    );

    // Create payment record
    const [payment] = await db.insert(commissionPayments)
      .values({
        supplierId,
        amount: totalAmount.toString(),
        paymentMethod,
        transactionId,
        paymentDate: new Date(paymentDate),
        paymentProofUrl: paymentProofUrl || null,
        notes: notes || null,
        status: 'pending'
      })
      .returning();

    // Create payment items
    for (const commission of selectedCommissions) {
      await db.insert(commissionPaymentItems)
        .values({
          paymentId: payment.id,
          commissionId: commission.id,
          amount: commission.commissionAmount
        });

      // Update commission status
      await db.update(commissions)
        .set({ 
          status: 'payment_submitted',
          paymentSubmittedAt: new Date()
        })
        .where(eq(commissions.id, commission.id));
    }

    // Notify supplier
    await notificationService.createNotification({
      userId: req.user.id,
      type: 'success',
      title: 'Payment Submitted',
      message: `Your commission payment of $${totalAmount.toFixed(2)} has been submitted for verification.`,
      relatedId: payment.id,
      relatedType: 'commission_payment'
    });

    res.json({
      success: true,
      message: 'Payment submitted successfully',
      payment
    });

  } catch (error: any) {
    console.error('Submit payment error:', error);
    res.status(500).json({ error: 'Failed to submit payment' });
  }
});

// Get supplier's payment history
router.get("/supplier/payment-history", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'supplier') {
      return res.status(403).json({ error: 'Access denied. Supplier role required.' });
    }

    const supplierProfile = await db.select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.userId, req.user.id))
      .limit(1);

    if (supplierProfile.length === 0) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    const supplierId = supplierProfile[0].id;

    // Get payment history
    const payments = await db.select()
      .from(commissionPayments)
      .where(eq(commissionPayments.supplierId, supplierId))
      .orderBy(desc(commissionPayments.createdAt));

    // Get payment items for each payment
    const paymentsWithItems = await Promise.all(
      payments.map(async (payment) => {
        const items = await db.select({
          commissionId: commissionPaymentItems.commissionId,
          amount: commissionPaymentItems.amount,
          orderNumber: orders.orderNumber
        })
        .from(commissionPaymentItems)
        .leftJoin(commissions, eq(commissionPaymentItems.commissionId, commissions.id))
        .leftJoin(orders, eq(commissions.orderId, orders.id))
        .where(eq(commissionPaymentItems.paymentId, payment.id));

        return {
          ...payment,
          items
        };
      })
    );

    res.json({
      success: true,
      payments: paymentsWithItems,
      total: payments.length
    });

  } catch (error: any) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// ==================== ADMIN COMMISSION PAYMENT ROUTES ====================

// Get all payment submissions
router.get("/admin/payment-submissions", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { status, supplierId } = req.query;

    let conditions = [];
    if (status) {
      conditions.push(eq(commissionPayments.status, status as string));
    }
    if (supplierId) {
      conditions.push(eq(commissionPayments.supplierId, supplierId as string));
    }

    const query = conditions.length > 0
      ? db.select({
          id: commissionPayments.id,
          supplierId: commissionPayments.supplierId,
          supplierName: supplierProfiles.businessName,
          storeName: supplierProfiles.storeName,
          amount: commissionPayments.amount,
          paymentMethod: commissionPayments.paymentMethod,
          transactionId: commissionPayments.transactionId,
          paymentDate: commissionPayments.paymentDate,
          paymentProofUrl: commissionPayments.paymentProofUrl,
          status: commissionPayments.status,
          notes: commissionPayments.notes,
          verifiedBy: commissionPayments.verifiedBy,
          verifiedAt: commissionPayments.verifiedAt,
          rejectionReason: commissionPayments.rejectionReason,
          createdAt: commissionPayments.createdAt
        })
        .from(commissionPayments)
        .leftJoin(supplierProfiles, eq(commissionPayments.supplierId, supplierProfiles.id))
        .where(and(...conditions))
        .orderBy(desc(commissionPayments.createdAt))
      : db.select({
          id: commissionPayments.id,
          supplierId: commissionPayments.supplierId,
          supplierName: supplierProfiles.businessName,
          storeName: supplierProfiles.storeName,
          amount: commissionPayments.amount,
          paymentMethod: commissionPayments.paymentMethod,
          transactionId: commissionPayments.transactionId,
          paymentDate: commissionPayments.paymentDate,
          paymentProofUrl: commissionPayments.paymentProofUrl,
          status: commissionPayments.status,
          notes: commissionPayments.notes,
          verifiedBy: commissionPayments.verifiedBy,
          verifiedAt: commissionPayments.verifiedAt,
          rejectionReason: commissionPayments.rejectionReason,
          createdAt: commissionPayments.createdAt
        })
        .from(commissionPayments)
        .leftJoin(supplierProfiles, eq(commissionPayments.supplierId, supplierProfiles.id))
        .orderBy(desc(commissionPayments.createdAt));

    const payments = await query;

    res.json({
      success: true,
      payments,
      total: payments.length
    });

  } catch (error: any) {
    console.error('Get payment submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch payment submissions' });
  }
});

// Verify payment
router.post("/admin/payment-submissions/:id/verify", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const paymentId = req.params.id;

    // Get payment and its items
    const [payment] = await db.select()
      .from(commissionPayments)
      .where(eq(commissionPayments.id, paymentId))
      .limit(1);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'Payment is not pending' });
    }

    // Get payment items
    const items = await db.select()
      .from(commissionPaymentItems)
      .where(eq(commissionPaymentItems.paymentId, paymentId));

    // Update payment status
    await db.update(commissionPayments)
      .set({
        status: 'verified',
        verifiedBy: req.user.id,
        verifiedAt: new Date()
      })
      .where(eq(commissionPayments.id, paymentId));

    // Mark all linked commissions as paid
    for (const item of items) {
      await db.update(commissions)
        .set({
          status: 'paid',
          paymentDate: payment.paymentDate,
          paymentTransactionId: payment.transactionId,
          paymentVerifiedBy: req.user.id,
          paymentVerifiedAt: new Date()
        })
        .where(eq(commissions.id, item.commissionId));
    }

    // Update supplier's last payment date
    await db.update(supplierProfiles)
      .set({
        lastPaymentDate: new Date()
      })
      .where(eq(supplierProfiles.id, payment.supplierId));

    // Get supplier user ID for notification
    const supplier = await db.select({ userId: supplierProfiles.userId })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.id, payment.supplierId))
      .limit(1);

    if (supplier.length > 0) {
      await notificationService.createNotification({
        userId: supplier[0].userId,
        type: 'success',
        title: 'Payment Verified',
        message: `Your commission payment of $${parseFloat(payment.amount).toFixed(2)} has been verified and processed.`,
        relatedId: paymentId,
        relatedType: 'commission_payment'
      });
    }

    res.json({
      success: true,
      message: 'Payment verified successfully'
    });

  } catch (error: any) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Reject payment
router.post("/admin/payment-submissions/:id/reject", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const paymentId = req.params.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const [payment] = await db.select()
      .from(commissionPayments)
      .where(eq(commissionPayments.id, paymentId))
      .limit(1);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Update payment status
    await db.update(commissionPayments)
      .set({
        status: 'rejected',
        rejectionReason: reason,
        verifiedBy: req.user.id,
        verifiedAt: new Date()
      })
      .where(eq(commissionPayments.id, paymentId));

    // Get payment items and reset commission status
    const items = await db.select()
      .from(commissionPaymentItems)
      .where(eq(commissionPaymentItems.paymentId, paymentId));

    for (const item of items) {
      await db.update(commissions)
        .set({
          status: 'unpaid',
          paymentSubmittedAt: null
        })
        .where(eq(commissions.id, item.commissionId));
    }

    // Get supplier user ID for notification
    const supplier = await db.select({ userId: supplierProfiles.userId })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.id, payment.supplierId))
      .limit(1);

    if (supplier.length > 0) {
      await notificationService.createNotification({
        userId: supplier[0].userId,
        type: 'error',
        title: 'Payment Rejected',
        message: `Your commission payment of $${parseFloat(payment.amount).toFixed(2)} was rejected. Reason: ${reason}`,
        relatedId: paymentId,
        relatedType: 'commission_payment'
      });
    }

    res.json({
      success: true,
      message: 'Payment rejected'
    });

  } catch (error: any) {
    console.error('Reject payment error:', error);
    res.status(500).json({ error: 'Failed to reject payment' });
  }
});

// Update supplier credit limit
router.patch("/admin/suppliers/:id/credit-limit", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { creditLimit } = req.body;

    if (creditLimit === undefined || creditLimit < 0) {
      return res.status(400).json({ error: 'Valid credit limit is required' });
    }

    const [supplier] = await db.update(supplierProfiles)
      .set({
        commissionCreditLimit: creditLimit.toString(),
        updatedAt: new Date()
      })
      .where(eq(supplierProfiles.id, req.params.id))
      .returning();

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({
      success: true,
      message: 'Credit limit updated successfully',
      supplier
    });

  } catch (error: any) {
    console.error('Update credit limit error:', error);
    res.status(500).json({ error: 'Failed to update credit limit' });
  }
});

// Get restricted suppliers
router.get("/admin/restricted-suppliers", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const restrictedSuppliers = await db.select({
      id: supplierProfiles.id,
      businessName: supplierProfiles.businessName,
      storeName: supplierProfiles.storeName,
      email: users.email,
      phone: supplierProfiles.phone,
      creditLimit: supplierProfiles.commissionCreditLimit,
      totalUnpaid: supplierProfiles.totalUnpaidCommission,
      isRestricted: supplierProfiles.isRestricted,
      lastPaymentDate: supplierProfiles.lastPaymentDate
    })
    .from(supplierProfiles)
    .leftJoin(users, eq(supplierProfiles.userId, users.id))
    .where(eq(supplierProfiles.isRestricted, true))
    .orderBy(desc(supplierProfiles.totalUnpaidCommission));

    res.json({
      success: true,
      suppliers: restrictedSuppliers,
      total: restrictedSuppliers.length
    });

  } catch (error: any) {
    console.error('Get restricted suppliers error:', error);
    res.status(500).json({ error: 'Failed to fetch restricted suppliers' });
  }
});

export default router;
