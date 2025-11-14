import { Router } from "express";
import { db } from "./db";
import { authMiddleware } from "./auth";
import { 
  commissions, payouts, orders, supplierProfiles, users,
  commissionPayments, commissionPaymentItems, commissionTiers, paymentSubmissions
} from "@shared/schema";
import { eq, and, desc, gte, lte, sql, or, inArray } from "drizzle-orm";
import { notificationService } from "./notificationService";

const router = Router();

// Default platform commission rate (can be overridden per supplier)
const DEFAULT_COMMISSION_RATE = 0.10; // 10%

// Default credit limit for suppliers
const DEFAULT_CREDIT_LIMIT = 10000.00; // ₹10,000

// Commission payment grace period (days)
const COMMISSION_GRACE_PERIOD_DAYS = 30;

// ==================== COMMISSION CALCULATION ====================

/**
 * Select commission tier based on order amount
 * Returns the applicable tier or null if no tier matches
 */
export async function selectCommissionTier(orderAmount: number) {
  try {
    console.log('=== SELECT COMMISSION TIER ===');
    console.log('Order amount:', orderAmount);

    // Get active commission tiers ordered by minAmount ascending
    const tiers = await db.select()
      .from(commissionTiers)
      .where(eq(commissionTiers.isActive, true))
      .orderBy(commissionTiers.minAmount);

    console.log('Active tiers:', tiers.length);

    // Find applicable tier
    for (const tier of tiers) {
      const minAmount = parseFloat(tier.minAmount);
      const maxAmount = tier.maxAmount ? parseFloat(tier.maxAmount) : Infinity;
      
      console.log(`Checking tier: ${minAmount} - ${maxAmount === Infinity ? '∞' : maxAmount}, rate: ${tier.commissionRate}`);
      
      // Check if order amount falls within this tier
      if (orderAmount >= minAmount && orderAmount <= maxAmount) {
        console.log('✅ Tier selected:', tier.id);
        return tier;
      }
    }

    console.log('⚠️ No tier matched, will use default rate');
    return null;
  } catch (error) {
    console.error('Error selecting commission tier:', error);
    return null;
  }
}

/**
 * Get commission rate based on order amount using tiered system
 */
export async function getCommissionRate(orderAmount: number): Promise<number> {
  try {
    const tier = await selectCommissionTier(orderAmount);
    
    if (tier) {
      return parseFloat(tier.commissionRate);
    }

    // Default rate if no tier matches
    return DEFAULT_COMMISSION_RATE;
  } catch (error) {
    console.error('Error getting commission rate:', error);
    return DEFAULT_COMMISSION_RATE;
  }
}

/**
 * Calculate commission for an order with tiered rates
 * Implements task 2: Tiered commission calculation
 * - Checks custom supplier rate first
 * - Falls back to tier-based rate
 * - Auto-creates commission with 'unpaid' status
 * - Updates supplier totalUnpaidCommission
 * - Checks credit limit and applies restriction if exceeded
 */
