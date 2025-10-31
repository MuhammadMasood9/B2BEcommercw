import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Server, 
  Database, 
  Cpu, 
  Network, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface SystemHealthMetrics {
  overall: {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    uptime: string;
    lastUpdated: string;
  };
  server: {
    status: 'online' | 'degraded' | 'offline';
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    loadAverage: number[];
  };
  database: {
    status: 'connected' | 'slow' | 'disconnected';
    connectionPool: number;
    queryTime: number;
    activeConnections: number;
    slowQueries: number;
  };
  api: {
    status: 'operational' | 'degraded' | 'down';
    responseTime: number;
    errorRate: number;
    requestsPerMinute: number;
    successRate: number;
  };
  network: {
    status: 'stable' | 'unstable' | 'down';
    latency: number;
    bandwidth: number;
    packetLoss: number;
  };
  alerts: Array<{
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: string;
    acknowledged: boolean;
  }>;
  trends: Array<{
    timestamp: string;
    cpuUsage: number;
    memoryUsage: number;
    responseTime: number;
    errorRate: number;
  }>;
}

export default function SystemHealthDashboard() {
  const [healthData, setHealthData] = useState<SystemHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(30); // seconds

  useEffect(() => {
    fetchHealthData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchHealthData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/system/comprehensive-health');
      const data = await response.json();
      
      if (data.success) {
        setHealthData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch system health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
      case 'connected':
      case 'operational':
      case 'stable':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'degraded':
      case 'slow':
      case 'unstable':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
      case 'offline':
      case 'disconnected':
      case 'down':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
      case 'connected':
      case 'operational':
      case 'stable':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
      case 'degraded':
      case 'slow':
      case 'unstable':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critical':
      case 'offline':
      case 'disconnected':
      case 'down':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/admin/monitoring/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });
      fetchHealthData(); // Refresh data
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading system health data...</span>
      </div>
    );
  }

  if (!healthData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load system health data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Health Dashboard</h1>
          <p className="text-gray-600">Real-time monitoring of platform infrastructure</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Auto-refresh:</span>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'On' : 'Off'}
            </Button>
          </div>
          <Button onClick={fetchHealthData} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Overall System Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthData.overall.status)}`}>
                {getStatusIcon(healthData.overall.status)}
                <span className="ml-2 capitalize">{healthData.overall.status}</span>
              </div>
              <p className="text-2xl font-bold mt-2">{healthData.overall.score}%</p>
              <p className="text-sm text-gray-600">Health Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{healthData.overall.uptime}</p>
              <p className="text-sm text-gray-600">Uptime</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">{healthData.alerts.filter(a => !a.acknowledged).length}</p>
              <p className="text-sm text-gray-600">Active Alerts</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-sm font-medium">{new Date(healthData.overall.lastUpdated).toLocaleTimeString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Server Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Server className="h-5 w-5" />
              <span>Server</span>
              <Badge className={getStatusColor(healthData.server.status)}>
                {healthData.server.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>CPU Usage</span>
                <span>{healthData.server.cpuUsage}%</span>
              </div>
              <Progress value={healthData.server.cpuUsage} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Memory Usage</span>
                <span>{healthData.server.memoryUsage}%</span>
              </div>
              <Progress value={healthData.server.memoryUsage} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Disk Usage</span>
                <span>{healthData.server.diskUsage}%</span>
              </div>
              <Progress value={healthData.server.diskUsage} className="h-2" />
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Load Average:</span>
              <span className="ml-2 font-mono">{healthData.server.loadAverage.join(', ')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Database className="h-5 w-5" />
              <span>Database</span>
              <Badge className={getStatusColor(healthData.database.status)}>
                {healthData.database.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Query Time</span>
              <span className="text-sm font-medium">{healthData.database.queryTime}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Connections</span>
              <span className="text-sm font-medium">{healthData.database.activeConnections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pool Usage</span>
              <span className="text-sm font-medium">{healthData.database.connectionPool}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Slow Queries</span>
              <span className="text-sm font-medium">{healthData.database.slowQueries}</span>
            </div>
          </CardContent>
        </Card>

        {/* API Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Cpu className="h-5 w-5" />
              <span>API</span>
              <Badge className={getStatusColor(healthData.api.status)}>
                {healthData.api.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Response Time</span>
              <span className="text-sm font-medium">{healthData.api.responseTime}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Success Rate</span>
              <span className="text-sm font-medium">{healthData.api.successRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Error Rate</span>
              <span className="text-sm font-medium">{healthData.api.errorRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Requests/min</span>
              <span className="text-sm font-medium">{healthData.api.requestsPerMinute}</span>
            </div>
          </CardContent>
        </Card>

        {/* Network Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Network className="h-5 w-5" />
              <span>Network</span>
              <Badge className={getStatusColor(healthData.network.status)}>
                {healthData.network.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Latency</span>
              <span className="text-sm font-medium">{healthData.network.latency}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Bandwidth</span>
              <span className="text-sm font-medium">{healthData.network.bandwidth} Mbps</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Packet Loss</span>
              <span className="text-sm font-medium">{healthData.network.packetLoss}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={healthData.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="cpuUsage" 
                  stroke="#8884d8" 
                  name="CPU Usage (%)"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="memoryUsage" 
                  stroke="#82ca9d" 
                  name="Memory Usage (%)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={healthData.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                />
                <Area 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke="#ffc658" 
                  fill="#ffc658" 
                  name="Response Time (ms)"
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="errorRate" 
                  stroke="#ff7300" 
                  fill="#ff7300" 
                  name="Error Rate (%)"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {healthData.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Active Alerts</span>
              <Badge variant="destructive">
                {healthData.alerts.filter(a => !a.acknowledged).length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthData.alerts.map((alert) => (
                <Alert key={alert.id} className={`${
                  alert.type === 'critical' ? 'border-red-200 bg-red-50' :
                  alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(alert.type)}
                        <h4 className="font-semibold">{alert.title}</h4>
                        <Badge variant={alert.type === 'critical' ? 'destructive' : 
                                     alert.type === 'warning' ? 'secondary' : 'default'}>
                          {alert.type}
                        </Badge>
                      </div>
                      <AlertDescription className="mt-1">
                        {alert.message}
                      </AlertDescription>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {!alert.acknowledged && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}