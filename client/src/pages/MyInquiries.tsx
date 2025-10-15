import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  DollarSign, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Eye,
  Edit,
  Send,
  History
} from 'lucide-react';

interface Inquiry {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  targetPrice: number | null;
  message: string;
  requirements: string;
  status: 'pending' | 'replied' | 'negotiating' | 'closed';
  createdAt: string;
  quotations?: Quotation[];
  revisions?: InquiryRevision[];
}

interface Quotation {
  id: string;
  inquiryId: string;
  pricePerUnit: number;
  totalPrice: number;
  moq: number;
  leadTime: string;
  paymentTerms: string;
  validUntil: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface InquiryRevision {
  id: string;
  inquiryId: string;
  revisionNumber: number;
  quantity: number;
  targetPrice: number | null;
  message: string;
  requirements: string;
  status: string;
  createdBy: string;
  creatorName: string;
  createdAt: string;
}

export default function MyInquiries() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);
  const [isCounterOfferOpen, setIsCounterOfferOpen] = useState(false);
  const [counterOfferForm, setCounterOfferForm] = useState({
    quantity: '',
    targetPrice: '',
    message: '',
    requirements: ''
  });

  const queryClient = useQueryClient();

  // Fetch inquiries
  const { data: inquiries = [], isLoading, error } = useQuery({
    queryKey: ['inquiries'],
    queryFn: async () => {
      const response = await fetch('/api/inquiries');
      const data = await response.json();
      return data;
    }
  });

  // Fetch inquiry revisions
  const { data: revisions = [] } = useQuery({
    queryKey: ['inquiry-revisions', selectedInquiry?.id],
    queryFn: async () => {
      if (!selectedInquiry) return [];
      const response = await fetch(`/api/inquiries/${selectedInquiry.id}/revisions`);
      const data = await response.json();
      return data.revisions || [];
    },
    enabled: !!selectedInquiry
  });

  // Accept quotation mutation
  const acceptQuotationMutation = useMutation({
    mutationFn: async ({ inquiryId, quotationId }: { inquiryId: string; quotationId: string }) => {
      const response = await fetch(`/api/inquiries/${inquiryId}/accept-quotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotationId })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsNegotiationOpen(false);
    }
  });

  // Reject quotation mutation
  const rejectQuotationMutation = useMutation({
    mutationFn: async ({ inquiryId, quotationId }: { inquiryId: string; quotationId: string }) => {
      const response = await fetch(`/api/inquiries/${inquiryId}/reject-quotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotationId })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    }
  });

  // Counter offer mutation
  const counterOfferMutation = useMutation({
    mutationFn: async ({ inquiryId, formData }: { inquiryId: string; formData: any }) => {
      const response = await fetch(`/api/inquiries/${inquiryId}/counter-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['inquiry-revisions'] });
      setIsCounterOfferOpen(false);
      setCounterOfferForm({ quantity: '', targetPrice: '', message: '', requirements: '' });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'replied': return 'bg-blue-100 text-blue-800';
      case 'negotiating': return 'bg-orange-100 text-orange-800';
      case 'closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'replied': return <MessageSquare className="w-4 h-4" />;
      case 'negotiating': return <Edit className="w-4 h-4" />;
      case 'closed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
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

  const filteredInquiries = inquiries.filter((inquiry: Inquiry) => {
    const matchesSearch = (inquiry.productName?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                         (inquiry.message?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchesStatus = activeTab === 'all' || inquiry.status === activeTab;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: inquiries.length,
    pending: inquiries.filter((i: Inquiry) => i.status === 'pending').length,
    replied: inquiries.filter((i: Inquiry) => i.status === 'replied').length,
    negotiating: inquiries.filter((i: Inquiry) => i.status === 'negotiating').length,
    closed: inquiries.filter((i: Inquiry) => i.status === 'closed').length
  };

  const handleViewNegotiation = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setIsNegotiationOpen(true);
  };

  const handleCounterOffer = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setCounterOfferForm({
      quantity: inquiry.quantity.toString(),
      targetPrice: inquiry.targetPrice?.toString() || '',
      message: '',
      requirements: inquiry.requirements || ''
    });
    setIsCounterOfferOpen(true);
  };

  const handleAcceptQuotation = (quotation: Quotation) => {
    if (selectedInquiry) {
      acceptQuotationMutation.mutate({
        inquiryId: selectedInquiry.id,
        quotationId: quotation.id
      });
    }
  };

  const handleRejectQuotation = (quotation: Quotation) => {
    if (selectedInquiry) {
      rejectQuotationMutation.mutate({
        inquiryId: selectedInquiry.id,
        quotationId: quotation.id
      });
    }
  };

  const handleSubmitCounterOffer = () => {
    if (selectedInquiry) {
      counterOfferMutation.mutate({
        inquiryId: selectedInquiry.id,
        formData: counterOfferForm
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading inquiries...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">Error loading inquiries</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Inquiries</h1>
          <p className="text-gray-600">Manage your product inquiries and negotiations</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <MessageSquare className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Replied</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.replied}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Edit className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Negotiating</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.negotiating}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Closed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.closed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search inquiries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="replied">Replied ({stats.replied})</TabsTrigger>
            <TabsTrigger value="negotiating">Negotiating ({stats.negotiating})</TabsTrigger>
            <TabsTrigger value="closed">Closed ({stats.closed})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredInquiries.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No inquiries found</h3>
                  <p className="text-gray-600">Start by sending an inquiry for a product you're interested in.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredInquiries.map((inquiry: Inquiry) => (
                  <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <img
                              src={inquiry.productImage || '/placeholder-product.jpg'}
                              alt={inquiry.productName}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">{inquiry.productName}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={getStatusColor(inquiry.status)}>
                                  {getStatusIcon(inquiry.status)}
                                  <span className="ml-1 capitalize">{inquiry.status}</span>
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600">Quantity</p>
                              <p className="font-medium">{inquiry.quantity.toLocaleString()} units</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Target Price</p>
                              <p className="font-medium">
                                {inquiry.targetPrice ? formatPrice(inquiry.targetPrice) : 'Not specified'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Created</p>
                              <p className="font-medium">{formatDate(inquiry.createdAt)}</p>
                            </div>
                          </div>

                          {inquiry.message && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-600">Message</p>
                              <p className="text-gray-900">{inquiry.message}</p>
                            </div>
                          )}

                          {inquiry.requirements && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-600">Requirements</p>
                              <p className="text-gray-900">{inquiry.requirements}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewNegotiation(inquiry)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          
                          {inquiry.status === 'replied' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCounterOffer(inquiry)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Counter Offer
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Negotiation Dialog */}
        <Dialog open={isNegotiationOpen} onOpenChange={setIsNegotiationOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Negotiation History
              </DialogTitle>
            </DialogHeader>
            
            {selectedInquiry && (
              <div className="space-y-6">
                {/* Inquiry Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Original Inquiry</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Product</p>
                        <p className="font-medium">{selectedInquiry.productName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Quantity</p>
                        <p className="font-medium">{selectedInquiry.quantity.toLocaleString()} units</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Target Price</p>
                        <p className="font-medium">
                          {selectedInquiry.targetPrice ? formatPrice(selectedInquiry.targetPrice) : 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <Badge className={getStatusColor(selectedInquiry.status)}>
                          {getStatusIcon(selectedInquiry.status)}
                          <span className="ml-1 capitalize">{selectedInquiry.status}</span>
                        </Badge>
                      </div>
                    </div>
                    {selectedInquiry.message && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600">Message</p>
                        <p className="text-gray-900">{selectedInquiry.message}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Revisions History */}
                {revisions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Negotiation History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {revisions.map((revision: InquiryRevision) => (
                          <div key={revision.id} className="border-l-4 border-blue-200 pl-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">Revision #{revision.revisionNumber}</h4>
                              <span className="text-sm text-gray-500">{formatDate(revision.createdAt)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Quantity</p>
                                <p className="font-medium">{revision.quantity.toLocaleString()} units</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Target Price</p>
                                <p className="font-medium">
                                  {revision.targetPrice ? formatPrice(revision.targetPrice) : 'Not specified'}
                                </p>
                              </div>
                            </div>
                            {revision.message && (
                              <div className="mt-2">
                                <p className="text-gray-600 text-sm">Message</p>
                                <p className="text-sm">{revision.message}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quotations */}
                {selectedInquiry.quotations && selectedInquiry.quotations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quotations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedInquiry.quotations.map((quotation: Quotation) => (
                          <div key={quotation.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium">Quotation #{quotation.id.slice(-8)}</h4>
                              <Badge className={
                                quotation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                quotation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }>
                                {quotation.status}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-sm text-gray-600">Price per Unit</p>
                                <p className="font-medium text-lg">{formatPrice(quotation.pricePerUnit)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Total Price</p>
                                <p className="font-medium text-lg">{formatPrice(quotation.totalPrice)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">MOQ</p>
                                <p className="font-medium">{quotation.moq.toLocaleString()} units</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Lead Time</p>
                                <p className="font-medium">{quotation.leadTime}</p>
                              </div>
                            </div>

                            {quotation.message && (
                              <div className="mb-3">
                                <p className="text-sm text-gray-600">Message</p>
                                <p className="text-sm">{quotation.message}</p>
                              </div>
                            )}

                            {quotation.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptQuotation(quotation)}
                                  disabled={acceptQuotationMutation.isPending}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRejectQuotation(quotation)}
                                  disabled={rejectQuotationMutation.isPending}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Counter Offer Dialog */}
        <Dialog open={isCounterOfferOpen} onOpenChange={setIsCounterOfferOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send Counter Offer</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <Input
                  type="number"
                  value={counterOfferForm.quantity}
                  onChange={(e) => setCounterOfferForm(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Price (per unit)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={counterOfferForm.targetPrice}
                  onChange={(e) => setCounterOfferForm(prev => ({ ...prev, targetPrice: e.target.value }))}
                  placeholder="Enter target price"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <Textarea
                  value={counterOfferForm.message}
                  onChange={(e) => setCounterOfferForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Explain your counter offer..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Requirements
                </label>
                <Textarea
                  value={counterOfferForm.requirements}
                  onChange={(e) => setCounterOfferForm(prev => ({ ...prev, requirements: e.target.value }))}
                  placeholder="Any additional requirements..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCounterOfferOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitCounterOffer}
                  disabled={counterOfferMutation.isPending || !counterOfferForm.quantity}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Counter Offer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </main>
      <Footer />
    </div>
  );
}
