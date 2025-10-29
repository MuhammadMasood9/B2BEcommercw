import { useState, useMemo } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  Loader2,
  TrendingUp,
  MessageSquare,
  Download,
  Image as ImageIcon,
  ShoppingBag
} from 'lucide-react';

export default function AdminRFQDetail() {
  const [, params] = useRoute("/admin/rfqs/:id");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const rfqId = params?.id;

  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    pricePerUnit: '',
    moq: '',
    leadTime: '',
    paymentTerms: '',
    validUntil: '',
    message: ''
  });

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

  // Fetch buyer information
  const { data: buyer } = useQuery({
    queryKey: ['/api/users', rfq?.buyerId],
    queryFn: async () => {
      if (!rfq?.buyerId) return null;
      const response = await fetch(`/api/users/${rfq.buyerId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!rfq?.buyerId
  });

  // Fetch buyer profile
  const { data: buyerProfile } = useQuery({
    queryKey: ['/api/buyer/profile', rfq?.buyerId],
    queryFn: async () => {
      if (!rfq?.buyerId) return null;
      try {
        const response = await fetch(`/api/buyer/profile/${rfq.buyerId}`);
        if (!response.ok) return null;
        return response.json();
      } catch {
        return null;
      }
    },
    enabled: !!rfq?.buyerId
  });

  // Fetch product details
  const { data: product } = useQuery({
    queryKey: ['/api/products', rfq?.productId],
    queryFn: async () => {
      if (!rfq?.productId) return null;
      const response = await fetch(`/api/products/${rfq.productId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!rfq?.productId
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories?isActive=true');
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Fetch quotations for this RFQ
  const { data: quotationsData = [] } = useQuery({
    queryKey: [`/api/quotations?rfqId=${rfqId}`],
    queryFn: async () => {
      const response = await fetch(`/api/quotations?rfqId=${rfqId}`);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!rfqId
  });

  const quotations = quotationsData || [];

  // Helper functions
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat: any) => cat.id === categoryId);
    return category ? category.name : categoryId || 'General';
  };

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

  // Send quotation mutation
  const sendQuotationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to send quotation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rfqs/${rfqId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/quotations?rfqId=${rfqId}`] });
      setIsQuoteDialogOpen(false);
      setQuoteForm({
        pricePerUnit: '',
        moq: '',
        leadTime: '',
        paymentTerms: '',
        validUntil: '',
        message: ''
      });
      toast.success('Quotation sent successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send quotation');
    }
  });

  const handleSendQuotation = () => {
    setQuoteForm({
      pricePerUnit: rfq?.targetPrice || '',
      moq: rfq?.quantity?.toString() || '',
      leadTime: '',
      paymentTerms: 'T/T',
      validUntil: '',
      message: ''
    });
    setIsQuoteDialogOpen(true);
  };

  const submitQuotation = () => {
    if (!quoteForm.pricePerUnit || !quoteForm.moq) {
      toast.error('Please fill in all required fields');
      return;
    }

    const totalPrice = parseFloat(quoteForm.pricePerUnit) * parseInt(quoteForm.moq);

    sendQuotationMutation.mutate({
      rfqId: rfqId,
      pricePerUnit: quoteForm.pricePerUnit,
      totalPrice: totalPrice.toString(),
      moq: parseInt(quoteForm.moq),
      leadTime: quoteForm.leadTime,
      paymentTerms: quoteForm.paymentTerms,
      validUntil: quoteForm.validUntil ? new Date(quoteForm.validUntil) : null,
      message: quoteForm.message,
      status: 'pending'
    });
  };

  if (rfqLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading RFQ details...</p>
        </div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">RFQ Not Found</h2>
            <p className="text-gray-600 mb-6">The RFQ you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation('/admin/rfqs')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to RFQs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalQuotationValue = quotations.reduce((sum: number, q: any) => 
    sum + (parseFloat(q.totalPrice) || 0), 0
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto p-6">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: "RFQs", href: "/admin/rfqs" },
          { label: "RFQ Details" }
        ]} />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/admin/rfqs')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                RFQ Details
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                View and manage Request for Quotation details
              </p>
            </div>
          </div>
          <Badge className={rfq.status === 'open' 
            ? 'bg-green-100 text-green-800 border-green-200' 
            : 'bg-gray-100 text-gray-800 border-gray-200'
          }>
            {rfq.status?.toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* RFQ Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  RFQ Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product Section */}
                {product && (
                  <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                    {product.images && product.images.length > 0 && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={Array.isArray(product.images) ? product.images[0] : product.images} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <Link href={`/product/${product.id}`}>
                        <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {product.shortDescription || 'No description'}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {rfq.title}
                  </h3>
                  <div className="flex gap-2 mb-4">
                    {rfq.categoryId && (
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        {getCategoryName(rfq.categoryId)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {rfq.description}
                  </p>
                </div>

                {/* RFQ Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Quantity</p>
                    <p className="text-lg font-semibold">{rfq.quantity?.toLocaleString() || 'N/A'} units</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Target Price</p>
                    <p className="text-lg font-semibold">{formatPrice(rfq.targetPrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expected Date</p>
                    <p className="text-lg font-semibold">{formatDate(rfq.expectedDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Delivery Location</p>
                    <p className="text-lg font-semibold">{rfq.deliveryLocation || 'N/A'}</p>
                  </div>
                </div>

                {/* Attachments */}
                {rfq.attachments && rfq.attachments.length > 0 && Array.isArray(rfq.attachments) && rfq.attachments.filter((a: any) => a).length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Attachments ({rfq.attachments.filter((a: any) => a).length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {rfq.attachments.filter((a: any) => a).map((attachment: string, index: number) => (
                        <a 
                          key={index}
                          href={attachment} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">Document {index + 1}</span>
                          <Download className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold mb-3">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Created</span>
                      <span className="font-medium">{formatDate(rfq.createdAt)}</span>
                    </div>
                    {rfq.expiresAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Expires</span>
                        <span className="font-medium">{formatDate(rfq.expiresAt)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Quotations Sent</span>
                      <span className="font-medium">{quotations.length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quotations Section */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Quotations ({quotations.length})
                </CardTitle>
                {rfq.status === 'open' && (
                  <Button 
                    onClick={handleSendQuotation}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Quotation
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {quotations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      No quotations have been sent for this RFQ yet.
                    </p>
                    {rfq.status === 'open' && (
                      <Button onClick={handleSendQuotation}>
                        <Send className="h-4 w-4 mr-2" />
                        Send First Quotation
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quotations.map((quotation: any) => (
                      <div 
                        key={quotation.id} 
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg font-semibold text-blue-600">
                                {formatPrice(quotation.pricePerUnit)}/unit
                              </span>
                              <Badge variant={
                                quotation.status === 'accepted' ? 'default' :
                                quotation.status === 'rejected' ? 'destructive' :
                                'secondary'
                              }>
                                {quotation.status || 'pending'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Total: {formatPrice(quotation.totalPrice)} | MOQ: {quotation.moq} units
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(quotation.createdAt)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-sm mb-3 pt-3 border-t">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Lead Time:</span>
                            <span className="ml-2 font-medium">{quotation.leadTime || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Payment:</span>
                            <span className="ml-2 font-medium">{quotation.paymentTerms || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Valid Until:</span>
                            <span className="ml-2 font-medium">{quotation.validUntil ? formatDate(quotation.validUntil) : 'N/A'}</span>
                          </div>
                        </div>

                        {quotation.message && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 pt-3 border-t">
                            {quotation.message}
                          </p>
                        )}

                        {quotation.status === 'accepted' && (
                          <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-700 dark:text-green-400">
                            ✓ Accepted by buyer
                          </div>
                        )}
                        {quotation.status === 'rejected' && (
                          <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-400">
                            ✗ Rejected by buyer
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Buyer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Buyer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {buyer ? (
                  <>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Name</p>
                      <p className="font-semibold">{buyer.firstName} {buyer.lastName}</p>
                    </div>
                    {buyer.email && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                          <Mail className="h-3 w-3" /> Email
                        </p>
                        <a href={`mailto:${buyer.email}`} className="text-blue-600 hover:underline">
                          {buyer.email}
                        </a>
                      </div>
                    )}
                    {buyerProfile?.companyName && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                          <Building className="h-3 w-3" /> Company
                        </p>
                        <p className="font-medium">{buyerProfile.companyName}</p>
                      </div>
                    )}
                    {buyerProfile?.country && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                          <Globe className="h-3 w-3" /> Country
                        </p>
                        <p className="font-medium">{buyerProfile.country}</p>
                      </div>
                    )}
                    {buyerProfile?.phone && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                          <Phone className="h-3 w-3" /> Phone
                        </p>
                        <p className="font-medium">{buyerProfile.phone}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">Buyer information not available</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">RFQ Value</span>
                  <span className="font-semibold">
                    {formatPrice((rfq.quantity || 0) * (parseFloat(rfq.targetPrice) || 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Quotations</span>
                  <span className="font-semibold">{quotations.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Quoted Value</span>
                  <span className="font-semibold text-green-600">
                    {formatPrice(totalQuotationValue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                  <Badge className={rfq.status === 'open' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                  }>
                    {rfq.status?.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {rfq.status === 'open' && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full mb-2 bg-blue-600 hover:bg-blue-700"
                    onClick={handleSendQuotation}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Quotation
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Send Quotation Dialog */}
      <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Quotation for: {rfq?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pricePerUnit">Price Per Unit (USD) *</Label>
                <Input
                  id="pricePerUnit"
                  type="number"
                  value={quoteForm.pricePerUnit}
                  onChange={(e) => setQuoteForm({...quoteForm, pricePerUnit: e.target.value})}
                  placeholder="e.g., 18.50"
                  step="0.01"
                  min="0"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="moq">Minimum Order Quantity *</Label>
                <Input
                  id="moq"
                  type="number"
                  value={quoteForm.moq}
                  onChange={(e) => setQuoteForm({...quoteForm, moq: e.target.value})}
                  placeholder="e.g., 5000"
                  min="1"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="leadTime">Lead Time</Label>
                <Input
                  id="leadTime"
                  value={quoteForm.leadTime}
                  onChange={(e) => setQuoteForm({...quoteForm, leadTime: e.target.value})}
                  placeholder="e.g., 20-25 days"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select value={quoteForm.paymentTerms} onValueChange={(value) => setQuoteForm({...quoteForm, paymentTerms: value})}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="T/T">T/T (Telegraphic Transfer)</SelectItem>
                    <SelectItem value="L/C">L/C (Letter of Credit)</SelectItem>
                    <SelectItem value="D/P">D/P (Documents against Payment)</SelectItem>
                    <SelectItem value="D/A">D/A (Documents against Acceptance)</SelectItem>
                    <SelectItem value="Advance Payment">Advance Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={quoteForm.validUntil}
                  onChange={(e) => setQuoteForm({...quoteForm, validUntil: e.target.value})}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="message">Message / Additional Details</Label>
              <Textarea
                id="message"
                value={quoteForm.message}
                onChange={(e) => setQuoteForm({...quoteForm, message: e.target.value})}
                placeholder="Provide detailed information about your quotation, customization options, certifications, etc."
                rows={4}
                className="mt-2"
              />
            </div>

            {quoteForm.pricePerUnit && quoteForm.moq && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Quotation Value:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatPrice(parseFloat(quoteForm.pricePerUnit) * parseInt(quoteForm.moq))}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={submitQuotation}
              disabled={sendQuotationMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sendQuotationMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Send Quotation</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

