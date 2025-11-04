import { db } from './db';
import { 
  orders, 
  buyers,
  users,
  products,
  quotations,
  inquiryQuotations,
  type Order, 
  type InsertOrder,
  type Buyer,
  type User,
  type Product,
  type Quotation,
  type InquiryQuotation 
} from '@shared/schema';
import { eq, and, or, desc, asc, sql, gte, lte, inArray } from 'drizzle-orm';
import { notificationService } from './notificationService';

export interface SupplierOrderFilters {
  status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
  minValue?: number;
  maxValue?: number;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
}

export interface SupplierOrderAnalytics {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  monthlyTrend: Array<{
    month: string;
    orderCount: number;
    revenue: number;
  }>;
}

export interface OrderWithDetails extends Order {
  buyer: Buyer & { user: User };
  product?: Product;
  quotation?: Quotation;
  inquiryQuotation?: InquiryQuotation;
}

export class SupplierOrderService {

  /**
   * Get supplier's orders with filtering and pagination
   */
  async getSupplierOrders(
    supplierId: string,
    filters: SupplierOrderFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    orders: OrderWithDetails[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(orders.supplierId, supplierId)];

    if (filters.status) {
      whereConditions.push(eq(orders.status, filters.status));
    }

    if (filters.paymentStatus) {
      whereConditions.push(eq(orders.paymentStatus, filters.paymentStatus));
    }

    if (filters.dateFrom) {
      whereConditions.push(gte(orders.createdAt, filters.dateFrom));
    }

    if (filters.dateTo) {
      whereConditions.push(lte(orders.createdAt, filters.dateTo));
    }

    if (filters.minValue) {
      whereConditions.push(sql`${orders.totalAmount}::numeric >= ${filters.minValue}`);
    }

    if (filters.maxValue) {
      whereConditions.push(sql`${orders.totalAmount}::numeric <= ${filters.maxValue}`);
    }

    if (filters.searchTerm) {
      const searchPattern = `%${filters.searchTerm.toLowerCase()}%`;
      whereConditions.push(
        or(
          sql`LOWER(${orders.orderNumber}) LIKE ${searchPattern}`,
          sql`LOWER(${orders.notes}) LIKE ${searchPattern}`
        )!
      );
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(...whereConditions));

    // Get orders with buyer and related details
    const ordersWithDetails = await db
      .select({
        order: orders,
        buyer: buyers,
        user: users,
        product: products,
      })
      .from(orders)
      .innerJoin(buyers, eq(orders.buyerId, buyers.id))
      .innerJoin(users, eq(buyers.userId, users.id))
      .leftJoin(products, eq(orders.productId, products.id))
      .where(and(...whereConditions))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    // Get quotation information for each order
    const orderIds = ordersWithDetails.map(o => o.order.id);
    
    // Get quotation IDs from orders
    const quotationIds = ordersWithDetails
      .map(o => o.order.quotationId)
      .filter(Boolean) as string[];

    // Get RFQ quotations
    const rfqQuotations = quotationIds.length > 0 
      ? await db
          .select()
          .from(quotations)
          .where(inArray(quotations.id, quotationIds))
      : [];

    // Get inquiry quotations
    const inquiryQuotationsResult = quotationIds.length > 0 
      ? await db
          .select()
          .from(inquiryQuotations)
          .where(inArray(inquiryQuotations.id, quotationIds))
      : [];

    const quotationMap = rfqQuotations.reduce((acc, quotation) => {
      acc[quotation.id] = quotation;
      return acc;
    }, {} as Record<string, Quotation>);

    const inquiryQuotationMap = inquiryQuotationsResult.reduce((acc, quotation) => {
      acc[quotation.id] = quotation;
      return acc;
    }, {} as Record<string, InquiryQuotation>);

    // Format results
    const formattedOrders: OrderWithDetails[] = ordersWithDetails.map(row => ({
      ...row.order,
      buyer: {
        ...row.buyer,
        user: row.user,
      },
      product: row.product || undefined,
      quotation: row.order.quotationId ? quotationMap[row.order.quotationId] : undefined,
      inquiryQuotation: row.order.quotationId ? inquiryQuotationMap[row.order.quotationId] : undefined,
    }));

    return {
      orders: formattedOrders,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Get order details for supplier
   */
  async getOrderDetails(orderId: string, supplierId: string): Promise<OrderWithDetails | null> {
    // Get order with buyer and product details
    const [orderResult] = await db
      .select({
        order: orders,
        buyer: buyers,
        user: users,
        product: products,
      })
      .from(orders)
      .innerJoin(buyers, eq(orders.buyerId, buyers.id))
      .innerJoin(users, eq(buyers.userId, users.id))
      .leftJoin(products, eq(orders.productId, products.id))
      .where(and(eq(orders.id, orderId), eq(orders.supplierId, supplierId)))
      .limit(1);

    if (!orderResult) return null;

    // Get quotation if exists
    let quotation: Quotation | undefined;
    let inquiryQuotation: InquiryQuotation | undefined;

    if (orderResult.order.quotationId) {
      // Try RFQ quotation first
      const [rfqQuotation] = await db
        .select()
        .from(quotations)
        .where(eq(quotations.id, orderResult.order.quotationId))
        .limit(1);

      if (rfqQuotation) {
        quotation = rfqQuotation;
      } else {
        // Try inquiry quotation
        const [inqQuotation] = await db
          .select()
          .from(inquiryQuotations)
          .where(eq(inquiryQuotations.id, orderResult.order.quotationId))
          .limit(1);

        if (inqQuotation) {
          inquiryQuotation = inqQuotation;
        }
      }
    }

    return {
      ...orderResult.order,
      buyer: {
        ...orderResult.buyer,
        user: orderResult.user,
      },
      product: orderResult.product || undefined,
      quotation,
      inquiryQuotation,
    };
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string, 
    supplierId: string, 
    status: string,
    notes?: string,
    trackingNumber?: string
  ): Promise<Order> {
    // Verify order belongs to supplier
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.supplierId, supplierId)))
      .limit(1);

