import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Filter,
  Settings,
  Clock,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  Share,
  Save,
  Play,
  Pause,
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'analytics' | 'financial' | 'operational' | 'compliance' | 'custom';
  metrics: string[];
  filters: ReportFilter[];
  visualization: 'table' | 'chart' | 'dashboard' | 'mixed';
  schedule?: ReportSchedule;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  recipients: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastGenerated?: Date;
}

interface ReportFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'between';
  value: any;
  label: string;
}

interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  time: string; // HH:MM format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  timezone: string;
  enabled: boolean;
}

interface GeneratedReport {
  id: string;
  templateId: string;
  templateName: string;
  status: 'generating' | 'completed' | 'failed';
  format: string;
  size: number;
  downloadUrl?: string;
  error?: string;
  generatedAt: Date;
  expiresAt: Date;
}

interface ReportMetric {
  id: string;
  name: string;
  description: string;
  category: string;
  dataType: 'number' | 'currency' | 'percentage' | 'date' | 'text';
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export default function ReportGenerator() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [availableMetrics, setAvailableMetrics] = useState<ReportMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Form state for creating/editing templates
  const [formData, setFormData] = useState<Partial<ReportTemplate>>({
    name: '',
    description: '',
    type: 'analytics',
    metrics: [],
    filters: [],
    visualization: 'table',
    format: 'pdf',
    recipients: [],
    isActive: true,
  });

