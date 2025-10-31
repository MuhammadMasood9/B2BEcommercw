import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Bell, 
  BellOff,
  Settings,
  Filter,
  Search,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  Zap,
  Shield,
  Activity,
  Play,
  TestTube,
  History,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SystemAlert {
  id: string;
  type: 'system' | 'security' | 'business' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  source: string;
  entityId?: string;
  entityType?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: 'threshold' | 'anomaly' | 'pattern' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  condition: string;
  threshold: number;
  enabled: boolean;
  notificationChannels: string[];
  escalationRules: EscalationRule[];
  createdAt: Date;
  updatedAt: Date;
}

interface EscalationRule {
  id: string;
  delay: number; // minutes
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: string[];
  recipients: string[];
}

interface AlertConfiguration {
  globalSettings: {
    enableNotifications: boolean;
    defaultSeverity: 'low' | 'medium' | 'high' | 'critical';
    retentionDays: number;
    maxAlertsPerHour: number;
  };
  notificationChannels: {
    email: {
      enabled: boolean;
      recipients: string[];
      template: string;
    };
    sms: {
      enabled: boolean;
      recipients: string[];
    };
    webhook: {
      enabled: boolean;
      url: string;
      headers: Record<string, string>;
    };
    inApp: {
      enabled: boolean;
      showDesktop: boolean;
    };
  };
  escalationMatrix: EscalationRule[];
}

