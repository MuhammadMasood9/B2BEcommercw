import { db } from './db';
import { 
  supplierProfiles, 
  products, 
  orders, 
  inquiries, 
  categories,
  users,
  buyerProfiles
} from '@shared/schema';
import { eq, and, gte, lte, desc, sql, count, avg, sum } from 'drizzle-orm';

export interface SupplierAnalytics {
  // Performance Metrics
  totalProducts: number;
  approvedProducts: number;
  pendingProducts: number;
  rejectedProducts: number;
  totalViews: number;
  totalInquiries: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  
  // Product Performance
  topPerformingProducts: Array<{
    id: string;
    name: string;
    views: number;
    inquiries: number;
    orders: number;
    revenue: number;
    conversionRate: number;
    status: string;
  }>;
  
  // Category Performance
  categoryPerformance: Array<{
    categoryId: string;
    categoryName: string;
    productCount: number;
    totalViews: number;
    totalInquiries: number;
    totalOrders: number;
    totalRevenue: number;
  }>;
  
  // Customer Analytics
  customerAnalytics: {
    totalCustomers: number;
    repeatCustomers: number;
    topCustomers: Array<{
      id: string;
      name: string;
      company: string;
      country: string;
      totalOrders: number;
      totalSpent: number;
      lastOrderDate: Date;
    }>;
    customersByCountry: Array<{
      country: string;
      customerCount: number;
      totalOrders: number;
      totalRevenue: number;
    }>;
  };
  
  // Traffic and Conversion
  trafficMetrics: {
    storeViews: number;
    productViews: number;
    inquiryConversionRate: number;
    orderConversionRate: number;
    averageTimeToResponse: number;
  };
  
  // Time-based Trends
  monthlyTrends: Array<{
    month: string;
    year: number;
    views: number;
    inquiries: number;
    orders: number;
    revenue: number;
    newProducts: number;
    newCustomers: number;
  }>;
  
  // Recent Activity
  recentActivity: Array<{
    type: 'product_view' | 'inquiry' | 'order' | 'product_created';
    productId?: string;
    productName?: string;
    customerName?: string;
    amount?: number;
    timestamp: Date;
  }>;
}

export class SupplierAnalyticsService {
  
  /**
   * Get comprehensive analytics for a supplier
   */
  async getSupplierAnalytics(supplierId: string, timeRange: string = '30d'): Promise<SupplierAnalytics> {
    const dateRange = this.getDateRange(timeRange);
    
    // Get basic supplier info
    const supplier = await db.select()
      .from(supplierProfiles)
      .where(eq(supplierProfiles.id, supplierId))
      .limit(1);
    
    if (supplier.length === 0) {
      throw new Error('Supplier not found');
    }
    
    // Run all analytics queries in parallel
    const [
      productMetrics,
      topProducts,
      categoryPerformance,
      customerAnalytics,
      trafficMetrics,
      monthlyTrends,
      recentActivity
    ] = await Promise.all([
      this.getProductMetrics(supplierId, dateRange),
      this.getTopPerformingProducts(supplierId, dateRange),
      this.getCategoryPerformance(supplierId, dateRange),
      this.getCustomerAnalytics(supplierId, dateRange),
      this.getTrafficMetrics(supplierId, dateRange),
      this.getMonthlyTrends(supplierId),
      this.getRecentActivity(supplierId, 20)
    ]);
    
    return {
      ...productMetrics,
      topPerformingProducts: topProducts,
      categoryPerformance,
      customerAnalytics,
      trafficMetrics,
      monthlyTrends,
      recentActivity
    };
  }
  
