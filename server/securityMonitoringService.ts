import { db } from './db';
import { 
  adminActivityLogs, 
  securityAuditEvents, 
  accessPatternAnalysis,
  adminUsers,
  adminSessions,
  users,
  InsertSecurityAuditEvent,
  InsertAccessPatternAnalysis
} from '@shared/schema';
import { eq, and, desc, gte, lte, sql, count, avg, max, min } from 'drizzle-orm';
import { adminAccessControlService } from './adminAccessControlService';

export interface SecurityThreat {
  id: string;
  type: 'brute_force' | 'suspicious_login' | 'privilege_escalation' | 'data_breach_attempt' | 'anomalous_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  adminUserId?: string;
  ipAddress?: string;
  indicators: string[];
  riskScore: number;
  detectedAt: Date;
  mitigationSteps: string[];
}

export interface AccessPattern {
  adminUserId: string;
  patternType: 'login_time' | 'ip_location' | 'resource_access' | 'session_duration' | 'failed_attempts';
  baseline: any;
  current: any;
  deviation: number;
  isAnomaly: boolean;
  confidence: number;
}

export interface ComplianceReport {
  reportId: string;
  reportType: 'access_review' | 'privilege_audit' | 'security_incidents' | 'data_access_log';
  period: {
    startDate: Date;
    endDate: Date;
  };
  findings: ComplianceFinding[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  generatedAt: Date;
}

export interface ComplianceFinding {
  type: 'violation' | 'risk' | 'recommendation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: any[];
  remediation: string;
}

export class SecurityMonitoringService {
  
  // ==================== THREAT DETECTION ====================
  
  async detectSecurityThreats(): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];
    
    // Detect brute force attacks
    const bruteForceThreats = await this.detectBruteForceAttacks();
    threats.push(...bruteForceThreats);
    
    // Detect suspicious login patterns
    const suspiciousLogins = await this.detectSuspiciousLogins();
    threats.push(...suspiciousLogins);
    
    // Detect privilege escalation attempts
    const privilegeEscalation = await this.detectPrivilegeEscalation();
    threats.push(...privilegeEscalation);
    
    // Detect anomalous access patterns
    const anomalousAccess = await this.detectAnomalousAccess();
    threats.push(...anomalousAccess);
    
    // Log detected threats
    for (const threat of threats) {
      await this.logSecurityEvent(threat);
    }
    
