import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  AlertTriangle, 
  FileText, 
  Building,
  MapPin,
  Calendar,
  Filter,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface PendingSupplier {
  id: string;
  businessName: string;
  businessType: string;
  storeName: string;
  contactPerson: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  membershipTier: string;
  verificationLevel: string;
  verificationDocs: any;
  status: string;
  createdAt: string;
}

interface ApprovalQueueProps {
  onSupplierApproved?: (supplierId: string) => void;
  onSupplierRejected?: (supplierId: string) => void;
  onSupplierView?: (supplierId: string) => void;
}

interface ApprovalDialogData {
  supplierId: string;
  businessName: string;
  action: 'approve' | 'reject';
}

interface RiskAssessmentData {
  businessVerification: string;
  documentQuality: string;
  businessHistory: string;
  financialStability: string;
  complianceRisk: string;
  overallRisk: string;
  riskFactors: string[];
  mitigationMeasures: string[];
}

export function ApprovalQueue({ 
  onSupplierApproved, 
  onSupplierRejected, 
  onSupplierView 
}: ApprovalQueueProps) {
  const [suppliers, setSuppliers] = useState<PendingSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [approvalDialog, setApprovalDialog] = useState<ApprovalDialogData | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessmentData>({
    businessVerification: 'unverified',
    documentQuality: 'fair',
    businessHistory: 'new',
    financialStability: 'unknown',
    complianceRisk: 'medium',
    overallRisk: 'medium',
    riskFactors: [],
    mitigationMeasures: [],
  });
  const [membershipTier, setMembershipTier] = useState('free');
  const [verificationLevel, setVerificationLevel] = useState('basic');
  const [customCommissionRate, setCustomCommissionRate] = useState<number | undefined>();
  const [conditions, setConditions] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingSuppliers();
  }, [searchTerm, businessTypeFilter, countryFilter]);

  const fetchPendingSuppliers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '50',
        offset: '0',
      });

      if (searchTerm) params.append('search', searchTerm);
      if (businessTypeFilter !== 'all') params.append('businessType', businessTypeFilter);
      if (countryFilter !== 'all') params.append('country', countryFilter);

      const response = await fetch(`/api/admin/suppliers/pending?${params}`);
      const data = await response.json();

      if (data.success) {
        setSuppliers(data.suppliers);
      }
    } catch (error) {
      console.error('Error fetching pending suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierSelect = (supplierId: string, checked: boolean) => {
    if (checked) {
      setSelectedSuppliers([...selectedSuppliers, supplierId]);
    } else {
      setSelectedSuppliers(selectedSuppliers.filter(id => id !== supplierId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSuppliers(suppliers.map(s => s.id));
    } else {
      setSelectedSuppliers([]);
    }
  };

  const openApprovalDialog = (supplierId: string, businessName: string, action: 'approve' | 'reject') => {
    setApprovalDialog({ supplierId, businessName, action });
    setApprovalNotes('');
    setRejectionReason('');
    setConditions([]);
    setCustomCommissionRate(undefined);
  };

  const closeApprovalDialog = () => {
    setApprovalDialog(null);
    setProcessing(false);
  };

  const handleApproval = async () => {
    if (!approvalDialog) return;

    try {
      setProcessing(true);
      
      if (approvalDialog.action === 'approve') {
        const response = await fetch('/api/admin/suppliers/enhanced-approval', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            supplierId: approvalDialog.supplierId,
            approvalNotes,
            riskAssessment,
            membershipTier,
            customCommissionRate,
            verificationLevel,
            conditions,
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          onSupplierApproved?.(approvalDialog.supplierId);
          await fetchPendingSuppliers();
        } else {
          console.error('Approval failed:', data.error);
        }
      } else {
        const response = await fetch(`/api/admin/suppliers/${approvalDialog.supplierId}/reject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rejectionReason,
            rejectionNotes: approvalNotes,
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          onSupplierRejected?.(approvalDialog.supplierId);
          await fetchPendingSuppliers();
        } else {
          console.error('Rejection failed:', data.error);
        }
      }
      
      closeApprovalDialog();
    } catch (error) {
      console.error('Error processing approval:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkApproval = async () => {
    if (selectedSuppliers.length === 0) return;

    try {
      setProcessing(true);
      
      // Process each selected supplier
      for (const supplierId of selectedSuppliers) {
        await fetch('/api/admin/suppliers/enhanced-approval', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            supplierId,
            approvalNotes: 'Bulk approval',
            riskAssessment: {
              ...riskAssessment,
              overallRisk: 'low',
            },
            membershipTier: 'free',
            verificationLevel: 'basic',
          }),
        });
      }
      
      setSelectedSuppliers([]);
      await fetchPendingSuppliers();
    } catch (error) {
      console.error('Error in bulk approval:', error);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getBusinessTypeBadge = (type: string) => {
    const colors = {
      manufacturer: 'bg-blue-500',
      trading_company: 'bg-green-500',
      wholesaler: 'bg-purple-500',
    };
    
    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-500'}>
        {type.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getDocumentStatus = (docs: any) => {
    if (!docs) return { count: 0, status: 'none' };
    
    const docCount = Object.keys(docs).length;
    if (docCount === 0) return { count: 0, status: 'none' };
    if (docCount < 3) return { count: docCount, status: 'partial' };
    return { count: docCount, status: 'complete' };
  };

  const addCondition = (condition: string) => {
    if (condition && !conditions.includes(condition)) {
      setConditions([...conditions, condition]);
    }
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const addRiskFactor = (factor: string) => {
    if (factor && !riskAssessment.riskFactors.includes(factor)) {
      setRiskAssessment({
        ...riskAssessment,
        riskFactors: [...riskAssessment.riskFactors, factor],
      });
    }
  };

  const removeRiskFactor = (index: number) => {
    setRiskAssessment({
      ...riskAssessment,
      riskFactors: riskAssessment.riskFactors.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Approval Queue ({suppliers.length})</span>
            </div>
            <div className="flex items-center space-x-2">
              {selectedSuppliers.length > 0 && (
                <Button 
                  onClick={handleBulkApproval}
                  disabled={processing}
                >
                  Bulk Approve ({selectedSuppliers.length})
                </Button>
              )}
              <Button variant="outline" size="sm">
                Export Queue
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search pending suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex space-x-2">
              <Select value={businessTypeFilter} onValueChange={setBusinessTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Business Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="manufacturer">Manufacturer</SelectItem>
                  <SelectItem value="trading_company">Trading Company</SelectItem>
                  <SelectItem value="wholesaler">Wholesaler</SelectItem>
                </SelectContent>
              </Select>

              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="China">China</SelectItem>
                  <SelectItem value="India">India</SelectItem>
                  <SelectItem value="United States">United States</SelectItem>
                  <SelectItem value="Germany">Germany</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading pending suppliers...</p>
            </CardContent>
          </Card>
        ) : suppliers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Pending Approvals</h3>
              <p className="text-muted-foreground">All supplier applications have been processed.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Select All */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedSuppliers.length === suppliers.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label>Select All ({suppliers.length} suppliers)</Label>
                </div>
              </CardContent>
            </Card>

            {/* Supplier Cards */}
            {suppliers.map((supplier) => {
              const docStatus = getDocumentStatus(supplier.verificationDocs);
              
              return (
                <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <Checkbox
                          checked={selectedSuppliers.includes(supplier.id)}
                          onCheckedChange={(checked) => 
                            handleSupplierSelect(supplier.id, checked as boolean)
                          }
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold">{supplier.businessName}</h3>
                              <p className="text-muted-foreground">{supplier.storeName}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getBusinessTypeBadge(supplier.businessType)}
                              <Badge variant="outline">
                                {supplier.membershipTier.toUpperCase()}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center space-x-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{supplier.contactPerson}</p>
                                <p className="text-xs text-muted-foreground">{supplier.email}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm">{supplier.city}, {supplier.country}</p>
                                <p className="text-xs text-muted-foreground">{supplier.phone}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm">Applied</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(supplier.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  Documents: {docStatus.count}
                                </span>
                                <Badge 
                                  variant={docStatus.status === 'complete' ? 'default' : 'outline'}
                                  className={
                                    docStatus.status === 'complete' ? 'bg-green-500' :
                                    docStatus.status === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                                  }
                                >
                                  {docStatus.status}
                                </Badge>
                              </div>
                              
                              {docStatus.status === 'none' && (
                                <div className="flex items-center space-x-1 text-red-600">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span className="text-sm">Missing documents</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onSupplierView?.(supplier.id)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openApprovalDialog(supplier.id, supplier.businessName, 'reject')}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                              
                              <Button
                                size="sm"
                                onClick={() => openApprovalDialog(supplier.id, supplier.businessName, 'approve')}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </div>

      {/* Approval/Rejection Dialog */}
      <Dialog open={!!approvalDialog} onOpenChange={closeApprovalDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {approvalDialog?.action === 'approve' ? 'Approve Supplier' : 'Reject Supplier'}
            </DialogTitle>
            <DialogDescription>
              {approvalDialog?.action === 'approve' 
                ? `Configure approval settings for ${approvalDialog?.businessName}`
                : `Provide rejection reason for ${approvalDialog?.businessName}`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {approvalDialog?.action === 'approve' ? (
              <>
                {/* Risk Assessment */}
                <div>
                  <Label className="text-base font-medium">Risk Assessment</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label>Business Verification</Label>
                      <Select 
                        value={riskAssessment.businessVerification} 
                        onValueChange={(value) => setRiskAssessment({...riskAssessment, businessVerification: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="unverified">Unverified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Document Quality</Label>
                      <Select 
                        value={riskAssessment.documentQuality} 
                        onValueChange={(value) => setRiskAssessment({...riskAssessment, documentQuality: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Overall Risk</Label>
                      <Select 
                        value={riskAssessment.overallRisk} 
                        onValueChange={(value) => setRiskAssessment({...riskAssessment, overallRisk: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Compliance Risk</Label>
                      <Select 
                        value={riskAssessment.complianceRisk} 
                        onValueChange={(value) => setRiskAssessment({...riskAssessment, complianceRisk: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Membership Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Membership Tier</Label>
                    <Select value={membershipTier} onValueChange={setMembershipTier}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="silver">Silver</SelectItem>
                        <SelectItem value="gold">Gold</SelectItem>
                        <SelectItem value="platinum">Platinum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Verification Level</Label>
                    <Select value={verificationLevel} onValueChange={setVerificationLevel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="trade_assurance">Trade Assurance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Custom Commission Rate */}
                <div>
                  <Label>Custom Commission Rate (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={customCommissionRate || ''}
                    onChange={(e) => setCustomCommissionRate(e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Leave empty for default rate"
                  />
                </div>

                {/* Conditions */}
                <div>
                  <Label>Approval Conditions</Label>
                  <div className="space-y-2">
                    {conditions.map((condition, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input value={condition} readOnly />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeCondition(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Add condition..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addCondition((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          addCondition(input.value);
                          input.value = '';
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <Label>Rejection Reason *</Label>
                <Select value={rejectionReason} onValueChange={setRejectionReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rejection reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incomplete_documents">Incomplete Documents</SelectItem>
                    <SelectItem value="invalid_business_license">Invalid Business License</SelectItem>
                    <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                    <SelectItem value="policy_violation">Policy Violation</SelectItem>
                    <SelectItem value="duplicate_application">Duplicate Application</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label>
                {approvalDialog?.action === 'approve' ? 'Approval Notes' : 'Additional Notes'}
              </Label>
              <Textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder={
                  approvalDialog?.action === 'approve' 
                    ? 'Optional notes for the approval...'
                    : 'Additional details about the rejection...'
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeApprovalDialog} disabled={processing}>
              Cancel
            </Button>
            <Button 
              onClick={handleApproval} 
              disabled={processing || (approvalDialog?.action === 'reject' && !rejectionReason)}
            >
              {processing ? 'Processing...' : 
                approvalDialog?.action === 'approve' ? 'Approve Supplier' : 'Reject Supplier'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}