export async function calculateCommission(orderId: string, supplierId: string, orderAmount: number) {
  try {
    console.log('=== CALCULATE COMMISSION ===');
    console.log('Order ID:', orderId);
    console.log('Supplier ID:', supplierId);
    console.log('Order Amount:', orderAmount);

    // Step 1: Get supplier profile to check for custom commission rate
    const supplier = await db.select({
      commissionRate: supplierProfiles.commissionRate,
      commissionCreditLimit: supplierProfiles.commissionCreditLimit,
      totalUnpaidCommission: supplierProfiles.totalUnpaidCommission
    })
    .from(supplierProfiles)
    .where(eq(supplierProfiles.id, supplierId))
    .limit(1);

    if (!supplier || supplier.length === 0) {
      throw new Error(`Supplier not found: ${supplierId}`);
    }

    // Step 2: Determine commission rate - check custom rate first, then use tier
    let commissionRate: number;
    let rateSource: string;

    if (supplier[0]?.commissionRate) {
      // Use supplier-specific custom rate
      commissionRate = parseFloat(supplier[0].commissionRate);
      rateSource = 'custom';
      console.log('✅ Using custom supplier rate:', commissionRate);
    } else {
      // Use tiered rate based on order amount
      commissionRate = await getCommissionRate(orderAmount);
      rateSource = 'tier';
      console.log('✅ Using tier-based rate:', commissionRate);
    }

    // Step 3: Calculate commission amounts
    const commissionAmount = orderAmount * commissionRate;
    const supplierAmount = orderAmount - commissionAmount;

    console.log('Commission Amount:', commissionAmount);
    console.log('Supplier Amount:', supplierAmount);

    // Step 4: Calculate due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + COMMISSION_GRACE_PERIOD_DAYS);

    // Step 5: Auto-create commission record with 'unpaid' status
    const [commission] = await db.insert(commissions)
      .values({
        orderId,
        supplierId,
        orderAmount: orderAmount.toString(),
        commissionRate: commissionRate.toString(),
        commissionAmount: commissionAmount.toString(),
        supplierAmount: supplierAmount.toString(),
        status: 'unpaid',
        dueDate
      })
      .returning();

    console.log('✅ Commission record created:', commission.id);

    // Step 6: Update supplier's total unpaid commission and check credit limit
    const { totalUnpaid, isRestricted } = await updateSupplierUnpaidTotal(supplierId);

    console.log('Total Unpaid Commission:', totalUnpaid);
    console.log('Supplier Restricted:', isRestricted);

    // Step 7: Send notification to supplier about commission created (Task 12 - Requirement 2.5)
    try {
      const supplierData = await db.select({
        userId: supplierProfiles.userId
      })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.id, supplierId))
      .limit(1);

      if (supplierData.length > 0 && supplierData[0].userId) {
        await notificationService.notifyCommissionCreated(
          supplierData[0].userId,
          commission.id,
          commissionAmount,
          commissionRate,
          orderId,
          dueDate
        );
        console.log('✅ Commission creation notification sent to supplier');
      }
    } catch (notifError) {
      console.error('⚠️ Failed to send commission notification:', notifError);
      // Don't fail commission creation if notification fails
    }

    return commission;
  } catch (error) {
    console.error('❌ Error calculating commission:', error);
    throw error;
  }
}

/**
 * Update supplier's total unpaid commission and check restriction
 * Implements task 2 requirements:
 * - Updates supplier totalUnpaidCommission when commission created
 * - Checks credit limit and applies restriction if exceeded
 */
