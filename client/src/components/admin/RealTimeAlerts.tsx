import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  AlertCircle, 
  XCircle, 
  CheckCircle, 
  Clock,
  Eye,
  X,
  RefreshCw,
  Bell,
  BellOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AlertItem {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  entityId: string;
  entityType: string;
  timestamp: Date;
  status: string;
}

interface AlertSummary {
  critical: number;
  error: number;
  warning: number;
  info: number;
}

interface RealTimeAlertsProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function RealTimeAlerts({ 
  className, 
  autoRefresh = true, 
  refreshInterval = 30000 
}: RealTimeAlertsProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [summary, setSummary] = useState<AlertSummary>({ critical: 0, error: 0, warning: 0, info: 0 });
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(autoRefresh);
  const { toast } = useToast();

  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
      });

      if (severityFilter !== 'all') {
        params.append('severity', severityFilter);
      }

      const response = await fetch(`/api/admin/oversight/monitoring/alerts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch alerts');
      
      const data = await response.json();
      setAlerts(data.alerts);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch monitoring alerts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    if (isAutoRefreshEnabled) {
      const interval = setInterval(fetchAlerts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [isAutoRefreshEnabled, refreshInterval, severityFilter]);

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesType = typeFilter === 'all' || alert.type === typeFilter;
    return matchesSeverity && matchesType;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'error': return 'border-red-400 bg-red-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'info': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'default';
      default: return 'outline';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
    toast({
      title: 'Alert Dismissed',
      description: 'The alert has been dismissed successfully.',
    });
  };

  const investigateAlert = (alert: AlertItem) => {
    // Navigate to detailed view or open investigation modal
    toast({
      title: 'Investigation Started',
      description: `Opening detailed view for ${alert.title}`,
    });
  };

  const uniqueTypes = Array.from(new Set(alerts.map(alert => alert.type)));

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Real-Time Alerts
              {isAutoRefreshEnabled && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </CardTitle>
            <CardDescription>
              Live monitoring alerts from quality control and fraud detection systems
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAutoRefreshEnabled(!isAutoRefreshEnabled)}
            >
              {isAutoRefreshEnabled ? (
                <BellOff className="h-4 w-4" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchAlerts}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Alert Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 border rounded-lg border-red-200 bg-red-50">
            <div className="text-2xl font-bold text-red-600">{summary.critical}</div>
            <div className="text-sm text-red-700">Critical</div>
          </div>
          <div className="text-center p-3 border rounded-lg border-orange-200 bg-orange-50">
            <div className="text-2xl font-bold text-orange-600">{summary.error}</div>
            <div className="text-sm text-orange-700">Error</div>
          </div>
          <div className="text-center p-3 border rounded-lg border-yellow-200 bg-yellow-50">
            <div className="text-2xl font-bold text-yellow-600">{summary.warning}</div>
            <div className="text-sm text-yellow-700">Warning</div>
          </div>
          <div className="text-center p-3 border rounded-lg border-blue-200 bg-blue-50">
            <div className="text-2xl font-bold text-blue-600">{summary.info}</div>
            <div className="text-sm text-blue-700">Info</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Alerts List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No alerts matching your criteria.</p>
              <p className="text-sm">System is running smoothly.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <Alert key={alert.id} className={`${getSeverityColor(alert.severity)} border-l-4`}>
                <div className="flex items-start gap-3">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium truncate">{alert.title}</h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={getSeverityBadgeVariant(alert.severity)} className="text-xs">
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {alert.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDate(alert.timestamp)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissAlert(alert.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <AlertDescription className="mb-3">
                      {alert.message}
                    </AlertDescription>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => investigateAlert(alert)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Investigate
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => dismissAlert(alert.id)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </Alert>
            ))
          )}
        </div>

        {/* Auto-refresh indicator */}
        {isAutoRefreshEnabled && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
              Auto-refreshing every {refreshInterval / 1000} seconds
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}