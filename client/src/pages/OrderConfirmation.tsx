import { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Package, 
  Truck, 
  Clock, 
  DollarSign, 
  Calendar, 
  User, 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  FileText,
  ArrowRight,
  Download,
  MessageSquare,
  Home,
  ShoppingBag
} from "lucide-react";

export default function OrderConfirmation() {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [, params] = useRoute("/order-confirmation/:orderId");

  useEffect(() => {
    if (params?.orderId) {
      setOrderId(params.orderId);
    }
  }, [params]);

  // Fetch order details
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['/api/orders', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }
        const data = await response.json();
        return data.order;
      } catch (error) {
        console.error('Error fetching order:', error);
        throw error;
      }
    },
    enabled: !!orderId
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'processing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Order Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The order you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Link href="/my-orders">
                <Button>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  View My Orders
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        {/* Success Header */}
        <div className="bg-green-50 dark:bg-green-900/20 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Order Confirmed!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
              Thank you for your order. We've received your order and will process it shortly.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>Order Number: <strong className="text-gray-900 dark:text-white">{order.orderNumber}</strong></span>
              <span>•</span>
              <span>Order Date: <strong className="text-gray-900 dark:text-white">{formatDate(order.createdAt)}</strong></span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Current Status</p>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Order Total</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(order.totalAmount)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {order.productName || 'Unknown Product'}
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Quantity</p>
                          <p className="font-medium">{order.quantity} units</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Unit Price</p>
                          <p className="font-medium">{formatPrice(order.unitPrice)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Payment Method</p>
                          <p className="font-medium">{order.paymentMethod || 'T/T'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Payment Status</p>
                          <p className="font-medium">{order.paymentStatus || 'Pending'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Information */}
              {order.shippingAddress && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm">
                        {typeof order.shippingAddress === 'string' 
                          ? order.shippingAddress 
                          : JSON.stringify(order.shippingAddress)
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Next Steps */}
              <Card>
                <CardHeader>
                  <CardTitle>What's Next?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium">Order Processing</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          We'll review your order and send you a confirmation email within 24 hours.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                        <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium">Production & Shipping</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Your order will be processed and shipped according to the lead time specified.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                        <Truck className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">Tracking Information</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          You'll receive tracking information once your order ships.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/my-orders">
                    <Button variant="outline" className="w-full justify-start">
                      <Package className="h-4 w-4 mr-2" />
                      View All Orders
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Download Invoice
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                  <Link href="/products">
                    <Button variant="outline" className="w-full justify-start">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Support Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Need Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>+1 (555) 123-4567</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>support@example.com</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>24/7 Support</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatPrice(order.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>Free</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>$0.00</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>{formatPrice(order.totalAmount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/my-orders">
              <Button size="lg">
                <Package className="h-5 w-5 mr-2" />
                View My Orders
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" size="lg">
                <Home className="h-5 w-5 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