export async function updateSupplierUnpaidTotal(supplierId: string) {
  try {
    console.log('=== UPDATE SUPPLIER UNPAID TOTAL ===');
    console.log('Supplier ID:', supplierId);

    // Calculate total unpaid commission (unpaid, payment_submitted, overdue)
    const result = await db.select({
      total: sql`COALESCE(SUM(CAST(${commissions.commissionAmount} AS DECIMAL)), 0)`
    })
    .from(commissions)
    .where(and(
      eq(commissions.supplierId, supplierId),
      or(
        eq(commissions.status, 'unpaid'),
        eq(commissions.status, 'payment_submitted'),
        eq(commissions.status, 'overdue')
      )
    ));

    const totalUnpaid = parseFloat(result[0]?.total as string || '0');
    console.log('Total Unpaid Commission:', totalUnpaid);

    // Get supplier's credit limit and current restriction status
    const supplier = await db.select({
      creditLimit: supplierProfiles.commissionCreditLimit,
      isRestricted: supplierProfiles.isRestricted,
      userId: supplierProfiles.userId
    })
    .from(supplierProfiles)
    .where(eq(supplierProfiles.id, supplierId))
    .limit(1);

    if (!supplier || supplier.length === 0) {
      throw new Error(`Supplier not found: ${supplierId}`);
    }

    const creditLimit = parseFloat(supplier[0]?.creditLimit || DEFAULT_CREDIT_LIMIT.toString());
    const wasRestricted = supplier[0]?.isRestricted || false;
    console.log('Credit Limit:', creditLimit);
    console.log('Was Restricted:', wasRestricted);

    // Check if credit limit is exceeded
    const isRestricted = totalUnpaid >= creditLimit;
    console.log('Should Be Restricted:', isRestricted);
    
    // Update supplier profile with new totals and restriction status
    await db.update(supplierProfiles)
      .set({
        totalUnpaidCommission: totalUnpaid.toString(),
        isRestricted,
        updatedAt: new Date()
      })
      .where(eq(supplierProfiles.id, supplierId));

    console.log('✅ Supplier profile updated');

    // Send notification if supplier is being newly restricted (Task 12 - Requirement 3.5)
    if (isRestricted && !wasRestricted) {
      console.log('⚠️ Applying new restriction - sending notification');
      
      if (supplier[0].userId) {
        await notificationService.notifyAccountRestricted(
          supplier[0].userId,
          totalUnpaid
        );
        console.log('✅ Restriction notification sent');
      }
    } else if (!isRestricted && wasRestricted) {
      // Restriction lifted
      console.log('✅ Restriction lifted');
      
      if (supplier[0].userId) {
        await notificationService.notifyAccountRestrictionLifted(
          supplier[0].userId
        );
        console.log('✅ Restriction lifted notification sent');
      }
    }

    return { totalUnpaid, isRestricted };
  } catch (error) {
    console.error('❌ Error updating supplier unpaid total:', error);
    throw error;
  }
}

/**
 * Check if supplier is restricted
 */
export async function checkSupplierRestriction(supplierId: string): Promise<boolean> {
  try {
    const supplier = await db.select({
      isRestricted: supplierProfiles.isRestricted
    })
    .from(supplierProfiles)
    .where(eq(supplierProfiles.id, supplierId))
    .limit(1);

    return supplier[0]?.isRestricted || false;
  } catch (error) {
    console.error('Error checking supplier restriction:', error);
    return false;
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

// Get pending payment submissions (Task 8)
router.get("/admin/payments/pending", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const pendingPayments = await db.select({
      id: commissionPayments.id,
      supplierId: commissionPayments.supplierId,
      supplierName: supplierProfiles.businessName,
      storeName: supplierProfiles.storeName,
      supplierEmail: users.email,
      supplierPhone: supplierProfiles.phone,
      amount: commissionPayments.amount,
      paymentMethod: commissionPayments.paymentMethod,
      transactionId: commissionPayments.transactionId,
      paymentDate: commissionPayments.paymentDate,
      paymentProofUrl: commissionPayments.paymentProofUrl,
      status: commissionPayments.status,
      notes: commissionPayments.notes,
      createdAt: commissionPayments.createdAt
    })
    .from(commissionPayments)
    .leftJoin(supplierProfiles, eq(commissionPayments.supplierId, supplierProfiles.id))
    .leftJoin(users, eq(supplierProfiles.userId, users.id))
    .where(eq(commissionPayments.status, 'pending'))
    .orderBy(desc(commissionPayments.createdAt));

    // Get commission details for each payment
    const paymentsWithCommissions = await Promise.all(
      pendingPayments.map(async (payment) => {
        const items = await db.select({
          commissionId: commissionPaymentItems.commissionId,
          amount: commissionPaymentItems.amount,
          orderNumber: orders.orderNumber,
          orderAmount: commissions.orderAmount,
          commissionRate: commissions.commissionRate
        })
        .from(commissionPaymentItems)
        .leftJoin(commissions, eq(commissionPaymentItems.commissionId, commissions.id))
        .leftJoin(orders, eq(commissions.orderId, orders.id))
        .where(eq(commissionPaymentItems.paymentId, payment.id));

        return {
          ...payment,
          commissions: items
        };
      })
    );

    res.json({
      success: true,
      payments: paymentsWithCommissions,
      total: paymentsWithCommissions.length
    });

  } catch (error: any) {
    console.error('Get pending payments error:', error);
    res.status(500).json({ error: 'Failed to fetch pending payments' });
  }
});

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

