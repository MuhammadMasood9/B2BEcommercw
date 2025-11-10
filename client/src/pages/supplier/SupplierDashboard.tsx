import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import {
  Package,
  Eye,
  MessageSquare,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Users,
  Send,
  Inbox,
  BarChart3
} from "lucide-react";

export default function SupplierDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch supplier dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/suppliers/dashboard/stats'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/dashboard/stats', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  // Fetch recent inquiries
  const { data: recentInquiries = [], isLoading: inquiriesLoading } = useQuery({
    queryKey: ['/api/suppliers/inquiries', { limit: 5 }],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/inquiries?limit=5', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch inquiries');
      return response.json();
    },
  });

  // Fetch recent orders
  const { data: recentOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/suppliers/orders', { limit: 5 }],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/orders?limit=5', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      return Array.isArray(data) ? data : (data?.orders || []);
    },
  });

  const statsData = stats || {
    totalProducts: 0,
    productViews: 0,
    inquiriesReceived: 0,
    quotationsSent: 0,
    ordersReceived: 0,
    totalRevenue: 0,
    responseRate: 0,
    averageRating: 0,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': case 'accepted': case 'confirmed': case 'delivered': return 'bg-green-100 text-green-800';
      case 'rejected': case 'cancelled': case 'failed': return 'bg-red-100 text-red-800';
      case 'processing': case 'shipped': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return AlertCircle;
      case 'approved': case 'accepted': case 'confirmed': case 'delivered': return CheckCircle;
      case 'processing': case 'shipped': return Clock;
      default: return AlertCircle;
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Supplier Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your products, orders, and customer relationships</p>
        </div>
        <div className="flex gap-2">
          <Link href="/supplier/products">
            <Button>
              <Package className="h-4 w-4 mr-2" />
              Manage Products
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Products</CardTitle>
            <Package className="h-6 w-6 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {statsLoading ? "..." : statsData.totalProducts}
            </div>
            <p className="text-sm text-blue-100 mt-1">
              <span className="text-green-300">+{statsData.newProductsThisMonth || 0}</span> this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Product Views</CardTitle>
            <Eye className="h-6 w-6 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {statsLoading ? "..." : statsData.productViews.toLocaleString()}
            </div>
            <p className="text-sm text-green-100 mt-1">
              <span className="text-green-300">+15%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Inquiries</CardTitle>
            <MessageSquare className="h-6 w-6 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {statsLoading ? "..." : statsData.inquiriesReceived}
            </div>
            <p className="text-sm text-purple-100 mt-1">
              {statsData.pendingInquiries || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-100">Total Revenue</CardTitle>
            <DollarSign className="h-6 w-6 text-orange-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              ${statsLoading ? "..." : statsData.totalRevenue.toLocaleString()}
            </div>
            <p className="text-sm text-orange-100 mt-1">
              {statsData.ordersReceived || 0} orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Inquiries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Inbox className="h-5 w-5" />
                  Recent Inquiries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inquiriesLoading ? (
                    <div className="text-center py-4 text-gray-500">Loading inquiries...</div>
                  ) : recentInquiries.length > 0 ? (
                    recentInquiries.slice(0, 5).map((inquiry: any) => {
                      const StatusIcon = getStatusIcon(inquiry.status);
                      return (
                        <div key={inquiry.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <StatusIcon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{inquiry.productName}</p>
                              <p className="text-sm text-muted-foreground">
                                {inquiry.buyerName} • {inquiry.buyerCompany}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Qty: {inquiry.quantity} • {new Date(inquiry.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(inquiry.status)}>
                              {inquiry.status}
                            </Badge>
                            <Link href={`/supplier/inquiries/${inquiry.id}`}>
                              <Button variant="ghost" size="sm">
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Inbox className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No inquiries yet</p>
                    </div>
                  )}
                </div>
                {recentInquiries.length > 5 && (
                  <Link href="/supplier/inquiries">
                    <Button className="w-full mt-4" variant="outline">
                      View All Inquiries
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ordersLoading ? (
                    <div className="text-center py-4 text-gray-500">Loading orders...</div>
                  ) : recentOrders.length > 0 ? (
                    recentOrders.slice(0, 5).map((order: any) => {
                      const StatusIcon = getStatusIcon(order.status);
                      return (
                        <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <StatusIcon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">#{order.orderNumber}</p>
                              <p className="text-sm text-muted-foreground">
                                {order.buyerName} • {order.buyerCompany}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ${order.totalAmount.toLocaleString()} • {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                            <Link href={`/supplier/orders/${order.id}`}>
                              <Button variant="ghost" size="sm">
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No orders yet</p>
                    </div>
                  )}
                </div>
                {recentOrders.length > 5 && (
                  <Link href="/supplier/orders">
                    <Button className="w-full mt-4" variant="outline">
                      View All Orders
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Product Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/supplier/products">
                  <Button className="w-full justify-start">
                    <Package className="h-4 w-4 mr-2" />
                    View All Products
                  </Button>
                </Link>
                <Link href="/supplier/products/add">
                  <Button variant="outline" className="w-full justify-start">
                    <Package className="h-4 w-4 mr-2" />
                    Add New Product
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Customer Relations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/supplier/inquiries">
                  <Button className="w-full justify-start">
                    <Inbox className="h-4 w-4 mr-2" />
                    View Inquiries ({statsData.pendingInquiries || 0})
                  </Button>
                </Link>
                <Link href="/supplier/messages">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Messages
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Business Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/supplier/analytics">
                  <Button className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </Link>
                <Link href="/supplier/store">
                  <Button variant="outline" className="w-full justify-start">
                    <Activity className="h-4 w-4 mr-2" />
                    Store Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Store Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Response Rate</span>
                      <span className="font-semibold">{statsData.responseRate}%</span>
                    </div>
                    <Progress value={statsData.responseRate} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Average Rating</span>
                      <span className="font-semibold">{statsData.averageRating} ⭐</span>
                    </div>
                    <Progress value={(statsData.averageRating / 5) * 100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Order Fulfillment</span>
                      <span className="font-semibold">95%</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Sales Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Total Orders</span>
                    <span className="font-semibold">{statsData.ordersReceived}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Quotations Sent</span>
                    <span className="font-semibold">{statsData.quotationsSent}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Conversion Rate</span>
                    <span className="font-semibold">
                      {statsData.quotationsSent > 0
                        ? ((statsData.ordersReceived / statsData.quotationsSent) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Average Order Value</span>
                    <span className="font-semibold">
                      ${statsData.ordersReceived > 0
                        ? (statsData.totalRevenue / statsData.ordersReceived).toLocaleString()
                        : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Product Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Total Products</span>
                  <span className="font-semibold">{statsData.totalProducts}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Published</span>
                  <span className="font-semibold">{statsData.publishedProducts || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pending Approval</span>
                  <span className="font-semibold">{statsData.pendingProducts || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Engagement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Total Views</span>
                  <span className="font-semibold">{statsData.productViews.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg Views/Product</span>
                  <span className="font-semibold">
                    {statsData.totalProducts > 0
                      ? Math.round(statsData.productViews / statsData.totalProducts)
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Inquiry Rate</span>
                  <span className="font-semibold">
                    {statsData.productViews > 0
                      ? ((statsData.inquiriesReceived / statsData.productViews) * 100).toFixed(2)
                      : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/supplier/products/add">
                  <Button variant="outline" className="w-full justify-start">
                    <Package className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </Link>
                <Link href="/supplier/products">
                  <Button variant="outline" className="w-full justify-start">
                    <Activity className="h-4 w-4 mr-2" />
                    Manage Products
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Total Revenue</span>
                    <span className="font-semibold">${statsData.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>This Month</span>
                    <span className="font-semibold">${(statsData.revenueThisMonth || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Last Month</span>
                    <span className="font-semibold">${(statsData.revenueLastMonth || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Growth</span>
                    <span className="font-semibold text-green-600">+18%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Total Customers</span>
                    <span className="font-semibold">{statsData.totalCustomers || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Repeat Customers</span>
                    <span className="font-semibold">{statsData.repeatCustomers || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Customer Retention</span>
                    <span className="font-semibold">
                      {statsData.totalCustomers > 0
                        ? ((statsData.repeatCustomers / statsData.totalCustomers) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
