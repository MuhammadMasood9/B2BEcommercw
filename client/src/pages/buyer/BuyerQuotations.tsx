import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Package,
  DollarSign,
  Calendar,
  Truck,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ShoppingCart,
  X,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Eye,
  ArrowRight
} from 'lucide-react';

export default function BuyerQuotations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const queryClient = useQueryClient();

  // Fetch all quotations for the buyer
  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['/api/buyer/quotations', statusFilter, searchQuery, sortBy],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
        if (searchQuery) params.append('search', searchQuery);
        if (sortBy) params.append('sort', sortBy);
        
        const response = await fetch(`/api/buyer/quotations?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch quotations');
        const data = await response.json();
        return data.quotations || [];
      } catch (error) {
        console.error('Error fetching quotations:', error);
        return [];
      }
    }
  });

  // Accept quotation mutation
  const acceptQuotationMutation = useMutation({
    mutationFn: async ({ quotationId, inquiryId, shippingAddress }: any) => {
      const response = await fetch('/api/quotations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotationId, inquiryId, shippingAddress })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to accept quotation');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/buyer/quotations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setIsAcceptDialogOpen(false);
      setShippingAddress('');
      toast.success('Quotation accepted! Admin will create order for your approval.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to accept quotation');
    }
  });

  // Reject quotation mutation
  const rejectQuotationMutation = useMutation({
    mutationFn: async ({ quotationId, reason }: any) => {
      const response = await fetch('/api/quotations/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotationId, reason })
      });
      if (!response.ok) throw new Error('Failed to reject quotation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/buyer/quotations'] });
      setIsRejectDialogOpen(false);
      setRejectionReason('');
      toast.success('Quotation rejected');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject quotation');
    }
  });

  // Request negotiation
  const requestNegotiationMutation = useMutation({
    mutationFn: async ({ inquiryId, message, targetPrice, quantity }: any) => {
      const response = await fetch('/api/inquiries/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryId, message, targetPrice, quantity })
      });
      if (!response.ok) throw new Error('Failed to request negotiation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/buyer/quotations'] });
      toast.success('Negotiation request sent to supplier');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send negotiation request');
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleAcceptQuotation = (quotation: any) => {
    setSelectedQuotation(quotation);
    setIsAcceptDialogOpen(true);
  };

  const handleRejectQuotation = (quotation: any) => {
    setSelectedQuotation(quotation);
    setIsRejectDialogOpen(true);
  };

  const handleViewDetails = (quotation: any) => {
    setSelectedQuotation(quotation);
    setIsDetailsDialogOpen(true);
  };

  const confirmAcceptQuotation = () => {
    if (!selectedQuotation || !shippingAddress.trim()) {
      toast.error('Please provide a shipping address');
      return;
    }
    
    acceptQuotationMutation.mutate({
      quotationId: selectedQuotation.id,
      inquiryId: selectedQuotation.inquiryId,
      shippingAddress
    });
  };

  const confirmRejectQuotation = () => {
    if (!selectedQuotation) return;
    
    rejectQuotationMutation.mutate({
      quotationId: selectedQuotation.id,
      reason: rejectionReason
    });
  };

  const stats = {
    total: quotations.length,
    pending: quotations.filter((q: any) => q.status === 'pending').length,
    accepted: quotations.filter((q: any) => q.status === 'accepted').length,
    rejected: quotations.filter((q: any) => q.status === 'rejected').length,
    totalValue: quotations
      .filter((q: any) => q.status === 'pending')
      .reduce((sum: number, q: any) => sum + (q.totalPrice || 0), 0)
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  My Quotations
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  View and manage all quotations received from suppliers
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/buyer/quotations'] })}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium mb-1">Total Quotations</p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                    <p className="text-blue-200 text-xs mt-1">All time</p>
                  </div>
                  <FileText className="h-10 w-10 text-blue-200 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm font-medium mb-1">Pending Review</p>
                    <p className="text-3xl font-bold">{stats.pending}</p>
                    <p className="text-yellow-200 text-xs mt-1">Needs action</p>
                  </div>
                  <Clock className="h-10 w-10 text-yellow-200 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium mb-1">Accepted</p>
                    <p className="text-3xl font-bold">{stats.accepted}</p>
                    <p className="text-green-200 text-xs mt-1">Orders created</p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-green-200 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium mb-1">Potential Value</p>
                    <p className="text-3xl font-bold">{formatPrice(stats.totalValue)}</p>
                    <p className="text-purple-200 text-xs mt-1">Pending quotes</p>
                  </div>
                  <DollarSign className="h-10 w-10 text-purple-200 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by product, supplier, or order details..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quotations List */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading quotations...</span>
              </div>
            ) : quotations.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No quotations found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'You haven\'t received any quotations yet. Send an inquiry to get started!'
                    }
                  </p>
                  <Link href="/products">
                    <Button>
                      <Package className="h-4 w-4 mr-2" />
                      Browse Products
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              quotations.map((quotation: any) => (
                <Card key={quotation.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          {quotation.productImage ? (
                            <img 
                              src={quotation.productImage} 
                              alt={quotation.productName}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Main Content */}
                      <div className="flex-1">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {quotation.productName || 'Unknown Product'}
                              </h3>
                              <Badge className={getStatusColor(quotation.status)}>
                                {getStatusIcon(quotation.status)}
                                {quotation.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              Supplier: {quotation.supplierName || quotation.buyerCompany || 'Admin Supplier'}
                              {quotation.supplierCountry && ` • ${quotation.supplierCountry}`}
                            </p>
                            {quotation.inquiryMessage && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                                Your inquiry: "{quotation.inquiryMessage.substring(0, 100)}{quotation.inquiryMessage.length > 100 ? '...' : ''}"
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Received</div>
                            <div className="text-sm font-medium">{formatDate(quotation.createdAt)}</div>
                            {quotation.inquiryQuantity && (
                              <div className="text-xs text-gray-500 mt-1">
                                Requested: {quotation.inquiryQuantity} units
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quotation Details with Comparison */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg mb-4 border border-blue-200 dark:border-blue-800">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Price per Unit</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatPrice(quotation.pricePerUnit)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Price</p>
                              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                {formatPrice(quotation.totalPrice)}
                              </p>
                              {quotation.inquiryQuantity && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Est: {formatPrice(quotation.pricePerUnit * quotation.inquiryQuantity)} for {quotation.inquiryQuantity} units
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">MOQ</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {quotation.moq} units
                              </p>
                              {quotation.inquiryQuantity && quotation.inquiryQuantity !== quotation.moq && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  {quotation.inquiryQuantity < quotation.moq ? (
                                    <TrendingUp className="h-3 w-3 text-orange-600" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3 text-blue-600" />
                                  )}
                                  <p className="text-xs text-gray-500">
                                    Requested: {quotation.inquiryQuantity}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Lead Time</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {quotation.leadTime}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="outline">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {quotation.paymentTerms || 'T/T'}
                          </Badge>
                          <Badge variant="outline">
                            <Calendar className="h-3 w-3 mr-1" />
                            Valid until: {formatDate(quotation.validUntil)}
                          </Badge>
                          {quotation.orderId && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              <ShoppingCart className="h-3 w-3 mr-1" />
                              Order Created
                            </Badge>
                          )}
                        </div>

                        {quotation.message && (
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-4">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <strong>Supplier Message:</strong> {quotation.message}
                            </p>
                          </div>
                        )}

                        {quotation.status === 'rejected' && (
                          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-4">
                            <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              <strong>Quotation Rejected</strong>
                            </p>
                            <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                              You can send a new negotiation request to the supplier
                            </p>
                          </div>
                        )}

                        {quotation.attachments && quotation.attachments.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attachments:</p>
                            <div className="flex flex-wrap gap-2">
                              {quotation.attachments.map((attachment: string, idx: number) => (
                                <Badge key={idx} variant="outline">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Attachment {idx + 1}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(quotation)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>

                          {quotation.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleAcceptQuotation(quotation)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <ThumbsUp className="h-4 w-4 mr-2" />
                                Accept & Create Order
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectQuotation(quotation)}
                              >
                                <ThumbsDown className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  requestNegotiationMutation.mutate({
                                    inquiryId: quotation.inquiryId,
                                    message: 'I would like to negotiate the terms',
                                    targetPrice: quotation.pricePerUnit * 0.9,
                                    quantity: quotation.moq
                                  });
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Negotiate
                              </Button>
                            </>
                          )}

                          {quotation.status === 'accepted' && quotation.orderId && (
                            <Link href={`/my-orders`}>
                              <Button size="sm" variant="outline">
                                <ArrowRight className="h-4 w-4 mr-2" />
                                View Order
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />

      {/* Accept Quotation Dialog */}
      <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Accept Quotation & Create Order</DialogTitle>
            <DialogDescription>
              Please provide shipping details to create your order.
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuotation && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <h4 className="font-semibold mb-2">Order Summary</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Product:</strong> {selectedQuotation.productName}</p>
                  <p><strong>Quantity:</strong> {selectedQuotation.moq} units</p>
                  <p><strong>Unit Price:</strong> {formatPrice(selectedQuotation.pricePerUnit)}</p>
                  <p><strong>Total:</strong> <span className="text-lg font-bold text-green-600">{formatPrice(selectedQuotation.totalPrice)}</span></p>
                  <p><strong>Lead Time:</strong> {selectedQuotation.leadTime}</p>
                  <p><strong>Payment Terms:</strong> {selectedQuotation.paymentTerms}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Shipping Address *
                </label>
                <Textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Enter full shipping address with postal code..."
                  rows={4}
                  className="w-full"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAcceptDialogOpen(false);
                setShippingAddress('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAcceptQuotation}
              disabled={acceptQuotationMutation.isPending || !shippingAddress.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {acceptQuotationMutation.isPending ? 'Creating Order...' : 'Confirm & Create Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Quotation Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Quotation</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this quotation (optional).
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rejection Reason (Optional)
              </label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="E.g., Price too high, Lead time too long..."
                rows={3}
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRejectQuotation}
              disabled={rejectQuotationMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              {rejectQuotationMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quotation Details</DialogTitle>
          </DialogHeader>
          
          {selectedQuotation && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Product Information</h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                  <p><strong>Product:</strong> {selectedQuotation.productName}</p>
                  <p><strong>Supplier:</strong> {selectedQuotation.supplierName || selectedQuotation.buyerCompany || 'Admin Supplier'}</p>
                  {selectedQuotation.buyerEmail && (
                    <p className="text-sm"><strong>Contact:</strong> {selectedQuotation.buyerEmail}</p>
                  )}
                  {selectedQuotation.supplierCountry && (
                    <p className="text-sm"><strong>Country:</strong> {selectedQuotation.supplierCountry}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Pricing & Terms</h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                  <p><strong>Price per Unit:</strong> {formatPrice(selectedQuotation.pricePerUnit)}</p>
                  <p><strong>Minimum Order Quantity:</strong> {selectedQuotation.moq} units</p>
                  {selectedQuotation.inquiryQuantity && selectedQuotation.inquiryQuantity !== selectedQuotation.moq && (
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      <strong>Note:</strong> You requested {selectedQuotation.inquiryQuantity} units, supplier's MOQ is {selectedQuotation.moq} units
                    </p>
                  )}
                  <p><strong>Total Price (at MOQ):</strong> <span className="text-green-600 dark:text-green-400 font-bold">{formatPrice(selectedQuotation.totalPrice)}</span></p>
                  {selectedQuotation.inquiryQuantity && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Estimated at your quantity ({selectedQuotation.inquiryQuantity} units): {formatPrice(selectedQuotation.pricePerUnit * selectedQuotation.inquiryQuantity)}
                    </p>
                  )}
                  <p><strong>Lead Time:</strong> {selectedQuotation.leadTime}</p>
                  <p><strong>Payment Terms:</strong> {selectedQuotation.paymentTerms}</p>
                  <p><strong>Valid Until:</strong> {formatDate(selectedQuotation.validUntil)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Quotation created: {formatDate(selectedQuotation.createdAt)}
                  </p>
                </div>
              </div>

              {selectedQuotation.message && (
                <div>
                  <h4 className="font-semibold mb-2">Supplier Message</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm">{selectedQuotation.message}</p>
                  </div>
                </div>
              )}

              {selectedQuotation.inquiryMessage && (
                <div>
                  <h4 className="font-semibold mb-2">Your Original Inquiry</h4>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm">{selectedQuotation.inquiryMessage}</p>
                    {selectedQuotation.inquiryQuantity && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        Requested Quantity: {selectedQuotation.inquiryQuantity} units
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedQuotation.attachments && selectedQuotation.attachments.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Attachments</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="space-y-2">
                      {selectedQuotation.attachments.map((attachment: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-600" />
                          <span className="text-sm">Attachment {idx + 1}</span>
                          <Button size="sm" variant="outline" className="ml-auto">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Status</h4>
                <Badge className={getStatusColor(selectedQuotation.status)}>
                  {getStatusIcon(selectedQuotation.status)}
                  {selectedQuotation.status}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

