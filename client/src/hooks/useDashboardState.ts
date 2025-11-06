import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';
import { apiRequest } from '@/lib/queryClient';

interface DashboardMetrics {
  kpis: {
    totalRevenue: number;
    totalCommission: number;
    activeSuppliers: number;
    totalSuppliers: number;
    pendingApprovals: number;
    totalProducts: number;
    approvedProducts: number;
    totalOrders: number;
    averageSupplierRating: number;
    averageResponseRate: number;
    // Additional KPIs for enhanced admin dashboard
    pendingVerifications: number;
    activeDisputes: number;
    pendingPayouts: number;
    totalBuyers: number;
    activeBuyers: number;
    monthlyGrowthRate: number;
    systemUptime: number;
  };
  realTimeMetrics: {
    onlineSuppliers: number;
    activeOrders: number;
    systemLoad: number;
    errorRate: number;
    responseTime: number;
  };
  trends: Array<{
    date: string;
    revenue: number;
    orders: number;
    suppliers: number;
    products: number;
  }>;
  comparisons?: {
    revenue: { changePercent: number };
    orders: { changePercent: number };
    suppliers: { changePercent: number };
    products: { changePercent: number };
  };
  alerts: {
    critical: number;
    warnings: number;
    total: number;
    recent: Array<{
      id: string;
      type: string;
      severity: string;
      message: string;
      timestamp: Date;
    }>;
  };
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    lastUpdated: Date;
  };
}

interface DashboardSettings {
  refreshInterval: number;
  autoRefresh: boolean;
  timeRange: string;
  selectedMetrics: string[];
  alertFilters: string[];
}

const DEFAULT_SETTINGS: DashboardSettings = {
  refreshInterval: 30000, // 30 seconds
  autoRefresh: true,
  timeRange: '30d',
  selectedMetrics: ['revenue', 'suppliers', 'products', 'orders'],
  alertFilters: ['critical', 'error', 'warning']
};

export function useDashboardState() {
  const [settings, setSettings] = useState<DashboardSettings>(() => {
    const saved = localStorage.getItem('admin-dashboard-settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });
  
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: Date;
  }>>([]);

  const queryClient = useQueryClient();

  // Fetch comprehensive dashboard metrics
  const { 
    data: metrics, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['admin-dashboard-metrics', settings.timeRange],
    queryFn: async (): Promise<DashboardMetrics> => {
      const data = await apiRequest('GET', `/api/admin/dashboard/comprehensive-metrics?timeRange=${settings.timeRange}&includeComparisons=true`);
      return data.metrics;
    },
    refetchInterval: settings.autoRefresh ? settings.refreshInterval : false,
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'metrics_update':
        // Update specific metrics without full refetch
        queryClient.setQueryData(['admin-dashboard-metrics', settings.timeRange], (oldData: DashboardMetrics | undefined) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            realTimeMetrics: {
              ...oldData.realTimeMetrics,
              ...message.data
            },
            systemHealth: {
              ...oldData.systemHealth,
              lastUpdated: new Date()
            }
          };
        });
        break;
        
      case 'new_alert':
        // Add new alert to the list
        queryClient.setQueryData(['admin-dashboard-metrics', settings.timeRange], (oldData: DashboardMetrics | undefined) => {
          if (!oldData) return oldData;
          
          const newAlert = {
            id: message.data.id,
            type: message.data.type,
            severity: message.data.severity,
            message: message.data.message,
            timestamp: new Date(message.data.timestamp)
          };
          
          return {
            ...oldData,
            alerts: {
              ...oldData.alerts,
              total: oldData.alerts.total + 1,
              [message.data.severity]: (oldData.alerts as any)[message.data.severity] + 1,
              recent: [newAlert, ...oldData.alerts.recent.slice(0, 4)]
            }
          };
        });
        
        // Show notification for critical alerts
        if (message.data.severity === 'critical') {
          setNotifications(prev => [{
            id: `notification_${Date.now()}_${Math.random()}`,
            type: 'error',
            title: 'Critical Alert',
            message: message.data.message,
            timestamp: new Date()
          }, ...prev.slice(0, 9)]);
        }
        break;
        
      case 'system_status_change':
        queryClient.setQueryData(['admin-dashboard-metrics', settings.timeRange], (oldData: DashboardMetrics | undefined) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            systemHealth: {
              ...oldData.systemHealth,
              status: message.data.status,
              lastUpdated: new Date()
            }
          };
        });
        
        if (message.data.status === 'critical') {
          setNotifications(prev => [{
            id: `notification_${Date.now()}_${Math.random()}`,
            type: 'error',
            title: 'System Status Critical',
            message: 'System health has degraded to critical level',
            timestamp: new Date()
          }, ...prev.slice(0, 9)]);
        }
        break;
    }
  }, [queryClient]);

  // Create stable callback refs
  const handleWebSocketMessageRef = useCallback((message: any) => {
    handleWebSocketMessage(message);
  }, [handleWebSocketMessage]);

  const onConnectRef = useCallback(() => {
    setNotifications(prev => [{
      id: `notification_${Date.now()}_${Math.random()}`,
      type: 'success',
      title: 'Real-time Updates Connected',
      message: 'Dashboard will now receive live updates',
      timestamp: new Date()
    }, ...prev.slice(0, 9)]);
  }, []);

  const onDisconnectRef = useCallback(() => {
    setNotifications(prev => [{
      id: `notification_${Date.now()}_${Math.random()}`,
      type: 'warning',
      title: 'Real-time Updates Disconnected',
      message: 'Dashboard updates may be delayed',
      timestamp: new Date()
    }, ...prev.slice(0, 9)]);
  }, []);

  const onErrorRef = useCallback(() => {
    setNotifications(prev => [{
      id: `notification_${Date.now()}_${Math.random()}`,
      type: 'error',
      title: 'Connection Error',
      message: 'Failed to establish real-time connection',
      timestamp: new Date()
    }, ...prev.slice(0, 9)]);
  }, []);

  // WebSocket connection for real-time updates (disabled for now to prevent connection issues)
  // TODO: Implement proper admin WebSocket connection with authentication
  const wsConnected = false;

  const addNotification = useCallback((notification: Omit<typeof notifications[0], 'id' | 'timestamp'>) => {
    const newNotification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random()}`,
      timestamp: new Date()
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep last 10 notifications
    
    // Auto-remove non-critical notifications after 5 seconds
    if (notification.type !== 'error') {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 5000);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<DashboardSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('admin-dashboard-settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const refreshData = useCallback(() => {
    refetch();
    addNotification({
      type: 'info',
      title: 'Dashboard Refreshed',
      message: 'Data has been updated'
    });
  }, [refetch]);

  // Auto-refresh effect
  useEffect(() => {
    if (!settings.autoRefresh) return;
    
    const interval = setInterval(() => {
      refetch();
    }, settings.refreshInterval);
    
    return () => clearInterval(interval);
  }, [settings.autoRefresh, settings.refreshInterval]);

  return {
    // Data
    metrics,
    isLoading,
    error,
    
    // Settings
    settings,
    updateSettings,
    
    // Notifications
    notifications,
    addNotification,
    removeNotification,
    
    // Actions
    refreshData,
    
    // Connection status
    isRealTimeConnected: wsConnected,
    
    // Computed values
    isHealthy: metrics?.systemHealth.status === 'healthy',
    hasCriticalAlerts: (metrics?.alerts.critical || 0) > 0,
    lastUpdated: metrics?.systemHealth.lastUpdated
  };
}