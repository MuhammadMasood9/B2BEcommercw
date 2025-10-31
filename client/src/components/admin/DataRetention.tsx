import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarIcon, Plus, Trash2, Archive, Shield, Clock, Database, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface DataRetentionPolicy {
  id: string;
  name: string;
  description: string;
  dataType: string;
  retentionPeriodDays: number;
  archiveAfterDays?: number;
  deleteAfterDays?: number;
  isActive: boolean;
  priority: number;
  secureDeletionRequired: boolean;
  legalHoldExempt: boolean;
  geographicScope: string[];
  regulatoryBasis: string[];
  createdAt: string;
  updatedAt: string;
}

interface DataRetentionSchedule {
  id: string;
  policyId: string;
  scheduleName: string;
  scheduleType: string;
  targetTable: string;
  estimatedRecords: number;
  estimatedSizeMb: number;
  scheduledDate: string;
  status: string;
  recordsProcessed: number;
  recordsArchived: number;
  recordsDeleted: number;
  createdAt: string;
}

interface LegalHold {
  id: string;
  name: string;
  description: string;
  caseNumber?: string;
  legalMatter: string;
  status: string;
  issuedBy: string;
  issuedDate: string;
  releaseDate?: string;
  expiryDate?: string;
  affectedRecordsCount: number;
  affectedDataSizeMb: number;
  dataTypes: string[];
}

