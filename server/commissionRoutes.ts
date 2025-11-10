import { Router } from "express";
import { db } from "./db";
import { authMiddleware } from "./auth";
import { 
  commissions, payouts, orders, supplierProfiles, users 
} from "@shared/schema";
import { eq, and, desc, gte, lte, sql, or } from "drizzle-orm";

const router = Router();

// Default platform commission rate (can be overridden per supplier)
const DEFAULT_COMMISSION_RATE = 0.10; // 10%

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
    const { status, startDate, endDate, limit, offset } = req.query;

    // Build conditions array
    const conditions = [eq(commissions.supplierId, supplierId)];

    if (status) {
      conditions.push(eq(commissions.status, status as string));
    }
    if (startDate) {
      conditions.push(gte(commissions.createdAt, new Date(startDate as string)));
    }
    if (endDate) {
      conditions.push(lte(commissions.createdAt, new Date(endDate as string)));
    }

    // Build query with all conditions at once
    let query = db.select({
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
    .where(and(...conditions))
    .orderBy(desc(commissions.createdAt))
    .$dynamic();

    if (limit) {
      query = query.limit(parseInt(limit as string));
    }
    if (offset) {
      query = query.offset(parseInt(offset as string));
    }

    const commissionsList = await query;

    // Get total count
    const countQuery = db.select({ count: sql`count(*)` })
      .from(commissions)
      .where(and(...conditions));

    const [{ count }] = await countQuery;

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
      total: parseInt(count as string),
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

    if (supplierProfile.length === 0) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    const supplierId = supplierProfile[0].id;
    const { status, startDate, endDate, limit, offset } = req.query;

    // Build conditions array
    const conditions = [eq(payouts.supplierId, supplierId)];

    if (status) {
      conditions.push(eq(payouts.status, status as string));
    }
    if (startDate) {
      conditions.push(gte(payouts.createdAt, new Date(startDate as string)));
    }
    if (endDate) {
      conditions.push(lte(payouts.createdAt, new Date(endDate as string)));
    }

    // Build query with all conditions at once
    let query = db.select()
      .from(payouts)
      .where(and(...conditions))
      .orderBy(desc(payouts.createdAt))
      .$dynamic();

    if (limit) {
      query = query.limit(parseInt(limit as string));
    }
    if (offset) {
      query = query.offset(parseInt(offset as string));
    }

    const payoutsList = await query;

    // Get total count
    const countQuery = db.select({ count: sql`count(*)` })
      .from(payouts)
      .where(and(...conditions));

    const [{ count }] = await countQuery;

    res.json({
      success: true,
      payouts: payoutsList,
      total: parseInt(count as string)
    });

  } catch (error: any) {
    console.error('Get supplier payouts error:', error);
    res.status(500).json({ error: 'Failed to fetch payouts' });
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

    // TODO: Notify supplier about failed payout with reason

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

export default router;
