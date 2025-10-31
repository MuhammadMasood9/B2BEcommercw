import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  Eye, 
  Search, 
  Download, 
  Filter,
  Clock,
  User,
  Settings,
  Database,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  Zap
} from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

// Types
interface AdminActivityLog {
  id: string;
  adminUserId: string;
  adminName: string;
  adminEmail: string;
  action: string;
  description: string;
  category: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  riskLevel: string;
  ipAddress?: string;
  createdAt: string;
}

interface SecurityAuditEvent {
  id: string;
  eventType: string;
  severity: string;
  category: string;
  title: string;
  description: string;
  adminUserId?: string;
  ipAddress?: string;
  riskScore: number;
  acknowledged: boolean;
  resolved: boolean;
  createdAt: string;
}

export default function SecurityAudit() {
  const [activeTab, setActiveTab] = useState("activity");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Fetch admin activity logs
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['/api/admin/access/activity-logs', {
      adminUserId: selectedAdmin !== 'all' ? selectedAdmin : undefined,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
      });
      
      if (selectedAdmin !== 'all') {
        params.append('adminUserId', selectedAdmin);
      }
      
      const response = await apiRequest('GET', `/api/admin/access/activity-logs?${params}`);
      return response;
    },
  });

  // Fetch security audit events
  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['/api/admin/access/security-audit', {
      adminUserId: selectedAdmin !== 'all' ? selectedAdmin : undefined,
      severity: selectedSeverity !== 'all' ? selectedSeverity : undefined,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
      });
      
      if (selectedAdmin !== 'all') {
        params.append('adminUserId', selectedAdmin);
      }
      
      if (selectedSeverity !== 'all') {
        params.append('severity', selectedSeverity);
      }
      
      const response = await apiRequest('GET', `/api/admin/access/security-audit?${params}`);
      return response;
    },
  });

  // Fetch admin users for filter
  const { data: adminUsers = [] } = useQuery({
    queryKey: ['/api/admin/access/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/access/users');
      return response.users || [];
    },
  });

  const activityLogs = activityData?.logs || [];
  const auditEvents = auditData?.events || [];

  // Filter functions
  const filteredActivityLogs = activityLogs.filter((log: AdminActivityLog) => {
    const matchesSearch = searchTerm === "" || 
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || log.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const filteredAuditEvents = auditEvents.filter((event: SecurityAuditEvent) => {
    const matchesSearch = searchTerm === "" || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Helper functions
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication': return <Lock className="w-4 h-4" />;
      case 'authorization': return <Shield className="w-4 h-4" />;
      case 'data_modification': return <Database className="w-4 h-4" />;
      case 'system_configuration': return <Settings className="w-4 h-4" />;
      case 'security': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('create')) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (action.includes('update')) return <Settings className="w-4 h-4 text-blue-500" />;
    if (action.includes('delete')) return <XCircle className="w-4 h-4 text-red-500" />;
    if (action.includes('login')) return <Lock className="w-4 h-4 text-green-500" />;
    if (action.includes('denied')) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Security Audit</h2>
          <p className="text-gray-600 mt-1">Monitor admin activities and security events</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Activities</p>
                <p className="text-2xl font-bold">{activityLogs.length}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Security Events</p>
                <p className="text-2xl font-bold">{auditEvents.length}</p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Risk Events</p>
                <p className="text-2xl font-bold">
                  {auditEvents.filter((e: SecurityAuditEvent) => e.severity === 'high' || e.severity === 'critical').length}
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
                <p className="text-sm text-gray-600">Active Admins</p>
                <p className="text-2xl font-bold">{adminUsers.length}</p>
              </div>
              <User className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select admin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Admins</SelectItem>
                {adminUsers.map((admin: any) => (
                  <SelectItem key={admin.id} value={admin.id}>
                    {admin.firstName} {admin.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="authentication">Authentication</SelectItem>
                <SelectItem value="authorization">Authorization</SelectItem>
                <SelectItem value="data_modification">Data Modification</SelectItem>
                <SelectItem value="system_configuration">System Config</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
          <TabsTrigger value="security">Security Events</TabsTrigger>
        </TabsList>

        {/* Activity Logs Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Admin Activity Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivityLogs.map((log: AdminActivityLog) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {format(new Date(log.createdAt), 'MMM dd, HH:mm')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.adminName}</p>
                          <p className="text-sm text-gray-500">{log.adminEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <div>
                            <p className="font-medium">{log.action}</p>
                            <p className="text-sm text-gray-500">{log.description}</p>
                            {log.entityName && (
                              <p className="text-xs text-gray-400">Target: {log.entityName}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(log.category)}
                          <span className="capitalize">{log.category.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRiskLevelColor(log.riskLevel)}>
                          {log.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">{log.ipAddress || 'N/A'}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Events Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Audit Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAuditEvents.map((event: SecurityAuditEvent) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {format(new Date(event.createdAt), 'MMM dd, HH:mm')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-gray-500">{event.description}</p>
                          <p className="text-xs text-gray-400 capitalize">
                            {event.category} • {event.eventType.replace('_', ' ')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                event.riskScore >= 80 ? 'bg-red-500' :
                                event.riskScore >= 60 ? 'bg-orange-500' :
                                event.riskScore >= 40 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${event.riskScore}%` }}
                            />
                          </div>
                          <span className="text-sm">{event.riskScore}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {event.resolved ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Resolved
                            </Badge>
                          ) : event.acknowledged ? (
                            <Badge variant="secondary">
                              <Eye className="w-3 h-3 mr-1" />
                              Acknowledged
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Open
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">{event.ipAddress || 'N/A'}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, 
            activeTab === 'activity' ? activityLogs.length : auditEvents.length)} of{' '}
          {activeTab === 'activity' ? activityLogs.length : auditEvents.length} entries
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}