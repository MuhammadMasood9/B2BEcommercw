import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Filter, 
  Eye, 
  Send, 
  Clock, 
  DollarSign, 
  Package, 
  MapPin, 
  Calendar,
  Building2,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  BarChart3
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface RFQ {
  id: string;
  buyerId: string;
  title: string;
  description: string;
  categoryId: string;
  specifications: any;
  quantity: number;
  targetPrice: string;
  budgetRange: { min: number; max: number };
  deliveryLocation: string;
  requiredDeliveryDate: string;
  paymentTerms: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  buyerCompanyName: string;
  buyerIndustry: string;
  buyerBusinessType: string;
  categoryName: string;
  hasQuotation: boolean;
  quotationStatus: string | null;
  quotationId: string | null;
  quotationDate: string | null;
}

interface Quotation {
  id: string;
  rfqId: string;
  inquiryId: string;
  unitPrice: string;
  totalPrice: string;
  moq: number;
  leadTime: string;
  paymentTerms: string;
  validityPeriod: number;
  termsConditions: string;
  attachments: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  rfqTitle: string;
  rfqQuantity: number;
  rfqTargetPrice: string;
  rfqStatus: string;
  buyerCompanyName: string;
  buyerIndustry: string;
}

interface QuotationFormData {
  unitPrice: string;
  totalPrice: string;
  moq: number;
  leadTime: string;
  paymentTerms: string;
  validityPeriod: number;
  termsConditions: string;
}

const SupplierRFQManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('available');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
  const [showQuotationDialog, setShowQuotationDialog] = useState(false);
  const [quotationForm, setQuotationForm] = useState<QuotationFormData>({
    unitPrice: '',
    totalPrice: '',
    moq: 1,
    leadTime: '',
    paymentTerms: '',
    validityPeriod: 30,
    termsConditions: ''
  });

  const queryClient = useQueryClient();

  // Fetch available RFQs
  const { data: rfqsData, isLoading: rfqsLoading } = useQuery({
    queryKey: ['supplier-rfqs', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '50');

      const response = await fetch(`/api/suppliers/rfqs?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch RFQs');
      return response.json();
    }
  });

  // Fetch supplier quotations
  const { data: quotationsData, isLoading: quotationsLoading } = useQuery({
    queryKey: ['supplier-quotations'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/quotations?type=rfq&limit=50', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch quotations');
      return response.json();
    }
  });

  // Fetch RFQ analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['supplier-rfq-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/rfqs/analytics', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  });

  // Create quotation mutation
  const createQuotationMutation = useMutation({
    mutationFn: async ({ rfqId, quotationData }: { rfqId: string; quotationData: QuotationFormData }) => {
      const response = await fetch(`/api/suppliers/rfqs/${rfqId}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(quotationData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create quotation');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quotation submitted successfully"
      });
      setShowQuotationDialog(false);
      setQuotationForm({
        unitPrice: '',
        totalPrice: '',
        moq: 1,
        leadTime: '',
        paymentTerms: '',
        validityPeriod: 30,
        termsConditions: ''
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-quotations'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-rfq-analytics'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Calculate total price when unit price or MOQ changes
  useEffect(() => {
    if (quotationForm.unitPrice && quotationForm.moq && selectedRFQ) {
      const unitPrice = parseFloat(quotationForm.unitPrice);
      const quantity = Math.max(quotationForm.moq, selectedRFQ.quantity);
      const total = (unitPrice * quantity).toFixed(2);
      setQuotationForm(prev => ({ ...prev, totalPrice: total }));
    }
  }, [quotationForm.unitPrice, quotationForm.moq, selectedRFQ]);

  const handleSubmitQuotation = () => {
    if (!selectedRFQ) return;

    // Validate form
    if (!quotationForm.unitPrice || !quotationForm.leadTime || !quotationForm.paymentTerms) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    createQuotationMutation.mutate({
      rfqId: selectedRFQ.id,
      quotationData: quotationForm
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { color: 'bg-green-100 text-green-800', label: 'Open' },
      closed: { color: 'bg-gray-100 text-gray-800', label: 'Closed' },
      expired: { color: 'bg-red-100 text-red-800', label: 'Expired' },
      sent: { color: 'bg-blue-100 text-blue-800', label: 'Sent' },
      accepted: { color: 'bg-green-100 text-green-800', label: 'Accepted' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isRFQExpired = (expiresAt: string) => {
    return expiresAt && new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">RFQ Management</h1>
          <p className="text-gray-600">Manage and respond to buyer requests for quotations</p>
        </div>
      </div>

      {/* Analytics Cards */}
      {analyticsData?.success && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Quotations</p>
                  <p className="text-2xl font-bold">{analyticsData.analytics.totalQuotations}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Win Rate</p>
                  <p className="text-2xl font-bold">{analyticsData.analytics.winRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Response Rate</p>
                  <p className="text-2xl font-bold">{analyticsData.analytics.responseRate}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available RFQs</p>
                  <p className="text-2xl font-bold">{analyticsData.analytics.totalRfqsAvailable}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search RFQs by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">Available RFQs</TabsTrigger>
          <TabsTrigger value="quotations">My Quotations</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {rfqsLoading ? (
            <div className="text-center py-8">Loading RFQs...</div>
          ) : rfqsData?.success && rfqsData.rfqs?.length > 0 ? (
            <div className="grid gap-4">
              {rfqsData.rfqs.map((rfq: RFQ) => (
                <Card key={rfq.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{rfq.title}</h3>
                          {getStatusBadge(rfq.status)}
                          {rfq.hasQuotation && (
                            <Badge className="bg-blue-100 text-blue-800">
                              Quoted ({rfq.quotationStatus})
                            </Badge>
                          )}
                          {isRFQExpired(rfq.expiresAt) && (
                            <Badge className="bg-red-100 text-red-800">Expired</Badge>
                          )}
                        </div>
                        <p className="text-gray-600 mb-3">{rfq.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span>{rfq.buyerCompanyName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span>{rfq.quantity.toLocaleString()} units</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span>Target: {formatCurrency(rfq.targetPrice)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{rfq.deliveryLocation}</span>
                          </div>
                        </div>

                        {rfq.requiredDeliveryDate && (
                          <div className="flex items-center gap-2 mt-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>Required by: {formatDate(rfq.requiredDeliveryDate)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{rfq.title}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">Description</h4>
                                <p className="text-gray-600">{rfq.description}</p>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Buyer Information</h4>
                                  <div className="space-y-1 text-sm">
                                    <p><strong>Company:</strong> {rfq.buyerCompanyName}</p>
                                    <p><strong>Industry:</strong> {rfq.buyerIndustry}</p>
                                    <p><strong>Business Type:</strong> {rfq.buyerBusinessType}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-semibold mb-2">Requirements</h4>
                                  <div className="space-y-1 text-sm">
                                    <p><strong>Quantity:</strong> {rfq.quantity.toLocaleString()} units</p>
                                    <p><strong>Target Price:</strong> {formatCurrency(rfq.targetPrice)}</p>
                                    <p><strong>Delivery Location:</strong> {rfq.deliveryLocation}</p>
                                    {rfq.requiredDeliveryDate && (
                                      <p><strong>Required Date:</strong> {formatDate(rfq.requiredDeliveryDate)}</p>
                                    )}
                                    <p><strong>Payment Terms:</strong> {rfq.paymentTerms}</p>
                                  </div>
                                </div>
                              </div>

                              {rfq.specifications && (
                                <div>
                                  <h4 className="font-semibold mb-2">Specifications</h4>
                                  <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                                    {JSON.stringify(rfq.specifications, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {rfq.budgetRange && (
                                <div>
                                  <h4 className="font-semibold mb-2">Budget Range</h4>
                                  <p className="text-sm">
                                    {formatCurrency(rfq.budgetRange.min)} - {formatCurrency(rfq.budgetRange.max)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        {!rfq.hasQuotation && rfq.status === 'open' && !isRFQExpired(rfq.expiresAt) && (
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedRFQ(rfq);
                              setShowQuotationDialog(true);
                            }}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Submit Quote
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No RFQs Available</h3>
                <p className="text-gray-600">There are currently no RFQs matching your criteria.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="quotations" className="space-y-4">
          {quotationsLoading ? (
            <div className="text-center py-8">Loading quotations...</div>
          ) : quotationsData?.success && quotationsData.quotations?.length > 0 ? (
            <div className="grid gap-4">
              {quotationsData.quotations.map((quotation: Quotation) => (
                <Card key={quotation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{quotation.rfqTitle}</h3>
                          {getStatusBadge(quotation.status)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span>{quotation.buyerCompanyName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span>Unit: {formatCurrency(quotation.unitPrice)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span>MOQ: {quotation.moq.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>Lead Time: {quotation.leadTime}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            Total Value: <span className="font-semibold">{formatCurrency(quotation.totalPrice)}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Submitted: {formatDate(quotation.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Quotations Yet</h3>
                <p className="text-gray-600">You haven't submitted any quotations for RFQs yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Quotation Dialog */}
      <Dialog open={showQuotationDialog} onOpenChange={setShowQuotationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Quotation</DialogTitle>
          </DialogHeader>
          
          {selectedRFQ && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-semibold mb-2">{selectedRFQ.title}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Quantity:</strong> {selectedRFQ.quantity.toLocaleString()} units
                  </div>
                  <div>
                    <strong>Target Price:</strong> {formatCurrency(selectedRFQ.targetPrice)}
                  </div>
                  <div>
                    <strong>Delivery:</strong> {selectedRFQ.deliveryLocation}
                  </div>
                  <div>
                    <strong>Payment Terms:</strong> {selectedRFQ.paymentTerms}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unitPrice">Unit Price (USD) *</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    value={quotationForm.unitPrice}
                    onChange={(e) => setQuotationForm(prev => ({ ...prev, unitPrice: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="totalPrice">Total Price (USD)</Label>
                  <Input
                    id="totalPrice"
                    type="number"
                    step="0.01"
                    value={quotationForm.totalPrice}
                    onChange={(e) => setQuotationForm(prev => ({ ...prev, totalPrice: e.target.value }))}
                    placeholder="Calculated automatically"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="moq">Minimum Order Quantity *</Label>
                  <Input
                    id="moq"
                    type="number"
                    value={quotationForm.moq}
                    onChange={(e) => setQuotationForm(prev => ({ ...prev, moq: parseInt(e.target.value) || 1 }))}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="leadTime">Lead Time *</Label>
                  <Input
                    id="leadTime"
                    value={quotationForm.leadTime}
                    onChange={(e) => setQuotationForm(prev => ({ ...prev, leadTime: e.target.value }))}
                    placeholder="e.g., 15-30 days"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms *</Label>
                  <Input
                    id="paymentTerms"
                    value={quotationForm.paymentTerms}
                    onChange={(e) => setQuotationForm(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    placeholder="e.g., T/T, L/C"
                  />
                </div>
                <div>
                  <Label htmlFor="validityPeriod">Validity Period (days)</Label>
                  <Input
                    id="validityPeriod"
                    type="number"
                    value={quotationForm.validityPeriod}
                    onChange={(e) => setQuotationForm(prev => ({ ...prev, validityPeriod: parseInt(e.target.value) || 30 }))}
                    min="1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="termsConditions">Terms & Conditions</Label>
                <Textarea
                  id="termsConditions"
                  value={quotationForm.termsConditions}
                  onChange={(e) => setQuotationForm(prev => ({ ...prev, termsConditions: e.target.value }))}
                  placeholder="Additional terms and conditions..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowQuotationDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitQuotation}
                  disabled={createQuotationMutation.isPending}
                >
                  {createQuotationMutation.isPending ? 'Submitting...' : 'Submit Quotation'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupplierRFQManager;