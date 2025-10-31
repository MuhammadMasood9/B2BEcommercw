import { db } from './db';
import { 
  comprehensiveAuditLogs, 
  compliancePolicies, 
  complianceViolations, 
  dataRetentionPolicies, 
  dataRetentionSchedules, 
  auditReports, 
  complianceMetrics, 
  legalHolds,
  type InsertComprehensiveAuditLog,
  type InsertCompliancePolicy,
  type InsertComplianceViolation,
  type InsertDataRetentionPolicy,
  type InsertDataRetentionSchedule,
  type InsertAuditReport,
  type InsertLegalHold
} from '../shared/schema';
import { eq, and, gte, lte, desc, asc, sql, count, avg, sum } from 'drizzle-orm';
import crypto from 'crypto';

export class ComplianceAuditService {
  
  // ==================== AUDIT LOGGING ====================
  
  /**
   * Create an immutable audit log entry
   */
  async createAuditLog(logData: Omit<InsertComprehensiveAuditLog, 'recordHash' | 'previousRecordHash'>): Promise<string> {
    try {
      // Get the hash of the previous record for chain integrity
      const lastRecord = await db
        .select({ recordHash: comprehensiveAuditLogs.recordHash })
        .from(comprehensiveAuditLogs)
        .orderBy(desc(comprehensiveAuditLogs.createdAt))
        .limit(1);

      const previousRecordHash = lastRecord[0]?.recordHash || null;

      // Create hash of current record
      const recordContent = JSON.stringify({
        ...logData,
        previousRecordHash,
        timestamp: new Date().toISOString()
      });
      const recordHash = crypto.createHash('sha256').update(recordContent).digest('hex');

      const auditLog: InsertComprehensiveAuditLog = {
        ...logData,
        recordHash,
        previousRecordHash
      };

      const result = await db.insert(comprehensiveAuditLogs).values(auditLog).returning({ id: comprehensiveAuditLogs.id });
      return result[0].id;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      throw new Error('Failed to create audit log');
    }
  }

