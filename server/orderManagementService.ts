import { db } from "./db";
import { 
  orders, 
  disputes, 
  disputeMessages, 
  orderInterventions, 
  refunds, 
  orderAnomalies, 
  orderPerformanceMetrics,
  supplierProfiles,
  users,
  products,
  type Order,
  type Dispute,
  type DisputeMessage,
  type OrderIntervention,
  type Refund,
  type OrderAnomaly,
  type InsertDispute,
  type InsertDisputeMessage,
  type InsertOrderIntervention,
  type InsertRefund,
  type InsertOrderAnomaly
} from "@shared/schema";
import { eq, desc, and, gte, lte, sql, or, ilike, count, avg, sum } from "drizzle-orm";

// ==================== ORDER MONITORING ====================

export interface OrderMonitoringData {
  orders: OrderWithDetails[];
  summary: OrderSummary;
  anomalies: OrderAnomaly[];
  performance: OrderPerformanceData;
  suppliers: SupplierOrderData[];
}

export interface OrderWithDetails extends Order {
  buyer: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
  };
  supplier: {
    id: string;
    businessName: string;
    storeName: string;
    rating: number;
    responseRate: number;
  };
  product?: {
    id: string;
    name: string;
    slug: string;
  };
  disputes: Dispute[];
  interventions: OrderIntervention[];
  refunds: Refund[];
  anomalies: OrderAnomaly[];
}

export interface OrderSummary {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  disputedOrders: number;
  totalValue: number;
  averageOrderValue: number;
  disputeRate: number;
  completionRate: number;
}

export interface OrderPerformanceData {
  avgProcessingTime: number;
  avgDeliveryTime: number;
  onTimeDeliveryRate: number;
  customerSatisfactionScore: number;
  trends: {
    daily: Array<{ date: string; orders: number; value: number; disputes: number }>;
    hourly: Array<{ hour: number; orders: number; value: number }>;
  };
}

export interface SupplierOrderData {
  supplierId: string;
  supplierName: string;
  totalOrders: number;
  completedOrders: number;
  disputedOrders: number;
  totalValue: number;
  averageOrderValue: number;
  disputeRate: number;
  performanceScore: number;
}