export default function AlertManagement() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [configuration, setConfiguration] = useState<AlertConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('alerts');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAlerts();
    fetchAlertRules();
    fetchConfiguration();
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [filterSeverity, filterType, showResolved]);

  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams({
        limit: '100',
        acknowledged: showResolved ? 'all' : 'false',
        resolved: showResolved ? 'all' : 'false',
      });
      
      if (filterSeverity !== 'all') {
        params.append('severity', filterSeverity);
      }
      
      if (filterType !== 'all') {
        params.append('type', filterType);
      }
      
      const response = await fetch(`/api/admin/monitoring/alerts/active?${params}`);
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch alerts',
        variant: 'destructive',
      });
    }
  };

  const fetchAlertRules = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/alerts/rules');
      if (!response.ok) throw new Error('Failed to fetch alert rules');
      const data = await response.json();
      setAlertRules(data.rules || []);
    } catch (error) {
      console.error('Error fetching alert rules:', error);
    }
  };

  const fetchConfiguration = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/alerts/configuration');
      if (!response.ok) throw new Error('Failed to fetch configuration');
      const data = await response.json();
      setConfiguration(data.configuration || getDefaultConfiguration());
    } catch (error) {
      console.error('Error fetching configuration:', error);
      setConfiguration(getDefaultConfiguration());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultConfiguration = (): AlertConfiguration => ({
    globalSettings: {
      enableNotifications: true,
      defaultSeverity: 'medium',
      retentionDays: 30,
      maxAlertsPerHour: 100,
    },
    notificationChannels: {
      email: {
        enabled: true,
        recipients: ['admin@example.com'],
        template: 'default',
      },
      sms: {
        enabled: false,
        recipients: [],
      },
      webhook: {
        enabled: false,
        url: '',
        headers: {},
      },
      inApp: {
        enabled: true,
        showDesktop: true,
      },
    },
    escalationMatrix: [],
  });

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/monitoring/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to acknowledge alert');
      
      setAlerts(alerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true, acknowledgedAt: new Date() }
          : alert
      ));
      
      toast({
        title: 'Success',
        description: 'Alert acknowledged successfully',
      });
      
      // Refresh alerts to get updated data
      fetchAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to acknowledge alert',
        variant: 'destructive',
      });
    }
  };

  const resolveAlert = async (alertId: string, resolution: string) => {
    try {
      const response = await fetch(`/api/admin/monitoring/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resolution }),
      });
      if (!response.ok) throw new Error('Failed to resolve alert');
      
      setAlerts(alerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, resolved: true, resolvedAt: new Date(), resolution }
          : alert
      ));
      
      toast({
        title: 'Success',
        description: 'Alert resolved successfully',
      });
      
      // Refresh alerts to get updated data
      fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve alert',
        variant: 'destructive',
      });
    }
  };

  const createAlertRule = async (rule: Partial<AlertRule>) => {
    try {
      const response = await fetch('/api/admin/monitoring/alerts/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rule),
      });
      if (!response.ok) throw new Error('Failed to create alert rule');
      
      const data = await response.json();
      setAlertRules([...alertRules, data.rule]);
      
      toast({
        title: 'Success',
        description: 'Alert rule created successfully',
      });
    } catch (error) {
      console.error('Error creating alert rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to create alert rule',
        variant: 'destructive',
      });
    }
  };

  const toggleAlertRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/admin/monitoring/alerts/rules/${ruleId}/toggle`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to toggle alert rule');
      
      const data = await response.json();
      setAlertRules(alertRules.map(rule => 
        rule.id === ruleId ? data.rule : rule
      ));
      
      toast({
        title: 'Success',
        description: `Alert rule ${data.rule.enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error toggling alert rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle alert rule',
        variant: 'destructive',
      });
    }
  };

  const deleteAlertRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/admin/monitoring/alerts/rules/${ruleId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete alert rule');
      
      setAlertRules(alertRules.filter(rule => rule.id !== ruleId));
      
      toast({
        title: 'Success',
        description: 'Alert rule deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting alert rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete alert rule',
        variant: 'destructive',
      });
    }
  };

  const testNotifications = async (channels: string[]) => {
    try {
      const response = await fetch('/api/admin/monitoring/alerts/test-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channels }),
      });
      if (!response.ok) throw new Error('Failed to test notifications');
      
      toast({
        title: 'Success',
        description: 'Test notifications sent successfully',
      });
    } catch (error) {
      console.error('Error testing notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to test notifications',
        variant: 'destructive',
      });
    }
  };

  const runAlertMonitoring = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/alerts/run-monitoring', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to run alert monitoring');
      
      toast({
        title: 'Success',
        description: 'Alert monitoring completed successfully',
      });
      
      // Refresh alerts after monitoring
      fetchAlerts();
    } catch (error) {
      console.error('Error running alert monitoring:', error);
      toast({
        title: 'Error',
        description: 'Failed to run alert monitoring',
        variant: 'destructive',
      });
    }
  };

  const updateConfiguration = async (newConfig: AlertConfiguration) => {
    try {
      const response = await fetch('/api/admin/monitoring/alerts/configuration', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      });
      if (!response.ok) throw new Error('Failed to update configuration');
      
      setConfiguration(newConfig);
      
      toast({
        title: 'Success',
        description: 'Alert configuration updated',
      });
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to update configuration',
        variant: 'destructive',
      });
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'system': return <Activity className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'business': return <Zap className="h-4 w-4" />;
      case 'compliance': return <CheckCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (!showResolved && alert.resolved) return false;
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    if (filterType !== 'all' && alert.type !== filterType) return false;
    if (searchTerm && !alert.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !alert.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const alertSummary = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical' && !a.resolved).length,
    high: alerts.filter(a => a.severity === 'high' && !a.resolved).length,
    medium: alerts.filter(a => a.severity === 'medium' && !a.resolved).length,
    low: alerts.filter(a => a.severity === 'low' && !a.resolved).length,
    unacknowledged: alerts.filter(a => !a.acknowledged && !a.resolved).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading alert management...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alert Management</h1>
          <p className="text-gray-600">Monitor and manage system alerts and notifications</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={runAlertMonitoring} variant="outline">
            <Play className="h-4 w-4 mr-2" />
            Run Monitoring
          </Button>
          <Button onClick={() => testNotifications(['email', 'in_app'])} variant="outline">
            <TestTube className="h-4 w-4 mr-2" />
            Test Notifications
          </Button>
          <Button onClick={fetchAlerts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertSummary.total}</div>
          </CardContent>
        </Card>
        
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alertSummary.critical}</div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">High</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{alertSummary.high}</div>
          </CardContent>
        </Card>
        
        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Medium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{alertSummary.medium}</div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Low</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{alertSummary.low}</div>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-600">Unacknowledged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{alertSummary.unacknowledged}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search alerts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                    <SelectTrigger>
                      <SelectValue placeholder="All severities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="show-resolved"
                    checked={showResolved}
                    onCheckedChange={setShowResolved}
                  />
                  <Label htmlFor="show-resolved">Show resolved</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          <Card>
            <CardHeader>
              <CardTitle>Alerts ({filteredAlerts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAlerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-4" />
                    <p>No alerts match your current filters.</p>
                  </div>
                ) : (
                  filteredAlerts.map((alert) => (
                    <Alert key={alert.id} className={`${getSeverityColor(alert.severity)} border-l-4`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="flex items-center space-x-2">
                            {getSeverityIcon(alert.severity)}
                            {getTypeIcon(alert.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold">{alert.title}</h4>
                              <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                                {alert.severity}
                              </Badge>
                              <Badge variant="outline">{alert.type}</Badge>
                              {alert.acknowledged && (
                                <Badge variant="secondary">Acknowledged</Badge>
                              )}
                              {alert.resolved && (
                                <Badge variant="default">Resolved</Badge>
                              )}
                            </div>
                            <AlertDescription className="mb-2">
                              {alert.message}
                            </AlertDescription>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Source: {alert.source}</span>
                              <span>Created: {new Date(alert.createdAt).toLocaleString()}</span>
                              {alert.acknowledgedAt && (
                                <span>Acknowledged: {new Date(alert.acknowledgedAt).toLocaleString()}</span>
                              )}
                            </div>
                            {alert.resolution && (
                              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                <p className="text-sm text-green-800">
                                  <strong>Resolution:</strong> {alert.resolution}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!alert.acknowledged && !alert.resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                          {!alert.resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const resolution = prompt('Enter resolution details:');
                                if (resolution) {
                                  resolveAlert(alert.id, resolution);
                                }
                              }}
                            >
                              Resolve
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Alert>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Alert Rules</CardTitle>
                <Button onClick={() => {
                  // Open create rule dialog
                  const name = prompt('Rule name:');
                  if (name) {
                    createAlertRule({
                      name,
                      description: 'New alert rule',
                      type: 'threshold',
                      severity: 'medium',
                      metric: 'cpu_usage',
                      condition: 'greater_than',
                      threshold: 80,
                      enabled: true,
                      notificationChannels: ['email'],
                      escalationRules: []
                    });
                  }
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertRules.map((rule) => (
                  <div key={rule.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold">{rule.name}</h4>
                        <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        <Badge variant="outline">{rule.severity}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => toggleAlertRule(rule.id)}
                          title={rule.enabled ? 'Disable Rule' : 'Enable Rule'}
                        >
                          {rule.enabled ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this alert rule?')) {
                              deleteAlertRule(rule.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                    <div className="text-xs text-gray-500">
                      <span>Metric: {rule.metric}</span>
                      <span className="mx-2">•</span>
                      <span>Condition: {rule.condition} {rule.threshold}</span>
                      <span className="mx-2">•</span>
                      <span>Channels: {rule.notificationChannels.join(', ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          {configuration && (
            <>
              {/* Global Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Global Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enable-notifications"
                        checked={configuration.globalSettings.enableNotifications}
                        onCheckedChange={(checked) => {
                          const newConfig = {
                            ...configuration,
                            globalSettings: {
                              ...configuration.globalSettings,
                              enableNotifications: checked
                            }
                          };
                          updateConfiguration(newConfig);
                        }}
                      />
                      <Label htmlFor="enable-notifications">Enable Notifications</Label>
                    </div>
                    
                    <div>
                      <Label htmlFor="retention-days">Retention Days</Label>
                      <Input
                        id="retention-days"
                        type="number"
                        value={configuration.globalSettings.retentionDays}
                        onChange={(e) => {
                          const newConfig = {
                            ...configuration,
                            globalSettings: {
                              ...configuration.globalSettings,
                              retentionDays: parseInt(e.target.value)
                            }
                          };
                          updateConfiguration(newConfig);
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Channels */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Notification Channels</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">Email Notifications</h4>
                      <Switch
                        checked={configuration.notificationChannels.email.enabled}
                        onCheckedChange={(checked) => {
                          const newConfig = {
                            ...configuration,
                            notificationChannels: {
                              ...configuration.notificationChannels,
                              email: {
                                ...configuration.notificationChannels.email,
                                enabled: checked
                              }
                            }
                          };
                          updateConfiguration(newConfig);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-recipients">Recipients</Label>
                      <Textarea
                        id="email-recipients"
                        placeholder="Enter email addresses, one per line"
                        value={configuration.notificationChannels.email.recipients.join('\n')}
                        onChange={(e) => {
                          const newConfig = {
                            ...configuration,
                            notificationChannels: {
                              ...configuration.notificationChannels,
                              email: {
                                ...configuration.notificationChannels.email,
                                recipients: e.target.value.split('\n').filter(email => email.trim())
                              }
                            }
                          };
                          updateConfiguration(newConfig);
                        }}
                      />
                    </div>
                  </div>

                  {/* In-App */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">In-App Notifications</h4>
                      <Switch
                        checked={configuration.notificationChannels.inApp.enabled}
                        onCheckedChange={(checked) => {
                          const newConfig = {
                            ...configuration,
                            notificationChannels: {
                              ...configuration.notificationChannels,
                              inApp: {
                                ...configuration.notificationChannels.inApp,
                                enabled: checked
                              }
                            }
                          };
                          updateConfiguration(newConfig);
                        }}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="desktop-notifications"
                        checked={configuration.notificationChannels.inApp.showDesktop}
                        onCheckedChange={(checked) => {
                          const newConfig = {
                            ...configuration,
                            notificationChannels: {
                              ...configuration.notificationChannels,
                              inApp: {
                                ...configuration.notificationChannels.inApp,
                                showDesktop: checked
                              }
                            }
                          };
                          updateConfiguration(newConfig);
                        }}
                      />
                      <Label htmlFor="desktop-notifications">Show Desktop Notifications</Label>
                    </div>
                  </div>

                  {/* Webhook */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">Webhook Notifications</h4>
                      <Switch
                        checked={configuration.notificationChannels.webhook.enabled}
                        onCheckedChange={(checked) => {
                          const newConfig = {
                            ...configuration,
                            notificationChannels: {
                              ...configuration.notificationChannels,
                              webhook: {
                                ...configuration.notificationChannels.webhook,
                                enabled: checked
                              }
                            }
                          };
                          updateConfiguration(newConfig);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="webhook-url">Webhook URL</Label>
                      <Input
                        id="webhook-url"
                        placeholder="https://your-webhook-url.com/alerts"
                        value={configuration.notificationChannels.webhook.url}
                        onChange={(e) => {
                          const newConfig = {
                            ...configuration,
                            notificationChannels: {
                              ...configuration.notificationChannels,
                              webhook: {
                                ...configuration.notificationChannels.webhook,
                                url: e.target.value
                              }
                            }
                          };
                          updateConfiguration(newConfig);
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Alert Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round((alertSummary.unacknowledged / Math.max(alertSummary.total, 1)) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Unacknowledged Rate</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {alertRules.filter(r => r.enabled).length}
                  </div>
                  <div className="text-sm text-gray-600">Active Rules</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {alerts.filter(a => a.escalationLevel > 0).length}
                  </div>
                  <div className="text-sm text-gray-600">Escalated Alerts</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(alerts.filter(a => a.resolved).length / Math.max(alerts.length, 1) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Resolution Rate</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Alerts by Severity</h4>
                  <div className="space-y-2">
                    {Object.entries(alertSummary).filter(([key]) => key !== 'total' && key !== 'unacknowledged').map(([severity, count]) => (
                      <div key={severity} className="flex items-center justify-between p-2 border rounded">
                        <span className="capitalize">{severity}</span>
                        <Badge variant={severity === 'critical' ? 'destructive' : 'secondary'}>
                          {count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Alert Types</h4>
                  <div className="space-y-2">
                    {['system', 'security', 'business', 'compliance', 'performance', 'capacity'].map(type => {
                      const count = alerts.filter(a => a.type === type).length;
                      return (
                        <div key={type} className="flex items-center justify-between p-2 border rounded">
                          <span className="capitalize">{type}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold mb-3">Recent Alert Activity</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {alerts.slice(0, 10).map(alert => (
                    <div key={alert.id} className="flex items-center justify-between p-2 border rounded text-sm">
                      <div className="flex items-center space-x-2">
                        {getSeverityIcon(alert.severity)}
                        <span>{alert.title}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{new Date(alert.createdAt).toLocaleString()}</span>
                        {alert.acknowledged && <Badge variant="secondary" className="text-xs">Ack</Badge>}
                        {alert.resolved && <Badge variant="default" className="text-xs">Resolved</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}