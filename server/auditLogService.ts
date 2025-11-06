import { db } from './db';
import { authenticationAuditLogs, InsertAuthenticationAuditLog } from '@shared/schema';
import { eq, and, gte, lt, desc } from 'drizzle-orm';

export interface AuditLogQuery {
  userId?: string;
  userEmail?: string;
  action?: string;
  ipAddress?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditLogStats {
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  uniqueUsers: number;
  uniqueIPs: number;
  topActions: Array<{ action: string; count: number }>;
  topFailureReasons: Array<{ reason: string; count: number }>;
}

export class AuditLogService {
  /**
   * Log authentication event
   */
  static async logEvent(
    action: string,
    ipAddress: string,
    userAgent?: string,
    userId?: string,
    userEmail?: string,
    userRole?: string,
    success: boolean = false,
    failureReason?: string,
    sessionId?: string,
    tokenJti?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const auditLog: InsertAuthenticationAuditLog = {
        userId,
        userEmail,
        userRole,
        action,
        ipAddress,
        userAgent,
        sessionId,
        tokenJti,
        success,
        failureReason,
        metadata: metadata || {}
      };

      await db.insert(authenticationAuditLogs).values(auditLog);
    } catch (error) {
      console.error('Error logging authentication event:', error);
      // Don't throw error to avoid breaking authentication flow
    }
  }

