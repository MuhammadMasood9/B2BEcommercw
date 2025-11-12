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
  XCircle,
  Store
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
      case 'replied': return 'bg-primary text-primary';
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
    <div className="p-8 space-y-6 bg-background theme-transition">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "Admin Dashboard" }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground theme-transition">Platform Dashboard</h1>
          <p className="text-muted-foreground mt-1 theme-transition">Monitor platform performance, supplier activity, and marketplace health.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Quick Stats - Platform Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Suppliers Card - Primary Orange */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80">Total Suppliers</CardTitle>
            <Store className="h-6 w-6 text-primary-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {statsLoading ? "..." : (statsData.totalSuppliers || 0).toLocaleString()}
            </div>
            <p className="text-sm text-primary-foreground/80 mt-1">
              <span className="text-green-300">+{statsData.newSuppliersToday || 0}</span> new today
            </p>
          </CardContent>
        </Card>

        {/* Pending Approvals Card - Secondary Dark Grey */}
        <Card className="bg-gradient-to-br from-secondary to-secondary/80 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-secondary-foreground/80">Pending Approvals</CardTitle>
            <AlertCircle className="h-6 w-6 text-secondary-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {statsLoading ? "..." : (statsData.pendingSuppliers || 0) + (statsData.pendingProducts || 0)}
            </div>
            <p className="text-sm text-secondary-foreground/80 mt-1">
              {statsData.pendingSuppliers || 0} suppliers • {statsData.pendingProducts || 0} products
            </p>
          </CardContent>
        </Card>

        {/* Total Products Card - Orange Accent */}
        <Card className="bg-gradient-to-br from-accent to-accent/80 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-accent-foreground/80">Total Products</CardTitle>
            <Package className="h-6 w-6 text-accent-foreground/70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {statsLoading ? "..." : statsData.totalProducts.toLocaleString()}
            </div>
            <p className="text-sm text-accent-foreground/80 mt-1">
              <span className="text-green-300">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        {/* Total Buyers Card - Primary Orange Variant */}
        <Card className="bg-gradient-to-br from-brand-orange-600 to-brand-orange-700 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Total Buyers</CardTitle>
            <Users className="h-6 w-6 text-white/70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {statsLoading ? "..." : (statsData.totalBuyers || statsData.totalUsers || 0).toLocaleString()}
            </div>
            <p className="text-sm text-white/80 mt-1">
              <span className="text-green-300">+8%</span> from last month
            </p>
          </CardContent>
        </Card>

        {/* Platform Revenue Card - Dark Grey */}
        <Card className="bg-gradient-to-br from-brand-grey-800 to-brand-grey-900 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Platform Revenue</CardTitle>
            <DollarSign className="h-6 w-6 text-white/70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              ${statsLoading ? "..." : (statsData.platformRevenue || statsData.totalRevenue || 0).toLocaleString()}
            </div>
            <p className="text-sm text-white/80 mt-1">
              <span className="text-green-300">+18%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
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
                          <Activity className="h-4 w-4 text-primary" />
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
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary">
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

          {/* Platform Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Platform Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">System Status</p>
                      <p className="text-sm text-muted-foreground">All systems operational</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Store className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Active Suppliers</p>
                      <p className="text-sm text-muted-foreground">{statsData.activeSuppliers || 0} suppliers online</p>
                    </div>
                  </div>
                  <Badge variant="outline">{((statsData.activeSuppliers || 0) / (statsData.totalSuppliers || 1) * 100).toFixed(0)}%</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Product Listings</p>
                      <p className="text-sm text-muted-foreground">{statsData.totalProducts || 0} active products</p>
                    </div>
                  </div>
                  <Badge variant="outline">Live</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Platform Growth</p>
                      <p className="text-sm text-muted-foreground">+15% this month</p>
                    </div>
                  </div>
                  <Badge className="bg-primary/10 text-primary">Growing</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Supplier Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin/suppliers">
                  <Button className="w-full justify-start">
                    <Store className="h-4 w-4 mr-2" />
                    View All Suppliers
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Pending Approvals ({statsData.pendingSuppliers || 0})
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Verification Requests
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Supplier Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Suppliers</span>
                    <span className="font-semibold">{statsData.activeSuppliers || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Verified Suppliers</span>
                    <span className="font-semibold">{statsData.verifiedSuppliers || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Rating</span>
                    <span className="font-semibold">4.5 ⭐</span>
                  </div>
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
                  Export Supplier Data
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Supplier Performance
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Bell className="h-4 w-4 mr-2" />
                  Send Notifications
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Product Oversight</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin/products">
                  <Button className="w-full justify-start">
                    <Package className="h-4 w-4 mr-2" />
                    View All Products
                  </Button>
                </Link>
                <Link href="/admin/product-approval">
                  <Button variant="outline" className="w-full justify-start">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Product Approvals ({statsData.pendingProducts || 0})
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

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Platform Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Supplier Growth Rate</span>
                      <span className="font-semibold text-green-600">+15%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Product Approval Rate</span>
                      <span className="font-semibold">92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Platform Engagement</span>
                      <span className="font-semibold">78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Avg Response Time</span>
                      <span className="font-semibold">2.3 hours</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Supplier Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Top Performing Suppliers</span>
                    <span className="font-semibold">45</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Supplier Rating</span>
                    <span className="font-semibold">4.5 ⭐</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Products per Supplier</span>
                    <span className="font-semibold">23</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Orders per Supplier</span>
                    <span className="font-semibold">156</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Supplier Retention Rate</span>
                    <span className="font-semibold">94%</span>
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Total GMV</span>
                    <span className="font-semibold">${(statsData.totalRevenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Platform Commission</span>
                    <span className="font-semibold">${((statsData.totalRevenue || 0) * 0.05).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Order Value</span>
                    <span className="font-semibold">$2,450</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Monthly Growth</span>
                    <span className="font-semibold text-green-600">+18%</span>
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