// ==================== COMMISSION TIER MANAGEMENT (ADMIN) ====================

// Get all commission tiers
router.get("/admin/commission-tiers", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const tiers = await db.select()
      .from(commissionTiers)
      .orderBy(commissionTiers.minAmount);

    res.json({
      success: true,
      tiers
    });

  } catch (error: any) {
    console.error('Get commission tiers error:', error);
    res.status(500).json({ error: 'Failed to fetch commission tiers' });
  }
});

// Create commission tier
router.post("/admin/commission-tiers", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { minAmount, maxAmount, commissionRate, description } = req.body;

    if (minAmount === undefined || commissionRate === undefined) {
      return res.status(400).json({ error: 'Min amount and commission rate are required' });
    }

    if (minAmount < 0) {
      return res.status(400).json({ error: 'Minimum amount must be a positive number' });
    }

    if (maxAmount !== undefined && maxAmount !== null && maxAmount <= minAmount) {
      return res.status(400).json({ error: 'Maximum amount must be greater than minimum amount' });
    }

    if (commissionRate < 0 || commissionRate > 1) {
      return res.status(400).json({ error: 'Commission rate must be between 0 and 1' });
    }

    // Check for overlapping ranges with active tiers
    const existingTiers = await db.select()
      .from(commissionTiers)
      .where(eq(commissionTiers.isActive, true));

    const newMin = parseFloat(minAmount.toString());
    const newMax = maxAmount ? parseFloat(maxAmount.toString()) : Infinity;

    for (const tier of existingTiers) {
      const tierMin = parseFloat(tier.minAmount);
      const tierMax = tier.maxAmount ? parseFloat(tier.maxAmount) : Infinity;

      // Check if ranges overlap
      const overlaps = 
        (newMin >= tierMin && newMin <= tierMax) ||
        (newMax >= tierMin && newMax <= tierMax) ||
        (newMin <= tierMin && newMax >= tierMax);

      if (overlaps) {
        return res.status(400).json({ 
          error: `Range overlaps with existing tier: ₹${tierMin} - ${tierMax === Infinity ? '∞' : `₹${tierMax}`}` 
        });
      }
    }

    const [tier] = await db.insert(commissionTiers)
      .values({
        minAmount: minAmount.toString(),
        maxAmount: maxAmount ? maxAmount.toString() : null,
        commissionRate: commissionRate.toString(),
        description: description || null,
        isActive: true
      })
      .returning();

    res.json({
      success: true,
      message: 'Commission tier created successfully',
      tier
    });

  } catch (error: any) {
    console.error('Create commission tier error:', error);
    res.status(500).json({ error: 'Failed to create commission tier' });
  }
});