  /**
   * Get basic product metrics for supplier
   */
  private async getProductMetrics(supplierId: string, dateRange: { start: Date; end: Date }) {
    // Product counts by status
    const productCounts = await db.select({
      status: products.status,
      count: count()
    })
    .from(products)
    .where(eq(products.supplierId, supplierId))
    .groupBy(products.status);
    
    const statusCounts = productCounts.reduce((acc, item) => {
      acc[item.status || 'draft'] = Number(item.count);
      return acc;
    }, {} as Record<string, number>);
    
    // Total metrics
    const [totalMetrics] = await db.select({
      totalProducts: count(products.id),
      totalViews: sum(products.views),
      totalInquiries: sum(products.inquiries)
    })
    .from(products)
    .where(eq(products.supplierId, supplierId));
    
    // Order metrics
    const [orderMetrics] = await db.select({
      totalOrders: count(orders.id),
      totalRevenue: sum(orders.supplierAmount),
      averageOrderValue: avg(orders.supplierAmount)
    })
    .from(orders)
    .where(and(
      eq(orders.supplierId, supplierId),
      gte(orders.createdAt, dateRange.start),
      lte(orders.createdAt, dateRange.end)
    ));
    
    // Calculate conversion rate
    const totalViews = Number(totalMetrics.totalViews) || 0;
    const totalInquiries = Number(totalMetrics.totalInquiries) || 0;
    const conversionRate = totalViews > 0 ? (totalInquiries / totalViews) * 100 : 0;
    
    return {
      totalProducts: Number(totalMetrics.totalProducts) || 0,
      approvedProducts: statusCounts.approved || 0,
      pendingProducts: statusCounts.pending_approval || 0,
      rejectedProducts: statusCounts.rejected || 0,
      totalViews,
      totalInquiries,
      totalOrders: Number(orderMetrics.totalOrders) || 0,
      totalRevenue: Number(orderMetrics.totalRevenue) || 0,
      averageOrderValue: Number(orderMetrics.averageOrderValue) || 0,
      conversionRate: Math.round(conversionRate * 100) / 100
    };
  }
  
  /**
   * Get top performing products
   */
  private async getTopPerformingProducts(supplierId: string, dateRange: { start: Date; end: Date }) {
    const topProducts = await db.select({
      id: products.id,
      name: products.name,
      views: products.views,
      inquiries: products.inquiries,
      status: products.status,
      orders: count(orders.id),
      revenue: sum(orders.supplierAmount)
    })
    .from(products)
    .leftJoin(orders, and(
      eq(orders.productId, products.id),
      gte(orders.createdAt, dateRange.start),
      lte(orders.createdAt, dateRange.end)
    ))
    .where(eq(products.supplierId, supplierId))
    .groupBy(products.id, products.name, products.views, products.inquiries, products.status)
    .orderBy(desc(products.views))
    .limit(10);
    
    return topProducts.map(product => ({
      id: product.id,
      name: product.name,
      views: Number(product.views) || 0,
      inquiries: Number(product.inquiries) || 0,
      orders: Number(product.orders) || 0,
      revenue: Number(product.revenue) || 0,
      conversionRate: product.views ? Math.round(((Number(product.inquiries) || 0) / Number(product.views)) * 10000) / 100 : 0,
      status: product.status || 'draft'
    }));
  }
  
