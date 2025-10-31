import { db } from './db';
import { 
  activity_logs, 
  supplierProfiles, 
  products, 
  orders, 
  users,
  notifications,
  InsertActivityLog,
  InsertNotification 
} from '@shared/schema';
import { eq, and, or, gte, lte, desc, count, sql, avg, sum } from 'drizzle-orm';

// ==================== ACTIVITY LOGGING ====================

export async function logAdminActivity(
  adminId: string,
  adminName: string,
  action: string,
  description: string,
  entityType: string,
  entityId?: string,
  entityName?: string,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await db.insert(activity_logs).values({
      adminId,
      adminName,
      action,
      description,
      entityType,
      entityId,
      entityName,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Failed to log admin activity:', error);
  }
}

// ==================== SUPPLIER PERFORMANCE MONITORING ====================

export interface SupplierPerformanceMetrics {
  supplierId: string;
  businessName: string;
  storeName: string;
  membershipTier: string;
  verificationLevel: string;
  
  // Performance metrics
  totalOrders: number;
  totalSales: number;
  averageOrderValue: number;
  responseRate: number;
  responseTime: string;
  rating: number;
  totalReviews: number;
  
  // Product metrics
  totalProducts: number;
  approvedProducts: number;
  pendingProducts: number;
  rejectedProducts: number;
  
  // Compliance metrics
  complianceScore: number;
  policyViolations: number;
  disputeCount: number;
  
  // Activity metrics
  lastActivity: Date;
  isActive: boolean;
  isSuspended: boolean;
  
  // Risk indicators
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
}

export async function getSupplierPerformanceMetrics(
  supplierId?: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ suppliers: SupplierPerformanceMetrics[], total: number }> {
  try {
    // Build base query conditions
    const conditions = [];
    if (supplierId) {
      conditions.push(eq(supplierProfiles.id, supplierId));
    }

    // Get supplier profiles with basic metrics
    let query = db
      .select({
        supplierId: supplierProfiles.id,
        businessName: supplierProfiles.businessName,
        storeName: supplierProfiles.storeName,
        membershipTier: supplierProfiles.membershipTier,
        verificationLevel: supplierProfiles.verificationLevel,
        totalOrders: supplierProfiles.totalOrders,
        totalSales: supplierProfiles.totalSales,
        responseRate: supplierProfiles.responseRate,
        responseTime: supplierProfiles.responseTime,
        rating: supplierProfiles.rating,
        totalReviews: supplierProfiles.totalReviews,
        totalProducts: supplierProfiles.totalProducts,
        isActive: supplierProfiles.isActive,
        isSuspended: supplierProfiles.isSuspended,
        updatedAt: supplierProfiles.updatedAt,
      })
      .from(supplierProfiles)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(supplierProfiles.totalSales))
      .limit(limit)
      .offset(offset);

    const suppliers = await query;

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(supplierProfiles)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = totalResult[0]?.count || 0;

    // Enhance with additional metrics for each supplier
    const enhancedSuppliers = await Promise.all(
      suppliers.map(async (supplier) => {
        // Get product status breakdown
        const productStats = await db
          .select({
            status: products.status,
            count: count(),
          })
          .from(products)
          .where(eq(products.supplierId, supplier.supplierId))
          .groupBy(products.status);

        const productBreakdown = productStats.reduce((acc, stat) => {
          if (stat.status) {
            acc[stat.status] = Number(stat.count);
          }
          return acc;
        }, {} as Record<string, number>);

        // Calculate average order value
        const avgOrderValue = (supplier.totalOrders || 0) > 0 
          ? Number(supplier.totalSales) / (supplier.totalOrders || 1)
          : 0;

        // Calculate compliance score and risk level
        const complianceScore = calculateComplianceScore(supplier);
        const riskAssessment = assessSupplierRisk(supplier, productBreakdown);

        return {
          supplierId: supplier.supplierId,
          businessName: supplier.businessName,
          storeName: supplier.storeName,
          membershipTier: supplier.membershipTier,
          verificationLevel: supplier.verificationLevel,
          totalOrders: supplier.totalOrders || 0,
          totalSales: Number(supplier.totalSales),
          averageOrderValue: avgOrderValue,
          responseRate: Number(supplier.responseRate),
          responseTime: supplier.responseTime || 'N/A',
          rating: Number(supplier.rating),
          totalReviews: supplier.totalReviews || 0,
          totalProducts: supplier.totalProducts,
          approvedProducts: productBreakdown.approved || 0,
          pendingProducts: productBreakdown.pending_approval || 0,
          rejectedProducts: productBreakdown.rejected || 0,
          complianceScore,
          policyViolations: 0, // TODO: Implement policy violation tracking
          disputeCount: 0, // TODO: Implement dispute tracking
          lastActivity: supplier.updatedAt,
          isActive: supplier.isActive,
          isSuspended: supplier.isSuspended,
          riskLevel: riskAssessment.level,
          riskFactors: riskAssessment.factors,
        } as SupplierPerformanceMetrics;
      })
    );

    return {
      suppliers: enhancedSuppliers,
      total: Number(total),
    };

  } catch (error) {
    console.error('Error getting supplier performance metrics:', error);
    throw error;
  }
}

