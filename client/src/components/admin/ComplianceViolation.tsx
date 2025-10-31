import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Eye, User, Clock, CheckCircle, XCircle, AlertCircle, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface ComplianceViolation {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  violationType: string;
  policyId: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  detectedBy: string;
  detectionMethod?: string;
  detectionConfidence: number;
  impactLevel: string;
  affectedRecords: number;
  financialImpact: number;
  regulatoryImpact?: string;
  assignedTo?: string;
  resolutionPlan?: string;
  remediationSteps: string[];
  resolutionSummary?: string;
  detectedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  dueDate?: string;
  escalationLevel: number;
  escalatedAt?: string;
  escalatedTo: string[];
}

interface RemediationStep {
  id: string;
  description: string;
  assignedTo?: string;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string;
  notes?: string;
}

interface ViolationFilters {
  severity?: string;
  status?: string;
  violationType?: string;
  assignedTo?: string;
  impactLevel?: string;
}

export function ComplianceViolation() {
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [selectedViolation, setSelectedViolation] = useState<ComplianceViolation | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ViolationFilters>({});
  const [showDetails, setShowDetails] = useState(false);
  const [showAssignment, setShowAssignment] = useState(false);
  const [showResolution, setShowResolution] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Assignment form state
  const [assignmentForm, setAssignmentForm] = useState({
    assignedTo: '',
    dueDate: '',
    resolutionPlan: '',
    priority: 'medium'
  });

  // Resolution form state
  const [resolutionForm, setResolutionForm] = useState({
    status: 'resolved',
    resolutionSummary: '',
    remediationSteps: [] as RemediationStep[]
  });

  // Fetch violations
  const fetchViolations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.status) params.append('status', filters.status);
      if (filters.violationType) params.append('violationType', filters.violationType);
      if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
      if (filters.impactLevel) params.append('impactLevel', filters.impactLevel);
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

  // Assign violation
  const assignViolation = async () => {
    if (!selectedViolation) return;

    try {
      const response = await fetch(`/api/admin/compliance/violations/${selectedViolation.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'investigating',
          assignedTo: assignmentForm.assignedTo,
          resolutionPlan: assignmentForm.resolutionPlan
        })
      });

      if (response.ok) {
        setShowAssignment(false);
        setAssignmentForm({
          assignedTo: '',
          dueDate: '',
          resolutionPlan: '',
          priority: 'medium'
        });
        fetchViolations();
      }
    } catch (error) {
      console.error('Failed to assign violation:', error);
    }
  };

  // Resolve violation
  const resolveViolation = async () => {
    if (!selectedViolation) return;

    try {
      const response = await fetch(`/api/admin/compliance/violations/${selectedViolation.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: resolutionForm.status,
          resolutionSummary: resolutionForm.resolutionSummary
        })
      });

      if (response.ok) {
        setShowResolution(false);
        setResolutionForm({
          status: 'resolved',
          resolutionSummary: '',
          remediationSteps: []
        });
        fetchViolations();
      }
    } catch (error) {
      console.error('Failed to resolve violation:', error);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, [filters, pagination.page]);

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
      case 'false_positive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'investigating': return <Eye className="h-4 w-4 text-blue-600" />;
      case 'remediation': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'open': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'false_positive': return <XCircle className="h-4 w-4 text-gray-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return <div className="text-center py-8">Loading compliance violations...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Compliance Violations</h1>
          <p className="text-gray-600 mt-1">Monitor and manage compliance violations and remediation</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Severity</label>
              <Select value={filters.severity || ''} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, severity: value || undefined }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filters.status || ''} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, status: value || undefined }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="remediation">Remediation</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="false_positive">False Positive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Violation Type</label>
              <Select value={filters.violationType || ''} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, violationType: value || undefined }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="policy_breach">Policy Breach</SelectItem>
                  <SelectItem value="data_leak">Data Leak</SelectItem>
                  <SelectItem value="unauthorized_access">Unauthorized Access</SelectItem>
                  <SelectItem value="retention_violation">Retention Violation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Impact Level</label>
              <Select value={filters.impactLevel || ''} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, impactLevel: value || undefined }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All impacts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All impacts</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Assigned To</label>
              <Input
                value={filters.assignedTo || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, assignedTo: e.target.value || undefined }))}
                placeholder="Filter by assignee"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Violations List */}
      <Card>
        <CardHeader>
          <CardTitle>Violations ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {violations.map((violation) => (
              <div key={violation.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(violation.status)}
                      <h3 className="font-medium">{violation.title}</h3>
                      <Badge className={getSeverityColor(violation.severity)}>
                        {violation.severity}
                      </Badge>
                      <Badge className={getStatusColor(violation.status)}>
                        {violation.status}
                      </Badge>
                      <Badge className={getImpactColor(violation.impactLevel)}>
                        Impact: {violation.impactLevel}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{violation.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-2">
                      <div>
                        <span className="font-medium">Type:</span> {violation.violationType}
                      </div>
                      <div>
                        <span className="font-medium">Detected:</span> {format(new Date(violation.detectedAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                      <div>
                        <span className="font-medium">Records Affected:</span> {violation.affectedRecords.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Financial Impact:</span> {formatCurrency(violation.financialImpact)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
                      <div>
                        <span className="font-medium">Detected By:</span> {violation.detectedBy}
                      </div>
                      {violation.detectionMethod && (
                        <div>
                          <span className="font-medium">Method:</span> {violation.detectionMethod}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Confidence:</span> {violation.detectionConfidence.toFixed(1)}%
                      </div>
                      {violation.assignedTo && (
                        <div>
                          <span className="font-medium">Assigned To:</span> {violation.assignedTo}
                        </div>
                      )}
                    </div>

                    {violation.entityName && (
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">Entity:</span> {violation.entityName} ({violation.entityType})
                      </div>
                    )}

                    {violation.regulatoryImpact && (
                      <div className="mt-2 p-2 bg-orange-50 rounded text-sm">
                        <strong>Regulatory Impact:</strong> {violation.regulatoryImpact}
                      </div>
                    )}

                    {violation.resolutionSummary && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                        <strong>Resolution:</strong> {violation.resolutionSummary}
                      </div>
                    )}

                    {violation.escalationLevel > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="destructive">
                          Escalated (Level {violation.escalationLevel})
                        </Badge>
                        {violation.escalatedAt && (
                          <span className="text-xs text-gray-500">
                            on {format(new Date(violation.escalatedAt), 'MMM dd, yyyy')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedViolation(violation);
                        setShowDetails(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {violation.status === 'open' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedViolation(violation);
                          setShowAssignment(true);
                        }}
                      >
                        <User className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                    )}
                    
                    {(violation.status === 'investigating' || violation.status === 'remediation') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedViolation(violation);
                          setShowResolution(true);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
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
        </CardContent>
      </Card>

      {/* Violation Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Violation Details</DialogTitle>
          </DialogHeader>
          {selectedViolation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Title</label>
                  <p className="font-medium">{selectedViolation.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedViolation.status)}
                    <Badge className={getStatusColor(selectedViolation.status)}>
                      {selectedViolation.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="mt-1">{selectedViolation.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Severity</label>
                  <Badge className={getSeverityColor(selectedViolation.severity)}>
                    {selectedViolation.severity}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Impact Level</label>
                  <Badge className={getImpactColor(selectedViolation.impactLevel)}>
                    {selectedViolation.impactLevel}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Violation Type</label>
                  <p>{selectedViolation.violationType}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Affected Records</label>
                  <p>{selectedViolation.affectedRecords.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Financial Impact</label>
                  <p>{formatCurrency(selectedViolation.financialImpact)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Detected By</label>
                  <p>{selectedViolation.detectedBy}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Detection Confidence</label>
                  <p>{selectedViolation.detectionConfidence.toFixed(1)}%</p>
                </div>
              </div>

              {selectedViolation.resolutionPlan && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Resolution Plan</label>
                  <p className="mt-1">{selectedViolation.resolutionPlan}</p>
                </div>
              )}

              {selectedViolation.remediationSteps.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Remediation Steps</label>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    {selectedViolation.remediationSteps.map((step, index) => (
                      <li key={index} className="text-sm">{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedViolation.resolutionSummary && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Resolution Summary</label>
                  <p className="mt-1">{selectedViolation.resolutionSummary}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={showAssignment} onOpenChange={setShowAssignment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Violation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Assign To</label>
              <Input
                value={assignmentForm.assignedTo}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                placeholder="Enter assignee name or ID"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Due Date</label>
              <Input
                type="date"
                value={assignmentForm.dueDate}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Resolution Plan</label>
              <Textarea
                value={assignmentForm.resolutionPlan}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, resolutionPlan: e.target.value }))}
                placeholder="Describe the plan to resolve this violation"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAssignment(false)}>
                Cancel
              </Button>
              <Button onClick={assignViolation} disabled={!assignmentForm.assignedTo}>
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resolution Dialog */}
      <Dialog open={showResolution} onOpenChange={setShowResolution}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Violation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Resolution Status</label>
              <Select value={resolutionForm.status} onValueChange={(value) => 
                setResolutionForm(prev => ({ ...prev, status: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="false_positive">False Positive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Resolution Summary</label>
              <Textarea
                value={resolutionForm.resolutionSummary}
                onChange={(e) => setResolutionForm(prev => ({ ...prev, resolutionSummary: e.target.value }))}
                placeholder="Describe how this violation was resolved"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowResolution(false)}>
                Cancel
              </Button>
              <Button onClick={resolveViolation} disabled={!resolutionForm.resolutionSummary}>
                Resolve
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}