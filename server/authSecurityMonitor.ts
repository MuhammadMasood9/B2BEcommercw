import { Request } from 'express';
import { db } from './db';
import { 
  authenticationAuditLogs, 
  users, 
  securityAlerts,
  InsertSecurityAlert 
} from '@shared/schema';
import { eq, and, gte, count, desc, sql } from 'drizzle-orm';
import { AuditLogService } from './auditLogService';

// Security monitoring configuration
const SECURITY_CONFIG = {
  // Failed login thresholds
  FAILED_LOGIN_THRESHOLD: 10, // per IP in 15 minutes
  FAILED_LOGIN_WINDOW: 15 * 60 * 1000, // 15 minutes
  
  // Account lockout monitoring
  ACCOUNT_LOCKOUT_THRESHOLD: 5, // accounts locked per IP in 1 hour
  ACCOUNT_LOCKOUT_WINDOW: 60 * 60 * 1000, // 1 hour
  
  // Suspicious activity patterns
  RAPID_REQUESTS_THRESHOLD: 100, // requests per minute
  RAPID_REQUESTS_WINDOW: 60 * 1000, // 1 minute
  
  // Geographic anomalies
  LOCATION_CHANGE_THRESHOLD: 1000, // km/hour (impossible travel speed)
  
  // Token abuse
  TOKEN_REFRESH_THRESHOLD: 50, // per user per hour
  TOKEN_REFRESH_WINDOW: 60 * 60 * 1000, // 1 hour
  
  // Password reset abuse
  PASSWORD_RESET_THRESHOLD: 20, // per IP per hour
  PASSWORD_RESET_WINDOW: 60 * 60 * 1000, // 1 hour
};

interface SecurityThreat {
  type: 'brute_force' | 'account_takeover' | 'suspicious_activity' | 'token_abuse' | 'geographic_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ipAddress: string;
  userId?: string;
  userEmail?: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

interface SecurityMetrics {
  failedLogins: number;
  accountLockouts: number;
  suspiciousIPs: string[];
  tokenAbuse: number;
  passwordResetAbuse: number;
  activeThreats: SecurityThreat[];
}

class AuthSecurityMonitor {
  private static alertQueue: SecurityThreat[] = [];
  private static processingInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize security monitoring
   */
  static initialize(): void {
    if (!this.processingInterval) {
      this.processingInterval = setInterval(() => {
        this.processAlertQueue();
      }, 30 * 1000); // Process alerts every 30 seconds
    }

    // Start periodic security scans
    this.startPeriodicScans();
  }

  /**
   * Start periodic security scans
   */
  private static startPeriodicScans(): void {
    // Scan for threats every 5 minutes
    setInterval(async () => {
      await this.scanForThreats();
    }, 5 * 60 * 1000);

    // Generate security metrics every hour
    setInterval(async () => {
      await this.generateSecurityMetrics();
    }, 60 * 60 * 1000);
  }

  /**
   * Monitor authentication event for security threats
   */
  static async monitorAuthEvent(
    action: string,
    ipAddress: string,
    userAgent?: string,
    userId?: string,
    userEmail?: string,
    success: boolean = false,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Check for immediate threats
      const threats = await this.detectThreats(action, ipAddress, userAgent, userId, userEmail, success, metadata);
      
      // Add threats to alert queue
      for (const threat of threats) {
        this.alertQueue.push(threat);
      }

      // Process high-severity threats immediately
      const criticalThreats = threats.filter(t => t.severity === 'critical');
      if (criticalThreats.length > 0) {
        await this.processImmediateThreats(criticalThreats);
      }
    } catch (error) {
      console.error('Error monitoring auth event:', error);
    }
  }

