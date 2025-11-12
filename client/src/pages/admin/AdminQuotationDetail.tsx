import { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Breadcrumb from '@/components/Breadcrumb';
import { 
  ArrowLeft,
  Package,
  DollarSign,
  Calendar,
  MapPin,
  FileText,
  User,
  Mail,
  Building,
  Globe,
  Phone,
  Clock,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  MessageSquare,
  Download,
  Image as ImageIcon,
  ShoppingBag,
  Edit,
  History,
  Truck,
  Info,
  AlertTriangle
} from 'lucide-react';

export default function AdminQuotationDetail() {
  const [, params] = useRoute("/admin/quotations/:id");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const quotationId = params?.id;

  const [isNegotiationDialogOpen, setIsNegotiationDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [negotiationForm, setNegotiationForm] = useState({
    message: '',
    newPrice: '',
    newLeadTime: '',
    newPaymentTerms: '',
    isFinalOffer: false,
    urgency: 'normal'
  });
  const [negotiationHistory, setNegotiationHistory] = useState<any[]>([]);

  // Fetch quotation details
  const { data: quotation, isLoading: quotationLoading } = useQuery({
    queryKey: [`/api/admin/quotations/${quotationId}`],
    queryFn: async () => {
      const response = await fetch(`/api/admin/quotations/${quotationId}`);
      if (!response.ok) throw new Error('Failed to fetch quotation');
      const data = await response.json();
      return data.quotation || data;
    },
    enabled: !!quotationId
  });

  // Fetch buyer information
  const { data: buyer } = useQuery({
    queryKey: ['/api/users', quotation?.buyerId],
    queryFn: async () => {
      if (!quotation?.buyerId) return null;
      const response = await fetch(`/api/users/${quotation.buyerId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!quotation?.buyerId
  });

  // Fetch product details (for inquiry quotations)
  const { data: product } = useQuery({
    queryKey: ['/api/products', quotation?.productId],
    queryFn: async () => {
      if (!quotation?.productId) return null;
      const response = await fetch(`/api/products/${quotation.productId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!quotation?.productId && quotation?.type === 'inquiry'
  });

  // Fetch RFQ details (for RFQ quotations)
  const { data: rfq } = useQuery({
    queryKey: ['/api/rfqs', quotation?.rfqId],
    queryFn: async () => {
      if (!quotation?.rfqId) return null;
      const response = await fetch(`/api/rfqs/${quotation.rfqId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!quotation?.rfqId && quotation?.type === 'rfq'
  });

  // Fetch inquiry details (for inquiry quotations)
  const { data: inquiry } = useQuery({
    queryKey: ['/api/inquiries', quotation?.inquiryId],
    queryFn: async () => {
      if (!quotation?.inquiryId) return null;
      const response = await fetch(`/api/admin/inquiries`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.inquiries?.find((i: any) => i.id === quotation.inquiryId);
    },
    enabled: !!quotation?.inquiryId && quotation?.type === 'inquiry'
  });

  // Helper functions
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'negotiating':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'counter_offered':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'revised':
        return 'bg-orange-600 text-orange-600 border-orange-600';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'negotiating':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Fetch negotiation history
  const fetchNegotiationHistory = async () => {
    if (!quotation) return;
    
    try {
      let response;
      if (quotation.type === 'rfq' && quotation.rfqId) {
        response = await fetch(`/api/rfqs/${quotation.rfqId}/quotations`);
        if (response.ok) {
          const data = await response.json();
          const revisions = (data.quotations || []).map((q: any, index: number) => ({
            id: q.id,
            revisionNumber: (data.quotations || []).length - index,
            quantity: q.moq,
            targetPrice: q.pricePerUnit,
            message: q.message,
            status: q.status,
            createdBy: q.supplierId ? 'admin' : 'buyer',
            createdAt: q.createdAt,
            pricePerUnit: q.pricePerUnit,
            totalPrice: q.totalPrice,
            leadTime: q.leadTime,
            paymentTerms: q.paymentTerms
          }));
          setNegotiationHistory(revisions);
          setIsHistoryDialogOpen(true);
        }
      } else if (quotation.type === 'inquiry' && quotation.inquiryId) {
        response = await fetch(`/api/inquiries/${quotation.inquiryId}/revisions`);
        if (response.ok) {
          const data = await response.json();
          setNegotiationHistory(data.revisions || []);
          setIsHistoryDialogOpen(true);
        }
      }
    } catch (error) {
      toast.error('Failed to fetch negotiation history');
    }
  };

  // Send revised quotation mutation
  const sendRevisedQuotationMutation = useMutation({
    mutationFn: async (revisionData: any) => {
      if (!quotation) throw new Error('No quotation selected');
      
      const quantity = quotation.quantity || quotation.inquiryQuantity || 1;
      const pricePerUnit = parseFloat(revisionData.newPrice);
      const totalPrice = pricePerUnit * quantity;
      
      let response;
      
      if (quotation.type === 'rfq' && quotation.rfqId) {
        response = await fetch(`/api/admin/rfqs/${quotation.rfqId}/revised-quotation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pricePerUnit,
            totalPrice,
            moq: quotation.moq || quantity,
            leadTime: revisionData.newLeadTime,
            paymentTerms: revisionData.newPaymentTerms,
            message: revisionData.message
          }),
          credentials: 'include'
        });
      } else if (quotation.type === 'inquiry' && quotation.inquiryId) {
        response = await fetch(`/api/admin/inquiries/${quotation.inquiryId}/revised-quotation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quotation: {
              pricePerUnit,
              totalPrice,
              moq: quotation.moq || quantity,
              leadTime: revisionData.newLeadTime,
              paymentTerms: revisionData.newPaymentTerms,
              message: revisionData.message
            }
          }),
          credentials: 'include'
        });
      } else {
        throw new Error('Invalid quotation type');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to send revised quotation' }));
        throw new Error(errorData.error || 'Failed to send revised quotation');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Revised quotation sent successfully!');
      queryClient.invalidateQueries({ queryKey: [`/api/admin/quotations/${quotationId}`] });
      setIsNegotiationDialogOpen(false);
      setNegotiationForm({ message: '', newPrice: '', newLeadTime: '', newPaymentTerms: '', isFinalOffer: false, urgency: 'normal' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send revised quotation');
    }
  });

  const handleStartNegotiation = () => {
    if (!quotation) return;
    setNegotiationForm({
      message: '',
      newPrice: quotation.pricePerUnit?.toString() || '',
      newLeadTime: quotation.leadTime || '',
      newPaymentTerms: quotation.paymentTerms || '',
      isFinalOffer: false,
      urgency: 'normal'
    });
    setIsNegotiationDialogOpen(true);
  };

  const handleSendRevisedQuotation = () => {
    if (!quotation || !negotiationForm.newPrice) {
      toast.error('Please fill in all required fields');
      return;
    }
    sendRevisedQuotationMutation.mutate(negotiationForm);
  };

  if (quotationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading quotation...</p>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Quotation not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto p-6">
        {/* Breadcrumb */}
        <Breadcrumb 
          items={[
            { label: "Quotations", href: "/admin/quotations" },
            { label: `Quotation ${quotation.id?.slice(0, 8)}...` }
          ]} 
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin/quotations")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Quotations
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {quotation.type === 'rfq' ? (quotation.rfqTitle || 'RFQ Quotation') : (quotation.productName || 'Inquiry Quotation')}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(quotation.status)}>
                  {getStatusIcon(quotation.status)}
                  <span className="ml-1">{quotation.status}</span>
                </Badge>
                <Badge variant={quotation.type === 'rfq' ? 'default' : 'secondary'}>
                  {quotation.type === 'rfq' ? 'RFQ Quotation' : 'Inquiry Quotation'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quotation Details */}
            <Card>
              <CardHeader>
                <CardTitle>Quotation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Price per Unit</Label>
                    <p className="text-lg font-semibold">{formatPrice(quotation.pricePerUnit)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Total Price</Label>
                    <p className="text-lg font-semibold">{formatPrice(quotation.totalPrice)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">MOQ</Label>
                    <p className="text-lg font-semibold">{quotation.moq || quotation.inquiryQuantity || quotation.quantity || 'N/A'} units</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Status</Label>
                    <Badge className={getStatusColor(quotation.status)}>
                      {quotation.status}
                    </Badge>
                  </div>
                  {quotation.leadTime && (
                    <div>
                      <Label className="text-sm text-gray-600">Lead Time</Label>
                      <p className="text-lg font-semibold">{quotation.leadTime}</p>
                    </div>
                  )}
                  {quotation.paymentTerms && (
                    <div>
                      <Label className="text-sm text-gray-600">Payment Terms</Label>
                      <p className="text-lg font-semibold">{quotation.paymentTerms}</p>
                    </div>
                  )}
                  {quotation.validUntil && (
                    <div>
                      <Label className="text-sm text-gray-600">Valid Until</Label>
                      <p className="text-lg font-semibold">{formatDate(quotation.validUntil)}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm text-gray-600">Created At</Label>
                    <p className="text-lg font-semibold">{formatDate(quotation.createdAt)}</p>
                  </div>
                </div>

                {quotation.message && (
                  <div className="mt-4 pt-4 border-t">
                    <Label className="text-sm text-gray-600 mb-2 block">Message</Label>
                    <p className="text-gray-700 dark:text-gray-300">{quotation.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Source Information */}
            {quotation.type === 'rfq' && rfq && (
              <Card>
                <CardHeader>
                  <CardTitle>RFQ Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-600">RFQ Title</Label>
                    <p className="text-lg font-semibold">{rfq.title || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">RFQ Description</Label>
                    <p className="text-gray-700 dark:text-gray-300">{rfq.description || 'N/A'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Target Price</Label>
                      <p className="text-lg font-semibold">{formatPrice(rfq.targetPrice)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Quantity</Label>
                      <p className="text-lg font-semibold">{rfq.quantity || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {quotation.type === 'inquiry' && (product || inquiry) && (
              <Card>
                <CardHeader>
                  <CardTitle>{product ? 'Product Information' : 'Inquiry Information'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {product && (
                    <>
                      <div>
                        <Label className="text-sm text-gray-600">Product Name</Label>
                        <p className="text-lg font-semibold">{product.name || 'N/A'}</p>
                      </div>
                      {product.images && product.images.length > 0 && (
                        <div>
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </>
                  )}
                  {inquiry && (
                    <>
                      <div>
                        <Label className="text-sm text-gray-600">Target Price</Label>
                        <p className="text-lg font-semibold">{formatPrice(inquiry.targetPrice)}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Quantity</Label>
                        <p className="text-lg font-semibold">{inquiry.quantity || 'N/A'}</p>
                      </div>
                      {inquiry.message && (
                        <div>
                          <Label className="text-sm text-gray-600">Inquiry Message</Label>
                          <p className="text-gray-700 dark:text-gray-300">{inquiry.message}</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Buyer & Actions */}
          <div className="space-y-6">
            {/* Buyer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Buyer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {buyer && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{buyer.firstName} {buyer.lastName}</p>
                        <p className="text-sm text-gray-600">{buyer.companyName || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{buyer.email}</span>
                      </div>
                      {buyer.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{buyer.phone}</span>
                        </div>
                      )}
                      {buyer.country && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <span>{buyer.country}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {['pending', 'counter_offered', 'negotiating'].includes(quotation.status) && (
                  <Button
                    className="w-full"
                    onClick={handleStartNegotiation}
                    variant="default"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Negotiate
                  </Button>
                )}
                {(quotation.inquiryId || quotation.rfqId) && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={fetchNegotiationHistory}
                  >
                    <History className="h-4 w-4 mr-2" />
                    View History
                  </Button>
                )}
                {quotation.status === 'accepted' && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setLocation('/admin/orders')}
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    View Order
                  </Button>
                )}
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setLocation('/messages')}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message Buyer
                </Button>
              </CardContent>
            </Card>

            {/* Status Information */}
            {quotation.status === 'accepted' && (
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="font-semibold text-green-700 dark:text-green-400">Quotation Accepted</p>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    This quotation has been accepted by the buyer. Order has been created.
                  </p>
                </CardContent>
              </Card>
            )}

            {quotation.status === 'rejected' && (
              <Card className="bg-red-50 dark:bg-red-900/20 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <p className="font-semibold text-red-700 dark:text-red-400">Quotation Rejected</p>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-500">
                    This quotation has been rejected by the buyer.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Negotiation Dialog */}
      <Dialog open={isNegotiationDialogOpen} onOpenChange={setIsNegotiationDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Send Revised Quotation
            </DialogTitle>
            <DialogDescription>
              Respond to buyer's counter-offer or send a revised quotation with better terms.
            </DialogDescription>
          </DialogHeader>
          {quotation && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>New Price per Unit ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter revised price"
                    value={negotiationForm.newPrice}
                    onChange={(e) => setNegotiationForm({...negotiationForm, newPrice: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Urgency Level</Label>
                  <Select value={negotiationForm.urgency} onValueChange={(value) => setNegotiationForm({...negotiationForm, urgency: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Flexible timeline</SelectItem>
                      <SelectItem value="normal">Normal - Standard timeline</SelectItem>
                      <SelectItem value="high">High - Rush order</SelectItem>
                      <SelectItem value="urgent">Urgent - ASAP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Revised Lead Time</Label>
                  <Input
                    placeholder="e.g., 2-3 weeks"
                    value={negotiationForm.newLeadTime}
                    onChange={(e) => setNegotiationForm({...negotiationForm, newLeadTime: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Revised Payment Terms</Label>
                  <Input
                    placeholder="e.g., 30% advance, 70% on delivery"
                    value={negotiationForm.newPaymentTerms}
                    onChange={(e) => setNegotiationForm({...negotiationForm, newPaymentTerms: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Message to Buyer</Label>
                <Textarea
                  placeholder="Explain your revised quotation, reasoning, and any special conditions..."
                  value={negotiationForm.message}
                  onChange={(e) => setNegotiationForm({...negotiationForm, message: e.target.value})}
                  rows={4}
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="final-offer"
                  checked={negotiationForm.isFinalOffer}
                  onChange={(e) => setNegotiationForm({...negotiationForm, isFinalOffer: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="final-offer">This is a final offer - no further negotiation</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNegotiationDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendRevisedQuotation}
              disabled={!negotiationForm.newPrice || sendRevisedQuotationMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {sendRevisedQuotationMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Revised Quotation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-purple-600" />
              Negotiation History
            </DialogTitle>
            <DialogDescription>
              Complete timeline of negotiations and revisions for this quotation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {negotiationHistory.length > 0 ? (
              negotiationHistory.map((revision: any) => (
                <div key={revision.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">Revision #{revision.revisionNumber}</h4>
                      <p className="text-sm text-gray-600">{formatDate(revision.createdAt)}</p>
                    </div>
                    <Badge className={getStatusColor(revision.status)}>
                      {revision.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <span className="text-sm text-gray-600">Quantity:</span>
                      <span className="ml-2 font-medium">{revision.quantity?.toLocaleString() || revision.moq?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Price per Unit:</span>
                      <span className="ml-2 font-medium">{formatPrice(revision.pricePerUnit || revision.targetPrice)}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Total Price:</span>
                      <span className="ml-2 font-medium">{formatPrice(revision.totalPrice)}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Created By:</span>
                      <span className="ml-2 font-medium">{revision.createdBy === 'admin' ? 'Admin' : 'Buyer'}</span>
                    </div>
                  </div>
                  {revision.message && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700"><strong>Message:</strong> {revision.message}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Negotiation History</h3>
                <p className="text-gray-600">This quotation hasn't been negotiated yet.</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
