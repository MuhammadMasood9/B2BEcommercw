import { useState } from "react";
import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Package, 
  Search, 
  Eye, 
  MessageSquare, 
  Download, 
  Truck, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  Calendar, 
  User, 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  FileText,
  ArrowLeft,
  RefreshCw,
  Star,
  ExternalLink
} from "lucide-react";

export default function MyOrders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch user's orders
  const { data: orders = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/orders', searchQuery, activeTab],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (activeTab !== 'all') params.append('status', activeTab);
        
        const response = await fetch(`/api/orders?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await response.json();
        return data.orders || [];
      } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
      }
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
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

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsOrderDetailOpen(true);
  };

  const filteredOrders = orders.filter((order: any) => {
    const matchesSearch = !searchQuery || 
      order.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = activeTab === 'all' || order.status === activeTab;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o: any) => o.status === 'pending').length,
    confirmed: orders.filter((o: any) => o.status === 'confirmed').length,
    processing: orders.filter((o: any) => o.status === 'processing').length,
    shipped: orders.filter((o: any) => o.status === 'shipped').length,
    delivered: orders.filter((o: any) => o.status === 'delivered').length,
    totalValue: orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0)
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        {/* Header Section */}
        <div className="gradient-blue text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
            <h1 className="text-4xl font-bold mb-2">My Orders</h1>
            <p className="text-gray-200">Track and manage your purchase orders</p>
              </div>
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Delivered</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.delivered}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.processing + stats.shipped}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(stats.totalValue)}</p>
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="search"
                    placeholder="Search by order number, product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
                </div>
              </div>
            </div>
          </div>

          {/* Orders Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white dark:bg-gray-800">
              <TabsTrigger value="all">All Orders ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed ({stats.confirmed})</TabsTrigger>
              <TabsTrigger value="processing">Processing ({stats.processing})</TabsTrigger>
              <TabsTrigger value="shipped">Shipped ({stats.shipped})</TabsTrigger>
              <TabsTrigger value="delivered">Delivered ({stats.delivered})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading orders...</span>
                </div>
              ) : error ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <AlertCircle className="h-16 w-16 mx-auto text-red-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Error loading orders
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      There was an error loading your orders. Please try again.
                    </p>
                    <Button onClick={() => refetch()} className="mt-4">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              ) : filteredOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No orders found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchQuery || activeTab !== 'all' 
                        ? 'Try adjusting your search or filter criteria.'
                        : 'You haven\'t placed any orders yet.'
                      }
                    </p>
                    <Link href="/products">
                      <Button className="mt-4">
                        <Package className="h-4 w-4 mr-2" />
                        Browse Products
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                filteredOrders.map((order: any) => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        </div>

                        {/* Order Details */}
                        <div className="flex-1">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {order.productName || 'Unknown Product'}
                                </h3>
                                <Badge className={getStatusColor(order.status)}>
                                  {getStatusIcon(order.status)}
                          {order.status}
                        </Badge>
                      </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    <FileText className="h-4 w-4" />
                                    <span>Order: {order.orderNumber}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>Ordered: {formatDate(order.createdAt)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Package className="h-4 w-4" />
                                    <span>Qty: {order.quantity} units</span>
                                  </div>
                        </div>

                        <div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    <DollarSign className="h-4 w-4" />
                                    <span>Total: {formatPrice(order.totalAmount)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    <DollarSign className="h-4 w-4" />
                                    <span>Unit Price: {formatPrice(order.unitPrice)}</span>
                                  </div>
                                  {order.trackingNumber && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                      <Truck className="h-4 w-4" />
                                      <span>Tracking: {order.trackingNumber}</span>
                                    </div>
                                  )}
                        </div>
                        </div>

                              <div className="flex flex-wrap gap-2 text-sm">
                                <Badge variant="outline">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {order.paymentMethod || 'T/T'}
                                </Badge>
                                <Badge variant="outline">
                                  <Package className="h-3 w-3 mr-1" />
                                  {order.paymentStatus || 'pending'}
                                </Badge>
                        </div>
                      </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewOrder(order)}
                              >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                              {order.trackingNumber && (
                                <Button variant="outline" size="sm">
                          <Truck className="h-4 w-4 mr-2" />
                          Track Shipment
                        </Button>
                              )}
                              <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Contact Supplier
                        </Button>
                              <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download Invoice
                        </Button>
                      </div>
                    </div>
                  </div>
                      </div>
                    </CardContent>
                </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Order Detail Dialog */}
      <Dialog open={isOrderDetailOpen} onOpenChange={setIsOrderDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details - {selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Order Status
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {getStatusIcon(selectedOrder.status)}
                      {selectedOrder.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Order Date</p>
                      <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Payment Status</p>
                      <p className="font-medium">{selectedOrder.paymentStatus || 'Pending'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Payment Method</p>
                      <p className="font-medium">{selectedOrder.paymentMethod || 'T/T'}</p>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">{selectedOrder.productName || 'Unknown Product'}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium">{selectedOrder.quantity} units</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Unit Price:</span>
                          <span className="font-medium">{formatPrice(selectedOrder.unitPrice)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total Amount:</span>
                          <span>{formatPrice(selectedOrder.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <Package className="h-16 w-16 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Information */}
              {selectedOrder.shippingAddress && (
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
                        {typeof selectedOrder.shippingAddress === 'string' 
                          ? selectedOrder.shippingAddress 
                          : JSON.stringify(selectedOrder.shippingAddress)
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tracking Information */}
              {selectedOrder.trackingNumber && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Tracking Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Tracking Number</p>
                        <p className="font-mono text-lg">{selectedOrder.trackingNumber}</p>
                      </div>
                      <Button variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Track Package
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Order Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedOrder.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
