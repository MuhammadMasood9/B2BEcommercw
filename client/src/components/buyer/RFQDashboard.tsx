import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Filter, 
  Plus,
  Eye, 
  Edit,
  Trash2,
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
  BarChart3,
  MessageSquare,
  Users,
  Star,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import RFQCreationForm from './RFQCreationForm';

interface RFQ {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
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
  quotationCount: number;
  viewCount: number;
  lastQuotationDate: string | null;
}

interface Quotation {
  id: string;
  rfqId: string;
  supplierId: string;
  supplierName: string;
  supplierCompany: string;
  supplierRating: number;
  supplierVerified: boolean;
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
}

interface RFQAnalytics {
  totalRfqs: number;
  activeRfqs: number;
  totalQuotations: number;
  avgQuotationsPerRfq: number;
  avgResponseTime: number;
  topCategories: Array<{ category: string; count: number }>;
}

const RFQDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQuotationsDialog, setShowQuotationsDialog] = useState(false);
  const [selectedQuotations, setSelectedQuotations] = useState<Quotation[]>([]);

  const queryClient = useQueryClient();

  // Fetch buyer RFQs
  const { data: rfqsData, isLoading: rfqsLoading } = useQuery({
    queryKey: ['buyer-rfqs', searchTerm, statusFilter, activeTab],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (activeTab !== 'all') params.append('filter', activeTab);
      params.append('limit', '50');

      const response = await fetch(`/api/buyer/rfqs?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch RFQs');
      return response.json();
    }
  });

  // Fetch RFQ analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['buyer-rfq-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/buyer/rfqs/analytics', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  });

  // Fetch quotations for selected RFQ
  const fetchQuotations = async (rfqId: string) => {
    const response = await fetch(`/api/buyer/rfqs/${rfqId}/quotations`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch quotations');
    return response.json();
  };

  // Delete RFQ mutation
  const deleteRFQMutation = useMutation({
    mutationFn: async (rfqId: string) => {
      const response = await fetch(`/api/buyer/rfqs/${rfqId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete RFQ');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "RFQ deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['buyer-rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['buyer-rfq-analytics'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Accept quotation mutation
  const acceptQuotationMutation = useMutation({
    mutationFn: async ({ quotationId, rfqId }: { quotationId: string; rfqId: string }) => {
      const response = await fetch(`/api/buyer/rfqs/${rfqId}/quotations/${quotationId}/accept`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to accept quotation');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quotation accepted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['buyer-rfqs'] });
      setShowQuotationsDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleViewQuotations = async (rfq: RFQ) => {
    try {
      const data = await fetchQuotations(rfq.id);
      if (data.success) {
        setSelectedRFQ(rfq);
        setSelectedQuotations(data.quotations);
        setShowQuotationsDialog(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load quotations",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRFQ = (rfqId: string) => {
    if (confirm('Are you sure you want to delete this RFQ? This action cannot be undone.')) {
      deleteRFQMutation.mutate(rfqId);
    }
  };

  const handleAcceptQuotation = (quotationId: string, rfqId: string) => {
    if (confirm('Are you sure you want to accept this quotation? This will close the RFQ.')) {
      acceptQuotationMutation.mutate({ quotationId, rfqId });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { color: 'bg-green-100 text-green-800', label: 'Open', icon: CheckCircle },
      closed: { color: 'bg-gray-100 text-gray-800', label: 'Closed', icon: XCircle },
      expired: { color: 'bg-red-100 text-red-800', label: 'Expired', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getQuotationStatusBadge = (status: string) => {
    const statusConfig = {
      sent: { color: 'bg-blue-100 text-blue-800', label: 'Pending' },
      accepted: { color: 'bg-green-100 text-green-800', label: 'Accepted' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      expired: { color: 'bg-gray-100 text-gray-800', label: 'Expired' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.sent;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
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
          <p className="text-gray-600">Manage your requests for quotations and compare supplier offers</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create RFQ
        </Button>
      </div>

      {/* Analytics Cards */}
      {analyticsData?.success && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total RFQs</p>
                  <p className="text-2xl font-bold">{analyticsData.analytics.totalRfqs}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active RFQs</p>
                  <p className="text-2xl font-bold">{analyticsData.analytics.activeRfqs}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Quotations</p>
                  <p className="text-2xl font-bold">{analyticsData.analytics.totalQuotations}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. Quotes per RFQ</p>
                  <p className="text-2xl font-bold">{analyticsData.analytics.avgQuotationsPerRfq}</p>
                </div>
                <Users className="h-8 w-8 text-orange-500" />
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
          <TabsTrigger value="all">All RFQs</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
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
                          {rfq.quotationCount > 0 && (
                            <Badge className="bg-blue-100 text-blue-800">
                              {rfq.quotationCount} Quote{rfq.quotationCount !== 1 ? 's' : ''}
                            </Badge>
                          )}
                          {isRFQExpired(rfq.expiresAt) && (
                            <Badge className="bg-red-100 text-red-800">Expired</Badge>
                          )}
                        </div>
                        <p className="text-gray-600 mb-3 line-clamp-2">{rfq.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span>{rfq.quantity.toLocaleString()} units</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span>
                              {rfq.targetPrice 
                                ? `Target: ${formatCurrency(rfq.targetPrice)}`
                                : 'No target price'
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{rfq.deliveryLocation}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>Expires: {formatDate(rfq.expiresAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                          <div>
                            Created: {formatDate(rfq.createdAt)}
                          </div>
                          <div className="flex items-center gap-4">
                            <span>{rfq.viewCount} views</span>
                            {rfq.lastQuotationDate && (
                              <span>Last quote: {formatDate(rfq.lastQuotationDate)}</span>
                            )}
                          </div>
                        </div>
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
                                  <h4 className="font-semibold mb-2">Requirements</h4>
                                  <div className="space-y-1 text-sm">
                                    <p><strong>Category:</strong> {rfq.categoryName}</p>
                                    <p><strong>Quantity:</strong> {rfq.quantity.toLocaleString()} units</p>
                                    <p><strong>Target Price:</strong> {rfq.targetPrice ? formatCurrency(rfq.targetPrice) : 'Not specified'}</p>
                                    <p><strong>Delivery Location:</strong> {rfq.deliveryLocation}</p>
                                    {rfq.requiredDeliveryDate && (
                                      <p><strong>Required Date:</strong> {formatDate(rfq.requiredDeliveryDate)}</p>
                                    )}
                                    <p><strong>Payment Terms:</strong> {rfq.paymentTerms}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-semibold mb-2">Status</h4>
                                  <div className="space-y-1 text-sm">
                                    <p><strong>Status:</strong> {getStatusBadge(rfq.status)}</p>
                                    <p><strong>Quotations:</strong> {rfq.quotationCount}</p>
                                    <p><strong>Views:</strong> {rfq.viewCount}</p>
                                    <p><strong>Created:</strong> {formatDate(rfq.createdAt)}</p>
                                    <p><strong>Expires:</strong> {formatDate(rfq.expiresAt)}</p>
                                  </div>
                                </div>
                              </div>

                              {rfq.specifications && Object.keys(rfq.specifications).length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2">Specifications</h4>
                                  <div className="bg-gray-50 p-3 rounded text-sm">
                                    {Object.entries(rfq.specifications).map(([key, value]) => (
                                      <div key={key} className="flex justify-between py-1">
                                        <span className="font-medium">{key}:</span>
                                        <span>{String(value)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {(rfq.budgetRange.min > 0 || rfq.budgetRange.max > 0) && (
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

                        {rfq.quotationCount > 0 && (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleViewQuotations(rfq)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            View Quotes ({rfq.quotationCount})
                          </Button>
                        )}

                        {rfq.status === 'open' && !isRFQExpired(rfq.expiresAt) && (
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        )}

                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteRFQ(rfq.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
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
                <h3 className="text-lg font-semibold mb-2">No RFQs Found</h3>
                <p className="text-gray-600 mb-4">
                  {activeTab === 'active' 
                    ? "You don't have any active RFQs. Create your first RFQ to start receiving quotes from suppliers."
                    : `No ${activeTab} RFQs found matching your criteria.`
                  }
                </p>
                {activeTab === 'active' && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First RFQ
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create RFQ Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New RFQ</DialogTitle>
          </DialogHeader>
          <RFQCreationForm
            onSuccess={(rfqId) => {
              setShowCreateDialog(false);
              queryClient.invalidateQueries({ queryKey: ['buyer-rfqs'] });
              queryClient.invalidateQueries({ queryKey: ['buyer-rfq-analytics'] });
            }}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Quotations Dialog */}
      <Dialog open={showQuotationsDialog} onOpenChange={setShowQuotationsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Quotations for: {selectedRFQ?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedQuotations.length > 0 ? (
            <div className="space-y-4">
              {selectedQuotations.map((quotation: Quotation) => (
                <Card key={quotation.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-lg font-semibold">{quotation.supplierCompany}</h4>
                          {getQuotationStatusBadge(quotation.status)}
                          {quotation.supplierVerified && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm">{quotation.supplierRating.toFixed(1)}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <span className="font-medium">Unit Price:</span>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(quotation.unitPrice)}</p>
                          </div>
                          <div>
                            <span className="font-medium">Total Price:</span>
                            <p className="text-lg font-bold">{formatCurrency(quotation.totalPrice)}</p>
                          </div>
                          <div>
                            <span className="font-medium">MOQ:</span>
                            <p>{quotation.moq.toLocaleString()} units</p>
                          </div>
                          <div>
                            <span className="font-medium">Lead Time:</span>
                            <p>{quotation.leadTime}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <span className="font-medium">Payment Terms:</span>
                            <p>{quotation.paymentTerms}</p>
                          </div>
                          <div>
                            <span className="font-medium">Valid Until:</span>
                            <p>{quotation.validityPeriod} days from quote date</p>
                          </div>
                        </div>

                        {quotation.termsConditions && (
                          <div className="mb-4">
                            <span className="font-medium">Terms & Conditions:</span>
                            <p className="text-gray-600 mt-1">{quotation.termsConditions}</p>
                          </div>
                        )}

                        <div className="text-sm text-gray-500">
                          Submitted: {formatDate(quotation.createdAt)}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        {quotation.status === 'sent' && (
                          <>
                            <Button 
                              size="sm"
                              onClick={() => handleAcceptQuotation(quotation.id, quotation.rfqId)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Accept Quote
                            </Button>
                            <Button variant="outline" size="sm">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message Supplier
                            </Button>
                          </>
                        )}
                        
                        {quotation.attachments && quotation.attachments.length > 0 && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download Files
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Quotations Yet</h3>
              <p className="text-gray-600">
                Suppliers haven't submitted any quotations for this RFQ yet. 
                Check back later or consider extending the expiry date.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RFQDashboard;