import { db } from './db';
import { 
  securityAlerts,
  authenticationAuditLogs,
  users,
  InsertSecurityAlert
} from '@shared/schema';
import { eq, and, gte, desc, count, sql, or } from 'drizzle-orm';
import { AuthSecurityMonitor } from './authSecurityMonitor';
import { AuditLogService } from './auditLogService';

// Enhanced security monitoring configuration
const ENHANCED_SECURITY_CONFIG = {
  // Real-time monitoring thresholds
  REAL_TIME_SCAN_INTERVAL: 30 * 1000, // 30 seconds
  THREAT_DETECTION_WINDOW: 15 * 60 * 1000, // 15 minutes
  
  // Alert thresholds
  CRITICAL_ALERT_THRESHOLD: 1, // Immediate notification for critical alerts
  HIGH_ALERT_THRESHOLD: 3, // Notification for 3+ high alerts in 1 hour
  MEDIUM_ALERT_THRESHOLD: 10, // Notification for 10+ medium alerts in 1 hour
  
  // Automated response thresholds
  AUTO_BLOCK_THRESHOLD: 5, // Auto-block IP after 5 critical alerts
  AUTO_LOCKOUT_THRESHOLD: 10, // Auto-lockout user after 10 failed attempts
  
  // Monitoring windows
  ALERT_AGGREGATION_WINDOW: 60 * 60 * 1000, // 1 hour
  PATTERN_ANALYSIS_WINDOW: 24 * 60 * 60 * 1000, // 24 hours
  COMPLIANCE_REPORTING_WINDOW: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export interface SecurityDashboardMetrics {
  realTimeThreats: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  alertTrends: {
    last24Hours: number;
    last7Days: number;
    last30Days: number;
    percentageChange: number;
  };
  topThreats: Array<{
    type: string;
    count: number;
    severity: string;
    lastOccurrence: Date;
  }>;
  suspiciousIPs: Array<{
    ipAddress: string;
    alertCount: number;
    lastAlert: Date;
    threatTypes: string[];
  }>;
  userSecurityStatus: {
    totalUsers: number;
    compromisedAccounts: number;
    lockedAccounts: number;
    suspiciousActivity: number;
  };
  systemHealth: {
    securityScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    lastScanTime: Date;
    nextScanTime: Date;
  };
}

export interface SecurityAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ipAddress: string;
  userId?: string;
  userEmail?: string;
  metadata: Record<string, any>;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  createdAt: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
}

export interface ThreatIntelligence {
  ipAddress: string;
  threatScore: number;
  threatTypes: string[];
  firstSeen: Date;
  lastSeen: Date;
  alertCount: number;
  isBlocked: boolean;
  geolocation?: {
    country: string;
    city: string;
    coordinates: { lat: number; lng: number };
  };
  userAgents: string[];
  targetedUsers: string[];
}

export interface SecurityRecommendation {
  id: string;
  type: 'immediate' | 'short_term' | 'long_term';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  category: 'authentication' | 'authorization' | 'monitoring' | 'infrastructure';
  actionItems: string[];
  estimatedTimeToImplement: string;
}

class EnhancedSecurityMonitoringService {
  private static instance: EnhancedSecurityMonitoringService;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alertProcessingQueue: SecurityAlert[] = [];
  private isMonitoring = false;

  static getInstance(): EnhancedSecurityMonitoringService {
    if (!this.instance) {
      this.instance = new EnhancedSecurityMonitoringService();
    }
    return this.instance;
  }

