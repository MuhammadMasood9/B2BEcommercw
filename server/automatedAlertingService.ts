import { db } from './db';
import { 
  systemAlerts, 
  alertRules, 
  alertConfiguration, 
  alertHistory, 
  alertMetrics,
  notificationDeliveryLog,
  supplierProfiles,
  products,
  orders,
  users
} from '@shared/schema';
import { eq, and, gte, desc, count, sql, avg, sum, lt, gt, ne } from 'drizzle-orm';

// ==================== ALERT GENERATION ====================

export interface AlertData {
  type: 'system' | 'security' | 'business' | 'compliance' | 'performance' | 'capacity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  source: string;
  entityId?: string;
  entityType?: string;
  metadata?: any;
}

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  type: 'threshold' | 'anomaly' | 'pattern' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  condition: string;
  threshold?: number;
  timeWindow: number;
  query?: string;
  aggregation: string;
  enabled: boolean;
  notificationChannels: string[];
  escalationRules: any[];
  suppressDuration: number;
  maxAlertsPerHour: number;
  createdBy: string;
}

export interface EscalationRule {
  id: string;
  delay: number; // minutes
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: string[];
  recipients: string[];
}

export interface NotificationChannel {
  type: 'email' | 'sms' | 'webhook' | 'in_app' | 'slack';
  enabled: boolean;
  config: any;
}

// ==================== ALERT CREATION ====================

export async function createAlert(alertData: AlertData): Promise<string> {
  try {
    // Check for duplicate alerts within suppression window
    const suppressionWindow = new Date(Date.now() - 3600000); // 1 hour default
    
    const existingAlert = await db
      .select()
      .from(systemAlerts)
      .where(
        and(
          eq(systemAlerts.title, alertData.title),
          eq(systemAlerts.source, alertData.source),
          gte(systemAlerts.createdAt, suppressionWindow),
          eq(systemAlerts.resolved, false)
        )
      )
      .limit(1);
    
    if (existingAlert.length > 0) {
      console.log(`Alert suppressed: ${alertData.title} (duplicate within suppression window)`);
      return existingAlert[0].id;
    }
    
    // Create new alert
    const [newAlert] = await db
      .insert(systemAlerts)
      .values({
        type: alertData.type,
        severity: alertData.severity,
        title: alertData.title,
        message: alertData.message,
        source: alertData.source,
        entityId: alertData.entityId,
        entityType: alertData.entityType,
        metadata: alertData.metadata || {},
      })
      .returning();
    
    // Log alert creation
    await logAlertHistory(newAlert.id, 'created', undefined, {
      severity: alertData.severity,
      type: alertData.type,
      source: alertData.source,
    });
    
    // Send notifications
    await sendAlertNotifications(newAlert.id, alertData);
    
    // Update metrics
    await updateAlertMetrics(alertData);
    
    console.log(`Alert created: ${newAlert.id} - ${alertData.title}`);
    return newAlert.id;
    
  } catch (error) {
    console.error('Error creating alert:', error);
    throw error;
  }
}

// ==================== ALERT MONITORING ====================

export async function checkAlertRules(): Promise<void> {
  try {
    console.log('🔍 Checking alert rules...');
    
    // Get all enabled alert rules
    const rules = await db
      .select()
      .from(alertRules)
      .where(eq(alertRules.enabled, true));
    
    for (const rule of rules) {
      await evaluateAlertRule(rule);
    }
    
    console.log(`✅ Checked ${rules.length} alert rules`);
    
  } catch (error) {
    console.error('Error checking alert rules:', error);
  }
}

