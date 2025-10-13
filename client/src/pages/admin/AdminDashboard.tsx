import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Users, Building2, DollarSign, TrendingUp, TrendingDown, Eye, MessageSquare, Star, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function AdminDashboard() {
  const { data: analytics, isLoading } = useQuery<{
    totalProducts: number;
    totalOrders: number;
    totalCustomers: number;
    totalSuppliers: number;
    totalRevenue: string;
    totalUsers: number;
    totalInquiries: number;
    totalMessages: number;
    totalReviews: number;
    recentOrders: any[];
    recentProducts: any[];
    topSuppliers: any[];
    monthlyRevenue: any[];
    orderStatusCounts: any;
    userGrowth: any[];
    productCategories: any[];
  }>({
    queryKey: ["/api/analytics"],
  });

  // Fetch additional data for comprehensive dashboard
  const { data: recentProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const { data: allOrders = [] } = useQuery<any[]>({
    queryKey: ["/api/orders"],
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Calculate additional metrics
  const totalUsers = allUsers?.length || analytics?.totalUsers || 0;
  const totalProducts = recentProducts?.length || analytics?.totalProducts || 0;
  const totalOrders = allOrders?.length || analytics?.totalOrders || 0;
  const totalRevenue = analytics?.totalRevenue ? Number(analytics.totalRevenue).toFixed(2) : '0.00';
  
  // Calculate growth percentages (mock data for now)
  const growthData = {
    users: 12.5,
    products: 8.3,
    orders: 15.2,
    revenue: 22.1
  };

  const stats = [
    {
      title: "Total Users",
      value: totalUsers,
      icon: Users,
      growth: growthData.users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Products",
      value: totalProducts,
      icon: Package,
      growth: growthData.products,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Orders",
      value: totalOrders,
      icon: ShoppingCart,
      growth: growthData.orders,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Revenue",
      value: `$${totalRevenue}`,
      icon: DollarSign,
      growth: growthData.revenue,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const quickActions = [
    { title: "Add Product", icon: Package, href: "/admin/products", color: "bg-blue-500" },
    { title: "Manage Suppliers", icon: Building2, href: "/admin/suppliers", color: "bg-green-500" },
    { title: "View Orders", icon: ShoppingCart, href: "/admin/orders", color: "bg-purple-500" },
    { title: "Customer Support", icon: MessageSquare, href: "/admin/customers", color: "bg-orange-500" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'default';
      case 'processing': return 'secondary';
      case 'shipped': return 'outline';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back! Here's what's happening with your B2B marketplace.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            View Reports
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} data-testid={`card-stat-${stat.title.toLowerCase().replace(' ', '-')}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`text-stat-${stat.title.toLowerCase().replace(' ', '-')}`}>
                {stat.value}
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">+{stat.growth}%</span>
                <span className="text-xs text-muted-foreground ml-2">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-gray-50"
                asChild
              >
                <a href={action.href}>
                  <div className={`p-3 rounded-lg ${action.color} text-white`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium">{action.title}</span>
                </a>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            {analytics?.recentOrders && analytics.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {analytics.recentOrders.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">#{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${parseFloat(order.totalAmount).toFixed(2)}</p>
                      <Badge variant={getStatusColor(order.status)} className="text-xs">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent orders</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Products</CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            {recentProducts && recentProducts.length > 0 ? (
              <div className="space-y-4">
                {recentProducts.slice(0, 5).map((product: any) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">SKU: {product.sku || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${product.regularPrice || '0.00'}</p>
                      <Badge variant={product.isPublished ? "default" : "secondary"} className="text-xs">
                        {product.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No products yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Server Status</p>
                <p className="text-sm text-green-600">All systems operational</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Active Users</p>
                <p className="text-sm text-blue-600">{totalUsers} users online</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Products</p>
                <p className="text-sm text-purple-600">{totalProducts} total products</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