function calculateComplianceScore(supplier: any): number {
  let score = 100;

  // Deduct points for various factors
  if (!supplier.isActive) score -= 20;
  if (supplier.isSuspended) score -= 30;
  if (Number(supplier.responseRate) < 80) score -= 10;
  if (Number(supplier.rating) < 4.0) score -= 15;
  if (supplier.verificationLevel === 'none') score -= 10;

  return Math.max(0, score);
}

function assessSupplierRisk(supplier: any, productBreakdown: Record<string, number>): {
  level: 'low' | 'medium' | 'high';
  factors: string[];
} {
  const factors: string[] = [];
  let riskScore = 0;

  // Check various risk factors
  if (supplier.isSuspended) {
    factors.push('Account suspended');
    riskScore += 30;
  }

  if (Number(supplier.rating) < 3.5) {
    factors.push('Low customer rating');
    riskScore += 20;
  }

  if (Number(supplier.responseRate || 0) < 70) {
    factors.push('Poor response rate');
    riskScore += 15;
  }

  if ((productBreakdown.rejected || 0) > (productBreakdown.approved || 0)) {
    factors.push('High product rejection rate');
    riskScore += 25;
  }

  if (supplier.verificationLevel === 'none') {
    factors.push('Unverified supplier');
    riskScore += 10;
  }

  // Determine risk level
  let level: 'low' | 'medium' | 'high' = 'low';
  if (riskScore >= 50) {
    level = 'high';
  } else if (riskScore >= 25) {
    level = 'medium';
  }

  return { level, factors };
}

// ==================== COMPLIANCE TRACKING ====================

export interface ComplianceViolation {
  id: string;
  supplierId: string;
  supplierName: string;
  violationType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  reportedBy: string;
  reportedAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

export async function trackComplianceViolation(violation: Omit<ComplianceViolation, 'id' | 'reportedAt'>) {
  // TODO: Implement compliance violation tracking table and logic
  console.log('Compliance violation tracked:', violation);
}

export async function getComplianceViolations(
  supplierId?: string,
  status?: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ violations: ComplianceViolation[], total: number }> {
  // TODO: Implement compliance violation retrieval
  return { violations: [], total: 0 };
}

// ==================== DISPUTE RESOLUTION ====================

export interface Dispute {
  id: string;
  orderId: string;
  buyerId: string;
  supplierId: string;
  type: 'product_quality' | 'shipping_delay' | 'communication' | 'refund' | 'other';
  status: 'open' | 'investigating' | 'mediation' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  buyerEvidence?: string[];
  supplierResponse?: string;
  supplierEvidence?: string[];
  adminNotes?: string;
  resolution?: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export async function createDispute(dispute: Omit<Dispute, 'id' | 'createdAt' | 'updatedAt'>) {
  // TODO: Implement dispute creation table and logic
  console.log('Dispute created:', dispute);
}

export async function getDisputes(
  supplierId?: string,
  status?: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ disputes: Dispute[], total: number }> {
  // TODO: Implement dispute retrieval
  return { disputes: [], total: 0 };
}

// ==================== AUTOMATED QUALITY CONTROL ====================

export interface QualityControlCheck {
  type: 'product_images' | 'product_description' | 'pricing_anomaly' | 'duplicate_content' | 'spam_detection';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  entityId: string;
  entityType: string;
  autoResolved: boolean;
}

export async function runQualityControlChecks(supplierId?: string): Promise<QualityControlCheck[]> {
  const checks: QualityControlCheck[] = [];

  try {
    // Get products to check
    const conditions = [];
    if (supplierId) {
      conditions.push(eq(products.supplierId, supplierId));
    }

    const productsToCheck = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        images: products.images,
        priceRanges: products.priceRanges,
        supplierId: products.supplierId,
      })
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(100); // Limit for performance