// Update commission tier
router.patch("/admin/commission-tiers/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { minAmount, maxAmount, commissionRate, description, isActive } = req.body;

    // Get current tier
    const [currentTier] = await db.select()
      .from(commissionTiers)
      .where(eq(commissionTiers.id, req.params.id))
      .limit(1);

    if (!currentTier) {
      return res.status(404).json({ error: 'Commission tier not found' });
    }

    const updateData: any = { updatedAt: new Date() };

    // Validate and prepare update data
    const newMin = minAmount !== undefined ? parseFloat(minAmount.toString()) : parseFloat(currentTier.minAmount);
    const newMax = maxAmount !== undefined 
      ? (maxAmount ? parseFloat(maxAmount.toString()) : Infinity)
      : (currentTier.maxAmount ? parseFloat(currentTier.maxAmount) : Infinity);

    if (minAmount !== undefined) {
      if (minAmount < 0) {
        return res.status(400).json({ error: 'Minimum amount must be a positive number' });
      }
      updateData.minAmount = minAmount.toString();
    }

    if (maxAmount !== undefined) {
      if (maxAmount !== null && newMax <= newMin) {
        return res.status(400).json({ error: 'Maximum amount must be greater than minimum amount' });
      }
      updateData.maxAmount = maxAmount ? maxAmount.toString() : null;
    }

    if (commissionRate !== undefined) {
      if (commissionRate < 0 || commissionRate > 1) {
        return res.status(400).json({ error: 'Commission rate must be between 0 and 1' });
      }
      updateData.commissionRate = commissionRate.toString();
    }

    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Check for overlapping ranges with other active tiers (excluding current tier)
    if (minAmount !== undefined || maxAmount !== undefined) {
      const existingTiers = await db.select()
        .from(commissionTiers)
        .where(eq(commissionTiers.isActive, true));

      for (const tier of existingTiers) {
        if (tier.id === req.params.id) continue; // Skip current tier

        const tierMin = parseFloat(tier.minAmount);
        const tierMax = tier.maxAmount ? parseFloat(tier.maxAmount) : Infinity;

        // Check if ranges overlap
        const overlaps = 
          (newMin >= tierMin && newMin <= tierMax) ||
          (newMax >= tierMin && newMax <= tierMax) ||
          (newMin <= tierMin && newMax >= tierMax);

        if (overlaps) {
          return res.status(400).json({ 
            error: `Range overlaps with existing tier: ₹${tierMin} - ${tierMax === Infinity ? '∞' : `₹${tierMax}`}` 
          });
        }
      }
    }

    const [tier] = await db.update(commissionTiers)
      .set(updateData)
      .where(eq(commissionTiers.id, req.params.id))
      .returning();

    res.json({
      success: true,
      message: 'Commission tier updated successfully',
      tier
    });

  } catch (error: any) {
    console.error('Update commission tier error:', error);
    res.status(500).json({ error: 'Failed to update commission tier' });
  }
});

// Delete commission tier
router.delete("/admin/commission-tiers/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    await db.delete(commissionTiers)
      .where(eq(commissionTiers.id, req.params.id));

    res.json({
      success: true,
      message: 'Commission tier deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete commission tier error:', error);
    res.status(500).json({ error: 'Failed to delete commission tier' });
  }
});

// Manually lift supplier restriction (admin override)
router.post("/admin/suppliers/:id/lift-restriction", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const [supplier] = await db.update(supplierProfiles)
      .set({
        isRestricted: false,
        updatedAt: new Date()
      })
      .where(eq(supplierProfiles.id, req.params.id))
      .returning();

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Notify supplier
    await notificationService.createNotification({
      userId: supplier.userId,
      type: 'success',
      title: 'Restriction Lifted',
      message: 'Your account restriction has been lifted by admin. You can now access all features.',
      relatedType: 'commission'
    });

    res.json({
      success: true,
      message: 'Supplier restriction lifted successfully',
      supplier
    });

  } catch (error: any) {
    console.error('Lift restriction error:', error);
    res.status(500).json({ error: 'Failed to lift restriction' });
  }
});

// ==================== PAYMENT SUBMISSION WITH FILE UPLOAD ====================

/**
 * Submit commission payment with proof of payment file upload
 * Implements task 7: Payment submission
 * - Accepts file upload for payment proof
 * - Creates PaymentSubmission record with status 'pending'
 * - Updates commission status to 'payment_submitted'
 * - Sends notification to admin
 */
