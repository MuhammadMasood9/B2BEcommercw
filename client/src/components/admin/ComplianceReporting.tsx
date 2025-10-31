import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarIcon, Download, FileText, Plus, Eye, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface AuditReport {
  id: string;
  name: string;
  description?: string;
  reportType: string;
  format: string;
  status: string;
  generatedBy: string;
  generatedAt?: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  recordCount: number;
  fileSizeBytes: number;
  downloadCount: number;
  createdAt: string;
}

interface CompliancePolicy {
  id: string;
  name: string;
  description: string;
  policyType: string;
  framework: string;
  status: string;
  effectiveDate: string;
  expiryDate?: string;
  createdAt: string;
}

interface ComplianceMetrics {
  overallComplianceScore: number;
  violationCounts: Array<{ severity: string; count: number }>;
  auditActivity: Array<{ eventType: string; count: number }>;
  resolutionMetrics: {
    avgResolutionTime: number;
    resolvedCount: number;
    totalCount: number;
  };
  activePoliciesCount: number;
}

export function ComplianceReporting() {
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [policies, setPolicies] = useState<CompliancePolicy[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);

  // Report creation form state
  const [reportForm, setReportForm] = useState({
    name: '',
    description: '',
    reportType: 'compliance',
    format: 'pdf',
    dateRangeStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    dateRangeEnd: new Date(),
    includeSensitive: false
  });

  // Policy creation form state
  const [policyForm, setPolicyForm] = useState({
    name: '',
    description: '',
    policyType: 'regulatory',
    framework: 'GDPR',
    rules: '',
    enforcementLevel: 'warning',
    effectiveDate: new Date(),
    expiryDate: undefined as Date | undefined,
    appliesTo: '',
    environments: 'production'
  });

  // Fetch reports
  const fetchReports = async () => {
    try {
      const response = await fetch('/api/admin/compliance/reports');
      if (response.ok) {
        const data = await response.json();
        setReports(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  };

  // Fetch policies
  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/admin/compliance/policies');
      if (response.ok) {
        const data = await response.json();
        setPolicies(data);
      }
    } catch (error) {
      console.error('Failed to fetch policies:', error);
    }
  };

  // Fetch compliance metrics
  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/compliance/metrics/dashboard');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  // Create audit report
  const createReport = async () => {
    try {
      const response = await fetch('/api/admin/compliance/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reportForm,
          dateRangeStart: reportForm.dateRangeStart.toISOString(),
          dateRangeEnd: reportForm.dateRangeEnd.toISOString()
        })
      });

      if (response.ok) {
        setShowCreateReport(false);
        setReportForm({
          name: '',
          description: '',
          reportType: 'compliance',
          format: 'pdf',
          dateRangeStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          dateRangeEnd: new Date(),
          includeSensitive: false
        });
        fetchReports();
      }
    } catch (error) {
      console.error('Failed to create report:', error);
    }
  };

  // Create compliance policy
  const createPolicy = async () => {
    try {
      const response = await fetch('/api/admin/compliance/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...policyForm,
          rules: JSON.parse(policyForm.rules || '[]'),
          appliesTo: policyForm.appliesTo.split(',').map(s => s.trim()).filter(Boolean),
          environments: [policyForm.environments],
          effectiveDate: policyForm.effectiveDate.toISOString(),
          expiryDate: policyForm.expiryDate?.toISOString()
        })
      });

      if (response.ok) {
        setShowCreatePolicy(false);
        setPolicyForm({
          name: '',
          description: '',
          policyType: 'regulatory',
          framework: 'GDPR',
          rules: '',
          enforcementLevel: 'warning',
          effectiveDate: new Date(),
          expiryDate: undefined,
          appliesTo: '',
          environments: 'production'
        });
        fetchPolicies();
      }
    } catch (error) {
      console.error('Failed to create policy:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchReports(), fetchPolicies(), fetchMetrics()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'generating': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPolicyStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'deprecated': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="text-center py-8">Loading compliance reporting...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Compliance Reporting</h1>
          <p className="text-gray-600 mt-1">Generate reports and manage compliance policies</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreatePolicy} onOpenChange={setShowCreatePolicy}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Policy
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={showCreateReport} onOpenChange={setShowCreateReport}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Compliance Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.overallComplianceScore.toFixed(1)}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Policies</p>
                  <p className="text-2xl font-bold">{metrics.activePoliciesCount}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open Violations</p>
                  <p className="text-2xl font-bold text-red-600">
                    {metrics.violationCounts.reduce((sum, v) => sum + v.count, 0)}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Resolution Time</p>
                  <p className="text-2xl font-bold">{metrics.resolutionMetrics.avgResolutionTime?.toFixed(1) || 0}h</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{report.name}</h3>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                      <Badge variant="outline">{report.reportType}</Badge>
                      <Badge variant="outline">{report.format.toUpperCase()}</Badge>
                    </div>
                    {report.description && (
                      <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        Period: {format(new Date(report.dateRangeStart), 'MMM dd')} - {format(new Date(report.dateRangeEnd), 'MMM dd, yyyy')}
                      </span>
                      <span>Records: {report.recordCount.toLocaleString()}</span>
                      {report.fileSizeBytes > 0 && <span>Size: {formatFileSize(report.fileSizeBytes)}</span>}
                      <span>Downloads: {report.downloadCount}</span>
                      <span>Created: {format(new Date(report.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {report.status === 'completed' && (
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Policies Section */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Policies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {policies.map((policy) => (
              <div key={policy.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{policy.name}</h3>
                      <Badge className={getPolicyStatusColor(policy.status)}>
                        {policy.status}
                      </Badge>
                      <Badge variant="outline">{policy.framework}</Badge>
                      <Badge variant="outline">{policy.policyType}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{policy.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Effective: {format(new Date(policy.effectiveDate), 'MMM dd, yyyy')}</span>
                      {policy.expiryDate && (
                        <span>Expires: {format(new Date(policy.expiryDate), 'MMM dd, yyyy')}</span>
                      )}
                      <span>Created: {format(new Date(policy.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Report Dialog */}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Audit Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Report Name</label>
              <Input
                value={reportForm.name}
                onChange={(e) => setReportForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter report name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <Select value={reportForm.reportType} onValueChange={(value) => 
                setReportForm(prev => ({ ...prev, reportType: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <Textarea
              value={reportForm.description}
              onChange={(e) => setReportForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Format</label>
              <Select value={reportForm.format} onValueChange={(value) => 
                setReportForm(prev => ({ ...prev, format: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(reportForm.dateRangeStart, 'MMM dd')} - {format(reportForm.dateRangeEnd, 'MMM dd, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{
                      from: reportForm.dateRangeStart,
                      to: reportForm.dateRangeEnd
                    }}
                    onSelect={(range) => {
                      if (range?.from) setReportForm(prev => ({ ...prev, dateRangeStart: range.from! }));
                      if (range?.to) setReportForm(prev => ({ ...prev, dateRangeEnd: range.to! }));
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateReport(false)}>
              Cancel
            </Button>
            <Button onClick={createReport} disabled={!reportForm.name}>
              Generate Report
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Create Policy Dialog */}
      <Dialog open={showCreatePolicy} onOpenChange={setShowCreatePolicy}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Compliance Policy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Policy Name</label>
                <Input
                  value={policyForm.name}
                  onChange={(e) => setPolicyForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter policy name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Framework</label>
                <Select value={policyForm.framework} onValueChange={(value) => 
                  setPolicyForm(prev => ({ ...prev, framework: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GDPR">GDPR</SelectItem>
                    <SelectItem value="SOX">SOX</SelectItem>
                    <SelectItem value="PCI_DSS">PCI DSS</SelectItem>
                    <SelectItem value="ISO27001">ISO 27001</SelectItem>
                    <SelectItem value="INTERNAL">Internal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={policyForm.description}
                onChange={(e) => setPolicyForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Policy description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Policy Type</label>
                <Select value={policyForm.policyType} onValueChange={(value) => 
                  setPolicyForm(prev => ({ ...prev, policyType: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regulatory">Regulatory</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="data_protection">Data Protection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Enforcement Level</label>
                <Select value={policyForm.enforcementLevel} onValueChange={(value) => 
                  setPolicyForm(prev => ({ ...prev, enforcementLevel: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Policy Rules (JSON)</label>
              <Textarea
                value={policyForm.rules}
                onChange={(e) => setPolicyForm(prev => ({ ...prev, rules: e.target.value }))}
                placeholder='[{"condition": "example", "action": "example"}]'
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreatePolicy(false)}>
                Cancel
              </Button>
              <Button onClick={createPolicy} disabled={!policyForm.name || !policyForm.description}>
                Create Policy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}