import { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
  DollarSign,
  Download,
  MessageSquare,
  Info,
  Mail,
  Phone
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
        return 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary';
      case 'processing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'shipped':
        return 'bg-orange-600 text-orange-600 dark:bg-orange-600 dark:text-orange-600';
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
      { 
        id: 'pending', 
        label: 'Order Placed', 
        description: 'Your order has been received and is awaiting confirmation',
        icon: Package,
        date: new Date()
      },
      { 
        id: 'confirmed', 
        label: 'Order Confirmed', 
        description: 'Admin has confirmed your order and will begin processing',
        icon: CheckCircle,
        date: new Date()
      },
      { 
        id: 'processing', 
        label: 'In Production', 
        description: 'Your order is being manufactured and prepared',
        icon: Package,
        date: new Date()
      },
      { 
        id: 'shipped', 
        label: 'Shipped', 
        description: 'Your order is on its way to the destination',
        icon: Truck,
        date: new Date()
      },
      { 
        id: 'delivered', 
        label: 'Delivered', 
        description: 'Order has been successfully delivered',
        icon: CheckCircle,
        date: new Date()
      }
    ];

    const currentStepIndex = steps.findIndex(step => step.id === status);
    const completionPercentage = currentStepIndex >= 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;
    
    return {
      steps: steps.map((step, index) => ({
        ...step,
        completed: index <= currentStepIndex,
        current: index === currentStepIndex
      })),
      completionPercentage
    };
  };

  const handleSearch = () => {
    if (trackingNumber.trim()) {
      setSearchQuery(trackingNumber.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      {/* Hero Section with Gradient */}
      <section className="relative py-16 bg-gradient-to-br from-gray-900 via-gray-800 to-secondary overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-primary/20 to-orange-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-primary/20 to-orange-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/10 to-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg mb-6">
              <Package className="w-4 h-4" />
              <span>Order Tracking</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Track Your
              <span className="bg-gradient-to-r from-orange-200 via-white to-orange-200 bg-clip-text text-transparent block">
                Order
              </span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
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

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-white/80 text-sm mt-8">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-green-300" />
                <span>Real-time Updates</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-yellow-300" />
                <span>Live Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-300" />
                <span>Secure Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!searchQuery ? (
            /* No Search State */
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Track Your Order
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Enter your order number or tracking number above to get started with real-time tracking
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Number</h3>
                    <p className="text-sm text-gray-600">Found in your order confirmation email</p>
                  </CardContent>
                </Card>
                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Truck className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Tracking Number</h3>
                    <p className="text-sm text-gray-600">Provided when your order ships</p>
                  </CardContent>
                </Card>
                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Clock className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Updates</h3>
                    <p className="text-sm text-gray-600">Get instant status updates</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : error ? (
            /* Error State */
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Order Not Found
                </h3>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  We couldn't find an order with that number. Please check your order number and try again.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => setSearchQuery("")} variant="outline" size="lg" className="px-8 py-3">
                    Try Another Number
                  </Button>
                  <Link href="/my-orders">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-3">
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
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order Details
                    </span>
                    <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
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

              {/* Enhanced Tracking Timeline with Progress Bar */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Order Progress
                    </CardTitle>
                    <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Order Journey</span>
                      <span className="font-semibold">{Math.round(getTrackingSteps(order.status).completionPercentage)}% Complete</span>
                    </div>
                    <Progress value={getTrackingSteps(order.status).completionPercentage} className="h-2" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {getTrackingSteps(order.status).steps.map((step, index) => {
                      const StepIcon = step.icon;
                      return (
                        <div key={step.id} className="relative">
                          {index < getTrackingSteps(order.status).steps.length - 1 && (
                            <div 
                              className={`absolute left-4 top-12 w-0.5 h-full -ml-px ${
                                step.completed ? 'bg-green-500' : 'bg-gray-200'
                              }`}
                            />
                          )}
                          <div className="flex items-start gap-4">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 ${
                              step.completed 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : step.current
                                ? 'bg-primary border-primary text-white animate-pulse'
                                : 'bg-white dark:bg-gray-800 border-gray-300 text-gray-400'
                            }`}>
                              {step.completed ? (
                                <CheckCircle className="h-5 w-5" />
                              ) : step.current ? (
                                <StepIcon className="h-5 w-5" />
                              ) : (
                                <Clock className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 pb-6">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className={`font-semibold ${
                                  step.current ? 'text-primary' : 
                                  step.completed ? 'text-gray-900' : 'text-gray-500'
                                }`}>
                                  {step.label}
                                </h4>
                                {step.current && (
                                  <Badge variant="outline" className="text-primary border-primary">
                                    <ArrowRight className="h-3 w-3 mr-1" />
                                    In Progress
                                  </Badge>
                                )}
                                {step.completed && !step.current && (
                                  <span className="text-xs text-gray-500">
                                    {formatDate(step.date.toISOString())}
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm ${
                                step.completed ? 'text-gray-600' : 'text-gray-500'
                              }`}>
                                {step.description}
                              </p>
                              {step.current && (
                                <div className="mt-2 p-2 bg-primary rounded text-xs text-primary flex items-start gap-1">
                                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <span>This is the current status of your order. We'll update you when it moves to the next stage.</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Information */}
              {order.shippingAddress && (
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg">
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
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="h-5 w-5" />
                      External Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Tracking Number</p>
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

              {/* Enhanced Actions */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Button onClick={() => refetch()} variant="outline" className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Status
                    </Button>
                    <Link href="/my-orders" className="w-full">
                      <Button variant="outline" className="w-full">
                        <Package className="h-4 w-4 mr-2" />
                        All Orders
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Download Invoice
                    </Button>
                    <Button variant="outline" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Admin
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Help Section */}
              <Card className="bg-gradient-to-r from-primary to-orange-600 border-primary border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary rounded-full">
                      <Info className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        If you have any questions about your order or need assistance, our support team is here to help.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-3 w-3 mr-2" />
                          Live Chat
                        </Button>
                        <Button size="sm" variant="outline">
                          <Mail className="h-3 w-3 mr-2" />
                          Email Support
                        </Button>
                        <Button size="sm" variant="outline">
                          <Phone className="h-3 w-3 mr-2" />
                          Call Us
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
