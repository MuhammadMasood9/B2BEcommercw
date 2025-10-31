import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { adminMiddleware, authMiddleware } from './auth';
import { securityMonitoringService } from './securityMonitoringService';
import { requirePermission } from './permissionMiddleware';

const router = Router();

// ==================== VALIDATION SCHEMAS ====================

const complianceReportSchema = z.object({
  reportType: z.enum(['access_review', 'privilege_audit', 'security_incidents', 'data_access_log']),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
});

const threatAnalysisSchema = z.object({
  timeWindow: z.number().min(1).max(168).default(24), // Hours, max 1 week
  includeResolved: z.boolean().default(false),
});

// ==================== THREAT DETECTION ROUTES ====================

// GET /api/admin/security/threats - Get detected security threats
router.get('/threats', authMiddleware, adminMiddleware, requirePermission('security', 'read'), async (req: Request, res: Response) => {
  try {
    const threats = await securityMonitoringService.detectSecurityThreats();
    
    res.json({
      success: true,
      threats,
      summary: {
        total: threats.length,
        critical: threats.filter(t => t.severity === 'critical').length,
        high: threats.filter(t => t.severity === 'high').length,
        medium: threats.filter(t => t.severity === 'medium').length,
        low: threats.filter(t => t.severity === 'low').length,
      },
    });
  } catch (error) {
    console.error('Get threats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch security threats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/admin/security/scan - Run automated security scan
router.post('/scan', authMiddleware, adminMiddleware, requirePermission('security', 'write'), async (req: Request, res: Response) => {
  try {
    const scanResult = await securityMonitoringService.runAutomatedSecurityScan();
    
    res.json({
      success: true,
      scanResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Security scan error:', error);
    res.status(500).json({ 
      error: 'Failed to run security scan',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== ACCESS PATTERN ANALYSIS ROUTES ====================

// GET /api/admin/security/patterns - Get access pattern analysis
router.get('/patterns', authMiddleware, adminMiddleware, requirePermission('security', 'read'), async (req: Request, res: Response) => {
  try {
    const { adminUserId } = req.query;
    
    const patterns = await securityMonitoringService.analyzeAccessPatterns();
    
    // Filter by admin user if specified
    const filteredPatterns = adminUserId 
      ? patterns.filter(p => p.adminUserId === adminUserId)
      : patterns;
    
    const anomalousPatterns = filteredPatterns.filter(p => p.isAnomaly);
    
    res.json({
      success: true,
      patterns: filteredPatterns,
      anomalies: anomalousPatterns,
      summary: {
        totalPatterns: filteredPatterns.length,
        anomalousPatterns: anomalousPatterns.length,
        highConfidenceAnomalies: anomalousPatterns.filter(p => p.confidence > 0.8).length,
      },
    });
  } catch (error) {
    console.error('Get patterns error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch access patterns',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/admin/security/patterns/:adminUserId - Get patterns for specific admin
router.get('/patterns/:adminUserId', authMiddleware, adminMiddleware, requirePermission('security', 'read'), async (req: Request, res: Response) => {
  try {
    const { adminUserId } = req.params;
    
    const patterns = await securityMonitoringService.analyzeAccessPatterns();
    const userPatterns = patterns.filter(p => p.adminUserId === adminUserId);
    
    res.json({
      success: true,
      adminUserId,
      patterns: userPatterns,
      anomalies: userPatterns.filter(p => p.isAnomaly),
    });
  } catch (error) {
    console.error('Get user patterns error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user access patterns',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== COMPLIANCE REPORTING ROUTES ====================

// POST /api/admin/security/compliance/report - Generate compliance report
router.post('/compliance/report', authMiddleware, adminMiddleware, requirePermission('security', 'read'), async (req: Request, res: Response) => {
  try {
    const validationResult = complianceReportSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid report parameters', 
        details: validationResult.error.errors 
      });
    }

    const { reportType, startDate, endDate } = validationResult.data;
    
    // Validate date range
    if (startDate >= endDate) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }
    
    const maxDays = 90; // Maximum 90 days
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > maxDays) {
      return res.status(400).json({ error: `Date range cannot exceed ${maxDays} days` });
    }
    
    const report = await securityMonitoringService.generateComplianceReport(reportType, startDate, endDate);
    
    res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Generate compliance report error:', error);
    res.status(500).json({ 
      error: 'Failed to generate compliance report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/admin/security/compliance/summary - Get compliance summary
router.get('/compliance/summary', authMiddleware, adminMiddleware, requirePermission('security', 'read'), async (req: Request, res: Response) => {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    
    // Generate multiple report types for summary
    const [accessReport, privilegeReport, securityReport, dataReport] = await Promise.all([
      securityMonitoringService.generateComplianceReport('access_review', startDate, endDate),
      securityMonitoringService.generateComplianceReport('privilege_audit', startDate, endDate),
      securityMonitoringService.generateComplianceReport('security_incidents', startDate, endDate),
      securityMonitoringService.generateComplianceReport('data_access_log', startDate, endDate),
    ]);
    
    // Aggregate findings
    const allFindings = [
      ...accessReport.findings,
      ...privilegeReport.findings,
      ...securityReport.findings,
      ...dataReport.findings,
    ];
    
    const summary = {
      period: { startDate, endDate },
      overallRiskLevel: getHighestRiskLevel([
        accessReport.riskLevel,
        privilegeReport.riskLevel,
        securityReport.riskLevel,
        dataReport.riskLevel,
      ]),
      totalFindings: allFindings.length,
      findingsBySeverity: {
        critical: allFindings.filter(f => f.severity === 'critical').length,
        high: allFindings.filter(f => f.severity === 'high').length,
        medium: allFindings.filter(f => f.severity === 'medium').length,
        low: allFindings.filter(f => f.severity === 'low').length,
      },
      findingsByType: {
        violations: allFindings.filter(f => f.type === 'violation').length,
        risks: allFindings.filter(f => f.type === 'risk').length,
        recommendations: allFindings.filter(f => f.type === 'recommendation').length,
      },
      reports: {
        accessReview: {
          riskLevel: accessReport.riskLevel,
          findingsCount: accessReport.findings.length,
        },
        privilegeAudit: {
          riskLevel: privilegeReport.riskLevel,
          findingsCount: privilegeReport.findings.length,
        },
        securityIncidents: {
          riskLevel: securityReport.riskLevel,
          findingsCount: securityReport.findings.length,
        },
        dataAccess: {
          riskLevel: dataReport.riskLevel,
          findingsCount: dataReport.findings.length,
        },
      },
      topRecommendations: getTopRecommendations([
        ...accessReport.recommendations,
        ...privilegeReport.recommendations,
        ...securityReport.recommendations,
        ...dataReport.recommendations,
      ]),
    };
    
    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('Get compliance summary error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch compliance summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== SECURITY METRICS ROUTES ====================

// GET /api/admin/security/metrics - Get security metrics dashboard
router.get('/metrics', authMiddleware, adminMiddleware, requirePermission('security', 'read'), async (req: Request, res: Response) => {
  try {
    const { timeWindow = '24' } = req.query;
    const hours = parseInt(timeWindow as string);
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // Run security scan to get current threats and patterns
    const scanResult = await securityMonitoringService.runAutomatedSecurityScan();
    
    const metrics = {
      timeWindow: `${hours} hours`,
      period: {
        startTime,
        endTime: new Date(),
      },
      threats: {
        total: scanResult.threats.length,
        bySeverity: {
          critical: scanResult.threats.filter(t => t.severity === 'critical').length,
          high: scanResult.threats.filter(t => t.severity === 'high').length,
          medium: scanResult.threats.filter(t => t.severity === 'medium').length,
          low: scanResult.threats.filter(t => t.severity === 'low').length,
        },
        byType: {
          brute_force: scanResult.threats.filter(t => t.type === 'brute_force').length,
          suspicious_login: scanResult.threats.filter(t => t.type === 'suspicious_login').length,
          privilege_escalation: scanResult.threats.filter(t => t.type === 'privilege_escalation').length,
          anomalous_access: scanResult.threats.filter(t => t.type === 'anomalous_access').length,
        },
      },
      patterns: {
        total: scanResult.patterns.length,
        anomalous: scanResult.patterns.filter(p => p.isAnomaly).length,
        highConfidence: scanResult.patterns.filter(p => p.confidence > 0.8).length,
      },
      recommendations: scanResult.recommendations,
      securityScore: calculateSecurityScore(scanResult.threats, scanResult.patterns),
    };
    
    res.json({
      success: true,
      metrics,
    });
  } catch (error) {
    console.error('Get security metrics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch security metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/admin/security/health - Get security health status
router.get('/health', authMiddleware, adminMiddleware, requirePermission('security', 'read'), async (req: Request, res: Response) => {
  try {
    const scanResult = await securityMonitoringService.runAutomatedSecurityScan();
    
    const criticalThreats = scanResult.threats.filter(t => t.severity === 'critical').length;
    const highThreats = scanResult.threats.filter(t => t.severity === 'high').length;
    const anomalousPatterns = scanResult.patterns.filter(p => p.isAnomaly && p.confidence > 0.8).length;
    
    let healthStatus: 'healthy' | 'warning' | 'critical';
    let healthScore: number;
    
    if (criticalThreats > 0) {
      healthStatus = 'critical';
      healthScore = Math.max(0, 100 - (criticalThreats * 30) - (highThreats * 10) - (anomalousPatterns * 5));
    } else if (highThreats > 2 || anomalousPatterns > 5) {
      healthStatus = 'warning';
      healthScore = Math.max(20, 100 - (highThreats * 10) - (anomalousPatterns * 5));
    } else {
      healthStatus = 'healthy';
      healthScore = Math.max(70, 100 - (highThreats * 5) - (anomalousPatterns * 2));
    }
    
    const health = {
      status: healthStatus,
      score: Math.round(healthScore),
      threats: {
        critical: criticalThreats,
        high: highThreats,
        total: scanResult.threats.length,
      },
      patterns: {
        anomalous: anomalousPatterns,
        total: scanResult.patterns.length,
      },
      recommendations: scanResult.recommendations.slice(0, 5), // Top 5 recommendations
      lastScanTime: new Date().toISOString(),
    };
    
    res.json({
      success: true,
      health,
    });
  } catch (error) {
    console.error('Get security health error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch security health',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== HELPER FUNCTIONS ====================

function getHighestRiskLevel(riskLevels: string[]): string {
  if (riskLevels.includes('critical')) return 'critical';
  if (riskLevels.includes('high')) return 'high';
  if (riskLevels.includes('medium')) return 'medium';
  return 'low';
}

function getTopRecommendations(recommendations: string[]): string[] {
  // Remove duplicates and return top 5
  const unique = Array.from(new Set(recommendations));
  return unique.slice(0, 5);
}

function calculateSecurityScore(threats: any[], patterns: any[]): number {
  const criticalThreats = threats.filter(t => t.severity === 'critical').length;
  const highThreats = threats.filter(t => t.severity === 'high').length;
  const mediumThreats = threats.filter(t => t.severity === 'medium').length;
  const anomalousPatterns = patterns.filter(p => p.isAnomaly && p.confidence > 0.8).length;
  
  let score = 100;
  score -= criticalThreats * 30;
  score -= highThreats * 15;
  score -= mediumThreats * 5;
  score -= anomalousPatterns * 10;
  
  return Math.max(0, Math.round(score));
}

export default router;