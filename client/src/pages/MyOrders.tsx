import { useState } from "react";
import { Link, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
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
  ExternalLink,
  ShoppingCart,
  Check,
  TrendingUp,
  Globe,
  Shield,
  ArrowRight,
  Plus
} from "lucide-react";

export default function MyOrders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const queryClient = useQueryClient();

  // Accept order mutation
  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/${orderId}/accept`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to accept order');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Order accepted successfully!');
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setIsOrderDetailOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to accept order');
    }
  });

  // Reject order mutation
  const rejectOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/${orderId}/reject`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to reject order');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Order rejected');
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setIsOrderDetailOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject order');
    }
  });

  // Fetch orders from API
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/orders', {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        return data.orders || [];
      } catch (error) {
        console.error('Error fetching orders:', error);
        // Return mock data if API fails
        return [
          {
            id: "ORD-2024-001",
            orderNumber: "ORD-2024-001",
            productName: "Wireless Earbuds",
            quantity: 1000,
            unitPrice: 15.50,
            totalAmount: 15500,
            status: "pending",
            orderDate: "2024-01-20",
            expectedDelivery: "2024-02-20",
            supplierName: "Tech Solutions Ltd",
            supplierEmail: "contact@techsolutions.com",
            supplierPhone: "+1-555-0123",
            shippingAddress: "123 Business St, New York, NY 10001",
            notes: "Please ensure quality packaging",
            attachments: ["invoice.pdf", "specifications.docx"]
          },
          {
            id: "ORD-2024-002",
            orderNumber: "ORD-2024-002",
            productName: "LED Display Panels",
            quantity: 500,
            unitPrice: 45.00,
            totalAmount: 22500,
            status: "confirmed",
            orderDate: "2024-01-18",
            expectedDelivery: "2024-02-15",
            supplierName: "Display Tech Inc",
            supplierEmail: "sales@displaytech.com",
            supplierPhone: "+1-555-0456",
            shippingAddress: "456 Commerce Ave, Los Angeles, CA 90210",
            notes: "Urgent delivery required",
            attachments: ["contract.pdf"]
          }
        ];
      }
    }
  });

  // Ensure orders is always an array
  const orders = Array.isArray(ordersData) ? ordersData : [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "confirmed": return <CheckCircle className="h-4 w-4" />;
      case "shipped": return <Truck className="h-4 w-4" />;
      case "delivered": return <Check className="h-4 w-4" />;
      case "cancelled": return <AlertCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-blue-100 text-blue-800";
      case "shipped": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredOrders = orders.filter((order: any) =>
    order.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingOrders = filteredOrders.filter((order: any) => order.status === "pending");
  const confirmedOrders = filteredOrders.filter((order: any) => order.status === "confirmed");
  const shippedOrders = filteredOrders.filter((order: any) => order.status === "shipped");
  const deliveredOrders = filteredOrders.filter((order: any) => order.status === "delivered");

  const handleOrderAction = (orderId: string, action: 'accept' | 'reject') => {
    if (action === 'accept') {
      acceptOrderMutation.mutate(orderId);
    } else {
      rejectOrderMutation.mutate(orderId);
    }
  };

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
              <ShoppingCart className="w-4 h-4" />
              <span>My Orders</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              My
              <span className="bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent block">
                Orders
              </span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Track and manage your orders from verified admins worldwide
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-300" />
                <span>Verified Admins</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-300" />
                <span>Fast Processing</span>
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
          {/* Header with Search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
                  </div>
                  </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white border-gray-100 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{pendingOrders.length}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-100 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{confirmedOrders.length}</div>
                <div className="text-sm text-gray-600">Confirmed</div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-100 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{shippedOrders.length}</div>
                <div className="text-sm text-gray-600">Shipped</div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-100 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{deliveredOrders.length}</div>
                <div className="text-sm text-gray-600">Delivered</div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Tabs */}
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All Orders</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
              <TabsTrigger value="shipped">Shipped</TabsTrigger>
              <TabsTrigger value="delivered">Delivered</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                        <div className="h-3 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredOrders.map((order: any) => (
                    <Card key={order.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {order.productName}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">Order #{order.orderNumber}</p>
                          </div>
                          <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                            {getStatusIcon(order.status)}
                            {order.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Quantity:</span>
                            <span className="font-medium">{order.quantity.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Unit Price:</span>
                            <span className="font-medium">${order.unitPrice}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-medium text-green-600">${order.totalAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Admin:</span>
                            <span className="font-medium">{order.supplierName}</span>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Ordered: {new Date(order.orderDate).toLocaleDateString()}</span>
                            <span>Expected: {new Date(order.expectedDelivery).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsOrderDetailOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4" />
                    </Button>
                        </div>
                  </CardContent>
                </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery ? 'Try adjusting your search criteria' : 'You haven\'t placed any orders yet'}
                    </p>
                    <Link href="/products">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                        Browse Products
                      </Button>
                    </Link>
                          </div>
              )}
            </TabsContent>

            {/* Other tabs content would be similar but filtered by status */}
            <TabsContent value="pending" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingOrders.map((order: any) => (
                  <Card key={order.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {order.productName}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">Order #{order.orderNumber}</p>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                                  {getStatusIcon(order.status)}
                          {order.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium">{order.quantity.toLocaleString()}</span>
                                  </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Unit Price:</span>
                          <span className="font-medium">${order.unitPrice}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium text-green-600">${order.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Admin:</span>
                          <span className="font-medium">{order.supplierName}</span>
                        </div>
                        </div>

                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Ordered: {new Date(order.orderDate).toLocaleDateString()}</span>
                          <span>Expected: {new Date(order.expectedDelivery).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsOrderDetailOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                                <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                </Card>
                ))}
              </div>
            </TabsContent>

            {/* Similar structure for other tabs */}
            <TabsContent value="confirmed" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {confirmedOrders.map((order: any) => (
                  <Card key={order.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                  <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {order.productName}
                    </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">Order #{order.orderNumber}</p>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium">{order.quantity.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Unit Price:</span>
                          <span className="font-medium">${order.unitPrice}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium text-green-600">${order.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Admin:</span>
                          <span className="font-medium">{order.supplierName}</span>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Ordered: {new Date(order.orderDate).toLocaleDateString()}</span>
                          <span>Expected: {new Date(order.expectedDelivery).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsOrderDetailOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="shipped" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shippedOrders.map((order: any) => (
                  <Card key={order.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {order.productName}
                  </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">Order #{order.orderNumber}</p>
                    </div>
                        <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </Badge>
                  </div>
                </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium">{order.quantity.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Unit Price:</span>
                          <span className="font-medium">${order.unitPrice}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium text-green-600">${order.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Admin:</span>
                          <span className="font-medium">{order.supplierName}</span>
                          </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Ordered: {new Date(order.orderDate).toLocaleDateString()}</span>
                          <span>Expected: {new Date(order.expectedDelivery).toLocaleDateString()}</span>
                    </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsOrderDetailOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                  </div>
                </CardContent>
              </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="delivered" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deliveredOrders.map((order: any) => (
                  <Card key={order.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border-gray-100">
                  <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {order.productName}
                    </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">Order #{order.orderNumber}</p>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </Badge>
                      </div>
                  </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium">{order.quantity.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Unit Price:</span>
                          <span className="font-medium">${order.unitPrice}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium text-green-600">${order.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Admin:</span>
                          <span className="font-medium">{order.supplierName}</span>
                        </div>
                    </div>
                      
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Ordered: {new Date(order.orderDate).toLocaleDateString()}</span>
                          <span>Expected: {new Date(order.expectedDelivery).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsOrderDetailOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
            </div>
      </main>

      <Footer />
    </div>
  );
}