  /**
   * Query audit logs with filters
   */
  static async queryLogs(query: AuditLogQuery): Promise<any[]> {
    try {
      // Build where conditions
      const conditions = [];

      if (query.userId) {
        conditions.push(eq(authenticationAuditLogs.userId, query.userId));
      }

      if (query.userEmail) {
        conditions.push(eq(authenticationAuditLogs.userEmail, query.userEmail));
      }

      if (query.action) {
        conditions.push(eq(authenticationAuditLogs.action, query.action));
      }

      if (query.ipAddress) {
        conditions.push(eq(authenticationAuditLogs.ipAddress, query.ipAddress));
      }

      if (query.success !== undefined) {
        conditions.push(eq(authenticationAuditLogs.success, query.success));
      }

      if (query.startDate) {
        conditions.push(gte(authenticationAuditLogs.createdAt, query.startDate));
      }

      if (query.endDate) {
        conditions.push(lt(authenticationAuditLogs.createdAt, query.endDate));
      }

      // Build the query
      let dbQuery = db.select().from(authenticationAuditLogs);

      if (conditions.length > 0) {
        dbQuery = dbQuery.where(and(...conditions)) as any;
      }

      // Add ordering
      dbQuery = dbQuery.orderBy(desc(authenticationAuditLogs.createdAt)) as any;

      // Add pagination
      if (query.limit) {
        dbQuery = dbQuery.limit(query.limit) as any;
      }

      if (query.offset) {
        dbQuery = dbQuery.offset(query.offset) as any;
      }

      return await dbQuery;
    } catch (error) {
      console.error('Error querying audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit log statistics
   */
  static async getStats(startDate?: Date, endDate?: Date): Promise<AuditLogStats> {
    try {
      const conditions = [];

      if (startDate) {
        conditions.push(gte(authenticationAuditLogs.createdAt, startDate));
      }

      if (endDate) {
        conditions.push(lt(authenticationAuditLogs.createdAt, endDate));
      }

      let baseQuery = db.select().from(authenticationAuditLogs);
      
      if (conditions.length > 0) {
        baseQuery = baseQuery.where(and(...conditions)) as any;
      }

      const logs = await baseQuery;

      const totalEvents = logs.length;
      const successfulEvents = logs.filter(log => log.success).length;
      const failedEvents = totalEvents - successfulEvents;
      
      const uniqueUsers = new Set(logs.map(log => log.userId).filter(Boolean)).size;
      const uniqueIPs = new Set(logs.map(log => log.ipAddress)).size;

      // Count actions
      const actionCounts = logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Count failure reasons
      const failureReasonCounts = logs
        .filter(log => !log.success && log.failureReason)
        .reduce((acc, log) => {
          const reason = log.failureReason!;
          acc[reason] = (acc[reason] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const topFailureReasons = Object.entries(failureReasonCounts)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalEvents,
        successfulEvents,
        failedEvents,
        uniqueUsers,
        uniqueIPs,
        topActions,
        topFailureReasons
      };
    } catch (error) {
      console.error('Error getting audit log stats:', error);
      return {
        totalEvents: 0,
        successfulEvents: 0,
        failedEvents: 0,
        uniqueUsers: 0,
        uniqueIPs: 0,
        topActions: [],
        topFailureReasons: []
      };
    }
  }

  /**
   * Get recent failed login attempts for a user
   */
  static async getRecentFailedAttempts(
    userEmail: string, 
    timeWindowMinutes: number = 15
  ): Promise<any[]> {
    try {
      const startTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

      return await db.select()
        .from(authenticationAuditLogs)
        .where(and(
          eq(authenticationAuditLogs.userEmail, userEmail),
          eq(authenticationAuditLogs.action, 'login_failure'),
          eq(authenticationAuditLogs.success, false),
          gte(authenticationAuditLogs.createdAt, startTime)
        ))
        .orderBy(desc(authenticationAuditLogs.createdAt));
    } catch (error) {
      console.error('Error getting recent failed attempts:', error);
      return [];
    }
  }

  /**
   * Get suspicious activity (multiple failed attempts from same IP)
   */
  static async getSuspiciousActivity(
    timeWindowMinutes: number = 60,
    minAttempts: number = 10
  ): Promise<Array<{ ipAddress: string; attempts: number; lastAttempt: Date }>> {
    try {
      const startTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

      const logs = await db.select()
        .from(authenticationAuditLogs)
        .where(and(
          eq(authenticationAuditLogs.success, false),
          gte(authenticationAuditLogs.createdAt, startTime)
        ));

      // Group by IP address
      const ipCounts = logs.reduce((acc, log) => {
        const ip = log.ipAddress;
        if (!acc[ip]) {
          acc[ip] = { attempts: 0, lastAttempt: log.createdAt || new Date() };
        }
        acc[ip].attempts++;
        if (log.createdAt && (!acc[ip].lastAttempt || log.createdAt > acc[ip].lastAttempt)) {
          acc[ip].lastAttempt = log.createdAt;
        }
        return acc;
      }, {} as Record<string, { attempts: number; lastAttempt: Date | null }>);

      return Object.entries(ipCounts)
        .filter(([_, data]) => data.attempts >= minAttempts)
        .map(([ipAddress, data]) => ({
          ipAddress,
          attempts: data.attempts,
          lastAttempt: data.lastAttempt || new Date()
        }))
        .sort((a, b) => b.attempts - a.attempts);
    } catch (error) {
      console.error('Error getting suspicious activity:', error);
      return [];
    }
  }

  /**
   * Clean up old audit logs (retention policy)
   */
  static async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      const result = await db.delete(authenticationAuditLogs)
        .where(lt(authenticationAuditLogs.createdAt, cutoffDate));

      console.log(`Cleaned up audit logs older than ${retentionDays} days`);
      return result.rowCount || 0;
    } catch (error) {
      console.error('Error cleaning up old audit logs:', error);
      return 0;
    }
  }

  /**
   * Export audit logs for compliance
   */
  static async exportLogs(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      const logs = await this.queryLogs({
        startDate,
        endDate,
        limit: 10000 // Reasonable limit for export
      });

      if (format === 'csv') {
        const headers = [
          'Timestamp',
          'User ID',
          'User Email',
          'User Role',
          'Action',
          'IP Address',
          'User Agent',
          'Session ID',
          'Token JTI',
          'Success',
          'Failure Reason',
          'Metadata'
        ];

        const csvRows = logs.map(log => [
          log.createdAt.toISOString(),
          log.userId || '',
          log.userEmail || '',
          log.userRole || '',
          log.action,
          log.ipAddress,
          log.userAgent || '',
          log.sessionId || '',
          log.tokenJti || '',
          log.success.toString(),
          log.failureReason || '',
          JSON.stringify(log.metadata || {})
        ]);

        return [headers, ...csvRows]
          .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
          .join('\n');
      } else {
        return JSON.stringify(logs, null, 2);
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      return format === 'json' ? '[]' : '';
    }
  }
}

export default AuditLogService;