    for (const product of productsToCheck) {
      // Check for missing images
      if (!product.images || product.images.length === 0) {
        checks.push({
          type: 'product_images',
          severity: 'warning',
          message: 'Product has no images',
          entityId: product.id,
          entityType: 'product',
          autoResolved: false,
        });
      }

      // Check for short descriptions
      if (!product.description || product.description.length < 50) {
        checks.push({
          type: 'product_description',
          severity: 'warning',
          message: 'Product description is too short',
          entityId: product.id,
          entityType: 'product',
          autoResolved: false,
        });
      }

      // Check for pricing anomalies
      if (product.priceRanges) {
        const ranges = Array.isArray(product.priceRanges) ? product.priceRanges : [];
        for (const range of ranges) {
          if (range.pricePerUnit && range.pricePerUnit <= 0) {
            checks.push({
              type: 'pricing_anomaly',
              severity: 'error',
              message: 'Product has invalid pricing (zero or negative)',
              entityId: product.id,
              entityType: 'product',
              autoResolved: false,
            });
          }
        }
      }
    }

    return checks;

  } catch (error) {
    console.error('Error running quality control checks:', error);
    return checks;
  }
}

// ==================== FRAUD DETECTION ====================

export interface FraudAlert {
  id: string;
  supplierId: string;
  supplierName: string;
  alertType: 'suspicious_activity' | 'fake_reviews' | 'price_manipulation' | 'identity_fraud' | 'payment_fraud';
  riskScore: number;
  description: string;
  evidence: any;
  status: 'open' | 'investigating' | 'false_positive' | 'confirmed';
  createdAt: Date;
  investigatedBy?: string;
  investigatedAt?: Date;
  resolution?: string;
}

export async function detectFraudulentActivity(supplierId?: string): Promise<FraudAlert[]> {
  const alerts: FraudAlert[] = [];

  try {
    // Get suppliers to check
    const conditions = [];
    if (supplierId) {
      conditions.push(eq(supplierProfiles.id, supplierId));
    }

    const suppliersToCheck = await db
      .select({
        id: supplierProfiles.id,
        businessName: supplierProfiles.businessName,
        rating: supplierProfiles.rating,
        totalReviews: supplierProfiles.totalReviews,
        totalSales: supplierProfiles.totalSales,
        totalOrders: supplierProfiles.totalOrders,
        createdAt: supplierProfiles.createdAt,
      })
      .from(supplierProfiles)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(50);

    for (const supplier of suppliersToCheck) {
      // Check for suspicious rating patterns
      if ((supplier.totalReviews || 0) > 0 && Number(supplier.rating) === 5.0 && (supplier.totalReviews || 0) < 10) {
        alerts.push({
          id: `fraud_${supplier.id}_${Date.now()}`,
          supplierId: supplier.id,
          supplierName: supplier.businessName,
          alertType: 'fake_reviews',
          riskScore: 75,
          description: 'Perfect rating with very few reviews may indicate fake reviews',
          evidence: {
            rating: supplier.rating,
            totalReviews: supplier.totalReviews || 0,
          },
          status: 'open',
          createdAt: new Date(),
        });
      }

      // Check for unrealistic sales patterns
      const daysSinceCreation = Math.floor((Date.now() - (supplier.createdAt?.getTime() || Date.now())) / (1000 * 60 * 60 * 24));
      if (daysSinceCreation < 30 && Number(supplier.totalSales) > 100000) {
        alerts.push({
          id: `fraud_${supplier.id}_${Date.now()}_sales`,
          supplierId: supplier.id,
          supplierName: supplier.businessName,
          alertType: 'suspicious_activity',
          riskScore: 85,
          description: 'Unusually high sales volume for new supplier',
          evidence: {
            totalSales: supplier.totalSales,
            daysSinceCreation,
          },
          status: 'open',
          createdAt: new Date(),
        });
      }
    }

    return alerts;

  } catch (error) {
    console.error('Error detecting fraudulent activity:', error);
    return alerts;
  }
}

