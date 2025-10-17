import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import AdminChat from "@/components/AdminChat";
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

  // Mock data for dashboard
  const stats = {
    totalProducts: 1247,
    totalUsers: 3421,
    totalOrders: 892,
    totalRevenue: 125430,
    activeConversations: 23,
    pendingInquiries: 45,
    newUsersToday: 12,
    productsViewed: 3456
  };

  const recentActivity = [
    {
      id: "1",
      type: "new_user",
      message: "New user John Smith registered",
      timestamp: "2 minutes ago",
      icon: Users,
      color: "text-green-600"
    },
    {
      id: "2",
      type: "new_inquiry",
      message: "New inquiry for LED Flood Lights",
      timestamp: "5 minutes ago",
      icon: MessageSquare,
      color: "text-blue-600"
    },
    {
      id: "3",
      type: "product_view",
      message: "High view count on Industrial Sensors",
      timestamp: "10 minutes ago",
      icon: Eye,
      color: "text-purple-600"
    },
    {
      id: "4",
      type: "order_completed",
      message: "Order #1234 completed successfully",
      timestamp: "15 minutes ago",
      icon: CheckCircle,
      color: "text-green-600"
    }
  ];

  const topProducts = [
    {
      id: "1",
      name: "Industrial LED Flood Lights 100W",
      views: 1250,
      inquiries: 45,
      orders: 12,
      revenue: 5400,
      growth: 15.2
    },
    {
      id: "2",
      name: "Precision CNC Machined Parts",
      views: 890,
      inquiries: 23,
      orders: 8,
      revenue: 3200,
      growth: 8.7
    },
    {
      id: "3",
      name: "High-Quality Cotton T-Shirts",
      views: 2100,
      inquiries: 67,
      orders: 15,
      revenue: 1800,
      growth: -2.1
    }
  ];

  const recentInquiries = [
    {
      id: "1",
      product: "LED Flood Lights",
      user: "John Smith",
      company: "Tech Solutions Inc.",
      quantity: 500,
      status: "pending",
      timestamp: "2 hours ago"
    },
    {
      id: "2",
      product: "CNC Parts",
      user: "Maria Garcia",
      company: "Industrial Supplies Ltd.",
      quantity: 1000,
      status: "replied",
      timestamp: "4 hours ago"
    },
    {
      id: "3",
      product: "Safety Shoes",
      user: "Ahmed Hassan",
      company: "Middle East Trading Co.",
      quantity: 300,
      status: "negotiating",
      timestamp: "6 hours ago"
    }
  ];

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
            <div className="text-3xl font-bold text-white">{stats.totalProducts.toLocaleString()}</div>
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
            <div className="text-3xl font-bold text-white">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-sm text-green-100 mt-1">
              <span className="text-green-300">+8%</span> from last month
            </p>
          </CardContent>
        </Card>

        {/* Active Conversations Card - Purple */}
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Active Conversations</CardTitle>
            <MessageSquare className="h-6 w-6 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.activeConversations}</div>
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
            <div className="text-3xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-sm text-orange-100 mt-1">
              <span className="text-green-300">+18%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
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
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3">
                      <div className={`p-2 rounded-full bg-gray-100`}>
                        <activity.icon className={`h-4 w-4 ${activity.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
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
                  {topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.views} views • {product.inquiries} inquiries
                          </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-semibold">${product.revenue.toLocaleString()}</p>
                        <div className="flex items-center gap-1 text-xs">
                          {product.growth > 0 ? (
                            <ArrowUpRight className="h-3 w-3 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 text-red-600" />
                          )}
                          <span className={product.growth > 0 ? "text-green-600" : "text-red-600"}>
                            {Math.abs(product.growth)}%
                          </span>
                        </div>
                      </div>
                  </div>
                ))}
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
                {recentInquiries.map((inquiry) => {
                  const StatusIcon = getStatusIcon(inquiry.status);
                  return (
                    <div key={inquiry.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
                        <StatusIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                          <p className="font-medium">{inquiry.product}</p>
                          <p className="text-sm text-muted-foreground">
                            {inquiry.user} • {inquiry.company}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {inquiry.quantity} • {inquiry.timestamp}
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
                })}
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
                    <span className="font-semibold">{stats.productsViewed.toLocaleString()}</span>
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
                  <span className="font-semibold text-green-600">+{stats.newUsersToday}</span>
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

        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Live Chat System
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Communicate with users in real-time and manage inquiries efficiently.
              </p>
            </CardHeader>
            <CardContent>
              <AdminChat />
            </CardContent>
          </Card>
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