router.post("/supplier/payments/submit", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'supplier') {
      return res.status(403).json({ error: 'Access denied. Supplier role required.' });
    }

    console.log('=== PAYMENT SUBMISSION ===');
    console.log('User ID:', req.user.id);
    console.log('Body:', req.body);

    // Get supplier profile
    const supplierProfile = await db.select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.userId, req.user.id))
      .limit(1);

    if (supplierProfile.length === 0) {
      return res.status(404).json({ error: 'Supplier profile not found' });
    }

    const supplierId = supplierProfile[0].id;
    const { commissionIds, paymentMethod, transactionReference, proofOfPayment } = req.body;

    // Validate required fields
    if (!commissionIds || !Array.isArray(commissionIds) || commissionIds.length === 0) {
      return res.status(400).json({ error: 'At least one commission must be selected' });
    }

    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method is required' });
    }

    if (!proofOfPayment) {
      return res.status(400).json({ error: 'Payment proof is required' });
    }

    console.log('Supplier ID:', supplierId);
    console.log('Commission IDs:', commissionIds);
    console.log('Payment Method:', paymentMethod);

    // Get selected commissions and validate they are unpaid
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

    if (selectedCommissions.length !== commissionIds.length) {
      return res.status(400).json({ 
        error: `Only ${selectedCommissions.length} of ${commissionIds.length} selected commissions are valid and unpaid` 
      });
    }

    // Calculate total amount
    const totalAmount = selectedCommissions.reduce((sum, comm) => 
      sum + parseFloat(comm.commissionAmount), 0
    );

    console.log('Total Amount:', totalAmount);
    console.log('Selected Commissions:', selectedCommissions.length);

    // Create payment submission record
    const [paymentSubmission] = await db.insert(paymentSubmissions)
      .values({
        supplierId,
        amount: totalAmount.toString(),
        commissionIds: JSON.stringify(commissionIds),
        paymentMethod: paymentMethod || 'bank_transfer',
        status: 'pending',
        proofOfPayment,
        submittedAt: new Date()
      })
      .returning();

    console.log('Payment Submission Created:', paymentSubmission.id);

    // Update commission statuses to 'payment_submitted'
    for (const commission of selectedCommissions) {
      await db.update(commissions)
        .set({ 
          status: 'payment_submitted',
          paymentSubmittedAt: new Date()
        })
        .where(eq(commissions.id, commission.id));
    }

    console.log('Commission statuses updated to payment_submitted');

    // Send notification to supplier
    await notificationService.createNotification({
      userId: req.user.id,
      type: 'success',
      title: 'Payment Submitted',
      message: `Your commission payment of ₹${totalAmount.toFixed(2)} has been submitted for admin verification.`,
      relatedId: paymentSubmission.id,
      relatedType: 'payment_submission'
    });

    console.log('Notification sent to supplier');

    // Send notification to all admins (Task 12 - Requirement 5.5)
    const admins = await db.select()
      .from(users)
      .where(eq(users.role, 'admin'));

    for (const admin of admins) {
      await notificationService.notifyPaymentSubmitted(
        admin.id,
        paymentSubmission.id,
        supplierProfile[0].businessName || 'Supplier',
        totalAmount
      );
    }

    console.log('Notifications sent to admins');
    console.log('✅ Payment submission completed successfully');

    res.json({
      success: true,
      message: 'Payment submitted successfully for verification',
      paymentSubmission: {
        id: paymentSubmission.id,
        amount: totalAmount,
        commissionCount: selectedCommissions.length,
        status: 'pending',
        submittedAt: paymentSubmission.submittedAt
      }
    });

  } catch (error: any) {
    console.error('❌ Submit payment error:', error);
    res.status(500).json({ error: 'Failed to submit payment' });
  }
});

// ==================== TASK 8: ADMIN PAYMENT VERIFICATION ENDPOINTS ====================

/**
 * Get pending payment submissions (Task 8)
 * Returns all payment submissions with status 'pending' for admin verification
 */
