import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Breadcrumb from "@/components/Breadcrumb";
import KPICards from "@/components/admin/KPICards";
import MetricsCharts from "@/components/admin/MetricsCharts";
import AlertsPanel from "@/components/admin/AlertsPanel";
import QuickActions from "@/components/admin/QuickActions";
import NotificationSystem from "@/components/admin/NotificationSystem";
import DashboardCustomization from "@/components/admin/DashboardCustomization";
import { ContextualHelp } from "@/components/admin/ContextualHelp";
import { InAppHelpSystem } from "@/components/admin/InAppHelpSystem";
import { OnboardingTrigger } from "@/components/admin/InteractiveOnboarding";
import { useDashboardState } from "@/hooks/useDashboardState";
import {
  Settings,
  RefreshCw,
  Download,
  Plus,
  Activity,
  Shield,
  BarChart3,
  Bell,
  Wifi,
  WifiOff,
  Package,
  Users,
  Award,
  Globe
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showCustomization, setShowCustomization] = useState(false);

  const {
    metrics,
    isLoading,
    error,
    settings,
    updateSettings,
    notifications,
    addNotification,
    removeNotification,
    refreshData,
    isRealTimeConnected,
    isHealthy,
    hasCriticalAlerts,
    lastUpdated
  } = useDashboardState();

  const handleDrillDown = (url: string) => {
    window.location.href = url;
  };

  const handleTimeRangeChange = (range: string) => {
    updateSettings({ timeRange: range });
  };

  const handleExportChart = (chartType: string) => {
    addNotification({
      type: 'info',
      title: 'Export Started',
      message: `Exporting ${chartType} chart data...`
    });
  };

  const handleAlertAction = (alertId: string, action: 'acknowledge' | 'dismiss') => {
    // Handle alert actions
    addNotification({
      type: 'success',
      title: 'Alert Updated',
      message: `Alert has been ${action}d successfully`
    });
  };

  if (error) {
    return (
      <div className="p-8">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "Admin Dashboard" }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Enhanced Admin Dashboard</h1>
            <div className="flex items-center gap-2">
              {isRealTimeConnected ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Wifi className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
              {hasCriticalAlerts && (
                <Badge variant="destructive">
                  <Bell className="h-3 w-3 mr-1" />
                  Critical Alerts
                </Badge>
              )}
            </div>
          </div>
          <p className="text-muted-foreground mt-1">
            Comprehensive platform management with real-time insights
            {lastUpdated && (
              <span className="ml-2 text-xs">
                • Last updated: {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <ContextualHelp />
          <InAppHelpSystem />
          <Button variant="outline" onClick={() => setShowCustomization(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Customize
          </Button>
          <Button variant="outline" onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => handleExportChart('dashboard')}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* New User Onboarding */}
      <OnboardingTrigger flowId="admin-dashboard-tour" variant="banner" />

      {/* Enhanced KPI Cards */}
      {metrics && (
        <KPICards
          kpis={metrics.kpis}
          comparisons={metrics.comparisons}
          onDrillDown={handleDrillDown}
        />
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Metrics Charts */}
            <div className="lg:col-span-2">
              {metrics && (
                <MetricsCharts
                  trends={metrics.trends}
                  timeRange={settings.timeRange}
                  onTimeRangeChange={handleTimeRangeChange}
                  onRefresh={refreshData}
                  onExport={handleExportChart}
                />
              )}
            </div>

            {/* Alerts Panel */}
            <div>
              {metrics && (
                <AlertsPanel
                  alerts={metrics.alerts.recent.map(alert => ({
                    ...alert,
                    title: alert.type || 'System Alert',
                    type: (alert.type as any) || 'system',
                    severity: (alert.severity as any) || 'info',
                    timestamp: new Date(alert.timestamp)
                  }))}
                  summary={{
                    critical: metrics.alerts.critical,
                    error: 0, // Will be populated from real data
                    warning: metrics.alerts.warnings,
                    info: 0 // Will be populated from real data
                  }}
                  onAcknowledge={(id) => handleAlertAction(id, 'acknowledge')}
                  onDismiss={(id) => handleAlertAction(id, 'dismiss')}
                  onViewDetails={(alert) => {
                    addNotification({
                      type: 'info',
                      title: 'Alert Details',
                      message: `Viewing details for: ${alert.title}`
                    });
                  }}
                />
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <QuickActions
            pendingCounts={{
              suppliers: metrics?.kpis.pendingApprovals || 0,
              products: (metrics?.kpis.totalProducts || 0) - (metrics?.kpis.approvedProducts || 0),
              verifications: 5, // Mock data
              disputes: 2, // Mock data
              payouts: 8 // Mock data
            }}
            onActionClick={(actionId) => {
              addNotification({
                type: 'info',
                title: 'Action Triggered',
                message: `Navigating to ${actionId}...`
              });
            }}
          />
        </TabsContent>



        <TabsContent value="analytics" className="space-y-6">
          {metrics && (
            <MetricsCharts
              trends={metrics.trends}
              timeRange={settings.timeRange}
              onTimeRangeChange={handleTimeRangeChange}
              onRefresh={refreshData}
              onExport={handleExportChart}
            />
          )}
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Overall Status</span>
                      <Badge 
                        variant={metrics.systemHealth.status === 'healthy' ? 'secondary' : 'destructive'}
                      >
                        {metrics.systemHealth.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Online Suppliers</span>
                      <span className="font-semibold">{metrics.realTimeMetrics.onlineSuppliers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Active Orders</span>
                      <span className="font-semibold">{metrics.realTimeMetrics.activeOrders}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>System Load</span>
                      <span className="font-semibold">{metrics.realTimeMetrics.systemLoad}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Error Rate</span>
                      <span className="font-semibold">{metrics.realTimeMetrics.errorRate}%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Platform Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href="/admin/monitoring">
                    <Button className="w-full">
                      <Activity className="h-4 w-4 mr-2" />
                      Open Monitoring Dashboard
                    </Button>
                  </Link>
                  <Link href="/admin/suppliers/pending">
                    <Button variant="outline" className="w-full">
                      Review Pending Suppliers
                    </Button>
                  </Link>
                  <Link href="/admin/verification">
                    <Button variant="outline" className="w-full">
                      Verify Documents
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Dashboard Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={() => setShowCustomization(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Customize Dashboard
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Auto Refresh</h4>
                    <p className="text-sm text-muted-foreground">
                      {settings.autoRefresh ? 'Enabled' : 'Disabled'} 
                      {settings.autoRefresh && ` (${settings.refreshInterval / 1000}s)`}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Time Range</h4>
                    <p className="text-sm text-muted-foreground">{settings.timeRange}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Real-time Connection</h4>
                    <p className="text-sm text-muted-foreground">
                      {isRealTimeConnected ? 'Connected' : 'Disconnected'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">System Health</h4>
                    <p className="text-sm text-muted-foreground">
                      {isHealthy ? 'Healthy' : 'Issues Detected'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notification System */}
      <NotificationSystem
        notifications={notifications}
        onRemove={removeNotification}
        position="top-right"
      />

      {/* Dashboard Customization */}
      <DashboardCustomization
        settings={settings}
        onSettingsChange={updateSettings}
        isOpen={showCustomization}
        onClose={() => setShowCustomization(false)}
      />
    </div>
  );
}