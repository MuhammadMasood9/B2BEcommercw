import express from 'express';
import { complianceAuditService } from './complianceAuditService';
import { requireAuth } from './auth';

const router = express.Router();

// Middleware to ensure admin access
const requireAdminAuth = (req: any, res: any, next: any) => {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};

// ==================== AUDIT LOGS ====================

/**
 * Search audit logs with filtering and pagination
 */
router.get('/audit-logs/search', requireAdminAuth, async (req, res) => {
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
      page,
      limit,
      sortBy,
      sortOrder
    } = req.query;

    const params: any = {};
    if (eventType) params.eventType = eventType as string;
    if (category) params.category = category as string;
    if (actorId) params.actorId = actorId as string;
    if (targetType) params.targetType = targetType as string;
    if (targetId) params.targetId = targetId as string;
    if (riskLevel) params.riskLevel = riskLevel as string;
    if (startDate) params.startDate = new Date(startDate as string);
    if (endDate) params.endDate = new Date(endDate as string);
    if (complianceTags) {
      params.complianceTags = Array.isArray(complianceTags) 
        ? complianceTags as string[]
        : [complianceTags as string];
    }
    if (page) params.page = parseInt(page as string);
    if (limit) params.limit = parseInt(limit as string);
    if (sortBy) params.sortBy = sortBy as string;
    if (sortOrder) params.sortOrder = sortOrder as 'asc' | 'desc';

    const result = await complianceAuditService.searchAuditLogs(params);
    res.json(result);
  } catch (error) {
    console.error('Error searching audit logs:', error);
    res.status(500).json({ error: 'Failed to search audit logs' });
  }
});

/**
 * Verify audit chain integrity
 */
router.post('/audit-logs/verify-integrity', requireAdminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    const result = await complianceAuditService.verifyAuditChainIntegrity(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error verifying audit chain integrity:', error);
    res.status(500).json({ error: 'Failed to verify audit chain integrity' });
  }
});

/**
 * Create manual audit log entry
 */
router.post('/audit-logs', requireAdminAuth, async (req, res) => {
  try {
    const auditLogData = {
      ...req.body,
      actorId: req.user.id,
      actorType: 'admin',
      actorName: `${req.user.firstName} ${req.user.lastName}` || req.user.email
    };

    const auditLogId = await complianceAuditService.createAuditLog(auditLogData);
    res.status(201).json({ id: auditLogId, message: 'Audit log created successfully' });
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({ error: 'Failed to create audit log' });
  }
});

// ==================== COMPLIANCE POLICIES ====================

/**
 * Get all compliance policies
 */
router.get('/policies', requireAdminAuth, async (req, res) => {
  try {
    const { policyType, framework, status } = req.query;
    
    const filters: any = {};
    if (policyType) filters.policyType = policyType as string;
    if (framework) filters.framework = framework as string;
    if (status) filters.status = status as string;

    const policies = await complianceAuditService.getCompliancePolicies(filters);
    res.json(policies);
  } catch (error) {
    console.error('Error getting compliance policies:', error);
    res.status(500).json({ error: 'Failed to get compliance policies' });
  }
});

/**
 * Create compliance policy
 */
router.post('/policies', requireAdminAuth, async (req, res) => {
  try {
    const policyData = {
      ...req.body,
      createdBy: req.user.id
    };

    const policyId = await complianceAuditService.createCompliancePolicy(policyData);
    res.status(201).json({ id: policyId, message: 'Compliance policy created successfully' });
  } catch (error) {
    console.error('Error creating compliance policy:', error);
    res.status(500).json({ error: 'Failed to create compliance policy' });
  }
});

// ==================== COMPLIANCE VIOLATIONS ====================

/**
 * Get compliance violations
 */
router.get('/violations', requireAdminAuth, async (req, res) => {
  try {
    const {
      policyId,
      severity,
      status,
      assignedTo,
      startDate,
      endDate,
      page,
      limit
    } = req.query;

    const filters: any = {};
    if (policyId) filters.policyId = policyId as string;
    if (severity) filters.severity = severity as string;
    if (status) filters.status = status as string;
    if (assignedTo) filters.assignedTo = assignedTo as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (page) filters.page = parseInt(page as string);
    if (limit) filters.limit = parseInt(limit as string);

    const result = await complianceAuditService.getComplianceViolations(filters);
    res.json(result);
  } catch (error) {
    console.error('Error getting compliance violations:', error);
    res.status(500).json({ error: 'Failed to get compliance violations' });
  }
});

/**
 * Create compliance violation
 */
router.post('/violations', requireAdminAuth, async (req, res) => {
  try {
    const violationId = await complianceAuditService.createComplianceViolation(req.body);
    res.status(201).json({ id: violationId, message: 'Compliance violation created successfully' });
  } catch (error) {
    console.error('Error creating compliance violation:', error);
    res.status(500).json({ error: 'Failed to create compliance violation' });
  }
});

/**
 * Update compliance violation status
 */
router.put('/violations/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, resolutionSummary } = req.body;

    const result = await complianceAuditService.updateComplianceViolationStatus(
      id,
      status,
      assignedTo,
      resolutionSummary,
      req.user.id
    );

    res.json({ message: 'Compliance violation updated successfully', data: result });
  } catch (error) {
    console.error('Error updating compliance violation:', error);
    res.status(500).json({ error: 'Failed to update compliance violation' });
  }
});

// ==================== DATA RETENTION ====================

/**
 * Get data retention policies
 */
router.get('/data-retention/policies', requireAdminAuth, async (req, res) => {
  try {
    const { dataType, isActive } = req.query;
    
    const filters: any = {};
    if (dataType) filters.dataType = dataType as string;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const policies = await complianceAuditService.getDataRetentionPolicies(filters);
    res.json(policies);
  } catch (error) {
    console.error('Error getting data retention policies:', error);
    res.status(500).json({ error: 'Failed to get data retention policies' });
  }
});

/**
 * Create data retention policy
 */
router.post('/data-retention/policies', requireAdminAuth, async (req, res) => {
  try {
    const policyData = {
      ...req.body,
      createdBy: req.user.id
    };

    const policyId = await complianceAuditService.createDataRetentionPolicy(policyData);
    res.status(201).json({ id: policyId, message: 'Data retention policy created successfully' });
  } catch (error) {
    console.error('Error creating data retention policy:', error);
    res.status(500).json({ error: 'Failed to create data retention policy' });
  }
});

// ==================== AUDIT REPORTS ====================

/**
 * Get audit reports
 */
router.get('/reports', requireAdminAuth, async (req, res) => {
  try {
    const { reportType, status, generatedBy, page, limit } = req.query;
    
    const filters: any = {};
    if (reportType) filters.reportType = reportType as string;
    if (status) filters.status = status as string;
    if (generatedBy) filters.generatedBy = generatedBy as string;
    if (page) filters.page = parseInt(page as string);
    if (limit) filters.limit = parseInt(limit as string);

    const result = await complianceAuditService.getAuditReports(filters);
    res.json(result);
  } catch (error) {
    console.error('Error getting audit reports:', error);
    res.status(500).json({ error: 'Failed to get audit reports' });
  }
});

/**
 * Generate audit report
 */
router.post('/reports/generate', requireAdminAuth, async (req, res) => {
  try {
    const reportData = {
      ...req.body,
      generatedBy: req.user.id
    };

    const reportId = await complianceAuditService.generateAuditReport(reportData);
    res.status(201).json({ id: reportId, message: 'Audit report generation started' });
  } catch (error) {
    console.error('Error generating audit report:', error);
    res.status(500).json({ error: 'Failed to generate audit report' });
  }
});

// ==================== COMPLIANCE METRICS ====================

/**
 * Get compliance dashboard metrics
 */
router.get('/metrics/dashboard', requireAdminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateRange = (startDate && endDate) ? {
      start: new Date(startDate as string),
      end: new Date(endDate as string)
    } : undefined;

    const metrics = await complianceAuditService.getComplianceDashboardMetrics(dateRange);
    res.json(metrics);
  } catch (error) {
    console.error('Error getting compliance metrics:', error);
    res.status(500).json({ error: 'Failed to get compliance metrics' });
  }
});

// ==================== LEGAL HOLDS ====================

/**
 * Get legal holds
 */
router.get('/legal-holds', requireAdminAuth, async (req, res) => {
  try {
    const { status, issuedBy } = req.query;
    
    const filters: any = {};
    if (status) filters.status = status as string;
    if (issuedBy) filters.issuedBy = issuedBy as string;

    const legalHolds = await complianceAuditService.getLegalHolds(filters);
    res.json(legalHolds);
  } catch (error) {
    console.error('Error getting legal holds:', error);
    res.status(500).json({ error: 'Failed to get legal holds' });
  }
});

/**
 * Create legal hold
 */
router.post('/legal-holds', requireAdminAuth, async (req, res) => {
  try {
    const holdData = {
      ...req.body,
      createdBy: req.user.id
    };

    const holdId = await complianceAuditService.createLegalHold(holdData);
    res.status(201).json({ id: holdId, message: 'Legal hold created successfully' });
  } catch (error) {
    console.error('Error creating legal hold:', error);
    res.status(500).json({ error: 'Failed to create legal hold' });
  }
});

export default router;