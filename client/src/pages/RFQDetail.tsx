import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  MapPin, 
  Calendar, 
  Package, 
  FileText, 
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  DollarSign,
  Loader2,
  Check,
  X,
  User
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function RFQDetail() {
  const [, params] = useRoute("/rfq/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const rfqId = params?.id;

  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');

  // Fetch RFQ details
  const { data: rfq, isLoading: rfqLoading } = useQuery({
    queryKey: [`/api/rfqs/${rfqId}`],
    queryFn: async () => {
      const response = await fetch(`/api/rfqs/${rfqId}`);
      if (!response.ok) throw new Error('Failed to fetch RFQ');
      return response.json();
    },
    enabled: !!rfqId
  });

  // Fetch quotations for this RFQ
  const { data: quotationsData, isLoading: quotationsLoading } = useQuery({
    queryKey: [`/api/quotations?rfqId=${rfqId}`],
    queryFn: async () => {
      const response = await fetch(`/api/quotations?rfqId=${rfqId}`);
      if (!response.ok) throw new Error('Failed to fetch quotations');
      return response.json();
    },
    enabled: !!rfqId
  });

  const quotations = quotationsData || [];

  // Fetch categories for display
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories?isActive=true');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  // Helper function to get category name
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat: any) => cat.id === categoryId);
    return category ? category.name : categoryId || 'General';
  };

  // Accept quotation mutation
  const acceptQuotationMutation = useMutation({
    mutationFn: async ({ quotationId, shippingAddress }: any) => {
      const response = await fetch(`/api/quotations/${quotationId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingAddress })
      });
      if (!response.ok) throw new Error('Failed to accept quotation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rfqs/${rfqId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/quotations?rfqId=${rfqId}`] });
      setIsAcceptDialogOpen(false);
      toast.success('Quotation accepted! Admin will create an order for your approval.');
      setLocation('/buyer/quotations');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to accept quotation');
    }
  });

  // Reject quotation mutation
  const rejectQuotationMutation = useMutation({
    mutationFn: async ({ quotationId, reason }: any) => {
      const response = await fetch(`/api/quotations/${quotationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (!response.ok) throw new Error('Failed to reject quotation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rfqs/${rfqId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/quotations?rfqId=${rfqId}`] });
      setIsRejectDialogOpen(false);
      toast.success('Quotation rejected');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject quotation');
    }
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (!numPrice) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numPrice);
  };

  const handleAcceptQuotation = (quotation: any) => {
    setSelectedQuotation(quotation);
    setIsAcceptDialogOpen(true);
  };

  const handleRejectQuotation = (quotation: any) => {
    setSelectedQuotation(quotation);
    setIsRejectDialogOpen(true);
  };

  const confirmAccept = () => {
    if (!shippingAddress.trim()) {
      toast.error('Please provide a shipping address');
      return;
    }
    acceptQuotationMutation.mutate({
      quotationId: selectedQuotation.id,
      shippingAddress
    });
  };

  const confirmReject = () => {
    rejectQuotationMutation.mutate({
      quotationId: selectedQuotation.id,
      reason: rejectionReason
    });
  };

  if (rfqLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-orange-600" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">RFQ not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-brand-orange-50">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-brand-orange-600 via-brand-orange-700 to-brand-orange-800 text-white py-12 lg:py-16 overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-40 -translate-x-40"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Request for Quotation</span>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-brand-orange-100 bg-clip-text text-transparent">
                {rfq.title}
              </h1>
              
              <div className="flex flex-wrap justify-center gap-4 mb-6">
                <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
                  <FileText className="w-4 h-4 mr-2" />
                  {rfq.id}
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  Posted {formatDate(rfq.createdAt)}
                </Badge>
                <Badge className={`px-4 py-2 ${rfq.status === 'open' ? 'bg-green-500' : 'bg-gray-500'}`}>
                  <Clock className="w-4 h-4 mr-2" />
                  {rfq.status?.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - RFQ Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* RFQ Details Card */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-10 h-10 bg-brand-orange-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-brand-orange-600" />
                    </div>
                    RFQ Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-brand-orange-50 to-brand-orange-100 rounded-xl">
                      <div className="w-10 h-10 bg-brand-orange-500 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-brand-orange-600 font-medium">Quantity</p>
                        <p className="text-lg font-bold text-brand-orange-900">{rfq.quantity?.toLocaleString()} units</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-green-600 font-medium">Target Budget</p>
                        <p className="text-lg font-bold text-green-900">{formatPrice(rfq.targetPrice)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                      <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Delivery Location</p>
                        <p className="text-lg font-bold text-purple-900">{rfq.deliveryLocation}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl">
                      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-orange-600 font-medium">Expected Delivery</p>
                        <p className="text-lg font-bold text-orange-900">{formatDate(rfq.expectedDate)}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-600" />
                      Description
                    </h3>
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{rfq.description}</p>
                    </div>
                  </div>

                  {rfq.attachments && rfq.attachments.length > 0 && (
                    <div>
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-600" />
                        Attached Documents
                      </h3>
                      <div className="space-y-3">
                        {rfq.attachments.map((attachment: string, index: number) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-brand-orange-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-brand-orange-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Document {index + 1}</p>
                                <p className="text-sm text-gray-500">Attachment</p>
                              </div>
                            </div>
                            <a 
                              href={attachment} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-brand-orange-600 hover:text-brand-orange-700 text-sm font-medium"
                            >
                              View Document
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Tabs defaultValue="quotations">
                <TabsList>
                  <TabsTrigger value="quotations" data-testid="tab-quotations">
                    Quotations ({quotations.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="quotations" className="mt-6">
                  {quotationsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-brand-orange-600" />
                    </div>
                  ) : quotations.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MessageSquare className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Quotations Yet</h3>
                        <p className="text-gray-600">
                          Admins haven't submitted any quotations for this RFQ yet.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                  <div className="space-y-4">
                      {quotations.map((quote: any) => (
                      <Card key={quote.id} data-testid={`quotation-${quote.id}`}>
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-start gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                  AD
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                                <div>
                                    <h4 className="font-semibold text-lg">Admin Supplier</h4>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                      <Badge className="bg-green-600 text-xs">Verified</Badge>
                                      <Badge className={
                                        quote.status === 'pending' ? 'bg-yellow-600' :
                                        quote.status === 'accepted' ? 'bg-green-600' :
                                        quote.status === 'rejected' ? 'bg-red-600' : 'bg-gray-600'
                                      }>
                                        {quote.status?.toUpperCase()}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-primary">
                                      {formatPrice(quote.pricePerUnit)}/unit
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Total: {formatPrice(quote.totalPrice)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatDate(quote.createdAt)}
                                    </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 p-3 bg-muted rounded-lg">
                                <div>
                                  <div className="text-xs text-muted-foreground">MOQ</div>
                                    <div className="font-medium">{quote.moq?.toLocaleString()} units</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Lead Time</div>
                                    <div className="font-medium">{quote.leadTime || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Payment Terms</div>
                                    <div className="font-medium">{quote.paymentTerms || 'N/A'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Valid Until</div>
                                    <div className="font-medium">{formatDate(quote.validUntil)}</div>
                                  </div>
                              </div>

                                {quote.message && (
                                  <p className="text-muted-foreground mb-4 p-3 bg-brand-orange-50 rounded-lg">{quote.message}</p>
                                )}

                                {quote.status === 'pending' && user?.role === 'buyer' && (
                              <div className="flex gap-2">
                                    <Button 
                                      onClick={() => handleAcceptQuotation(quote)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Check className="w-4 h-4 mr-2" />
                                      Accept Quotation
                                </Button>
                                    <Button 
                                      variant="outline"
                                      onClick={() => handleRejectQuotation(quote)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <X className="w-4 h-4 mr-2" />
                                      Reject
                                </Button>
                                  </div>
                                )}

                                {quote.status === 'accepted' && (
                                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-800 font-medium">
                                      ✓ Quotation accepted. Admin will create an order for your approval.
                                    </p>
                                  </div>
                                )}

                                {quote.status === 'rejected' && quote.rejectionReason && (
                                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-800 font-medium">
                                      Rejection Reason: {quote.rejectionReason}
                                    </p>
                                  </div>
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
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24 bg-gradient-to-br from-white to-gray-50 border-gray-100 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-600" />
                    Your Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user?.firstName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{user?.firstName} {user?.lastName}</h4>
                      <p className="text-sm text-muted-foreground">Buyer</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge className={rfq.status === 'open' ? 'bg-green-600' : 'bg-gray-600'}>
                        {rfq.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Quotations</span>
                      <span className="text-sm font-medium">{rfq.quotationsCount || 0}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => setLocation('/buyer/rfqs')}
                  >
                    Back to My RFQs
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Accept Dialog */}
      <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Quotation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please provide your shipping address to proceed with this quotation.
            </p>
            <div>
              <Label htmlFor="shipping-address">Shipping Address *</Label>
              <Textarea
                id="shipping-address"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Enter your complete shipping address..."
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAcceptDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmAccept}
              disabled={acceptQuotationMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {acceptQuotationMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Accepting...</>
              ) : (
                'Accept Quotation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Quotation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please provide a reason for rejecting this quotation (optional).
            </p>
            <div>
              <Label htmlFor="rejection-reason">Reason</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Price too high, lead time too long..."
                rows={3}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmReject}
              disabled={rejectQuotationMutation.isPending}
              variant="destructive"
            >
              {rejectQuotationMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Rejecting...</>
              ) : (
                'Reject Quotation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