async function evaluateAlertRule(rule: any): Promise<void> {
  try {
    let shouldAlert = false;
    let alertMessage = '';
    let currentValue: any = null;
    
    // Evaluate different types of metrics
    switch (rule.metric) {
      case 'pending_suppliers':
        currentValue = await getPendingSuppliersCount();
        shouldAlert = evaluateCondition(currentValue, rule.condition, rule.threshold);
        alertMessage = `${currentValue} suppliers pending approval (threshold: ${rule.threshold})`;
        break;
        
      case 'failed_logins':
        currentValue = await getFailedLoginsCount(rule.timeWindow);
        shouldAlert = evaluateCondition(currentValue, rule.condition, rule.threshold);
        alertMessage = `${currentValue} failed login attempts in last ${rule.timeWindow / 60} minutes (threshold: ${rule.threshold})`;
        break;
        
      case 'error_rate':
        currentValue = await getErrorRate(rule.timeWindow);
        shouldAlert = evaluateCondition(currentValue, rule.condition, rule.threshold);
        alertMessage = `API error rate: ${currentValue}% (threshold: ${rule.threshold}%)`;
        break;
        
      case 'cpu_usage':
        currentValue = await getCPUUsage();
        shouldAlert = evaluateCondition(currentValue, rule.condition, rule.threshold);
        alertMessage = `CPU usage: ${currentValue}% (threshold: ${rule.threshold}%)`;
        break;
        
      case 'memory_usage':
        currentValue = await getMemoryUsage();
        shouldAlert = evaluateCondition(currentValue, rule.condition, rule.threshold);
        alertMessage = `Memory usage: ${currentValue}% (threshold: ${rule.threshold}%)`;
        break;
        
      case 'disk_usage':
        currentValue = await getDiskUsage();
        shouldAlert = evaluateCondition(currentValue, rule.condition, rule.threshold);
        alertMessage = `Disk usage: ${currentValue}% (threshold: ${rule.threshold}%)`;
        break;
        
      case 'order_processing_delay':
        currentValue = await getOrderProcessingDelay();
        shouldAlert = evaluateCondition(currentValue, rule.condition, rule.threshold);
        alertMessage = `Average order processing delay: ${currentValue} hours (threshold: ${rule.threshold} hours)`;
        break;
        
      default:
        console.log(`Unknown metric: ${rule.metric}`);
        return;
    }
    
    if (shouldAlert) {
      // Check rate limiting
      const hourlyAlertCount = await getHourlyAlertCount(rule.id);
      if (hourlyAlertCount >= rule.maxAlertsPerHour) {
        console.log(`Rate limit exceeded for rule ${rule.name}: ${hourlyAlertCount}/${rule.maxAlertsPerHour}`);
        return;
      }
      
      // Create alert
      await createAlert({
        type: getAlertTypeFromMetric(rule.metric),
        severity: rule.severity,
        title: rule.name,
        message: `${rule.description}: ${alertMessage}`,
        source: `alert_rule_${rule.id}`,
        metadata: {
          ruleId: rule.id,
          metric: rule.metric,
          currentValue,
          threshold: rule.threshold,
          condition: rule.condition,
        },
      });
    }
    
  } catch (error) {
    console.error(`Error evaluating alert rule ${rule.name}:`, error);
  }
}

function evaluateCondition(value: number, condition: string, threshold: number): boolean {
  switch (condition) {
    case 'greater_than':
      return value > threshold;
    case 'less_than':
      return value < threshold;
    case 'equals':
      return value === threshold;
    case 'not_equals':
      return value !== threshold;
    case 'greater_than_or_equal':
      return value >= threshold;
    case 'less_than_or_equal':
      return value <= threshold;
    default:
      return false;
  }
}

function getAlertTypeFromMetric(metric: string): 'system' | 'security' | 'business' | 'compliance' | 'performance' | 'capacity' {
  if (metric.includes('cpu') || metric.includes('memory') || metric.includes('disk')) {
    return 'system';
  }
  if (metric.includes('login') || metric.includes('security')) {
    return 'security';
  }
  if (metric.includes('supplier') || metric.includes('order') || metric.includes('revenue')) {
    return 'business';
  }
  if (metric.includes('error') || metric.includes('response')) {
    return 'performance';
  }
  return 'system';
}

// ==================== METRIC COLLECTION ====================

async function getPendingSuppliersCount(): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(supplierProfiles)
    .where(eq(supplierProfiles.status, 'pending'));
  
  return Number(result?.count || 0);
}

async function getFailedLoginsCount(timeWindowSeconds: number): Promise<number> {
  // Mock implementation - in production, this would query actual login logs
  return Math.floor(Math.random() * 50);
}

async function getErrorRate(timeWindowSeconds: number): Promise<number> {
  // Mock implementation - in production, this would query actual error logs
  return Math.random() * 10;
}

async function getCPUUsage(): Promise<number> {
  // Mock implementation - in production, this would query system metrics
  return Math.random() * 100;
}

async function getMemoryUsage(): Promise<number> {
  // Mock implementation - in production, this would query system metrics
  return Math.random() * 100;
}

async function getDiskUsage(): Promise<number> {
  // Mock implementation - in production, this would query system metrics
  return Math.random() * 100;
}

async function getOrderProcessingDelay(): Promise<number> {
  // Calculate average time between order creation and processing
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Mock implementation - in production, this would calculate actual delays
  return Math.random() * 48; // Random delay up to 48 hours
}