export async function getComprehensiveOrderMonitoring(
  filters: {
    status?: string;
    supplierId?: string;
    buyerId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<OrderMonitoringData> {
  const { status, supplierId, buyerId, dateFrom, dateTo, search, limit = 50, offset = 0 } = filters;

  // Build where conditions
  const whereConditions = [];
  
  if (status) {
    whereConditions.push(eq(orders.status, status));
  }
  
  if (supplierId) {
    whereConditions.push(eq(orders.supplierId, supplierId));
  }
  
  if (buyerId) {
    whereConditions.push(eq(orders.buyerId, buyerId));
  }
  
  if (dateFrom) {
    whereConditions.push(gte(orders.createdAt, dateFrom));
  }
  
  if (dateTo) {
    whereConditions.push(lte(orders.createdAt, dateTo));
  }
  
  if (search) {
    whereConditions.push(
      or(
        ilike(orders.orderNumber, `%${search}%`),
        ilike(orders.notes, `%${search}%`)
      )
    );
  }

  // Get orders with details
  const ordersQuery = db
    .select({
      order: orders,
      buyer: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        companyName: users.companyName,
      },
      supplier: {
        id: supplierProfiles.id,
        businessName: supplierProfiles.businessName,
        storeName: supplierProfiles.storeName,
        rating: supplierProfiles.rating,
        responseRate: supplierProfiles.responseRate,
      },
      product: {
        id: products.id,
        name: products.name,
        slug: products.slug,
      }
    })
    .from(orders)
    .leftJoin(users, eq(orders.buyerId, users.id))
    .leftJoin(supplierProfiles, eq(orders.supplierId, supplierProfiles.userId))
    .leftJoin(products, eq(orders.productId, products.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  const ordersResult = await ordersQuery;

  // Get related data for each order
  const orderIds = ordersResult.map(r => r.order.id);
  
  const [disputesResult, interventionsResult, refundsResult, anomaliesResult] = await Promise.all([
    orderIds.length > 0 ? db.select().from(disputes).where(sql`order_id = ANY(${orderIds})`) : [],
    orderIds.length > 0 ? db.select().from(orderInterventions).where(sql`order_id = ANY(${orderIds})`) : [],
    orderIds.length > 0 ? db.select().from(refunds).where(sql`order_id = ANY(${orderIds})`) : [],
    orderIds.length > 0 ? db.select().from(orderAnomalies).where(sql`order_id = ANY(${orderIds})`) : []
  ]);

  // Group related data by order ID
  const disputesByOrder = disputesResult.reduce((acc, dispute) => {
    if (!acc[dispute.orderId]) acc[dispute.orderId] = [];
    acc[dispute.orderId].push(dispute);
    return acc;
  }, {} as Record<string, Dispute[]>);

  const interventionsByOrder = interventionsResult.reduce((acc, intervention) => {
    if (!acc[intervention.orderId]) acc[intervention.orderId] = [];
    acc[intervention.orderId].push(intervention);
    return acc;
  }, {} as Record<string, OrderIntervention[]>);

  const refundsByOrder = refundsResult.reduce((acc, refund) => {
    if (!acc[refund.orderId]) acc[refund.orderId] = [];
    acc[refund.orderId].push(refund);
    return acc;
  }, {} as Record<string, Refund[]>);

  const anomaliesByOrder = anomaliesResult.reduce((acc, anomaly) => {
    if (!acc[anomaly.orderId]) acc[anomaly.orderId] = [];
    acc[anomaly.orderId].push(anomaly);
    return acc;
  }, {} as Record<string, OrderAnomaly[]>);

  // Combine orders with details
  const ordersWithDetails: OrderWithDetails[] = ordersResult.map(result => ({
    ...result.order,
    buyer: result.buyer,
    supplier: result.supplier,
    product: result.product,
    disputes: disputesByOrder[result.order.id] || [],
    interventions: interventionsByOrder[result.order.id] || [],
    refunds: refundsByOrder[result.order.id] || [],
    anomalies: anomaliesByOrder[result.order.id] || []
  }));

  // Get summary statistics
  const summary = await getOrderSummary(filters);
  
  // Get performance data
  const performance = await getOrderPerformanceData(filters);
  
  // Get supplier performance data
  const suppliers = await getSupplierOrderData(filters);
  
  // Get recent anomalies
  const anomalies = await getRecentOrderAnomalies(10);

  return {
    orders: ordersWithDetails,
    summary,
    anomalies,
    performance,
    suppliers
  };
}

export async function getOrderSummary(filters: any = {}): Promise<OrderSummary> {
  const whereConditions = buildOrderWhereConditions(filters);
  
  const summaryQuery = await db
    .select({
      totalOrders: count(),
      totalValue: sum(orders.totalAmount),
      avgValue: avg(orders.totalAmount),
    })
    .from(orders)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  const statusCounts = await db
    .select({
      status: orders.status,
      count: count(),
    })
    .from(orders)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .groupBy(orders.status);

  const disputeCount = await db
    .select({ count: count() })
    .from(disputes)
    .innerJoin(orders, eq(disputes.orderId, orders.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  const summary = summaryQuery[0];
  const statusMap = statusCounts.reduce((acc, item) => {
    acc[item.status || 'unknown'] = item.count;
    return acc;
  }, {} as Record<string, number>);

  const totalOrders = summary.totalOrders || 0;
  const disputedOrders = disputeCount[0]?.count || 0;

  return {
    totalOrders,
    pendingOrders: statusMap.pending || 0,
    processingOrders: statusMap.processing || 0,
    completedOrders: statusMap.completed || 0,
    cancelledOrders: statusMap.cancelled || 0,
    disputedOrders,
    totalValue: Number(summary.totalValue) || 0,
    averageOrderValue: Number(summary.avgValue) || 0,
    disputeRate: totalOrders > 0 ? (disputedOrders / totalOrders) * 100 : 0,
    completionRate: totalOrders > 0 ? ((statusMap.completed || 0) / totalOrders) * 100 : 0,
  };
}

export async function getOrderPerformanceData(filters: any = {}): Promise<OrderPerformanceData> {
  // Get recent performance metrics
  const recentMetrics = await db
    .select()
    .from(orderPerformanceMetrics)
    .where(gte(orderPerformanceMetrics.date, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
    .orderBy(desc(orderPerformanceMetrics.date));

  // Calculate averages
  const avgProcessingTime = recentMetrics.reduce((sum, m) => sum + (m.avgProcessingTime || 0), 0) / Math.max(recentMetrics.length, 1);
  const avgDeliveryTime = recentMetrics.reduce((sum, m) => sum + (m.avgDeliveryTime || 0), 0) / Math.max(recentMetrics.length, 1);

  // Get daily trends (last 30 days)
  const dailyTrends = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`,
      orders: count(),
      value: sum(orders.totalAmount),
      disputes: sql<number>`COUNT(DISTINCT ${disputes.id})`,
    })
    .from(orders)
    .leftJoin(disputes, eq(orders.id, disputes.orderId))
    .where(gte(orders.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt})`);

  // Get hourly trends (last 24 hours)
  const hourlyTrends = await db
    .select({
      hour: sql<number>`EXTRACT(HOUR FROM ${orders.createdAt})`,
      orders: count(),
      value: sum(orders.totalAmount),
    })
    .from(orders)
    .where(gte(orders.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)))
    .groupBy(sql`EXTRACT(HOUR FROM ${orders.createdAt})`)
    .orderBy(sql`EXTRACT(HOUR FROM ${orders.createdAt})`);

  return {
    avgProcessingTime: Math.round(avgProcessingTime),
    avgDeliveryTime: Math.round(avgDeliveryTime),
    onTimeDeliveryRate: 85, // Mock data - would need delivery tracking
    customerSatisfactionScore: 4.2, // Mock data - would need review integration
    trends: {
      daily: dailyTrends.map(t => ({
        date: t.date,
        orders: t.orders,
        value: Number(t.value) || 0,
        disputes: t.disputes || 0,
      })),
      hourly: hourlyTrends.map(t => ({
        hour: t.hour,
        orders: t.orders,
        value: Number(t.value) || 0,
      })),
    },
  };
}

export async function getSupplierOrderData(filters: any = {}): Promise<SupplierOrderData[]> {
  const supplierStats = await db
    .select({
      supplierId: orders.supplierId,
      supplierName: supplierProfiles.businessName,
      totalOrders: count(),
      totalValue: sum(orders.totalAmount),
      completedOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'completed' THEN 1 END)`,
      disputedOrders: sql<number>`COUNT(DISTINCT ${disputes.id})`,
    })
    .from(orders)
    .leftJoin(supplierProfiles, eq(orders.supplierId, supplierProfiles.userId))
    .leftJoin(disputes, eq(orders.id, disputes.orderId))
    .where(orders.supplierId !== null)
    .groupBy(orders.supplierId, supplierProfiles.businessName)
    .orderBy(desc(count()));

  return supplierStats.map(stat => {
    const totalOrders = stat.totalOrders;
    const disputedOrders = stat.disputedOrders || 0;
    const completedOrders = stat.completedOrders || 0;
    const totalValue = Number(stat.totalValue) || 0;

    return {
      supplierId: stat.supplierId || '',
      supplierName: stat.supplierName || 'Unknown Supplier',
      totalOrders,
      completedOrders,
      disputedOrders,
      totalValue,
      averageOrderValue: totalOrders > 0 ? totalValue / totalOrders : 0,
      disputeRate: totalOrders > 0 ? (disputedOrders / totalOrders) * 100 : 0,
      performanceScore: calculateSupplierPerformanceScore(totalOrders, completedOrders, disputedOrders),
    };
  });
}

export async function getRecentOrderAnomalies(limit: number = 10): Promise<OrderAnomaly[]> {
  return await db
    .select()
    .from(orderAnomalies)
    .where(eq(orderAnomalies.status, 'flagged'))
    .orderBy(desc(orderAnomalies.detectedAt))
    .limit(limit);
}

// ==================== DISPUTE MANAGEMENT ====================

export async function createDispute(disputeData: InsertDispute): Promise<Dispute> {
  const [dispute] = await db.insert(disputes).values(disputeData).returning();
  return dispute;
}

export async function getDisputes(filters: {
  status?: string;
  supplierId?: string;
  buyerId?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ disputes: Dispute[], total: number }> {
  const { status, supplierId, buyerId, limit = 50, offset = 0 } = filters;

  const whereConditions = [];
  
  if (status) {
    whereConditions.push(eq(disputes.status, status));
  }
  
  if (supplierId) {
    whereConditions.push(eq(disputes.supplierId, supplierId));
  }
  
  if (buyerId) {
    whereConditions.push(eq(disputes.buyerId, buyerId));
  }

  const [disputesResult, totalResult] = await Promise.all([
    db
      .select()
      .from(disputes)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(disputes.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(disputes)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
  ]);

  return {
    disputes: disputesResult,
    total: totalResult[0]?.count || 0
  };
}

export async function updateDisputeStatus(
  disputeId: string, 
  status: string, 
  mediatorId?: string,
  resolutionData?: {
    resolutionType?: string;
    resolutionSummary?: string;
    mediationNotes?: string;
  }
): Promise<Dispute> {
  const updateData: any = { 
    status, 
    updatedAt: new Date() 
  };

  if (mediatorId) {
    updateData.assignedMediator = mediatorId;
  }

  if (resolutionData) {
    Object.assign(updateData, resolutionData);
    
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    }
    
    if (status === 'closed') {
      updateData.closedAt = new Date();
    }
  }

  const [dispute] = await db
    .update(disputes)
    .set(updateData)
    .where(eq(disputes.id, disputeId))
    .returning();

  return dispute;
}

export async function addDisputeMessage(messageData: InsertDisputeMessage): Promise<DisputeMessage> {
  const [message] = await db.insert(disputeMessages).values(messageData).returning();
  return message;
}

export async function getDisputeMessages(disputeId: string): Promise<DisputeMessage[]> {
  return await db
    .select()
    .from(disputeMessages)
    .where(eq(disputeMessages.disputeId, disputeId))
    .orderBy(disputeMessages.createdAt);
}

// ==================== ORDER INTERVENTIONS ====================

export async function createOrderIntervention(interventionData: InsertOrderIntervention): Promise<OrderIntervention> {
  const [intervention] = await db.insert(orderInterventions).values(interventionData).returning();
  return intervention;
}

export async function getOrderInterventions(orderId: string): Promise<OrderIntervention[]> {
  return await db
    .select()
    .from(orderInterventions)
    .where(eq(orderInterventions.orderId, orderId))
    .orderBy(desc(orderInterventions.createdAt));
}

// ==================== REFUND PROCESSING ====================

export async function createRefund(refundData: InsertRefund): Promise<Refund> {
  const [refund] = await db.insert(refunds).values(refundData).returning();
  return refund;
}

export async function updateRefundStatus(refundId: string, status: string, transactionId?: string): Promise<Refund> {
  const updateData: any = { status };
  
  if (status === 'processing') {
    updateData.processedAt = new Date();
  }
  
  if (status === 'completed') {
    updateData.completedAt = new Date();
  }
  
  if (transactionId) {
    updateData.transactionId = transactionId;
  }

  const [refund] = await db
    .update(refunds)
    .set(updateData)
    .where(eq(refunds.id, refundId))
    .returning();

  return refund;
}

export async function getRefunds(filters: {
  status?: string;
  supplierId?: string;
  buyerId?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ refunds: Refund[], total: number }> {
  const { status, supplierId, buyerId, limit = 50, offset = 0 } = filters;

  const whereConditions = [];
  
  if (status) {
    whereConditions.push(eq(refunds.status, status));
  }
  
  if (supplierId) {
    whereConditions.push(eq(refunds.supplierId, supplierId));
  }
  
  if (buyerId) {
    whereConditions.push(eq(refunds.buyerId, buyerId));
  }

  const [refundsResult, totalResult] = await Promise.all([
    db
      .select()
      .from(refunds)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(refunds.requestedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(refunds)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
  ]);

  return {
    refunds: refundsResult,
    total: totalResult[0]?.count || 0
  };
}

// ==================== ANOMALY DETECTION ====================

export async function detectOrderAnomalies(orderId: string): Promise<OrderAnomaly[]> {
  // Get the order details
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) return [];

  const anomalies: InsertOrderAnomaly[] = [];

  // Check for unusual order amount
  const avgOrderAmount = await db
    .select({ avg: avg(orders.totalAmount) })
    .from(orders)
    .where(eq(orders.supplierId, order.supplierId));

  const avgAmount = Number(avgOrderAmount[0]?.avg) || 0;
  const orderAmount = Number(order.totalAmount);

  if (orderAmount > avgAmount * 3) {
    anomalies.push({
      orderId,
      anomalyType: 'unusual_amount',
      severity: 'high',
      confidenceScore: 85,
      description: `Order amount (${orderAmount}) is significantly higher than supplier average (${avgAmount})`,
      detectedValues: { orderAmount },
      expectedValues: { avgAmount },
    });
  }

  // Check for rapid orders from same buyer
  const recentOrders = await db
    .select({ count: count() })
    .from(orders)
    .where(
      and(
        eq(orders.buyerId, order.buyerId),
        gte(orders.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
      )
    );

  const recentOrderCount = recentOrders[0]?.count || 0;
  if (recentOrderCount > 5) {
    anomalies.push({
      orderId,
      anomalyType: 'rapid_orders',
      severity: 'medium',
      confidenceScore: 75,
      description: `Buyer has placed ${recentOrderCount} orders in the last 24 hours`,
      detectedValues: { recentOrderCount },
      expectedValues: { normalRange: '1-3' },
    });
  }

  // Insert detected anomalies
  if (anomalies.length > 0) {
    return await db.insert(orderAnomalies).values(anomalies).returning();
  }

  return [];
}

export async function updateAnomalyStatus(anomalyId: string, status: string, reviewNotes?: string, reviewerId?: string): Promise<OrderAnomaly> {
  const updateData: any = { 
    status,
    reviewedAt: new Date()
  };

  if (reviewNotes) {
    updateData.reviewNotes = reviewNotes;
  }

  if (reviewerId) {
    updateData.reviewedBy = reviewerId;
  }

  if (status === 'resolved') {
    updateData.resolvedAt = new Date();
  }

  const [anomaly] = await db
    .update(orderAnomalies)
    .set(updateData)
    .where(eq(orderAnomalies.id, anomalyId))
    .returning();

  return anomaly;
}

// ==================== DISPUTE ANALYTICS ====================

export interface DisputeAnalytics {
  totalDisputes: number;
  openDisputes: number;
  resolvedDisputes: number;
  averageResolutionTime: number;
  disputesByType: Array<{ type: string; count: number; percentage: number }>;
  disputesBySupplier: Array<{ supplierId: string; supplierName: string; disputes: number; rate: number }>;
  resolutionTypes: Array<{ type: string; count: number; percentage: number }>;
  trends: {
    daily: Array<{ date: string; disputes: number; resolved: number }>;
    monthly: Array<{ month: string; disputes: number; resolved: number }>;
  };
}

export async function getDisputeAnalytics(
  dateFrom?: Date,
  dateTo?: Date
): Promise<DisputeAnalytics> {
  const whereConditions = [];
  
  if (dateFrom) {
    whereConditions.push(gte(disputes.createdAt, dateFrom));
  }
  
  if (dateTo) {
    whereConditions.push(lte(disputes.createdAt, dateTo));
  }

  // Get total counts
  const totalCounts = await db
    .select({
      total: count(),
      open: sql<number>`COUNT(CASE WHEN status IN ('open', 'under_review', 'mediation') THEN 1 END)`,
      resolved: sql<number>`COUNT(CASE WHEN status IN ('resolved', 'closed') THEN 1 END)`,
    })
    .from(disputes)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  // Get disputes by type
  const disputesByType = await db
    .select({
      type: disputes.type,
      count: count(),
    })
    .from(disputes)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .groupBy(disputes.type);

  // Get disputes by supplier
  const disputesBySupplier = await db
    .select({
      supplierId: disputes.supplierId,
      supplierName: supplierProfiles.businessName,
      disputeCount: count(),
      totalOrders: sql<number>`(
        SELECT COUNT(*) FROM ${orders} 
        WHERE supplier_id = ${disputes.supplierId}
      )`,
    })
    .from(disputes)
    .leftJoin(supplierProfiles, eq(disputes.supplierId, supplierProfiles.userId))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .groupBy(disputes.supplierId, supplierProfiles.businessName);

  // Get resolution types
  const resolutionTypes = await db
    .select({
      type: disputes.resolutionType,
      count: count(),
    })
    .from(disputes)
    .where(
      and(
        disputes.resolutionType !== null,
        ...(whereConditions.length > 0 ? whereConditions : [])
      )
    )
    .groupBy(disputes.resolutionType);

  // Get daily trends (last 30 days)
  const dailyTrends = await db
    .select({
      date: sql<string>`DATE(${disputes.createdAt})`,
      disputes: count(),
      resolved: sql<number>`COUNT(CASE WHEN status IN ('resolved', 'closed') THEN 1 END)`,
    })
    .from(disputes)
    .where(gte(disputes.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
    .groupBy(sql`DATE(${disputes.createdAt})`)
    .orderBy(sql`DATE(${disputes.createdAt})`);

  // Calculate average resolution time
  const resolutionTimes = await db
    .select({
      avgTime: sql<number>`AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)`,
    })
    .from(disputes)
    .where(
      and(
        disputes.resolvedAt !== null,
        ...(whereConditions.length > 0 ? whereConditions : [])
      )
    );

  const totalDisputes = totalCounts[0]?.total || 0;
  const avgResolutionTime = resolutionTimes[0]?.avgTime || 0;

  return {
    totalDisputes,
    openDisputes: totalCounts[0]?.open || 0,
    resolvedDisputes: totalCounts[0]?.resolved || 0,
    averageResolutionTime: Math.round(avgResolutionTime),
    disputesByType: disputesByType.map(item => ({
      type: item.type || 'unknown',
      count: item.count,
      percentage: totalDisputes > 0 ? (item.count / totalDisputes) * 100 : 0,
    })),
    disputesBySupplier: disputesBySupplier.map(item => ({
      supplierId: item.supplierId,
      supplierName: item.supplierName || 'Unknown Supplier',
      disputes: item.disputeCount,
      rate: item.totalOrders > 0 ? (item.disputeCount / item.totalOrders) * 100 : 0,
    })),
    resolutionTypes: resolutionTypes.map(item => ({
      type: item.type || 'unknown',
      count: item.count,
      percentage: totalDisputes > 0 ? (item.count / totalDisputes) * 100 : 0,
    })),
    trends: {
      daily: dailyTrends.map(item => ({
        date: item.date,
        disputes: item.disputes,
        resolved: item.resolved,
      })),
      monthly: [], // Would need more complex query for monthly trends
    },
  };
}

export interface DisputePattern {
  pattern: string;
  description: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
  affectedSuppliers: string[];
  affectedProducts: string[];
}

export async function detectDisputePatterns(): Promise<DisputePattern[]> {
  const patterns: DisputePattern[] = [];

  // Pattern 1: High dispute rate for specific suppliers
  const highDisputeSuppliers = await db
    .select({
      supplierId: disputes.supplierId,
      supplierName: supplierProfiles.businessName,
      disputeCount: count(),
      totalOrders: sql<number>`(
        SELECT COUNT(*) FROM ${orders} 
        WHERE supplier_id = ${disputes.supplierId}
      )`,
    })
    .from(disputes)
    .leftJoin(supplierProfiles, eq(disputes.supplierId, supplierProfiles.userId))
    .where(gte(disputes.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
    .groupBy(disputes.supplierId, supplierProfiles.businessName)
    .having(sql`COUNT(*) > 5`);

  for (const supplier of highDisputeSuppliers) {
    const disputeRate = supplier.totalOrders > 0 ? (supplier.disputeCount / supplier.totalOrders) * 100 : 0;
    
    if (disputeRate > 10) {
      patterns.push({
        pattern: 'high_supplier_dispute_rate',
        description: `Supplier "${supplier.supplierName}" has a high dispute rate of ${disputeRate.toFixed(1)}%`,
        frequency: supplier.disputeCount,
        severity: disputeRate > 20 ? 'high' : 'medium',
        recommendation: 'Review supplier performance and consider additional training or monitoring',
        affectedSuppliers: [supplier.supplierId],
        affectedProducts: [],
      });
    }
  }

  // Pattern 2: Recurring dispute types
  const disputeTypeCounts = await db
    .select({
      type: disputes.type,
      count: count(),
    })
    .from(disputes)
    .where(gte(disputes.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
    .groupBy(disputes.type)
    .having(sql`COUNT(*) > 10`);

  for (const typeCount of disputeTypeCounts) {
    if (typeCount.count > 15) {
      patterns.push({
        pattern: 'recurring_dispute_type',
        description: `High frequency of "${typeCount.type}" disputes (${typeCount.count} cases)`,
        frequency: typeCount.count,
        severity: typeCount.count > 25 ? 'high' : 'medium',
        recommendation: `Review and improve processes related to ${typeCount.type} issues`,
        affectedSuppliers: [],
        affectedProducts: [],
      });
    }
  }

  // Pattern 3: Escalation patterns
  const escalatedDisputes = await db
    .select({
      count: count(),
    })
    .from(disputes)
    .where(
      and(
        gte(disputes.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
        sql`escalation_level > 0`
      )
    );

  const escalationCount = escalatedDisputes[0]?.count || 0;
  if (escalationCount > 5) {
    patterns.push({
      pattern: 'high_escalation_rate',
      description: `High number of escalated disputes (${escalationCount} cases)`,
      frequency: escalationCount,
      severity: escalationCount > 10 ? 'high' : 'medium',
      recommendation: 'Review dispute resolution processes and mediator training',
      affectedSuppliers: [],
      affectedProducts: [],
    });
  }

  return patterns;
}

// ==================== HELPER FUNCTIONS ====================

function buildOrderWhereConditions(filters: any) {
  const whereConditions = [];
  
  if (filters.status) {
    whereConditions.push(eq(orders.status, filters.status));
  }
  
  if (filters.supplierId) {
    whereConditions.push(eq(orders.supplierId, filters.supplierId));
  }
  
  if (filters.buyerId) {
    whereConditions.push(eq(orders.buyerId, filters.buyerId));
  }
  
  if (filters.dateFrom) {
    whereConditions.push(gte(orders.createdAt, filters.dateFrom));
  }
  
  if (filters.dateTo) {
    whereConditions.push(lte(orders.createdAt, filters.dateTo));
  }

  return whereConditions;
}

function calculateSupplierPerformanceScore(totalOrders: number, completedOrders: number, disputedOrders: number): number {
  if (totalOrders === 0) return 0;
  
  const completionRate = (completedOrders / totalOrders) * 100;
  const disputeRate = (disputedOrders / totalOrders) * 100;
  
  // Performance score: completion rate minus dispute penalty
  const score = completionRate - (disputeRate * 2);
  
  return Math.max(0, Math.min(100, score));
}