export function DataRetention() {
  const [policies, setPolicies] = useState<DataRetentionPolicy[]>([]);
  const [schedules, setSchedules] = useState<DataRetentionSchedule[]>([]);
  const [legalHolds, setLegalHolds] = useState<LegalHold[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('policies');
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [showCreateHold, setShowCreateHold] = useState(false);

  // Policy creation form state
  const [policyForm, setPolicyForm] = useState({
    name: '',
    description: '',
    dataType: 'audit_logs',
    retentionPeriodDays: 365,
    archiveAfterDays: 90,
    deleteAfterDays: 2555, // 7 years
    isActive: true,
    priority: 100,
    secureDeletionRequired: true,
    legalHoldExempt: false,
    geographicScope: '',
    regulatoryBasis: '',
    conditions: '',
    anonymizationRules: '',
    backupRetentionDays: 30
  });

  // Legal hold creation form state
  const [holdForm, setHoldForm] = useState({
    name: '',
    description: '',
    caseNumber: '',
    legalMatter: '',
    dataTypes: '',
    dateRangeStart: undefined as Date | undefined,
    dateRangeEnd: undefined as Date | undefined,
    custodians: '',
    searchTerms: '',
    expiryDate: undefined as Date | undefined
  });

  // Fetch data retention policies
  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/admin/compliance/data-retention/policies');
      if (response.ok) {
        const data = await response.json();
        setPolicies(data);
      }
    } catch (error) {
      console.error('Failed to fetch policies:', error);
    }
  };

  // Fetch legal holds
  const fetchLegalHolds = async () => {
    try {
      const response = await fetch('/api/admin/compliance/legal-holds');
      if (response.ok) {
        const data = await response.json();
        setLegalHolds(data);
      }
    } catch (error) {
      console.error('Failed to fetch legal holds:', error);
    }
  };

  // Create data retention policy
  const createPolicy = async () => {
    try {
      const response = await fetch('/api/admin/compliance/data-retention/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...policyForm,
          geographicScope: policyForm.geographicScope.split(',').map(s => s.trim()).filter(Boolean),
          regulatoryBasis: policyForm.regulatoryBasis.split(',').map(s => s.trim()).filter(Boolean),
          conditions: policyForm.conditions ? JSON.parse(policyForm.conditions) : {},
          anonymizationRules: policyForm.anonymizationRules ? JSON.parse(policyForm.anonymizationRules) : {}
        })
      });

      if (response.ok) {
        setShowCreatePolicy(false);
        setPolicyForm({
          name: '',
          description: '',
          dataType: 'audit_logs',
          retentionPeriodDays: 365,
          archiveAfterDays: 90,
          deleteAfterDays: 2555,
          isActive: true,
          priority: 100,
          secureDeletionRequired: true,
          legalHoldExempt: false,
          geographicScope: '',
          regulatoryBasis: '',
          conditions: '',
          anonymizationRules: '',
          backupRetentionDays: 30
        });
        fetchPolicies();
      }
    } catch (error) {
      console.error('Failed to create policy:', error);
    }
  };

  // Create legal hold
  const createLegalHold = async () => {
    try {
      const response = await fetch('/api/admin/compliance/legal-holds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...holdForm,
          dataTypes: holdForm.dataTypes.split(',').map(s => s.trim()).filter(Boolean),
          custodians: holdForm.custodians.split(',').map(s => s.trim()).filter(Boolean),
          searchTerms: holdForm.searchTerms.split(',').map(s => s.trim()).filter(Boolean),
          dateRangeStart: holdForm.dateRangeStart?.toISOString(),
          dateRangeEnd: holdForm.dateRangeEnd?.toISOString(),
          expiryDate: holdForm.expiryDate?.toISOString()
        })
      });

      if (response.ok) {
        setShowCreateHold(false);
        setHoldForm({
          name: '',
          description: '',
          caseNumber: '',
          legalMatter: '',
          dataTypes: '',
          dateRangeStart: undefined,
          dateRangeEnd: undefined,
          custodians: '',
          searchTerms: '',
          expiryDate: undefined
        });
        fetchLegalHolds();
      }
    } catch (error) {
      console.error('Failed to create legal hold:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPolicies(), fetchLegalHolds()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'released': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScheduleStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDataSize = (mb: number) => {
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    if (mb < 1024 * 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${(mb / (1024 * 1024)).toFixed(1)} TB`;
  };

  if (loading) {
    return <div className="text-center py-8">Loading data retention management...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Retention Management</h1>
          <p className="text-gray-600 mt-1">Manage data retention policies and legal holds</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreateHold} onOpenChange={setShowCreateHold}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                New Legal Hold
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={showCreatePolicy} onOpenChange={setShowCreatePolicy}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Policy
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('policies')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'policies'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Retention Policies
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'schedules'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Scheduled Operations
          </button>
          <button
            onClick={() => setActiveTab('legal-holds')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'legal-holds'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Legal Holds
          </button>
        </nav>
      </div>

      {/* Retention Policies Tab */}
      {activeTab === 'policies' && (
        <Card>
          <CardHeader>
            <CardTitle>Data Retention Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {policies.map((policy) => (
                <div key={policy.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{policy.name}</h3>
                        <Badge className={policy.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {policy.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">{policy.dataType}</Badge>
                        <Badge variant="outline">Priority: {policy.priority}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{policy.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
                        <div>
                          <span className="font-medium">Retention:</span> {policy.retentionPeriodDays} days
                        </div>
                        {policy.archiveAfterDays && (
                          <div>
                            <span className="font-medium">Archive:</span> {policy.archiveAfterDays} days
                          </div>
                        )}
                        {policy.deleteAfterDays && (
                          <div>
                            <span className="font-medium">Delete:</span> {policy.deleteAfterDays} days
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Secure Deletion:</span> {policy.secureDeletionRequired ? 'Yes' : 'No'}
                        </div>
                      </div>
                      {policy.geographicScope.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs font-medium text-gray-500">Geographic Scope: </span>
                          <span className="text-xs text-gray-600">{policy.geographicScope.join(', ')}</span>
                        </div>
                      )}
                      {policy.regulatoryBasis.length > 0 && (
                        <div className="mt-1">
                          <span className="text-xs font-medium text-gray-500">Regulatory Basis: </span>
                          <span className="text-xs text-gray-600">{policy.regulatoryBasis.join(', ')}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Operations Tab */}
      {activeTab === 'schedules' && (
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Retention Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schedules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No scheduled operations found
                </div>
              ) : (
                schedules.map((schedule) => (
                  <div key={schedule.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{schedule.scheduleName}</h3>
                          <Badge className={getScheduleStatusColor(schedule.status)}>
                            {schedule.status}
                          </Badge>
                          <Badge variant="outline">{schedule.scheduleType}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-2">
                          <div>
                            <span className="font-medium">Table:</span> {schedule.targetTable}
                          </div>
                          <div>
                            <span className="font-medium">Estimated Records:</span> {schedule.estimatedRecords.toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Estimated Size:</span> {formatDataSize(schedule.estimatedSizeMb)}
                          </div>
                          <div>
                            <span className="font-medium">Scheduled:</span> {format(new Date(schedule.scheduledDate), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </div>
                        {schedule.status === 'completed' && (
                          <div className="grid grid-cols-3 gap-4 text-xs text-green-600">
                            <div>Processed: {schedule.recordsProcessed.toLocaleString()}</div>
                            <div>Archived: {schedule.recordsArchived.toLocaleString()}</div>
                            <div>Deleted: {schedule.recordsDeleted.toLocaleString()}</div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {schedule.status === 'scheduled' && (
                          <Button variant="outline" size="sm">
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legal Holds Tab */}
      {activeTab === 'legal-holds' && (
        <Card>
          <CardHeader>
            <CardTitle>Legal Holds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {legalHolds.map((hold) => (
                <div key={hold.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{hold.name}</h3>
                        <Badge className={getStatusColor(hold.status)}>
                          {hold.status}
                        </Badge>
                        {hold.caseNumber && (
                          <Badge variant="outline">Case: {hold.caseNumber}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{hold.description}</p>
                      <div className="text-sm text-gray-700 mb-2">
                        <strong>Legal Matter:</strong> {hold.legalMatter}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
                        <div>
                          <span className="font-medium">Issued:</span> {format(new Date(hold.issuedDate), 'MMM dd, yyyy')}
                        </div>
                        <div>
                          <span className="font-medium">Issued By:</span> {hold.issuedBy}
                        </div>
                        <div>
                          <span className="font-medium">Records:</span> {hold.affectedRecordsCount.toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Data Size:</span> {formatDataSize(hold.affectedDataSizeMb)}
                        </div>
                      </div>
                      {hold.expiryDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">Expires:</span> {format(new Date(hold.expiryDate), 'MMM dd, yyyy')}
                        </div>
                      )}
                      <div className="flex gap-1 mt-2">
                        {hold.dataTypes.map((type, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {hold.status === 'active' && (
                        <Button variant="outline" size="sm">
                          Release
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Policy Dialog */}
      <Dialog open={showCreatePolicy} onOpenChange={setShowCreatePolicy}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Data Retention Policy</DialogTitle>
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
                <label className="text-sm font-medium mb-2 block">Data Type</label>
                <Select value={policyForm.dataType} onValueChange={(value) => 
                  setPolicyForm(prev => ({ ...prev, dataType: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="audit_logs">Audit Logs</SelectItem>
                    <SelectItem value="user_data">User Data</SelectItem>
                    <SelectItem value="financial_records">Financial Records</SelectItem>
                    <SelectItem value="communication_logs">Communication Logs</SelectItem>
                    <SelectItem value="system_logs">System Logs</SelectItem>
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

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Retention Period (Days)</label>
                <Input
                  type="number"
                  value={policyForm.retentionPeriodDays}
                  onChange={(e) => setPolicyForm(prev => ({ ...prev, retentionPeriodDays: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Archive After (Days)</label>
                <Input
                  type="number"
                  value={policyForm.archiveAfterDays}
                  onChange={(e) => setPolicyForm(prev => ({ ...prev, archiveAfterDays: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Delete After (Days)</label>
                <Input
                  type="number"
                  value={policyForm.deleteAfterDays}
                  onChange={(e) => setPolicyForm(prev => ({ ...prev, deleteAfterDays: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Input
                  type="number"
                  value={policyForm.priority}
                  onChange={(e) => setPolicyForm(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Backup Retention (Days)</label>
                <Input
                  type="number"
                  value={policyForm.backupRetentionDays}
                  onChange={(e) => setPolicyForm(prev => ({ ...prev, backupRetentionDays: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Geographic Scope (comma-separated)</label>
                <Input
                  value={policyForm.geographicScope}
                  onChange={(e) => setPolicyForm(prev => ({ ...prev, geographicScope: e.target.value }))}
                  placeholder="US, EU, Global"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Regulatory Basis (comma-separated)</label>
                <Input
                  value={policyForm.regulatoryBasis}
                  onChange={(e) => setPolicyForm(prev => ({ ...prev, regulatoryBasis: e.target.value }))}
                  placeholder="GDPR, SOX, PCI-DSS"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={policyForm.isActive}
                  onCheckedChange={(checked) => setPolicyForm(prev => ({ ...prev, isActive: checked }))}
                />
                <label className="text-sm font-medium">Active</label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={policyForm.secureDeletionRequired}
                  onCheckedChange={(checked) => setPolicyForm(prev => ({ ...prev, secureDeletionRequired: checked }))}
                />
                <label className="text-sm font-medium">Secure Deletion Required</label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={policyForm.legalHoldExempt}
                  onCheckedChange={(checked) => setPolicyForm(prev => ({ ...prev, legalHoldExempt: checked }))}
                />
                <label className="text-sm font-medium">Legal Hold Exempt</label>
              </div>
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

      {/* Create Legal Hold Dialog */}
      <Dialog open={showCreateHold} onOpenChange={setShowCreateHold}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Legal Hold</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Hold Name</label>
                <Input
                  value={holdForm.name}
                  onChange={(e) => setHoldForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter hold name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Case Number</label>
                <Input
                  value={holdForm.caseNumber}
                  onChange={(e) => setHoldForm(prev => ({ ...prev, caseNumber: e.target.value }))}
                  placeholder="Optional case number"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={holdForm.description}
                onChange={(e) => setHoldForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Hold description"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Legal Matter</label>
              <Input
                value={holdForm.legalMatter}
                onChange={(e) => setHoldForm(prev => ({ ...prev, legalMatter: e.target.value }))}
                placeholder="Description of legal matter"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Data Types (comma-separated)</label>
              <Input
                value={holdForm.dataTypes}
                onChange={(e) => setHoldForm(prev => ({ ...prev, dataTypes: e.target.value }))}
                placeholder="audit_logs, user_data, financial_records"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Custodians (comma-separated)</label>
                <Input
                  value={holdForm.custodians}
                  onChange={(e) => setHoldForm(prev => ({ ...prev, custodians: e.target.value }))}
                  placeholder="John Doe, Jane Smith"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Search Terms (comma-separated)</label>
                <Input
                  value={holdForm.searchTerms}
                  onChange={(e) => setHoldForm(prev => ({ ...prev, searchTerms: e.target.value }))}
                  placeholder="contract, agreement, payment"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Expiry Date (Optional)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {holdForm.expiryDate ? format(holdForm.expiryDate, 'MMM dd, yyyy') : 'Select expiry date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={holdForm.expiryDate}
                    onSelect={(date) => setHoldForm(prev => ({ ...prev, expiryDate: date }))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateHold(false)}>
                Cancel
              </Button>
              <Button onClick={createLegalHold} disabled={!holdForm.name || !holdForm.description || !holdForm.legalMatter}>
                Create Legal Hold
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}