async function getHourlyAlertCount(ruleId: string): Promise<number> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const [result] = await db
    .select({ count: count() })
    .from(systemAlerts)
    .where(
      and(
        sql`${systemAlerts.metadata}->>'ruleId' = ${ruleId}`,
        gte(systemAlerts.createdAt, oneHourAgo)
      )
    );
  
  return Number(result?.count || 0);
}

// ==================== NOTIFICATION SYSTEM ====================

export async function sendAlertNotifications(alertId: string, alertData: AlertData): Promise<void> {
  try {
    // Get alert configuration
    const [config] = await db
      .select()
      .from(alertConfiguration)
      .where(eq(alertConfiguration.id, 'global'));
    
    if (!config || !config.globalSettings?.enableNotifications) {
      console.log('Notifications disabled globally');
      return;
    }
    
    const channels = config.notificationChannels as any;
    
    // Send notifications through enabled channels
    const notifications = [];
    
    if (channels.email?.enabled) {
      notifications.push(sendEmailNotification(alertId, alertData, channels.email));
    }
    
    if (channels.sms?.enabled) {
      notifications.push(sendSMSNotification(alertId, alertData, channels.sms));
    }
    
    if (channels.webhook?.enabled) {
      notifications.push(sendWebhookNotification(alertId, alertData, channels.webhook));
    }
    
    if (channels.inApp?.enabled) {
      notifications.push(sendInAppNotification(alertId, alertData, channels.inApp));
    }
    
    if (channels.slack?.enabled) {
      notifications.push(sendSlackNotification(alertId, alertData, channels.slack));
    }
    
    await Promise.allSettled(notifications);
    
  } catch (error) {
    console.error('Error sending alert notifications:', error);
  }
}

async function sendEmailNotification(alertId: string, alertData: AlertData, config: any): Promise<void> {
  try {
    // Mock email sending - in production, integrate with email service
    console.log(`📧 Sending email notification for alert: ${alertData.title}`);
    
    for (const recipient of config.recipients || []) {
      await logNotificationDelivery(alertId, 'email', recipient, 'sent');
    }
    
  } catch (error) {
    console.error('Error sending email notification:', error);
    for (const recipient of config.recipients || []) {
      await logNotificationDelivery(alertId, 'email', recipient, 'failed', error.message);
    }
  }
}

async function sendSMSNotification(alertId: string, alertData: AlertData, config: any): Promise<void> {
  try {
    // Mock SMS sending - in production, integrate with SMS service (Twilio, etc.)
    console.log(`📱 Sending SMS notification for alert: ${alertData.title}`);
    
    for (const recipient of config.recipients || []) {
      await logNotificationDelivery(alertId, 'sms', recipient, 'sent');
    }
    
  } catch (error) {
    console.error('Error sending SMS notification:', error);
    for (const recipient of config.recipients || []) {
      await logNotificationDelivery(alertId, 'sms', recipient, 'failed', error.message);
    }
  }
}

async function sendWebhookNotification(alertId: string, alertData: AlertData, config: any): Promise<void> {
  try {
    // Mock webhook sending - in production, make HTTP request to webhook URL
    console.log(`🔗 Sending webhook notification for alert: ${alertData.title}`);
    
    const payload = {
      alertId,
      type: alertData.type,
      severity: alertData.severity,
      title: alertData.title,
      message: alertData.message,
      source: alertData.source,
      timestamp: new Date().toISOString(),
    };
    
    // In production: await fetch(config.url, { method: 'POST', body: JSON.stringify(payload), headers: config.headers })
    
    await logNotificationDelivery(alertId, 'webhook', config.url, 'sent');
    
  } catch (error) {
    console.error('Error sending webhook notification:', error);
    await logNotificationDelivery(alertId, 'webhook', config.url, 'failed', error.message);
  }
}

async function sendInAppNotification(alertId: string, alertData: AlertData, config: any): Promise<void> {
  try {
    // Create in-app notification - this would integrate with WebSocket for real-time delivery
    console.log(`🔔 Sending in-app notification for alert: ${alertData.title}`);
    
    // In production: broadcast to connected admin users via WebSocket
    
    await logNotificationDelivery(alertId, 'in_app', 'admin_users', 'sent');
    
  } catch (error) {
    console.error('Error sending in-app notification:', error);
    await logNotificationDelivery(alertId, 'in_app', 'admin_users', 'failed', error.message);
  }
}

