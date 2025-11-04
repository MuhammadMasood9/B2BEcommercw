import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Users, 
  Server, 
  Download,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByStatusCode: Record<number, number>;
  errorsByEndpoint: Record<string, number>;
  errorsByUser: Record<string, number>;
  averageResponseTime: number;
  errorRate: number;
  lastUpdated: string;
}

interface ErrorLogEntry {
  id: string;
  timestamp: string;
  requestId: string;
  error: {
    name: string;
    message: string;
    type: string;
    statusCode: number;
    isOperational: boolean;
    details?: any;
  };
  request: {
    method: string;
    url: string;
    path: string;
    userId?: string;
    ip: string;
  };
  response: {
    statusCode: number;
    responseTime: number;
  };
}

interface ErrorPattern {
  pattern: string;
  count: number;
  lastOccurrence: string;
  errorType: string;
}

interface ErrorTrend {
  timestamp: string;
  errorCount: number;
  errorRate: number;
}

const ERROR_TYPE_COLORS = {
  VALIDATION: '#f59e0b',
  AUTHENTICATION: '#ef4444',
  AUTHORIZATION: '#dc2626',
  NOT_FOUND: '#6b7280',
  BUSINESS_LOGIC: '#8b5cf6',
  DATABASE: '#ec4899',
  EXTERNAL_SERVICE: '#06b6d4',
  SYSTEM: '#f97316',
  RATE_LIMIT: '#84cc16',
  FILE_UPLOAD: '#10b981'
};

export function ErrorMonitoringDashboard() {
  const [metrics, setMetrics] = useState<ErrorMetrics | null>(null);
  const [logs, setLogs] = useState<ErrorLogEntry[]>([]);
  const [patterns, setPatterns] = useState<ErrorPattern[]>([]);
  const [trends, setTrends] = useState<ErrorTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  const [filters, setFilters] = useState({
    errorType: '',
    statusCode: '',
    endpoint: '',
    userId: '',
    startDate: '',
    endDate: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  const { handleError } = useErrorHandler();

  useEffect(() => {
    loadData();
  }, [timeframe]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [metricsRes, logsRes, patternsRes, trendsRes] = await Promise.all([
        fetch('/api/errors/metrics'),
        fetch('/api/errors/logs?' + new URLSearchParams({
          limit: '50',
          ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
        })),
        fetch('/api/errors/patterns?limit=10'),
        fetch(`/api/errors/trends?timeframe=${timeframe}`)
      ]);

      if (!metricsRes.ok || !logsRes.ok || !patternsRes.ok || !trendsRes.ok) {
        throw new Error('Failed to fetch error data');
      }

      const [metricsData, logsData, patternsData, trendsData] = await Promise.all([
        metricsRes.json(),
        logsRes.json(),
        patternsRes.json(),
        trendsRes.json()
      ]);

      setMetrics(metricsData.data);
      setLogs(logsData.data.logs);
      setPatterns(patternsData.data.patterns);
      setTrends(trendsData.data.trends);
    } catch (error) {
      handleError(error, 'error_monitoring_load');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const exportData = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams({
        format,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });
      
      const response = await fetch(`/api/errors/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `error-logs-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      handleError(error, 'error_export');
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      log.error.message.toLowerCase().includes(searchLower) ||
      log.request.path.toLowerCase().includes(searchLower) ||
      log.error.type.toLowerCase().includes(searchLower) ||
      log.requestId.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadgeColor = (statusCode: number) => {
    if (statusCode >= 500) return 'destructive';
    if (statusCode >= 400) return 'secondary';
    return 'default';
  };

  const getErrorTypeBadgeColor = (errorType: string) => {
    switch (errorType) {
      case 'AUTHENTICATION':
      case 'AUTHORIZATION':
        return 'destructive';
      case 'VALIDATION':
        return 'secondary';
      case 'SYSTEM':
      case 'DATABASE':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Error Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor and analyze system errors and performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportData('csv')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportData('json')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalErrors.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date(metrics.lastUpdated).toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.errorRate.toFixed(2)}/sec</div>
              <p className="text-xs text-muted-foreground">
                Errors per second (last hour)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(metrics.averageResponseTime)}ms</div>
              <p className="text-xs text-muted-foreground">
                For error responses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Affected Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(metrics.errorsByUser).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Users with errors (last hour)
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Error Logs</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Error Types Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Errors by Type</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics && (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(metrics.errorsByType)
                          .filter(([_, count]) => count > 0)
                          .map(([type, count]) => ({ name: type, value: count }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.entries(metrics.errorsByType)
                          .filter(([_, count]) => count > 0)
                          .map(([type], index) => (
                            <Cell key={`cell-${index}`} fill={ERROR_TYPE_COLORS[type as keyof typeof ERROR_TYPE_COLORS]} />
                          ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Status Code Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Errors by Status Code</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Object.entries(metrics.errorsByStatusCode)
                        .map(([code, count]) => ({ code: parseInt(code), count }))
                        .sort((a, b) => a.code - b.code)}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="code" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Error Patterns */}
          <Card>
            <CardHeader>
              <CardTitle>Top Error Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {patterns.slice(0, 5).map((pattern, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{pattern.pattern}</div>
                      <div className="text-sm text-muted-foreground">
                        Last occurred: {new Date(pattern.lastOccurrence).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getErrorTypeBadgeColor(pattern.errorType)}>
                        {pattern.errorType}
                      </Badge>
                      <Badge variant="outline">
                        {pattern.count} occurrences
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <Label htmlFor="errorType">Error Type</Label>
                  <Select
                    value={filters.errorType}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, errorType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      {Object.keys(ERROR_TYPE_COLORS).map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="statusCode">Status Code</Label>
                  <Input
                    id="statusCode"
                    placeholder="e.g. 500"
                    value={filters.statusCode}
                    onChange={(e) => setFilters(prev => ({ ...prev, statusCode: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="endpoint">Endpoint</Label>
                  <Input
                    id="endpoint"
                    placeholder="e.g. /api/users"
                    value={filters.endpoint}
                    onChange={(e) => setFilters(prev => ({ ...prev, endpoint: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    placeholder="User ID"
                    value={filters.userId}
                    onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <Button onClick={loadData}>Apply Filters</Button>
              </div>
            </CardContent>
          </Card>

          {/* Error Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Error Logs ({filteredLogs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusBadgeColor(log.error.statusCode)}>
                          {log.error.statusCode}
                        </Badge>
                        <Badge variant={getErrorTypeBadgeColor(log.error.type)}>
                          {log.error.type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {log.request.method} {log.request.path}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="text-sm font-medium">{log.error.message}</div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <span>Request ID: {log.requestId}</span>
                        {log.request.userId && <span>User: {log.request.userId}</span>}
                        <span>IP: {log.request.ip}</span>
                        <span>Response Time: {log.response.responseTime}ms</span>
                      </div>
                      {!log.error.isOperational && (
                        <Badge variant="destructive" className="text-xs">
                          Critical
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredLogs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No error logs found matching the current filters.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Patterns Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patterns.map((pattern, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{pattern.pattern}</div>
                      <Badge variant="outline">{pattern.count} occurrences</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <Badge variant={getErrorTypeBadgeColor(pattern.errorType)}>
                        {pattern.errorType}
                      </Badge>
                      <span>Last: {new Date(pattern.lastOccurrence).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Error Trends</CardTitle>
              <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hour">Last Hour</SelectItem>
                  <SelectItem value="day">Last Day</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trends}>
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
                    dataKey="errorCount" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Error Count"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="errorRate" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Error Rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}