    return threats;
  }
  
  private async detectBruteForceAttacks(): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];
    const timeWindow = new Date(Date.now() - 15 * 60 * 1000); // Last 15 minutes
    
    try {
      // Find IPs with multiple failed login attempts
      const failedAttempts = await db.select({
        ipAddress: adminActivityLogs.ipAddress,
        adminUserId: adminActivityLogs.adminUserId,
        count: count(),
      })
      .from(adminActivityLogs)
      .where(and(
        eq(adminActivityLogs.action, 'login_failure'),
        gte(adminActivityLogs.createdAt, timeWindow)
      ))
      .groupBy(adminActivityLogs.ipAddress, adminActivityLogs.adminUserId)
      .having(sql`count(*) >= 5`);
      
      for (const attempt of failedAttempts) {
        if (attempt.ipAddress) {
          threats.push({
            id: `brute_force_${attempt.ipAddress}_${Date.now()}`,
            type: 'brute_force',
            severity: attempt.count >= 10 ? 'critical' : 'high',
            description: `Brute force attack detected from IP ${attempt.ipAddress}`,
            adminUserId: attempt.adminUserId,
            ipAddress: attempt.ipAddress,
            indicators: [
              `${attempt.count} failed login attempts in 15 minutes`,
              `Target user: ${attempt.adminUserId || 'Multiple users'}`,
            ],
            riskScore: Math.min(100, attempt.count * 10),
            detectedAt: new Date(),
            mitigationSteps: [
              'Block IP address temporarily',
              'Notify security team',
              'Review user account security',
              'Consider implementing CAPTCHA',
            ],
          });
        }
      }
    } catch (error) {
      console.error('Error detecting brute force attacks:', error);
    }
    
    return threats;
  }
  
  private async detectSuspiciousLogins(): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];
    const timeWindow = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    
    try {
      // Find logins from unusual locations or times
      const recentLogins = await db.select({
        adminUserId: adminActivityLogs.adminUserId,
        ipAddress: adminActivityLogs.ipAddress,
        createdAt: adminActivityLogs.createdAt,
      })
      .from(adminActivityLogs)
      .where(and(
        eq(adminActivityLogs.action, 'login_success'),
        gte(adminActivityLogs.createdAt, timeWindow)
      ))
      .orderBy(desc(adminActivityLogs.createdAt));
      
      // Group by user and analyze patterns
      const userLogins = new Map<string, typeof recentLogins>();
      for (const login of recentLogins) {
        if (!userLogins.has(login.adminUserId)) {
          userLogins.set(login.adminUserId, []);
        }
        userLogins.get(login.adminUserId)!.push(login);
      }
      
      for (const [adminUserId, logins] of userLogins) {
        if (logins.length > 1) {
          const uniqueIPs = new Set(logins.map(l => l.ipAddress));
          
          // Suspicious if multiple IPs in short time
          if (uniqueIPs.size > 2) {
            threats.push({
              id: `suspicious_login_${adminUserId}_${Date.now()}`,
              type: 'suspicious_login',
              severity: uniqueIPs.size > 4 ? 'high' : 'medium',
              description: `Suspicious login pattern detected for admin user`,
              adminUserId,
              ipAddress: Array.from(uniqueIPs).join(', '),
              indicators: [
                `Logins from ${uniqueIPs.size} different IP addresses`,
                `${logins.length} logins in 24 hours`,
              ],
              riskScore: Math.min(100, uniqueIPs.size * 15),
              detectedAt: new Date(),
              mitigationSteps: [
                'Verify user identity',
                'Check for compromised credentials',
                'Enable MFA if not already active',
                'Monitor user activity closely',
              ],
            });
          }
        }
      }
    } catch (error) {
      console.error('Error detecting suspicious logins:', error);
    }
    
    return threats;
  }
  
  private async detectPrivilegeEscalation(): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];
    const timeWindow = new Date(Date.now() - 60 * 60 * 1000); // Last hour
    
    try {
      // Find permission denied events followed by successful access
      const permissionEvents = await db.select()
        .from(adminActivityLogs)
        .where(and(
          eq(adminActivityLogs.action, 'permission_denied'),
          gte(adminActivityLogs.createdAt, timeWindow)
        ))
        .orderBy(desc(adminActivityLogs.createdAt));
      
      for (const event of permissionEvents) {
        // Check if same user gained access to same resource shortly after
        const subsequentAccess = await db.select()
          .from(adminActivityLogs)
          .where(and(
            eq(adminActivityLogs.adminUserId, event.adminUserId),
            eq(adminActivityLogs.entityType, event.entityType),
            eq(adminActivityLogs.entityId, event.entityId || ''),
            gte(adminActivityLogs.createdAt, event.createdAt),
            lte(adminActivityLogs.createdAt, new Date(event.createdAt.getTime() + 30 * 60 * 1000))
          ))
          .limit(1);
        
        if (subsequentAccess.length > 0) {
          threats.push({
            id: `privilege_escalation_${event.adminUserId}_${Date.now()}`,
            type: 'privilege_escalation',
            severity: 'high',
            description: `Potential privilege escalation detected`,
            adminUserId: event.adminUserId,
            ipAddress: event.ipAddress,
            indicators: [
              'Permission denied followed by successful access',
              `Resource: ${event.entityType}/${event.entityId}`,
              'Possible role or permission change',
            ],
            riskScore: 85,
            detectedAt: new Date(),
            mitigationSteps: [
              'Review recent role changes',
              'Audit user permissions',
              'Check for unauthorized privilege modifications',
              'Investigate admin activity',
            ],
          });
        }
      }
    } catch (error) {
      console.error('Error detecting privilege escalation:', error);
    }
    
    return threats;
  }
  
  private async detectAnomalousAccess(): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];
    
    try {
      // Get recent access patterns
      const patterns = await this.analyzeAccessPatterns();
      
      for (const pattern of patterns) {
        if (pattern.isAnomaly && pattern.confidence > 0.8) {
          threats.push({
            id: `anomalous_access_${pattern.adminUserId}_${Date.now()}`,
            type: 'anomalous_access',
            severity: pattern.deviation > 3 ? 'high' : 'medium',
            description: `Anomalous ${pattern.patternType} pattern detected`,
            adminUserId: pattern.adminUserId,
            indicators: [
              `Deviation score: ${pattern.deviation.toFixed(2)}`,
              `Confidence: ${(pattern.confidence * 100).toFixed(1)}%`,
              `Pattern type: ${pattern.patternType}`,
            ],
            riskScore: Math.min(100, pattern.deviation * 25),
            detectedAt: new Date(),
            mitigationSteps: [
              'Review user activity',
              'Verify user identity',
              'Check for account compromise',
              'Monitor future activity',
            ],
          });
        }
      }
    } catch (error) {
      console.error('Error detecting anomalous access:', error);
    }
    
    return threats;
  }
  
  // ==================== ACCESS PATTERN ANALYSIS ====================
  
  async analyzeAccessPatterns(): Promise<AccessPattern[]> {
    const patterns: AccessPattern[] = [];
    
    try {
      // Get all active admin users
      const activeAdmins = await db.select()
        .from(adminUsers)
        .where(eq(adminUsers.isActive, true));
      
      for (const admin of activeAdmins) {
        // Analyze different pattern types
        const loginTimePattern = await this.analyzeLoginTimePattern(admin.id);
        const sessionDurationPattern = await this.analyzeSessionDurationPattern(admin.id);
        const resourceAccessPattern = await this.analyzeResourceAccessPattern(admin.id);
        
        patterns.push(loginTimePattern, sessionDurationPattern, resourceAccessPattern);
      }
      
      // Store patterns in database
      for (const pattern of patterns) {
        if (pattern.isAnomaly) {
          await this.storeAccessPattern(pattern);
        }
      }
    } catch (error) {
      console.error('Error analyzing access patterns:', error);
    }
    
    return patterns;
  }
  
  private async analyzeLoginTimePattern(adminUserId: string): Promise<AccessPattern> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Get historical login times (baseline)
    const historicalLogins = await db.select({
      hour: sql<number>`EXTRACT(HOUR FROM ${adminActivityLogs.createdAt})`,
    })
    .from(adminActivityLogs)
    .where(and(
      eq(adminActivityLogs.adminUserId, adminUserId),
      eq(adminActivityLogs.action, 'login_success'),
      gte(adminActivityLogs.createdAt, thirtyDaysAgo),
      lte(adminActivityLogs.createdAt, oneDayAgo)
    ));
    
    // Get recent login times
    const recentLogins = await db.select({
      hour: sql<number>`EXTRACT(HOUR FROM ${adminActivityLogs.createdAt})`,
    })
    .from(adminActivityLogs)
    .where(and(
      eq(adminActivityLogs.adminUserId, adminUserId),
      eq(adminActivityLogs.action, 'login_success'),
      gte(adminActivityLogs.createdAt, oneDayAgo)
    ));
    
    // Calculate baseline and current patterns
    const baselineHours = historicalLogins.map(l => l.hour);
    const currentHours = recentLogins.map(l => l.hour);
    
    // Simple anomaly detection based on hour distribution
    const baselineAvg = baselineHours.length > 0 ? 
      baselineHours.reduce((a, b) => a + b, 0) / baselineHours.length : 12;
    const currentAvg = currentHours.length > 0 ? 
      currentHours.reduce((a, b) => a + b, 0) / currentHours.length : 12;
    
    const deviation = Math.abs(currentAvg - baselineAvg);
    const isAnomaly = deviation > 4; // More than 4 hours difference
    const confidence = Math.min(1, deviation / 8);
    
    return {
      adminUserId,
      patternType: 'login_time',
      baseline: { averageHour: baselineAvg, hours: baselineHours },
      current: { averageHour: currentAvg, hours: currentHours },
      deviation,
      isAnomaly,
      confidence,
    };
  }
  
  private async analyzeSessionDurationPattern(adminUserId: string): Promise<AccessPattern> {
    // Mock implementation - would analyze actual session durations
    return {
      adminUserId,
      patternType: 'session_duration',
      baseline: { averageDuration: 240 }, // 4 hours
      current: { averageDuration: 480 }, // 8 hours
      deviation: 2,
      isAnomaly: false,
      confidence: 0.6,
    };
  }
  
  private async analyzeResourceAccessPattern(adminUserId: string): Promise<AccessPattern> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Get recent resource access
    const recentAccess = await db.select({
      entityType: adminActivityLogs.entityType,
      count: count(),
    })
    .from(adminActivityLogs)
    .where(and(
      eq(adminActivityLogs.adminUserId, adminUserId),
      gte(adminActivityLogs.createdAt, oneDayAgo)
    ))
    .groupBy(adminActivityLogs.entityType);
    
    // Simple anomaly detection based on access diversity
    const accessTypes = recentAccess.length;
    const totalAccess = recentAccess.reduce((sum, access) => sum + access.count, 0);
    
    const isAnomaly = accessTypes > 10 || totalAccess > 100; // Unusually high activity
    const deviation = Math.max(accessTypes / 5, totalAccess / 50);
    
    return {
      adminUserId,
      patternType: 'resource_access',
      baseline: { typicalTypes: 3, typicalCount: 20 },
      current: { accessTypes, totalAccess },
      deviation,
      isAnomaly,
      confidence: Math.min(1, deviation / 2),
    };
  }
  
  private async storeAccessPattern(pattern: AccessPattern): Promise<void> {
    try {
      await db.insert(accessPatternAnalysis).values({
        adminUserId: pattern.adminUserId,
        patternType: pattern.patternType,
        patternData: {
          baseline: pattern.baseline,
          current: pattern.current,
        },
        isAnomaly: pattern.isAnomaly,
        anomalyScore: pattern.deviation * 10,
        confidenceLevel: pattern.confidence * 100,
        baselineData: pattern.baseline,
        deviationMetrics: {
          deviation: pattern.deviation,
          confidence: pattern.confidence,
        },
        analysisDate: new Date(),
      });
    } catch (error) {
      console.error('Error storing access pattern:', error);
    }
  }
  
  // ==================== SECURITY EVENT LOGGING ====================
  
  private async logSecurityEvent(threat: SecurityThreat): Promise<void> {
    try {
      await adminAccessControlService.createSecurityAuditEvent({
        eventType: threat.type,
        severity: threat.severity,
        category: 'security',
        title: threat.description,
        description: `${threat.description}\n\nIndicators:\n${threat.indicators.join('\n')}`,
        adminUserId: threat.adminUserId,
        ipAddress: threat.ipAddress,
        riskScore: threat.riskScore,
        threatIndicators: threat.indicators,
        acknowledged: false,
        resolved: false,
      });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }
  
  // ==================== COMPLIANCE REPORTING ====================
  
  async generateComplianceReport(
    reportType: ComplianceReport['reportType'],
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport> {
    const reportId = `${reportType}_${Date.now()}`;
    const findings: ComplianceFinding[] = [];
    
    try {
      switch (reportType) {
        case 'access_review':
          findings.push(...await this.generateAccessReviewFindings(startDate, endDate));
          break;
        case 'privilege_audit':
          findings.push(...await this.generatePrivilegeAuditFindings(startDate, endDate));
          break;
        case 'security_incidents':
          findings.push(...await this.generateSecurityIncidentFindings(startDate, endDate));
          break;
        case 'data_access_log':
          findings.push(...await this.generateDataAccessFindings(startDate, endDate));
          break;
      }
    } catch (error) {
      console.error('Error generating compliance report:', error);
    }
    
    // Calculate overall risk level
    const riskLevel = this.calculateOverallRisk(findings);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(findings);
    
    return {
      reportId,
      reportType,
      period: { startDate, endDate },
      findings,
      recommendations,
      riskLevel,
      generatedAt: new Date(),
    };
  }
  
  private async generateAccessReviewFindings(startDate: Date, endDate: Date): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];
    
    // Check for users with excessive permissions
    const adminUsers = await db.select()
      .from(adminUsers)
      .where(eq(adminUsers.isActive, true));
    
    // Mock finding - would implement actual permission analysis
    findings.push({
      type: 'recommendation',
      severity: 'medium',
      description: 'Regular access review recommended',
      evidence: [`${adminUsers.length} active admin users require review`],
      remediation: 'Conduct quarterly access reviews to ensure principle of least privilege',
    });
    
    return findings;
  }
  
  private async generatePrivilegeAuditFindings(startDate: Date, endDate: Date): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];
    
    // Check for privilege escalation events
    const escalationEvents = await db.select()
      .from(adminActivityLogs)
      .where(and(
        eq(adminActivityLogs.action, 'assign_role'),
        gte(adminActivityLogs.createdAt, startDate),
        lte(adminActivityLogs.createdAt, endDate)
      ));
    
    if (escalationEvents.length > 0) {
      findings.push({
        type: 'risk',
        severity: 'medium',
        description: `${escalationEvents.length} role assignments detected`,
        evidence: escalationEvents.map(e => `Role assigned to ${e.adminUserId} at ${e.createdAt}`),
        remediation: 'Review all role assignments for appropriateness and business justification',
      });
    }
    
    return findings;
  }
  
  private async generateSecurityIncidentFindings(startDate: Date, endDate: Date): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];
    
    // Check for security events
    const securityEvents = await db.select()
      .from(securityAuditEvents)
      .where(and(
        gte(securityAuditEvents.createdAt, startDate),
        lte(securityAuditEvents.createdAt, endDate)
      ));
    
    const criticalEvents = securityEvents.filter(e => e.severity === 'critical');
    const highEvents = securityEvents.filter(e => e.severity === 'high');
    
    if (criticalEvents.length > 0) {
      findings.push({
        type: 'violation',
        severity: 'critical',
        description: `${criticalEvents.length} critical security incidents`,
        evidence: criticalEvents.map(e => `${e.title} - ${e.description}`),
        remediation: 'Immediate investigation and remediation required for all critical incidents',
      });
    }
    
    if (highEvents.length > 0) {
      findings.push({
        type: 'risk',
        severity: 'high',
        description: `${highEvents.length} high-severity security events`,
        evidence: highEvents.map(e => `${e.title} - ${e.description}`),
        remediation: 'Review and address all high-severity security events within 24 hours',
      });
    }
    
    return findings;
  }
  
  private async generateDataAccessFindings(startDate: Date, endDate: Date): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];
    
    // Check for data access patterns
    const dataAccess = await db.select()
      .from(adminActivityLogs)
      .where(and(
        eq(adminActivityLogs.category, 'data_modification'),
        gte(adminActivityLogs.createdAt, startDate),
        lte(adminActivityLogs.createdAt, endDate)
      ));
    
    if (dataAccess.length > 100) {
      findings.push({
        type: 'risk',
        severity: 'medium',
        description: `High volume of data access: ${dataAccess.length} events`,
        evidence: [`${dataAccess.length} data modification events in reporting period`],
        remediation: 'Review data access patterns for unusual activity and ensure proper authorization',
      });
    }
    
    return findings;
  }
  
  private calculateOverallRisk(findings: ComplianceFinding[]): ComplianceReport['riskLevel'] {
    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const highCount = findings.filter(f => f.severity === 'high').length;
    const mediumCount = findings.filter(f => f.severity === 'medium').length;
    
    if (criticalCount > 0) return 'critical';
    if (highCount > 2) return 'high';
    if (highCount > 0 || mediumCount > 5) return 'medium';
    return 'low';
  }
  
  private generateRecommendations(findings: ComplianceFinding[]): string[] {
    const recommendations: string[] = [];
    
    const criticalFindings = findings.filter(f => f.severity === 'critical');
    const highFindings = findings.filter(f => f.severity === 'high');
    
    if (criticalFindings.length > 0) {
      recommendations.push('Immediate action required: Address all critical security findings within 4 hours');
    }
    
    if (highFindings.length > 0) {
      recommendations.push('High priority: Resolve all high-severity findings within 24 hours');
    }
    
    recommendations.push('Implement regular security monitoring and automated threat detection');
    recommendations.push('Conduct monthly access reviews and privilege audits');
    recommendations.push('Enhance security awareness training for admin users');
    recommendations.push('Consider implementing additional security controls (MFA, IP restrictions)');
    
    return recommendations;
  }
  
  // ==================== AUTOMATED MONITORING ====================
  
  async runAutomatedSecurityScan(): Promise<{
    threats: SecurityThreat[];
    patterns: AccessPattern[];
    recommendations: string[];
  }> {
    try {
      console.log('Starting automated security scan...');
      
      // Run threat detection
      const threats = await this.detectSecurityThreats();
      console.log(`Detected ${threats.length} security threats`);
      
      // Analyze access patterns
      const patterns = await this.analyzeAccessPatterns();
      const anomalousPatterns = patterns.filter(p => p.isAnomaly);
      console.log(`Found ${anomalousPatterns.length} anomalous access patterns`);
      
      // Generate recommendations
      const recommendations = this.generateSecurityRecommendations(threats, anomalousPatterns);
      
      console.log('Automated security scan completed');
      
      return {
        threats,
        patterns: anomalousPatterns,
        recommendations,
      };
    } catch (error) {
      console.error('Error running automated security scan:', error);
      throw error;
    }
  }
  
  private generateSecurityRecommendations(threats: SecurityThreat[], patterns: AccessPattern[]): string[] {
    const recommendations: string[] = [];
    
    if (threats.length > 0) {
      recommendations.push(`${threats.length} security threats detected - immediate review required`);
    }
    
    if (patterns.length > 0) {
      recommendations.push(`${patterns.length} anomalous access patterns detected - investigate user behavior`);
    }
    
    const criticalThreats = threats.filter(t => t.severity === 'critical');
    if (criticalThreats.length > 0) {
      recommendations.push('CRITICAL: Immediate security response required');
    }
    
    const bruteForceThreats = threats.filter(t => t.type === 'brute_force');
    if (bruteForceThreats.length > 0) {
      recommendations.push('Implement IP blocking and rate limiting');
    }
    
    const suspiciousLogins = threats.filter(t => t.type === 'suspicious_login');
    if (suspiciousLogins.length > 0) {
      recommendations.push('Enable MFA for all admin accounts');
    }
    
    return recommendations;
  }
}

export const securityMonitoringService = new SecurityMonitoringService();