async function sendSlackNotification(alertId: string, alertData: AlertData, config: any): Promise<void> {
  try {
    // Mock Slack notification - in production, send to Slack webhook
    console.log(`💬 Sending Slack notification for alert: ${alertData.title}`);
    
    const payload = {
      channel: config.channel,
      text: `🚨 *${alertData.severity.toUpperCase()}* Alert: ${alertData.title}`,
      attachments: [
        {
          color: getSeverityColor(alertData.severity),
          fields: [
            { title: 'Message', value: alertData.message, short: false },
            { title: 'Source', value: alertData.source, short: true },
            { title: 'Type', value: alertData.type, short: true },
          ],
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };
    
    // In production: await fetch(config.webhookUrl, { method: 'POST', body: JSON.stringify(payload) })
    
    await logNotificationDelivery(alertId, 'slack', config.channel, 'sent');
    
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    await logNotificationDelivery(alertId, 'slack', config.channel, 'failed', error.message);
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'danger';
    case 'high': return 'warning';
    case 'medium': return 'good';
    case 'low': return '#36a64f';
    default: return 'good';
  }
}

// ==================== ESCALATION SYSTEM ====================

export async function checkAlertEscalation(): Promise<void> {
  try {
    console.log('🔄 Checking alert escalation...');
    
    // Get configuration
    const [config] = await db
      .select()
      .from(alertConfiguration)
      .where(eq(alertConfiguration.id, 'global'));
    
    if (!config?.globalSettings?.autoEscalationEnabled) {
      return;
    }
    
    const escalationDelay = (config.globalSettings as any).escalationDelayMinutes || 30;
    const escalationTime = new Date(Date.now() - escalationDelay * 60 * 1000);
    
    // Find unacknowledged critical and high alerts older than escalation delay
    const alertsToEscalate = await db
      .select()
      .from(systemAlerts)
      .where(
        and(
          eq(systemAlerts.acknowledged, false),
          eq(systemAlerts.resolved, false),
          sql`${systemAlerts.severity} IN ('critical', 'high')`,
          lt(systemAlerts.createdAt, escalationTime),
          sql`${systemAlerts.escalationLevel} < 3` // Max 3 escalation levels
        )
      );
    
    for (const alert of alertsToEscalate) {
      await escalateAlert(alert.id);
    }
    
    console.log(`✅ Processed ${alertsToEscalate.length} alerts for escalation`);
    
  } catch (error) {
    console.error('Error checking alert escalation:', error);
  }
}

async function escalateAlert(alertId: string): Promise<void> {
  try {
    // Update alert escalation level
    const [updatedAlert] = await db
      .update(systemAlerts)
      .set({
        escalationLevel: sql`${systemAlerts.escalationLevel} + 1`,
        escalatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(systemAlerts.id, alertId))
      .returning();
    
    // Log escalation
    await logAlertHistory(alertId, 'escalated', undefined, {
      escalationLevel: updatedAlert.escalationLevel,
      escalatedAt: updatedAlert.escalatedAt,
    });
    
    // Send escalation notifications (higher priority channels)
    const escalationChannels = ['email', 'sms', 'slack'];
    // In production: send notifications through escalation channels
    
    console.log(`🔺 Alert escalated: ${alertId} (level ${updatedAlert.escalationLevel})`);
    
  } catch (error) {
    console.error(`Error escalating alert ${alertId}:`, error);
  }
}

// ==================== ALERT MANAGEMENT ====================

export async function acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
  try {
    await db
      .update(systemAlerts)
      .set({
        acknowledged: true,
        acknowledgedBy,
        acknowledgedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(systemAlerts.id, alertId));
    
    await logAlertHistory(alertId, 'acknowledged', acknowledgedBy);
    
    console.log(`✅ Alert acknowledged: ${alertId} by ${acknowledgedBy}`);
    
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    throw error;
  }
}

export async function resolveAlert(alertId: string, resolvedBy: string, resolution: string): Promise<void> {
  try {
    await db
      .update(systemAlerts)
      .set({
        resolved: true,
        resolvedBy,
        resolvedAt: new Date(),
        resolution,
        updatedAt: new Date(),
      })
      .where(eq(systemAlerts.id, alertId));
    
    await logAlertHistory(alertId, 'resolved', resolvedBy, { resolution });
    
    console.log(`✅ Alert resolved: ${alertId} by ${resolvedBy}`);
    
  } catch (error) {
    console.error('Error resolving alert:', error);
    throw error;
  }
}

// ==================== UTILITY FUNCTIONS ====================

async function logAlertHistory(alertId: string, action: string, performedBy?: string, details?: any): Promise<void> {
  try {
    await db
      .insert(alertHistory)
      .values({
        alertId,
        action,
        performedBy,
        details: details || {},
      });
  } catch (error) {
    console.error('Error logging alert history:', error);
  }
}

async function logNotificationDelivery(
  alertId: string, 
  channel: string, 
  recipient: string, 
  status: string, 
  errorMessage?: string
): Promise<void> {
  try {
    await db
      .insert(notificationDeliveryLog)
      .values({
        alertId,
        channel,
        recipient,
        status,
        errorMessage,
        deliveredAt: status === 'sent' || status === 'delivered' ? new Date() : undefined,
      });
  } catch (error) {
    console.error('Error logging notification delivery:', error);
  }
}

async function updateAlertMetrics(alertData: AlertData): Promise<void> {
  try {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const hour = now.getHours();
    
    // Upsert alert metrics
    await db
      .insert(alertMetrics)
      .values({
        date: new Date(date),
        hour,
        [`${alertData.severity}Count`]: 1,
        [`${alertData.type}Count`]: 1,
      })
      .onConflictDoUpdate({
        target: [alertMetrics.date, alertMetrics.hour],
        set: {
          [`${alertData.severity}Count`]: sql`${alertMetrics[`${alertData.severity}Count` as keyof typeof alertMetrics]} + 1`,
          [`${alertData.type}Count`]: sql`${alertMetrics[`${alertData.type}Count` as keyof typeof alertMetrics]} + 1`,
        },
      });
      
  } catch (error) {
    console.error('Error updating alert metrics:', error);
  }
}

// ==================== ALERT ANALYTICS ====================

export async function getAlertAnalytics(timeRange: string = '24h'): Promise<any> {
  try {
    const timeRangeHours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720; // 30d
    const startTime = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
    
    // Get alert counts by severity
    const severityCounts = await db
      .select({
        severity: systemAlerts.severity,
        count: count(),
      })
      .from(systemAlerts)
      .where(gte(systemAlerts.createdAt, startTime))
      .groupBy(systemAlerts.severity);
    
    // Get alert counts by type
    const typeCounts = await db
      .select({
        type: systemAlerts.type,
        count: count(),
      })
      .from(systemAlerts)
      .where(gte(systemAlerts.createdAt, startTime))
      .groupBy(systemAlerts.type);
    
    // Get response time metrics
    const responseMetrics = await db
      .select({
        avgAcknowledgmentTime: avg(sql`EXTRACT(EPOCH FROM (${systemAlerts.acknowledgedAt} - ${systemAlerts.createdAt}))`),
        avgResolutionTime: avg(sql`EXTRACT(EPOCH FROM (${systemAlerts.resolvedAt} - ${systemAlerts.createdAt}))`),
      })
      .from(systemAlerts)
      .where(
        and(
          gte(systemAlerts.createdAt, startTime),
          eq(systemAlerts.resolved, true)
        )
      );
    
    // Get escalation statistics
    const escalationStats = await db
      .select({
        escalated: count(sql`CASE WHEN ${systemAlerts.escalationLevel} > 0 THEN 1 END`),
        total: count(),
      })
      .from(systemAlerts)
      .where(gte(systemAlerts.createdAt, startTime));
    
    return {
      timeRange,
      severityCounts: severityCounts.reduce((acc, item) => {
        acc[item.severity] = Number(item.count);
        return acc;
      }, {} as Record<string, number>),
      typeCounts: typeCounts.reduce((acc, item) => {
        acc[item.type] = Number(item.count);
        return acc;
      }, {} as Record<string, number>),
      responseMetrics: {
        avgAcknowledgmentTime: Math.round(Number(responseMetrics[0]?.avgAcknowledgmentTime || 0)),
        avgResolutionTime: Math.round(Number(responseMetrics[0]?.avgResolutionTime || 0)),
      },
      escalationRate: escalationStats[0] ? 
        (Number(escalationStats[0].escalated) / Number(escalationStats[0].total)) * 100 : 0,
    };
    
  } catch (error) {
    console.error('Error getting alert analytics:', error);
    throw error;
  }
}

// ==================== BACKGROUND MONITORING ====================

// This function should be called periodically (e.g., every 5 minutes)
export async function runAlertMonitoring(): Promise<void> {
  try {
    console.log('🔍 Running automated alert monitoring...');
    
    // Check alert rules
    await checkAlertRules();
    
    // Check for escalations
    await checkAlertEscalation();
    
    console.log('✅ Alert monitoring completed');
    
  } catch (error) {
    console.error('Error in alert monitoring:', error);
  }
}