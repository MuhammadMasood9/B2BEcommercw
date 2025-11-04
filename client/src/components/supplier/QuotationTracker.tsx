import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  DollarSign, 
  Package, 
  Calendar,
  Building2,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  BarChart3,
  RefreshCw,
  Download,
  Send,
  Edit
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
  // Related data
  rfqTitle: string;
  rfqQuantity: number;
  rfqTargetPrice: string;
  rfqStatus: string;
  buyerCompanyName: string;
  buyerIndustry: string;
  inquirySubject: string;
  inquiryMessage: string;
  productName: string;
  // Tracking data
  viewedAt: string;
  respondedAt: string;
  acceptedAt: string;
  rejectedAt: string;
  rejectionReason: string;
  followUpCount: number;
  lastFollowUpAt: string;
}

interface QuotationAnalytics {
  totalQuotations: number;
  sentQuotations: number;
  acceptedQuotations: number;
  rejectedQuotations: number;
  expiredQuotations: number;
  pendingQuotations: number;
  winRate: number;
  averageResponseTime: number;
  totalValue: number;
  wonValue: number;
  conversionRate: number;
}

const QuotationTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const queryClient = useQueryClient();

  // Fetch quotations
  const { data: quotationsData, isLoading } = useQuery({
    queryKey: ['supplier-quotations-tracker', searchTerm, statusFilter, dateFilter, activeTab],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (dateFilter) params.append('dateFilter', dateFilter);
      if (activeTab !== 'all') params.append('type', activeTab);
      params.append('limit', '50');

      const response = await fetch(`/api/suppliers/quotations?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch quotations');
      return response.json();
    }
  });

  // Fetch quotation analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['quotation-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/quotations/analytics', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  });

  // Update quotation status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ quotationId, status, notes }: { quotationId: string; status: string; notes?: string }) => {
      const response = await fetch(`/api/suppliers/quotations/${quotationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, notes })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quotation status updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-quotations-tracker'] });
      queryClient.invalidateQueries({ queryKey: ['quotation-analytics'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Send follow-up mutation
  const sendFollowUpMutation = useMutation({
    mutationFn: async ({ quotationId, message }: { quotationId: string; message: string }) => {
      const response = await fetch(`/api/suppliers/quotations/${quotationId}/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send follow-up');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Follow-up sent successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['supplier-quotations-tracker'] });
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      sent: { color: 'bg-blue-100 text-blue-800', label: 'Sent', icon: Send },
      viewed: { color: 'bg-purple-100 text-purple-800', label: 'Viewed', icon: Eye },
      accepted: { color: 'bg-green-100 text-green-800', label: 'Accepted', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: XCircle },
      expired: { color: 'bg-gray-100 text-gray-800', label: 'Expired', icon: Clock },
      negotiating: { color: 'bg-yellow-100 text-yellow-800', label: 'Negotiating', icon: RefreshCw }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.sent;
    const IconComponent = config.icon;
    
    return (
      <Badge className={config.color}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  const isExpiringSoon = (quotation: Quotation) => {
    if (!quotation.validityPeriod) return false;
    const expiryDate = new Date(quotation.createdAt);
    expiryDate.setDate(expiryDate.getDate() + quotation.validityPeriod);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 3 && daysUntilExpiry > 0;
  };

  const handleSendFollowUp = (quotation: Quotation) => {
    const message = prompt('Enter follow-up message:');
    if (message) {
      sendFollowUpMutation.mutate({
        quotationId: quotation.id,
        message
      });
    }
  };

  const handleViewDetails = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setShowDetailsDialog(true);
  };

  const analytics: QuotationAnalytics = analyticsData?.success ? analyticsData.analytics : {
    totalQuotations: 0,
    sentQuotations: 0,
    acceptedQuotations: 0,
    rejectedQuotations: 0,
    expiredQuotations: 0,
    pendingQuotations: 0,
    winRate: 0,
    averageResponseTime: 0,
    totalValue: 0,
    wonValue: 0,
    conversionRate: 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quotation Tracker</h1>
          <p className="text-gray-600">Track and manage your quotation performance</p>
        </div>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['supplier-quotations-tracker'] })}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Quotations</p>
                <p className="text-2xl font-bold">{analytics.totalQuotations}</p>
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
                <p className="text-2xl font-bold">{analytics.winRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.totalValue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Won Value</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.wonValue)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setActiveTab('all')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{analytics.totalQuotations}</p>
            <p className="text-sm text-gray-600">All</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('sent')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{analytics.sentQuotations}</p>
            <p className="text-sm text-gray-600">Sent</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('accepted')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{analytics.acceptedQuotations}</p>
            <p className="text-sm text-gray-600">Accepted</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('rejected')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{analytics.rejectedQuotations}</p>
            <p className="text-sm text-gray-600">Rejected</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('expired')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{analytics.expiredQuotations}</p>
            <p className="text-sm text-gray-600">Expired</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setStatusFilter('negotiating')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{analytics.pendingQuotations}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search quotations..."
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
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quotations List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Quotations</TabsTrigger>
          <TabsTrigger value="rfq">RFQ Quotations</TabsTrigger>
          <TabsTrigger value="inquiry">Inquiry Quotations</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading quotations...</div>
          ) : quotationsData?.success && quotationsData.quotations?.length > 0 ? (
            <div className="space-y-4">
              {quotationsData.quotations.map((quotation: Quotation) => (
                <Card key={quotation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">
                            {quotation.rfqTitle || quotation.inquirySubject || quotation.productName}
                          </h3>
                          {getStatusBadge(quotation.status)}
                          {isExpiringSoon(quotation) && (
                            <Badge className="bg-orange-100 text-orange-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Expiring Soon
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span>{quotation.buyerCompanyName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span>Total: {formatCurrency(quotation.totalPrice)}</span>
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

                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div>
                            Sent: {getTimeAgo(quotation.createdAt)}
                            {quotation.viewedAt && (
                              <span className="ml-4">Viewed: {getTimeAgo(quotation.viewedAt)}</span>
                            )}
                          </div>
                          <div>
                            {quotation.followUpCount > 0 && (
                              <span>Follow-ups: {quotation.followUpCount}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(quotation)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        
                        {quotation.status === 'sent' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendFollowUp(quotation)}
                            disabled={sendFollowUpMutation.isPending}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Follow Up
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
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Quotations Found</h3>
                <p className="text-gray-600">No quotations match your current filters.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Quotation Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quotation Details</DialogTitle>
          </DialogHeader>
          
          {selectedQuotation && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedQuotation.rfqTitle || selectedQuotation.inquirySubject}
                  </h3>
                  <p className="text-gray-600">{selectedQuotation.buyerCompanyName}</p>
                </div>
                <div className="text-right">
                  {getStatusBadge(selectedQuotation.status)}
                  <p className="text-sm text-gray-600 mt-1">
                    Sent: {formatDate(selectedQuotation.createdAt)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Pricing Details */}
              <div>
                <h4 className="font-semibold mb-3">Pricing Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <strong>Unit Price:</strong> {formatCurrency(selectedQuotation.unitPrice)}
                  </div>
                  <div>
                    <strong>Total Price:</strong> {formatCurrency(selectedQuotation.totalPrice)}
                  </div>
                  <div>
                    <strong>MOQ:</strong> {selectedQuotation.moq.toLocaleString()} units
                  </div>
                  <div>
                    <strong>Validity:</strong> {selectedQuotation.validityPeriod} days
                  </div>
                </div>
              </div>

              <Separator />

              {/* Terms */}
              <div>
                <h4 className="font-semibold mb-3">Terms & Conditions</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Lead Time:</strong> {selectedQuotation.leadTime}
                  </div>
                  <div>
                    <strong>Payment Terms:</strong> {selectedQuotation.paymentTerms}
                  </div>
                </div>
                {selectedQuotation.termsConditions && (
                  <div className="mt-3">
                    <strong>Additional Terms:</strong>
                    <p className="text-gray-600 mt-1">{selectedQuotation.termsConditions}</p>
                  </div>
                )}
              </div>

              {/* Status Timeline */}
              <div>
                <h4 className="font-semibold mb-3">Status Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-blue-500" />
                    <span>Sent: {formatDate(selectedQuotation.createdAt)}</span>
                  </div>
                  {selectedQuotation.viewedAt && (
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-purple-500" />
                      <span>Viewed: {formatDate(selectedQuotation.viewedAt)}</span>
                    </div>
                  )}
                  {selectedQuotation.acceptedAt && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Accepted: {formatDate(selectedQuotation.acceptedAt)}</span>
                    </div>
                  )}
                  {selectedQuotation.rejectedAt && (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Rejected: {formatDate(selectedQuotation.rejectedAt)}</span>
                      {selectedQuotation.rejectionReason && (
                        <span className="text-gray-600">- {selectedQuotation.rejectionReason}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Follow-ups */}
              {selectedQuotation.followUpCount > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Follow-ups</h4>
                  <p className="text-sm text-gray-600">
                    {selectedQuotation.followUpCount} follow-up(s) sent
                    {selectedQuotation.lastFollowUpAt && (
                      <span className="ml-2">
                        (Last: {formatDate(selectedQuotation.lastFollowUpAt)})
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotationTracker;