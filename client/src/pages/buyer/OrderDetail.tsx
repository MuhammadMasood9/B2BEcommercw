import React, { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  User,
  DollarSign,
  Calendar,
  FileText,
  MapPin,
  Phone,
  Mail,
  Building,
  Loader2,
  AlertCircle,
  Check,
  X,
  CreditCard,
  Receipt,
  Box,
  Ship,
  CheckSquare,
  ExternalLink,
  Printer,
  Share2,
  MessageSquare,
  Star,
  Flag,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Archive,
  AlertTriangle,
  Info,
  TrendingUp,
  BarChart3,
  Users,
  Activity,
  Target,
  Zap,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function OrderDetail() {
  const [, params] = useRoute("/order/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [review, setReview] = useState({
    rating: 5,
    comment: ''
  });

  // Fetch order details
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', params?.id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/orders/${params?.id}`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch order');
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching order:', error);
        throw error;
      }
    },
    enabled: !!params?.id
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string, reason: string }) => {
      const response = await fetch(`/api/buyer/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });
      if (!response.ok) throw new Error('Failed to cancel order');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order cancelled successfully",
        description: "The order has been cancelled."
      });
      queryClient.invalidateQueries({ queryKey: ['order', params?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/buyer/orders'] });
      setIsCancelDialogOpen(false);
      setCancelReason('');
    },
    onError: (error: any) => {
      toast({
        title: "Failed to cancel order",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    }
  });

  // Contact supplier mutation
  const contactSupplierMutation = useMutation({
    mutationFn: async ({ orderId, message }: { orderId: string, message: string }) => {
      const response = await fetch(`/api/orders/${orderId}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message })
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent successfully",
        description: "Your message has been sent to the supplier."
      });
      setIsContactDialogOpen(false);
      setContactMessage('');
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    }
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async ({ orderId, review }: { orderId: string, review: any }) => {
      const response = await fetch(`/api/orders/${orderId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(review)
      });
      if (!response.ok) throw new Error('Failed to submit review');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review submitted successfully",
        description: "Thank you for your feedback!"
      });
      setIsReviewDialogOpen(false);
      setReview({ rating: 5, comment: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit review",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckSquare className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'shipped': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending': return 'Your order is being reviewed by the supplier';
      case 'confirmed': return 'Your order has been confirmed and is being prepared';
      case 'processing': return 'Your order is being processed and prepared for shipment';
      case 'shipped': return 'Your order has been shipped and is on its way';
      case 'delivered': return 'Your order has been delivered successfully';
      case 'cancelled': return 'This order has been cancelled';
      default: return 'Unknown status';
    }
  };

  const canCancelOrder = (order: any) => {
    return ['pending', 'confirmed'].includes(order?.status);
  };

  const canReviewOrder = (order: any) => {
    return order?.status === 'delivered' && !order?.reviewed;
  };

  const handleCancelOrder = () => {
    if (order?.id && cancelReason.trim()) {
      cancelOrderMutation.mutate({ orderId: order.id, reason: cancelReason });
    }
  };

  const handleContactSupplier = () => {
    if (order?.id && contactMessage.trim()) {
      contactSupplierMutation.mutate({ orderId: order.id, message: contactMessage });
    }
  };

  const handleSubmitReview = () => {
    if (order?.id && review.comment.trim()) {
      submitReviewMutation.mutate({ orderId: order.id, review });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-4">The order you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button onClick={() => setLocation('/my-orders')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/my-orders')}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Orders
              </Button>
              <Badge className="bg-white/20 text-white border-white/30">
                Order Details
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Order #{order.orderNumber}</h1>
                <p className="text-blue-100 text-lg">{order.items?.[0]?.productName || 'Order Items'}</p>
              </div>
              <div className="text-right">
                <Badge className={`${getStatusColor(order.status)} mb-2`}>
                  {getStatusIcon(order.status)}
                  <span className="ml-2 capitalize">{order.status}</span>
                </Badge>
                <p className="text-blue-100 text-sm">
                  Ordered {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Status Card */}
              <Card className="bg-white border-gray-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Order Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusIcon(order.status)}
                        <span className="ml-2 capitalize">{order.status}</span>
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Last Updated</p>
                      <p className="font-medium">{format(new Date(order.updatedAt || order.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-blue-800 font-medium">{getStatusDescription(order.status)}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Order Progress</span>
                      <span>{Math.min(100, Math.max(0, (['pending', 'confirmed', 'processing', 'shipped', 'delivered'].indexOf(order.status) + 1) * 20))}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, (['pending', 'confirmed', 'processing', 'shipped', 'delivered'].indexOf(order.status) + 1) * 20))}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card className="bg-white border-gray-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Box className="w-5 h-5 text-green-600" />
                    Order Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.items?.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item.productName || 'Product'}</h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>Quantity: {item.quantity}</span>
                            <span>Unit Price: ${parseFloat(item.unitPrice || '0').toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">${parseFloat(item.totalPrice || '0').toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total Amount</span>
                      <span className="text-green-600">${parseFloat(order.totalAmount || '0').toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Information */}
              {order.shippingAddress && (
                <Card className="bg-white border-gray-100 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-purple-600" />
                      Shipping Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {typeof order.shippingAddress === 'string' 
                          ? order.shippingAddress 
                          : JSON.stringify(order.shippingAddress, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tracking Information */}
              {order.trackingNumber && (
                <Card className="bg-white border-gray-100 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-orange-600" />
                      Tracking Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                      <Truck className="w-6 h-6 text-orange-600" />
                      <div>
                        <p className="font-medium text-orange-800">Tracking Number</p>
                        <p className="text-orange-700 font-mono">{order.trackingNumber}</p>
                      </div>
                      <Button variant="outline" size="sm" className="ml-auto">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Track Package
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Timeline */}
              <Card className="bg-white border-gray-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    Order Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Order Created</p>
                        <p className="text-sm text-gray-600">{format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                      </div>
                    </div>
                    
                    {order.status !== 'pending' && (
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">Order Confirmed</p>
                          <p className="text-sm text-gray-600">{format(new Date(order.updatedAt || order.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                        </div>
                      </div>
                    )}
                    
                    {order.status === 'shipped' && (
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">Order Shipped</p>
                          <p className="text-sm text-gray-600">{format(new Date(order.updatedAt), 'MMM dd, yyyy HH:mm')}</p>
                        </div>
                      </div>
                    )}
                    
                    {order.status === 'delivered' && (
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">Order Delivered</p>
                          <p className="text-sm text-gray-600">{format(new Date(order.updatedAt), 'MMM dd, yyyy HH:mm')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              <Card className="bg-white border-gray-100 shadow-lg">
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setIsContactDialogOpen(true)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact Supplier
                  </Button>
                  
                  {canCancelOrder(order) && (
                    <Button 
                      variant="outline"
                      onClick={() => setIsCancelDialogOpen(true)}
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Order
                    </Button>
                  )}
                  
                  {canReviewOrder(order) && (
                    <Button 
                      variant="outline"
                      onClick={() => setIsReviewDialogOpen(true)}
                      className="w-full text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Write Review
                    </Button>
                  )}
                  
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download Invoice
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    <Printer className="w-4 h-4 mr-2" />
                    Print Order
                  </Button>
                </CardContent>
              </Card>

              {/* Supplier Information */}
              <Card className="bg-white border-gray-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-purple-600" />
                    Supplier Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm text-gray-600">Company</Label>
                    <p className="font-medium">{order.supplierName || 'Admin Supplier'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Email</Label>
                    <p className="font-medium">{order.supplierEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Phone</Label>
                    <p className="font-medium">{order.supplierPhone || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Country</Label>
                    <p className="font-medium">{order.supplierCountry || 'USA'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card className="bg-white border-gray-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm text-gray-600">Payment Status</Label>
                    <Badge className="bg-green-100 text-green-800">
                      <CreditCard className="w-3 h-3 mr-1" />
                      {order.paymentStatus || 'Paid'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Payment Method</Label>
                    <p className="font-medium">{order.paymentMethod || 'T/T'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Total Amount</Label>
                    <p className="font-medium text-green-600">${parseFloat(order.totalAmount || '0').toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Cancel Order Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Cancel Order
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this order.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancelReason">Reason for Cancellation</Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Explain why you want to cancel this order..."
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCancelOrder}
              disabled={cancelOrderMutation.isPending || !cancelReason.trim()}
              variant="destructive"
            >
              {cancelOrderMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Supplier Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Contact Supplier
            </DialogTitle>
            <DialogDescription>
              Send a message to the supplier about this order.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="contactMessage">Message</Label>
              <Textarea
                id="contactMessage"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleContactSupplier}
              disabled={contactSupplierMutation.isPending || !contactMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {contactSupplierMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              Write Review
            </DialogTitle>
            <DialogDescription>
              Share your experience with this order.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setReview({...review, rating})}
                    className={`p-1 ${rating <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="reviewComment">Comment</Label>
              <Textarea
                id="reviewComment"
                value={review.comment}
                onChange={(e) => setReview({...review, comment: e.target.value})}
                placeholder="Share your experience..."
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReview}
              disabled={submitReviewMutation.isPending || !review.comment.trim()}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {submitReviewMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
