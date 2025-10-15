import { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Package, 
  Truck, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  MapPin, 
  Calendar,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  FileText,
  DollarSign
} from "lucide-react";

export default function OrderTracking() {
  const [searchQuery, setSearchQuery] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [, params] = useRoute("/track-order/:orderId");

  useEffect(() => {
    if (params?.orderId) {
      setSearchQuery(params.orderId);
    }
  }, [params]);

  // Fetch order details
  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/orders', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return null;
      try {
        const response = await fetch(`/api/orders?search=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }
        const data = await response.json();
        return data.orders?.[0] || null;
      } catch (error) {
        console.error('Error fetching order:', error);
        throw error;
      }
    },
    enabled: !!searchQuery
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5" />;
      case 'processing':
        return <Package className="h-5 w-5" />;
      case 'shipped':
        return <Truck className="h-5 w-5" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
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
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTrackingSteps = (status: string) => {
    const steps = [
      { id: 'pending', label: 'Order Placed', description: 'Your order has been received' },
      { id: 'confirmed', label: 'Order Confirmed', description: 'Order confirmed by supplier' },
      { id: 'processing', label: 'In Production', description: 'Your order is being processed' },
      { id: 'shipped', label: 'Shipped', description: 'Your order is on its way' },
      { id: 'delivered', label: 'Delivered', description: 'Order delivered successfully' }
    ];

    const currentStepIndex = steps.findIndex(step => step.id === status);
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentStepIndex,
      current: index === currentStepIndex
    }));
  };

  const handleSearch = () => {
    if (trackingNumber.trim()) {
      setSearchQuery(trackingNumber.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        {/* Header Section */}
        <div className="gradient-blue text-white py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold mb-4">Track Your Order</h1>
            <p className="text-xl text-gray-200 mb-8">
              Enter your order number or tracking number to get real-time updates
            </p>
            
            {/* Search Form */}
            <div className="max-w-md mx-auto">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Enter order number or tracking number..."
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-300"
                  />
                </div>
                <Button 
                  onClick={handleSearch}
                  disabled={!trackingNumber.trim() || isLoading}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!searchQuery ? (
            /* No Search State */
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Track Your Order
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Enter your order number or tracking number above to get started
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                <Card>
                  <CardContent className="p-6 text-center">
                    <FileText className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <h3 className="font-semibold mb-1">Order Number</h3>
                    <p className="text-sm text-gray-600">Found in your order confirmation email</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Truck className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <h3 className="font-semibold mb-1">Tracking Number</h3>
                    <p className="text-sm text-gray-600">Provided when your order ships</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Clock className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                    <h3 className="font-semibold mb-1">Real-time Updates</h3>
                    <p className="text-sm text-gray-600">Get instant status updates</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : error ? (
            /* Error State */
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-16 w-16 mx-auto text-red-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Order Not Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  We couldn't find an order with that number. Please check your order number and try again.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setSearchQuery("")} variant="outline">
                    Try Another Number
                  </Button>
                  <Link href="/my-orders">
                    <Button>
                      <Package className="h-4 w-4 mr-2" />
                      View My Orders
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : order ? (
            /* Order Found */
            <div className="space-y-8">
              {/* Order Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order Details
                    </span>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {order.productName || 'Unknown Product'}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Order Number:</span>
                          <span className="font-medium">{order.orderNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Order Date:</span>
                          <span className="font-medium">{formatDate(order.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium">{order.quantity} units</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Amount:</span>
                          <span className="font-medium text-lg">{formatPrice(order.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Status:</span>
                          <span className="font-medium">{order.paymentStatus || 'Pending'}</span>
                        </div>
                        {order.trackingNumber && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tracking Number:</span>
                            <span className="font-medium font-mono">{order.trackingNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tracking Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Order Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {getTrackingSteps(order.status).map((step, index) => (
                      <div key={step.id} className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          step.completed 
                            ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' 
                            : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                        }`}>
                          {step.completed ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <Clock className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-medium ${
                              step.current ? 'text-blue-600 dark:text-blue-400' : 
                              step.completed ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {step.label}
                            </h4>
                            {step.current && (
                              <Badge variant="outline" className="text-blue-600 border-blue-600">
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className={`text-sm ${
                            step.completed ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500 dark:text-gray-500'
                          }`}>
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
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

              {/* External Tracking */}
              {order.trackingNumber && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="h-5 w-5" />
                      External Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Tracking Number</p>
                        <p className="font-mono text-lg">{order.trackingNumber}</p>
                      </div>
                      <Button variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Track on Carrier Website
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
                <Link href="/my-orders">
                  <Button variant="outline">
                    <Package className="h-4 w-4 mr-2" />
                    View All Orders
                  </Button>
                </Link>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