router.get("/admin/payments/pending", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const pendingPayments = await db.select({
      id: paymentSubmissions.id,
      supplierId: paymentSubmissions.supplierId,
      supplierName: supplierProfiles.businessName,
      storeName: supplierProfiles.storeName,
      supplierEmail: users.email,
      supplierPhone: supplierProfiles.phone,
      amount: paymentSubmissions.amount,
      commissionIds: paymentSubmissions.commissionIds,
      paymentMethod: paymentSubmissions.paymentMethod,
      status: paymentSubmissions.status,
      proofOfPayment: paymentSubmissions.proofOfPayment,
      submittedAt: paymentSubmissions.submittedAt,
      createdAt: paymentSubmissions.createdAt
    })
    .from(paymentSubmissions)
    .leftJoin(supplierProfiles, eq(paymentSubmissions.supplierId, supplierProfiles.id))
    .leftJoin(users, eq(supplierProfiles.userId, users.id))
    .where(eq(paymentSubmissions.status, 'pending'))
    .orderBy(desc(paymentSubmissions.submittedAt));

    // Get commission details for each payment
    const paymentsWithCommissions = await Promise.all(
      pendingPayments.map(async (payment) => {
        const commissionIds = JSON.parse(payment.commissionIds as string);
        
        const commissionDetails = await db.select({
          id: commissions.id,
          orderId: commissions.orderId,
          orderNumber: orders.orderNumber,
          orderAmount: commissions.orderAmount,
          commissionAmount: commissions.commissionAmount,
          commissionRate: commissions.commissionRate,
          status: commissions.status,
          createdAt: commissions.createdAt
        })
        .from(commissions)
        .leftJoin(orders, eq(commissions.orderId, orders.id))
        .where(inArray(commissions.id, commissionIds));

        return {
          ...payment,
          commissions: commissionDetails
        };
      })
    );

    res.json({
      success: true,
      payments: paymentsWithCommissions,
      total: paymentsWithCommissions.length
    });

  } catch (error: any) {
    console.error('Get pending payments error:', error);
    res.status(500).json({ error: 'Failed to fetch pending payments' });
  }
});

/**
 * Verify/Approve payment submission (Task 8)
 * - Updates payment submission status to 'approved'
 * - Marks all linked commissions as 'paid'
 * - Reduces supplier's totalUnpaidCommission
 * - Removes restriction if total unpaid falls below credit limit
 * - Sends notification to supplier
 */
