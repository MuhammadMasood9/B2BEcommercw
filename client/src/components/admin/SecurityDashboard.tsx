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

  // Fetch security health
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery<SecurityHealth>({
    queryKey: ['/api/admin/security/health'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/security/health');
      return response.health;
    },
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds if auto-refresh is on
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

  // Fetch security threats
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

  const threats = threatsData?.threats || [];
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
              refetchHealth();
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

      {/* Security Health Overview */}
      {health && (
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
          {metrics && (
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
                Security Threats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Threat</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
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