  /**
   * Search audit logs with filtering and pagination
   */
  async searchAuditLogs(params: {
    eventType?: string;
    category?: string;
    actorId?: string;
    targetType?: string;
    targetId?: string;
    riskLevel?: string;
    startDate?: Date;
    endDate?: Date;
    complianceTags?: string[];
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    try {
      const {
        eventType,
        category,
        actorId,
        targetType,
        targetId,
        riskLevel,
        startDate,
        endDate,
        complianceTags,
        page = 1,
        limit = 50,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = params;

      let query = db.select().from(comprehensiveAuditLogs);
      const conditions = [];

      if (eventType) conditions.push(eq(comprehensiveAuditLogs.eventType, eventType));
      if (category) conditions.push(eq(comprehensiveAuditLogs.category, category));
      if (actorId) conditions.push(eq(comprehensiveAuditLogs.actorId, actorId));
      if (targetType) conditions.push(eq(comprehensiveAuditLogs.targetType, targetType));
      if (targetId) conditions.push(eq(comprehensiveAuditLogs.targetId, targetId));
      if (riskLevel) conditions.push(eq(comprehensiveAuditLogs.riskLevel, riskLevel));
      if (startDate) conditions.push(gte(comprehensiveAuditLogs.createdAt, startDate));
      if (endDate) conditions.push(lte(comprehensiveAuditLogs.createdAt, endDate));
      if (complianceTags && complianceTags.length > 0) {
        conditions.push(sql`${comprehensiveAuditLogs.complianceTags} && ${complianceTags}`);
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = comprehensiveAuditLogs[sortBy as keyof typeof comprehensiveAuditLogs] || comprehensiveAuditLogs.createdAt;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const results = await query;

      // Get total count for pagination
      const totalQuery = db.select({ count: count() }).from(comprehensiveAuditLogs);
      if (conditions.length > 0) {
        totalQuery.where(and(...conditions));
      }
      const totalResult = await totalQuery;
      const total = totalResult[0].count;

      return {
        data: results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Failed to search audit logs:', error);
      throw new Error('Failed to search audit logs');
    }
  }

  /**
   * Verify audit log chain integrity
   */
  async verifyAuditChainIntegrity(startDate?: Date, endDate?: Date): Promise<{
    isValid: boolean;
    brokenChains: string[];
    totalRecords: number;
    verifiedRecords: number;
  }> {
    try {
      let query = db
        .select({
          id: comprehensiveAuditLogs.id,
          recordHash: comprehensiveAuditLogs.recordHash,
          previousRecordHash: comprehensiveAuditLogs.previousRecordHash,
          createdAt: comprehensiveAuditLogs.createdAt
        })
        .from(comprehensiveAuditLogs)
        .orderBy(asc(comprehensiveAuditLogs.createdAt));

      if (startDate || endDate) {
        const conditions = [];
        if (startDate) conditions.push(gte(comprehensiveAuditLogs.createdAt, startDate));
        if (endDate) conditions.push(lte(comprehensiveAuditLogs.createdAt, endDate));
        query = query.where(and(...conditions));
      }

      const records = await query;
      const brokenChains: string[] = [];
      let verifiedRecords = 0;

      for (let i = 1; i < records.length; i++) {
        const currentRecord = records[i];
        const previousRecord = records[i - 1];

        if (currentRecord.previousRecordHash !== previousRecord.recordHash) {
          brokenChains.push(currentRecord.id);
        } else {
          verifiedRecords++;
        }
      }

      return {
        isValid: brokenChains.length === 0,
        brokenChains,
        totalRecords: records.length,
        verifiedRecords
      };
    } catch (error) {
      console.error('Failed to verify audit chain integrity:', error);
      throw new Error('Failed to verify audit chain integrity');
    }
  }

  // ==================== COMPLIANCE POLICIES ====================

  /**
   * Create a compliance policy
   */
  async createCompliancePolicy(policyData: InsertCompliancePolicy): Promise<string> {
    try {
      const result = await db.insert(compliancePolicies).values(policyData).returning({ id: compliancePolicies.id });
      
      // Log the policy creation
      await this.createAuditLog({
        eventType: 'admin_action',
        category: 'compliance',
        title: 'Compliance Policy Created',
        description: `Created compliance policy: ${policyData.name}`,
        action: 'create_compliance_policy',
        actorId: policyData.createdBy,
        actorType: 'admin',
        actorName: 'Admin User',
        targetType: 'compliance_policy',
        targetId: result[0].id,
        targetName: policyData.name,
        newState: policyData,
        complianceTags: [policyData.framework],
        riskLevel: 'medium'
      });

      return result[0].id;
    } catch (error) {
      console.error('Failed to create compliance policy:', error);
      throw new Error('Failed to create compliance policy');
    }
  }

  /**
   * Get all compliance policies
   */
  async getCompliancePolicies(filters?: {
    policyType?: string;
    framework?: string;
    status?: string;
  }) {
    try {
      let query = db.select().from(compliancePolicies);
      const conditions = [];

      if (filters?.policyType) conditions.push(eq(compliancePolicies.policyType, filters.policyType));
      if (filters?.framework) conditions.push(eq(compliancePolicies.framework, filters.framework));
      if (filters?.status) conditions.push(eq(compliancePolicies.status, filters.status));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      return await query.orderBy(desc(compliancePolicies.createdAt));
    } catch (error) {
      console.error('Failed to get compliance policies:', error);
      throw new Error('Failed to get compliance policies');
    }
  }

  // ==================== COMPLIANCE VIOLATIONS ====================

  /**
   * Create a compliance violation
   */
  async createComplianceViolation(violationData: InsertComplianceViolation): Promise<string> {
    try {
      const result = await db.insert(complianceViolations).values(violationData).returning({ id: complianceViolations.id });
      
      // Log the violation creation
      await this.createAuditLog({
        eventType: 'compliance_event',
        category: 'compliance',
        title: 'Compliance Violation Detected',
        description: `Detected compliance violation: ${violationData.title}`,
        action: 'create_compliance_violation',
        actorId: 'system',
        actorType: 'system',
        actorName: 'Compliance System',
        targetType: violationData.entityType || 'unknown',
        targetId: violationData.entityId,
        targetName: violationData.entityName,
        newState: violationData,
        complianceTags: ['violation'],
        riskLevel: violationData.severity === 'critical' ? 'critical' : violationData.severity === 'high' ? 'high' : 'medium'
      });

      return result[0].id;
    } catch (error) {
      console.error('Failed to create compliance violation:', error);
      throw new Error('Failed to create compliance violation');
    }
  }

  /**
   * Get compliance violations with filtering
   */
  async getComplianceViolations(filters?: {
    policyId?: string;
    severity?: string;
    status?: string;
    assignedTo?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    try {
      const {
        policyId,
        severity,
        status,
        assignedTo,
        startDate,
        endDate,
        page = 1,
        limit = 50
      } = filters || {};

      let query = db.select().from(complianceViolations);
      const conditions = [];

      if (policyId) conditions.push(eq(complianceViolations.policyId, policyId));
      if (severity) conditions.push(eq(complianceViolations.severity, severity));
      if (status) conditions.push(eq(complianceViolations.status, status));
      if (assignedTo) conditions.push(eq(complianceViolations.assignedTo, assignedTo));
      if (startDate) conditions.push(gte(complianceViolations.detectedAt, startDate));
      if (endDate) conditions.push(lte(complianceViolations.detectedAt, endDate));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const offset = (page - 1) * limit;
      const results = await query
        .orderBy(desc(complianceViolations.detectedAt))
        .limit(limit)
        .offset(offset);

      // Get total count
      const totalQuery = db.select({ count: count() }).from(complianceViolations);
      if (conditions.length > 0) {
        totalQuery.where(and(...conditions));
      }
      const totalResult = await totalQuery;
      const total = totalResult[0].count;

      return {
        data: results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Failed to get compliance violations:', error);
      throw new Error('Failed to get compliance violations');
    }
  }

  /**
   * Update compliance violation status
   */
  async updateComplianceViolationStatus(
    violationId: string, 
    status: string, 
    assignedTo?: string, 
    resolutionSummary?: string,
    adminId?: string
  ) {
    try {
      const updateData: any = { 
        status, 
        updatedAt: new Date() 
      };

      if (assignedTo) updateData.assignedTo = assignedTo;
      if (resolutionSummary) updateData.resolutionSummary = resolutionSummary;
      if (status === 'resolved') updateData.resolvedAt = new Date();

      const result = await db
        .update(complianceViolations)
        .set(updateData)
        .where(eq(complianceViolations.id, violationId))
        .returning();

      // Log the status update
      if (adminId) {
        await this.createAuditLog({
          eventType: 'admin_action',
          category: 'compliance',
          title: 'Compliance Violation Updated',
          description: `Updated compliance violation status to: ${status}`,
          action: 'update_compliance_violation',
          actorId: adminId,
          actorType: 'admin',
          actorName: 'Admin User',
          targetType: 'compliance_violation',
          targetId: violationId,
          newState: updateData,
          complianceTags: ['violation_update'],
          riskLevel: 'low'
        });
      }

      return result[0];
    } catch (error) {
      console.error('Failed to update compliance violation:', error);
      throw new Error('Failed to update compliance violation');
    }
  }

  // ==================== DATA RETENTION ====================

  /**
   * Create data retention policy
   */
  async createDataRetentionPolicy(policyData: InsertDataRetentionPolicy): Promise<string> {
    try {
      const result = await db.insert(dataRetentionPolicies).values(policyData).returning({ id: dataRetentionPolicies.id });
      
      // Log the policy creation
      await this.createAuditLog({
        eventType: 'admin_action',
        category: 'compliance',
        title: 'Data Retention Policy Created',
        description: `Created data retention policy: ${policyData.name}`,
        action: 'create_retention_policy',
        actorId: policyData.createdBy,
        actorType: 'admin',
        actorName: 'Admin User',
        targetType: 'retention_policy',
        targetId: result[0].id,
        targetName: policyData.name,
        newState: policyData,
        complianceTags: ['data_retention'],
        riskLevel: 'medium'
      });

      return result[0].id;
    } catch (error) {
      console.error('Failed to create data retention policy:', error);
      throw new Error('Failed to create data retention policy');
    }
  }

  /**
   * Get data retention policies
   */
  async getDataRetentionPolicies(filters?: {
    dataType?: string;
    isActive?: boolean;
  }) {
    try {
      let query = db.select().from(dataRetentionPolicies);
      const conditions = [];

      if (filters?.dataType) conditions.push(eq(dataRetentionPolicies.dataType, filters.dataType));
      if (filters?.isActive !== undefined) conditions.push(eq(dataRetentionPolicies.isActive, filters.isActive));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      return await query.orderBy(desc(dataRetentionPolicies.priority), desc(dataRetentionPolicies.createdAt));
    } catch (error) {
      console.error('Failed to get data retention policies:', error);
      throw new Error('Failed to get data retention policies');
    }
  }

  // ==================== AUDIT REPORTS ====================

  /**
   * Generate audit report
   */
  async generateAuditReport(reportData: InsertAuditReport): Promise<string> {
    try {
      const result = await db.insert(auditReports).values({
        ...reportData,
        status: 'generating'
      }).returning({ id: auditReports.id });

      const reportId = result[0].id;

      // Log the report generation request
      await this.createAuditLog({
        eventType: 'admin_action',
        category: 'compliance',
        title: 'Audit Report Generation Started',
        description: `Started generating audit report: ${reportData.name}`,
        action: 'generate_audit_report',
        actorId: reportData.generatedBy,
        actorType: 'admin',
        actorName: 'Admin User',
        targetType: 'audit_report',
        targetId: reportId,
        targetName: reportData.name,
        newState: reportData,
        complianceTags: ['audit_report'],
        riskLevel: 'low'
      });

      // Start background report generation (simplified for this implementation)
      this.processAuditReportGeneration(reportId, reportData);

      return reportId;
    } catch (error) {
      console.error('Failed to generate audit report:', error);
      throw new Error('Failed to generate audit report');
    }
  }

  /**
   * Process audit report generation (background task)
   */
  private async processAuditReportGeneration(reportId: string, reportData: InsertAuditReport) {
    try {
      // Simulate report generation process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get audit data based on report parameters
      const auditData = await this.searchAuditLogs({
        startDate: reportData.dateRangeStart,
        endDate: reportData.dateRangeEnd,
        limit: 10000 // Large limit for report generation
      });

      // Update report status to completed
      await db
        .update(auditReports)
        .set({
          status: 'completed',
          generatedAt: new Date(),
          recordCount: auditData.data.length,
          filePath: `/reports/audit_${reportId}.${reportData.format}`,
          fileSizeBytes: auditData.data.length * 1024 // Estimated size
        })
        .where(eq(auditReports.id, reportId));

      // Log completion
      await this.createAuditLog({
        eventType: 'system_event',
        category: 'compliance',
        title: 'Audit Report Generated',
        description: `Completed audit report generation: ${reportData.name}`,
        action: 'complete_audit_report',
        actorId: 'system',
        actorType: 'system',
        actorName: 'Report Generator',
        targetType: 'audit_report',
        targetId: reportId,
        targetName: reportData.name,
        complianceTags: ['audit_report'],
        riskLevel: 'low'
      });

    } catch (error) {
      console.error('Failed to process audit report generation:', error);
      
      // Update report status to failed
      await db
        .update(auditReports)
        .set({
          status: 'failed'
        })
        .where(eq(auditReports.id, reportId));
    }
  }

  /**
   * Get audit reports
   */
  async getAuditReports(filters?: {
    reportType?: string;
    status?: string;
    generatedBy?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const {
        reportType,
        status,
        generatedBy,
        page = 1,
        limit = 20
      } = filters || {};

      let query = db.select().from(auditReports);
      const conditions = [];

      if (reportType) conditions.push(eq(auditReports.reportType, reportType));
      if (status) conditions.push(eq(auditReports.status, status));
      if (generatedBy) conditions.push(eq(auditReports.generatedBy, generatedBy));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const offset = (page - 1) * limit;
      const results = await query
        .orderBy(desc(auditReports.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count
      const totalQuery = db.select({ count: count() }).from(auditReports);
      if (conditions.length > 0) {
        totalQuery.where(and(...conditions));
      }
      const totalResult = await totalQuery;
      const total = totalResult[0].count;

      return {
        data: results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Failed to get audit reports:', error);
      throw new Error('Failed to get audit reports');
    }
  }

  // ==================== COMPLIANCE METRICS ====================

  /**
   * Get compliance dashboard metrics
   */
  async getComplianceDashboardMetrics(dateRange?: { start: Date; end: Date }) {
    try {
      const now = new Date();
      const startDate = dateRange?.start || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const endDate = dateRange?.end || now;

      // Get violation counts by severity
      const violationCounts = await db
        .select({
          severity: complianceViolations.severity,
          count: count()
        })
        .from(complianceViolations)
        .where(and(
          gte(complianceViolations.detectedAt, startDate),
          lte(complianceViolations.detectedAt, endDate)
        ))
        .groupBy(complianceViolations.severity);

      // Get audit activity metrics
      const auditActivity = await db
        .select({
          eventType: comprehensiveAuditLogs.eventType,
          count: count()
        })
        .from(comprehensiveAuditLogs)
        .where(and(
          gte(comprehensiveAuditLogs.createdAt, startDate),
          lte(comprehensiveAuditLogs.createdAt, endDate)
        ))
        .groupBy(comprehensiveAuditLogs.eventType);

      // Get resolution metrics
      const resolutionMetrics = await db
        .select({
          avgResolutionTime: avg(sql`EXTRACT(EPOCH FROM (${complianceViolations.resolvedAt} - ${complianceViolations.detectedAt})) / 3600`),
          resolvedCount: count(complianceViolations.resolvedAt),
          totalCount: count()
        })
        .from(complianceViolations)
        .where(and(
          gte(complianceViolations.detectedAt, startDate),
          lte(complianceViolations.detectedAt, endDate)
        ));

      // Get active policies count
      const activePolicies = await db
        .select({ count: count() })
        .from(compliancePolicies)
        .where(eq(compliancePolicies.status, 'active'));

      return {
        violationCounts,
        auditActivity,
        resolutionMetrics: resolutionMetrics[0],
        activePoliciesCount: activePolicies[0].count,
        dateRange: { start: startDate, end: endDate }
      };
    } catch (error) {
      console.error('Failed to get compliance dashboard metrics:', error);
      throw new Error('Failed to get compliance dashboard metrics');
    }
  }

  // ==================== LEGAL HOLDS ====================

  /**
   * Create legal hold
   */
  async createLegalHold(holdData: InsertLegalHold): Promise<string> {
    try {
      const result = await db.insert(legalHolds).values(holdData).returning({ id: legalHolds.id });
      
      // Log the legal hold creation
      await this.createAuditLog({
        eventType: 'admin_action',
        category: 'compliance',
        title: 'Legal Hold Created',
        description: `Created legal hold: ${holdData.name}`,
        action: 'create_legal_hold',
        actorId: holdData.createdBy,
        actorType: 'admin',
        actorName: 'Admin User',
        targetType: 'legal_hold',
        targetId: result[0].id,
        targetName: holdData.name,
        newState: holdData,
        complianceTags: ['legal_hold'],
        riskLevel: 'high'
      });

      return result[0].id;
    } catch (error) {
      console.error('Failed to create legal hold:', error);
      throw new Error('Failed to create legal hold');
    }
  }

  /**
   * Get legal holds
   */
  async getLegalHolds(filters?: {
    status?: string;
    issuedBy?: string;
  }) {
    try {
      let query = db.select().from(legalHolds);
      const conditions = [];

      if (filters?.status) conditions.push(eq(legalHolds.status, filters.status));
      if (filters?.issuedBy) conditions.push(eq(legalHolds.issuedBy, filters.issuedBy));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      return await query.orderBy(desc(legalHolds.issuedDate));
    } catch (error) {
      console.error('Failed to get legal holds:', error);
      throw new Error('Failed to get legal holds');
    }
  }
}

export const complianceAuditService = new ComplianceAuditService();