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
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Package,
  Eye,
  Download,
  Calendar,
  DollarSign,
  Truck,
  ThumbsUp,
  ThumbsDown,
  ShoppingCart,
  X,
  FileText
} from 'lucide-react';

export default function BuyerInquiries() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const queryClient = useQueryClient();

  // Fetch inquiries from API
  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['/api/inquiries', statusFilter, searchQuery, sortBy],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
        if (searchQuery) params.append('search', searchQuery);
        if (sortBy) params.append('sort', sortBy);
        
        const response = await fetch(`/api/inquiries?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch inquiries');
        const data = await response.json();
        return data.inquiries || [];
      } catch (error) {
        console.error('Error fetching inquiries:', error);
        return [];
      }
    }
  });

  // Accept quotation and create order
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
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setIsAcceptDialogOpen(false);
      setShippingAddress('');
      toast.success('Quotation accepted! Order created successfully.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to accept quotation');
    }
  });

  // Reject quotation
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
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
      toast.success('Negotiation request sent to supplier');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send negotiation request');
    }
  });

  const handleAcceptQuotation = (quotation: any, inquiry: any) => {
    setSelectedQuotation({ ...quotation, inquiry });
    setIsAcceptDialogOpen(true);
  };

  const handleRejectQuotation = (quotation: any) => {
    setSelectedQuotation(quotation);
    setIsRejectDialogOpen(true);
  };

  const confirmAcceptQuotation = () => {
    if (!selectedQuotation || !shippingAddress.trim()) {
      toast.error('Please provide a shipping address');
      return;
    }
    
    acceptQuotationMutation.mutate({
      quotationId: selectedQuotation.id,
      inquiryId: selectedQuotation.inquiry.id,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'replied': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'negotiating': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'replied': return CheckCircle;
      case 'pending': return Clock;
      case 'negotiating': return MessageSquare;
      case 'closed': return AlertCircle;
      default: return Clock;
    }
  };

  const filteredInquiries = inquiries.filter((inquiry: any) => {
    const matchesSearch = inquiry.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inquiry.supplierName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              My Inquiries
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track and manage all your product inquiries and quotations
            </p>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by product or supplier..."
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
                      <SelectItem value="replied">Replied</SelectItem>
                      <SelectItem value="negotiating">Negotiating</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
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

          {/* Inquiries List */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading inquiries...</span>
              </div>
            ) : filteredInquiries.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No inquiries found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Start by browsing products and sending inquiries to suppliers.'
                    }
                  </p>
                  <Link href="/products">
                    <Button>
                      Browse Products
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              filteredInquiries.map((inquiry: any) => {
                const StatusIcon = getStatusIcon(inquiry.status);
                return (
                  <Card key={inquiry.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={inquiry.productImage}
                            alt={inquiry.productName}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        </div>

                        {/* Main Content */}
                        <div className="flex-1">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                {inquiry.productName}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Supplier: {inquiry.supplierName} • {inquiry.supplierCountry}
                                {inquiry.supplierVerified && (
                                  <Badge variant="secondary" className="ml-2">
                                    Verified
                                  </Badge>
                                )}
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {inquiry.message}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 mt-4 lg:mt-0">
                              <Badge className={getStatusColor(inquiry.status)}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {formatDate(inquiry.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Inquiry Details */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Package className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Quantity:</span>
                              <span className="font-medium">{inquiry.quantity ? inquiry.quantity.toLocaleString() : '0'} units</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Target Price:</span>
                              <span className="font-medium">{inquiry.targetPrice ? formatPrice(inquiry.targetPrice) : 'Not specified'}/unit</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Sent:</span>
                              <span className="font-medium">{formatDate(inquiry.createdAt)}</span>
                            </div>
                          </div>
                          

                          {/* Quotations */}
                          {inquiry.quotations.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                Quotations Received ({inquiry.quotations.length})
                              </h4>
                              <div className="space-y-2">
                                {inquiry.quotations.map((quotation: any) => (
                                  <div key={quotation.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-start mb-3">
                                      <div>
                                        <span className="font-medium text-green-600 text-lg">
                                          {formatPrice(quotation.pricePerUnit)}/unit
                                        </span>
                                        <span className="text-gray-600 ml-2">
                                          (Total: {formatPrice(quotation.totalPrice)})
                                        </span>
                                        {quotation.status && (
                                          <Badge className="ml-2" variant={
                                            quotation.status === 'accepted' ? 'default' : 
                                            quotation.status === 'rejected' ? 'destructive' : 
                                            'secondary'
                                          }>
                                            {quotation.status}
                                          </Badge>
                                        )}
                                      </div>
                                      <Badge variant="outline" className="text-xs">
                                        Valid until {formatDate(quotation.validUntil)}
                                      </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 mb-3">
                                      <span><strong>MOQ:</strong> {quotation.moq} units</span>
                                      <span><strong>Lead Time:</strong> {quotation.leadTime}</span>
                                      <span><strong>Payment:</strong> {quotation.paymentTerms}</span>
                                      <span><strong>Received:</strong> {formatDate(quotation.createdAt)}</span>
                                    </div>
                                    {quotation.message && (
                                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                                        <strong>Message:</strong> {quotation.message}
                                      </p>
                                    )}
                                    {quotation.attachments && quotation.attachments.length > 0 && (
                                      <div className="mb-3">
                                        <p className="text-xs text-gray-600 mb-1">Attachments:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {quotation.attachments.map((attachment: string, idx: number) => (
                                            <Badge key={idx} variant="outline" className="text-xs">
                                              Attachment {idx + 1}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Action buttons for pending quotations */}
                                    {(!quotation.status || quotation.status === 'pending') && (
                                      <div className="flex gap-2 mt-3">
                                        <Button 
                                          size="sm" 
                                          onClick={() => handleAcceptQuotation(quotation, inquiry)}
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
                                            // Request negotiation - could open a dialog
                                            requestNegotiationMutation.mutate({
                                              inquiryId: inquiry.id,
                                              message: 'I would like to negotiate the terms',
                                              targetPrice: quotation.pricePerUnit * 0.9, // 10% less as example
                                              quantity: inquiry.quantity
                                            });
                                          }}
                                        >
                                          <MessageSquare className="h-4 w-4 mr-2" />
                                          Negotiate
                                        </Button>
                                      </div>
                                    )}
                                    
                                    {quotation.status === 'accepted' && (
                                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                                              <CheckCircle className="h-4 w-4" />
                                              ✓ Quotation Accepted
                                            </p>
                                            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                                              Order has been created and is being processed
                                            </p>
                                          </div>
                                          {quotation.orderId && (
                                            <Link href="/my-orders">
                                              <Button size="sm" variant="outline" className="bg-white">
                                                View Order
                                              </Button>
                                            </Link>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {quotation.status === 'rejected' && (
                                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                        <p className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                                          <AlertCircle className="h-4 w-4" />
                                          ✗ Quotation Rejected
                                        </p>
                                        <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                                          You can send a new negotiation request for better terms
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Requirements and Additional Details */}
                          {inquiry.requirements && (
                            <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                Requirements:
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {inquiry.requirements}
                              </p>
                            </div>
                          )}

                          {/* Inquiry Stats */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {inquiry.quotations.length > 0 && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                                <FileText className="h-3 w-3 mr-1" />
                                {inquiry.quotations.length} {inquiry.quotations.length === 1 ? 'Quotation' : 'Quotations'}
                              </Badge>
                            )}
                            {inquiry.quotations.some((q: any) => q.status === 'accepted') && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Order Created
                              </Badge>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button variant="outline" size="sm">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message Supplier
                            </Button>
                            {inquiry.quotations.length > 0 && (
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Download Quote
                              </Button>
                            )}
                            {inquiry.status === 'replied' && (
                              <Button size="sm">
                                <Truck className="h-4 w-4 mr-2" />
                                Start Order
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {filteredInquiries.length > 0 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="default" size="sm">1</Button>
                <Button variant="outline" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          )}
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
                  <p><strong>Product:</strong> {selectedQuotation.inquiry?.productName}</p>
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
    </div>
  );
}
