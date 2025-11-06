import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Zap,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  Settings,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  Gauge
} from "lucide-react";
import { format } from "date-fns";

// Types
interface SecurityHealth {
  status: 'healthy' | 'warning' | 'critical';
  score: number;
  threats: {
    critical: number;
    high: number;
    total: number;
  };
  patterns: {
    anomalous: number;
    total: number;
  };
  recommendations: string[];
  lastScanTime: string;
}

interface SecurityThreat {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  adminUserId?: string;
  ipAddress?: string;
  indicators: string[];
  riskScore: number;
  detectedAt: string;
  mitigationSteps: string[];
}

interface SecurityMetrics {
  timeWindow: string;
  period: {
    startTime: string;
    endTime: string;
  };
  threats: {
    total: number;
    bySeverity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    byType: {
      brute_force: number;
      suspicious_login: number;
      privilege_escalation: number;
      anomalous_access: number;
    };
  };
  patterns: {
    total: number;
    anomalous: number;
    highConfidence: number;
  };
  recommendations: string[];
  securityScore: number;
}

export default function SecurityDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  // Fetch enhanced security dashboard
  const { data: dashboardData, isLoading: dashboardLoading, refetch: refetchDashboard } = useQuery({
    queryKey: ['/api/admin/security/monitoring/dashboard'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/security/monitoring/dashboard');
      return response.dashboard;
    },
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds if auto-refresh is on
  });

  // Fetch security health (legacy endpoint)
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery<SecurityHealth>({
    queryKey: ['/api/admin/security/health'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/security/health');
      return response.health;
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Fetch security metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery<SecurityMetrics>({
    queryKey: ['/api/admin/security/metrics'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/security/metrics');
      return response.metrics;
    },
    refetchInterval: autoRefresh ? 60000 : false, // Refresh every minute
  });

  // Fetch enhanced security alerts
  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/admin/security/monitoring/alerts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/security/monitoring/alerts');
      return response;
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Fetch security threats (legacy endpoint)
  const { data: threatsData, isLoading: threatsLoading } = useQuery({
    queryKey: ['/api/admin/security/threats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/security/threats');
      return response;
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Run security scan mutation
  const scanMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/admin/security/scan');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/security/monitoring/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/security/monitoring/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/security/health'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/security/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/security/threats'] });
      toast({ title: "Success", description: "Security scan completed successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to run security scan", 
        variant: "destructive" 
      });
    },
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async ({ alertId, notes }: { alertId: string; notes?: string }) => {
      return await apiRequest('POST', `/api/admin/security/monitoring/alerts/${alertId}/acknowledge`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/security/monitoring/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/security/monitoring/dashboard'] });
      toast({ title: "Success", description: "Alert acknowledged successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to acknowledge alert", 
        variant: "destructive" 
      });
    },
  });

  // Resolve alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: async ({ alertId, resolutionNotes }: { alertId: string; resolutionNotes: string }) => {
      return await apiRequest('POST', `/api/admin/security/monitoring/alerts/${alertId}/resolve`, { resolutionNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/security/monitoring/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/security/monitoring/dashboard'] });
      toast({ title: "Success", description: "Alert resolved successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to resolve alert", 
        variant: "destructive" 
      });
    },
  });

  const threats = threatsData?.threats || [];
  const alerts = alertsData?.alerts || [];
  const dashboard = dashboardData;
  const health = healthData;
  const metrics = metricsData;

  // Helper functions
  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'critical': return <XCircle className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getThreatTypeIcon = (type: string) => {
    switch (type) {
      case 'brute_force': return <Lock className="w-4 h-4" />;
      case 'suspicious_login': return <Eye className="w-4 h-4" />;
      case 'privilege_escalation': return <TrendingUp className="w-4 h-4" />;
      case 'anomalous_access': return <Activity className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Security Dashboard</h2>
          <p className="text-gray-600 mt-1">Real-time security monitoring and threat detection</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh: {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              refetchDashboard();
              refetchHealth();
              queryClient.invalidateQueries({ queryKey: ['/api/admin/security/monitoring/alerts'] });
              queryClient.invalidateQueries({ queryKey: ['/api/admin/security/metrics'] });
              queryClient.invalidateQueries({ queryKey: ['/api/admin/security/threats'] });
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => scanMutation.mutate()} disabled={scanMutation.isPending}>
            <Zap className="w-4 h-4 mr-2" />
            {scanMutation.isPending ? 'Scanning...' : 'Run Scan'}
          </Button>
        </div>
      </div>

      {/* Enhanced Security Health Overview */}
      {dashboard && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${getHealthStatusColor(dashboard.systemHealth.riskLevel)}`}>
                  {getHealthStatusIcon(dashboard.systemHealth.riskLevel)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Enhanced Security Health</h3>
                  <p className="text-sm text-gray-600">
                    Last scan: {format(new Date(dashboard.systemHealth.lastScanTime), 'MMM dd, HH:mm')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{dashboard.systemHealth.securityScore}/100</div>
                <Badge className={getHealthStatusColor(dashboard.systemHealth.riskLevel)}>
                  {dashboard.systemHealth.riskLevel.toUpperCase()}
                </Badge>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Security Score</span>
                <span>{dashboard.systemHealth.securityScore}%</span>
              </div>
              <Progress value={dashboard.systemHealth.securityScore} className="h-2" />
            </div>

            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-600">{dashboard.realTimeThreats.critical}</div>
                <div className="text-sm text-gray-600">Critical</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{dashboard.realTimeThreats.high}</div>
                <div className="text-sm text-gray-600">High</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{dashboard.realTimeThreats.medium}</div>
                <div className="text-sm text-gray-600">Medium</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{dashboard.realTimeThreats.low}</div>
                <div className="text-sm text-gray-600">Low</div>
              </div>
            </div>

            {dashboard.suspiciousIPs.length > 0 && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Alert:</strong> {dashboard.suspiciousIPs.length} suspicious IP addresses detected with multiple security alerts.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fallback to legacy health display */}
      {!dashboard && health && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${getHealthStatusColor(health.status)}`}>
                  {getHealthStatusIcon(health.status)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Security Health</h3>
                  <p className="text-sm text-gray-600">
                    Last scan: {format(new Date(health.lastScanTime), 'MMM dd, HH:mm')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{health.score}/100</div>
                <Badge className={getHealthStatusColor(health.status)}>
                  {health.status.toUpperCase()}
                </Badge>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Security Score</span>
                <span>{health.score}%</span>
              </div>
              <Progress value={health.score} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-600">{health.threats.critical}</div>
                <div className="text-sm text-gray-600">Critical Threats</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{health.threats.high}</div>
                <div className="text-sm text-gray-600">High Threats</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{health.patterns.anomalous}</div>
                <div className="text-sm text-gray-600">Anomalous Patterns</div>
              </div>
            </div>

            {health.recommendations.length > 0 && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Top Recommendation:</strong> {health.recommendations[0]}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="threats">Threats</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced Dashboard Metrics */}
          {dashboard && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Threats</p>
                      <p className="text-2xl font-bold">{dashboard.realTimeThreats.total}</p>
                      <p className="text-xs text-gray-500">
                        {dashboard.alertTrends.percentageChange >= 0 ? '+' : ''}{dashboard.alertTrends.percentageChange}% from yesterday
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Security Score</p>
                      <p className="text-2xl font-bold">{dashboard.systemHealth.securityScore}</p>
                      <p className="text-xs text-gray-500">Risk Level: {dashboard.systemHealth.riskLevel}</p>
                    </div>
                    <Gauge className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Suspicious IPs</p>
                      <p className="text-2xl font-bold">{dashboard.suspiciousIPs.length}</p>
                      <p className="text-xs text-gray-500">Active monitoring</p>
                    </div>
                    <Activity className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">24h Alerts</p>
                      <p className="text-2xl font-bold">{dashboard.alertTrends.last24Hours}</p>
                      <p className="text-xs text-gray-500">Last 24 hours</p>
                    </div>
                    <Target className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Fallback to legacy metrics */}
          {!dashboard && metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Threats</p>
                      <p className="text-2xl font-bold">{metrics.threats.total}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Security Score</p>
                      <p className="text-2xl font-bold">{metrics.securityScore}</p>
                    </div>
                    <Gauge className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Anomalous Patterns</p>
                      <p className="text-2xl font-bold">{metrics.patterns.anomalous}</p>
                    </div>
                    <Activity className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">High Confidence</p>
                      <p className="text-2xl font-bold">{metrics.patterns.highConfidence}</p>
                    </div>
                    <Target className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Threat Distribution */}
          {metrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Threats by Severity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Critical</span>
                      </div>
                      <span className="font-medium">{metrics.threats.bySeverity.critical}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span>High</span>
                      </div>
                      <span className="font-medium">{metrics.threats.bySeverity.high}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span>Medium</span>
                      </div>
                      <span className="font-medium">{metrics.threats.bySeverity.medium}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Low</span>
                      </div>
                      <span className="font-medium">{metrics.threats.bySeverity.low}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Threats by Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        <span>Brute Force</span>
                      </div>
                      <span className="font-medium">{metrics.threats.byType.brute_force}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>Suspicious Login</span>
                      </div>
                      <span className="font-medium">{metrics.threats.byType.suspicious_login}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>Privilege Escalation</span>
                      </div>
                      <span className="font-medium">{metrics.threats.byType.privilege_escalation}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        <span>Anomalous Access</span>
                      </div>
                      <span className="font-medium">{metrics.threats.byType.anomalous_access}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Threats Tab */}
        <TabsContent value="threats">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Security Alerts & Threats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alert</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Enhanced Security Alerts */}
                  {alerts.map((alert: any) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getThreatTypeIcon(alert.type)}
                          <div>
                            <p className="font-medium">{alert.description}</p>
                            <p className="text-sm text-gray-500">
                              {alert.type.replace('_', ' ')}
                              {alert.ipAddress && ` • ${alert.ipAddress}`}
                              {alert.userEmail && ` • ${alert.userEmail}`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={alert.status === 'active' ? 'destructive' : 'secondary'}>
                          {alert.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {format(new Date(alert.createdAt), 'MMM dd, HH:mm')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {alert.status === 'active' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => acknowledgeAlertMutation.mutate({ alertId: alert.id })}
                                disabled={acknowledgeAlertMutation.isPending}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Acknowledge
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => resolveAlertMutation.mutate({ 
                                  alertId: alert.id, 
                                  resolutionNotes: 'Resolved via dashboard' 
                                })}
                                disabled={resolveAlertMutation.isPending}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Resolve
                              </Button>
                            </>
                          )}
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Legacy Security Threats */}
                  {threats.map((threat: SecurityThreat) => (
                    <TableRow key={threat.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getThreatTypeIcon(threat.type)}
                          <div>
                            <p className="font-medium">{threat.description}</p>
                            <p className="text-sm text-gray-500">
                              {threat.type.replace('_', ' ')}
                              {threat.ipAddress && ` • ${threat.ipAddress}`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(threat.severity)}>
                          {threat.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                threat.riskScore >= 80 ? 'bg-red-500' :
                                threat.riskScore >= 60 ? 'bg-orange-500' :
                                threat.riskScore >= 40 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${threat.riskScore}%` }}
                            />
                          </div>
                          <span className="text-sm">{threat.riskScore}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {format(new Date(threat.detectedAt), 'MMM dd, HH:mm')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Investigate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Empty state */}
                  {alerts.length === 0 && threats.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Shield className="w-12 h-12 text-gray-400" />
                          <p className="text-gray-500">No security alerts or threats detected</p>
                          <p className="text-sm text-gray-400">Your system appears to be secure</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <LineChart className="w-16 h-16 mb-4" />
                  <p>Security trends chart would be displayed here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Threat Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <BarChart3 className="w-16 h-16 mb-4" />
                  <p>Threat analysis chart would be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Compliance reporting features coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}