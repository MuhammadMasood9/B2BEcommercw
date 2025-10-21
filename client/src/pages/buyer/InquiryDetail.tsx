import { useState, useEffect } from 'react';
import { Link, useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
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
  FileText,
  TrendingUp,
  Globe,
  Shield,
  ArrowRight,
  Plus,
  Users,
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Copy,
  RefreshCw,
  Info,
  CheckCircle2,
  XCircle,
  Timer
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function InquiryDetail() {
  const [, params] = useRoute("/inquiry/:id");
  const inquiryId = params?.id;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch inquiry details with quotation
  const { data: inquiry, isLoading, error } = useQuery({
    queryKey: ['/api/inquiries', inquiryId],
    queryFn: async () => {
      if (!inquiryId) return null;
      try {
        const response = await fetch(`/api/inquiries/${inquiryId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch inquiry');
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching inquiry:', error);
        throw error;
      }
    },
    enabled: !!inquiryId
  });

  // Fetch product details if inquiry has productId
  const { data: product } = useQuery({
    queryKey: ['/api/products', inquiry?.productId],
    queryFn: async () => {
      if (!inquiry?.productId) return null;
      try {
        const response = await fetch(`/api/products/${inquiry.productId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          return null;
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching product:', error);
        return null;
      }
    },
    enabled: !!inquiry?.productId
  });

  // Fetch quotation details if inquiry exists
  const { data: quotation } = useQuery({
    queryKey: ['/api/buyer/quotations', inquiryId],
    queryFn: async () => {
      if (!inquiryId || !inquiry) return null;
      try {
        // Try to get quotation from buyer quotations endpoint
        const response = await fetch(`/api/buyer/quotations`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          return null; // No quotation yet
        }
        const data = await response.json();
        // Find quotation for this specific inquiry
        const inquiryQuotation = data.quotations?.find((q: any) => q.inquiryId === inquiryId);
        return inquiryQuotation || null;
      } catch (error) {
        console.error('Error fetching quotation:', error);
        return null;
      }
    },
    enabled: !!inquiryId && !!inquiry
  });

  // Combine inquiry, product, and quotation data
  const currentInquiry = inquiry ? {
    ...inquiry,
    product: product,
    quotation: quotation
  } : null;

  // Debug: Log the inquiry data to see what fields are available
  useEffect(() => {
    if (currentInquiry) {
      console.log('=== INQUIRY DEBUG DATA ===');
      console.log('Full inquiry data:', currentInquiry);
      console.log('Available fields:', Object.keys(currentInquiry));
      console.log('Product image fields:', {
        productImage: currentInquiry.productImage,
        image: currentInquiry.image,
        product: currentInquiry.product,
        productImages: currentInquiry.product?.images,
        productImage2: currentInquiry.productImage2,
        productImage3: currentInquiry.productImage3
      });
      console.log('Inquiry details:', {
        quantity: currentInquiry.quantity,
        targetPrice: currentInquiry.targetPrice,
        message: currentInquiry.message,
        requirements: currentInquiry.requirements,
        expectedDeliveryDate: currentInquiry.expectedDeliveryDate,
        deliveryDate: currentInquiry.deliveryDate,
        paymentTerms: currentInquiry.paymentTerms,
        createdAt: currentInquiry.createdAt,
        inquiredDate: currentInquiry.inquiredDate
      });
      console.log('Quotation data:', currentInquiry.quotation);
      console.log('=== END DEBUG ===');
    }
  }, [currentInquiry]);

  // Helper function to get the best available image
  const getProductImage = (index: number = 0) => {
    if (!currentInquiry) return '/uploads/default-product.jpg';
    
    // Prioritize product images from the actual product data
    const possibleFields = [
      currentInquiry.product?.images?.[index],
      currentInquiry.product?.image,
      currentInquiry.productImage,
      currentInquiry.image,
      currentInquiry.images?.[index],
      currentInquiry.productImages?.[index]
    ];
    
    // Find the first valid image URL
    const validImage = possibleFields.find(img => 
      img && 
      typeof img === 'string' && 
      (img.startsWith('http') || img.startsWith('/') || img.startsWith('./'))
    );
    
    // If no valid image found, return a placeholder that matches the product category
    if (!validImage) {
      // Get product category to show appropriate placeholder
      const category = currentInquiry.category || currentInquiry.product?.category || 'general';
      
      if (category.toLowerCase().includes('electronic') || category.toLowerCase().includes('electronics')) {
        return index === 0 ? '/uploads/default-electronics.jpg' : 
               index === 1 ? '/uploads/default-electronics-2.jpg' :
               '/uploads/default-electronics-3.jpg';
      } else if (category.toLowerCase().includes('fashion') || category.toLowerCase().includes('clothing')) {
        return index === 0 ? '/uploads/default-fashion.jpg' : 
               index === 1 ? '/uploads/default-fashion-2.jpg' :
               '/uploads/default-fashion-3.jpg';
      } else if (category.toLowerCase().includes('home') || category.toLowerCase().includes('furniture')) {
        return index === 0 ? '/uploads/default-home.jpg' : 
               index === 1 ? '/uploads/default-home-2.jpg' :
               '/uploads/default-home-3.jpg';
      } else {
        // Generic product placeholder
        return index === 0 ? '/uploads/default-product.jpg' : 
               index === 1 ? '/uploads/default-product-2.jpg' :
               '/uploads/default-product-3.jpg';
      }
    }
    
    return validImage;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'accepted':
        return <CheckCircle className="h-5 w-5" />;
      case 'rejected':
        return <XCircle className="h-5 w-5" />;
      case 'expired':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleAcceptInquiry = () => {
    // Implementation for accepting quotation
    toast.success('Quotation accepted successfully! Order will be processed.');
    setIsAcceptDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
  };

  const handleRejectInquiry = () => {
    // Implementation for rejecting quotation
    toast.success('Quotation rejected');
    setIsRejectDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
  };

  const handleCopyInquiryId = () => {
    navigator.clipboard.writeText(currentInquiry.inquiryId);
    toast.success('Inquiry ID copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading inquiry details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !currentInquiry) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Inquiry Not Found</h2>
            <p className="text-gray-600 mb-6">The inquiry you're looking for doesn't exist or has been removed.</p>
            <Link href="/buyer/inquiries">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Inquiries
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      {/* Hero Section with Gradient */}
      <section className="relative py-16 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-blue-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-600/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg mb-6">
              <FileText className="w-4 h-4" />
              <span>Inquiry Details</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {currentInquiry?.productName || 
               currentInquiry?.product?.name || 
               currentInquiry?.title || 
               currentInquiry?.name || 
               'Inquiry'}
              <span className="bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent block">
                Inquiry
              </span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Your inquiry and admin's quotation response
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-white/80 text-sm mt-8">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-300" />
                <span>Verified Supplier</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-300" />
                <span>Fast Response</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-300" />
                <span>Global Shipping</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
            <Link href="/buyer/inquiries" className="hover:text-blue-600">
              My Inquiries
            </Link>
            <ArrowRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">
              {currentInquiry?.productName || 
               currentInquiry?.product?.name || 
               currentInquiry?.title || 
               currentInquiry?.name || 
               'Inquiry'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Inquiry Overview */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                        {currentInquiry?.productName || 
                         currentInquiry?.product?.name || 
                         currentInquiry?.title || 
                         currentInquiry?.name || 
                         'Inquiry'}
                      </CardTitle>
                      <div className="flex items-center gap-3 mb-4">
                        <Badge className={`${getStatusColor(currentInquiry?.status || 'pending')} flex items-center gap-1`}>
                          {getStatusIcon(currentInquiry?.status || 'pending')}
                          {currentInquiry?.status?.charAt(0).toUpperCase() + currentInquiry?.status?.slice(1)}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyInquiryId}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          {currentInquiry?.id}
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Product Images */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={getProductImage(0)} 
                        alt={currentInquiry?.productName || 
                             currentInquiry?.product?.name || 
                             currentInquiry?.title || 
                             currentInquiry?.name || 
                             'Product'}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                <Package className="h-12 w-12 mb-2" />
                                <span class="text-sm">No Image Available</span>
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={getProductImage(1)} 
                        alt="Product detail"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                <Package className="h-12 w-12 mb-2" />
                                <span class="text-sm">No Image Available</span>
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={getProductImage(2)} 
                        alt="Product packaging"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                <Package className="h-12 w-12 mb-2" />
                                <span class="text-sm">No Image Available</span>
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Your Inquiry Details */}
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Your Inquiry Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quantity Requested:</span>
                        <span className="font-medium">
                          {currentInquiry?.quantity || currentInquiry?.requestedQuantity || currentInquiry?.qty || 0} units
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Your Target Price:</span>
                        <span className="font-medium">
                          {formatPrice(
                            currentInquiry?.targetPrice || 
                            currentInquiry?.expectedPrice || 
                            currentInquiry?.budget || 
                            currentInquiry?.price || 
                            0
                          )} per unit
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected Delivery:</span>
                        <span className="font-medium">
                          {formatDate(
                            currentInquiry?.expectedDeliveryDate || 
                            currentInquiry?.deliveryDate || 
                            currentInquiry?.expectedDate || 
                            currentInquiry?.deliveryTime || 
                            ''
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Terms:</span>
                        <span className="font-medium">
                          {currentInquiry?.paymentTerms || 
                           currentInquiry?.paymentMethod || 
                           currentInquiry?.payment || 
                           'Not specified'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Your Message:</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {currentInquiry?.message || 
                         currentInquiry?.description || 
                         currentInquiry?.notes || 
                         currentInquiry?.comments || 
                         'No message provided'}
                      </p>
                    </div>
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Requirements:</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {currentInquiry?.requirements || 
                         currentInquiry?.specifications || 
                         currentInquiry?.details || 
                         'No specific requirements mentioned'}
                      </p>
                    </div>
                  </div>

                  {/* Admin's Quotation Response */}
                  {currentInquiry.quotation ? (
                    <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Admin's Quotation Response
                      </h3>
                      
                      {/* Admin's Message */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Admin's Message:</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">{currentInquiry.quotation.adminMessage || currentInquiry.quotation.message || 'No message provided'}</p>
                      </div>

                      {/* Pricing Comparison */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-4 bg-white rounded-lg border">
                          <div className="text-lg font-bold text-blue-600 mb-1">
                            {formatPrice(currentInquiry.quotation.unitPrice || currentInquiry.quotation.pricePerUnit || 0)}
                          </div>
                          <div className="text-sm text-gray-600">Admin's Quote</div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg border">
                          <div className="text-lg font-bold text-green-600 mb-1">
                            {formatPrice(currentInquiry?.targetPrice || 0)}
                          </div>
                          <div className="text-sm text-gray-600">Your Target</div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg border">
                          <div className="text-lg font-bold text-purple-600 mb-1">
                            {formatPrice(currentInquiry.quotation.totalPrice || currentInquiry.quotation.totalAmount || 0)}
                          </div>
                          <div className="text-sm text-gray-600">Total Amount</div>
                        </div>
                      </div>

                      {/* Pricing Breakdown */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Pricing Breakdown:</h4>
                        <div className="space-y-2">
                          {currentInquiry.quotation.pricingBreakdown && Object.keys(currentInquiry.quotation.pricingBreakdown).length > 0 ? 
                            Object.entries(currentInquiry.quotation.pricingBreakdown).map(([key, value]) => {
                              const numValue = typeof value === 'number' ? value : 0;
                              return (
                                <div key={key} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{key}:</span>
                                  <span className={`font-medium ${numValue < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                    {numValue < 0 ? '' : '$'}{numValue}
                                  </span>
                                </div>
                              );
                            }) : (
                              <div className="text-sm text-gray-500">
                                <div className="flex justify-between">
                                  <span>Unit Price:</span>
                                  <span className="font-medium">{formatPrice(currentInquiry.quotation.unitPrice || currentInquiry.quotation.pricePerUnit || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Quantity:</span>
                                  <span className="font-medium">{currentInquiry?.quantity?.toLocaleString()} units</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Total:</span>
                                  <span className="font-medium">{formatPrice(currentInquiry.quotation.totalPrice || currentInquiry.quotation.totalAmount || 0)}</span>
                                </div>
                              </div>
                            )
                          }
                        </div>
                      </div>

                      {/* Additional Offers */}
                      {currentInquiry.quotation.additionalOffers && currentInquiry.quotation.additionalOffers.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Additional Offers:</h4>
                          <ul className="space-y-1">
                            {currentInquiry.quotation.additionalOffers.map((offer: any, index: number) => (
                              <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                {offer}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        Waiting for Admin Response
                      </h3>
                      <div className="text-center py-8">
                        <Clock className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No Quotation Yet</h4>
                        <p className="text-gray-600 mb-4">
                          The admin is reviewing your inquiry and will respond with a quotation soon.
                        </p>
                        <div className="text-sm text-gray-500">
                          <p>Average response time: 2-4 hours</p>
                          <p>You will be notified when a quotation is received</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Product Specifications from Admin */}
                  {currentInquiry.quotation?.specifications && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Specifications (Admin's Response)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(currentInquiry.quotation.specifications).map(([key, value]) => (
                          <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-600 font-medium">{key}:</span>
                            <span className="text-gray-900">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    {currentInquiry.quotation?.status === 'pending' && (
                      <>
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => setIsAcceptDialogOpen(true)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept Quotation
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => setIsRejectDialogOpen(true)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Quotation
                        </Button>
                      </>
                    )}
                    <Button variant="outline" className="flex-1">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Admin
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Supplier Information */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Supplier Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">{currentInquiry?.adminName || currentInquiry?.supplierName || 'Supplier'}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{currentInquiry?.adminCity || currentInquiry?.supplierCity || 'City'}, {currentInquiry?.adminCountry || currentInquiry?.supplierCountry || 'Country'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>{currentInquiry?.adminRating || '4.5'}/5.0 ({currentInquiry?.adminTotalOrders || '0'} orders)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>Response time: {currentInquiry?.adminResponseTime || '2 hours'}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {currentInquiry.adminInfo?.verified && (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <Shield className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        {currentInquiry.adminInfo?.tradeAssurance && (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                            Trade Assurance
                          </Badge>
                        )}
                        {currentInquiry.adminInfo?.goldSupplier && (
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                            Gold Supplier
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{currentInquiry?.adminPhone || currentInquiry?.supplierPhone || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{currentInquiry?.adminEmail || currentInquiry?.supplierEmail || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                          <a href={`https://${currentInquiry.adminInfo?.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {currentInquiry.adminInfo?.website}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Inquiry Timeline */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    Inquiry Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Inquiry Sent</div>
                      <div className="text-sm text-gray-600">{formatDate(currentInquiry?.createdAt || currentInquiry?.inquiredDate || '')}</div>
                    </div>
                  </div>
                  {currentInquiry.quotation && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Quotation Received</div>
                        <div className="text-sm text-gray-600">{formatDate(currentInquiry.quotation.createdAt || currentInquiry.quotation.quotedDate || '')}</div>
                        <div className="text-xs text-gray-500">Response time: {currentInquiry.quotation.responseTime}</div>
                      </div>
                    </div>
                  )}
                  {currentInquiry.quotation && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Timer className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Valid Until</div>
                        <div className="text-sm text-gray-600">{formatDate(currentInquiry.quotation.validUntil)}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shipping Information */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-green-600" />
                    Shipping Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentInquiry.quotation ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Time:</span>
                        <span className="font-medium">{currentInquiry.quotation.estimatedDelivery || currentInquiry.quotation.deliveryTime || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping Method:</span>
                        <span className="font-medium">{currentInquiry.quotation.shippingMethod || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Origin:</span>
                        <span className="font-medium">{currentInquiry.quotation.origin || currentInquiry.quotation.shippingFrom || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping Cost:</span>
                        <span className="font-medium">{formatPrice(currentInquiry.quotation.shippingCost || currentInquiry.quotation.shippingFee || 0)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Waiting for admin response</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Terms */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Payment Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentInquiry.quotation ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Method:</span>
                        <span className="font-medium">{currentInquiry.quotation.paymentTerms || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Currency:</span>
                        <span className="font-medium">{currentInquiry.quotation.currency || 'USD'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Min. Order:</span>
                        <span className="font-medium">{currentInquiry.quotation.minimumOrderQuantity || currentInquiry.quotation.minOrderQty || 'Not specified'} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max. Order:</span>
                        <span className="font-medium">{currentInquiry.quotation.maximumOrderQuantity || currentInquiry.quotation.maxOrderQty || 'Not specified'} units</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <Clock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Waiting for admin response</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start Chat
                  </Button>
                  <Button variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Download Quote
                  </Button>
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Supplier Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Accept Quotation Dialog */}
      <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Quotation</DialogTitle>
            <DialogDescription>
              Are you sure you want to accept this quotation? This will proceed with the order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">Quotation Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Unit Price:</span>
                  <span className="font-medium">{formatPrice(currentInquiry.quotation?.unitPrice || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span className="font-medium">{currentInquiry.inquiry?.quantity?.toLocaleString()} units</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-medium">{formatPrice(currentInquiry.quotation?.totalPrice || 0)}</span>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Shipping Address</label>
              <Textarea
                placeholder="Enter your shipping address..."
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAcceptDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAcceptInquiry} className="bg-green-600 hover:bg-green-700">
              Accept Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Quotation Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Quotation</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this quotation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Reason for Rejection</label>
              <Textarea
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRejectInquiry} className="bg-red-600 hover:bg-red-700">
              Reject Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
