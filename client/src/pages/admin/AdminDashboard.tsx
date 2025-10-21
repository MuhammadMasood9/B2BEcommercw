import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Breadcrumb from "@/components/Breadcrumb";
import {
  Package,
  Users,
  MessageSquare,
  TrendingUp,
  ShoppingCart,
  Eye,
  Star,
  DollarSign,
  Globe,
  Settings,
  BarChart3,
  Bell,
  Search,
  Filter,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Shield,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch dashboard stats from API
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/dashboard/stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/dashboard/stats', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (!response.ok) throw new Error('Failed to fetch stats');
        return await response.json();
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Return default values if API fails
        return {
          totalProducts: 0,
          totalUsers: 0,
          totalOrders: 0,
          totalRevenue: 0,
          pendingInquiries: 0,
          newUsersToday: 0,
          productsViewed: 0
        };
      }
    }
  });

  // Fetch recent activity from API
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['/api/admin/dashboard/activity'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/dashboard/activity', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (!response.ok) throw new Error('Failed to fetch activity');
        return await response.json();
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        return [];
      }
    }
  });

  // Fetch top products from API
  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/admin/dashboard/top-products'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/dashboard/top-products', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (!response.ok) throw new Error('Failed to fetch top products');
        return await response.json();
      } catch (error) {
        console.error('Error fetching top products:', error);
        return [];
      }
    }
  });

  // Fetch recent inquiries from API
  const { data: recentInquiries, isLoading: inquiriesLoading } = useQuery({
    queryKey: ['/api/admin/dashboard/recent-inquiries'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/dashboard/recent-inquiries', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (!response.ok) throw new Error('Failed to fetch recent inquiries');
        return await response.json();
      } catch (error) {
        console.error('Error fetching recent inquiries:', error);
        return [];
      }
    }
  });

  // Use dynamic data with fallbacks
  const activityData = recentActivity || [];
  const productsData = topProducts || [];
  const inquiriesData = recentInquiries || [];
  const statsData = stats || {
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingInquiries: 0,
    newUsersToday: 0,
    productsViewed: 0
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'replied': return 'bg-blue-100 text-blue-800';
      case 'negotiating': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return AlertCircle;
      case 'replied': return CheckCircle;
      case 'negotiating': return Clock;
      case 'completed': return CheckCircle;
      default: return XCircle;
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "Admin Dashboard" }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening with your B2B marketplace.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Products Card - Blue */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Products</CardTitle>
            <Package className="h-6 w-6 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {statsLoading ? "..." : statsData.totalProducts.toLocaleString()}
            </div>
            <p className="text-sm text-blue-100 mt-1">
              <span className="text-green-300">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        {/* Total Users Card - Green */}
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Total Users</CardTitle>
            <Users className="h-6 w-6 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {statsLoading ? "..." : statsData.totalUsers.toLocaleString()}
            </div>
            <p className="text-sm text-green-100 mt-1">
              <span className="text-green-300">+8%</span> from last month
            </p>
          </CardContent>
        </Card>

        {/* Pending Inquiries Card - Purple */}
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Pending Inquiries</CardTitle>
            <MessageSquare className="h-6 w-6 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {statsLoading ? "..." : statsData.pendingInquiries}
            </div>
            <p className="text-sm text-purple-100 mt-1">
              <span className="text-orange-300">+3</span> new today
            </p>
          </CardContent>
        </Card>

        {/* Total Revenue Card - Orange */}
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
              <span className="text-green-300">+18%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityLoading ? (
                    <div className="text-center py-4 text-gray-500">Loading recent activity...</div>
                  ) : activityData.length > 0 ? (
                    activityData.map((activity: any) => (
                      <div key={activity.id} className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-gray-100">
                          <Activity className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.message || activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.timestamp || activity.createdAt}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">No recent activity</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Performing Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {productsLoading ? (
                    <div className="text-center py-4 text-gray-500">Loading top products...</div>
                  ) : productsData.length > 0 ? (
                    productsData.map((product: any, index: number) => (
                      <div key={product.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{product.name || product.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.views || 0} views • {product.inquiries || 0} inquiries
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">${(product.revenue || product.totalRevenue || 0).toLocaleString()}</p>
                          <div className="flex items-center gap-1 text-xs">
                            {(product.growth || 0) > 0 ? (
                              <ArrowUpRight className="h-3 w-3 text-green-600" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3 text-red-600" />
                            )}
                            <span className={(product.growth || 0) > 0 ? "text-green-600" : "text-red-600"}>
                              {Math.abs(product.growth || 0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">No products data available</div>
                  )}
                </div>
              </CardContent>
        </Card>
      </div>

          {/* Recent Inquiries */}
      <Card>
        <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Inquiries
              </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inquiriesLoading ? (
              <div className="text-center py-4 text-gray-500">Loading recent inquiries...</div>
            ) : inquiriesData.length > 0 ? (
              inquiriesData.map((inquiry: any) => {
                const StatusIcon = getStatusIcon(inquiry.status);
                return (
                  <div key={inquiry.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <StatusIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Product {inquiry.productId}</p>
                        <p className="text-sm text-muted-foreground">
                          {inquiry.userName} • {inquiry.companyName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {inquiry.quantity} • {inquiry.createdAt}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(inquiry.status)}>
                        {inquiry.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-gray-500">No recent inquiries</div>
            )}
          </div>
        </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Product Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin/products">
                  <Button className="w-full justify-start">
                    <Package className="h-4 w-4 mr-2" />
                    View All Products
                  </Button>
                </Link>
                <Link href="/admin/products/add">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Product
                  </Button>
                </Link>
                <Link href="/admin/categories">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Categories
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Product Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Views</span>
                    <span className="font-semibold">{(statsData.productsViewed || 0).toLocaleString()}</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Inquiry Rate</span>
                    <span className="font-semibold">3.2%</span>
                  </div>
                  <Progress value={32} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Conversion Rate</span>
                    <span className="font-semibold">1.8%</span>
                  </div>
                  <Progress value={18} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export Product Data
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Bulk Edit
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">User Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin/users">
                  <Button className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    View All Users
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Verify Users
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Award className="h-4 w-4 mr-2" />
                  Manage Badges
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">User Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>New Users Today</span>
                  <span className="font-semibold text-green-600">+{statsData.newUsersToday || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Verified Users</span>
                  <span className="font-semibold">2,847 (83%)</span>
              </div>
                <div className="flex justify-between text-sm">
                  <span>Active Users</span>
                  <span className="font-semibold">1,234 (36%)</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">User Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export User Data
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Bell className="h-4 w-4 mr-2" />
                  Send Notifications
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  User Analytics
                </Button>
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
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Page Views</span>
                      <span className="font-semibold">45,678</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Inquiry Conversion</span>
                      <span className="font-semibold">3.2%</span>
                    </div>
                    <Progress value={32} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>User Engagement</span>
                      <span className="font-semibold">78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Geographic Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>China</span>
                    <span className="font-semibold">45%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>India</span>
                    <span className="font-semibold">23%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Vietnam</span>
                    <span className="font-semibold">15%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Thailand</span>
                    <span className="font-semibold">12%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Others</span>
                    <span className="font-semibold">5%</span>
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