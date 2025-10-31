import { runAlertMonitoring } from './automatedAlertingService';

// Alert monitoring scheduler
class AlertScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  start(intervalMinutes: number = 5) {
    if (this.isRunning) {
      console.log('Alert scheduler is already running');
      return;
    }

    console.log(`🔄 Starting alert scheduler (every ${intervalMinutes} minutes)`);
    
    // Run immediately on start
    this.runMonitoring();
    
    // Schedule periodic runs
    this.intervalId = setInterval(() => {
      this.runMonitoring();
    }, intervalMinutes * 60 * 1000);
    
    this.isRunning = true;
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Alert scheduler stopped');
  }

  private async runMonitoring() {
    try {
      await runAlertMonitoring();
    } catch (error) {
      console.error('Error in scheduled alert monitoring:', error);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId !== null,
    };
  }
}

export const alertScheduler = new AlertScheduler();

// Auto-start the scheduler in production
if (process.env.NODE_ENV === 'production') {
  alertScheduler.start(5); // Run every 5 minutes in production
} else {
  // In development, start with longer interval to avoid spam
  alertScheduler.start(10); // Run every 10 minutes in development
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down alert scheduler...');
  alertScheduler.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down alert scheduler...');
  alertScheduler.stop();
  process.exit(0);
});