  /**
   * Initialize enhanced security monitoring
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing Enhanced Security Monitoring Service...');
      
      // Start real-time monitoring
      await this.startRealTimeMonitoring();
      
      // Initialize threat intelligence
      await this.initializeThreatIntelligence();
      
      // Start automated response system
      await this.startAutomatedResponseSystem();
      
      console.log('Enhanced Security Monitoring Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Enhanced Security Monitoring Service:', error);
      throw error;
    }
  }

  /**
   * Start real-time security monitoring
   */
  private async startRealTimeMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Real-time monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performRealTimeThreatScan();
        await this.processAlertQueue();
        await this.updateThreatIntelligence();
      } catch (error) {
        console.error('Error in real-time monitoring cycle:', error);
      }
    }, ENHANCED_SECURITY_CONFIG.REAL_TIME_SCAN_INTERVAL);

    console.log('Real-time security monitoring started');
  }

  /**
   * Perform real-time threat detection scan
   */
  private async performRealTimeThreatScan(): Promise<void> {
    try {
      const scanWindow = new Date(Date.now() - ENHANCED_SECURITY_CONFIG.THREAT_DETECTION_WINDOW);
      
      // Get recent authentication events
      const recentEvents = await db.select()
        .from(authenticationAuditLogs)
        .where(gte(authenticationAuditLogs.createdAt, scanWindow))
        .orderBy(desc(authenticationAuditLogs.createdAt));

      // Analyze events for threats
      const threats = await this.analyzeEventsForThreats(recentEvents);
      
      // Process detected threats
      for (const threat of threats) {
        await this.processDetectedThreat(threat);
      }

      // Update security metrics
      await this.updateSecurityMetrics();
      
    } catch (error) {
      console.error('Error performing real-time threat scan:', error);
    }
  }

  /**
   * Analyze authentication events for security threats
   */
  private async analyzeEventsForThreats(events: any[]): Promise<SecurityAlert[]> {
    const threats: SecurityAlert[] = [];
    const now = new Date();

    try {
      // Group events by IP address for analysis
      const eventsByIP = new Map<string, any[]>();
      for (const event of events) {
        if (!eventsByIP.has(event.ipAddress)) {
          eventsByIP.set(event.ipAddress, []);
        }
        eventsByIP.get(event.ipAddress)!.push(event);
      }

      // Analyze each IP for suspicious patterns
      for (const [ipAddress, ipEvents] of eventsByIP) {
        const ipThreats = await this.analyzeIPEvents(ipAddress, ipEvents);
        threats.push(...ipThreats);
      }

      // Analyze cross-IP patterns
      const crossIPThreats = await this.analyzeCrossIPPatterns(events);
      threats.push(...crossIPThreats);

    } catch (error) {
      console.error('Error analyzing events for threats:', error);
    }

    return threats;
  }

  /**
   * Analyze events from a specific IP address
   */
  private async analyzeIPEvents(ipAddress: string, events: any[]): Promise<SecurityAlert[]> {
    const threats: SecurityAlert[] = [];
    const now = new Date();

    // 1. Rapid-fire login attempts
    const loginAttempts = events.filter(e => e.action.includes('login'));
    if (loginAttempts.length >= 20) { // 20+ login attempts in 15 minutes
      threats.push({
        id: `rapid_login_${ipAddress}_${now.getTime()}`,
        type: 'brute_force',
        severity: 'high',
        description: `Rapid login attempts detected: ${loginAttempts.length} attempts in 15 minutes`,
        ipAddress,
        metadata: {
          attemptCount: loginAttempts.length,
          timeWindow: '15 minutes',
          targetUsers: [...new Set(loginAttempts.map(e => e.userEmail).filter(Boolean))],
        },
        status: 'active',
        createdAt: now,
      });
    }

    // 2. Multiple user targeting
    const targetedUsers = new Set(events.map(e => e.userEmail).filter(Boolean));
    if (targetedUsers.size >= 10) { // Targeting 10+ different users
      threats.push({
        id: `multi_user_targeting_${ipAddress}_${now.getTime()}`,
        type: 'account_takeover',
        severity: 'critical',
        description: `Multiple user targeting detected: ${targetedUsers.size} different users targeted`,
        ipAddress,
        metadata: {
          targetedUserCount: targetedUsers.size,
          targetedUsers: Array.from(targetedUsers).slice(0, 10), // First 10 for logging
        },
        status: 'active',
        createdAt: now,
      });
    }

    // 3. Unusual request patterns
    const requestTypes = events.map(e => e.action);
    const uniqueRequestTypes = new Set(requestTypes);
    if (uniqueRequestTypes.size >= 15) { // 15+ different request types
      threats.push({
        id: `unusual_patterns_${ipAddress}_${now.getTime()}`,
        type: 'suspicious_activity',
        severity: 'medium',
        description: `Unusual request patterns detected: ${uniqueRequestTypes.size} different request types`,
        ipAddress,
        metadata: {
          requestTypeCount: uniqueRequestTypes.size,
          requestTypes: Array.from(uniqueRequestTypes),
          totalRequests: events.length,
        },
        status: 'active',
        createdAt: now,
      });
    }

    // 4. Failed authentication spike
    const failedEvents = events.filter(e => !e.success);
    const successfulEvents = events.filter(e => e.success);
    const failureRate = failedEvents.length / events.length;
    
    if (failedEvents.length >= 15 && failureRate >= 0.8) { // 80%+ failure rate with 15+ attempts
      threats.push({
        id: `auth_failure_spike_${ipAddress}_${now.getTime()}`,
        type: 'brute_force',
        severity: 'high',
        description: `Authentication failure spike: ${failedEvents.length} failures (${(failureRate * 100).toFixed(1)}% failure rate)`,
        ipAddress,
        metadata: {
          failedAttempts: failedEvents.length,
          successfulAttempts: successfulEvents.length,
          failureRate: failureRate,
        },
        status: 'active',
        createdAt: now,
      });
    }

    return threats;
  }

  /**
   * Analyze cross-IP patterns for coordinated attacks
   */
  private async analyzeCrossIPPatterns(events: any[]): Promise<SecurityAlert[]> {
    const threats: SecurityAlert[] = [];
    const now = new Date();

    try {
      // Group by user email to detect coordinated targeting
      const eventsByUser = new Map<string, any[]>();
      for (const event of events) {
        if (event.userEmail) {
          if (!eventsByUser.has(event.userEmail)) {
            eventsByUser.set(event.userEmail, []);
          }
          eventsByUser.get(event.userEmail)!.push(event);
        }
      }

      // Look for users being targeted from multiple IPs
      for (const [userEmail, userEvents] of eventsByUser) {
        const uniqueIPs = new Set(userEvents.map(e => e.ipAddress));
        const failedEvents = userEvents.filter(e => !e.success);
        
        if (uniqueIPs.size >= 5 && failedEvents.length >= 10) { // 5+ IPs, 10+ failures
          threats.push({
            id: `coordinated_attack_${userEmail}_${now.getTime()}`,
            type: 'account_takeover',
            severity: 'critical',
            description: `Coordinated attack detected on user ${userEmail}: ${uniqueIPs.size} IPs, ${failedEvents.length} failed attempts`,
            ipAddress: Array.from(uniqueIPs).join(', '),
            userEmail,
            metadata: {
              targetedUser: userEmail,
              attackingIPs: Array.from(uniqueIPs),
              failedAttempts: failedEvents.length,
              totalAttempts: userEvents.length,
            },
            status: 'active',
            createdAt: now,
          });
        }
      }

      // Look for synchronized attacks (same time patterns across IPs)
      const timeSlots = new Map<string, string[]>(); // time slot -> IPs
      for (const event of events) {
        const timeSlot = new Date(event.createdAt).toISOString().slice(0, 16); // minute precision
        if (!timeSlots.has(timeSlot)) {
          timeSlots.set(timeSlot, []);
        }
        timeSlots.get(timeSlot)!.push(event.ipAddress);
      }

      for (const [timeSlot, ips] of timeSlots) {
        const uniqueIPs = new Set(ips);
        if (uniqueIPs.size >= 10) { // 10+ IPs active in same minute
          threats.push({
            id: `synchronized_attack_${timeSlot}_${now.getTime()}`,
            type: 'suspicious_activity',
            severity: 'high',
            description: `Synchronized attack pattern detected: ${uniqueIPs.size} IPs active simultaneously`,
            ipAddress: Array.from(uniqueIPs).slice(0, 10).join(', '),
            metadata: {
              timeSlot,
              simultaneousIPs: uniqueIPs.size,
              attackingIPs: Array.from(uniqueIPs).slice(0, 20), // First 20 IPs
            },
            status: 'active',
            createdAt: now,
          });
        }
      }

    } catch (error) {
      console.error('Error analyzing cross-IP patterns:', error);
    }

    return threats;
  }

  /**
   * Process a detected security threat
   */
  private async processDetectedThreat(threat: SecurityAlert): Promise<void> {
    try {
      // Check if similar alert already exists (avoid duplicates)
      const existingAlert = await this.findSimilarAlert(threat);
      if (existingAlert) {
        await this.updateExistingAlert(existingAlert.id, threat);
        return;
      }

      // Store the alert in database
      const alertData: InsertSecurityAlert = {
        type: threat.type,
        severity: threat.severity,
        description: threat.description,
        ipAddress: threat.ipAddress,
        userId: threat.userId || null,
        userEmail: threat.userEmail || null,
        metadata: threat.metadata,
        status: threat.status,
      };

      const [insertedAlert] = await db.insert(securityAlerts).values(alertData).returning();
      
      // Add to processing queue for immediate action
      this.alertProcessingQueue.push({
        ...threat,
        id: insertedAlert.id,
      });

      // Trigger immediate response for critical alerts
      if (threat.severity === 'critical') {
        await this.triggerImmediateResponse(threat);
      }

      console.log(`Security threat detected and logged: ${threat.type} (${threat.severity}) from ${threat.ipAddress}`);
      
    } catch (error) {
      console.error('Error processing detected threat:', error);
    }
  }

  /**
   * Find similar existing alert to avoid duplicates
   */
  private async findSimilarAlert(threat: SecurityAlert): Promise<SecurityAlert | null> {
    try {
      const recentWindow = new Date(Date.now() - 60 * 60 * 1000); // Last hour
      
      const existingAlerts = await db.select()
        .from(securityAlerts)
        .where(and(
          eq(securityAlerts.type, threat.type),
          eq(securityAlerts.ipAddress, threat.ipAddress),
          eq(securityAlerts.status, 'active'),
          gte(securityAlerts.createdAt, recentWindow)
        ))
        .limit(1);

      return existingAlerts.length > 0 ? existingAlerts[0] as SecurityAlert : null;
    } catch (error) {
      console.error('Error finding similar alert:', error);
      return null;
    }
  }

  /**
   * Update existing alert with new information
   */
  private async updateExistingAlert(alertId: string, newThreat: SecurityAlert): Promise<void> {
    try {
      await db.update(securityAlerts)
        .set({
          description: `${newThreat.description} (Updated: ${new Date().toISOString()})`,
          metadata: newThreat.metadata,
          updatedAt: new Date(),
        })
        .where(eq(securityAlerts.id, alertId));
    } catch (error) {
      console.error('Error updating existing alert:', error);
    }
  }

  /**
   * Trigger immediate response for critical threats
   */
  private async triggerImmediateResponse(threat: SecurityAlert): Promise<void> {
    try {
      console.error('CRITICAL SECURITY THREAT DETECTED:', {
        type: threat.type,
        description: threat.description,
        ipAddress: threat.ipAddress,
        userEmail: threat.userEmail,
        timestamp: threat.createdAt,
      });

      // Here you could implement:
      // - Send immediate notifications to security team
      // - Trigger automated blocking mechanisms
      // - Escalate to incident response system
      // - Log to external security systems (SIEM)
      
      // For now, we'll log the critical alert
      await AuditLogService.logEvent(
        'critical_security_alert',
        threat.ipAddress,
        'Security Monitoring System',
        threat.userId,
        threat.userEmail,
        'system',
        true,
        undefined,
        undefined,
        undefined,
        {
          alertType: threat.type,
          severity: threat.severity,
          description: threat.description,
          metadata: threat.metadata,
        }
      );

    } catch (error) {
      console.error('Error triggering immediate response:', error);
    }
  }

  /**
   * Process alert queue for automated responses
   */
  private async processAlertQueue(): Promise<void> {
    if (this.alertProcessingQueue.length === 0) return;

    const alertsToProcess = this.alertProcessingQueue.splice(0); // Take all alerts

    for (const alert of alertsToProcess) {
      try {
        await this.executeAutomatedResponse(alert);
      } catch (error) {
        console.error('Error processing alert from queue:', error);
      }
    }
  }

  /**
   * Execute automated response based on alert type and severity
   */
  private async executeAutomatedResponse(alert: SecurityAlert): Promise<void> {
    try {
      switch (alert.type) {
        case 'brute_force':
          await this.handleBruteForceResponse(alert);
          break;
        case 'account_takeover':
          await this.handleAccountTakeoverResponse(alert);
          break;
        case 'suspicious_activity':
          await this.handleSuspiciousActivityResponse(alert);
          break;
        case 'token_abuse':
          await this.handleTokenAbuseResponse(alert);
          break;
        case 'geographic_anomaly':
          await this.handleGeographicAnomalyResponse(alert);
          break;
      }
    } catch (error) {
      console.error('Error executing automated response:', error);
    }
  }

  /**
   * Handle brute force attack response
   */
  private async handleBruteForceResponse(alert: SecurityAlert): Promise<void> {
    // Count recent brute force alerts from this IP
    const recentAlerts = await this.getRecentAlertsByIP(alert.ipAddress, 'brute_force', 60); // Last hour
    
    if (recentAlerts.length >= 3) {
      console.warn(`Multiple brute force attempts from ${alert.ipAddress} - consider IP blocking`);
      // Could implement IP blocking here
    }

    // If targeting specific user, consider account protection
    if (alert.userEmail) {
      console.warn(`User ${alert.userEmail} under brute force attack - consider additional protection`);
      // Could implement additional user protection here
    }
  }

  /**
   * Handle account takeover response
   */
  private async handleAccountTakeoverResponse(alert: SecurityAlert): Promise<void> {
    console.error(`Account takeover attempt detected from ${alert.ipAddress}`);
    
    // If specific user targeted, consider immediate protection
    if (alert.userEmail) {
      console.error(`User ${alert.userEmail} targeted for account takeover - immediate action required`);
      // Could implement:
      // - Force password reset
      // - Require additional verification
      // - Temporarily suspend account
      // - Notify user immediately
    }
  }

  /**
   * Handle suspicious activity response
   */
  private async handleSuspiciousActivityResponse(alert: SecurityAlert): Promise<void> {
    console.warn(`Suspicious activity detected from ${alert.ipAddress}`);
    
    // Increase monitoring for this IP
    // Could implement rate limiting or additional verification
  }

  /**
   * Handle token abuse response
   */
  private async handleTokenAbuseResponse(alert: SecurityAlert): Promise<void> {
    if (alert.userEmail) {
      console.warn(`Token abuse detected for user ${alert.userEmail} - consider token revocation`);
      // Could implement:
      // - Revoke all user tokens
      // - Force re-authentication
      // - Require additional verification
    }
  }

  /**
   * Handle geographic anomaly response
   */
  private async handleGeographicAnomalyResponse(alert: SecurityAlert): Promise<void> {
    if (alert.userEmail) {
      console.warn(`Geographic anomaly detected for user ${alert.userEmail} - consider additional verification`);
      // Could implement:
      // - Require additional verification
      // - Send security notification to user
      // - Temporarily restrict access
    }
  }

  /**
   * Get recent alerts by IP address and type
   */
  private async getRecentAlertsByIP(ipAddress: string, type: string, minutes: number): Promise<SecurityAlert[]> {
    try {
      const since = new Date(Date.now() - minutes * 60 * 1000);
      
      const alerts = await db.select()
        .from(securityAlerts)
        .where(and(
          eq(securityAlerts.ipAddress, ipAddress),
          eq(securityAlerts.type, type),
          gte(securityAlerts.createdAt, since)
        ))
        .orderBy(desc(securityAlerts.createdAt));

      return alerts as SecurityAlert[];
    } catch (error) {
      console.error('Error getting recent alerts by IP:', error);
      return [];
    }
  }

  /**
   * Initialize threat intelligence system
   */
  private async initializeThreatIntelligence(): Promise<void> {
    try {
      console.log('Initializing threat intelligence system...');
      // This could load known threat IPs, patterns, etc.
      // For now, we'll just log that it's initialized
      console.log('Threat intelligence system initialized');
    } catch (error) {
      console.error('Error initializing threat intelligence:', error);
    }
  }

  /**
   * Start automated response system
   */
  private async startAutomatedResponseSystem(): Promise<void> {
    try {
      console.log('Starting automated response system...');
      // This could initialize automated blocking, notification systems, etc.
      console.log('Automated response system started');
    } catch (error) {
      console.error('Error starting automated response system:', error);
    }
  }

  /**
   * Update threat intelligence with new data
   */
  private async updateThreatIntelligence(): Promise<void> {
    try {
      // This could update threat intelligence databases, IP reputation, etc.
      // For now, we'll just perform basic maintenance
    } catch (error) {
      console.error('Error updating threat intelligence:', error);
    }
  }

  /**
   * Update security metrics
   */
  private async updateSecurityMetrics(): Promise<void> {
    try {
      // This could update cached security metrics for dashboard
      // For now, we'll just log that metrics are being updated
    } catch (error) {
      console.error('Error updating security metrics:', error);
    }
  }

  /**
   * Get comprehensive security dashboard metrics
   */
  async getSecurityDashboardMetrics(): Promise<SecurityDashboardMetrics> {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get real-time threat counts
      const activeAlerts = await db.select()
        .from(securityAlerts)
        .where(eq(securityAlerts.status, 'active'));

      const realTimeThreats = {
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
        high: activeAlerts.filter(a => a.severity === 'high').length,
        medium: activeAlerts.filter(a => a.severity === 'medium').length,
        low: activeAlerts.filter(a => a.severity === 'low').length,
        total: activeAlerts.length,
      };

      // Get alert trends
      const alerts24h = await db.select({ count: count() })
        .from(securityAlerts)
        .where(gte(securityAlerts.createdAt, last24Hours));

      const alerts7d = await db.select({ count: count() })
        .from(securityAlerts)
        .where(gte(securityAlerts.createdAt, last7Days));

      const alerts30d = await db.select({ count: count() })
        .from(securityAlerts)
        .where(gte(securityAlerts.createdAt, last30Days));

      const alertTrends = {
        last24Hours: alerts24h[0]?.count || 0,
        last7Days: alerts7d[0]?.count || 0,
        last30Days: alerts30d[0]?.count || 0,
        percentageChange: 0, // Could calculate based on previous periods
      };

      // Get top threats
      const topThreatsResult = await db.select({
        type: securityAlerts.type,
        count: count(),
        severity: securityAlerts.severity,
        lastOccurrence: sql<Date>`MAX(${securityAlerts.createdAt})`,
      })
      .from(securityAlerts)
      .where(gte(securityAlerts.createdAt, last7Days))
      .groupBy(securityAlerts.type, securityAlerts.severity)
      .orderBy(desc(count()))
      .limit(10);

      const topThreats = topThreatsResult.map(t => ({
        type: t.type,
        count: t.count,
        severity: t.severity,
        lastOccurrence: t.lastOccurrence,
      }));

      // Get suspicious IPs
      const suspiciousIPsResult = await db.select({
        ipAddress: securityAlerts.ipAddress,
        alertCount: count(),
        lastAlert: sql<Date>`MAX(${securityAlerts.createdAt})`,
        threatTypes: sql<string[]>`ARRAY_AGG(DISTINCT ${securityAlerts.type})`,
      })
      .from(securityAlerts)
      .where(gte(securityAlerts.createdAt, last7Days))
      .groupBy(securityAlerts.ipAddress)
      .having(sql`count(*) >= 3`)
      .orderBy(desc(count()))
      .limit(10);

      const suspiciousIPs = suspiciousIPsResult.map(ip => ({
        ipAddress: ip.ipAddress,
        alertCount: ip.alertCount,
        lastAlert: ip.lastAlert,
        threatTypes: ip.threatTypes,
      }));

      // Get user security status (mock data - would implement actual queries)
      const userSecurityStatus = {
        totalUsers: 0, // Would query users table
        compromisedAccounts: 0, // Would query based on security alerts
        lockedAccounts: 0, // Would query based on account status
        suspiciousActivity: 0, // Would query based on recent alerts
      };

      // Calculate security score
      const securityScore = this.calculateSecurityScore(realTimeThreats, alertTrends);
      const riskLevel = this.calculateRiskLevel(securityScore, realTimeThreats);

      const systemHealth = {
        securityScore,
        riskLevel,
        lastScanTime: now,
        nextScanTime: new Date(now.getTime() + ENHANCED_SECURITY_CONFIG.REAL_TIME_SCAN_INTERVAL),
      };

      return {
        realTimeThreats,
        alertTrends,
        topThreats,
        suspiciousIPs,
        userSecurityStatus,
        systemHealth,
      };

    } catch (error) {
      console.error('Error getting security dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate overall security score
   */
  private calculateSecurityScore(threats: any, trends: any): number {
    let score = 100;
    
    // Deduct points for active threats
    score -= threats.critical * 30;
    score -= threats.high * 15;
    score -= threats.medium * 5;
    score -= threats.low * 1;
    
    // Deduct points for increasing trends
    if (trends.last24Hours > 10) score -= 10;
    if (trends.last7Days > 50) score -= 10;
    
    return Math.max(0, Math.round(score));
  }

  /**
   * Calculate risk level based on security score and threats
   */
  private calculateRiskLevel(score: number, threats: any): 'low' | 'medium' | 'high' | 'critical' {
    if (threats.critical > 0 || score < 30) return 'critical';
    if (threats.high > 5 || score < 50) return 'high';
    if (threats.high > 0 || threats.medium > 10 || score < 70) return 'medium';
    return 'low';
  }

  /**
   * Get security recommendations based on current threats and patterns
   */
  async getSecurityRecommendations(): Promise<SecurityRecommendation[]> {
    try {
      const metrics = await this.getSecurityDashboardMetrics();
      const recommendations: SecurityRecommendation[] = [];

      // Critical recommendations
      if (metrics.realTimeThreats.critical > 0) {
        recommendations.push({
          id: 'critical_threats_response',
          type: 'immediate',
          priority: 'critical',
          title: 'Immediate Response Required for Critical Threats',
          description: `${metrics.realTimeThreats.critical} critical security threats detected requiring immediate attention.`,
          impact: 'System security is at risk. Immediate action required to prevent potential breaches.',
          effort: 'high',
          category: 'monitoring',
          actionItems: [
            'Review all critical alerts immediately',
            'Investigate threat sources and patterns',
            'Implement immediate blocking if necessary',
            'Notify security team and stakeholders',
            'Document incident response actions',
          ],
          estimatedTimeToImplement: '1-2 hours',
        });
      }

      // High threat recommendations
      if (metrics.realTimeThreats.high > 3) {
        recommendations.push({
          id: 'high_threat_mitigation',
          type: 'immediate',
          priority: 'high',
          title: 'Multiple High-Severity Threats Detected',
          description: `${metrics.realTimeThreats.high} high-severity threats require prompt attention.`,
          impact: 'Potential security vulnerabilities that could escalate to critical threats.',
          effort: 'medium',
          category: 'monitoring',
          actionItems: [
            'Review high-severity alerts within 4 hours',
            'Implement additional monitoring for affected IPs',
            'Consider rate limiting for suspicious sources',
            'Update threat detection rules if needed',
          ],
          estimatedTimeToImplement: '2-4 hours',
        });
      }

      // Suspicious IP recommendations
      if (metrics.suspiciousIPs.length > 5) {
        recommendations.push({
          id: 'suspicious_ip_blocking',
          type: 'short_term',
          priority: 'high',
          title: 'Implement IP Blocking for Suspicious Sources',
          description: `${metrics.suspiciousIPs.length} suspicious IP addresses detected with multiple security alerts.`,
          impact: 'Reduce attack surface by blocking known malicious sources.',
          effort: 'medium',
          category: 'infrastructure',
          actionItems: [
            'Review suspicious IP list and threat patterns',
            'Implement automated IP blocking rules',
            'Set up IP reputation monitoring',
            'Create whitelist for legitimate traffic',
            'Monitor blocked IP attempts',
          ],
          estimatedTimeToImplement: '1-2 days',
        });
      }

      // Authentication security recommendations
      if (metrics.alertTrends.last24Hours > 20) {
        recommendations.push({
          id: 'enhanced_authentication',
          type: 'short_term',
          priority: 'medium',
          title: 'Enhance Authentication Security Measures',
          description: 'High volume of authentication-related security alerts suggests need for stronger controls.',
          impact: 'Reduce successful attack attempts and improve overall authentication security.',
          effort: 'medium',
          category: 'authentication',
          actionItems: [
            'Implement multi-factor authentication for all admin accounts',
            'Strengthen password requirements',
            'Add CAPTCHA for repeated failed attempts',
            'Implement progressive account lockout',
            'Add geographic login restrictions',
          ],
          estimatedTimeToImplement: '3-5 days',
        });
      }

      // Monitoring improvements
      if (metrics.systemHealth.securityScore < 70) {
        recommendations.push({
          id: 'monitoring_enhancement',
          type: 'long_term',
          priority: 'medium',
          title: 'Enhance Security Monitoring Capabilities',
          description: 'Current security score indicates need for improved monitoring and detection.',
          impact: 'Better threat detection and faster response times.',
          effort: 'high',
          category: 'monitoring',
          actionItems: [
            'Implement advanced behavioral analytics',
            'Add machine learning-based anomaly detection',
            'Integrate with external threat intelligence feeds',
            'Set up automated incident response workflows',
            'Implement security orchestration platform',
          ],
          estimatedTimeToImplement: '2-4 weeks',
        });
      }

      // General security improvements
      recommendations.push({
        id: 'security_best_practices',
        type: 'long_term',
        priority: 'low',
        title: 'Implement Security Best Practices',
        description: 'Ongoing security improvements to maintain strong security posture.',
        impact: 'Continuous improvement of overall security posture.',
        effort: 'low',
        category: 'infrastructure',
        actionItems: [
          'Regular security audits and penetration testing',
          'Security awareness training for all users',
          'Regular review and update of security policies',
          'Implement security metrics and KPI tracking',
          'Establish incident response procedures',
        ],
        estimatedTimeToImplement: 'Ongoing',
      });

      return recommendations.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    } catch (error) {
      console.error('Error getting security recommendations:', error);
      return [];
    }
  }

  /**
   * Acknowledge a security alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string, notes?: string): Promise<void> {
    try {
      await db.update(securityAlerts)
        .set({
          acknowledgedBy,
          acknowledgedAt: new Date(),
          resolutionNotes: notes,
          updatedAt: new Date(),
        })
        .where(eq(securityAlerts.id, alertId));

      console.log(`Security alert ${alertId} acknowledged by ${acknowledgedBy}`);
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  /**
   * Resolve a security alert
   */
  async resolveAlert(alertId: string, resolvedBy: string, resolutionNotes: string): Promise<void> {
    try {
      await db.update(securityAlerts)
        .set({
          status: 'resolved',
          resolvedBy,
          resolvedAt: new Date(),
          resolutionNotes,
          updatedAt: new Date(),
        })
        .where(eq(securityAlerts.id, alertId));

      console.log(`Security alert ${alertId} resolved by ${resolvedBy}`);
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  /**
   * Get active security alerts
   */
  async getActiveAlerts(limit: number = 50): Promise<SecurityAlert[]> {
    try {
      const alerts = await db.select()
        .from(securityAlerts)
        .where(eq(securityAlerts.status, 'active'))
        .orderBy(desc(securityAlerts.createdAt))
        .limit(limit);

      return alerts as SecurityAlert[];
    } catch (error) {
      console.error('Error getting active alerts:', error);
      return [];
    }
  }

  /**
   * Shutdown monitoring service
   */
  shutdown(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    this.alertProcessingQueue = [];
    console.log('Enhanced Security Monitoring Service shut down');
  }
}

export const enhancedSecurityMonitoringService = EnhancedSecurityMonitoringService.getInstance();
export default enhancedSecurityMonitoringService;