router.post("/admin/payments/:id/verify", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const paymentId = req.params.id;

    console.log('=== VERIFY PAYMENT ===');
    console.log('Payment ID:', paymentId);
    console.log('Admin ID:', req.user.id);

    // Get payment submission
    const [payment] = await db.select()
      .from(paymentSubmissions)
      .where(eq(paymentSubmissions.id, paymentId))
      .limit(1);

    if (!payment) {
      return res.status(404).json({ error: 'Payment submission not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'Payment submission is not pending' });
    }

    console.log('Payment Amount:', payment.amount);
    console.log('Supplier ID:', payment.supplierId);

    const commissionIds = JSON.parse(payment.commissionIds as string);
    console.log('Commission IDs:', commissionIds);

    // Update payment submission status
    await db.update(paymentSubmissions)
      .set({
        status: 'approved',
        verifiedBy: req.user.id,
        verifiedAt: new Date()
      })
      .where(eq(paymentSubmissions.id, paymentId));

    console.log('✅ Payment submission status updated to approved');

    // Mark all linked commissions as paid
    for (const commissionId of commissionIds) {
      await db.update(commissions)
        .set({
          status: 'paid',
          paymentDate: new Date(),
          paymentVerifiedBy: req.user.id,
          paymentVerifiedAt: new Date()
        })
        .where(eq(commissions.id, commissionId));
    }

    console.log('✅ All commissions marked as paid');

    // Update supplier's totalUnpaidCommission and check restriction
    // This will recalculate the total and remove restriction if needed
    const { totalUnpaid, isRestricted } = await updateSupplierUnpaidTotal(payment.supplierId);

    console.log('Updated Total Unpaid:', totalUnpaid);
    console.log('Is Restricted:', isRestricted);

    // Update supplier's last payment date
    await db.update(supplierProfiles)
      .set({
        lastPaymentDate: new Date()
      })
      .where(eq(supplierProfiles.id, payment.supplierId));

    console.log('✅ Supplier last payment date updated');

    // Get supplier user ID for notification (Task 12 - Requirement 6.5)
    const supplier = await db.select({ userId: supplierProfiles.userId })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.id, payment.supplierId))
      .limit(1);

    if (supplier.length > 0) {
      await notificationService.notifyPaymentApproved(
        supplier[0].userId,
        paymentId,
        parseFloat(payment.amount)
      );
      console.log('✅ Notification sent to supplier');
    }

    console.log('✅ Payment verification completed successfully');

    res.json({
      success: true,
      message: 'Payment verified and approved successfully',
      totalUnpaid,
      isRestricted
    });

  } catch (error: any) {
    console.error('❌ Verify payment error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

/**
 * Reject payment submission (Task 8)
 * - Updates payment submission status to 'rejected'
 * - Resets commission statuses back to 'unpaid'
 * - Stores rejection reason
 * - Sends notification to supplier with reason
 */
router.post("/admin/payments/:id/reject", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const paymentId = req.params.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    console.log('=== REJECT PAYMENT ===');
    console.log('Payment ID:', paymentId);
    console.log('Admin ID:', req.user.id);
    console.log('Reason:', reason);

    // Get payment submission
    const [payment] = await db.select()
      .from(paymentSubmissions)
      .where(eq(paymentSubmissions.id, paymentId))
      .limit(1);

    if (!payment) {
      return res.status(404).json({ error: 'Payment submission not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'Payment submission is not pending' });
    }

    console.log('Payment Amount:', payment.amount);
    console.log('Supplier ID:', payment.supplierId);

    const commissionIds = JSON.parse(payment.commissionIds as string);
    console.log('Commission IDs:', commissionIds);

    // Update payment submission status
    await db.update(paymentSubmissions)
      .set({
        status: 'rejected',
        rejectionReason: reason,
        verifiedBy: req.user.id,
        verifiedAt: new Date()
      })
      .where(eq(paymentSubmissions.id, paymentId));

    console.log('✅ Payment submission status updated to rejected');

    // Reset commission statuses back to unpaid
    for (const commissionId of commissionIds) {
      await db.update(commissions)
        .set({
          status: 'unpaid',
          paymentSubmittedAt: null
        })
        .where(eq(commissions.id, commissionId));
    }

    console.log('✅ All commissions reset to unpaid');

    // Get supplier user ID for notification (Task 12 - Requirement 7.3)
    const supplier = await db.select({ userId: supplierProfiles.userId })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.id, payment.supplierId))
      .limit(1);

    if (supplier.length > 0) {
      await notificationService.notifyPaymentRejected(
        supplier[0].userId,
        paymentId,
        parseFloat(payment.amount),
        reason
      );
      console.log('✅ Notification sent to supplier');
    }

    console.log('✅ Payment rejection completed successfully');

    res.json({
      success: true,
      message: 'Payment rejected successfully'
    });

  } catch (error: any) {
    console.error('❌ Reject payment error:', error);
    res.status(500).json({ error: 'Failed to reject payment' });
  }
});

// ==================== TASK 10: MANUAL PAYMENT REMINDER ====================

/**
 * Send manual payment reminder to supplier (Admin)
 * Implements Requirement 10.5: Manual payment reminders
 */
router.post("/admin/suppliers/:id/payment-reminder", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const supplierId = req.params.id;

    console.log('=== MANUAL PAYMENT REMINDER ===');
    console.log('Supplier ID:', supplierId);
    console.log('Admin ID:', req.user.id);

    // Import scheduler
    const { commissionScheduler } = await import('./commissionScheduler');

    // Send manual reminder
    await commissionScheduler.sendManualReminder(supplierId, req.user.id);

    res.json({
      success: true,
      message: 'Payment reminder sent successfully'
    });

  } catch (error: any) {
    console.error('❌ Send payment reminder error:', error);
    res.status(500).json({ error: error.message || 'Failed to send payment reminder' });
  }
});

export default router;
