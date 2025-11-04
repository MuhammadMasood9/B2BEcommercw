import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { sql, eq, and, gte, desc } from "drizzle-orm";
import { orders, supplierProfiles, products, users, inquiries, quotations } from "../shared/schema";
import { authRoutes } from "./authRoutes";
import { hybridAuthMiddleware } from "./authMiddleware";
import { requireAuth, requireAdmin, requireSupplier, requireBuyer } from "./authGuards";
import categoryRoutes from "./categoryRoutes";
import uploadRoutes from "./uploadRoutes";
import chatRoutes from "./chatRoutes";
import { supplierRoutes } from "./supplierRoutes";
import { adminSupplierRoutes } from "./adminSupplierRoutes";
import { adminProductRoutes } from "./adminProductRoutes";
import { adminOversightRoutes } from "./adminOversightRoutes";
import { systemMonitoringRoutes } from "./systemMonitoringRoutes";
import { automatedAlertingRoutes } from "./automatedAlertingRoutes";
import { staffRoutes } from "./staffRoutes";
import commissionRoutes from "./commissionRoutes";
import payoutRoutes from "./payoutRoutes";
import verificationRoutes from "./verificationRoutes";
import contentModerationRoutes from "./contentModerationRoutes";
// import platformAnalyticsRoutes from "./platformAnalyticsRoutes";
import { reportRoutes } from "./reportRoutes";
import { orderManagementRoutes } from "./orderManagementRoutes";
import { platformSettingsRoutes } from "./platformSettingsRoutes";
import adminAccessControlRoutes from "./adminAccessControlRoutes";
import securityMonitoringRoutes from "./securityMonitoringRoutes";
import communicationRoutes from "./communicationRoutes";
import complianceAuditRoutes from "./complianceAuditRoutes";
import buyerProductRoutes from "./buyerProductRoutes";
import buyerRFQRoutes from "./buyerRFQRoutes";
import buyerInquiryRoutes from "./buyerInquiryRoutes";
import inquiryTemplateRoutes from "./inquiryTemplateRoutes";
import quotationManagementRoutes from "./quotationManagementRoutes";
import buyerApiRoutes from "./buyerApiRoutes";
import supplierApiRoutes from "./supplierApiRoutes";
import disputeApiRoutes from "./disputeApiRoutes";
import chatApiRoutes from "./chatApiRoutes";
import { loadAdminUserMiddleware, securityMonitoringMiddleware } from "./permissionMiddleware";
import { upload, uploadUnrestricted } from "./upload";
import {
  insertProductSchema, insertCategorySchema, insertCustomerSchema, insertOrderSchema,
  insertUserSchema, insertBuyerProfileSchema,
  insertRfqSchema, insertQuotationSchema, insertInquirySchema,
  insertConversationSchema, insertMessageSchema, insertReviewSchema,
  insertFavoriteSchema, insertNotificationSchema, insertActivityLogSchema,
  users, products, categories, orders, inquiries, quotations, rfqs, notifications, activity_logs, conversations, supplierProfiles, commissionSettings, favorites
} from "@shared/schema";
import { z } from 'zod';
import { sql, eq, and, gte, desc, or, ilike } from "drizzle-orm";
import * as path from 'path';
import * as fs from 'fs';
import { authMiddleware } from "./auth";
import { authMiddleware } from "./auth";
import { authMiddleware } from "./auth";
import { authMiddleware } from "./auth";
import { authMiddleware } from "./auth";
import { authMiddleware } from "./auth";
import { authMiddleware } from "./auth";
import { authMiddleware } from "./auth";
import { authMiddleware } from "./auth";
import { authMiddleware } from "./auth";
import { authMiddleware } from "./auth";
import { authMiddleware } from "./auth";
import { authMiddleware } from "./auth";
import { authMiddleware } from "./auth";
import { authMiddleware } from "./auth";
import { authMiddleware } from "./auth";
import { authMiddleware } from "./auth";
import { authMiddleware } from "./auth";
import { authMiddleware } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('=== ROUTES LOADING - UPDATED VERSION ===');

  // ==================== AUTHENTICATION ROUTES ====================

  app.use('/api/auth', authRoutes);

  // ==================== UPLOAD ROUTES ====================

  app.use('/api', uploadRoutes);

  // ==================== CATEGORY ROUTES ====================

  app.use('/api', categoryRoutes);

  // ==================== CHAT ROUTES ====================

  app.use('/api/chat', chatRoutes);

  // ==================== BUYER PRODUCT ROUTES ====================

  app.use('/api', buyerProductRoutes);

  // ==================== BUYER RFQ ROUTES ====================

  app.use('/api/buyer/rfqs', buyerRFQRoutes);

  // ==================== BUYER INQUIRY ROUTES ====================

  app.use('/api/buyer/inquiries', buyerInquiryRoutes);

  // ==================== INQUIRY TEMPLATE ROUTES ====================

  app.use('/api/inquiry-templates', inquiryTemplateRoutes);

  // ==================== QUOTATION MANAGEMENT ROUTES ====================

  app.use('/api', quotationManagementRoutes);

  // ==================== NEW BUYER API ROUTES ====================

  app.use('/api/buyer', buyerApiRoutes);

  // ==================== NEW SUPPLIER API ROUTES ====================

  app.use('/api/supplier', supplierApiRoutes);

  // ==================== DISPUTE MANAGEMENT API ROUTES ====================

  app.use('/api', disputeApiRoutes);

  // ==================== CHAT SYSTEM API ROUTES ====================

  app.use('/api/chat', chatApiRoutes);

  // ==================== SUPPLIER ROUTES ====================

  app.use('/api/suppliers', supplierRoutes);

  // ==================== STAFF MANAGEMENT ROUTES ====================

  app.use('/api/suppliers/staff', staffRoutes);

  // ==================== ADMIN SUPPLIER ROUTES ====================

  app.use('/api/admin/suppliers', adminSupplierRoutes);

  // ==================== ADMIN PRODUCT ROUTES ====================

  app.use('/api/admin/products', adminProductRoutes);

  // ==================== ADMIN OVERSIGHT ROUTES ====================

  app.use('/api/admin/oversight', adminOversightRoutes);

  // ==================== ORDER MANAGEMENT ROUTES ====================

  app.use('/api/admin/orders', orderManagementRoutes);

  // ==================== ADMIN DASHBOARD ROUTES ====================

  // Test endpoint to verify routing
  app.get('/api/admin/dashboard/test', (req, res) => {
    res.json({ success: true, message: 'Dashboard route is working', timestamp: new Date() });
  });

  // Direct dashboard endpoint for testing (bypasses middleware)
  app.get('/api/admin/dashboard/comprehensive-metrics', async (req, res) => {
    try {
      console.log('📊 Direct comprehensive dashboard metrics endpoint hit');

      if (!db) {
        return res.status(500).json({ error: 'Database connection not available' });
      }

      const timeRange = req.query.timeRange as string || '30d';
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Fetch real KPI data from database
      const [
        totalRevenueResult,
        totalSuppliersResult,
        activeSuppliersResult,
        pendingApprovalsResult,
        totalProductsResult,
        approvedProductsResult,
        totalOrdersResult,
        onlineSuppliersResult,
        activeOrdersResult
      ] = await Promise.all([
        // Total revenue from orders
        db.select({
          total: sql<string>`COALESCE(SUM(${orders.totalAmount}), 0)`
        }).from(orders).where(sql`${orders.createdAt} >= ${startDate}`),
        
        // Total suppliers
        db.select({
          count: sql<string>`COUNT(*)`
        }).from(supplierProfiles),
        
        // Active suppliers (have products or recent activity)
        db.select({
          count: sql<string>`COUNT(DISTINCT ${supplierProfiles.id})`
        }).from(supplierProfiles)
          .innerJoin(products, sql`${products.supplierId} = ${supplierProfiles.id}`)
          .where(sql`${supplierProfiles.isActive} = true AND ${products.isApproved} = true`),
        
        // Pending approvals
        db.select({
          count: sql<string>`COUNT(*)`
        }).from(products).where(sql`${products.status} = 'pending_approval'`),
        
        // Total products
        db.select({
          count: sql<string>`COUNT(*)`
        }).from(products),
        
        // Approved products
        db.select({
          count: sql<string>`COUNT(*)`
        }).from(products).where(sql`${products.isApproved} = true`),
        
        // Total orders
        db.select({
          count: sql<string>`COUNT(*)`
        }).from(orders).where(sql`${orders.createdAt} >= ${startDate}`),
        
        // Online suppliers
        db.select({
          count: sql<string>`COUNT(*)`
        }).from(users)
          .innerJoin(supplierProfiles, sql`${supplierProfiles.userId} = ${users.id}`)
          .where(sql`${users.isOnline} = true AND ${users.role} = 'supplier'`),
        
        // Active orders (not delivered/cancelled)
        db.select({
          count: sql<string>`COUNT(*)`
        }).from(orders).where(sql`${orders.status} NOT IN ('delivered', 'cancelled')`)
      ]);

      // Calculate commission (assuming 5% commission rate)
      const totalRevenue = parseFloat(totalRevenueResult[0]?.total || '0');
      const totalCommission = totalRevenue * 0.05;

      // Fetch trends data for the last 7 days
      const trendsData = await db.select({
        date: sql<string>`DATE(${orders.createdAt})`,
        revenue: sql<string>`COALESCE(SUM(${orders.totalAmount}), 0)`,
        orders: sql<string>`COUNT(${orders.id})`,
        suppliers: sql<string>`COUNT(DISTINCT ${orders.supplierId})`,
        products: sql<string>`COUNT(DISTINCT ${orders.productId})`
      })
      .from(orders)
      .where(sql`${orders.createdAt} >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}`)
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`);

      // Calculate percentage changes (simplified - comparing to previous period)
      const previousPeriodStart = new Date();
      previousPeriodStart.setDate(previousPeriodStart.getDate() - (daysBack * 2));
      previousPeriodStart.setDate(previousPeriodStart.getDate() + daysBack);

      const [previousRevenue, previousOrders, previousSuppliers, previousProducts] = await Promise.all([
        db.select({
          total: sql<string>`COALESCE(SUM(${orders.totalAmount}), 0)`
        }).from(orders).where(sql`${orders.createdAt} >= ${previousPeriodStart} AND ${orders.createdAt} < ${startDate}`),
        
        db.select({
          count: sql<string>`COUNT(*)`
        }).from(orders).where(sql`${orders.createdAt} >= ${previousPeriodStart} AND ${orders.createdAt} < ${startDate}`),
        
        db.select({
          count: sql<string>`COUNT(DISTINCT ${supplierProfiles.id})`
        }).from(supplierProfiles).where(sql`${supplierProfiles.createdAt} >= ${previousPeriodStart} AND ${supplierProfiles.createdAt} < ${startDate}`),
        
        db.select({
          count: sql<string>`COUNT(*)`
        }).from(products).where(sql`${products.createdAt} >= ${previousPeriodStart} AND ${products.createdAt} < ${startDate}`)
      ]);

      const prevRevenue = parseFloat(previousRevenue[0]?.total || '0');
      const prevOrders = parseInt(previousOrders[0]?.count || '0');
      const prevSuppliers = parseInt(previousSuppliers[0]?.count || '0');
      const prevProducts = parseInt(previousProducts[0]?.count || '0');

      const calculateChangePercent = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      const metrics = {
        kpis: {
          totalRevenue: Math.round(totalRevenue),
          totalCommission: Math.round(totalCommission),
          activeSuppliers: parseInt(activeSuppliersResult[0]?.count || '0'),
          totalSuppliers: parseInt(totalSuppliersResult[0]?.count || '0'),
          pendingApprovals: parseInt(pendingApprovalsResult[0]?.count || '0'),
          totalProducts: parseInt(totalProductsResult[0]?.count || '0'),
          approvedProducts: parseInt(approvedProductsResult[0]?.count || '0'),
          totalOrders: parseInt(totalOrdersResult[0]?.count || '0'),
          averageSupplierRating: 4.2, // TODO: Calculate from actual reviews
          averageResponseRate: 87.5, // TODO: Calculate from actual inquiry response data
        },
        realTimeMetrics: {
          onlineSuppliers: parseInt(onlineSuppliersResult[0]?.count || '0'),
          activeOrders: parseInt(activeOrdersResult[0]?.count || '0'),
          systemLoad: 45.2, // TODO: Implement actual system monitoring
          errorRate: 0.8, // TODO: Implement actual error tracking
          responseTime: 180, // TODO: Implement actual response time monitoring
        },
        trends: trendsData.map(trend => ({
          date: trend.date,
          revenue: parseFloat(trend.revenue),
          orders: parseInt(trend.orders),
          suppliers: parseInt(trend.suppliers),
          products: parseInt(trend.products)
        })),
        comparisons: {
          revenue: { changePercent: Math.round(calculateChangePercent(totalRevenue, prevRevenue) * 10) / 10 },
          orders: { changePercent: Math.round(calculateChangePercent(parseInt(totalOrdersResult[0]?.count || '0'), prevOrders) * 10) / 10 },
          suppliers: { changePercent: Math.round(calculateChangePercent(parseInt(activeSuppliersResult[0]?.count || '0'), prevSuppliers) * 10) / 10 },
          products: { changePercent: Math.round(calculateChangePercent(parseInt(totalProductsResult[0]?.count || '0'), prevProducts) * 10) / 10 },
        },
        alerts: {
          critical: 0, // TODO: Implement actual alert system
          warnings: 0, // TODO: Implement actual alert system
          total: 0,
          recent: [], // TODO: Implement actual alert system
        },
        systemHealth: {
          status: 'healthy' as const,
          uptime: 99.8, // TODO: Implement actual uptime monitoring
          lastUpdated: new Date(),
        },
      };

      res.json({
        success: true,
        metrics,
        timeRange,
        generatedAt: new Date(),
      });

    } catch (error: any) {
      console.error('Error in direct comprehensive dashboard metrics:', error);
      res.status(500).json({ 
        error: 'Failed to fetch dashboard metrics',
        details: error.message 
      });
    }
  });

  app.get('/api/admin/dashboard/metrics-public', async (req, res) => {
    try {
      console.log('📊 Direct dashboard metrics endpoint hit');

      if (!db) {
        return res.status(500).json({ error: 'Database connection not available' });
      }

      const timeRange = req.query.timeRange as string || '30d';
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Fetch real KPI data from database (same as comprehensive metrics)
      const [
        totalRevenueResult,
        totalSuppliersResult,
        activeSuppliersResult,
        pendingApprovalsResult,
        totalProductsResult,
        approvedProductsResult,
        totalOrdersResult,
        onlineSuppliersResult,
        activeOrdersResult
      ] = await Promise.all([
        db.select({
          total: sql<string>`COALESCE(SUM(${orders.totalAmount}), 0)`
        }).from(orders).where(sql`${orders.createdAt} >= ${startDate}`),
        
        db.select({
          count: sql<string>`COUNT(*)`
        }).from(supplierProfiles),
        
        db.select({
          count: sql<string>`COUNT(DISTINCT ${supplierProfiles.id})`
        }).from(supplierProfiles)
          .innerJoin(products, sql`${products.supplierId} = ${supplierProfiles.id}`)
          .where(sql`${supplierProfiles.isActive} = true AND ${products.isApproved} = true`),
        
        db.select({
          count: sql<string>`COUNT(*)`
        }).from(products).where(sql`${products.status} = 'pending_approval'`),
        
        db.select({
          count: sql<string>`COUNT(*)`
        }).from(products),
        
        db.select({
          count: sql<string>`COUNT(*)`
        }).from(products).where(sql`${products.isApproved} = true`),
        
        db.select({
          count: sql<string>`COUNT(*)`
        }).from(orders).where(sql`${orders.createdAt} >= ${startDate}`),
        
        db.select({
          count: sql<string>`COUNT(*)`
        }).from(users)
          .innerJoin(supplierProfiles, sql`${supplierProfiles.userId} = ${users.id}`)
          .where(sql`${users.isOnline} = true AND ${users.role} = 'supplier'`),
        
        db.select({
          count: sql<string>`COUNT(*)`
        }).from(orders).where(sql`${orders.status} NOT IN ('delivered', 'cancelled')`)
      ]);

      const totalRevenue = parseFloat(totalRevenueResult[0]?.total || '0');
      const totalCommission = totalRevenue * 0.05;

      // Fetch trends data
      const trendsData = await db.select({
        date: sql<string>`DATE(${orders.createdAt})`,
        revenue: sql<string>`COALESCE(SUM(${orders.totalAmount}), 0)`,
        orders: sql<string>`COUNT(${orders.id})`,
        suppliers: sql<string>`COUNT(DISTINCT ${orders.supplierId})`,
        products: sql<string>`COUNT(DISTINCT ${orders.productId})`
      })
      .from(orders)
      .where(sql`${orders.createdAt} >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}`)
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`);

      const metrics = {
        kpis: {
          totalRevenue: Math.round(totalRevenue),
          totalCommission: Math.round(totalCommission),
          activeSuppliers: parseInt(activeSuppliersResult[0]?.count || '0'),
          totalSuppliers: parseInt(totalSuppliersResult[0]?.count || '0'),
          pendingApprovals: parseInt(pendingApprovalsResult[0]?.count || '0'),
          totalProducts: parseInt(totalProductsResult[0]?.count || '0'),
          approvedProducts: parseInt(approvedProductsResult[0]?.count || '0'),
          totalOrders: parseInt(totalOrdersResult[0]?.count || '0'),
          averageSupplierRating: 4.2, // TODO: Calculate from actual reviews
          averageResponseRate: 87.5, // TODO: Calculate from actual inquiry response data
        },
        realTimeMetrics: {
          onlineSuppliers: parseInt(onlineSuppliersResult[0]?.count || '0'),
          activeOrders: parseInt(activeOrdersResult[0]?.count || '0'),
          systemLoad: 45.2, // TODO: Implement actual system monitoring
          errorRate: 0.8, // TODO: Implement actual error tracking
          responseTime: 180, // TODO: Implement actual response time monitoring
        },
        trends: trendsData.map(trend => ({
          date: trend.date,
          revenue: parseFloat(trend.revenue),
          orders: parseInt(trend.orders),
          suppliers: parseInt(trend.suppliers),
          products: parseInt(trend.products)
        })),
        comparisons: {
          revenue: { changePercent: 0 }, // Simplified for public endpoint
          orders: { changePercent: 0 },
          suppliers: { changePercent: 0 },
          products: { changePercent: 0 },
        },
        alerts: {
          critical: 0,
          warnings: 0,
          total: 0,
          recent: [],
        },
        systemHealth: {
          status: 'healthy' as const,
          uptime: 99.8,
          lastUpdated: new Date(),
        },
      };

      res.json({
        success: true,
        metrics,
        timeRange,
        generatedAt: new Date(),
      });

    } catch (error: any) {
      console.error('Error in direct dashboard metrics:', error);
      res.status(500).json({ 
        error: 'Failed to fetch dashboard metrics',
        details: error.message 
      });
    }
  });

  app.use('/api/admin', adminOversightRoutes);

  // ==================== COMMISSION ROUTES ====================

  app.use('/api/commission', commissionRoutes);

  // ==================== PAYOUT ROUTES ====================

  app.use('/api/payouts', payoutRoutes);

  // ==================== VERIFICATION ROUTES ====================

  app.use('/api/verification', verificationRoutes);

  // ==================== CONTENT MODERATION ROUTES ====================

  app.use('/api/admin/moderation', contentModerationRoutes);

  // ==================== SYSTEM MONITORING ROUTES ====================

  app.use('/api/admin/monitoring', systemMonitoringRoutes);

  // ==================== AUTOMATED ALERTING ROUTES ====================

  app.use('/api/admin/monitoring', automatedAlertingRoutes);

  // ==================== PLATFORM ANALYTICS ROUTES ====================

  // app.use('/api/admin/analytics/platform', platformAnalyticsRoutes);

  // ==================== REPORT MANAGEMENT ROUTES ====================

  app.use('/api/admin/reports', reportRoutes);

  // ==================== PLATFORM SETTINGS ROUTES ====================

  app.use('/api/admin/settings', platformSettingsRoutes);

  // ==================== ADMIN ACCESS CONTROL ROUTES ====================

  // Add security monitoring middleware for all admin routes
  app.use('/api/admin', loadAdminUserMiddleware, securityMonitoringMiddleware);
  
  // Admin access control and permission management
  app.use('/api/admin/access', adminAccessControlRoutes);

  // ==================== SECURITY MONITORING ROUTES ====================

  // Security monitoring and threat detection
  app.use('/api/admin/security', securityMonitoringRoutes);

  // ==================== COMMUNICATION AND NOTIFICATION ROUTES ====================

  // Communication and notification management
  app.use('/api/admin/communications', communicationRoutes);

  // ==================== COMPLIANCE AND AUDIT MANAGEMENT ROUTES ====================

  // Compliance and audit management
  app.use('/api/admin/compliance', complianceAuditRoutes);

  // ==================== SUPPLIER DISCOVERY ROUTES ====================

  // GET /api/suppliers - Public supplier directory with advanced filtering
  app.get("/api/suppliers", async (req, res) => {
    try {
      const {
        search,
        country,
        businessType,
        verificationLevel,
        membershipTier,
        minRating,
        minProducts,
        maxProducts,
        minResponseRate,
        verifiedOnly,
        tradeAssurance,
        limit = "20",
        offset = "0",
        sortBy = "rating",
        sortOrder = "desc"
      } = req.query;

      // Build query conditions
      const conditions = [];

      // Only show approved and active suppliers
      conditions.push(eq(supplierProfiles.status, 'approved'));
      conditions.push(eq(supplierProfiles.isActive, true));

      // Apply filters
      if (country) {
        conditions.push(eq(supplierProfiles.country, country as string));
      }
      if (businessType) {
        conditions.push(eq(supplierProfiles.businessType, businessType as string));
      }
      if (verificationLevel) {
        conditions.push(eq(supplierProfiles.verificationLevel, verificationLevel as string));
      }
      if (membershipTier) {
        conditions.push(eq(supplierProfiles.membershipTier, membershipTier as string));
      }
      if (minRating) {
        conditions.push(sql`${supplierProfiles.rating} >= ${parseFloat(minRating as string)}`);
      }
      if (minProducts) {
        conditions.push(sql`${supplierProfiles.totalProducts} >= ${parseInt(minProducts as string)}`);
      }
      if (maxProducts) {
        conditions.push(sql`${supplierProfiles.totalProducts} <= ${parseInt(maxProducts as string)}`);
      }
      if (minResponseRate) {
        conditions.push(sql`${supplierProfiles.responseRate} >= ${parseFloat(minResponseRate as string)}`);
      }
      if (verifiedOnly === 'true') {
        conditions.push(eq(supplierProfiles.isVerified, true));
      }
      if (tradeAssurance === 'true') {
        conditions.push(eq(supplierProfiles.verificationLevel, 'trade_assurance'));
      }

      let query = db.select({
        id: supplierProfiles.id,
        businessName: supplierProfiles.businessName,
        storeName: supplierProfiles.storeName,
        storeSlug: supplierProfiles.storeSlug,
        storeDescription: supplierProfiles.storeDescription,
        storeLogo: supplierProfiles.storeLogo,
        businessType: supplierProfiles.businessType,
        city: supplierProfiles.city,
        country: supplierProfiles.country,
        yearEstablished: supplierProfiles.yearEstablished,
        mainProducts: supplierProfiles.mainProducts,
        verificationLevel: supplierProfiles.verificationLevel,
        isVerified: supplierProfiles.isVerified,
        membershipTier: supplierProfiles.membershipTier,
        rating: supplierProfiles.rating,
        totalReviews: supplierProfiles.totalReviews,
        responseRate: supplierProfiles.responseRate,
        responseTime: supplierProfiles.responseTime,
        totalProducts: supplierProfiles.totalProducts,
        storeViews: supplierProfiles.storeViews,
        followers: supplierProfiles.followers,
        totalSales: supplierProfiles.totalSales,
        totalOrders: supplierProfiles.totalOrders,
        createdAt: supplierProfiles.createdAt
      })
        .from(supplierProfiles);

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Add search filter
      if (search) {
        const searchPattern = `%${search}%`;
        query = query.where(and(
          ...conditions,
          or(
            ilike(supplierProfiles.storeName, searchPattern),
            ilike(supplierProfiles.businessName, searchPattern),
            sql`EXISTS (
              SELECT 1 FROM unnest(${supplierProfiles.mainProducts}) AS product 
              WHERE product ILIKE ${searchPattern}
            )`
          )
        ));
      }

      // Add sorting
      const validSortFields = ['relevance', 'rating', 'reviews', 'products', 'followers', 'newest', 'response_rate'];
      const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'relevance';

      if (sortField === 'relevance') {
        // Default relevance sorting: verified first, then by rating and reviews
        query = query.orderBy(
          desc(supplierProfiles.isVerified),
          desc(supplierProfiles.rating),
          desc(supplierProfiles.totalReviews)
        );
      } else if (sortField === 'rating') {
        query = query.orderBy(desc(supplierProfiles.rating), desc(supplierProfiles.totalReviews));
      } else if (sortField === 'reviews') {
        query = query.orderBy(desc(supplierProfiles.totalReviews));
      } else if (sortField === 'products') {
        query = query.orderBy(desc(supplierProfiles.totalProducts));
      } else if (sortField === 'followers') {
        query = query.orderBy(desc(supplierProfiles.followers));
      } else if (sortField === 'newest') {
        query = query.orderBy(desc(supplierProfiles.createdAt));
      } else if (sortField === 'response_rate') {
        query = query.orderBy(desc(supplierProfiles.responseRate));
      }

      // Add pagination
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);

      query = query.limit(limitNum).offset(offsetNum);

      const result = await query;

      // Get total count for pagination
      let countQuery = db.select({ count: sql`count(*)` })
        .from(supplierProfiles);

      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }

      if (search) {
        const searchPattern = `%${search}%`;
        countQuery = countQuery.where(and(
          ...conditions,
          or(
            ilike(supplierProfiles.storeName, searchPattern),
            ilike(supplierProfiles.businessName, searchPattern),
            sql`EXISTS (
              SELECT 1 FROM unnest(${supplierProfiles.mainProducts}) AS product 
              WHERE product ILIKE ${searchPattern}
            )`
          )
        ));
      }

      const [{ count }] = await countQuery;
      const total = parseInt(count as string);

      console.log(`📊 Supplier Directory API: Returning ${result.length} suppliers with total count: ${total}`);

      res.json({
        suppliers: result,
        total,
        page: Math.floor(offsetNum / limitNum) + 1,
        limit: limitNum,
        hasMore: offsetNum + limitNum < total
      });
    } catch (error: any) {
      console.error('Get suppliers directory error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/suppliers/:id/profile - Get detailed supplier profile for comparison
  app.get("/api/suppliers/:id/profile", async (req, res) => {
    try {
      const supplierId = req.params.id;

      const supplierResult = await db.select({
        id: supplierProfiles.id,
        businessName: supplierProfiles.businessName,
        storeName: supplierProfiles.storeName,
        storeSlug: supplierProfiles.storeSlug,
        storeDescription: supplierProfiles.storeDescription,
        storeLogo: supplierProfiles.storeLogo,
        storeBanner: supplierProfiles.storeBanner,
        businessType: supplierProfiles.businessType,
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
        isVerified: supplierProfiles.isVerified,
        verifiedAt: supplierProfiles.verifiedAt,
        membershipTier: supplierProfiles.membershipTier,
        rating: supplierProfiles.rating,
        totalReviews: supplierProfiles.totalReviews,
        responseRate: supplierProfiles.responseRate,
        responseTime: supplierProfiles.responseTime,
        totalProducts: supplierProfiles.totalProducts,
        totalInquiries: supplierProfiles.totalInquiries,
        storeViews: supplierProfiles.storeViews,
        followers: supplierProfiles.followers,
        totalSales: supplierProfiles.totalSales,
        totalOrders: supplierProfiles.totalOrders,
        createdAt: supplierProfiles.createdAt
      })
        .from(supplierProfiles)
        .where(and(
          eq(supplierProfiles.id, supplierId),
          eq(supplierProfiles.status, 'approved'),
          eq(supplierProfiles.isActive, true)
        ))
        .limit(1);

      if (supplierResult.length === 0) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      const supplier = supplierResult[0];

      // Increment store views
      await db.update(supplierProfiles)
        .set({
          storeViews: sql`${supplierProfiles.storeViews} + 1`,
          updatedAt: new Date()
        })
        .where(eq(supplierProfiles.id, supplierId));

      res.json(supplier);
    } catch (error: any) {
      console.error('Get supplier profile error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/suppliers/:id/products - Get supplier's products for comparison
  app.get("/api/suppliers/:id/products", async (req, res) => {
    try {
      const supplierId = req.params.id;
      const { limit = "10", offset = "0", categoryId } = req.query;

      // Verify supplier exists and is active
      const supplierExists = await db.select({ id: supplierProfiles.id })
        .from(supplierProfiles)
        .where(and(
          eq(supplierProfiles.id, supplierId),
          eq(supplierProfiles.status, 'approved'),
          eq(supplierProfiles.isActive, true)
        ))
        .limit(1);

      if (supplierExists.length === 0) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      const conditions = [
        eq(products.supplierId, supplierId),
        eq(products.isApproved, true),
        eq(products.isPublished, true)
      ];

      if (categoryId) {
        conditions.push(eq(products.categoryId, categoryId as string));
      }

      const productsResult = await db.select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        shortDescription: products.shortDescription,
        images: products.images,
        minOrderQuantity: products.minOrderQuantity,
        priceRanges: products.priceRanges,
        sampleAvailable: products.sampleAvailable,
        samplePrice: products.samplePrice,
        leadTime: products.leadTime,
        views: products.views,
        inquiries: products.inquiries,
        isFeatured: products.isFeatured,
        createdAt: products.createdAt,
        categoryName: categories.name
      })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(and(...conditions))
        .orderBy(desc(products.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      // Get total count
      const [{ count }] = await db.select({ count: sql`count(*)` })
        .from(products)
        .where(and(...conditions));

      const total = parseInt(count as string);

      res.json({
        products: productsResult,
        total,
        page: Math.floor(parseInt(offset as string) / parseInt(limit as string)) + 1,
        limit: parseInt(limit as string)
      });
    } catch (error: any) {
      console.error('Get supplier products error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/suppliers/search/suggestions - Get search suggestions for autocomplete
  app.get("/api/suppliers/search/suggestions", async (req, res) => {
    try {
      const { q } = req.query;

      if (!q || (q as string).length < 2) {
        return res.json({ suggestions: [] });
      }

      const searchPattern = `%${q}%`;

      // Get supplier name suggestions
      const supplierSuggestions = await db.select({
        type: sql`'supplier'`,
        value: supplierProfiles.storeName,
        label: supplierProfiles.storeName,
        meta: supplierProfiles.businessName
      })
        .from(supplierProfiles)
        .where(and(
          eq(supplierProfiles.status, 'approved'),
          eq(supplierProfiles.isActive, true),
          or(
            ilike(supplierProfiles.storeName, searchPattern),
            ilike(supplierProfiles.businessName, searchPattern)
          )
        ))
        .limit(5);

      // Get product suggestions from main products
      const productSuggestions = await db.select({
        type: sql`'product'`,
        value: sql`unnest(${supplierProfiles.mainProducts})`,
        label: sql`unnest(${supplierProfiles.mainProducts})`,
        meta: sql`'Product category'`
      })
        .from(supplierProfiles)
        .where(and(
          eq(supplierProfiles.status, 'approved'),
          eq(supplierProfiles.isActive, true),
          sql`EXISTS (
          SELECT 1 FROM unnest(${supplierProfiles.mainProducts}) AS product 
          WHERE product ILIKE ${searchPattern}
        )`
        ))
        .limit(5);

      const allSuggestions = [...supplierSuggestions, ...productSuggestions];

      res.json({ suggestions: allSuggestions });
    } catch (error: any) {
      console.error('Get search suggestions error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/suppliers/filters/options - Get available filter options
  app.get("/api/suppliers/filters/options", async (req, res) => {
    try {
      // Get unique countries
      const countries = await db.selectDistinct({
        value: supplierProfiles.country,
        label: supplierProfiles.country,
        count: sql`count(*)`
      })
        .from(supplierProfiles)
        .where(and(
          eq(supplierProfiles.status, 'approved'),
          eq(supplierProfiles.isActive, true)
        ))
        .groupBy(supplierProfiles.country)
        .orderBy(desc(sql`count(*)`));

      // Get business types
      const businessTypes = await db.selectDistinct({
        value: supplierProfiles.businessType,
        label: supplierProfiles.businessType,
        count: sql`count(*)`
      })
        .from(supplierProfiles)
        .where(and(
          eq(supplierProfiles.status, 'approved'),
          eq(supplierProfiles.isActive, true)
        ))
        .groupBy(supplierProfiles.businessType)
        .orderBy(desc(sql`count(*)`));

      // Get verification levels
      const verificationLevels = await db.selectDistinct({
        value: supplierProfiles.verificationLevel,
        label: supplierProfiles.verificationLevel,
        count: sql`count(*)`
      })
        .from(supplierProfiles)
        .where(and(
          eq(supplierProfiles.status, 'approved'),
          eq(supplierProfiles.isActive, true)
        ))
        .groupBy(supplierProfiles.verificationLevel)
        .orderBy(desc(sql`count(*)`));

      // Get membership tiers
      const membershipTiers = await db.selectDistinct({
        value: supplierProfiles.membershipTier,
        label: supplierProfiles.membershipTier,
        count: sql`count(*)`
      })
        .from(supplierProfiles)
        .where(and(
          eq(supplierProfiles.status, 'approved'),
          eq(supplierProfiles.isActive, true)
        ))
        .groupBy(supplierProfiles.membershipTier)
        .orderBy(desc(sql`count(*)`));

      res.json({
        countries,
        businessTypes,
        verificationLevels,
        membershipTiers
      });
    } catch (error: any) {
      console.error('Get filter options error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/suppliers/:id/follow - Follow/unfollow a supplier
  app.post("/api/suppliers/:id/follow", authMiddleware, async (req, res) => {
    try {
      const supplierId = req.params.id;
      const userId = req.user!.id;

      // Check if supplier exists and is active
      const supplierExists = await db.select({ id: supplierProfiles.id })
        .from(supplierProfiles)
        .where(and(
          eq(supplierProfiles.id, supplierId),
          eq(supplierProfiles.status, 'approved'),
          eq(supplierProfiles.isActive, true)
        ))
        .limit(1);

      if (supplierExists.length === 0) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      // Check if already following
      const existingFavorite = await db.select({ id: favorites.id })
        .from(favorites)
        .where(and(
          eq(favorites.userId, userId),
          eq(favorites.itemId, supplierId),
          eq(favorites.itemType, 'supplier')
        ))
        .limit(1);

      if (existingFavorite.length > 0) {
        // Unfollow - remove from favorites
        await db.delete(favorites)
          .where(and(
            eq(favorites.userId, userId),
            eq(favorites.itemId, supplierId),
            eq(favorites.itemType, 'supplier')
          ));

        // Decrement follower count
        await db.update(supplierProfiles)
          .set({
            followers: sql`GREATEST(${supplierProfiles.followers} - 1, 0)`,
            updatedAt: new Date()
          })
          .where(eq(supplierProfiles.id, supplierId));

        res.json({ following: false, message: "Supplier unfollowed successfully" });
      } else {
        // Follow - add to favorites
        await db.insert(favorites).values({
          userId,
          itemId: supplierId,
          itemType: 'supplier'
        });

        // Increment follower count
        await db.update(supplierProfiles)
          .set({
            followers: sql`${supplierProfiles.followers} + 1`,
            updatedAt: new Date()
          })
          .where(eq(supplierProfiles.id, supplierId));

        res.json({ following: true, message: "Supplier followed successfully" });
      }
    } catch (error: any) {
      console.error('Follow supplier error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/suppliers/followed - Get user's followed suppliers
  app.get("/api/suppliers/followed", authMiddleware, async (req, res) => {
    try {
      const userId = req.user!.id;

      const followedSuppliers = await db.select({
        id: supplierProfiles.id,
        businessName: supplierProfiles.businessName,
        storeName: supplierProfiles.storeName,
        storeSlug: supplierProfiles.storeSlug,
        storeLogo: supplierProfiles.storeLogo,
        city: supplierProfiles.city,
        country: supplierProfiles.country,
        verificationLevel: supplierProfiles.verificationLevel,
        isVerified: supplierProfiles.isVerified,
        membershipTier: supplierProfiles.membershipTier,
        rating: supplierProfiles.rating,
        totalReviews: supplierProfiles.totalReviews,
        totalProducts: supplierProfiles.totalProducts,
        followedAt: favorites.createdAt
      })
        .from(favorites)
        .innerJoin(supplierProfiles, eq(favorites.itemId, supplierProfiles.id))
        .where(and(
          eq(favorites.userId, userId),
          eq(favorites.itemType, 'supplier'),
          eq(supplierProfiles.status, 'approved'),
          eq(supplierProfiles.isActive, true)
        ))
        .orderBy(desc(favorites.createdAt));

      res.json({ suppliers: followedSuppliers });
    } catch (error: any) {
      console.error('Get followed suppliers error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/suppliers/:id/following-status - Check if user is following a supplier
  app.get("/api/suppliers/:id/following-status", authMiddleware, async (req, res) => {
    try {
      const supplierId = req.params.id;
      const userId = req.user!.id;

      const isFollowing = await db.select({ id: favorites.id })
        .from(favorites)
        .where(and(
          eq(favorites.userId, userId),
          eq(favorites.itemId, supplierId),
          eq(favorites.itemType, 'supplier')
        ))
        .limit(1);

      res.json({ following: isFollowing.length > 0 });
    } catch (error: any) {
      console.error('Get following status error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/suppliers/recommendations - Get supplier recommendations based on buyer history
  app.get("/api/suppliers/recommendations", authMiddleware, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { limit = "5" } = req.query;

      // Get buyer's inquiry and order history to understand preferences
      const buyerInquiries = await db.select({
        productId: inquiries.productId,
        categoryId: products.categoryId
      })
        .from(inquiries)
        .leftJoin(products, eq(inquiries.productId, products.id))
        .where(eq(inquiries.buyerId, userId))
        .limit(50);

      const buyerOrders = await db.select({
        productId: orders.productId,
        categoryId: products.categoryId
      })
        .from(orders)
        .leftJoin(products, eq(orders.productId, products.id))
        .where(eq(orders.buyerId, userId))
        .limit(50);

      // Extract categories from buyer history
      const categoryIds = new Set([
        ...buyerInquiries.map(i => i.categoryId).filter(Boolean),
        ...buyerOrders.map(o => o.categoryId).filter(Boolean)
      ]);

      let recommendedSuppliers;

      if (categoryIds.size > 0) {
        // Recommend suppliers with products in buyer's preferred categories
        recommendedSuppliers = await db.select({
          id: supplierProfiles.id,
          businessName: supplierProfiles.businessName,
          storeName: supplierProfiles.storeName,
          storeSlug: supplierProfiles.storeSlug,
          storeLogo: supplierProfiles.storeLogo,
          businessType: supplierProfiles.businessType,
          city: supplierProfiles.city,
          country: supplierProfiles.country,
          verificationLevel: supplierProfiles.verificationLevel,
          isVerified: supplierProfiles.isVerified,
          membershipTier: supplierProfiles.membershipTier,
          rating: supplierProfiles.rating,
          totalReviews: supplierProfiles.totalReviews,
          responseRate: supplierProfiles.responseRate,
          totalProducts: supplierProfiles.totalProducts,
          relevanceScore: sql`COUNT(DISTINCT ${products.categoryId})`
        })
          .from(supplierProfiles)
          .innerJoin(products, eq(products.supplierId, supplierProfiles.id))
          .where(and(
            eq(supplierProfiles.status, 'approved'),
            eq(supplierProfiles.isActive, true),
            eq(products.isApproved, true),
            eq(products.isPublished, true),
            sql`${products.categoryId} = ANY(${Array.from(categoryIds)})`
          ))
          .groupBy(
            supplierProfiles.id,
            supplierProfiles.businessName,
            supplierProfiles.storeName,
            supplierProfiles.storeSlug,
            supplierProfiles.storeLogo,
            supplierProfiles.businessType,
            supplierProfiles.city,
            supplierProfiles.country,
            supplierProfiles.verificationLevel,
            supplierProfiles.isVerified,
            supplierProfiles.membershipTier,
            supplierProfiles.rating,
            supplierProfiles.totalReviews,
            supplierProfiles.responseRate,
            supplierProfiles.totalProducts
          )
          .orderBy(desc(sql`COUNT(DISTINCT ${products.categoryId})`), desc(supplierProfiles.rating))
          .limit(parseInt(limit as string));
      } else {
        // Fallback to top-rated suppliers
        recommendedSuppliers = await db.select({
          id: supplierProfiles.id,
          businessName: supplierProfiles.businessName,
          storeName: supplierProfiles.storeName,
          storeSlug: supplierProfiles.storeSlug,
          storeLogo: supplierProfiles.storeLogo,
          businessType: supplierProfiles.businessType,
          city: supplierProfiles.city,
          country: supplierProfiles.country,
          verificationLevel: supplierProfiles.verificationLevel,
          isVerified: supplierProfiles.isVerified,
          membershipTier: supplierProfiles.membershipTier,
          rating: supplierProfiles.rating,
          totalReviews: supplierProfiles.totalReviews,
          responseRate: supplierProfiles.responseRate,
          totalProducts: supplierProfiles.totalProducts,
          relevanceScore: sql`0`
        })
          .from(supplierProfiles)
          .where(and(
            eq(supplierProfiles.status, 'approved'),
            eq(supplierProfiles.isActive, true),
            gte(supplierProfiles.rating, 4.0)
          ))
          .orderBy(desc(supplierProfiles.rating), desc(supplierProfiles.totalReviews))
          .limit(parseInt(limit as string));
      }

      res.json({
        suppliers: recommendedSuppliers,
        basedOnHistory: categoryIds.size > 0
      });
    } catch (error: any) {
      console.error('Get supplier recommendations error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== LEGACY AUTHENTICATION (TO BE REMOVED) ====================

  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json({ error: "User already exists" });
      }

      const user = await storage.createUser(validatedData);

      // Don't send password back to client
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await storage.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Don't send password back to client
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== ANALYTICS ====================

  app.get("/api/analytics", async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/dashboard/buyer/:buyerId", async (req, res) => {
    try {
      const stats = await storage.getBuyerDashboardStats(req.params.buyerId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // ==================== USERS & AUTHENTICATION ====================

  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Don't send passwords to client
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      // Don't send password to client
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Don't send password to client
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/email/:email", async (req, res) => {
    try {
      const user = await storage.getUserByEmail(req.params.email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Don't send password to client
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const validatedData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, validatedData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Don't send password to client
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== BUYER PROFILES ====================

  app.get("/api/buyers/:userId", async (req, res) => {
    try {
      const profile = await storage.getBuyerProfile(req.params.userId);
      if (!profile) {
        return res.status(404).json({ error: "Buyer profile not found" });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/buyers", async (req, res) => {
    try {
      const validatedData = insertBuyerProfileSchema.parse(req.body);
      const profile = await storage.createBuyerProfile(validatedData);
      res.status(201).json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/buyers/:userId", async (req, res) => {
    try {
      const validatedData = insertBuyerProfileSchema.partial().parse(req.body);
      const profile = await storage.updateBuyerProfile(req.params.userId, validatedData);
      if (!profile) {
        return res.status(404).json({ error: "Buyer profile not found" });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });


  // ==================== PRODUCTS ====================

  app.get("/api/products", async (req, res) => {
    try {
      const { categoryId, search, isPublished, minMOQ, maxMOQ, featured, supplierId, limit, offset } = req.query;

      // Build query conditions
      const conditions = [];

      if (categoryId) {
        conditions.push(eq(products.categoryId, categoryId as string));
      }
      if (isPublished !== undefined) {
        conditions.push(eq(products.isPublished, isPublished === 'true'));
      }
      if (featured === 'true') {
        conditions.push(eq(products.isFeatured, true));
      }
      if (supplierId) {
        conditions.push(eq(products.supplierId, supplierId as string));
      }

      // For public API, only show approved products from active suppliers
      if (!supplierId) {
        conditions.push(eq(products.isApproved, true));
        conditions.push(eq(products.isPublished, true));
      }

      let query = db.select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        shortDescription: products.shortDescription,
        description: products.description,
        categoryId: products.categoryId,
        specifications: products.specifications,
        images: products.images,
        videos: products.videos,
        supplierId: products.supplierId,
        status: products.status,
        isApproved: products.isApproved,
        minOrderQuantity: products.minOrderQuantity,
        priceRanges: products.priceRanges,
        sampleAvailable: products.sampleAvailable,
        samplePrice: products.samplePrice,
        customizationAvailable: products.customizationAvailable,
        customizationDetails: products.customizationDetails,
        leadTime: products.leadTime,
        port: products.port,
        paymentTerms: products.paymentTerms,
        inStock: products.inStock,
        stockQuantity: products.stockQuantity,
        isPublished: products.isPublished,
        isFeatured: products.isFeatured,
        views: products.views,
        inquiries: products.inquiries,
        colors: products.colors,
        sizes: products.sizes,
        keyFeatures: products.keyFeatures,
        certifications: products.certifications,
        tags: products.tags,
        hasTradeAssurance: products.hasTradeAssurance,
        sku: products.sku,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        // Supplier information
        supplierBusinessName: supplierProfiles.businessName,
        supplierStoreName: supplierProfiles.storeName,
        supplierStoreSlug: supplierProfiles.storeSlug,
        supplierStoreLogo: supplierProfiles.storeLogo,
        supplierVerificationLevel: supplierProfiles.verificationLevel,
        supplierIsVerified: supplierProfiles.isVerified,
        supplierRating: supplierProfiles.rating,
        supplierResponseRate: supplierProfiles.responseRate,
        supplierMembershipTier: supplierProfiles.membershipTier,
        // Category information
        categoryName: categories.name
      })
        .from(products)
        .leftJoin(supplierProfiles, eq(products.supplierId, supplierProfiles.id))
        .leftJoin(categories, eq(products.categoryId, categories.id));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Add search filter
      if (search) {
        const searchPattern = `%${search}%`;
        query = query.where(and(
          ...conditions,
          or(
            ilike(products.name, searchPattern),
            ilike(products.description, searchPattern),
            ilike(products.shortDescription, searchPattern),
            ilike(supplierProfiles.businessName, searchPattern),
            ilike(supplierProfiles.storeName, searchPattern)
          )
        ));
      }

      // Add MOQ filters
      if (minMOQ) {
        query = query.where(and(...conditions, gte(products.minOrderQuantity, parseInt(minMOQ as string))));
      }
      if (maxMOQ) {
        query = query.where(and(...conditions, sql`${products.minOrderQuantity} <= ${parseInt(maxMOQ as string)}`));
      }

      // Add ordering
      query = query.orderBy(desc(products.createdAt));

      // Add pagination
      let hasLimit = false;
      let hasOffset = false;

      if (limit) {
        query = query.limit(parseInt(limit as string));
        hasLimit = true;
      }
      if (offset !== undefined) {
        query = query.offset(parseInt(offset as string));
        hasOffset = true;
      }

      const result = await query;

      // Get total count for pagination
      if (hasLimit || hasOffset) {
        let countQuery = db.select({ count: sql`count(*)` })
          .from(products)
          .leftJoin(supplierProfiles, eq(products.supplierId, supplierProfiles.id));

        if (conditions.length > 0) {
          countQuery = countQuery.where(and(...conditions));
        }

        if (search) {
          const searchPattern = `%${search}%`;
          countQuery = countQuery.where(and(
            ...conditions,
            or(
              ilike(products.name, searchPattern),
              ilike(products.description, searchPattern),
              ilike(products.shortDescription, searchPattern),
              ilike(supplierProfiles.businessName, searchPattern),
              ilike(supplierProfiles.storeName, searchPattern)
            )
          ));
        }

        const [{ count }] = await countQuery;
        const total = parseInt(count as string);

        console.log(`📊 Products API Response: Returning ${result.length} products with total count: ${total}`);

        res.json({
          products: result,
          total,
          page: offset ? Math.floor(parseInt(offset as string) / (parseInt(limit as string) || 20)) + 1 : 1,
          limit: limit ? parseInt(limit as string) : 20
        });
      } else {
        // No pagination parameters - return as array directly for backwards compatibility
        res.json(result);
      }
    } catch (error: any) {
      console.error('Get products error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      // Get product with supplier information
      const productResult = await db.select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        shortDescription: products.shortDescription,
        description: products.description,
        categoryId: products.categoryId,
        specifications: products.specifications,
        images: products.images,
        videos: products.videos,
        supplierId: products.supplierId,
        status: products.status,
        isApproved: products.isApproved,
        minOrderQuantity: products.minOrderQuantity,
        priceRanges: products.priceRanges,
        sampleAvailable: products.sampleAvailable,
        samplePrice: products.samplePrice,
        customizationAvailable: products.customizationAvailable,
        customizationDetails: products.customizationDetails,
        leadTime: products.leadTime,
        port: products.port,
        paymentTerms: products.paymentTerms,
        inStock: products.inStock,
        stockQuantity: products.stockQuantity,
        isPublished: products.isPublished,
        isFeatured: products.isFeatured,
        views: products.views,
        inquiries: products.inquiries,
        colors: products.colors,
        sizes: products.sizes,
        keyFeatures: products.keyFeatures,
        certifications: products.certifications,
        tags: products.tags,
        hasTradeAssurance: products.hasTradeAssurance,
        sku: products.sku,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        // Supplier information
        supplierBusinessName: supplierProfiles.businessName,
        supplierStoreName: supplierProfiles.storeName,
        supplierStoreSlug: supplierProfiles.storeSlug,
        supplierStoreLogo: supplierProfiles.storeLogo,
        supplierVerificationLevel: supplierProfiles.verificationLevel,
        supplierIsVerified: supplierProfiles.isVerified,
        supplierRating: supplierProfiles.rating,
        supplierResponseRate: supplierProfiles.responseRate,
        supplierMembershipTier: supplierProfiles.membershipTier,
        supplierPhone: supplierProfiles.phone,
        supplierWhatsapp: supplierProfiles.whatsapp,
        supplierCity: supplierProfiles.city,
        supplierCountry: supplierProfiles.country,
        // Category information
        categoryName: categories.name
      })
        .from(products)
        .leftJoin(supplierProfiles, eq(products.supplierId, supplierProfiles.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(products.id, req.params.id))
        .limit(1);

      if (productResult.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      const product = productResult[0];

      // Only show approved products to public (unless it's the supplier viewing their own product)
      if (!product.isApproved && !req.user) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Increment view count
      await storage.incrementProductViews(req.params.id);

      res.json(product);
    } catch (error: any) {
      console.error('Get product error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/products/slug/:slug", async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      // Increment view count
      await storage.incrementProductViews(product.id);
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Helper function to convert empty strings to null for decimal fields (returns string for database)
      const toDecimal = (value: any): string | null => {
        if (value === '' || value === null || value === undefined) return null;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed.toString();
      };

      const productData = { 
        ...req.body,
        samplePrice: toDecimal(req.body.samplePrice)
      };

      // Handle supplier attribution
      if (req.user.role === 'supplier') {
        // Get supplier profile
        const supplierResult = await db.select()
          .from(supplierProfiles)
          .where(eq(supplierProfiles.userId, req.user.id))
          .limit(1);

        if (supplierResult.length === 0) {
          return res.status(404).json({ error: "Supplier profile not found" });
        }

        const supplier = supplierResult[0];

        // Check if supplier is approved and active
        if (supplier.status !== 'approved' || !supplier.isActive) {
          return res.status(403).json({ error: "Supplier account must be approved and active to create products" });
        }

        // Set supplier attribution and approval workflow
        productData.supplierId = supplier.id;
        productData.status = 'pending_approval';
        productData.isApproved = false;
        productData.isPublished = false; // Will be published after approval
      } else if (req.user.role === 'admin') {
        // Admins can create products directly without approval
        productData.status = 'approved';
        productData.isApproved = true;
        productData.approvedAt = new Date();
        productData.approvedBy = req.user.id;
        // supplierId can be null for admin-created products (legacy behavior)
      } else {
        return res.status(403).json({ error: "Only suppliers and admins can create products" });
      }

      // Create validation schema that handles string-to-boolean conversion
      const productValidationSchema = insertProductSchema.extend({
        hasTradeAssurance: z.union([z.boolean(), z.string()]).transform(val => {
          if (typeof val === 'boolean') return val;
          if (typeof val === 'string') return val.toLowerCase() === 'true';
          return false;
        }),
        sampleAvailable: z.union([z.boolean(), z.string()]).transform(val => {
          if (typeof val === 'boolean') return val;
          if (typeof val === 'string') return val.toLowerCase() === 'true';
          return false;
        }),
        customizationAvailable: z.union([z.boolean(), z.string()]).transform(val => {
          if (typeof val === 'boolean') return val;
          if (typeof val === 'string') return val.toLowerCase() === 'true';
          return false;
        }),
        inStock: z.union([z.boolean(), z.string()]).transform(val => {
          if (typeof val === 'boolean') return val;
          if (typeof val === 'string') return val.toLowerCase() === 'true';
          return false;
        }),
        isPublished: z.union([z.boolean(), z.string()]).transform(val => {
          if (typeof val === 'boolean') return val;
          if (typeof val === 'string') return val.toLowerCase() === 'true';
          return false;
        }),
        isFeatured: z.union([z.boolean(), z.string()]).transform(val => {
          if (typeof val === 'boolean') return val;
          if (typeof val === 'string') return val.toLowerCase() === 'true';
          return false;
        }),
        isApproved: z.union([z.boolean(), z.string()]).transform(val => {
          if (typeof val === 'boolean') return val;
          if (typeof val === 'string') return val.toLowerCase() === 'true';
          return false;
        }),
        samplePrice: z.union([z.number(), z.string(), z.null()]).transform(val => {
          if (val === null || val === undefined || val === '') return null;
          if (typeof val === 'number') return val.toString();
          if (typeof val === 'string') {
            const parsed = parseFloat(val);
            return isNaN(parsed) ? null : parsed.toString();
          }
          return null;
        }).nullable()
      });
      
      const validatedData = productValidationSchema.parse(productData);
      const product = await storage.createProduct(validatedData);

      // Update supplier's product count if applicable
      if (productData.supplierId) {
        await db.update(supplierProfiles)
          .set({
            totalProducts: sql`${supplierProfiles.totalProducts} + 1`,
            updatedAt: new Date()
          })
          .where(eq(supplierProfiles.id, productData.supplierId));
      }

      res.status(201).json(product);
    } catch (error: any) {
      console.error('Create product error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Bulk update endpoint for publish/feature operations - MUST come before /:id routes
  app.patch("/api/products/bulk-update", async (req, res) => {
    try {
      const { productIds, productId, id, isPublished, isFeatured } = req.body;
      // Normalize to an array to support single or multiple ids
      const normalizedIds = Array.isArray(productIds)
        ? productIds
        : (productIds ? [productIds] : (productId ? [productId] : (id ? [id] : [])));

      if (!Array.isArray(normalizedIds) || normalizedIds.length === 0) {
        return res.status(400).json({ error: "productIds must be a non-empty array" });
      }

      const updates: any = {};
      if (isPublished !== undefined) {
        updates.isPublished = isPublished;
      }
      if (isFeatured !== undefined) {
        updates.isFeatured = isFeatured;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid update fields provided" });
      }

      const updatedProducts = [];

      for (const productId of normalizedIds) {
        try {
          const product = await storage.updateProduct(productId, updates);

          if (product) {
            updatedProducts.push(product);
          }
        } catch (error) {
          console.error(`Failed to update product ${productId}:`, error);
        }
      }

      res.json({
        message: `Updated ${updatedProducts.length} products successfully`,
        updatedProducts
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk delete endpoint - MUST come before /:id routes
  app.delete("/api/products/bulk-delete", async (req, res) => {
    try {
      const { productIds, productId, id } = req.body;
      const normalizedIds = Array.isArray(productIds)
        ? productIds
        : (productIds ? [productIds] : (productId ? [productId] : (id ? [id] : [])));

      if (!Array.isArray(normalizedIds) || normalizedIds.length === 0) {
        return res.status(400).json({ error: "productIds must be a non-empty array" });
      }

      const deletedProducts = [];

      for (const productId of normalizedIds) {
        try {
          const success = await storage.deleteProduct(productId);
          if (success) {
            deletedProducts.push(productId);
          }
        } catch (error) {
          console.error(`Failed to delete product ${productId}:`, error);
        }
      }

      res.json({
        message: `Deleted ${deletedProducts.length} products successfully`,
        deletedProducts
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/products/:id", async (req, res) => {
    try {
      // Create validation schema that handles string-to-boolean conversion
      const productValidationSchema = insertProductSchema.extend({
        hasTradeAssurance: z.union([z.boolean(), z.string()]).transform(val => {
          if (typeof val === 'boolean') return val;
          if (typeof val === 'string') return val.toLowerCase() === 'true';
          return false;
        }),
        sampleAvailable: z.union([z.boolean(), z.string()]).transform(val => {
          if (typeof val === 'boolean') return val;
          if (typeof val === 'string') return val.toLowerCase() === 'true';
          return false;
        }),
        customizationAvailable: z.union([z.boolean(), z.string()]).transform(val => {
          if (typeof val === 'boolean') return val;
          if (typeof val === 'string') return val.toLowerCase() === 'true';
          return false;
        }),
        inStock: z.union([z.boolean(), z.string()]).transform(val => {
          if (typeof val === 'boolean') return val;
          if (typeof val === 'string') return val.toLowerCase() === 'true';
          return false;
        }),
        isPublished: z.union([z.boolean(), z.string()]).transform(val => {
          if (typeof val === 'boolean') return val;
          if (typeof val === 'string') return val.toLowerCase() === 'true';
          return false;
        }),
        isFeatured: z.union([z.boolean(), z.string()]).transform(val => {
          if (typeof val === 'boolean') return val;
          if (typeof val === 'string') return val.toLowerCase() === 'true';
          return false;
        }),
        isApproved: z.union([z.boolean(), z.string()]).transform(val => {
          if (typeof val === 'boolean') return val;
          if (typeof val === 'string') return val.toLowerCase() === 'true';
          return false;
        }),
        samplePrice: z.union([z.number(), z.string(), z.null()]).transform(val => {
          if (val === null || val === undefined || val === '') return null;
          if (typeof val === 'number') return val.toString();
          if (typeof val === 'string') {
            const parsed = parseFloat(val);
            return isNaN(parsed) ? null : parsed.toString();
          }
          return null;
        }).nullable()
      });
      
      const validatedData = productValidationSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, validatedData);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Individual stock update endpoint
  app.patch("/api/products/:id/stock", async (req, res) => {
    try {
      const { stockQuantity } = req.body;

      if (typeof stockQuantity !== 'number' || stockQuantity < 0) {
        return res.status(400).json({ error: "Invalid stock quantity. Must be a non-negative number." });
      }

      const product = await storage.updateProduct(req.params.id, {
        stockQuantity,
        inStock: stockQuantity > 0
      });

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk stock update endpoint
  app.patch("/api/products/bulk-stock-update", async (req, res) => {
    try {
      const { productIds, stockQuantity } = req.body;

      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ error: "productIds must be a non-empty array" });
      }

      if (typeof stockQuantity !== 'number' || stockQuantity < 0) {
        return res.status(400).json({ error: "Invalid stock quantity. Must be a non-negative number." });
      }

      const updatedProducts = [];

      for (const productId of productIds) {
        try {
          const product = await storage.updateProduct(productId, {
            stockQuantity,
            inStock: stockQuantity > 0
          });

          if (product) {
            updatedProducts.push(product);
          }
        } catch (error) {
          console.error(`Failed to update product ${productId}:`, error);
        }
      }

      res.json({
        message: `Updated ${updatedProducts.length} products successfully`,
        updatedProducts
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Inventory analytics endpoint
  app.get("/api/products/inventory/analytics", async (req, res) => {
    try {
      const products = await storage.getProducts();

      const analytics = {
        totalProducts: products.length,
        inStock: products.filter(p => p.inStock && (p.stockQuantity || 0) > 0).length,
        lowStock: products.filter(p => p.inStock && (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) < 10).length,
        outOfStock: products.filter(p => !p.inStock || (p.stockQuantity || 0) === 0).length,
        totalValue: products.reduce((sum, p) => {
          const price = Array.isArray(p.priceRanges) && p.priceRanges.length > 0
            ? p.priceRanges[0].pricePerUnit || 0
            : 0;
          return sum + (price * (p.stockQuantity || 0));
        }, 0),
        lowStockProducts: products.filter(p => p.inStock && (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) < 10),
        outOfStockProducts: products.filter(p => !p.inStock || (p.stockQuantity || 0) === 0)
      };

      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk product upload
  app.post("/api/products/bulk", async (req, res) => {
    try {
      const { products } = req.body;
      if (!Array.isArray(products)) {
        return res.status(400).json({ error: "Products must be an array" });
      }

      // Helper function to convert empty strings to null for decimal fields (returns string for database)
      const toDecimal = (value: any): string | null => {
        if (value === '' || value === null || value === undefined) return null;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed.toString();
      };

      const validatedProducts = [];
      const errors = [];

      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        try {
          const images = p.images ? (typeof p.images === 'string' ? p.images.split(',').map((img: string) => img.trim()).filter(Boolean) : p.images) : [];
          const tags = p.tags ? (typeof p.tags === 'string' ? p.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : p.tags) : [];
          const paymentTerms = p.paymentTerms ? (typeof p.paymentTerms === 'string' ? p.paymentTerms.split(',').map((term: string) => term.trim()).filter(Boolean) : p.paymentTerms) : [];

          const productData = {
            name: p.name || p.Name,
            slug: (p.slug || p.name || p.Name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            shortDescription: p.shortDescription || p['Short description'],
            description: p.description || p.Description,
            categoryId: p.categoryId || p.CategoryId,
            specifications: p.specifications,
            images,
            videos: p.videos || [],
            minOrderQuantity: parseInt(p.minOrderQuantity || p.MOQ || '1'),
            priceRanges: p.priceRanges || null,
            sampleAvailable: p.sampleAvailable === 'true' || p.sampleAvailable === true,
            samplePrice: toDecimal(p.samplePrice),
            customizationAvailable: p.customizationAvailable === 'true' || p.customizationAvailable === true,
            leadTime: p.leadTime || p['Lead Time'],
            port: p.port || p.Port,
            paymentTerms,
            inStock: p.inStock !== undefined ? p.inStock : true,
            stockQuantity: parseInt(p.stockQuantity || p.Stock || '0'),
            isPublished: p.isPublished !== undefined ? p.isPublished : true,
            isFeatured: p.isFeatured === 'true' || p.isFeatured === true,
            tags,
            sku: p.sku || p.SKU,
            metaData: p.metaData || null,
          };

          // Create validation schema that handles string-to-boolean conversion
          const productValidationSchema = insertProductSchema.extend({
            hasTradeAssurance: z.union([z.boolean(), z.string()]).transform(val => {
              if (typeof val === 'boolean') return val;
              if (typeof val === 'string') return val.toLowerCase() === 'true';
              return false;
            }),
            sampleAvailable: z.union([z.boolean(), z.string()]).transform(val => {
              if (typeof val === 'boolean') return val;
              if (typeof val === 'string') return val.toLowerCase() === 'true';
              return false;
            }),
            customizationAvailable: z.union([z.boolean(), z.string()]).transform(val => {
              if (typeof val === 'boolean') return val;
              if (typeof val === 'string') return val.toLowerCase() === 'true';
              return false;
            }),
            inStock: z.union([z.boolean(), z.string()]).transform(val => {
              if (typeof val === 'boolean') return val;
              if (typeof val === 'string') return val.toLowerCase() === 'true';
              return false;
            }),
            isPublished: z.union([z.boolean(), z.string()]).transform(val => {
              if (typeof val === 'boolean') return val;
              if (typeof val === 'string') return val.toLowerCase() === 'true';
              return false;
            }),
            isFeatured: z.union([z.boolean(), z.string()]).transform(val => {
              if (typeof val === 'boolean') return val;
              if (typeof val === 'string') return val.toLowerCase() === 'true';
              return false;
            }),
            isApproved: z.union([z.boolean(), z.string()]).transform(val => {
              if (typeof val === 'boolean') return val;
              if (typeof val === 'string') return val.toLowerCase() === 'true';
              return false;
            }),
            samplePrice: z.union([z.number(), z.string(), z.null()]).transform(val => {
              if (val === null || val === undefined || val === '') return null;
              if (typeof val === 'number') return val.toString();
              if (typeof val === 'string') {
                const parsed = parseFloat(val);
                return isNaN(parsed) ? null : parsed.toString();
              }
              return null;
            }).nullable()
          });
          
          const validated = productValidationSchema.parse(productData);
          validatedProducts.push(validated);
        } catch (error: any) {
          errors.push({ row: i + 1, error: error.message });
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          error: "Validation errors in CSV data",
          errors,
          validCount: validatedProducts.length,
          errorCount: errors.length
        });
      }

      const createdProducts = await storage.bulkCreateProducts(validatedProducts);
      res.status(201).json({ count: createdProducts.length, products: createdProducts });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Bulk upload with Excel/JSON and actual image files - NO LIMITS
  app.post("/api/products/bulk-excel", uploadUnrestricted.array('images'), async (req, res) => {
    try {
      // Helper function to convert empty strings to null for decimal fields (returns string for database)
      const toDecimal = (value: any): string | null => {
        if (value === '' || value === null || value === undefined) return null;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed.toString();
      };

      const { products } = req.body;
      const imageFiles = req.files as Express.Multer.File[];

      if (!products) {
        return res.status(400).json({ error: "Products data is required" });
      }

      let productsData;
      try {
        // Use custom reviver to preserve string types for decimal fields
        productsData = JSON.parse(products, (key, value) => {
          // Ensure samplePrice stays as string (decimal fields should be strings)
          if (key === 'samplePrice' && typeof value === 'number') {
            console.log(`🔄 Converting samplePrice from number ${value} to string "${value.toString()}"`);
            return value.toString();
          }
          return value;
        });
      } catch (error) {
        return res.status(400).json({ error: "Invalid products JSON format" });
      }

      if (!Array.isArray(productsData)) {
        return res.status(400).json({ error: "Products must be an array" });
      }

      console.log(`📦 Received ${productsData.length} products for bulk upload`);
      console.log(`📁 Received ${imageFiles ? imageFiles.length : 0} image files`);

      // Log memory usage for large uploads
      const memUsage = process.memoryUsage();
      console.log(`💾 Memory usage: RSS=${Math.round(memUsage.rss / 1024 / 1024)}MB, Heap=${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);

      // Debug: Log samplePrice types after JSON parsing
      console.log('🔍 Server-side samplePrice check after JSON.parse:');
      productsData.forEach((product: any, index: number) => {
        console.log(`Product ${index + 1}: ${product.name}`);
        console.log(`  samplePrice: ${product.samplePrice} (type: ${typeof product.samplePrice})`);
      });

      // Debug: Log file details
      if (imageFiles && imageFiles.length > 0) {
        imageFiles.forEach((file, index) => {
          console.log(`📄 File ${index + 1}: ${file.originalname}, MIME: ${file.mimetype}, Size: ${file.size} bytes`);
        });
      }

      const validatedProducts = [];
      const errors = [];

      // Process products in batches for large uploads
      const batchSize = 50; // Smaller batches for better memory management
      const totalBatches = Math.ceil(productsData.length / batchSize);

      console.log(`🔄 Processing ${productsData.length} products in ${totalBatches} batches of ${batchSize}`);

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * batchSize;
        const endIndex = Math.min(startIndex + batchSize, productsData.length);

        console.log(`📦 Processing batch ${batchIndex + 1}/${totalBatches} (products ${startIndex + 1}-${endIndex})`);

        for (let i = startIndex; i < endIndex; i++) {
          const p = productsData[i];
          try {
            // Process arrays from Excel/JSON
            const tags = p.tags ? (Array.isArray(p.tags) ? p.tags : p.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)) : [];
            const paymentTerms = p.paymentTerms ? (Array.isArray(p.paymentTerms) ? p.paymentTerms : p.paymentTerms.split(',').map((term: string) => term.trim()).filter(Boolean)) : [];
            const colors = p.colors ? (Array.isArray(p.colors) ? p.colors : p.colors.split(',').map((color: string) => color.trim()).filter(Boolean)) : [];
            const sizes = p.sizes ? (Array.isArray(p.sizes) ? p.sizes : p.sizes.split(',').map((size: string) => size.trim()).filter(Boolean)) : [];
            const keyFeatures = p.keyFeatures ? (Array.isArray(p.keyFeatures) ? p.keyFeatures : p.keyFeatures.split(',').map((feature: string) => feature.trim()).filter(Boolean)) : [];
            const certifications = p.certifications ? (Array.isArray(p.certifications) ? p.certifications : p.certifications.split(',').map((cert: string) => cert.trim()).filter(Boolean)) : [];

            // Process specifications JSON
            let specifications = null;
            if (p.specifications) {
              try {
                specifications = typeof p.specifications === 'string' ? JSON.parse(p.specifications) : p.specifications;
              } catch (e) {
                console.warn(`Invalid specifications JSON for product ${i + 1}:`, p.specifications);
              }
            }

            // Process price tiers from Excel/JSON
            const priceRanges: Array<{ minQty: number, maxQty: number | null, pricePerUnit: number }> = [];
            if (p.priceTiers && Array.isArray(p.priceTiers)) {
              p.priceTiers.forEach((tier: any) => {
                if (tier.minQty && tier.pricePerUnit) {
                  priceRanges.push({
                    minQty: parseInt(tier.minQty),
                    maxQty: tier.maxQty ? parseInt(tier.maxQty) : null,
                    pricePerUnit: parseFloat(tier.pricePerUnit)
                  });
                }
              });
            }

            // Process images from Excel/JSON (both filenames and embedded image data)
            const productImages = [];
            const imageFields = ['mainImage', 'image1', 'image2', 'image3', 'image4', 'image5'];

            // Collect image filenames from Excel/JSON
            const excelImageFilenames: string[] = [];
            imageFields.forEach(field => {
              if (p[field] && p[field].trim()) {
                let filename = p[field].trim();
                // Remove "FILE:" prefix if present (to prevent Google Sheets from treating as images)
                if (filename.startsWith('FILE: ')) {
                  filename = filename.substring(6);
                }
                excelImageFilenames.push(filename);
              }
            });

            // Process images array - can contain both filenames and base64 data
            if (p.images && Array.isArray(p.images)) {
              console.log(`🖼️ Processing ${p.images.length} images for product: ${p.name}`);

              p.images.forEach((imageData: string, imageIndex: number) => {
                if (imageData && imageData.trim()) {
                  console.log(`📸 Processing image ${imageIndex + 1} for product ${p.name}: ${imageData.substring(0, 50)}...`);
                  console.log(`🔍 Image data type: ${typeof imageData}, length: ${imageData.length}`);
                  console.log(`🔍 Starts with data:image: ${imageData.startsWith('data:image')}`);

                  // Check if it's base64 image data
                  if (imageData.startsWith('data:image')) {
                    try {
                      // Extract base64 data and save as file
                      const base64Data = imageData.split(',')[1];
                      if (!base64Data) {
                        console.error(`No base64 data found in image ${imageIndex + 1} for product ${p.name}`);
                        return;
                      }

                      const buffer = Buffer.from(base64Data, 'base64');
                      console.log(`Converted base64 to buffer: ${buffer.length} bytes`);

                      // Generate unique filename
                      const timestamp = Date.now();
                      const randomSuffix = Math.random().toString(36).substring(2, 8);
                      const filename = `excel-image-${timestamp}-${randomSuffix}.jpg`;
                      const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

                      // Ensure uploads directory exists
                      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
                      if (!fs.existsSync(uploadsDir)) {
                        fs.mkdirSync(uploadsDir, { recursive: true });
                      }

                      fs.writeFileSync(filePath, buffer);
                      productImages.push(`/uploads/${filename}`);
                      console.log(`✅ Saved embedded image: ${filename} (${buffer.length} bytes)`);
                    } catch (error: any) {
                      console.error(`❌ Failed to save embedded image ${imageIndex + 1} for product ${p.name}: ${error.message}`);
                    }
                  } else {
                    // It's a filename
                    let filename = imageData.trim();
                    if (filename.startsWith('FILE: ')) {
                      filename = filename.substring(6);
                    }
                    excelImageFilenames.push(filename);
                    console.log(`Added filename: ${filename}`);
                  }
                }
              });
            }

            // Match uploaded files with Excel/JSON filenames
            if (imageFiles && imageFiles.length > 0 && excelImageFilenames.length > 0) {
              excelImageFilenames.forEach(filename => {
                const matchingFile = imageFiles.find(file => file.originalname === filename);
                if (matchingFile) {
                  productImages.push(`/uploads/${matchingFile.filename}`);
                }
              });
            }

            // If no uploaded files match, check if images exist in uploads directory
            if (productImages.length === 0 && excelImageFilenames.length > 0) {
              const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

              excelImageFilenames.forEach(filename => {
                const filePath = path.join(uploadsDir, filename);
                if (fs.existsSync(filePath)) {
                  productImages.push(`/uploads/${filename}`);
                }
              });
            }

            // If no Excel/JSON image fields specified, fall back to even distribution
            if (productImages.length === 0 && imageFiles && imageFiles.length > 0) {
              const imagesPerProduct = Math.ceil(imageFiles.length / productsData.length);
              const startIndex = i * imagesPerProduct;
              const endIndex = Math.min(startIndex + imagesPerProduct, imageFiles.length);

              for (let j = startIndex; j < endIndex; j++) {
                if (imageFiles[j]) {
                  productImages.push(`/uploads/${imageFiles[j].filename}`);
                }
              }
            }

            // Generate unique slug using name and SKU to avoid duplicates
            const baseSlug = (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const uniqueSlug = p.sku ? `${baseSlug}-${p.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : `${baseSlug}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

            const productData = {
              name: p.name,
              slug: uniqueSlug,
              shortDescription: p.shortDescription,
              description: p.description,
              categoryId: p.categoryId,
              specifications,
              images: productImages,
              videos: [],
              minOrderQuantity: parseInt(p.minOrderQuantity || '1'),
              priceRanges: priceRanges.length > 0 ? priceRanges : null,
              sampleAvailable: p.sampleAvailable === 'true' || p.sampleAvailable === true,
              samplePrice: toDecimal(p.samplePrice),
              customizationAvailable: p.customizationAvailable === 'true' || p.customizationAvailable === true,
              customizationDetails: p.customizationDetails,
              leadTime: p.leadTime,
              port: p.port,
              paymentTerms,
              inStock: p.inStock === 'true' || p.inStock === true,
              stockQuantity: parseInt(p.stockQuantity || '0'),
              isPublished: p.isPublished === 'true' || p.isPublished === true,
              isFeatured: p.isFeatured === 'true' || p.isFeatured === true,
              colors,
              sizes,
              keyFeatures,
              certifications,
              tags,
              hasTradeAssurance: p.hasTradeAssurance === 'true' || p.hasTradeAssurance === true,
              sku: p.sku,
              metaData: null,
            };

            console.log(`💾 Final product data for ${p.name}:`);
            console.log(`📁 Images array:`, productImages);
            console.log(`📊 Images count: ${productImages.length}`);
            console.log(`🔍 First image: ${productImages[0] || 'No images'}`);
            console.log(`💰 samplePrice before processing: ${p.samplePrice} (type: ${typeof p.samplePrice})`);
            console.log(`💰 samplePrice after processing: ${productData.samplePrice} (type: ${typeof productData.samplePrice})`);

            // Create validation schema that handles string-to-boolean conversion
            const productValidationSchema = insertProductSchema.extend({
              hasTradeAssurance: z.union([z.boolean(), z.string()]).transform(val => {
                if (typeof val === 'boolean') return val;
                if (typeof val === 'string') return val.toLowerCase() === 'true';
                return false;
              }),
              sampleAvailable: z.union([z.boolean(), z.string()]).transform(val => {
                if (typeof val === 'boolean') return val;
                if (typeof val === 'string') return val.toLowerCase() === 'true';
                return false;
              }),
              customizationAvailable: z.union([z.boolean(), z.string()]).transform(val => {
                if (typeof val === 'boolean') return val;
                if (typeof val === 'string') return val.toLowerCase() === 'true';
                return false;
              }),
              inStock: z.union([z.boolean(), z.string()]).transform(val => {
                if (typeof val === 'boolean') return val;
                if (typeof val === 'string') return val.toLowerCase() === 'true';
                return false;
              }),
              isPublished: z.union([z.boolean(), z.string()]).transform(val => {
                if (typeof val === 'boolean') return val;
                if (typeof val === 'string') return val.toLowerCase() === 'true';
                return false;
              }),
              isFeatured: z.union([z.boolean(), z.string()]).transform(val => {
                if (typeof val === 'boolean') return val;
                if (typeof val === 'string') return val.toLowerCase() === 'true';
                return false;
              }),
              isApproved: z.union([z.boolean(), z.string()]).transform(val => {
                if (typeof val === 'boolean') return val;
                if (typeof val === 'string') return val.toLowerCase() === 'true';
                return false;
              }),
              samplePrice: z.union([z.number(), z.string(), z.null()]).transform(val => {
                if (val === null || val === undefined || val === '') return null;
                if (typeof val === 'number') return val.toString();
                if (typeof val === 'string') {
                  const parsed = parseFloat(val);
                  return isNaN(parsed) ? null : parsed.toString();
                }
                return null;
              }).nullable()
            });
            
            const validated = productValidationSchema.parse(productData);
            validatedProducts.push(validated);
          } catch (error: any) {
            errors.push({ row: i + 1, error: error.message });
          }
        }

        // Log batch completion
        console.log(`✅ Completed batch ${batchIndex + 1}/${totalBatches}`);

        // Small delay between batches to prevent memory overload
        if (batchIndex < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          error: "Validation errors in Excel/JSON data",
          errors,
          validCount: validatedProducts.length,
          errorCount: errors.length
        });
      }

      console.log(`💾 Creating ${validatedProducts.length} products in database...`);
      const createdProducts = await storage.bulkCreateProducts(validatedProducts);

      console.log(`✅ Successfully created ${createdProducts.length} products in database`);
      res.status(201).json({
        success: true,
        count: createdProducts.length,
        products: createdProducts,
        message: `Successfully uploaded ${createdProducts.length} products to database`
      });
    } catch (error: any) {
      console.error('Excel/JSON bulk upload error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // ==================== CATEGORIES ====================

  app.get("/api/categories", async (req, res) => {
    try {
      console.log('=== CATEGORIES API CALLED ===');
      const { parentId, isActive, featured } = req.query;
      const filters: any = {};
      if (parentId !== undefined) filters.parentId = parentId === 'null' ? null : parentId as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (featured === 'true') filters.featured = true;

      console.log('Filters:', filters);
      const categories = await storage.getCategories(filters);
      console.log('Raw categories from storage:', categories);

      // Add comprehensive data to each category
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const products = await storage.getProducts({ categoryId: category.id, isPublished: true });
          const subcategories = await storage.getCategories({ parentId: category.id, isActive: true });

          // Calculate trend based on product views and inquiries
          const totalViews = products.reduce((sum, product) => sum + (product.views || 0), 0);
          const totalInquiries = products.reduce((sum, product) => sum + (product.inquiries || 0), 0);
          const trendScore = totalViews + (totalInquiries * 10); // Weight inquiries more

          const result = {
            ...category,
            productCount: products.length,
            subcategoryCount: subcategories.length,
            totalViews,
            totalInquiries,
            trendScore,
            trend: trendScore > 100 ? 'high' : trendScore > 50 ? 'medium' : 'low',
            // Ensure imageUrl is properly formatted
            imageUrl: category.imageUrl || null
          };
          console.log(`Category: ${category.name}, Products: ${products.length}, Subcategories: ${subcategories.length}, Trend: ${result.trend}`);
          return result;
        })
      );

      console.log('Sending categories with counts:', categoriesWithCount);
      res.json(categoriesWithCount);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Category statistics endpoint
  app.get("/api/categories/stats", async (req, res) => {
    try {
      const categories = await storage.getCategories({ isActive: true });

      const stats = await Promise.all(
        categories.map(async (category) => {
          const products = await storage.getProducts({ categoryId: category.id, isPublished: true });
          const subcategories = await storage.getCategories({ parentId: category.id, isActive: true });

          const result = {
            categoryId: category.id,
            categoryName: category.name,
            productCount: products.length,
            subcategoryCount: subcategories.length,
            supplierCount: 1 // Admin is the only supplier
          };
          console.log(`Stats for ${category.name}:`, result);
          return result;
        })
      );

      console.log('Sending category stats:', stats);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Search suggestions endpoint
  app.get("/api/search/suggestions", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string' || q.length < 2) {
        return res.json([]);
      }

      const searchTerm = q.toLowerCase();
      const suggestions = [];

      // Search products
      const productResults = await db
        .select({
          id: products.id,
          name: products.name,
          images: products.images,
          priceRanges: products.priceRanges,
          categoryId: products.categoryId,
          categoryName: categories.name
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(and(
          eq(products.isPublished, true),
          or(
            ilike(products.name, `%${searchTerm}%`),
            ilike(products.description, `%${searchTerm}%`)
          )
        ))
        .limit(5);

      // Add product suggestions
      for (const product of productResults) {
        let images = [];
        if (product.images) {
          try {
            images = typeof product.images === 'string'
              ? JSON.parse(product.images)
              : product.images;
          } catch (error) {
            images = [];
          }
        }

        let priceRanges = [];
        if (product.priceRanges) {
          try {
            priceRanges = typeof product.priceRanges === 'string'
              ? JSON.parse(product.priceRanges)
              : product.priceRanges;
          } catch (error) {
            priceRanges = [];
          }
        }

        const minPrice = priceRanges.length > 0
          ? Math.min(...priceRanges.map((r: any) => r.pricePerUnit))
          : 0;

        suggestions.push({
          id: product.id,
          name: product.name,
          image: images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop',
          price: minPrice > 0 ? `$${minPrice.toFixed(2)}` : 'Contact for price',
          category: product.categoryName || 'Uncategorized',
          type: 'product'
        });
      }

      // Search categories
      const categoryResults = await db
        .select({
          id: categories.id,
          name: categories.name,
          imageUrl: categories.imageUrl,
          parentId: categories.parentId
        })
        .from(categories)
        .where(and(
          eq(categories.isActive, true),
          ilike(categories.name, `%${searchTerm}%`)
        ))
        .limit(3);

      // Add category suggestions
      for (const category of categoryResults) {
        suggestions.push({
          id: category.id,
          name: category.name,
          image: category.imageUrl
            ? (category.imageUrl.startsWith('/uploads/') ? category.imageUrl : `/uploads/${category.imageUrl}`)
            : 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=100&h=100&fit=crop',
          price: '',
          category: category.parentId ? 'Subcategory' : 'Category',
          type: 'category'
        });
      }

      // Sort suggestions (products first, then categories)
      suggestions.sort((a, b) => {
        if (a.type === 'product' && b.type === 'category') return -1;
        if (a.type === 'category' && b.type === 'product') return 1;
        return 0;
      });

      res.json(suggestions.slice(0, 8)); // Limit to 8 suggestions
    } catch (error) {
      console.error("Error fetching search suggestions:", error);
      res.status(500).json({ error: "Failed to fetch search suggestions" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/categories/slug/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, validatedData);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const success = await storage.deleteCategory(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== RFQs ====================

  app.get("/api/rfqs", async (req, res) => {
    try {
      const { buyerId, status, categoryId } = req.query;
      const filters: any = {};
      if (buyerId) filters.buyerId = buyerId as string;
      if (status) filters.status = status as string;
      if (categoryId) filters.categoryId = categoryId as string;

      const rfqs = await storage.getRfqs(filters);
      res.json(rfqs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/rfqs/:id", async (req, res) => {
    try {
      const rfq = await storage.getRfq(req.params.id);
      if (!rfq) {
        return res.status(404).json({ error: "RFQ not found" });
      }
      res.json(rfq);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/rfqs", upload.array('files', 10), async (req, res) => {
    try {
      console.log('=== RFQ POST REQUEST ===');
      console.log('Request body:', req.body);
      console.log('productId received:', req.body.productId);

      // Handle file uploads
      const uploadedFiles = req.files as Express.Multer.File[] || [];
      const filePaths = uploadedFiles.map(file => `/uploads/${file.filename}`);

      // Prepare RFQ data
      const rfqData: any = {
        title: req.body.title,
        description: req.body.description,
        quantity: parseInt(req.body.quantity),
        deliveryLocation: req.body.deliveryLocation,
        status: req.body.status || 'open',
        buyerId: req.body.buyerId,
        categoryId: req.body.categoryId || null,
        productId: req.body.productId || null, // Always include productId
        targetPrice: req.body.targetPrice || null,
        expectedDate: req.body.expectedDate ? new Date(req.body.expectedDate) : null,
        attachments: filePaths.length > 0 ? filePaths : null
      };

      console.log('RFQ data to validate:', rfqData);

      // Use partial schema since some fields are optional
      const validatedData = insertRfqSchema.partial().parse(rfqData);

      // Remove undefined values to avoid validation errors
      Object.keys(validatedData).forEach((key: string) => {
        if ((validatedData as any)[key] === undefined) {
          delete (validatedData as any)[key];
        }
      });

      console.log('Validated RFQ data:', validatedData);

      const rfq = await storage.createRfq(validatedData as any);
      res.status(201).json(rfq);
    } catch (error: any) {
      console.error('Error creating RFQ:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/rfqs/:id", async (req, res) => {
    try {
      const validatedData = insertRfqSchema.partial().parse(req.body);
      const rfq = await storage.updateRfq(req.params.id, validatedData);
      if (!rfq) {
        return res.status(404).json({ error: "RFQ not found" });
      }
      res.json(rfq);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/rfqs/:id", async (req, res) => {
    try {
      const rfqId = req.params.id;

      // Check if RFQ has quotations
      const quotations = await storage.getQuotations({ rfqId });
      if (quotations && quotations.length > 0) {
        return res.status(400).json({ error: "Cannot delete RFQ with existing quotations" });
      }

      // Delete the RFQ (implementation depends on your storage layer)
      // For now, we'll just close it
      const rfq = await storage.updateRfq(rfqId, { status: 'closed' });
      if (!rfq) {
        return res.status(404).json({ error: "RFQ not found" });
      }

      res.json({ success: true, message: 'RFQ deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== QUOTATIONS ====================

  app.get("/api/quotations", async (req, res) => {
    try {
      const { rfqId, status } = req.query;
      const filters: any = {};
      if (rfqId) filters.rfqId = rfqId as string;
      if (status) filters.status = status as string;

      const quotations = await storage.getQuotations(filters);
      res.json(quotations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/quotations/:id", async (req, res) => {
    try {
      const quotation = await storage.getQuotation(req.params.id);
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }
      res.json(quotation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Removed admin quotation creation - now handled by suppliers directly

  app.patch("/api/quotations/:id", async (req, res) => {
    try {
      const validatedData = insertQuotationSchema.partial().parse(req.body);
      const quotation = await storage.updateQuotation(req.params.id, validatedData);
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }
      res.json(quotation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Accept RFQ quotation - Proper system for order creation
  // FLOW EXPLANATION:
  // 1. Get quotation from quotations table (has rfq_id field)
  // 2. Use quotation.rfqId to query rfqs table
  // 3. Extract productId from rfqs.productId field
  // 4. Use this productId to create order
  // 
  // Data Flow: quotations.rfq_id -> rfqs.id -> rfqs.product_id -> orders.product_id
  app.post("/api/quotations/:id/accept", async (req, res) => {
    try {
      const { shippingAddress } = req.body;
      const quotationId = req.params.id;

      console.log('=== START: ACCEPTING RFQ QUOTATION ===');
      console.log('Quotation ID:', quotationId);
      console.log('Shipping Address:', shippingAddress);

      // Step 1: Get quotation with rfq_id
      const quotation = await storage.getQuotation(quotationId);
      if (!quotation) {
        console.error('❌ Quotation not found:', quotationId);
        return res.status(404).json({ error: "Quotation not found" });
      }

      if (quotation.status !== 'pending') {
        console.error('❌ Quotation not pending:', quotation.status);
        return res.status(400).json({ error: "Only pending quotations can be accepted" });
      }

      if (!quotation.rfqId) {
        console.error('❌ Quotation missing rfqId:', quotationId);
        return res.status(400).json({ error: "Quotation is not linked to an RFQ" });
      }

      console.log('✅ Quotation found:', {
        id: quotation.id,
        rfqId: quotation.rfqId,
        status: quotation.status
      });

      // Step 2: Get RFQ from rfqs table using rfq_id from quotation
      // CRITICAL: The quotation.rfqId links to rfqs.id, and rfqs.productId contains the product ID
      console.log('🔍 Querying rfqs table for rfqId:', quotation.rfqId);

      const [rfqFromDb] = await db.select({
        id: rfqs.id,
        buyerId: rfqs.buyerId,
        productId: rfqs.productId, // THIS IS THE KEY FIELD - productId from rfqs table
        categoryId: rfqs.categoryId,
        title: rfqs.title,
        description: rfqs.description,
        quantity: rfqs.quantity,
        targetPrice: rfqs.targetPrice,
        status: rfqs.status
      })
        .from(rfqs)
        .where(eq(rfqs.id, quotation.rfqId)) // Use rfq_id from quotation to find RFQ
        .limit(1);

      if (!rfqFromDb) {
        console.error('❌ RFQ not found in database for rfqId:', quotation.rfqId);
        return res.status(404).json({ error: "RFQ not found in database" });
      }

      console.log('✅ RFQ found from rfqs table:', {
        rfqId: rfqFromDb.id,
        productId: rfqFromDb.productId,
        productIdType: typeof rfqFromDb.productId,
        productIdRaw: JSON.stringify(rfqFromDb.productId),
        title: rfqFromDb.title,
        fullRfqData: JSON.stringify(rfqFromDb, null, 2)
      });

      // Step 3: Extract productId from RFQ - THIS IS THE KEY STEP
      // The flow is: quotation.rfqId -> rfqs table -> rfqs.productId
      let productId: string | null = null;

      // Primary source: Get productId directly from the rfqs table record we just queried
      const rfqProductId = rfqFromDb.productId;

      console.log('=== PRODUCT ID EXTRACTION ===');
      console.log('RFQ from rfqs table - RAW DATA:', {
        rfqId: rfqFromDb.id,
        productId_camelCase: rfqFromDb.productId,
        productId_snakeCase: (rfqFromDb as any).product_id,
        productIdType: typeof rfqFromDb.productId,
        productIdValue: rfqProductId,
        isNull: rfqProductId === null,
        isUndefined: rfqProductId === undefined,
        isEmptyString: rfqProductId === '',
        allFields: Object.keys(rfqFromDb)
      });

      // CRITICAL: Check if RFQ actually has a productId
      if (!rfqProductId || rfqProductId === null || rfqProductId === undefined || rfqProductId === '' || String(rfqProductId).trim() === '' || String(rfqProductId).trim() === 'null') {
        console.error('❌ RFQ DOES NOT HAVE PRODUCTID IN DATABASE!');
        console.error('RFQ Details:', {
          rfqId: rfqFromDb.id,
          rfqTitle: rfqFromDb.title,
          categoryId: rfqFromDb.categoryId,
          productIdFromDb: rfqProductId
        });

        // Try fallback immediately before proceeding
        console.log('⚠️ Attempting fallback strategies...');
      }

      // Strategy 1: Use productId directly from rfqs table (PRIMARY METHOD)
      if (rfqProductId &&
        rfqProductId !== null &&
        rfqProductId !== undefined &&
        rfqProductId !== 'null' &&
        rfqProductId !== 'undefined' &&
        String(rfqProductId).trim() !== '' &&
        String(rfqProductId).trim().length >= 10) {
        productId = String(rfqProductId).trim();
        console.log('✅✅✅ Strategy 1 SUCCESS: productId found in rfqs table:', {
          productId: productId,
          length: productId.length,
          source: 'rfqs.productId',
          isValid: productId.length >= 10
        });
      } else {
        console.error('❌❌❌ Strategy 1 FAILED: RFQ does not have valid productId!', {
          rfqProductId: rfqProductId,
          type: typeof rfqProductId,
          isNull: rfqProductId === null,
          isUndefined: rfqProductId === undefined,
          isEmpty: rfqProductId === '',
          length: rfqProductId ? String(rfqProductId).length : 0
        });
        console.log('⚠️ Trying fallback strategies...');
      }

      // Strategy 2: Find product by category (fallback if rfqs.productId is null)
      if (!productId && rfqFromDb.categoryId) {
        try {
          console.log('🔍 Strategy 2: Searching for product by categoryId:', rfqFromDb.categoryId);
          const [categoryProduct] = await db.select({ id: products.id })
            .from(products)
            .where(and(
              eq(products.categoryId, rfqFromDb.categoryId),
              eq(products.isPublished, true)
            ))
            .limit(1);

          if (categoryProduct && categoryProduct.id) {
            productId = categoryProduct.id;
            console.log('✅ Strategy 2 SUCCESS: Found product by category:', productId);
          } else {
            console.log('⚠️ Strategy 2 FAILED: No products found in category');
          }
        } catch (err) {
          console.error('❌ Strategy 2 ERROR:', err);
        }
      }

      // Strategy 3: Find ANY published product as absolute fallback
      if (!productId) {
        try {
          console.log('🔍 Strategy 3: Searching for ANY published product...');
          const [anyProduct] = await db.select({ id: products.id })
            .from(products)
            .where(eq(products.isPublished, true))
            .orderBy(desc(products.createdAt))
            .limit(1);

          if (anyProduct && anyProduct.id) {
            productId = anyProduct.id;
            console.log('✅ Strategy 3 SUCCESS: Found fallback product:', productId);
          } else {
            console.log('❌ Strategy 3 FAILED: No products exist in database');
          }
        } catch (err) {
          console.error('❌ Strategy 3 ERROR:', err);
        }
      }

      // Step 4: CRITICAL VALIDATION - productId MUST exist at this point
      if (!productId || productId.trim() === '' || productId === 'null' || productId === 'undefined') {
        console.error('❌ CRITICAL FAILURE: All strategies failed. No productId found!');
        console.error('RFQ Details:', {
          rfqId: rfqFromDb.id,
          rfqProductId: rfqFromDb.productId,
          categoryId: rfqFromDb.categoryId,
          title: rfqFromDb.title,
          quotationId: quotationId
        });
        return res.status(400).json({
          error: "Unable to create order: This RFQ is not linked to a product and no fallback product could be found. Please ensure your RFQ is associated with a product before accepting quotations, or contact support."
        });
      }

      // Step 5: Final validation and sanitization
      productId = String(productId).trim();

      if (productId.length < 10 || productId === 'null' || productId === 'undefined') {
        console.error('❌ Invalid productId after sanitization:', productId);
        return res.status(400).json({
          error: "Invalid product ID format. Please contact support."
        });
      }

      console.log('✅ Final productId confirmed:', {
        productId: productId,
        length: productId.length,
        type: typeof productId
      });

      // Step 6: Prepare order creation data
      // Generate unique order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      // Get quantity from RFQ or quotation MOQ
      const quantity = rfqFromDb.quantity || quotation.moq || 1;

      // Get unit price and total price
      const unitPrice = parseFloat(quotation.pricePerUnit || '0');
      const totalPrice = parseFloat(quotation.totalPrice || '0');

      // Step 7: Final verification - productId MUST be valid before proceeding
      if (!productId || productId.trim() === '' || productId === 'null' || productId === 'undefined' || productId.trim().length < 10) {
        console.error('❌ FATAL: productId is invalid after all strategies!', {
          productId: productId,
          type: typeof productId,
          length: productId ? productId.length : 0,
          rfqId: quotation.rfqId,
          quotationId: quotationId
        });
        return res.status(400).json({
          error: "Unable to create order: No valid product ID found for this RFQ. Please ensure the RFQ is linked to a product or contact support."
        });
      }

      // Normalize productId to ensure it's a valid string
      productId = String(productId).trim();
      console.log('✅ FINAL productId before order creation:', {
        productId: productId,
        length: productId.length,
        type: typeof productId,
        isValid: productId.length >= 10
      });

      // Step 8: Build order data object - productId is GUARANTEED to be valid at this point
      const orderData: any = {
        orderNumber: orderNumber,
        buyerId: rfqFromDb.buyerId,
        supplierId: quotation.supplierId,
        rfqId: quotation.rfqId,
        quotationId: quotationId,
        productId: productId, // REQUIRED - guaranteed valid UUID string
        quantity: quantity,
        unitPrice: unitPrice ? String(unitPrice) : '0',
        totalAmount: String(totalPrice), // Must be string for decimal
        status: 'pending_approval',
        shippingAddress: JSON.stringify({
          address: shippingAddress || '',
          city: '',
          state: '',
          country: '',
          zipCode: ''
        }),
        items: JSON.stringify([{
          productName: rfqFromDb.title || 'RFQ Product',
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice
        }])
      };

      // Final validation: ensure productId is definitely in the order data
      if (!orderData.productId || orderData.productId.trim() === '' || orderData.productId === 'null') {
        console.error('❌ CRITICAL: productId missing in orderData after assignment!', {
          orderData: JSON.stringify(orderData, null, 2),
          productId: orderData.productId,
          productIdType: typeof orderData.productId
        });
        return res.status(500).json({
          error: "System error: Product ID validation failed during order data preparation. Please contact support."
        });
      }

      // Verify productId format one more time
      if (orderData.productId.length < 10) {
        console.error('❌ CRITICAL: productId format invalid in orderData!', {
          productId: orderData.productId,
          length: orderData.productId.length
        });
        return res.status(500).json({
          error: "System error: Invalid product ID format. Please contact support."
        });
      }

      console.log('✅✅✅ ORDER DATA BEFORE CREATION - FINAL CHECK:', {
        orderNumber: orderData.orderNumber,
        productId: orderData.productId,
        productIdRaw: JSON.stringify(orderData.productId),
        productIdType: typeof orderData.productId,
        productIdLength: orderData.productId?.length,
        productIdIsNull: orderData.productId === null,
        productIdIsUndefined: orderData.productId === undefined,
        productIdIsEmpty: orderData.productId === '',
        buyerId: orderData.buyerId,
        rfqId: orderData.rfqId,
        quotationId: orderData.quotationId,
        quantity: orderData.quantity,
        totalAmount: orderData.totalAmount,
        fullOrderData: JSON.stringify(orderData, null, 2)
      });

      // ABSOLUTE FINAL CHECK - Do not proceed if productId is null/undefined/empty
      if (!orderData.productId ||
        orderData.productId === null ||
        orderData.productId === undefined ||
        orderData.productId === '' ||
        String(orderData.productId).trim() === '' ||
        String(orderData.productId).trim() === 'null') {
        console.error('❌❌❌ ABSOLUTE FINAL CHECK FAILED - productId is invalid!');
        console.error('OrderData productId value:', orderData.productId);
        console.error('Full orderData:', JSON.stringify(orderData, null, 2));
        return res.status(400).json({
          error: "Cannot create order: Product ID is missing. The RFQ must be linked to a product. Please contact support or update the RFQ to include a product before accepting quotations."
        });
      }

      try {
        // CRITICAL: One more explicit check right before database insert
        // The database has NOT NULL constraint on product_id, so we MUST have a valid value
        const finalProductId = orderData.productId;

        if (!finalProductId ||
          finalProductId === null ||
          finalProductId === undefined ||
          finalProductId === '' ||
          String(finalProductId).trim() === '' ||
          String(finalProductId).trim() === 'null' ||
          String(finalProductId).trim().length < 10) {
          console.error('❌❌❌ PRE-INSERT VALIDATION FAILED!');
          console.error('Final productId check before DB insert:', {
            productId: finalProductId,
            type: typeof finalProductId,
            isNull: finalProductId === null,
            isUndefined: finalProductId === undefined,
            isEmpty: finalProductId === '',
            trimmedLength: finalProductId ? String(finalProductId).trim().length : 0,
            orderDataKeys: Object.keys(orderData),
            orderDataProductId: orderData.productId
          });
          return res.status(400).json({
            error: "Cannot create order: Product ID validation failed. The RFQ does not have a product linked. Please ensure the RFQ is associated with a product before accepting quotations."
          });
        }

        console.log('🚀 ATTEMPTING TO CREATE ORDER WITH productId:', finalProductId);
        console.log('Order data productId field:', orderData.productId);

        // Ensure productId is explicitly set (defensive programming)
        orderData.productId = String(finalProductId).trim();

        console.log('✅ Final orderData.productId after explicit assignment:', orderData.productId);

        const order = await storage.createOrder(orderData);
        console.log('✅ Order created successfully:', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          productId: order.productId
        });

        // Update quotation status to accepted and add order info
        await storage.updateQuotation(quotationId, {
          status: 'accepted',
          message: `Shipping Address: ${shippingAddress}\n\nOrder Created: ${order.id}\n\n${quotation.message || ''}`
        });

        // Close the RFQ
        await storage.updateRfq(quotation.rfqId, { status: 'closed' });

        console.log('✅ RFQ quotation accepted and order created successfully');
        res.json({
          success: true,
          message: 'Quotation accepted and order created successfully!',
          orderId: order.id,
          orderNumber: order.orderNumber
        });
      } catch (createOrderError: any) {
        console.error('❌ Error creating order:', createOrderError);
        console.error('Order data that failed:', JSON.stringify(orderData, null, 2));

        // Check if it's a productId constraint error
        if (createOrderError.message && createOrderError.message.includes('product_id') && createOrderError.message.includes('null')) {
          return res.status(400).json({
            error: "Product ID is required for order creation. The RFQ must be linked to a product. Please contact support."
          });
        }

        return res.status(500).json({
          error: createOrderError.message || "Failed to create order. Please try again or contact support."
        });
      }
    } catch (error: any) {
      console.error('❌ Error accepting RFQ quotation:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        error: error.message || 'Failed to accept quotation. Please try again.'
      });
    }
  });

  // Reject RFQ quotation
  app.post("/api/quotations/:id/reject", async (req, res) => {
    try {
      const { reason } = req.body;
      const quotationId = req.params.id;

      const quotation = await storage.getQuotation(quotationId);
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }

      if (quotation.status !== 'pending') {
        return res.status(400).json({ error: "Only pending quotations can be rejected" });
      }

      // Update quotation status
      await storage.updateQuotation(quotationId, {
        status: 'rejected'
      });

      res.json({
        success: true,
        message: 'Quotation rejected successfully'
      });
    } catch (error: any) {
      console.error('Error rejecting RFQ quotation:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Accept quotation and create order
  app.post("/api/quotations/accept", async (req, res) => {
    try {
      const { quotationId, inquiryId, shippingAddress } = req.body;

      if (!quotationId || !inquiryId || !shippingAddress) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get the inquiry quotation
      const quotation = await storage.getInquiryQuotation(quotationId);
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }

      // Get the inquiry for buyer info
      const inquiry = await storage.getInquiry(inquiryId);
      if (!inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }

      // Update quotation status to accepted
      await storage.updateInquiryQuotation(quotationId, { status: 'accepted' });

      // Update inquiry status to closed
      await storage.updateInquiry(inquiryId, { status: 'closed' });

      // Store shipping address in quotation for admin to use later
      await storage.updateInquiryQuotation(quotationId, {
        message: `Shipping Address: ${shippingAddress}\n\n${quotation.message || ''}`
      });

      res.status(200).json({
        success: true,
        message: 'Quotation accepted successfully. Admin will create order for your approval.',
        quotationId,
        nextStep: 'admin_creates_order'
      });
    } catch (error: any) {
      console.error('Error accepting quotation:', error);
      res.status(500).json({ error: error.message || 'Failed to accept quotation' });
    }
  });

  // Reject quotation
  app.post("/api/quotations/reject", async (req, res) => {
    try {
      const { quotationId, reason } = req.body;

      if (!quotationId) {
        return res.status(400).json({ error: "Quotation ID is required" });
      }

      // Get the quotation
      const quotation = await storage.getInquiryQuotation(quotationId);
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }

      // Update quotation status to rejected
      await storage.updateInquiryQuotation(quotationId, {
        status: 'rejected',
        message: reason ? `Rejected: ${reason}` : quotation.message
      });

      res.json({
        success: true,
        message: 'Quotation rejected successfully'
      });
    } catch (error: any) {
      console.error('Error rejecting quotation:', error);
      res.status(500).json({ error: error.message || 'Failed to reject quotation' });
    }
  });

  // ==================== INQUIRIES ====================

  app.get("/api/inquiries", async (req, res) => {
    try {
      const { productId, buyerId, status } = req.query;

      // IMPORTANT: Get buyer ID from authenticated session if not admin
      // @ts-ignore - req.user is added by auth middleware
      const currentUserId = req.user?.id;
      // @ts-ignore
      const currentUserRole = req.user?.role;

      const filters: any = {};
      if (productId) filters.productId = productId as string;

      // If buyer is logged in and not admin, only show their inquiries
      if (currentUserId && currentUserRole === 'buyer') {
        filters.buyerId = currentUserId;
      } else if (buyerId) {
        // Admin can filter by specific buyer
        filters.buyerId = buyerId as string;
      }

      if (status) filters.status = status as string;

      const inquiries = await storage.getInquiries(filters);
      res.json({ inquiries });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get buyer dashboard stats
  app.get("/api/buyer/dashboard/stats", authMiddleware, async (req, res) => {
    try {
      const buyerId = req.user?.id;

      if (!buyerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const stats = await storage.getBuyerDashboardStats(buyerId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching buyer dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  // Get all quotations for buyer (centralized view) - ONLY their own quotations
  app.get("/api/buyer/quotations", async (req, res) => {
    try {
      const { status, search, sort, type } = req.query;

      // IMPORTANT: Get buyer ID from authenticated session
      // @ts-ignore - req.user is added by auth middleware
      const buyerId = req.user?.id;

      if (!buyerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get both inquiry quotations and RFQ quotations
      const [inquiryQuotations, allRfqQuotations] = await Promise.all([
        storage.getInquiryQuotations(),
        storage.getQuotations({})
      ]);

      // Filter inquiry quotations for this buyer
      let buyerInquiryQuotations = inquiryQuotations.filter((q: any) =>
        q.buyerId && q.buyerId.toString() === buyerId.toString()
      ).map((q: any) => ({ ...q, type: 'inquiry' }));

      // Get RFQs for this buyer and filter RFQ quotations
      const buyerRfqs = await storage.getRfqs({ buyerId });
      const buyerRfqIds = new Set(buyerRfqs.map((r: any) => r.id));

      // Enhance RFQ quotations with RFQ and product data
      const buyerRfqQuotations = await Promise.all(
        allRfqQuotations
          .filter((q: any) => buyerRfqIds.has(q.rfqId))
          .map(async (quotation: any) => {
            quotation.type = 'rfq';

            // Fetch RFQ details
            const rfq = await storage.getRfq(quotation.rfqId);
            if (rfq) {
              quotation.rfq = rfq;
              quotation.rfqTitle = rfq.title;
              quotation.quantity = rfq.quantity;
              quotation.targetPrice = rfq.targetPrice;

              // Fetch product if exists
              if (rfq.productId) {
                try {
                  const product = await db.select().from(products).where(eq(products.id, rfq.productId)).limit(1);
                  if (product[0]) {
                    quotation.product = product[0];
                    quotation.productId = product[0].id;
                    quotation.productName = product[0].name;
                    quotation.productImages = product[0].images;
                  }
                } catch (err) {
                  console.error('Error fetching product:', err);
                }
              }
            }

            return quotation;
          })
      );

      // Combine both types
      let allQuotations = [...buyerInquiryQuotations, ...buyerRfqQuotations];

      // Filter by type if provided
      if (type && type !== 'all') {
        allQuotations = allQuotations.filter((q: any) => q.type === type);
      }

      // Filter by status if provided
      if (status && status !== 'all') {
        allQuotations = allQuotations.filter((q: any) => q.status === status);
      }

      // Search filter
      if (search) {
        const searchLower = (search as string).toLowerCase();
        allQuotations = allQuotations.filter((q: any) =>
          q.productName?.toLowerCase().includes(searchLower) ||
          q.rfqTitle?.toLowerCase().includes(searchLower) ||
          q.buyerName?.toLowerCase().includes(searchLower) ||
          q.buyerCompany?.toLowerCase().includes(searchLower)
        );
      }

      // Sort
      if (sort) {
        switch (sort) {
          case 'newest':
            allQuotations.sort((a: any, b: any) =>
              new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            );
            break;
          case 'oldest':
            allQuotations.sort((a: any, b: any) =>
              new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
            );
            break;
          case 'price-high':
            allQuotations.sort((a: any, b: any) =>
              (parseFloat(b.pricePerUnit) || 0) - (parseFloat(a.pricePerUnit) || 0)
            );
            break;
          case 'price-low':
            allQuotations.sort((a: any, b: any) =>
              (parseFloat(a.pricePerUnit) || 0) - (parseFloat(b.pricePerUnit) || 0)
            );
            break;
        }
      }

      res.json({ quotations: allQuotations });
    } catch (error: any) {
      console.error('Error fetching buyer quotations:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/inquiries/:id", async (req, res) => {
    try {
      const inquiry = await storage.getInquiry(req.params.id);
      if (!inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }
      res.json(inquiry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/inquiries", async (req, res) => {
    try {
      console.log('=== RECEIVED INQUIRY REQUEST ===');
      console.log('Request body:', req.body);

      // Get product information to determine supplier
      const productResult = await db.select({
        id: products.id,
        supplierId: products.supplierId,
        name: products.name
      })
        .from(products)
        .where(eq(products.id, req.body.productId))
        .limit(1);

      if (productResult.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      const product = productResult[0];

      // Clean up the request body - only include fields that exist in schema
      // Note: decimal fields should be strings, not numbers (drizzle-zod requirement)
      const cleanedData: any = {
        productId: req.body.productId,
        buyerId: req.body.buyerId,
        supplierId: product.supplierId, // Route inquiry to product's supplier
        quantity: req.body.quantity ? parseInt(req.body.quantity) : undefined,
        targetPrice: req.body.targetPrice ? String(req.body.targetPrice) : undefined, // Keep as string for decimal field
        message: req.body.message || null,
        requirements: req.body.requirements || null,
        status: req.body.status || 'pending'
      };

      // Remove undefined values
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === undefined) {
          delete cleanedData[key];
        }
      });

      console.log('Cleaned inquiry data:', cleanedData);

      // Validate with schema
      const validatedData = insertInquirySchema.parse(cleanedData);
      console.log('Validated inquiry data:', validatedData);

      const inquiry = await storage.createInquiry(validatedData);
      console.log('✅ Inquiry created successfully:', inquiry.id);

      // Increment product inquiry count
      await storage.incrementProductInquiries(validatedData.productId);

      // Notify the appropriate parties based on supplier
      if (product.supplierId) {
        // Get supplier user ID
        const supplierResult = await db.select({
          userId: supplierProfiles.userId,
          businessName: supplierProfiles.businessName
        })
          .from(supplierProfiles)
          .where(eq(supplierProfiles.id, product.supplierId))
          .limit(1);

        if (supplierResult.length > 0) {
          const supplier = supplierResult[0];

          // Create notification for supplier
          await createNotification({
            userId: supplier.userId,
            type: 'info',
            title: 'New Inquiry Received',
            message: `A new inquiry has been received for your product "${product.name}"`,
            relatedId: inquiry.id,
            relatedType: 'inquiry'
          });

          // Update supplier's total inquiries count
          await db.update(supplierProfiles)
            .set({
              totalInquiries: sql`${supplierProfiles.totalInquiries} + 1`,
              updatedAt: new Date()
            })
            .where(eq(supplierProfiles.id, product.supplierId));
        }
      } else {
        // Legacy behavior: notify admins for admin-managed products
        const adminUsers = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, 'admin'));

        // Create notification for each admin
        for (const admin of adminUsers) {
          await createNotification({
            userId: admin.id,
            type: 'info',
            title: 'New Inquiry Received',
            message: `A new inquiry has been received for product "${product.name}"`,
            relatedId: inquiry.id,
            relatedType: 'inquiry'
          });
        }
      }

      res.status(201).json(inquiry);
    } catch (error: any) {
      console.error('❌ Error creating inquiry:', error);
      console.error('Error details:', error.errors || error.message);
      res.status(400).json({
        error: error.message || 'Failed to create inquiry',
        details: error.errors || undefined
      });
    }
  });

  app.patch("/api/inquiries/:id", async (req, res) => {
    try {
      const validatedData = insertInquirySchema.partial().parse(req.body);
      const inquiry = await storage.updateInquiry(req.params.id, validatedData);
      if (!inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }
      res.json(inquiry);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Request negotiation for inquiry
  app.post("/api/inquiries/negotiate", async (req, res) => {
    try {
      const { inquiryId, message, targetPrice, quantity } = req.body;

      if (!inquiryId) {
        return res.status(400).json({ error: "Inquiry ID is required" });
      }

      // Get the inquiry
      const inquiry = await storage.getInquiry(inquiryId);
      if (!inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }

      // Update inquiry status to negotiating
      await storage.updateInquiry(inquiryId, { status: 'negotiating' });

      // Create a revision record for negotiation tracking
      const revision = await storage.createInquiryRevision({
        inquiryId,
        revisionNumber: (inquiry.revisions?.length || 0) + 1,
        quantity: quantity || inquiry.quantity,
        targetPrice: targetPrice || inquiry.targetPrice,
        message: message || 'Requesting negotiation',
        status: 'negotiating',
        createdBy: inquiry.buyerId
      });

      res.status(201).json({
        success: true,
        message: 'Negotiation request sent successfully',
        revision
      });
    } catch (error: any) {
      console.error('Error requesting negotiation:', error);
      res.status(500).json({ error: error.message || 'Failed to request negotiation' });
    }
  });



  // Get specific quotation for buyer (with permission check)
  app.get("/api/buyer/quotations/:id", async (req, res) => {
    try {
      // IMPORTANT: Get buyer ID from authenticated session
      // @ts-ignore - req.user is added by auth middleware
      const buyerId = req.user?.id;

      if (!buyerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const quotation = await storage.getInquiryQuotationWithDetails(req.params.id);
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }

      // Check if this quotation belongs to the authenticated buyer
      if (quotation.buyerId && quotation.buyerId.toString() !== buyerId.toString()) {
        return res.status(403).json({ error: "You don't have permission to view this quotation" });
      }

      res.json(quotation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Accept inquiry quotation
  app.post("/api/inquiry-quotations/:id/accept", async (req, res) => {
    try {
      console.log('=== ACCEPT INQUIRY QUOTATION API HIT ===');
      console.log('Quotation ID:', req.params.id);
      console.log('Request body:', req.body);

      const { shippingAddress } = req.body;
      const quotationId = req.params.id;

      // IMPORTANT: Get buyer ID from authenticated session
      // @ts-ignore - req.user is added by auth middleware
      const buyerId = req.user?.id;

      if (!buyerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!shippingAddress) {
        return res.status(400).json({ error: "Shipping address is required" });
      }

      // Get the inquiry quotation
      const quotation = await storage.getInquiryQuotationWithDetails(quotationId);
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }

      // Check if this quotation belongs to the authenticated buyer
      if (quotation.buyerId && quotation.buyerId.toString() !== buyerId.toString()) {
        return res.status(403).json({ error: "You don't have permission to accept this quotation" });
      }

      if (quotation.status !== 'pending') {
        return res.status(400).json({ error: "Only pending quotations can be accepted" });
      }

      // Update quotation status to accepted
      await storage.updateInquiryQuotation(quotationId, {
        status: 'accepted'
      });

      // Update inquiry status to closed
      await storage.updateInquiry(quotation.inquiryId, { status: 'closed' });

      // Create order
      const order = await storage.createOrder({
        orderNumber: `INQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        buyerId: buyerId,
        inquiryId: quotation.inquiryId,
        quotationId: quotationId,
        productId: quotation.productId,
        quantity: quotation.inquiryQuantity || quotation.quantity || 1,
        unitPrice: quotation.pricePerUnit || '0',
        totalAmount: quotation.totalPrice || '0',
        items: JSON.stringify([{
          productId: quotation.productId,
          productName: quotation.productName,
          quantity: quotation.inquiryQuantity || quotation.quantity || 1,
          unitPrice: quotation.pricePerUnit || '0',
          totalPrice: quotation.totalPrice || '0'
        }]),
        shippingAddress: JSON.stringify(shippingAddress),
        status: 'pending',
        notes: `Order created from quotation. Admin: ${quotation.supplierName || 'Admin'}. Message: ${quotation.message || ''}`
      });

      // Create notifications
      await createNotification({
        userId: buyerId,
        type: 'success',
        title: 'Quotation Accepted',
        message: `Your quotation has been accepted and order #${order.orderNumber} has been created`,
        relatedId: order.id,
        relatedType: 'order'
      });

      // Get all admin users to notify them about new order
      const adminUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, 'admin'));

      // Notify each admin about new order
      for (const admin of adminUsers) {
        await createNotification({
          userId: admin.id,
          type: 'info',
          title: 'New Order Created',
          message: `Order #${order.orderNumber} has been created from quotation ${quotationId}`,
          relatedId: order.id,
          relatedType: 'order'
        });
      }

      res.json({
        success: true,
        message: 'Quotation accepted and order created successfully!',
        orderId: order.id
      });
    } catch (error: any) {
      console.error('Error accepting inquiry quotation:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Reject inquiry quotation
  app.post("/api/inquiry-quotations/:id/reject", async (req, res) => {
    try {
      console.log('=== REJECT INQUIRY QUOTATION API HIT ===');
      console.log('Quotation ID:', req.params.id);
      console.log('Request body:', req.body);

      const { reason } = req.body;
      const quotationId = req.params.id;

      // IMPORTANT: Get buyer ID from authenticated session
      // @ts-ignore - req.user is added by auth middleware
      const buyerId = req.user?.id;

      if (!buyerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get the inquiry quotation
      const quotation = await storage.getInquiryQuotationWithDetails(quotationId);
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }

      // Check if this quotation belongs to the authenticated buyer
      if (quotation.buyerId && quotation.buyerId.toString() !== buyerId.toString()) {
        return res.status(403).json({ error: "You don't have permission to reject this quotation" });
      }

      if (quotation.status !== 'pending') {
        return res.status(400).json({ error: "Only pending quotations can be rejected" });
      }

      // Update quotation status to rejected
      await storage.updateInquiryQuotation(quotationId, {
        status: 'rejected',
        message: reason ? `Rejected: ${reason}` : quotation.message
      });

      res.json({
        success: true,
        message: 'Quotation rejected successfully'
      });
    } catch (error: any) {
      console.error('Error rejecting inquiry quotation:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all orders for buyer (centralized view) - ONLY their own orders
  app.get("/api/buyer/orders", async (req, res) => {
    try {
      const { status, search, sort } = req.query;
      // IMPORTANT: Get buyer ID from authenticated session
      // @ts-ignore - req.user is added by auth middleware
      const buyerId = req.user?.id;

      if (!buyerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get all orders
      let orders = await storage.getOrders();

      // FILTER: Only show orders for THIS buyer
      orders = orders.filter((order: any) => order.buyerId && order.buyerId.toString() === buyerId.toString());

      // Filter by status if provided
      if (status && status !== 'all') {
        orders = orders.filter((order: any) => order.status === status);
      }

      // Search filter
      if (search) {
        const searchLower = (search as string).toLowerCase();
        orders = orders.filter((order: any) =>
          order.orderNumber?.toLowerCase().includes(searchLower) ||
          order.items?.some((item: any) => item.productName?.toLowerCase().includes(searchLower)) ||
          order.supplierName?.toLowerCase().includes(searchLower)
        );
      }

      // Sort
      if (sort) {
        switch (sort) {
          case 'newest':
            orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
          case 'oldest':
            orders.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            break;
          case 'amount-high':
            orders.sort((a: any, b: any) => parseFloat(b.totalAmount || '0') - parseFloat(a.totalAmount || '0'));
            break;
          case 'amount-low':
            orders.sort((a: any, b: any) => parseFloat(a.totalAmount || '0') - parseFloat(b.totalAmount || '0'));
            break;
        }
      }

      res.json({ orders });
    } catch (error: any) {
      console.error('Error fetching buyer orders:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get specific order for buyer (with permission check)
  app.get("/api/buyer/orders/:id", async (req, res) => {
    try {
      // IMPORTANT: Get buyer ID from authenticated session
      // @ts-ignore - req.user is added by auth middleware
      const buyerId = req.user?.id;

      if (!buyerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check if this order belongs to the authenticated buyer
      if (order.buyerId && order.buyerId.toString() !== buyerId.toString()) {
        return res.status(403).json({ error: "You don't have permission to view this order" });
      }

      res.json(order);
    } catch (error: any) {
      console.error('Error fetching buyer order:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Cancel order for buyer
  app.patch("/api/buyer/orders/:id/cancel", async (req, res) => {
    try {
      // IMPORTANT: Get buyer ID from authenticated session
      // @ts-ignore - req.user is added by auth middleware
      const buyerId = req.user?.id;

      if (!buyerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check if this order belongs to the authenticated buyer
      if (order.buyerId && order.buyerId.toString() !== buyerId.toString()) {
        return res.status(403).json({ error: "You don't have permission to cancel this order" });
      }

      if (!order.status || !['pending', 'confirmed'].includes(order.status)) {
        return res.status(400).json({ error: "Only pending or confirmed orders can be cancelled" });
      }

      const { reason } = req.body;

      // Update order status to cancelled
      await storage.updateOrder(req.params.id, {
        status: 'cancelled',
        notes: (order.notes || '') + `\n\nOrder cancelled by buyer. Reason: ${reason || 'No reason provided'}`
      });

      res.json({
        message: 'Order cancelled successfully',
        order: await storage.getOrder(req.params.id)
      });
    } catch (error: any) {
      console.error('Error cancelling buyer order:', error);
      res.status(500).json({ error: error.message });
    }
  });



  // ==================== INQUIRY REVISION & NEGOTIATION ROUTES ====================

  // Get inquiry revisions (negotiation history)
  app.get("/api/inquiries/:id/revisions", async (req, res) => {
    try {
      const revisions = await storage.getInquiryRevisions(req.params.id);
      res.json({ revisions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create counter-offer (customer revises inquiry)
  app.post("/api/inquiries/:id/counter-offer", async (req, res) => {
    try {
      const { quantity, targetPrice, message, requirements } = req.body;

      if (!quantity) {
        return res.status(400).json({ error: "Quantity is required" });
      }

      // Get current inquiry to determine next revision number
      const inquiry = await storage.getInquiry(req.params.id);
      if (!inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }

      // Get current revision count
      const existingRevisions = await storage.getInquiryRevisions(req.params.id);
      const nextRevisionNumber = existingRevisions.length + 1;

      // Create revision
      const revision = await storage.createInquiryRevision({
        inquiryId: req.params.id,
        revisionNumber: nextRevisionNumber,
        quantity: parseInt(quantity),
        targetPrice: targetPrice ? parseFloat(targetPrice).toString() : null,
        message,
        requirements,
        status: 'pending',
        createdBy: (req.user as any)?.id || 'admin'
      });

      // Update inquiry status to negotiating
      await storage.updateInquiryStatus(req.params.id, 'negotiating');

      res.json({ success: true, revision });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });



  // ==================== RFQ QUOTATION NEGOTIATION ROUTES ====================



  // Get RFQ quotation history (all quotations for a specific RFQ)
  app.get("/api/rfqs/:rfqId/quotations", async (req, res) => {
    try {
      const { rfqId } = req.params;

      // Get all quotations for this RFQ
      const quotations = await storage.getQuotations({ rfqId });

      // Sort by creation date (newest first)
      quotations.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      res.json({ quotations, rfqId });
    } catch (error: any) {
      console.error('Error fetching RFQ quotation history:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Customer accepts quotation (creates order)
  app.post("/api/inquiries/:id/accept-quotation", async (req, res) => {
    try {
      const { quotationId } = req.body;

      if (!quotationId) {
        return res.status(400).json({ error: "Quotation ID is required" });
      }

      // Get quotation details
      const quotation = await storage.getInquiryQuotation(quotationId);
      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }

      // Get inquiry details
      const inquiry = await storage.getInquiry(req.params.id);
      if (!inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create order with items
      const orderItems = [{
        productId: inquiry.productId,
        productName: inquiry.productName || 'Product',
        quantity: inquiry.quantity,
        unitPrice: parseFloat(quotation.pricePerUnit.toString()),
        totalPrice: parseFloat(quotation.totalPrice.toString())
      }];

      const order = await storage.createOrder({
        orderNumber,
        buyerId: (req.user as any)?.id || 'admin',
        inquiryId: req.params.id,
        quotationId,
        productId: inquiry.productId,
        quantity: inquiry.quantity,
        unitPrice: quotation.pricePerUnit,
        totalAmount: quotation.totalPrice,
        status: 'confirmed',
        paymentMethod: 'T/T',
        paymentStatus: 'pending',
        shippingAddress: null, // Will be filled later
        notes: `Order created from accepted quotation`,
        items: orderItems
      } as any);

      // Update quotation status to accepted
      await storage.updateInquiryQuotation(quotationId, { status: 'accepted' });

      // Update inquiry status to closed
      await storage.updateInquiryStatus(req.params.id, 'closed');

      res.json({ success: true, order });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Customer rejects quotation
  app.post("/api/inquiries/:id/reject-quotation", async (req, res) => {
    try {
      const { quotationId } = req.body;

      if (!quotationId) {
        return res.status(400).json({ error: "Quotation ID is required" });
      }

      // Update quotation status to rejected
      await storage.updateInquiryQuotation(quotationId, { status: 'rejected' });

      // Update inquiry status to negotiating (allows for counter-offer)
      await storage.updateInquiryStatus(req.params.id, 'negotiating');

      res.json({ success: true, message: "Quotation rejected. You can now send a counter-offer." });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Orders API - Enhanced for multi-vendor support
  app.post("/api/orders", async (req, res) => {
    try {
      const { quotationId, inquiryId, productId, quantity, unitPrice, totalAmount, shippingAddress, paymentMethod, buyerId, items } = req.body;

      if (!totalAmount) {
        return res.status(400).json({ error: "Total amount is required" });
      }

      // Handle multi-vendor cart items
      if (items && Array.isArray(items) && items.length > 0) {
        return await handleMultiVendorOrder(req, res);
      }

      // Single vendor order (legacy support)
      if (!quotationId || !productId || !quantity || !unitPrice) {
        return res.status(400).json({ error: "Missing required order fields" });
      }

      // Get product to determine supplier
      const product = await db.select().from(products).where(eq(products.id, productId)).limit(1);
      if (!product[0]) {
        return res.status(404).json({ error: "Product not found" });
      }

      const supplierId = product[0].supplierId;

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Calculate commission if supplier exists
      let commissionRate = 0;
      let commissionAmount = 0;
      let supplierAmount = parseFloat(totalAmount);

      if (supplierId) {
        const commissionSettings = await getCommissionSettings();
        const supplier = await db.select().from(supplierProfiles).where(eq(supplierProfiles.id, supplierId)).limit(1);

        if (supplier[0]) {
          commissionRate = supplier[0].customCommissionRate || getCommissionRateByTier(supplier[0].membershipTier, commissionSettings);
          commissionAmount = (parseFloat(totalAmount) * commissionRate) / 100;
          supplierAmount = parseFloat(totalAmount) - commissionAmount;
        }
      }

      // Create order with items
      const orderItems = [{
        productId: productId,
        productName: product[0].name || 'Product',
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
        totalPrice: parseFloat(totalAmount)
      }];

      const order = await storage.createOrder({
        orderNumber,
        buyerId: buyerId || req.user?.id || 'admin-created',
        supplierId,
        inquiryId,
        quotationId,
        productId,
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice).toString(),
        totalAmount: parseFloat(totalAmount).toString(),
        commissionRate: commissionRate,
        commissionAmount: commissionAmount.toString(),
        supplierAmount: supplierAmount.toString(),
        status: 'pending',
        paymentMethod: paymentMethod || 'T/T',
        paymentStatus: 'pending',
        shippingAddress: shippingAddress || null,
        notes: 'Order created from quotation',
        items: orderItems
      } as any);

      // Update quotation status to accepted if applicable
      if (quotationId) {
        await storage.updateInquiryQuotation(quotationId, { status: 'accepted' });
      }

      // Notify supplier if exists
      if (supplierId) {
        await notifySupplierNewOrder(supplierId, order);
      }

      res.status(201).json(order);
    } catch (error: any) {
      console.error('Error creating order:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      const { status, search } = req.query;
      const filters: any = {};

      // IMPORTANT: Get buyer ID from authenticated session
      // @ts-ignore - req.user is added by auth middleware
      const buyerId = req.user?.id;

      if (!buyerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      filters.buyerId = buyerId;

      if (status) {
        filters.status = status as string;
      }

      const orders = await storage.getOrdersWithDetails(filters);

      // Apply search filter if provided
      let filteredOrders = orders;
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filteredOrders = orders.filter((order: any) =>
          order.orderNumber?.toLowerCase().includes(searchLower) ||
          order.productName?.toLowerCase().includes(searchLower) ||
          order.trackingNumber?.toLowerCase().includes(searchLower)
        );
      }

      res.json({ orders: filteredOrders });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.updateOrder(req.params.id, req.body);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Removed admin order creation from quotation - now handled by suppliers directly

  // User accept order (Step 3: User accepts the order created by admin)
  app.post("/api/orders/:id/accept", async (req, res) => {
    try {
      const orderId = req.params.id;

      // Get the order
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check if user owns this order
      // @ts-ignore - req.user is added by auth middleware
      const buyerId = req.user?.id;
      if (order.buyerId !== buyerId) {
        return res.status(403).json({ error: "You can only accept your own orders" });
      }

      // Check if order is in pending_approval status
      if (order.status !== 'pending_approval') {
        return res.status(400).json({ error: "Only orders pending approval can be accepted" });
      }

      // Update order status to confirmed
      const updatedOrder = await storage.updateOrder(orderId, {
        status: 'confirmed',
        notes: (order.notes || '') + '\n\nOrder accepted by buyer.'
      });

      res.json({
        success: true,
        message: 'Order accepted successfully',
        order: updatedOrder
      });
    } catch (error: any) {
      console.error('Error accepting order:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin confirm order
  app.post("/api/orders/:id/confirm", async (req, res) => {
    try {
      const orderId = req.params.id;

      // Get the order
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Update order status to confirmed
      const updatedOrder = await storage.updateOrder(orderId, {
        status: 'confirmed',
        notes: 'Order confirmed by admin'
      });

      res.json({
        success: true,
        message: 'Order confirmed successfully',
        order: updatedOrder
      });
    } catch (error: any) {
      console.error('Error confirming order:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Orders API
  app.get("/api/admin/orders", async (req, res) => {
    try {
      const { status, search } = req.query;
      const filters: any = {};

      if (status && status !== 'all') {
        filters.status = status as string;
      }

      if (search) {
        filters.search = search as string;
      }

      const orders = await storage.getAdminOrders(filters);
      res.json({ orders });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/orders/:id", async (req, res) => {
    try {
      const order = await storage.updateOrder(req.params.id, req.body);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== CONVERSATIONS ====================

  app.get("/api/conversations/:userId", async (req, res) => {
    try {
      const { role } = req.query;
      if (!role || (role !== 'buyer' && role !== 'admin')) {
        return res.status(400).json({ error: "Role must be 'buyer' or 'admin'" });
      }

      const conversations = await storage.getConversations(req.params.userId, role as 'buyer' | 'admin');
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/conversations/get/:id", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const { buyerId } = req.body;
      if (!buyerId) {
        return res.status(400).json({ error: "buyerId is required" });
      }

      const conversation = await storage.getOrCreateConversation(buyerId);
      res.json(conversation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/conversations/:id", async (req, res) => {
    try {
      const validatedData = insertConversationSchema.partial().parse(req.body);
      const conversation = await storage.updateConversation(req.params.id, validatedData);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });


  // ==================== REVIEWS ====================

  app.get("/api/reviews", async (req, res) => {
    try {
      const { productId, buyerId } = req.query;
      const filters: any = {};
      if (productId) filters.productId = productId as string;
      if (buyerId) filters.buyerId = buyerId as string;

      const reviews = await storage.getReviews(filters);
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reviews/:id", async (req, res) => {
    try {
      const review = await storage.getReview(req.params.id);
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      res.json(review);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Product-scoped reviews (fetch by product)
  app.get("/api/products/:productId/reviews", async (req, res) => {
    try {
      const productId = req.params.productId;
      const reviews = await storage.getReviews({ productId });
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create review via product-scoped endpoint to avoid schema mismatches
  app.post("/api/products/:productId/reviews", authMiddleware, async (req, res) => {
    try {
      // @ts-ignore
      const buyerId = req.user?.id;
      const productId = req.params.productId;
      const body = z.object({
        rating: z.number().int().min(1).max(5),
        comment: z.string().optional()
      }).parse(req.body);

      // Prevent duplicate review by same buyer
      const existing = await storage.getReviews({ productId, buyerId });
      if (existing && existing.length > 0) {
        return res.status(409).json({ error: "You have already reviewed this product" });
      }

      const buyerOrders = await storage.getOrdersWithDetails({ buyerId });
      const eligibleOrder = (buyerOrders || []).find((o: any) => {
        const status = String(o.status || '').toLowerCase();
        if (!(status === 'shipped' || status === 'delivered')) return false;
        if (o.productId === productId) return true;
        try {
          const items = (o as any).items || [];
          return Array.isArray(items) && items.some((it: any) => it?.productId === productId);
        } catch {
          return false;
        }
      });

      if (!eligibleOrder) {
        return res.status(403).json({ error: "You can only review products after they are shipped or delivered" });
      }

      const created = await storage.createReview({
        productId,
        buyerId,
        rating: body.rating,
        comment: body.comment,
        orderReference: eligibleOrder.orderNumber || eligibleOrder.id,
      } as any);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Create review - only for authenticated buyers with shipped/delivered orders
  app.post("/api/reviews", authMiddleware, async (req, res) => {
    try {
      // @ts-ignore
      const buyerId = req.user?.id;
      // Validate minimal review payload (buyerId injected from session)
      const body = z.object({
        productId: z.string(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().optional()
      }).parse(req.body);

      if (body.buyerId && body.buyerId !== buyerId) {
        return res.status(403).json({ error: "Cannot review as a different user" });
      }

      if (!body.productId) {
        return res.status(400).json({ error: "productId is required" });
      }

      // Check if user already reviewed this product
      const existing = await storage.getReviews({ productId: body.productId, buyerId });
      if (existing && existing.length > 0) {
        return res.status(409).json({ error: "You have already reviewed this product" });
      }

      // Verify the buyer has an order that includes this product and is shipped or delivered
      const buyerOrders = await storage.getOrdersWithDetails({ buyerId });
      const eligibleOrder = (buyerOrders || []).find((o: any) => {
        const status = String(o.status || '').toLowerCase();
        if (!(status === 'shipped' || status === 'delivered')) return false;
        // Direct productId match or within items array
        if (o.productId === body.productId) return true;
        try {
          const items = (o as any).items || [];
          return Array.isArray(items) && items.some((it: any) => it?.productId === body.productId);
        } catch {
          return false;
        }
      });

      if (!eligibleOrder) {
        return res.status(403).json({ error: "You can only review products after they are shipped or delivered" });
      }

      // Determine supplier id (admin in this app) if not present on order
      let supplierId: string | undefined = (eligibleOrder as any).supplierId;
      if (!supplierId) {
        try {
          const [adminUser] = await db.select({ id: users.id }).from(users).where(eq(users.role as any, 'admin')).limit(1);
          supplierId = adminUser?.id;
        } catch { }
      }

      const reviewToCreate = {
        ...body,
        buyerId,
        supplierId: supplierId || 'admin',
        orderReference: eligibleOrder.orderNumber || eligibleOrder.id,
      } as any;

      const review = await storage.createReview(reviewToCreate);
      res.status(201).json(review);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ==================== FAVORITES ====================

  app.get("/api/favorites/:userId", async (req, res) => {
    try {
      const { itemType } = req.query;
      const favorites = await storage.getFavorites(
        req.params.userId,
        itemType as 'product' | undefined
      );
      res.json(favorites);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/favorites", async (req, res) => {
    try {
      const validatedData = insertFavoriteSchema.parse(req.body);
      // Check if already favorited
      const existing = await storage.getFavorite(validatedData.userId, validatedData.itemId);
      if (existing) {
        return res.status(409).json({ error: "Already favorited" });
      }

      const favorite = await storage.createFavorite(validatedData);
      res.status(201).json(favorite);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/favorites/:userId/:itemId", async (req, res) => {
    try {
      const success = await storage.deleteFavorite(req.params.userId, req.params.itemId);
      if (!success) {
        return res.status(404).json({ error: "Favorite not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // ==================== CUSTOMERS (Legacy) ====================

  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, validatedData);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const success = await storage.deleteCustomer(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // ==================== ORDERS ====================


  // Duplicate endpoint removed - using the one above with proper quotation handling

  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(req.params.id, validatedData);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const success = await storage.deleteOrder(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== ADMIN DASHBOARD APIs ====================

  // Test endpoint to verify server is working
  app.get("/api/admin/test", async (req, res) => {
    try {
      console.log('Admin test API called');
      res.json({
        success: true,
        message: "Admin API is working",
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error in test API:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get dashboard statistics
  app.get("/api/admin/dashboard/stats", async (req, res) => {
    try {
      console.log('Admin dashboard stats API called');

      if (!db) {
        return res.status(500).json({ error: 'Database connection not available' });
      }

      // Get total counts with proper error handling
      const [
        totalProductsResult,
        totalUsersResult,
        totalOrdersResult,
        totalInquiriesResult,
        totalQuotationsResult,
        revenueResult,
        pendingInquiriesResult,
        newUsersTodayResult,
        productsViewedResult
      ] = await Promise.all([
        db.select({ count: sql<string>`count(*)` }).from(products),
        db.select({ count: sql<string>`count(*)` }).from(users).where(eq(users.role, 'buyer')),
        db.select({ count: sql<string>`count(*)` }).from(orders),
        db.select({ count: sql<string>`count(*)` }).from(inquiries),
        db.select({ count: sql<string>`count(*)` }).from(quotations),
        db.select({
          total: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`
        }).from(orders).where(sql`${orders.status} IN ('completed', 'delivered')`),
        db.select({
          count: sql<string>`count(*)`
        }).from(inquiries).where(eq(inquiries.status, 'pending')),
        db.select({
          count: sql<string>`count(*)`
        }).from(users).where(
          and(
            eq(users.role, 'buyer'),
            sql`DATE(${users.createdAt}) = CURRENT_DATE`
          )
        ),
        db.select({
          total: sql<string>`coalesce(sum(${products.views}), 0)`
        }).from(products)
      ]);

      const statsData = {
        totalProducts: parseInt(totalProductsResult[0]?.count || '0'),
        totalUsers: parseInt(totalUsersResult[0]?.count || '0'),
        totalOrders: parseInt(totalOrdersResult[0]?.count || '0'),
        totalRevenue: parseFloat(revenueResult[0]?.total || '0'),
        pendingInquiries: parseInt(pendingInquiriesResult[0]?.count || '0'),
        totalQuotations: parseInt(totalQuotationsResult[0]?.count || '0'),
        newUsersToday: parseInt(newUsersTodayResult[0]?.count || '0'),
        productsViewed: parseInt(productsViewedResult[0]?.total || '0')
      };

      console.log('Stats data:', statsData);
      res.json(statsData);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ 
        error: 'Failed to fetch dashboard statistics',
        details: error.message 
      });
    }
  });

  // Get recent activity
  app.get("/api/admin/dashboard/activity", async (req, res) => {
    try {
      if (!db) {
        return res.status(500).json({ error: 'Database connection not available' });
      }

      const activities: any[] = [];

      // Get recent user registrations
      const recentUsers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          companyName: users.companyName,
          createdAt: users.createdAt
        })
        .from(users)
        .where(eq(users.role, 'buyer'))
        .orderBy(desc(users.createdAt))
        .limit(5);

      recentUsers.forEach(user => {
        activities.push({
          id: `user_${user.id}`,
          type: 'new_user',
          message: `New user ${user.firstName || 'User'} registered`,
          timestamp: user.createdAt,
          icon: 'Users',
          color: 'text-green-600'
        });
      });

      // Get recent inquiries
      const recentInquiries = await db
        .select({
          id: inquiries.id,
          productId: inquiries.productId,
          status: inquiries.status,
          quantity: inquiries.quantity,
          createdAt: inquiries.createdAt
        })
        .from(inquiries)
        .orderBy(desc(inquiries.createdAt))
        .limit(5);

      recentInquiries.forEach(inquiry => {
        activities.push({
          id: `inquiry_${inquiry.id}`,
          type: 'new_inquiry',
          message: `New inquiry for product ${inquiry.productId}`,
          timestamp: inquiry.createdAt,
          icon: 'MessageSquare',
          color: 'text-blue-600'
        });
      });

      // Get recent orders
      const recentOrders = await db
        .select({
          id: orders.id,
          status: orders.status,
          totalAmount: orders.totalAmount,
          createdAt: orders.createdAt
        })
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(3);

      recentOrders.forEach(order => {
        activities.push({
          id: `order_${order.id}`,
          type: 'order_completed',
          message: `Order #${order.id.slice(-6)} completed - $${order.totalAmount}`,
          timestamp: order.createdAt,
          icon: 'CheckCircle',
          color: 'text-green-600'
        });
      });

      // Sort by timestamp and return latest 10
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      res.json(activities.slice(0, 10));
    } catch (error: any) {
      console.error('Error fetching recent activity:', error);
      res.status(500).json({ 
        error: 'Failed to fetch recent activity',
        details: error.message 
      });
    }
  });

  // Get top performing products
  app.get("/api/admin/dashboard/top-products", async (req, res) => {
    try {
      if (!db) {
        return res.status(500).json({ error: 'Database connection not available' });
      }

      const topProducts = await db
        .select({
          id: products.id,
          name: products.name,
          views: sql<number>`count(distinct ${inquiries.buyerId})`,
          inquiries: sql<number>`count(${inquiries.id})`,
          orders: sql<number>`count(distinct ${orders.id})`,
          revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`
        })
        .from(products)
        .leftJoin(inquiries, eq(products.id, inquiries.productId))
        .leftJoin(orders, eq(products.id, orders.productId))
        .groupBy(products.id, products.name)
        .orderBy(desc(sql`count(${inquiries.id})`))
        .limit(10);

      // Calculate growth (mock for now - you can implement real growth calculation)
      const productsWithGrowth = topProducts.map((product, index) => ({
        ...product,
        growth: Math.random() * 20 - 10 // Random growth between -10% and +10%
      }));

      res.json(productsWithGrowth);
    } catch (error: any) {
      console.error('Error fetching top products:', error);
      res.status(500).json({ 
        error: 'Failed to fetch top products',
        details: error.message 
      });
    }
  });

  // Get recent inquiries
  app.get("/api/admin/dashboard/recent-inquiries", async (req, res) => {
    try {
      if (!db) {
        return res.status(500).json({ error: 'Database connection not available' });
      }

      const recentInquiries = await db
        .select({
          id: inquiries.id,
          productId: inquiries.productId,
          status: inquiries.status,
          quantity: inquiries.quantity,
          createdAt: inquiries.createdAt,
          buyerId: inquiries.buyerId,
          userName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
          companyName: users.companyName
        })
        .from(inquiries)
        .leftJoin(users, eq(inquiries.buyerId, users.id))
        .orderBy(desc(inquiries.createdAt))
        .limit(10);

      res.json(recentInquiries);
    } catch (error: any) {
      console.error('Error fetching recent inquiries:', error);
      res.status(500).json({ 
        error: 'Failed to fetch recent inquiries',
        details: error.message 
      });
    }
  });

  // Get analytics data
  app.get("/api/admin/dashboard/analytics", async (req, res) => {
    try {
      // Get monthly revenue for the last 6 months
      const monthlyRevenue = await db
        .select({
          month: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM')`,
          revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`
        })
        .from(orders)
        .where(
          and(
            eq(orders.status, 'completed'),
            gte(orders.createdAt, sql`now() - interval '6 months'`)
          )
        )
        .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`);

      // Get user registration trends
      const userTrends = await db
        .select({
          month: sql<string>`to_char(${users.createdAt}, 'YYYY-MM')`,
          count: sql<number>`count(*)`
        })
        .from(users)
        .where(
          and(
            eq(users.role, 'buyer'),
            gte(users.createdAt, sql`now() - interval '6 months'`)
          )
        )
        .groupBy(sql`to_char(${users.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${users.createdAt}, 'YYYY-MM')`);

      // Get category distribution
      const categoryDistribution = await db
        .select({
          categoryName: categories.name,
          productCount: sql<number>`count(${products.id})`,
          inquiryCount: sql<number>`count(distinct ${inquiries.id})`
        })
        .from(categories)
        .leftJoin(products, eq(categories.id, products.categoryId))
        .leftJoin(inquiries, eq(products.id, inquiries.productId))
        .groupBy(categories.id, categories.name)
        .orderBy(desc(sql`count(${products.id})`))
        .limit(10);

      res.json({
        monthlyRevenue,
        userTrends,
        categoryDistribution
      });
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== NOTIFICATION ROUTES ====================

  // Get buyer notifications
  app.get("/api/buyer/notifications", async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      console.log('=== FETCHING BUYER NOTIFICATIONS ===');
      console.log('User ID:', userId);

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt));

      console.log('Found notifications:', userNotifications.length);
      console.log('Notifications:', userNotifications);

      res.json({ notifications: userNotifications });
    } catch (error: any) {
      console.error('Error fetching buyer notifications:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get admin notifications
  app.get("/api/admin/notifications", async (req, res) => {
    try {
      const adminId = (req as any).user?.id;
      console.log('=== FETCHING ADMIN NOTIFICATIONS ===');
      console.log('Admin ID:', adminId);

      if (!adminId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const adminNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, adminId))
        .orderBy(desc(notifications.createdAt));

      console.log('Found admin notifications:', adminNotifications.length);
      console.log('Admin notifications:', adminNotifications);

      res.json({ notifications: adminNotifications });
    } catch (error: any) {
      console.error('Error fetching admin notifications:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/mark-all-read", async (req, res) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, userId));

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete notification
  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await db
        .delete(notifications)
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== ACTIVITY LOG ROUTES ====================

  // Get activity logs
  app.get("/api/admin/activity-logs", async (req, res) => {
    try {
      const adminId = (req as any).user?.id;
      if (!adminId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { search, type, admin } = req.query;

      // Build query with conditions
      let whereConditions = [];

      if (search) {
        whereConditions.push(
          or(
            ilike(activity_logs.action, `%${search}%`),
            ilike(activity_logs.description, `%${search}%`),
            ilike(activity_logs.entityName, `%${search}%`)
          )
        );
      }

      if (type && type !== 'all') {
        whereConditions.push(eq(activity_logs.entityType, type as string));
      }

      if (admin && admin !== 'all') {
        whereConditions.push(eq(activity_logs.adminId, admin as string));
      }

      const logs = await db
        .select()
        .from(activity_logs)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(activity_logs.createdAt));

      res.json({ logs });
    } catch (error: any) {
      console.error('Error fetching activity logs:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get admin users for filter
  app.get("/api/admin/users", async (req, res) => {
    try {
      const adminId = (req as any).user?.id;
      if (!adminId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const adminUsers = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role
        })
        .from(users)
        .where(eq(users.role, 'admin'));

      res.json({ users: adminUsers });
    } catch (error: any) {
      console.error('Error fetching admin users:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== NOTIFICATION HELPER FUNCTIONS ====================

  // Helper function to create notification
  async function createNotification(data: {
    userId: string;
    type: 'info' | 'success' | 'error' | 'warning';
    title: string;
    message: string;
    relatedId?: string;
    relatedType?: string;
  }) {
    try {
      console.log('=== CREATING NOTIFICATION ===');
      console.log('Notification data:', data);

      const result = await db.insert(notifications).values(data);
      console.log('Notification created successfully:', result);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // Helper function to create activity log
  async function createActivityLog(data: {
    adminId: string;
    adminName: string;
    action: string;
    description: string;
    entityType: string;
    entityId?: string;
    entityName?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await db.insert(activity_logs).values(data);
    } catch (error) {
      console.error('Error creating activity log:', error);
    }
  }

  // Test endpoint to create a notification
  app.post("/api/test/notification", async (req, res) => {
    try {
      const { userId, type = 'info', title, message } = req.body;

      if (!userId || !title || !message) {
        return res.status(400).json({ error: "userId, title, and message are required" });
      }

      await createNotification({
        userId,
        type,
        title,
        message,
        relatedId: 'test-' + Date.now(),
        relatedType: 'test'
      });

      res.json({ success: true, message: 'Test notification created' });
    } catch (error: any) {
      console.error('Error creating test notification:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get unseen notification count for current user
  app.get("/api/notifications/unseen-count", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        ));

      const count = result[0]?.count || 0;
      res.json({ count });
    } catch (error: any) {
      console.error('Error fetching unseen notification count:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get unseen chat count for current user
  app.get("/api/chat/unseen-count", async (req, res) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      let count = 0;

      if (userRole === 'admin') {
        // For admin, count unread messages from buyers
        // Note: unreadCountAdmin column actually stores adminId, not count
        // So we need to count unreadCountBuyer for conversations where adminId matches
        const result = await db
          .select({ count: sql<number>`sum(coalesce(cast(${conversations.unreadCountBuyer} as integer), 0))` })
          .from(conversations)
          .where(eq(conversations.unreadCountAdmin, userId));
        count = result[0]?.count || 0;
      } else {
        // For buyer, count unread messages from admin
        const result = await db
          .select({ count: sql<number>`sum(coalesce(cast(${conversations.unreadCountBuyer} as integer), 0))` })
          .from(conversations)
          .where(eq(conversations.buyerId, userId));
        count = result[0]?.count || 0;
      }

      res.json({ count });
    } catch (error: any) {
      console.error('Error fetching unseen chat count:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== SUPPLIER ORDER MANAGEMENT ENDPOINTS ====================

  // Get orders for a specific supplier
  app.get("/api/suppliers/:supplierId/orders", authMiddleware, async (req, res) => {
    try {
      const { supplierId } = req.params;
      const { status, search, limit, offset } = req.query;

      // Check if user has permission to view supplier orders
      if (req.user?.role === 'supplier') {
        // Verify supplier owns this profile
        const [supplierProfile] = await db.select()
          .from(supplierProfiles)
          .where(and(
            eq(supplierProfiles.id, supplierId),
            eq(supplierProfiles.userId, req.user.id)
          ))
          .limit(1);

        if (!supplierProfile) {
          return res.status(403).json({ error: "Access denied to this supplier's orders" });
        }
      } else if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      // Build query conditions
      const conditions = [eq(orders.supplierId, supplierId)];

      if (status && status !== 'all') {
        conditions.push(eq(orders.status, status as string));
      }

      let query = db.select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        buyerId: orders.buyerId,
        parentOrderId: orders.parentOrderId,
        productId: orders.productId,
        quantity: orders.quantity,
        unitPrice: orders.unitPrice,
        totalAmount: orders.totalAmount,
        commissionRate: orders.commissionRate,
        commissionAmount: orders.commissionAmount,
        supplierAmount: orders.supplierAmount,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        shippingAddress: orders.shippingAddress,
        trackingNumber: orders.trackingNumber,
        notes: orders.notes,
        items: orders.items,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        // Buyer information
        buyerFirstName: users.firstName,
        buyerLastName: users.lastName,
        buyerEmail: users.email,
        buyerCompanyName: users.companyName,
        buyerPhone: users.phone
      })
        .from(orders)
        .leftJoin(users, eq(orders.buyerId, users.id))
        .where(and(...conditions));

      // Add search filter
      if (search) {
        const searchPattern = `%${search}%`;
        const searchConditions = [
          ...conditions,
          or(
            ilike(orders.orderNumber, searchPattern),
            ilike(users.firstName, searchPattern),
            ilike(users.lastName, searchPattern),
            ilike(users.companyName, searchPattern)
          )
        ];
        query = query.where(and(...searchConditions));
      } else if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Add ordering
      query = query.orderBy(desc(orders.createdAt));

      // Add pagination
      if (limit) {
        query = query.limit(parseInt(limit as string));
      }
      if (offset) {
        query = query.offset(parseInt(offset as string));
      }

      const supplierOrders = await query;

      // Get total count for pagination
      let countQuery = db.select({ count: sql`count(*)` })
        .from(orders)
        .leftJoin(users, eq(orders.buyerId, users.id))
        .where(and(...conditions));

      if (search) {
        const searchPattern = `%${search}%`;
        const searchConditions = [
          ...conditions,
          or(
            ilike(orders.orderNumber, searchPattern),
            ilike(users.firstName, searchPattern),
            ilike(users.lastName, searchPattern),
            ilike(users.companyName, searchPattern)
          )
        ];
        countQuery = countQuery.where(and(...searchConditions));
      } else if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }

      const [{ count }] = await countQuery;
      const total = parseInt(count as string);

      res.json({
        orders: supplierOrders,
        total,
        page: offset ? Math.floor(parseInt(offset as string) / (parseInt(limit as string) || 20)) + 1 : 1,
        limit: limit ? parseInt(limit as string) : 20
      });

    } catch (error: any) {
      console.error('Error fetching supplier orders:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update order status by supplier
  app.patch("/api/suppliers/:supplierId/orders/:orderId/status", authMiddleware, async (req, res) => {
    try {
      const { supplierId, orderId } = req.params;
      const { status, trackingNumber, notes } = req.body;

      // Check if user has permission to update supplier orders
      if (req.user?.role === 'supplier') {
        // Verify supplier owns this profile
        const [supplierProfile] = await db.select()
          .from(supplierProfiles)
          .where(and(
            eq(supplierProfiles.id, supplierId),
            eq(supplierProfiles.userId, req.user.id)
          ))
          .limit(1);

        if (!supplierProfile) {
          return res.status(403).json({ error: "Access denied to this supplier's orders" });
        }
      } else if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      // Verify order belongs to supplier
      const [order] = await db.select()
        .from(orders)
        .where(and(
          eq(orders.id, orderId),
          eq(orders.supplierId, supplierId)
        ))
        .limit(1);

      if (!order) {
        return res.status(404).json({ error: "Order not found or access denied" });
      }

      // Validate status transition
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid order status" });
      }

      // Update order
      const updateData: any = { status };
      if (trackingNumber) updateData.trackingNumber = trackingNumber;
      if (notes) updateData.notes = notes;

      const [updatedOrder] = await db.update(orders)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(orders.id, orderId))
        .returning();

      // Notify buyer of status change
      await db.insert(notifications).values({
        userId: order.buyerId,
        type: 'info',
        title: 'Order Status Updated',
        message: `Your order #${order.orderNumber} status has been updated to ${status}`,
        relatedId: orderId,
        relatedType: 'order'
      });

      res.json(updatedOrder);

    } catch (error: any) {
      console.error('Error updating order status:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get order details for supplier
  app.get("/api/suppliers/:supplierId/orders/:orderId", authMiddleware, async (req, res) => {
    try {
      const { supplierId, orderId } = req.params;

      // Check if user has permission to view supplier orders
      if (req.user?.role === 'supplier') {
        // Verify supplier owns this profile
        const [supplierProfile] = await db.select()
          .from(supplierProfiles)
          .where(and(
            eq(supplierProfiles.id, supplierId),
            eq(supplierProfiles.userId, req.user.id)
          ))
          .limit(1);

        if (!supplierProfile) {
          return res.status(403).json({ error: "Access denied to this supplier's orders" });
        }
      } else if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get order with buyer and product details
      const [orderDetails] = await db.select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        buyerId: orders.buyerId,
        parentOrderId: orders.parentOrderId,
        productId: orders.productId,
        quantity: orders.quantity,
        unitPrice: orders.unitPrice,
        totalAmount: orders.totalAmount,
        commissionRate: orders.commissionRate,
        commissionAmount: orders.commissionAmount,
        supplierAmount: orders.supplierAmount,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        shippingAddress: orders.shippingAddress,
        trackingNumber: orders.trackingNumber,
        notes: orders.notes,
        items: orders.items,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        // Buyer information
        buyerFirstName: users.firstName,
        buyerLastName: users.lastName,
        buyerEmail: users.email,
        buyerCompanyName: users.companyName,
        buyerPhone: users.phone,
        // Product information
        productName: products.name,
        productSlug: products.slug,
        productImages: products.images
      })
        .from(orders)
        .leftJoin(users, eq(orders.buyerId, users.id))
        .leftJoin(products, eq(orders.productId, products.id))
        .where(and(
          eq(orders.id, orderId),
          eq(orders.supplierId, supplierId)
        ))
        .limit(1);

      if (!orderDetails) {
        return res.status(404).json({ error: "Order not found or access denied" });
      }

      res.json(orderDetails);

    } catch (error: any) {
      console.error('Error fetching order details:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Send message to customer for order
  app.post("/api/suppliers/:supplierId/orders/:orderId/message", authMiddleware, async (req, res) => {
    try {
      const { supplierId, orderId } = req.params;
      const { message, type } = req.body;

      // Check if user has permission to send messages for supplier orders
      if (req.user?.role === 'supplier') {
        // Verify supplier owns this profile
        const [supplierProfile] = await db.select()
          .from(supplierProfiles)
          .where(and(
            eq(supplierProfiles.id, supplierId),
            eq(supplierProfiles.userId, req.user.id)
          ))
          .limit(1);

        if (!supplierProfile) {
          return res.status(403).json({ error: "Access denied to this supplier's orders" });
        }
      } else if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      // Verify order belongs to supplier
      const [order] = await db.select()
        .from(orders)
        .where(and(
          eq(orders.id, orderId),
          eq(orders.supplierId, supplierId)
        ))
        .limit(1);

      if (!order) {
        return res.status(404).json({ error: "Order not found or access denied" });
      }

      // Create notification for buyer
      const messageTitle = type === 'shipping' ? 'Shipping Update' :
        type === 'support' ? 'Customer Support Message' :
          'Order Update';

      await db.insert(notifications).values({
        userId: order.buyerId,
        type: 'info',
        title: messageTitle,
        message: `Message regarding order #${order.orderNumber}: ${message}`,
        relatedId: orderId,
        relatedType: 'order'
      });

      // TODO: In a real implementation, you might want to:
      // 1. Send email notification to buyer
      // 2. Create a conversation/message thread
      // 3. Store the message in a messages table

      res.json({ success: true, message: 'Message sent successfully' });

    } catch (error: any) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== ENHANCED SUPPLIER ORDER MANAGEMENT ENDPOINTS ====================

  // Get order analytics for supplier
  app.get("/api/suppliers/:supplierId/orders/analytics", authMiddleware, async (req, res) => {
    try {
      const { supplierId } = req.params;
      const { period = 'month' } = req.query;

      // Check permissions
      if (req.user?.role === 'supplier') {
        const [supplierProfile] = await db.select()
          .from(supplierProfiles)
          .where(and(
            eq(supplierProfiles.id, supplierId),
            eq(supplierProfiles.userId, req.user.id)
          ))
          .limit(1);

        if (!supplierProfile) {
          return res.status(403).json({ error: "Access denied to this supplier's analytics" });
        }
      } else if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      // Calculate date range based on period
      let startDate = new Date();
      switch (period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1);
      }

      // Get order statistics
      const [orderStats] = await db.select({
        totalOrders: sql<number>`count(*)`,
        completedOrders: sql<number>`count(case when status = 'delivered' then 1 end)`,
        pendingOrders: sql<number>`count(case when status in ('pending', 'confirmed', 'processing') then 1 end)`,
        cancelledOrders: sql<number>`count(case when status = 'cancelled' then 1 end)`,
        totalRevenue: sql<number>`sum(${orders.supplierAmount})`,
        averageOrderValue: sql<number>`avg(${orders.supplierAmount})`
      })
        .from(orders)
        .where(and(
          eq(orders.supplierId, supplierId),
          gte(orders.createdAt, startDate)
        ));

      // Calculate performance metrics
      const fulfillmentRate = orderStats.totalOrders > 0 
        ? (orderStats.completedOrders / orderStats.totalOrders) * 100 
        : 0;

      // Get daily trends
      const dailyTrends = await db.select({
        date: sql<string>`DATE(${orders.createdAt})`,
        orders: sql<number>`count(*)`,
        revenue: sql<number>`sum(${orders.supplierAmount})`
      })
        .from(orders)
        .where(and(
          eq(orders.supplierId, supplierId),
          gte(orders.createdAt, startDate)
        ))
        .groupBy(sql`DATE(${orders.createdAt})`)
        .orderBy(sql`DATE(${orders.createdAt})`);

      // Mock additional metrics (in production, these would come from actual data)
      const analytics = {
        totalOrders: orderStats.totalOrders || 0,
        completedOrders: orderStats.completedOrders || 0,
        pendingOrders: orderStats.pendingOrders || 0,
        cancelledOrders: orderStats.cancelledOrders || 0,
        totalRevenue: Number(orderStats.totalRevenue) || 0,
        averageOrderValue: Number(orderStats.averageOrderValue) || 0,
        fulfillmentRate,
        onTimeDeliveryRate: 87.5, // Mock data
        customerSatisfactionScore: 4.3, // Mock data
        trends: {
          daily: dailyTrends.map(trend => ({
            date: trend.date,
            orders: trend.orders,
            revenue: Number(trend.revenue) || 0
          })),
          monthly: [] // Could add monthly aggregation
        }
      };

      res.json(analytics);

    } catch (error: any) {
      console.error('Error fetching order analytics:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get fulfillment workflow for an order
  app.get("/api/suppliers/:supplierId/orders/:orderId/fulfillment", authMiddleware, async (req, res) => {
    try {
      const { supplierId, orderId } = req.params;

      // Check permissions
      if (req.user?.role === 'supplier') {
        const [supplierProfile] = await db.select()
          .from(supplierProfiles)
          .where(and(
            eq(supplierProfiles.id, supplierId),
            eq(supplierProfiles.userId, req.user.id)
          ))
          .limit(1);

        if (!supplierProfile) {
          return res.status(403).json({ error: "Access denied to this supplier's orders" });
        }
      } else if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get order details
      const [order] = await db.select()
        .from(orders)
        .where(and(
          eq(orders.id, orderId),
          eq(orders.supplierId, supplierId)
        ))
        .limit(1);

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Define fulfillment stages
      const allStages = ['pending', 'confirmed', 'preparing', 'packed', 'shipped', 'delivered'];
      const currentStageIndex = allStages.indexOf(order.status);

      const stages = allStages.map((stage, index) => ({
        name: stage,
        status: index < currentStageIndex ? 'completed' : 
                index === currentStageIndex ? 'current' : 'pending',
        completedAt: index < currentStageIndex ? order.updatedAt : undefined,
        estimatedCompletion: index === currentStageIndex + 1 ? 
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined
      }));

      const workflow = {
        orderId: order.id,
        currentStage: order.status,
        stages
      };

      res.json(workflow);

    } catch (error: any) {
      console.error('Error fetching fulfillment workflow:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update fulfillment stage
  app.patch("/api/suppliers/:supplierId/orders/:orderId/fulfillment", authMiddleware, async (req, res) => {
    try {
      const { supplierId, orderId } = req.params;
      const { stage, notes } = req.body;

      // Check permissions
      if (req.user?.role === 'supplier') {
        const [supplierProfile] = await db.select()
          .from(supplierProfiles)
          .where(and(
            eq(supplierProfiles.id, supplierId),
            eq(supplierProfiles.userId, req.user.id)
          ))
          .limit(1);

        if (!supplierProfile) {
          return res.status(403).json({ error: "Access denied to this supplier's orders" });
        }
      } else if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      // Verify order belongs to supplier
      const [order] = await db.select()
        .from(orders)
        .where(and(
          eq(orders.id, orderId),
          eq(orders.supplierId, supplierId)
        ))
        .limit(1);

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Validate stage transition
      const validStages = ['pending', 'confirmed', 'preparing', 'packed', 'shipped', 'delivered'];
      if (!validStages.includes(stage)) {
        return res.status(400).json({ error: "Invalid fulfillment stage" });
      }

      // Update order status based on fulfillment stage
      let orderStatus = stage;
      if (stage === 'preparing' || stage === 'packed') {
        orderStatus = 'processing';
      }

      const updateData: any = { 
        status: orderStatus,
        updatedAt: new Date()
      };
      
      if (notes) {
        updateData.notes = notes;
      }

      const [updatedOrder] = await db.update(orders)
        .set(updateData)
        .where(eq(orders.id, orderId))
        .returning();

      // Notify buyer of fulfillment progress
      await db.insert(notifications).values({
        userId: order.buyerId,
        type: 'info',
        title: 'Order Fulfillment Update',
        message: `Your order #${order.orderNumber} is now in ${stage} stage`,
        relatedId: orderId,
        relatedType: 'order'
      });

      res.json(updatedOrder);

    } catch (error: any) {
      console.error('Error updating fulfillment stage:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Export order data
  app.get("/api/suppliers/:supplierId/orders/export", authMiddleware, async (req, res) => {
    try {
      const { supplierId } = req.params;
      const { status, dateFilter } = req.query;

      // Check permissions
      if (req.user?.role === 'supplier') {
        const [supplierProfile] = await db.select()
          .from(supplierProfiles)
          .where(and(
            eq(supplierProfiles.id, supplierId),
            eq(supplierProfiles.userId, req.user.id)
          ))
          .limit(1);

        if (!supplierProfile) {
          return res.status(403).json({ error: "Access denied to this supplier's orders" });
        }
      } else if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      // Build query conditions
      const conditions = [eq(orders.supplierId, supplierId)];

      if (status && status !== 'all') {
        conditions.push(eq(orders.status, status as string));
      }

      if (dateFilter && dateFilter !== 'all') {
        let startDate = new Date();
        switch (dateFilter) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case 'quarter':
            startDate.setMonth(startDate.getMonth() - 3);
            break;
        }
        conditions.push(gte(orders.createdAt, startDate));
      }

      // Get orders with buyer information
      const exportOrders = await db.select({
        orderNumber: orders.orderNumber,
        buyerName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        buyerEmail: users.email,
        buyerCompany: users.companyName,
        totalAmount: orders.totalAmount,
        supplierAmount: orders.supplierAmount,
        commissionAmount: orders.commissionAmount,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        trackingNumber: orders.trackingNumber,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt
      })
        .from(orders)
        .leftJoin(users, eq(orders.buyerId, users.id))
        .where(and(...conditions))
        .orderBy(desc(orders.createdAt));

      // Convert to CSV
      const csvHeaders = [
        'Order Number',
        'Buyer Name',
        'Buyer Email',
        'Buyer Company',
        'Total Amount',
        'Supplier Amount',
        'Commission Amount',
        'Status',
        'Payment Status',
        'Tracking Number',
        'Created At',
        'Updated At'
      ];

      const csvRows = exportOrders.map(order => [
        order.orderNumber,
        order.buyerName || '',
        order.buyerEmail || '',
        order.buyerCompany || '',
        order.totalAmount,
        order.supplierAmount,
        order.commissionAmount,
        order.status,
        order.paymentStatus,
        order.trackingNumber || '',
        order.createdAt?.toISOString() || '',
        order.updatedAt?.toISOString() || ''
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="orders-${supplierId}-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);

    } catch (error: any) {
      console.error('Error exporting order data:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== HELPER FUNCTIONS FOR MULTI-VENDOR ORDERS ====================

  // Get commission settings from database
  async function getCommissionSettings() {
    try {
      const [settings] = await db.select().from(commissionSettings).limit(1);
      return settings || {
        defaultRate: 5.0,
        freeRate: 5.0,
        silverRate: 3.0,
        goldRate: 2.0,
        platinumRate: 1.5,
        categoryRates: {},
        vendorOverrides: {}
      };
    } catch (error) {
      console.error('Error fetching commission settings:', error);
      return {
        defaultRate: 5.0,
        freeRate: 5.0,
        silverRate: 3.0,
        goldRate: 2.0,
        platinumRate: 1.5,
        categoryRates: {},
        vendorOverrides: {}
      };
    }
  }

  // Get commission rate by membership tier
  function getCommissionRateByTier(tier: string, settings: any): number {
    switch (tier) {
      case 'free': return settings.freeRate || 5.0;
      case 'silver': return settings.silverRate || 3.0;
      case 'gold': return settings.goldRate || 2.0;
      case 'platinum': return settings.platinumRate || 1.5;
      default: return settings.defaultRate || 5.0;
    }
  }

  // Notify supplier of new order
  async function notifySupplierNewOrder(supplierId: string, order: any) {
    try {
      // Get supplier user ID
      const [supplier] = await db.select({ userId: supplierProfiles.userId })
        .from(supplierProfiles)
        .where(eq(supplierProfiles.id, supplierId))
        .limit(1);

      if (supplier) {
        await db.insert(notifications).values({
          userId: supplier.userId,
          type: 'info',
          title: 'New Order Received',
          message: `You have received a new order #${order.orderNumber}`,
          relatedId: order.id,
          relatedType: 'order'
        });
      }
    } catch (error) {
      console.error('Error notifying supplier:', error);
    }
  }

  // Handle multi-vendor order creation
  async function handleMultiVendorOrder(req: any, res: any) {
    try {
      const { items, shippingAddress, paymentMethod, buyerId } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Items array is required for multi-vendor orders" });
      }

      // Group items by supplier
      const supplierGroups = new Map<string, any[]>();
      const adminItems: any[] = [];

      for (const item of items) {
        // Get product to determine supplier
        const [product] = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
        if (!product) {
          return res.status(404).json({ error: `Product not found: ${item.productId}` });
        }

        const supplierId = product.supplierId;
        if (supplierId) {
          if (!supplierGroups.has(supplierId)) {
            supplierGroups.set(supplierId, []);
          }
          supplierGroups.get(supplierId)!.push({
            ...item,
            product,
            supplierId
          });
        } else {
          // Admin-managed products (legacy)
          adminItems.push({
            ...item,
            product,
            supplierId: null
          });
        }
      }

      const createdOrders = [];
      const commissionSettings = await getCommissionSettings();

      // Create parent order for tracking
      const parentOrderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const totalOrderAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

      const parentOrder = await storage.createOrder({
        orderNumber: parentOrderNumber,
        buyerId: buyerId || req.user?.id || 'admin-created',
        supplierId: null,
        parentOrderId: null,
        productId: null,
        quantity: null,
        unitPrice: null,
        totalAmount: totalOrderAmount.toString(),
        commissionRate: 0,
        commissionAmount: "0",
        supplierAmount: totalOrderAmount.toString(),
        status: 'pending',
        paymentMethod: paymentMethod || 'T/T',
        paymentStatus: 'pending',
        shippingAddress: shippingAddress || null,
        notes: 'Multi-vendor parent order',
        items: items
      } as any);

      createdOrders.push(parentOrder);

      // Create separate orders for each supplier
      for (const [supplierId, supplierItems] of Array.from(supplierGroups.entries())) {
        const supplierOrderTotal = supplierItems.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);

        // Get supplier info for commission calculation
        const [supplier] = await db.select().from(supplierProfiles).where(eq(supplierProfiles.id, supplierId)).limit(1);

        let commissionRate = 0;
        let commissionAmount = 0;
        let supplierAmount = supplierOrderTotal;

        if (supplier) {
          commissionRate = supplier.customCommissionRate || getCommissionRateByTier(supplier.membershipTier, commissionSettings);
          commissionAmount = (supplierOrderTotal * commissionRate) / 100;
          supplierAmount = supplierOrderTotal - commissionAmount;
        }

        const supplierOrderNumber = `${parentOrderNumber}-S${supplierGroups.size > 1 ? Array.from(supplierGroups.keys()).indexOf(supplierId) + 1 : ''}`;

        const supplierOrder = await storage.createOrder({
          orderNumber: supplierOrderNumber,
          buyerId: buyerId || req.user?.id || 'admin-created',
          supplierId: supplierId,
          parentOrderId: parentOrder.id,
          productId: supplierItems[0].productId, // Primary product for compatibility
          quantity: supplierItems.reduce((sum: number, item: any) => sum + item.quantity, 0),
          unitPrice: (supplierOrderTotal / supplierItems.reduce((sum: number, item: any) => sum + item.quantity, 0)).toString(),
          totalAmount: supplierOrderTotal.toString(),
          commissionRate: commissionRate,
          commissionAmount: commissionAmount.toString(),
          supplierAmount: supplierAmount.toString(),
          status: 'pending',
          paymentMethod: paymentMethod || 'T/T',
          paymentStatus: 'pending',
          shippingAddress: shippingAddress || null,
          notes: `Split order from parent ${parentOrderNumber}`,
          items: supplierItems.map((item: any) => ({
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice
          }))
        } as any);

        createdOrders.push(supplierOrder);

        // Notify supplier
        await notifySupplierNewOrder(supplierId, supplierOrder);
      }

      // Handle admin items if any
      if (adminItems.length > 0) {
        const adminOrderTotal = adminItems.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
        const adminOrderNumber = `${parentOrderNumber}-ADMIN`;

        const adminOrder = await storage.createOrder({
          orderNumber: adminOrderNumber,
          buyerId: buyerId || req.user?.id || 'admin-created',
          supplierId: null,
          parentOrderId: parentOrder.id,
          productId: adminItems[0].productId,
          quantity: adminItems.reduce((sum: number, item: any) => sum + item.quantity, 0),
          unitPrice: (adminOrderTotal / adminItems.reduce((sum: number, item: any) => sum + item.quantity, 0)).toString(),
          totalAmount: adminOrderTotal.toString(),
          commissionRate: 0,
          commissionAmount: "0",
          supplierAmount: adminOrderTotal.toString(),
          status: 'pending',
          paymentMethod: paymentMethod || 'T/T',
          paymentStatus: 'pending',
          shippingAddress: shippingAddress || null,
          notes: `Admin items from parent ${parentOrderNumber}`,
          items: adminItems.map((item: any) => ({
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice
          }))
        } as any);

        createdOrders.push(adminOrder);
      }

      res.status(201).json({
        message: 'Multi-vendor order created successfully',
        parentOrder,
        splitOrders: createdOrders.slice(1), // Exclude parent order
        totalOrders: createdOrders.length
      });

    } catch (error: any) {
      console.error('Error creating multi-vendor order:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // ==================== BUYER ORDER TRACKING ROUTES ====================

  // Get buyer's orders with multivendor support
  app.get("/api/buyers/:buyerId/orders", authMiddleware, async (req, res) => {
    try {
      const { buyerId } = req.params;
      const { status, search, limit = "20", offset = "0" } = req.query;

      // Check if user has permission to view these orders
      if (req.user?.role === 'buyer' && req.user.id !== buyerId) {
        return res.status(403).json({ error: "Access denied to these orders" });
      }

      const conditions = [eq(orders.buyerId, buyerId)];

      if (status && status !== 'all') {
        conditions.push(eq(orders.status, status as string));
      }

      let query = db.select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        parentOrderId: orders.parentOrderId,
        parentOrderNumber: sql<string>`
          CASE 
            WHEN ${orders.parentOrderId} IS NOT NULL 
            THEN (SELECT order_number FROM orders WHERE id = ${orders.parentOrderId})
            ELSE NULL 
          END
        `,
        supplierId: orders.supplierId,
        supplierName: sql<string>`
          CASE 
            WHEN ${orders.supplierId} IS NOT NULL 
            THEN (SELECT business_name FROM supplier_profiles WHERE id = ${orders.supplierId})
            ELSE 'Platform Store'
          END
        `,
        supplierLocation: sql<string>`
          CASE 
            WHEN ${orders.supplierId} IS NOT NULL 
            THEN (SELECT city || ', ' || country FROM supplier_profiles WHERE id = ${orders.supplierId})
            ELSE NULL
          END
        `,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        totalAmount: orders.totalAmount,
        trackingNumber: orders.trackingNumber,
        items: orders.items,
        shippingAddress: orders.shippingAddress,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt
      })
        .from(orders)
        .where(and(...conditions))
        .orderBy(desc(orders.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      if (search) {
        const searchPattern = `%${search}%`;
        query = query.where(and(
          ...conditions,
          or(
            ilike(orders.orderNumber, searchPattern),
            sql`EXISTS (
              SELECT 1 FROM supplier_profiles sp 
              WHERE sp.id = ${orders.supplierId} 
              AND sp.business_name ILIKE ${searchPattern}
            )`,
            sql`EXISTS (
              SELECT 1 FROM jsonb_array_elements(${orders.items}) AS item
              WHERE item->>'productName' ILIKE ${searchPattern}
            )`
          )
        ));
      }

      const result = await query;

      // Get total count
      let countQuery = db.select({ count: sql`count(*)` })
        .from(orders)
        .where(and(...conditions));

      if (search) {
        const searchPattern = `%${search}%`;
        countQuery = countQuery.where(and(
          ...conditions,
          or(
            ilike(orders.orderNumber, searchPattern),
            sql`EXISTS (
              SELECT 1 FROM supplier_profiles sp 
              WHERE sp.id = ${orders.supplierId} 
              AND sp.business_name ILIKE ${searchPattern}
            )`,
            sql`EXISTS (
              SELECT 1 FROM jsonb_array_elements(${orders.items}) AS item
              WHERE item->>'productName' ILIKE ${searchPattern}
            )`
          )
        ));
      }

      const [{ count }] = await countQuery;
      const total = parseInt(count as string);

      res.json({
        orders: result,
        total,
        page: Math.floor(parseInt(offset as string) / parseInt(limit as string)) + 1,
        limit: parseInt(limit as string),
        hasMore: parseInt(offset as string) + parseInt(limit as string) < total
      });

    } catch (error: any) {
      console.error('Error fetching buyer orders:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get order messages for communication
  app.get("/api/orders/:orderId/messages", authMiddleware, async (req, res) => {
    try {
      const { orderId } = req.params;

      // Verify user has access to this order
      const [order] = await db.select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check permissions
      if (req.user?.role === 'buyer' && req.user.id !== order.buyerId) {
        return res.status(403).json({ error: "Access denied to this order" });
      }

      if (req.user?.role === 'supplier') {
        const [supplierProfile] = await db.select()
          .from(supplierProfiles)
          .where(and(
            eq(supplierProfiles.id, order.supplierId || ''),
            eq(supplierProfiles.userId, req.user.id)
          ))
          .limit(1);

        if (!supplierProfile) {
          return res.status(403).json({ error: "Access denied to this order" });
        }
      }

      // For now, return mock messages since we don't have a messages table yet
      // In a real implementation, you would query the messages table
      const mockMessages = [
        {
          id: '1',
          orderId,
          senderId: order.buyerId,
          senderName: 'Buyer',
          senderType: 'buyer',
          message: 'Order placed successfully. Looking forward to receiving the products.',
          type: 'general',
          createdAt: order.createdAt
        }
      ];

      res.json({ messages: mockMessages });

    } catch (error: any) {
      console.error('Error fetching order messages:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Send message about an order
  app.post("/api/orders/:orderId/messages", authMiddleware, async (req, res) => {
    try {
      const { orderId } = req.params;
      const { message, type, recipientType, recipientId } = req.body;

      if (!message?.trim()) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Verify user has access to this order
      const [order] = await db.select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check permissions
      if (req.user?.role === 'buyer' && req.user.id !== order.buyerId) {
        return res.status(403).json({ error: "Access denied to this order" });
      }

      if (req.user?.role === 'supplier') {
        const [supplierProfile] = await db.select()
          .from(supplierProfiles)
          .where(and(
            eq(supplierProfiles.id, order.supplierId || ''),
            eq(supplierProfiles.userId, req.user.id)
          ))
          .limit(1);

        if (!supplierProfile) {
          return res.status(403).json({ error: "Access denied to this order" });
        }
      }

      // Create notification for the recipient
      let recipientUserId = '';
      let notificationTitle = '';

      if (recipientType === 'supplier' && order.supplierId) {
        const [supplier] = await db.select({ userId: supplierProfiles.userId })
          .from(supplierProfiles)
          .where(eq(supplierProfiles.id, order.supplierId))
          .limit(1);
        
        if (supplier) {
          recipientUserId = supplier.userId;
          notificationTitle = 'New Message About Order';
        }
      } else if (recipientType === 'buyer') {
        recipientUserId = order.buyerId;
        notificationTitle = 'New Message About Order';
      }

      if (recipientUserId) {
        await db.insert(notifications).values({
          userId: recipientUserId,
          type: 'info',
          title: notificationTitle,
          message: `New message regarding order #${order.orderNumber}: ${message}`,
          relatedId: orderId,
          relatedType: 'order'
        });
      }

      // In a real implementation, you would also store the message in a messages table
      // For now, we'll just create the notification

      res.json({ 
        success: true, 
        message: 'Message sent successfully',
        messageId: `msg_${Date.now()}`
      });

    } catch (error: any) {
      console.error('Error sending order message:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get split orders for a parent order
  app.get("/api/orders/:parentOrderId/split-orders", authMiddleware, async (req, res) => {
    try {
      const { parentOrderId } = req.params;

      // Verify parent order exists and user has access
      const [parentOrder] = await db.select()
        .from(orders)
        .where(eq(orders.id, parentOrderId))
        .limit(1);

      if (!parentOrder) {
        return res.status(404).json({ error: "Parent order not found" });
      }

      if (req.user?.role === 'buyer' && req.user.id !== parentOrder.buyerId) {
        return res.status(403).json({ error: "Access denied to this order" });
      }

      const splitOrders = await db.select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        supplierId: orders.supplierId,
        supplierName: sql<string>`
          CASE 
            WHEN ${orders.supplierId} IS NOT NULL 
            THEN (SELECT business_name FROM supplier_profiles WHERE id = ${orders.supplierId})
            ELSE 'Platform Store'
          END
        `,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        totalAmount: orders.totalAmount,
        trackingNumber: orders.trackingNumber,
        items: orders.items,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt
      })
        .from(orders)
        .where(eq(orders.parentOrderId, parentOrderId))
        .orderBy(orders.createdAt);

      res.json({ 
        parentOrder,
        splitOrders,
        totalOrders: splitOrders.length + 1
      });

    } catch (error: any) {
      console.error('Error fetching split orders:', error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