  /**
   * Get category performance metrics
   */
  private async getCategoryPerformance(supplierId: string, dateRange: { start: Date; end: Date }) {
    const categoryStats = await db.select({
      categoryId: products.categoryId,
      categoryName: categories.name,
      productCount: count(products.id),
      totalViews: sum(products.views),
      totalInquiries: sum(products.inquiries),
      totalOrders: count(orders.id),
      totalRevenue: sum(orders.supplierAmount)
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(orders, and(
      eq(orders.productId, products.id),
      gte(orders.createdAt, dateRange.start),
      lte(orders.createdAt, dateRange.end)
    ))
    .where(eq(products.supplierId, supplierId))
    .groupBy(products.categoryId, categories.name)
    .orderBy(desc(sum(products.views)));
    
    return categoryStats.map(category => ({
      categoryId: category.categoryId || '',
      categoryName: category.categoryName || 'Uncategorized',
      productCount: Number(category.productCount) || 0,
      totalViews: Number(category.totalViews) || 0,
      totalInquiries: Number(category.totalInquiries) || 0,
      totalOrders: Number(category.totalOrders) || 0,
      totalRevenue: Number(category.totalRevenue) || 0
    }));
  }
  
  /**
   * Get customer analytics
   */
  private async getCustomerAnalytics(supplierId: string, dateRange: { start: Date; end: Date }) {
    // Get unique customers
    const customerStats = await db.select({
      customerId: orders.buyerId,
      customerName: users.firstName,
      customerLastName: users.lastName,
      company: buyerProfiles.companyName,
      country: buyerProfiles.country,
      totalOrders: count(orders.id),
      totalSpent: sum(orders.supplierAmount),
      lastOrderDate: sql<Date>`MAX(${orders.createdAt})`
    })
    .from(orders)
    .leftJoin(users, eq(orders.buyerId, users.id))
    .leftJoin(buyerProfiles, eq(orders.buyerId, buyerProfiles.userId))
    .where(and(
      eq(orders.supplierId, supplierId),
      gte(orders.createdAt, dateRange.start),
      lte(orders.createdAt, dateRange.end)
    ))
    .groupBy(
      orders.buyerId, 
      users.firstName, 
      users.lastName, 
      buyerProfiles.companyName, 
      buyerProfiles.country
    )
    .orderBy(desc(sum(orders.supplierAmount)))
    .limit(10);
    
    // Get customers by country
    const customersByCountry = await db.select({
      country: buyerProfiles.country,
      customerCount: sql<number>`COUNT(DISTINCT ${orders.buyerId})`,
      totalOrders: count(orders.id),
      totalRevenue: sum(orders.supplierAmount)
    })
    .from(orders)
    .leftJoin(buyerProfiles, eq(orders.buyerId, buyerProfiles.userId))
    .where(and(
      eq(orders.supplierId, supplierId),
      gte(orders.createdAt, dateRange.start),
      lte(orders.createdAt, dateRange.end)
    ))
    .groupBy(buyerProfiles.country)
    .orderBy(desc(count(orders.id)));
    
    // Calculate repeat customers
    const repeatCustomers = customerStats.filter(customer => Number(customer.totalOrders) > 1);
    
    return {
      totalCustomers: customerStats.length,
      repeatCustomers: repeatCustomers.length,
      topCustomers: customerStats.map(customer => ({
        id: customer.customerId || '',
        name: `${customer.customerName || ''} ${customer.customerLastName || ''}`.trim(),
        company: customer.company || '',
        country: customer.country || '',
        totalOrders: Number(customer.totalOrders) || 0,
        totalSpent: Number(customer.totalSpent) || 0,
        lastOrderDate: customer.lastOrderDate
      })),
      customersByCountry: customersByCountry.map(country => ({
        country: country.country || 'Unknown',
        customerCount: Number(country.customerCount) || 0,
        totalOrders: Number(country.totalOrders) || 0,
        totalRevenue: Number(country.totalRevenue) || 0
      }))
    };
  }
  
  /**
   * Get traffic and conversion metrics
   */
  private async getTrafficMetrics(supplierId: string, dateRange: { start: Date; end: Date }) {
    // Get supplier profile for store views
    const [supplierData] = await db.select({
      storeViews: supplierProfiles.storeViews
    })
    .from(supplierProfiles)
    .where(eq(supplierProfiles.id, supplierId));
    
    // Get product views sum
    const [productViewsData] = await db.select({
      totalProductViews: sum(products.views)
    })
    .from(products)
    .where(eq(products.supplierId, supplierId));
    
    // Get inquiry and order counts for conversion rates
    const [conversionData] = await db.select({
      totalInquiries: count(inquiries.id),
      totalOrders: count(orders.id)
    })
    .from(inquiries)
    .leftJoin(orders, eq(inquiries.id, orders.inquiryId))
    .where(and(
      eq(inquiries.supplierId, supplierId),
      gte(inquiries.createdAt, dateRange.start),
      lte(inquiries.createdAt, dateRange.end)
    ));
    
    const totalViews = Number(productViewsData.totalProductViews) || 0;
    const totalInquiries = Number(conversionData.totalInquiries) || 0;
    const totalOrders = Number(conversionData.totalOrders) || 0;
    
    return {
      storeViews: Number(supplierData?.storeViews) || 0,
      productViews: totalViews,
      inquiryConversionRate: totalViews > 0 ? Math.round((totalInquiries / totalViews) * 10000) / 100 : 0,
      orderConversionRate: totalInquiries > 0 ? Math.round((totalOrders / totalInquiries) * 10000) / 100 : 0,
      averageTimeToResponse: 24 // Mock data - would need to calculate from inquiry response times
    };
  }
  
  /**
   * Get monthly trends for the last 12 months
   */
  private async getMonthlyTrends(supplierId: string) {
    const trends = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      // Get metrics for this month
      const [monthData] = await db.select({
        views: sum(products.views),
        inquiries: count(inquiries.id),
        orders: count(orders.id),
        revenue: sum(orders.supplierAmount),
        newProducts: sql<number>`COUNT(CASE WHEN ${products.createdAt} >= ${monthStart} AND ${products.createdAt} <= ${monthEnd} THEN 1 END)`,
        newCustomers: sql<number>`COUNT(DISTINCT CASE WHEN ${orders.createdAt} >= ${monthStart} AND ${orders.createdAt} <= ${monthEnd} THEN ${orders.buyerId} END)`
      })
      .from(products)
      .leftJoin(inquiries, and(
        eq(inquiries.productId, products.id),
        gte(inquiries.createdAt, monthStart),
        lte(inquiries.createdAt, monthEnd)
      ))
      .leftJoin(orders, and(
        eq(orders.productId, products.id),
        gte(orders.createdAt, monthStart),
        lte(orders.createdAt, monthEnd)
      ))
      .where(eq(products.supplierId, supplierId));
      
      trends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        year: monthStart.getFullYear(),
        views: Number(monthData.views) || 0,
        inquiries: Number(monthData.inquiries) || 0,
        orders: Number(monthData.orders) || 0,
        revenue: Number(monthData.revenue) || 0,
        newProducts: Number(monthData.newProducts) || 0,
        newCustomers: Number(monthData.newCustomers) || 0
      });
    }
    
