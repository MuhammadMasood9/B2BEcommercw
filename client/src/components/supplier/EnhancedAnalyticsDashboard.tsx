import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  RefreshCw, 
  Filter,
  Share,
  Calendar,
  Target,
  Users,
  Package,
  DollarSign,
  Eye,
  MessageSquare,
  ShoppingCart,
  Activity,
  Award,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import AnalyticsCharts from "./AnalyticsCharts";
import PerformanceComparison from "./PerformanceComparison";
import ReportGenerator from "./ReportGenerator";
import GoalTracker from "./GoalTracker";

interface AnalyticsData {
  totalProducts: number;
  approvedProducts: number;
  pendingProducts: number;
  rejectedProducts: number;
  totalViews: number;
  totalInquiries: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  
  topPerformingProducts: Array<{
    id: string;
    name: string;
    views: number;
    inquiries: number;
    orders: number;
    revenue: number;
    conversionRate: number;
    status: string;
  }>;
  
  categoryPerformance: Array<{
    categoryId: string;
    categoryName: string;
    productCount: number;
    totalViews: number;
    totalInquiries: number;
    totalOrders: number;
    totalRevenue: number;
  }>;
  
  customerAnalytics: {
    totalCustomers: number;
    repeatCustomers: number;
    topCustomers: Array<{
      id: string;
      name: string;
      company: string;
      country: string;
      totalOrders: number;
      totalSpent: number;
      lastOrderDate: Date;
    }>;
    customersByCountry: Array<{
      country: string;
      customerCount: number;
      totalOrders: number;
      totalRevenue: number;
    }>;
  };
  
  trafficMetrics: {
    storeViews: number;
    productViews: number;
    inquiryConversionRate: number;
    orderConversionRate: number;
    averageTimeToResponse: number;
  };
  
  monthlyTrends: Array<{
    month: string;
    year: number;
    views: number;
    inquiries: number;
    orders: number;
    revenue: number;
    newProducts: number;
    newCustomers: number;
  }>;
  
  recentActivity: Array<{
    type: 'product_view' | 'inquiry' | 'order' | 'product_created';
    productId?: string;
    productName?: string;
    customerName?: string;
    amount?: number;
    timestamp: Date;
  }>;
}

export default function EnhancedAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      
      const response = await fetch(`/api/suppliers/analytics/overview?timeRange=${timeRange}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      
      if (data.success && data.analytics) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Download comprehensive report
  const downloadReport = async () => {
    try {
      const reportData = {
        title: `Comprehensive Analytics Report - ${timeRange}`,
        generatedAt: new Date().toISOString(),
        timeRange,
        analytics,
        summary: {
          totalRevenue: analytics?.totalRevenue || 0,
          totalOrders: analytics?.totalOrders || 0,
          conversionRate: analytics?.conversionRate || 0,
          topProduct: analytics?.topPerformingProducts[0]?.name || 'N/A'
        }
      };
      
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading comprehensive analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">No Analytics Data</h3>
        <p className="text-muted-foreground mb-4">Analytics data is not available at the moment.</p>
        <Button onClick={fetchAnalytics}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const keyMetrics = [
    {
      label: "Total Revenue",
      value: `$${analytics.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: "+12.5%",
      trend: "up"
    },
    {
      label: "Total Orders",
      value: analytics.totalOrders.toString(),
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: "+8.2%",
      trend: "up"
    },
    {
      label: "Total Views",
      value: analytics.totalViews.toLocaleString(),
      icon: Eye,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: "+15.3%",
      trend: "up"
    },
    {
      label: "Conversion Rate",
      value: `${analytics.conversionRate}%`,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      change: "+2.1%",
      trend: "up"
    }
  ];

  const quickStats = [
    {
      label: "Products",
      value: analytics.totalProducts,
      icon: Package,
      color: "text-blue-600"
    },
    {
      label: "Customers",
      value: analytics.customerAnalytics.totalCustomers,
      icon: Users,
      color: "text-green-600"
    },
    {
      label: "Inquiries",
      value: analytics.totalInquiries,
      icon: MessageSquare,
      color: "text-purple-600"
    },
    {
      label: "Avg Order Value",
      value: `$${analytics.averageOrderValue.toLocaleString()}`,
      icon: Target,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive insights and performance tracking for your business</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={fetchAnalytics} 
            variant="outline" 
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={downloadReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {keyMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-full ${metric.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                  <Badge variant="secondary" className="text-green-600">
                    {metric.change}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                <p className="text-2xl font-bold">{metric.value}</p>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-primary/40"></div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Quick Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Status Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{analytics.approvedProducts}</div>
                <div className="text-sm text-muted-foreground">Approved Products</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{analytics.pendingProducts}</div>
                <div className="text-sm text-muted-foreground">Pending Approval</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{analytics.customerAnalytics.repeatCustomers}</div>
                <div className="text-sm text-muted-foreground">Repeat Customers</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        {activity.type === 'order' && <ShoppingCart className="w-4 h-4" />}
                        {activity.type === 'inquiry' && <MessageSquare className="w-4 h-4" />}
                        {activity.type === 'product_view' && <Eye className="w-4 h-4" />}
                        {activity.type === 'product_created' && <Package className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {activity.type === 'order' && 'New Order'}
                          {activity.type === 'inquiry' && 'New Inquiry'}
                          {activity.type === 'product_view' && 'Product View'}
                          {activity.type === 'product_created' && 'Product Created'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {activity.productName && `${activity.productName} • `}
                          {activity.customerName && `by ${activity.customerName} • `}
                          {activity.amount && `$${activity.amount.toLocaleString()} • `}
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trends Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Monthly Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.monthlyTrends.slice(-3).map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="font-medium">{trend.month} {trend.year}</div>
                      <div className="flex gap-6 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{trend.revenue.toLocaleString()}</div>
                          <div className="text-muted-foreground">Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{trend.orders}</div>
                          <div className="text-muted-foreground">Orders</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-6">
          <AnalyticsCharts 
            data={{
              monthlyTrends: analytics.monthlyTrends,
              categoryPerformance: analytics.categoryPerformance,
              customersByCountry: analytics.customerAnalytics.customersByCountry
            }}
          />
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topPerformingProducts.slice(0, 5).map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <div className="text-sm text-muted-foreground">
                            {product.views} views • {product.inquiries} inquiries
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{product.conversionRate}%</div>
                        <div className="text-sm text-muted-foreground">conversion</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.categoryPerformance.slice(0, 5).map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{category.categoryName}</span>
                        <span className="text-sm text-muted-foreground">
                          ${category.totalRevenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min((category.totalRevenue / Math.max(...analytics.categoryPerformance.map(c => c.totalRevenue))) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.customerAnalytics.topCustomers.slice(0, 5).map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <h4 className="font-medium">{customer.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {customer.company} • {customer.country}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${customer.totalSpent.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">{customer.totalOrders} orders</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.customerAnalytics.customersByCountry.slice(0, 5).map((country, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{country.country}</span>
                      <div className="text-sm">
                        <span className="font-medium">{country.customerCount} customers</span>
                        <span className="text-muted-foreground ml-2">
                          ${country.totalRevenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <PerformanceComparison />
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <GoalTracker />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <ReportGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}