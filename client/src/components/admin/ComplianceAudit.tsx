import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, Filter, Download, Eye, AlertTriangle, CheckCircle, Clock, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  eventType: string;
  category: string;
  title: string;
  description: string;
  actorName: string;
  actorType: string;
  targetType?: string;
  targetName?: string;
  riskLevel: string;
  complianceTags: string[];
  createdAt: string;
  ipAddress?: string;
}

interface ComplianceViolation {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  violationType: string;
  detectedAt: string;
  assignedTo?: string;
  resolutionSummary?: string;
  impactLevel: string;
  affectedRecords: number;
}

interface AuditFilters {
  eventType?: string;
  category?: string;
  riskLevel?: string;
  startDate?: Date;
  endDate?: Date;
  complianceTags?: string[];
  search?: string;
}

export function ComplianceAudit() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [activeTab, setActiveTab] = useState('audit-logs');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.eventType) params.append('eventType', filters.eventType);
      if (filters.category) params.append('category', filters.category);
      if (filters.riskLevel) params.append('riskLevel', filters.riskLevel);
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters.complianceTags?.length) {
        filters.complianceTags.forEach(tag => params.append('complianceTags', tag));
      }
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/admin/compliance/audit-logs/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch compliance violations
  const fetchViolations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/admin/compliance/violations?${params}`);
      if (response.ok) {
        const data = await response.json();
        setViolations(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch violations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Verify audit chain integrity
  const verifyIntegrity = async () => {
    try {
      const response = await fetch('/api/admin/compliance/audit-logs/verify-integrity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: filters.startDate?.toISOString(),
          endDate: filters.endDate?.toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Integrity Check Results:
Valid: ${result.isValid ? 'Yes' : 'No'}
Total Records: ${result.totalRecords}
Verified Records: ${result.verifiedRecords}
Broken Chains: ${result.brokenChains.length}`);
      }
    } catch (error) {
      console.error('Failed to verify integrity:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit-logs') {
      fetchAuditLogs();
    } else if (activeTab === 'violations') {
      fetchViolations();
    }
  }, [activeTab, filters, pagination.page]);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'investigating': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'remediation': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'open': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Compliance Audit</h1>
          <p className="text-gray-600 mt-1">Monitor audit trails and compliance violations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={verifyIntegrity} variant="outline">
            <Shield className="h-4 w-4 mr-2" />
            Verify Integrity
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Event Type</label>
              <Select value={filters.eventType || ''} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, eventType: value || undefined }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="admin_action">Admin Action</SelectItem>
                  <SelectItem value="system_event">System Event</SelectItem>
                  <SelectItem value="security_event">Security Event</SelectItem>
                  <SelectItem value="compliance_event">Compliance Event</SelectItem>
                  <SelectItem value="data_modification">Data Modification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={filters.category || ''} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, category: value || undefined }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  <SelectItem value="authentication">Authentication</SelectItem>
                  <SelectItem value="authorization">Authorization</SelectItem>
                  <SelectItem value="data_access">Data Access</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="supplier_management">Supplier Management</SelectItem>
                  <SelectItem value="content_moderation">Content Moderation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Risk Level</label>
              <Select value={filters.riskLevel || ''} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, riskLevel: value || undefined }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All levels</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{
                        from: filters.startDate,
                        to: filters.endDate
                      }}
                      onSelect={(range) => {
                        setFilters(prev => ({
                          ...prev,
                          startDate: range?.from,
                          endDate: range?.to
                        }));
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                {(filters.startDate || filters.endDate) && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, startDate: undefined, endDate: undefined }))}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="violations">Compliance Violations</TabsTrigger>
        </TabsList>

        <TabsContent value="audit-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading audit logs...</div>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{log.title}</h3>
                            <Badge className={getRiskLevelColor(log.riskLevel)}>
                              {log.riskLevel}
                            </Badge>
                            <Badge variant="outline">{log.eventType}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{log.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Actor: {log.actorName} ({log.actorType})</span>
                            {log.targetName && <span>Target: {log.targetName}</span>}
                            <span>{format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                            {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                      {log.complianceTags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {log.complianceTags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Pagination */}
                  <div className="flex justify-between items-center pt-4">
                    <div className="text-sm text-gray-600">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      >
                        Previous
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Violations</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading violations...</div>
              ) : (
                <div className="space-y-4">
                  {violations.map((violation) => (
                    <div key={violation.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{violation.title}</h3>
                            <Badge className={getSeverityColor(violation.severity)}>
                              {violation.severity}
                            </Badge>
                            <Badge className={getStatusColor(violation.status)}>
                              {violation.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{violation.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Type: {violation.violationType}</span>
                            <span>Impact: {violation.impactLevel}</span>
                            <span>Records: {violation.affectedRecords}</span>
                            <span>Detected: {format(new Date(violation.detectedAt), 'MMM dd, yyyy HH:mm')}</span>
                          </div>
                          {violation.assignedTo && (
                            <div className="text-xs text-gray-500 mt-1">
                              Assigned to: {violation.assignedTo}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {violation.status === 'open' && (
                            <Button variant="outline" size="sm">
                              Assign
                            </Button>
                          )}
                        </div>
                      </div>
                      {violation.resolutionSummary && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                          <strong>Resolution:</strong> {violation.resolutionSummary}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Pagination */}
                  <div className="flex justify-between items-center pt-4">
                    <div className="text-sm text-gray-600">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      >
                        Previous
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}