    if (!existingOrder) {
      throw new Error('Order not found or access denied');
    }

    // Update order
    const updateData: any = {
      status,
    };

    if (notes) {
      updateData.notes = notes;
    }

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();

    // Send notification to buyer
    try {
      await notificationService.createNotification({
        userId: existingOrder.buyerId,
        type: 'info',
        title: 'Order Status Updated',
        message: `Your order ${existingOrder.orderNumber} status has been updated to: ${status}`,
        relatedId: orderId,
        relatedType: 'order',
      });
    } catch (error) {
      console.error('Error sending order status notification:', error);
    }

    return updatedOrder;
  }

  /**
   * Get supplier order analytics
   */
  async getSupplierOrderAnalytics(supplierId: string): Promise<SupplierOrderAnalytics> {
    // Get order counts by status
    const statusCounts = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)`,
        totalRevenue: sql<number>`sum(total_amount)`,
      })
      .from(orders)
      .where(eq(orders.supplierId, supplierId))
      .groupBy(orders.status);

    const statusCountMap = statusCounts.reduce((acc, item) => {
      acc[item.status!] = {
        count: item.count,
        revenue: Number(item.totalRevenue || 0),
      };
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    const totalOrders = Object.values(statusCountMap).reduce((sum, stat) => sum + stat.count, 0);
    const totalRevenue = Object.values(statusCountMap).reduce((sum, stat) => sum + stat.revenue, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get monthly trend (last 12 months)
    const monthlyTrend = await db
      .select({
        month: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
        orderCount: sql<number>`count(*)`,
        revenue: sql<number>`sum(total_amount)`,
      })
      .from(orders)
      .where(and(
        eq(orders.supplierId, supplierId),
        gte(orders.createdAt, new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000))
      ))
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`)
      .orderBy(asc(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`));

    return {
      totalOrders,
      pendingOrders: statusCountMap.pending?.count || 0,
      processingOrders: statusCountMap.processing?.count || 0,
      shippedOrders: statusCountMap.shipped?.count || 0,
      deliveredOrders: statusCountMap.delivered?.count || 0,
      cancelledOrders: statusCountMap.cancelled?.count || 0,
      totalRevenue,
      averageOrderValue,
      conversionRate: 0, // TODO: Calculate based on quotations to orders conversion
      monthlyTrend: monthlyTrend.map(item => ({
        month: item.month,
        orderCount: item.orderCount,
        revenue: Number(item.revenue || 0),
      })),
    };
  }

  /**
   * Get recent orders for supplier dashboard
   */
  async getRecentOrders(supplierId: string, limit: number = 5): Promise<OrderWithDetails[]> {
    const result = await this.getSupplierOrders(supplierId, {}, 1, limit);
    return result.orders;
  }

  /**
   * Get pending orders count
   */
  async getPendingOrdersCount(supplierId: string): Promise<number> {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(eq(orders.supplierId, supplierId), eq(orders.status, 'pending')));

    return count;
  }

  /**
   * Process order fulfillment
   */
  async processOrderFulfillment(
    orderId: string,
    supplierId: string,
    fulfillmentData: {
      trackingNumber?: string;
      shippingCarrier?: string;
      estimatedDelivery?: Date;
      notes?: string;
    }
  ): Promise<Order> {
    // Verify order belongs to supplier and can be fulfilled
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.supplierId, supplierId)))
      .limit(1);

    if (!existingOrder) {
      throw new Error('Order not found or access denied');
    }

    if (existingOrder.status !== 'confirmed' && existingOrder.status !== 'processing') {
      throw new Error('Order cannot be fulfilled in current status');
    }

    // Update order with fulfillment information
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: 'shipped',
        trackingNumber: fulfillmentData.trackingNumber,
        notes: fulfillmentData.notes || existingOrder.notes,
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Send notification to buyer
    try {
      await notificationService.createNotification({
        userId: existingOrder.buyerId,
        type: 'info',
        title: 'Order Shipped',
        message: `Your order ${existingOrder.orderNumber} has been shipped${fulfillmentData.trackingNumber ? ` with tracking number: ${fulfillmentData.trackingNumber}` : ''}`,
        relatedId: orderId,
        relatedType: 'order',
      });
    } catch (error) {
      console.error('Error sending order fulfillment notification:', error);
    }

    return updatedOrder;
  }

  /**
   * Get order performance metrics
   */
  async getOrderPerformanceMetrics(supplierId: string): Promise<{
    averageFulfillmentTime: number; // hours
    onTimeDeliveryRate: number; // percentage
    orderCancellationRate: number; // percentage
    customerSatisfactionScore: number; // 1-5 scale
  }> {
    // Get fulfillment time metrics
    const fulfillmentMetrics = await db
      .select({
        avgFulfillmentTime: sql<number>`avg(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600)`,
      })
      .from(orders)
      .where(and(
        eq(orders.supplierId, supplierId),
        eq(orders.status, 'delivered')
      ));

    // Get cancellation rate
    const [{ totalOrders }] = await db
      .select({ totalOrders: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.supplierId, supplierId));

    const [{ cancelledOrders }] = await db
      .select({ cancelledOrders: sql<number>`count(*)` })
      .from(orders)
      .where(and(eq(orders.supplierId, supplierId), eq(orders.status, 'cancelled')));

    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    return {
      averageFulfillmentTime: Number(fulfillmentMetrics[0]?.avgFulfillmentTime || 0),
      onTimeDeliveryRate: 0, // TODO: Calculate based on estimated vs actual delivery dates
      orderCancellationRate: cancellationRate,
      customerSatisfactionScore: 0, // TODO: Calculate based on reviews and ratings
    };
  }

  /**
   * Get order conversion rate (quotations to orders)
   */
  async getOrderConversionRate(supplierId: string): Promise<number> {
    // Get total quotations sent
    const [{ totalQuotations }] = await db
      .select({ totalQuotations: sql<number>`count(*)` })
      .from(quotations)
      .where(eq(quotations.supplierId, supplierId));

    const [{ totalInquiryQuotations }] = await db
      .select({ totalInquiryQuotations: sql<number>`count(*)` })
      .from(inquiryQuotations)
      .innerJoin(orders, eq(inquiryQuotations.inquiryId, orders.inquiryId))
      .where(eq(orders.supplierId, supplierId));

    // Get orders created from quotations
    const [{ ordersFromQuotations }] = await db
      .select({ ordersFromQuotations: sql<number>`count(*)` })
      .from(orders)
      .where(and(
        eq(orders.supplierId, supplierId),
        sql`${orders.quotationId} IS NOT NULL`
      ));

    const totalQuotationsSent = totalQuotations + totalInquiryQuotations;
    return totalQuotationsSent > 0 ? (ordersFromQuotations / totalQuotationsSent) * 100 : 0;
  }
}

export const supplierOrderService = new SupplierOrderService();