  useEffect(() => {
    fetchTemplates();
    fetchGeneratedReports();
    fetchAvailableMetrics();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/reports/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch report templates',
        variant: 'destructive',
      });
    }
  };

  const fetchGeneratedReports = async () => {
    try {
      const response = await fetch('/api/admin/reports/generated?limit=50');
      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      setGeneratedReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMetrics = async () => {
    try {
      const response = await fetch('/api/admin/reports/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setAvailableMetrics(data.metrics || getDefaultMetrics());
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setAvailableMetrics(getDefaultMetrics());
    }
  };

  const getDefaultMetrics = (): ReportMetric[] => [
    { id: 'total_revenue', name: 'Total Revenue', description: 'Total platform revenue', category: 'Financial', dataType: 'currency', aggregation: 'sum' },
    { id: 'total_orders', name: 'Total Orders', description: 'Total number of orders', category: 'Sales', dataType: 'number', aggregation: 'count' },
    { id: 'active_suppliers', name: 'Active Suppliers', description: 'Number of active suppliers', category: 'Suppliers', dataType: 'number', aggregation: 'count' },
    { id: 'active_users', name: 'Active Users', description: 'Number of active users', category: 'Users', dataType: 'number', aggregation: 'count' },
    { id: 'conversion_rate', name: 'Conversion Rate', description: 'Order conversion rate', category: 'Performance', dataType: 'percentage' },
    { id: 'avg_order_value', name: 'Average Order Value', description: 'Average value per order', category: 'Sales', dataType: 'currency', aggregation: 'avg' },
    { id: 'supplier_retention', name: 'Supplier Retention', description: 'Supplier retention rate', category: 'Suppliers', dataType: 'percentage' },
    { id: 'user_engagement', name: 'User Engagement', description: 'User engagement score', category: 'Users', dataType: 'percentage' },
  ];

  const generateReport = async (templateId: string, customParams?: any) => {
    try {
      const response = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId,
          ...customParams,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const data = await response.json();
      
      // Add to generated reports list
      setGeneratedReports(prev => [data.report, ...prev]);
      
      toast({
        title: 'Success',
        description: 'Report generation started',
      });

      // Poll for completion
      pollReportStatus(data.report.id);
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    }
  };

  const pollReportStatus = async (reportId: string) => {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/admin/reports/status/${reportId}`);
        if (!response.ok) return;

        const data = await response.json();
        const report = data.report;

        setGeneratedReports(prev => 
          prev.map(r => r.id === reportId ? report : r)
        );

        if (report.status === 'completed') {
          toast({
            title: 'Success',
            description: 'Report generated successfully',
          });
          return;
        }

        if (report.status === 'failed') {
          toast({
            title: 'Error',
            description: `Report generation failed: ${report.error}`,
            variant: 'destructive',
          });
          return;
        }

        // Continue polling if still generating
        if (report.status === 'generating' && attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 10000); // Poll every 10 seconds
        }
      } catch (error) {
        console.error('Error polling report status:', error);
      }
    };

    poll();
  };

  const saveTemplate = async () => {
    try {
      const url = isEditing ? `/api/admin/reports/templates/${selectedTemplate?.id}` : '/api/admin/reports/templates';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save template');

      const data = await response.json();
      
      if (isEditing) {
        setTemplates(prev => prev.map(t => t.id === selectedTemplate?.id ? data.template : t));
      } else {
        setTemplates(prev => [data.template, ...prev]);
      }

      setIsCreating(false);
      setIsEditing(false);
      setSelectedTemplate(null);
      setFormData({
        name: '',
        description: '',
        type: 'analytics',
        metrics: [],
        filters: [],
        visualization: 'table',
        format: 'pdf',
        recipients: [],
        isActive: true,
      });

      toast({
        title: 'Success',
        description: `Template ${isEditing ? 'updated' : 'created'} successfully`,
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive',
      });
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/admin/reports/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete template');

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      
      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    }
  };

  const downloadReport = async (report: GeneratedReport) => {
    if (!report.downloadUrl) return;

    try {
      const response = await fetch(report.downloadUrl);
      if (!response.ok) throw new Error('Failed to download report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.templateName}_${new Date(report.generatedAt).toISOString().split('T')[0]}.${report.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Report downloaded successfully',
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: 'Error',
        description: 'Failed to download report',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'generating': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'analytics': return 'text-blue-600 bg-blue-100';
      case 'financial': return 'text-green-600 bg-green-100';
      case 'operational': return 'text-purple-600 bg-purple-100';
      case 'compliance': return 'text-orange-600 bg-orange-100';
      case 'custom': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
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
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading report generator...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Report Generator</h1>
          <p className="text-gray-600">Create and manage custom analytics reports</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="generated">Generated Reports</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {isCreating || isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle>{isEditing ? 'Edit Template' : 'Create New Template'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter template name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="template-type">Report Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="template-description">Description</Label>
                  <Textarea
                    id="template-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this report includes"
                  />
                </div>

                {/* Metrics Selection */}
                <div>
                  <Label>Select Metrics</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                    {availableMetrics.map((metric) => (
                      <div key={metric.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={metric.id}
                          checked={formData.metrics?.includes(metric.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                metrics: [...(prev.metrics || []), metric.id]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                metrics: (prev.metrics || []).filter(m => m !== metric.id)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={metric.id} className="text-sm">
                          {metric.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Output Settings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="visualization">Visualization</Label>
                    <Select value={formData.visualization} onValueChange={(value) => setFormData(prev => ({ ...prev, visualization: value as any }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visualization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="table">Table</SelectItem>
                        <SelectItem value="chart">Chart</SelectItem>
                        <SelectItem value="dashboard">Dashboard</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="format">Output Format</Label>
                    <Select value={formData.format} onValueChange={(value) => setFormData(prev => ({ ...prev, format: value as any }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      id="is-active"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked === true }))}
                    />
                    <Label htmlFor="is-active">Active Template</Label>
                  </div>
                </div>

                {/* Recipients */}
                <div>
                  <Label htmlFor="recipients">Email Recipients (optional)</Label>
                  <Textarea
                    id="recipients"
                    value={formData.recipients?.join('\n')}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      recipients: e.target.value.split('\n').filter(email => email.trim())
                    }))}
                    placeholder="Enter email addresses, one per line"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-4">
                  <Button onClick={saveTemplate}>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update Template' : 'Create Template'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(false);
                      setSelectedTemplate(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Report Templates ({templates.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <div key={template.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{template.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setFormData(template);
                              setIsEditing(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteTemplate(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getTypeColor(template.type)}>
                          {template.type}
                        </Badge>
                        <Badge variant="outline">{template.format.toUpperCase()}</Badge>
                        {template.isActive ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        <p>Metrics: {template.metrics.length}</p>
                        <p>Last generated: {template.lastGenerated ? new Date(template.lastGenerated).toLocaleDateString() : 'Never'}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => generateReport(template.id)}
                          className="flex-1"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Generate
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="generated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports ({generatedReports.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generatedReports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p>No reports generated yet.</p>
                  </div>
                ) : (
                  generatedReports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold">{report.templateName}</h4>
                            <Badge className={getStatusColor(report.status)}>
                              {report.status}
                            </Badge>
                            <Badge variant="outline">{report.format.toUpperCase()}</Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Generated: {new Date(report.generatedAt).toLocaleString()}</p>
                            <p>Size: {formatFileSize(report.size)}</p>
                            {report.expiresAt && (
                              <p>Expires: {new Date(report.expiresAt).toLocaleString()}</p>
                            )}
                            {report.error && (
                              <p className="text-red-600">Error: {report.error}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {report.status === 'completed' && report.downloadUrl && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadReport(report)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Share className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {report.status === 'generating' && (
                            <div className="flex items-center space-x-2">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span className="text-sm text-gray-600">Generating...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.filter(t => t.schedule?.enabled).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4" />
                    <p>No scheduled reports configured.</p>
                    <p className="text-sm">Create a template and add a schedule to automate report generation.</p>
                  </div>
                ) : (
                  templates
                    .filter(t => t.schedule?.enabled)
                    .map((template) => (
                      <div key={template.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{template.name}</h4>
                            <div className="text-sm text-gray-600 mt-1">
                              <p>Frequency: {template.schedule?.frequency}</p>
                              <p>Time: {template.schedule?.time} ({template.schedule?.timezone})</p>
                              <p>Recipients: {template.recipients.length} email(s)</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}