// ==================== PLATFORM ANALYTICS ====================

export interface PlatformAnalytics {
  totalSuppliers: number;
  activeSuppliers: number;
  pendingSuppliers: number;
  suspendedSuppliers: number;
  
  totalProducts: number;
  approvedProducts: number;
  pendingProducts: number;
  rejectedProducts: number;
  
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  
  averageSupplierRating: number;
  averageResponseRate: number;
  
  topPerformingSuppliers: Array<{
    id: string;
    name: string;
    sales: number;
    orders: number;
  }>;
  
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: Date;
  }>;
}

export async function getPlatformAnalytics(): Promise<PlatformAnalytics> {
  try {
    // Get supplier statistics
    const supplierStats = await db
      .select({
        status: supplierProfiles.status,
        count: count(),
      })
      .from(supplierProfiles)
      .groupBy(supplierProfiles.status);

    const supplierCounts = supplierStats.reduce((acc, stat) => {
      if (stat.status) {
        acc[stat.status] = Number(stat.count);
      }
      return acc;
    }, {} as Record<string, number>);

    // Get product statistics
    const productStats = await db
      .select({
        status: products.status,
        count: count(),
      })
      .from(products)
      .where(sql`${products.supplierId} IS NOT NULL`)
      .groupBy(products.status);

    const productCounts = productStats.reduce((acc, stat) => {
      if (stat.status) {
        acc[stat.status] = Number(stat.count);
      }
      return acc;
    }, {} as Record<string, number>);

    // Get order and revenue statistics
    const orderStats = await db
      .select({
        totalOrders: count(),
        totalRevenue: sum(orders.totalAmount),
        totalCommission: sum(orders.commissionAmount),
      })
      .from(orders)
      .where(sql`${orders.supplierId} IS NOT NULL`);

    // Get average metrics
    const avgMetrics = await db
      .select({
        avgRating: avg(supplierProfiles.rating),
        avgResponseRate: avg(supplierProfiles.responseRate),
      })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.status, 'approved'));

    // Get top performing suppliers
    const topSuppliers = await db
      .select({
        id: supplierProfiles.id,
        name: supplierProfiles.businessName,
        sales: supplierProfiles.totalSales,
        orders: supplierProfiles.totalOrders,
      })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.status, 'approved'))
      .orderBy(desc(supplierProfiles.totalSales))
      .limit(5);

    // Get recent activity
    const recentActivity = await db
      .select({
        action: activity_logs.action,
        description: activity_logs.description,
        createdAt: activity_logs.createdAt,
      })
      .from(activity_logs)
      .orderBy(desc(activity_logs.createdAt))
      .limit(10);

    return {
      totalSuppliers: Object.values(supplierCounts).reduce((sum, count) => sum + count, 0),
      activeSuppliers: supplierCounts.approved || 0,
      pendingSuppliers: supplierCounts.pending || 0,
      suspendedSuppliers: supplierCounts.suspended || 0,
      
      totalProducts: Object.values(productCounts).reduce((sum, count) => sum + count, 0),
      approvedProducts: productCounts.approved || 0,
      pendingProducts: productCounts.pending_approval || 0,
      rejectedProducts: productCounts.rejected || 0,
      
      totalOrders: Number(orderStats[0]?.totalOrders || 0),
      totalRevenue: Number(orderStats[0]?.totalRevenue || 0),
      totalCommission: Number(orderStats[0]?.totalCommission || 0),
      
      averageSupplierRating: Number(avgMetrics[0]?.avgRating || 0),
      averageResponseRate: Number(avgMetrics[0]?.avgResponseRate || 0),
      
      topPerformingSuppliers: topSuppliers.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        sales: Number(supplier.sales),
        orders: supplier.orders || 0,
      })),
      
      recentActivity: recentActivity.map(activity => ({
        type: activity.action,
        description: activity.description,
        timestamp: activity.createdAt || new Date(),
      })),
    };

  } catch (error) {
    console.error('Error getting platform analytics:', error);
    throw error;
  }
}