    return trends;
  }
  
  /**
   * Get recent activity
   */
  private async getRecentActivity(supplierId: string, limit: number = 20) {
    // This is a simplified version - in a real implementation, you'd have an activity log table
    const recentOrders = await db.select({
      type: sql<string>`'order'`,
      productId: orders.productId,
      productName: products.name,
      customerName: users.firstName,
      amount: orders.supplierAmount,
      timestamp: orders.createdAt
    })
    .from(orders)
    .leftJoin(products, eq(orders.productId, products.id))
    .leftJoin(users, eq(orders.buyerId, users.id))
    .where(eq(orders.supplierId, supplierId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
    
    return recentOrders.map(activity => ({
      type: activity.type as 'product_view' | 'inquiry' | 'order' | 'product_created',
      productId: activity.productId || undefined,
      productName: activity.productName || undefined,
      customerName: activity.customerName || undefined,
      amount: Number(activity.amount) || undefined,
      timestamp: activity.timestamp || new Date()
    }));
  }
  
  /**
   * Get date range based on time range string
   */
  private getDateRange(timeRange: string): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }
    
    return { start, end };
  }
  
  /**
   * Get sales analytics for supplier
   */
  async getSalesAnalytics(supplierId: string, timeRange: string = '30d') {
    const dateRange = this.getDateRange(timeRange);
    
    const salesData = await db.select({
      totalSales: sum(orders.supplierAmount),
      totalOrders: count(orders.id),
      averageOrderValue: avg(orders.supplierAmount),
      totalCommission: sum(orders.commissionAmount)
    })
    .from(orders)
    .where(and(
      eq(orders.supplierId, supplierId),
      gte(orders.createdAt, dateRange.start),
      lte(orders.createdAt, dateRange.end)
    ));
    
    return salesData[0];
  }
  
  /**
   * Get product analytics for supplier
   */
  async getProductAnalytics(supplierId: string) {
    const productStats = await db.select({
      totalProducts: count(products.id),
      publishedProducts: sql<number>`COUNT(CASE WHEN ${products.isPublished} = true THEN 1 END)`,
      featuredProducts: sql<number>`COUNT(CASE WHEN ${products.isFeatured} = true THEN 1 END)`,
      totalViews: sum(products.views),
      totalInquiries: sum(products.inquiries),
      averageViews: avg(products.views),
      averageInquiries: avg(products.inquiries)
    })
    .from(products)
    .where(eq(products.supplierId, supplierId));
    
    return productStats[0];
  }
}

export const supplierAnalyticsService = new SupplierAnalyticsService();