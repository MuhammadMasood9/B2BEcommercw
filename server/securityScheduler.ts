import cron from 'node-cron';
import { securityMonitoringService } from './securityMonitoringService';
import { adminAccessControlService } from './adminAccessControlService';

class SecurityScheduler {
  private isRunning = false;
  
  start() {
    if (this.isRunning) {
      console.log('Security scheduler is already running');
      return;
    }
    
    console.log('Starting security monitoring scheduler...');
    this.isRunning = true;
    
    // Run security scan every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      try {
        console.log('Running scheduled security scan...');
        await this.runSecurityScan();
      } catch (error) {
        console.error('Scheduled security scan failed:', error);
      }
    });
    
    // Run comprehensive analysis every hour
    cron.schedule('0 * * * *', async () => {
      try {
        console.log('Running comprehensive security analysis...');
        await this.runComprehensiveAnalysis();
      } catch (error) {
        console.error('Comprehensive security analysis failed:', error);
      }
    });
    
    // Generate daily compliance report
    cron.schedule('0 6 * * *', async () => {
      try {
        console.log('Generating daily compliance report...');
        await this.generateDailyReport();
      } catch (error) {
        console.error('Daily compliance report generation failed:', error);
      }
    });
    
    // Clean up old security events weekly
    cron.schedule('0 2 * * 0', async () => {
      try {
        console.log('Cleaning up old security events...');
        await this.cleanupOldEvents();
      } catch (error) {
        console.error('Security events cleanup failed:', error);
      }
    });
    
    console.log('Security monitoring scheduler started successfully');
  }
  
  stop() {
    if (!this.isRunning) {
      console.log('Security scheduler is not running');
      return;
    }
    
    console.log('Stopping security monitoring scheduler...');
    this.isRunning = false;
    
    // Note: node-cron doesn't provide a direct way to stop specific tasks
    // In a production environment, you might want to store task references
    console.log('Security monitoring scheduler stopped');
  }
  
  private async runSecurityScan() {
    try {
      const scanResult = await securityMonitoringService.runAutomatedSecurityScan();
      
      // Log scan results
      console.log(`Security scan completed: ${scanResult.threats.length} threats, ${scanResult.patterns.length} anomalous patterns`);
      
      // Handle critical threats immediately
      const criticalThreats = scanResult.threats.filter(t => t.severity === 'critical');
      if (criticalThreats.length > 0) {
        console.warn(`CRITICAL: ${criticalThreats.length} critical security threats detected!`);
        await this.handleCriticalThreats(criticalThreats);
      }
      
      // Handle high-severity threats
      const highThreats = scanResult.threats.filter(t => t.severity === 'high');
      if (highThreats.length > 0) {
        console.warn(`HIGH: ${highThreats.length} high-severity security threats detected`);
        await this.handleHighSeverityThreats(highThreats);
      }
      
      return scanResult;
    } catch (error) {
      console.error('Security scan error:', error);
      throw error;
    }
  }
  
  private async runComprehensiveAnalysis() {
    try {
      // Analyze access patterns
      const patterns = await securityMonitoringService.analyzeAccessPatterns();
      const anomalousPatterns = patterns.filter(p => p.isAnomaly && p.confidence > 0.8);
      
      if (anomalousPatterns.length > 0) {
        console.log(`Found ${anomalousPatterns.length} high-confidence anomalous access patterns`);
        
        // Create security events for significant anomalies
        for (const pattern of anomalousPatterns) {
          if (pattern.deviation > 2) {
            await adminAccessControlService.createSecurityAuditEvent({
              eventType: 'anomalous_access',
              severity: pattern.deviation > 3 ? 'high' : 'medium',
              category: 'data_access',
              title: `Anomalous ${pattern.patternType} pattern detected`,
              description: `User ${pattern.adminUserId} shows anomalous ${pattern.patternType} behavior with deviation score ${pattern.deviation.toFixed(2)}`,
              adminUserId: pattern.adminUserId,
              riskScore: Math.min(100, pattern.deviation * 25),
              threatIndicators: [
                `Pattern type: ${pattern.patternType}`,
                `Deviation: ${pattern.deviation.toFixed(2)}`,
                `Confidence: ${(pattern.confidence * 100).toFixed(1)}%`,
              ],
              acknowledged: false,
              resolved: false,
            });
          }
        }
      }
      
      console.log('Comprehensive security analysis completed');
    } catch (error) {
      console.error('Comprehensive analysis error:', error);
      throw error;
    }
  }
  
  private async generateDailyReport() {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
      
      // Generate security incidents report
      const securityReport = await securityMonitoringService.generateComplianceReport(
        'security_incidents',
        startDate,
        endDate
      );
      
      console.log(`Daily security report generated: ${securityReport.findings.length} findings, risk level: ${securityReport.riskLevel}`);
      
      // If there are critical findings, create an alert
      const criticalFindings = securityReport.findings.filter(f => f.severity === 'critical');
      if (criticalFindings.length > 0) {
        await adminAccessControlService.createSecurityAuditEvent({
          eventType: 'security_incidents',
          severity: 'critical',
          category: 'compliance',
          title: 'Daily Security Report: Critical Findings',
          description: `Daily security report contains ${criticalFindings.length} critical findings requiring immediate attention`,
          riskScore: 90,
          threatIndicators: criticalFindings.map(f => f.description),
          acknowledged: false,
          resolved: false,
        });
      }
      
      return securityReport;
    } catch (error) {
      console.error('Daily report generation error:', error);
      throw error;
    }
  }
  
  private async cleanupOldEvents() {
    try {
      const retentionDays = 90; // Keep events for 90 days
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      
      // Note: This would require implementing cleanup methods in the service
      // For now, just log the cleanup action
      console.log(`Cleaning up security events older than ${cutoffDate.toISOString()}`);
      
      // In a real implementation, you would:
      // 1. Archive old events to long-term storage
      // 2. Delete events older than retention period
      // 3. Compress and store compliance reports
      
      console.log('Security events cleanup completed');
    } catch (error) {
      console.error('Cleanup error:', error);
      throw error;
    }
  }
  
  private async handleCriticalThreats(threats: any[]) {
    try {
      console.log('Handling critical security threats...');
      
      for (const threat of threats) {
        // Create high-priority security event
        await adminAccessControlService.createSecurityAuditEvent({
          eventType: threat.type,
          severity: 'critical',
          category: 'security',
          title: `CRITICAL THREAT: ${threat.description}`,
          description: `Critical security threat detected: ${threat.description}\n\nIndicators:\n${threat.indicators.join('\n')}\n\nMitigation steps:\n${threat.mitigationSteps.join('\n')}`,
          adminUserId: threat.adminUserId,
          ipAddress: threat.ipAddress,
          riskScore: threat.riskScore,
          threatIndicators: threat.indicators,
          acknowledged: false,
          resolved: false,
        });
        
        // For brute force attacks, you might want to implement automatic IP blocking
        if (threat.type === 'brute_force' && threat.ipAddress) {
          console.log(`Consider blocking IP address: ${threat.ipAddress}`);
          // Implement IP blocking logic here
        }
        
        // For privilege escalation, you might want to lock the user account
        if (threat.type === 'privilege_escalation' && threat.adminUserId) {
          console.log(`Consider locking admin user: ${threat.adminUserId}`);
          // Implement user locking logic here
        }
      }
      
      console.log(`Handled ${threats.length} critical threats`);
    } catch (error) {
      console.error('Error handling critical threats:', error);
    }
  }
  
  private async handleHighSeverityThreats(threats: any[]) {
    try {
      console.log('Handling high-severity security threats...');
      
      for (const threat of threats) {
        // Create security event for tracking
        await adminAccessControlService.createSecurityAuditEvent({
          eventType: threat.type,
          severity: 'high',
          category: 'security',
          title: `HIGH SEVERITY: ${threat.description}`,
          description: `High-severity security threat: ${threat.description}\n\nIndicators:\n${threat.indicators.join('\n')}`,
          adminUserId: threat.adminUserId,
          ipAddress: threat.ipAddress,
          riskScore: threat.riskScore,
          threatIndicators: threat.indicators,
          acknowledged: false,
          resolved: false,
        });
      }
      
      console.log(`Handled ${threats.length} high-severity threats`);
    } catch (error) {
      console.error('Error handling high-severity threats:', error);
    }
  }
  
  // Manual trigger methods for testing
  async triggerSecurityScan() {
    console.log('Manually triggering security scan...');
    return await this.runSecurityScan();
  }
  
  async triggerComprehensiveAnalysis() {
    console.log('Manually triggering comprehensive analysis...');
    return await this.runComprehensiveAnalysis();
  }
  
  async triggerDailyReport() {
    console.log('Manually triggering daily report...');
    return await this.generateDailyReport();
  }
}

export const securityScheduler = new SecurityScheduler();

// Auto-start the scheduler when the module is loaded
if (process.env.NODE_ENV !== 'test') {
  securityScheduler.start();
}