  /**
   * Detect security threats from authentication events
   */
  private static async detectThreats(
    action: string,
    ipAddress: string,
    userAgent?: string,
    userId?: string,
    userEmail?: string,
    success: boolean = false,
    metadata: Record<string, any> = {}
  ): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];
    const now = new Date();

    try {
      // 1. Brute force detection
      if (action === 'login_failure') {
        const recentFailures = await this.getRecentFailedLogins(ipAddress, SECURITY_CONFIG.FAILED_LOGIN_WINDOW);
        
        if (recentFailures >= SECURITY_CONFIG.FAILED_LOGIN_THRESHOLD) {
          threats.push({
            type: 'brute_force',
            severity: 'high',
            description: `Brute force attack detected: ${recentFailures} failed login attempts from IP ${ipAddress}`,
            ipAddress,
            userId,
            userEmail,
            metadata: { failedAttempts: recentFailures, ...metadata },
            timestamp: now
          });
        }
      }

      // 2. Account lockout pattern detection
      if (action === 'account_locked') {
        const recentLockouts = await this.getRecentAccountLockouts(ipAddress, SECURITY_CONFIG.ACCOUNT_LOCKOUT_WINDOW);
        
        if (recentLockouts >= SECURITY_CONFIG.ACCOUNT_LOCKOUT_THRESHOLD) {
          threats.push({
            type: 'account_takeover',
            severity: 'critical',
            description: `Multiple account lockouts detected: ${recentLockouts} accounts locked from IP ${ipAddress}`,
            ipAddress,
            userId,
            userEmail,
            metadata: { lockedAccounts: recentLockouts, ...metadata },
            timestamp: now
          });
        }
      }

      // 3. Rapid request detection
      const recentRequests = await this.getRecentRequests(ipAddress, SECURITY_CONFIG.RAPID_REQUESTS_WINDOW);
      if (recentRequests >= SECURITY_CONFIG.RAPID_REQUESTS_THRESHOLD) {
        threats.push({
          type: 'suspicious_activity',
          severity: 'medium',
          description: `Rapid requests detected: ${recentRequests} requests per minute from IP ${ipAddress}`,
          ipAddress,
          userId,
          userEmail,
          metadata: { requestCount: recentRequests, ...metadata },
          timestamp: now
        });
      }

      // 4. Token refresh abuse detection
      if (action === 'token_refresh' && userId) {
        const recentRefreshes = await this.getRecentTokenRefreshes(userId, SECURITY_CONFIG.TOKEN_REFRESH_WINDOW);
        
        if (recentRefreshes >= SECURITY_CONFIG.TOKEN_REFRESH_THRESHOLD) {
          threats.push({
            type: 'token_abuse',
            severity: 'high',
            description: `Token refresh abuse detected: ${recentRefreshes} refreshes for user ${userEmail}`,
            ipAddress,
            userId,
            userEmail,
            metadata: { refreshCount: recentRefreshes, ...metadata },
            timestamp: now
          });
        }
      }

      // 5. Password reset abuse detection
      if (action === 'password_reset_request') {
        const recentResets = await this.getRecentPasswordResets(ipAddress, SECURITY_CONFIG.PASSWORD_RESET_WINDOW);
        
        if (recentResets >= SECURITY_CONFIG.PASSWORD_RESET_THRESHOLD) {
          threats.push({
            type: 'suspicious_activity',
            severity: 'medium',
            description: `Password reset abuse detected: ${recentResets} reset requests from IP ${ipAddress}`,
            ipAddress,
            userId,
            userEmail,
            metadata: { resetCount: recentResets, ...metadata },
            timestamp: now
          });
        }
      }

      // 6. Geographic anomaly detection (if location data available)
      if (success && userId && metadata.location) {
        const anomaly = await this.detectGeographicAnomaly(userId, metadata.location, ipAddress);
        if (anomaly) {
          threats.push(anomaly);
        }
      }

      // 7. User agent anomaly detection
      if (userAgent && userId) {
        const anomaly = await this.detectUserAgentAnomaly(userId, userAgent, ipAddress);
        if (anomaly) {
          threats.push(anomaly);
        }
      }

    } catch (error) {
      console.error('Error detecting threats:', error);
    }

    return threats;
  }

  /**
   * Get recent failed login attempts for an IP
   */
  private static async getRecentFailedLogins(ipAddress: string, windowMs: number): Promise<number> {
    const since = new Date(Date.now() - windowMs);
    
    const result = await db.select({ count: count() })
      .from(authenticationAuditLogs)
      .where(and(
        eq(authenticationAuditLogs.ipAddress, ipAddress),
        eq(authenticationAuditLogs.action, 'login_failure'),
        gte(authenticationAuditLogs.createdAt, since)
      ));

    return result[0]?.count || 0;
  }

  /**
   * Get recent account lockouts for an IP
   */
  private static async getRecentAccountLockouts(ipAddress: string, windowMs: number): Promise<number> {
    const since = new Date(Date.now() - windowMs);
    
    const result = await db.select({ count: count() })
      .from(authenticationAuditLogs)
      .where(and(
        eq(authenticationAuditLogs.ipAddress, ipAddress),
        eq(authenticationAuditLogs.action, 'account_locked'),
        gte(authenticationAuditLogs.createdAt, since)
      ));

    return result[0]?.count || 0;
  }

  /**
   * Get recent requests for an IP
   */
  private static async getRecentRequests(ipAddress: string, windowMs: number): Promise<number> {
    const since = new Date(Date.now() - windowMs);
    
    const result = await db.select({ count: count() })
      .from(authenticationAuditLogs)
      .where(and(
        eq(authenticationAuditLogs.ipAddress, ipAddress),
        gte(authenticationAuditLogs.createdAt, since)
      ));

    return result[0]?.count || 0;
  }

  /**
   * Get recent token refreshes for a user
   */
  private static async getRecentTokenRefreshes(userId: string, windowMs: number): Promise<number> {
    const since = new Date(Date.now() - windowMs);
    
    const result = await db.select({ count: count() })
      .from(authenticationAuditLogs)
      .where(and(
        eq(authenticationAuditLogs.userId, userId),
        eq(authenticationAuditLogs.action, 'token_refresh'),
        gte(authenticationAuditLogs.createdAt, since)
      ));

    return result[0]?.count || 0;
  }

  /**
   * Get recent password reset requests for an IP
   */
  private static async getRecentPasswordResets(ipAddress: string, windowMs: number): Promise<number> {
    const since = new Date(Date.now() - windowMs);
    
    const result = await db.select({ count: count() })
      .from(authenticationAuditLogs)
      .where(and(
        eq(authenticationAuditLogs.ipAddress, ipAddress),
        eq(authenticationAuditLogs.action, 'password_reset_request'),
        gte(authenticationAuditLogs.createdAt, since)
      ));

    return result[0]?.count || 0;
  }

  /**
   * Detect geographic anomalies
   */
  private static async detectGeographicAnomaly(
    userId: string, 
    currentLocation: { lat: number; lng: number }, 
    ipAddress: string
  ): Promise<SecurityThreat | null> {
    try {
      // Get the user's last successful login location
      const lastLogin = await db.select({
        metadata: authenticationAuditLogs.metadata,
        createdAt: authenticationAuditLogs.createdAt
      })
      .from(authenticationAuditLogs)
      .where(and(
        eq(authenticationAuditLogs.userId, userId),
        eq(authenticationAuditLogs.action, 'login_success'),
        eq(authenticationAuditLogs.success, true)
      ))
      .orderBy(desc(authenticationAuditLogs.createdAt))
      .limit(2); // Get last 2 to compare

      if (lastLogin.length < 2) return null;

      const previousLocation = lastLogin[1].metadata?.location;
      if (!previousLocation) return null;

      // Calculate distance and time difference
      const distance = this.calculateDistance(
        previousLocation.lat, 
        previousLocation.lng,
        currentLocation.lat, 
        currentLocation.lng
      );

      const timeDiff = new Date().getTime() - new Date(lastLogin[1].createdAt).getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      const speed = distance / hoursDiff; // km/h

      if (speed > SECURITY_CONFIG.LOCATION_CHANGE_THRESHOLD) {
        return {
          type: 'geographic_anomaly',
          severity: 'high',
          description: `Impossible travel detected: ${distance.toFixed(0)}km in ${hoursDiff.toFixed(1)} hours (${speed.toFixed(0)} km/h)`,
          ipAddress,
          userId,
          metadata: {
            previousLocation,
            currentLocation,
            distance,
            timeDiff: hoursDiff,
            speed
          },
          timestamp: new Date()
        };
      }

      return null;
    } catch (error) {
      console.error('Error detecting geographic anomaly:', error);
      return null;
    }
  }

  /**
   * Detect user agent anomalies
   */
  private static async detectUserAgentAnomaly(
    userId: string, 
    currentUserAgent: string, 
    ipAddress: string
  ): Promise<SecurityThreat | null> {
    try {
      // Get recent user agents for this user
      const recentUserAgents = await db.select({
        userAgent: authenticationAuditLogs.userAgent
      })
      .from(authenticationAuditLogs)
      .where(and(
        eq(authenticationAuditLogs.userId, userId),
        eq(authenticationAuditLogs.success, true),
        gte(authenticationAuditLogs.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
      ))
      .limit(10);

      const knownUserAgents = recentUserAgents.map(r => r.userAgent).filter(Boolean);
      
      // Check if current user agent is significantly different
      const isSuspicious = knownUserAgents.length > 0 && 
        !knownUserAgents.some(ua => this.areUserAgentsSimilar(ua!, currentUserAgent));

      if (isSuspicious) {
        return {
          type: 'suspicious_activity',
          severity: 'medium',
          description: `Unusual user agent detected for user`,
          ipAddress,
          userId,
          metadata: {
            currentUserAgent,
            knownUserAgents: knownUserAgents.slice(0, 3) // Include first 3 for comparison
          },
          timestamp: new Date()
        };
      }

      return null;
    } catch (error) {
      console.error('Error detecting user agent anomaly:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check if two user agents are similar
   */
  private static areUserAgentsSimilar(ua1: string, ua2: string): boolean {
    // Extract browser and OS information
    const extractInfo = (ua: string) => {
      const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/i)?.[0] || '';
      const os = ua.match(/(Windows|Mac|Linux|Android|iOS)/i)?.[0] || '';
      return { browser, os };
    };

    const info1 = extractInfo(ua1);
    const info2 = extractInfo(ua2);

    return info1.browser === info2.browser && info1.os === info2.os;
  }

  /**
   * Process immediate threats (critical severity)
   */
  private static async processImmediateThreats(threats: SecurityThreat[]): Promise<void> {
    for (const threat of threats) {
      try {
        // Log the threat
        await this.logSecurityAlert(threat);

        // Take immediate action based on threat type
        await this.takeSecurityAction(threat);

        console.error('CRITICAL SECURITY THREAT:', {
          type: threat.type,
          description: threat.description,
          ipAddress: threat.ipAddress,
          userId: threat.userId,
          timestamp: threat.timestamp
        });
      } catch (error) {
        console.error('Error processing immediate threat:', error);
      }
    }
  }

  /**
   * Process alert queue
   */
  private static async processAlertQueue(): Promise<void> {
    if (this.alertQueue.length === 0) return;

    const alerts = this.alertQueue.splice(0); // Take all alerts

    for (const alert of alerts) {
      try {
        await this.logSecurityAlert(alert);
        await this.takeSecurityAction(alert);
      } catch (error) {
        console.error('Error processing security alert:', error);
      }
    }
  }

  /**
   * Log security alert to database
   */
  private static async logSecurityAlert(threat: SecurityThreat): Promise<void> {
    try {
      const alertData: InsertSecurityAlert = {
        type: threat.type,
        severity: threat.severity,
        description: threat.description,
        ipAddress: threat.ipAddress,
        userId: threat.userId || null,
        userEmail: threat.userEmail || null,
        metadata: threat.metadata,
        status: 'active',
        createdAt: threat.timestamp
      };

      await db.insert(securityAlerts).values(alertData);
    } catch (error) {
      console.error('Error logging security alert:', error);
    }
  }

  /**
   * Take automated security actions
   */
  private static async takeSecurityAction(threat: SecurityThreat): Promise<void> {
    try {
      switch (threat.type) {
        case 'brute_force':
          // Could implement IP blocking here
          console.warn(`Brute force detected from ${threat.ipAddress} - consider IP blocking`);
          break;

        case 'account_takeover':
          // Could implement account suspension or additional verification
          console.error(`Account takeover attempt detected from ${threat.ipAddress} - immediate action required`);
          break;

        case 'token_abuse':
          // Could revoke all tokens for the user
          console.warn(`Token abuse detected for user ${threat.userEmail} - consider token revocation`);
          break;

        case 'geographic_anomaly':
          // Could require additional verification
          console.warn(`Geographic anomaly detected for user ${threat.userEmail} - consider additional verification`);
          break;

        case 'suspicious_activity':
          // Could implement rate limiting or monitoring
          console.warn(`Suspicious activity detected from ${threat.ipAddress} - monitoring increased`);
          break;
      }
    } catch (error) {
      console.error('Error taking security action:', error);
    }
  }

  /**
   * Scan for ongoing threats
   */
  private static async scanForThreats(): Promise<void> {
    try {
      console.log('Running periodic security threat scan...');
      
      // This could include more sophisticated analysis
      // For now, we'll just log that the scan is running
      
      const recentAlerts = await db.select()
        .from(securityAlerts)
        .where(and(
          eq(securityAlerts.status, 'active'),
          gte(securityAlerts.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
        ))
        .orderBy(desc(securityAlerts.createdAt))
        .limit(10);

      if (recentAlerts.length > 0) {
        console.log(`Found ${recentAlerts.length} active security alerts in the last 24 hours`);
      }
    } catch (error) {
      console.error('Error scanning for threats:', error);
    }
  }

  /**
   * Generate security metrics
   */
  private static async generateSecurityMetrics(): Promise<SecurityMetrics> {
    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Get failed login count
      const failedLoginsResult = await db.select({ count: count() })
        .from(authenticationAuditLogs)
        .where(and(
          eq(authenticationAuditLogs.action, 'login_failure'),
          gte(authenticationAuditLogs.createdAt, last24Hours)
        ));

      // Get account lockout count
      const accountLockoutsResult = await db.select({ count: count() })
        .from(authenticationAuditLogs)
        .where(and(
          eq(authenticationAuditLogs.action, 'account_locked'),
          gte(authenticationAuditLogs.createdAt, last24Hours)
        ));

      // Get suspicious IPs (IPs with multiple failed attempts)
      const suspiciousIPsResult = await db.select({
        ipAddress: authenticationAuditLogs.ipAddress,
        count: count()
      })
      .from(authenticationAuditLogs)
      .where(and(
        eq(authenticationAuditLogs.action, 'login_failure'),
        gte(authenticationAuditLogs.createdAt, last24Hours)
      ))
      .groupBy(authenticationAuditLogs.ipAddress)
      .having(sql`count(*) >= 5`);

      // Get active threats
      const activeThreatsResult = await db.select()
        .from(securityAlerts)
        .where(and(
          eq(securityAlerts.status, 'active'),
          gte(securityAlerts.createdAt, last24Hours)
        ))
        .orderBy(desc(securityAlerts.createdAt));

      const metrics: SecurityMetrics = {
        failedLogins: failedLoginsResult[0]?.count || 0,
        accountLockouts: accountLockoutsResult[0]?.count || 0,
        suspiciousIPs: suspiciousIPsResult.map(r => r.ipAddress),
        tokenAbuse: 0, // Could be calculated similarly
        passwordResetAbuse: 0, // Could be calculated similarly
        activeThreats: activeThreatsResult.map(alert => ({
          type: alert.type as SecurityThreat['type'],
          severity: alert.severity as SecurityThreat['severity'],
          description: alert.description,
          ipAddress: alert.ipAddress,
          userId: alert.userId || undefined,
          userEmail: alert.userEmail || undefined,
          metadata: alert.metadata as Record<string, any>,
          timestamp: alert.createdAt
        }))
      };

      console.log('Security metrics generated:', {
        failedLogins: metrics.failedLogins,
        accountLockouts: metrics.accountLockouts,
        suspiciousIPCount: metrics.suspiciousIPs.length,
        activeThreatsCount: metrics.activeThreats.length
      });

      return metrics;
    } catch (error) {
      console.error('Error generating security metrics:', error);
      return {
        failedLogins: 0,
        accountLockouts: 0,
        suspiciousIPs: [],
        tokenAbuse: 0,
        passwordResetAbuse: 0,
        activeThreats: []
      };
    }
  }

  /**
   * Get security dashboard data
   */
  static async getSecurityDashboard(): Promise<{
    metrics: SecurityMetrics;
    recentAlerts: any[];
    topThreats: { type: string; count: number }[];
  }> {
    try {
      const metrics = await this.generateSecurityMetrics();
      
      const recentAlerts = await db.select()
        .from(securityAlerts)
        .where(gte(securityAlerts.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))) // Last 7 days
        .orderBy(desc(securityAlerts.createdAt))
        .limit(20);

      const topThreatsResult = await db.select({
        type: securityAlerts.type,
        count: count()
      })
      .from(securityAlerts)
      .where(gte(securityAlerts.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
      .groupBy(securityAlerts.type)
      .orderBy(desc(count()));

      return {
        metrics,
        recentAlerts,
        topThreats: topThreatsResult
      };
    } catch (error) {
      console.error('Error getting security dashboard data:', error);
      throw error;
    }
  }

  /**
   * Shutdown monitoring
   */
  static shutdown(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.alertQueue = [];
  }
}

export { AuthSecurityMonitor, SecurityThreat, SecurityMetrics };