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
  X
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
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>RFQ</span>
              <span>/</span>
              <span>{getCategoryName(rfq.categoryId)}</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-3">{rfq.title}</h1>
                <div className="flex flex-wrap gap-3 text-sm">
                  <Badge variant="outline" className="gap-1">
                    <FileText className="w-3 h-3" />
                    {rfq.id}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="w-3 h-3" />
                    Posted {formatDate(rfq.createdAt)}
                  </Badge>
                  <Badge className={rfq.status === 'open' ? 'bg-green-600' : 'bg-gray-600'}>
                    <Clock className="w-3 h-3 mr-1" />
                    {rfq.status?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>RFQ Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Quantity</p>
                      <p className="font-semibold flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {rfq.quantity?.toLocaleString()} units
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Target Budget</p>
                      <p className="font-semibold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        {formatPrice(rfq.targetPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Delivery Location</p>
                      <p className="font-semibold flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {rfq.deliveryLocation}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Expected Delivery</p>
                      <p className="font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(rfq.expectedDate)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Description</h3>
                    <div className="whitespace-pre-line text-muted-foreground bg-muted p-4 rounded-lg">
                      {rfq.description}
                    </div>
                  </div>

                  {rfq.attachments && rfq.attachments.length > 0 && (
                  <div>
                      <h3 className="font-semibold mb-3">Attached Documents</h3>
                      <div className="space-y-2">
                        {rfq.attachments.map((attachment: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <FileText className="w-4 h-4 text-gray-600" />
                            <a 
                              href={attachment} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              Document {index + 1}
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
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                  ) : quotations.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Quotations Yet</h3>
                        <p className="text-gray-600">
                          The admin hasn't submitted any quotations for this RFQ yet.
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
                                  <p className="text-muted-foreground mb-4 p-3 bg-blue-50 rounded-lg">{quote.message}</p>
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
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Your Information</CardTitle>
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
