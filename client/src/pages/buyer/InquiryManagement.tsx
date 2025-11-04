import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import InquiryForm from '@/components/buyer/InquiryForm';
import QuotationComparison from '@/components/buyer/QuotationComparison';
import { 
  Search, 
  Filter, 
  Plus, 
  MessageSquare, 
  FileText, 
  Clock, 
  CheckCircle, 
  X,
  Eye,
  BarChart3,
  Package,
  DollarSign,
  Calendar,
  Truck,
  Building,
  User,
  TrendingUp,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface Inquiry {
  id: string;
  productId: string;
  supplierId?: string;
  subject: string;
  message: string;
  quantity?: number;
  targetPrice?: number;
  requirements?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    images?: string[];
  };
  supplier?: {
    businessName: string;
    country: string;
  };
  quotationCount: number;
  quotations?: any[];
}

export default function InquiryManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isInquiryFormOpen, setIsInquiryFormOpen] = useState(false);
  const [isQuotationComparisonOpen, setIsQuotationComparisonOpen] = useState(false);
  const [selectedQuotations, setSelectedQuotations] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'inquiries' | 'quotations'>('inquiries');

  // Fetch buyer's inquiries
  const { data: inquiriesData, isLoading: inquiriesLoading, refetch: refetchInquiries } = useQuery({
    queryKey: ['/api/buyer/inquiries', statusFilter, searchQuery, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (sortBy) params.append('sort', sortBy);
      
      const response = await fetch(`/api/buyer/inquiries?${params.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch inquiries');
      const data = await response.json();
      return data.inquiries || [];
    },
    enabled: !!user && viewMode === 'inquiries'
  });

  // Fetch buyer's quotations
  const { data: quotationsData, isLoading: quotationsLoading, refetch: refetchQuotations } = useQuery({
    queryKey: ['/api/buyer/quotations', statusFilter, searchQuery, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (sortBy) params.append('sort', sortBy);
      
      const response = await fetch(`/api/buyer/quotations?${params.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch quotations');
      const data = await response.json();
      return data.quotations || [];
    },
    enabled: !!user && viewMode === 'quotations'
  });

  // Accept quotation mutation
  const acceptQuotationMutation = useMutation({
    mutationFn: async ({ quotation, shippingAddress }: { quotation: any, shippingAddress: string }) => {
      const endpoint = quotation.type === 'inquiry' 
        ? `/api/inquiry-quotations/${quotation.id}/accept`
        : `/api/quotations/${quotation.id}/accept`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ shippingAddress })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept quotation');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Quotation Accepted",
        description: data.message || "Order has been created successfully!",
      });
      refetchQuotations();
      refetchInquiries();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept quotation",
        variant: "destructive",
      });
    }
  });

  // Reject quotation mutation
  const rejectQuotationMutation = useMutation({
    mutationFn: async ({ quotation, reason }: { quotation: any, reason: string }) => {
      const endpoint = quotation.type === 'inquiry' 
        ? `/api/inquiry-quotations/${quotation.id}/reject`
        : `/api/quotations/${quotation.id}/reject`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject quotation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quotation Rejected",
        description: "The quotation has been rejected successfully.",
      });
      refetchQuotations();
      refetchInquiries();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject quotation",
        variant: "destructive",
      });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "responded": return <CheckCircle className="h-4 w-4" />;
      case "closed": return <X className="h-4 w-4" />;
      case "accepted": return <CheckCircle className="h-4 w-4" />;
      case "rejected": return <X className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "responded": return "bg-blue-100 text-blue-800 border-blue-200";
      case "closed": return "bg-gray-100 text-gray-800 border-gray-200";
      case "accepted": return "bg-green-100 text-green-800 border-green-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleCompareQuotations = (inquiry: Inquiry) => {
    if (inquiry.quotations && inquiry.quotations.length > 0) {
      setSelectedQuotations(inquiry.quotations);
      setIsQuotationComparisonOpen(true);
    } else {
      toast({
        title: "No Quotations",
        description: "This inquiry doesn't have any quotations to compare yet.",
        variant: "destructive",
      });
    }
  };

  const handleAcceptQuotation = (quotation: any) => {
    const shippingAddress = prompt("Please enter your shipping address:");
    if (shippingAddress?.trim()) {
      acceptQuotationMutation.mutate({ quotation, shippingAddress });
    }
  };

  const handleRejectQuotation = (quotation: any) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (reason?.trim()) {
      rejectQuotationMutation.mutate({ quotation, reason });
    }
  };

  const handleNegotiateQuotation = (quotation: any) => {
    toast({
      title: "Negotiation Feature",
      description: "Negotiation feature will be available soon. Please contact the supplier directly for now.",
    });
  };

  const inquiries = inquiriesData || [];
  const quotations = quotationsData || [];
  const isLoading = inquiriesLoading || quotationsLoading;

  // Filter data based on current view
  const filteredData = viewMode === 'inquiries' ? inquiries : quotations;

  // Statistics
  const pendingInquiries = inquiries.filter((i: Inquiry) => i.status === 'pending').length;
  const respondedInquiries = inquiries.filter((i: Inquiry) => i.status === 'responded').length;
  const pendingQuotations = quotations.filter((q: any) => q.status === 'pending').length;
  const acceptedQuotations = quotations.filter((q: any) => q.status === 'accepted').length;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to manage inquiries.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-blue-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg mb-6">
              <MessageSquare className="w-4 h-4" />
              <span>Inquiry Management</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Manage Your
              <span className="bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent block">
                Inquiries & Quotations
              </span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Send product inquiries, compare quotations, and manage your supplier communications all in one place.
            </p>

            <div className="flex flex-wrap justify-center gap-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-300" />
                <span>Direct Communication</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-green-300" />
                <span>Compare Quotes</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-300" />
                <span>Fast Response</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{pendingInquiries}</div>
                <div className="text-sm text-gray-600">Pending Inquiries</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{respondedInquiries}</div>
                <div className="text-sm text-gray-600">Responded Inquiries</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{pendingQuotations}</div>
                <div className="text-sm text-gray-600">Pending Quotations</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-100 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{acceptedQuotations}</div>
                <div className="text-sm text-gray-600">Accepted Quotations</div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search inquiries or quotations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="responded">Responded</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="status">By Status</SelectItem>
                      <SelectItem value="product">By Product</SelectItem>
                      <SelectItem value="supplier">By Supplier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                    <TabsList>
                      <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
                      <TabsTrigger value="quotations">Quotations</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <Button onClick={() => setIsInquiryFormOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Inquiry
                  </Button>

                  <Button variant="outline" onClick={() => {
                    if (viewMode === 'inquiries') {
                      refetchInquiries();
                    } else {
                      refetchQuotations();
                    }
                  }}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {viewMode === 'inquiries' ? (
                // Inquiries View
                inquiries.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Inquiries Yet</h3>
                      <p className="text-gray-600 mb-6">Start by sending your first product inquiry to suppliers.</p>
                      <Button onClick={() => setIsInquiryFormOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Send First Inquiry
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  inquiries.map((inquiry: Inquiry) => (
                    <Card key={inquiry.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{inquiry.subject}</h3>
                              <Badge className={getStatusColor(inquiry.status)}>
                                {getStatusIcon(inquiry.status)}
                                <span className="ml-1 capitalize">{inquiry.status}</span>
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                <span>{inquiry.product?.name || 'Unknown Product'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Building className="w-4 h-4" />
                                <span>{inquiry.supplier?.businessName || 'Unknown Supplier'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(inquiry.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {inquiry.quantity && (
                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Quantity:</span>
                                  <span>{inquiry.quantity.toLocaleString()}</span>
                                </div>
                                {inquiry.targetPrice && (
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" />
                                    <span>Target: ${inquiry.targetPrice}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            <p className="text-gray-700 line-clamp-2">{inquiry.message}</p>
                          </div>

                          <div className="flex flex-col items-end gap-2 ml-4">
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {inquiry.quotationCount} Quotation{inquiry.quotationCount !== 1 ? 's' : ''}
                              </div>
                              {inquiry.quotationCount > 0 && (
                                <div className="text-xs text-green-600">
                                  {inquiry.quotations?.filter(q => q.status === 'pending').length || 0} pending
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => setSelectedInquiry(inquiry)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              
                              {inquiry.quotationCount > 1 && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleCompareQuotations(inquiry)}
                                >
                                  <BarChart3 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {inquiry.quotations && inquiry.quotations.length > 0 && (
                          <div className="border-t pt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Quotations</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {inquiry.quotations.slice(0, 3).map((quotation: any) => (
                                <div key={quotation.id} className="bg-gray-50 p-3 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <Badge className={getStatusColor(quotation.status)}>
                                      {quotation.status}
                                    </Badge>
                                    <span className="text-sm font-medium text-green-600">
                                      ${quotation.pricePerUnit || quotation.unitPrice}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    <div>Total: ${(quotation.totalPrice || quotation.totalAmount || 0).toLocaleString()}</div>
                                    <div>MOQ: {quotation.moq}</div>
                                    <div>Lead: {quotation.leadTime}</div>
                                  </div>
                                  {quotation.status === 'pending' && (
                                    <div className="flex gap-1 mt-2">
                                      <Button 
                                        size="sm" 
                                        className="flex-1 text-xs bg-green-600 hover:bg-green-700"
                                        onClick={() => handleAcceptQuotation(quotation)}
                                      >
                                        Accept
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="flex-1 text-xs"
                                        onClick={() => handleRejectQuotation(quotation)}
                                      >
                                        Reject
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )
              ) : (
                // Quotations View
                quotations.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Quotations Yet</h3>
                      <p className="text-gray-600 mb-6">Send inquiries to suppliers to receive quotations.</p>
                      <Button onClick={() => setIsInquiryFormOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Send Inquiry
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {quotations.map((quotation: any) => (
                      <Card key={quotation.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">{quotation.productName}</h3>
                                <Badge className={getStatusColor(quotation.status)}>
                                  {getStatusIcon(quotation.status)}
                                  <span className="ml-1 capitalize">{quotation.status}</span>
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-gray-600 mb-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <Building className="w-4 h-4" />
                                  <span>{quotation.supplierName || quotation.adminName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>{new Date(quotation.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                <div>
                                  <span className="text-gray-600">Unit Price:</span>
                                  <div className="font-medium text-green-600">${quotation.unitPrice}</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Total:</span>
                                  <div className="font-medium">${quotation.totalPrice.toLocaleString()}</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Quantity:</span>
                                  <div className="font-medium">{quotation.quantity.toLocaleString()}</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">MOQ:</span>
                                  <div className="font-medium">{quotation.moq.toLocaleString()}</div>
                                </div>
                              </div>

                              <div className="text-sm text-gray-600">
                                <div>Lead Time: {quotation.leadTime}</div>
                                <div>Payment: {quotation.paymentTerms}</div>
                              </div>
                            </div>
                          </div>

                          {quotation.status === 'pending' && (
                            <div className="flex gap-2 pt-4 border-t">
                              <Button 
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => handleAcceptQuotation(quotation)}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Accept
                              </Button>
                              <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => handleNegotiateQuotation(quotation)}
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Negotiate
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => handleRejectQuotation(quotation)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </main>

      {/* Inquiry Form Dialog */}
      <Dialog open={isInquiryFormOpen} onOpenChange={setIsInquiryFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Product Inquiry</DialogTitle>
          </DialogHeader>
          <InquiryForm
            productId="sample-product-id" // This should be dynamic based on selected product
            productName="Sample Product"
            productPrice="$10.00-$100.00"
            supplierName="Sample Supplier"
            onSuccess={() => {
              setIsInquiryFormOpen(false);
              refetchInquiries();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Quotation Comparison Dialog */}
      <QuotationComparison
        quotations={selectedQuotations}
        isOpen={isQuotationComparisonOpen}
        onClose={() => setIsQuotationComparisonOpen(false)}
        onAccept={handleAcceptQuotation}
        onReject={handleRejectQuotation}
        onNegotiate={handleNegotiateQuotation}
      />

      <Footer />
    </div>
  );
}