// ==================== NOTIFICATION HELPERS ====================

export async function createNotification(data: InsertNotification) {
  try {
    await db.insert(notifications).values(data);
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

export async function notifyAdminsOfSuspiciousActivity(alert: FraudAlert) {
  // Get all admin users
  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, 'admin'));

  // Create notifications for all admins
  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      type: 'warning',
      title: 'Suspicious Activity Detected',
      message: `${alert.alertType}: ${alert.description} for supplier ${alert.supplierName}`,
      relatedId: alert.supplierId,
      relatedType: 'fraud_alert',
    });
  }
}

// ==================== COMPREHENSIVE DASHBOARD METRICS ====================

export interface TrendData {
  date: string;
  revenue: number;
  orders: number;
  suppliers: number;
  products: number;
}

export interface SystemHealthMetrics {
  onlineSuppliers: number;
  activeOrders: number;
  systemLoad: number;
  errorRate: number;
  avgResponseTime: number;
  overallStatus: 'healthy' | 'warning' | 'critical';
  uptime: number;
}

export interface PeriodComparison {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

export async function calculateTrendAnalysis(startDate: Date, endDate: Date): Promise<TrendData[]> {
  try {
    // Generate daily data points for the trend
    const trends: TrendData[] = [];
    const dayMs = 24 * 60 * 60 * 1000;
    
    for (let date = new Date(startDate); date <= endDate; date.setTime(date.getTime() + dayMs)) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      // Get daily metrics (simplified for now - in production, you'd have time-series data)
      const dailyRevenue = Math.random() * 50000 + 10000; // Mock data
      const dailyOrders = Math.floor(Math.random() * 100 + 20);
      const dailySuppliers = Math.floor(Math.random() * 10 + 5);
      const dailyProducts = Math.floor(Math.random() * 50 + 10);

      trends.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: dailyRevenue,
        orders: dailyOrders,
        suppliers: dailySuppliers,
        products: dailyProducts,
      });
    }

    return trends;

  } catch (error) {
    console.error('Error calculating trend analysis:', error);
    return [];
  }
}

export async function calculatePeriodComparisons(startDate: Date, endDate: Date): Promise<{
  revenue: PeriodComparison;
  orders: PeriodComparison;
  suppliers: PeriodComparison;
  products: PeriodComparison;
}> {
  try {
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    const previousEndDate = new Date(startDate.getTime() - 1);

    // Get current period analytics
    const currentAnalytics = await getPlatformAnalytics();

    // For comparison, we'll use mock previous period data
    // In production, you'd query historical data
    const previousRevenue = currentAnalytics.totalRevenue * (0.8 + Math.random() * 0.4);
    const previousOrders = Math.floor(currentAnalytics.totalOrders * (0.8 + Math.random() * 0.4));
    const previousSuppliers = Math.floor(currentAnalytics.activeSuppliers * (0.9 + Math.random() * 0.2));
    const previousProducts = Math.floor(currentAnalytics.approvedProducts * (0.85 + Math.random() * 0.3));

    const calculateComparison = (current: number, previous: number): PeriodComparison => ({
      current,
      previous,
      change: current - previous,
      changePercent: previous > 0 ? ((current - previous) / previous) * 100 : 0,
    });

    return {
      revenue: calculateComparison(currentAnalytics.totalRevenue, previousRevenue),
      orders: calculateComparison(currentAnalytics.totalOrders, previousOrders),
      suppliers: calculateComparison(currentAnalytics.activeSuppliers, previousSuppliers),
      products: calculateComparison(currentAnalytics.approvedProducts, previousProducts),
    };

  } catch (error) {
    console.error('Error calculating period comparisons:', error);
    return {
      revenue: { current: 0, previous: 0, change: 0, changePercent: 0 },
      orders: { current: 0, previous: 0, change: 0, changePercent: 0 },
      suppliers: { current: 0, previous: 0, change: 0, changePercent: 0 },
      products: { current: 0, previous: 0, change: 0, changePercent: 0 },
    };
  }
}

export async function getSystemHealthMetrics(): Promise<SystemHealthMetrics> {
  try {
    // Get active suppliers count
    const activeSuppliers = await db
      .select({ count: count() })
      .from(supplierProfiles)
      .where(and(eq(supplierProfiles.isActive, true), eq(supplierProfiles.status, 'approved')));

    // Get active orders count (orders in progress)
    const activeOrders = await db
      .select({ count: count() })
      .from(orders)
      .where(sql`${orders.status} IN ('pending', 'processing', 'shipped')`);

    // Mock system metrics (in production, these would come from monitoring systems)
    const systemLoad = Math.random() * 100;
    const errorRate = Math.random() * 5;
    const avgResponseTime = 150 + Math.random() * 100;
    const uptime = 99.5 + Math.random() * 0.5;

    // Determine overall status
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (systemLoad > 80 || errorRate > 3 || avgResponseTime > 300) {
      overallStatus = 'warning';
    }
    if (systemLoad > 95 || errorRate > 5 || avgResponseTime > 500) {
      overallStatus = 'critical';
    }

    return {
      onlineSuppliers: Number(activeSuppliers[0]?.count || 0),
      activeOrders: Number(activeOrders[0]?.count || 0),
      systemLoad: Math.round(systemLoad * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      overallStatus,
      uptime: Math.round(uptime * 100) / 100,
    };

  } catch (error) {
    console.error('Error getting system health metrics:', error);
    return {
      onlineSuppliers: 0,
      activeOrders: 0,
      systemLoad: 0,
      errorRate: 0,
      avgResponseTime: 0,
      overallStatus: 'critical',
      uptime: 0,
    };
  }
}

export async function getTopPerformingProducts(limit: number = 5): Promise<Array<{
  id: string;
  name: string;
  revenue: number;
  orders: number;
  views: number;
  conversionRate: number;
}>> {
  try {
    // Get top products by revenue/orders
    const topProducts = await db
      .select({
        id: products.id,
        name: products.name,
        views: products.views,
        inquiries: products.inquiries,
      })
      .from(products)
      .where(eq(products.status, 'approved'))
      .orderBy(desc(products.views))
      .limit(limit);

    return topProducts.map(product => ({
      id: product.id,
      name: product.name,
      revenue: Math.random() * 50000 + 5000, // Mock revenue data
      orders: Math.floor(Math.random() * 100 + 10),
      views: product.views || 0,
      conversionRate: (product.views || 0) > 0 ? 
        ((product.inquiries || 0) / (product.views || 1)) * 100 : 0,
    }));

  } catch (error) {
    console.error('Error getting top performing products:', error);
    return [];
  }
}

export async function getTopPerformingCategories(limit: number = 5): Promise<Array<{
  id: string;
  name: string;
  productCount: number;
  revenue: number;
  orders: number;
}>> {
  try {
    // Get category performance (simplified)
    const categories = await db
      .select({
        category: products.categoryId,
        count: count(),
      })
      .from(products)
      .where(eq(products.status, 'approved'))
      .groupBy(products.categoryId)
      .orderBy(desc(count()))
      .limit(limit);

    return categories.map((cat, index) => ({
      id: `cat_${index}`,
      name: cat.category || 'Uncategorized',
      productCount: Number(cat.count),
      revenue: Math.random() * 100000 + 20000, // Mock revenue data
      orders: Math.floor(Math.random() * 500 + 50),
    }));

  } catch (error) {
    console.error('Error getting top performing categories:', error);
    return [];
  }
}