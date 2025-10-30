import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnalyticsCharts from "./AnalyticsCharts";
import PerformanceComparison from "./PerformanceComparison";
import ReportGenerator from "./ReportGenerator";
import GoalTracker from "./GoalTracker";
import { 
  Eye, 
  MessageSquare, 
  TrendingUp, 
  Package,
  Star,
  ShoppingCart,
  BarChart3,
  Calendar,
  Users,
  DollarSign,
  Globe,
  Download,
  Target,
  Activity,
  RefreshCw,
  Filter,
  Share
} from "lucide-react";

interface AnalyticsData {
  // Performance Metrics
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
  
  // Product Performance
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
  
  // Category Performance
  categoryPerformance: Array<{
    categoryId: string;
    categoryName: string;
    productCount: number;
    totalViews: number;
    totalInquiries: number;
    totalOrders: number;
    totalRevenue: number;
  }>;
  
  // Customer Analytics
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
  
  // Traffic and Conversion
  trafficMetrics: {
    storeViews: number;
    productViews: number;
    inquiryConversionRate: number;
    orderConversionRate: number;
    averageTimeToResponse: number;
  };
  
  // Time-based Trends
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
}

interface GoalData {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline: Date;
  progress: number;
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
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
    }
  };

  // Fetch goals data (mock for now)
  const fetchGoals = async () => {
    // Mock goals data - in real implementation, this would come from API
    const mockGoals: GoalData[] = [
      {
        id: "1",
        title: "Monthly Revenue",
        target: 50000,
        current: 32500,
        unit: "$",
        deadline: new Date(2024, 11, 31),
        progress: 65
      },
      {
        id: "2", 
        title: "New Products",
        target: 20,
        current: 14,
        unit: "products",
        deadline: new Date(2024, 11, 31),
        progress: 70
      },
      {
        id: "3",
        title: "Customer Inquiries",
        target: 500,
        current: 387,
        unit: "inquiries",
        deadline: new Date(2024, 11, 31),
        progress: 77
      }
    ];
    
    setGoals(mockGoals);
  };

  // Download report
  const downloadReport = async () => {
    try {
      // In a real implementation, this would generate and download a PDF/Excel report
      const reportData = {
        timeRange,
        generatedAt: new Date().toISOString(),
        analytics
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
    fetchGoals();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">No Analytics Data</h3>
        <p className="text-muted-foreground">Analytics data is not available at the moment.</p>
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
      change: "+12.5%"
    },
    {
      label: "Total Orders",
      value: analytics.totalOrders.toString(),
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: "+8.2%"
    },
    {
      label: "Total Views",
      value: analytics.totalViews.toLocaleString(),
      icon: Eye,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: "+15.3%"
    },
    {
      label: "Conversion Rate",
      value: `${analytics.conversionRate}%`,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      change: "+2.1%"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive insights into your business performance</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
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
            Download Report
          </Button>
          <Button variant="outline" size="sm">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {keyMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
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
              </CardContent>
            </Card>
          );
        })}
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
            {/* Product Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Product Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Approved</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(analytics.approvedProducts / analytics.totalProducts) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{analytics.approvedProducts}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pending</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{ width: `${(analytics.pendingProducts / analytics.totalProducts) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{analytics.pendingProducts}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Rejected</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${(analytics.rejectedProducts / analytics.totalProducts) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{analytics.rejectedProducts}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Traffic Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Traffic & Conversion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Store Views</span>
                    <span className="font-medium">{analytics.trafficMetrics.storeViews.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Product Views</span>
                    <span className="font-medium">{analytics.trafficMetrics.productViews.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inquiry Rate</span>
                    <span className="font-medium">{analytics.trafficMetrics.inquiryConversionRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Rate</span>
                    <span className="font-medium">{analytics.trafficMetrics.orderConversionRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Monthly Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.monthlyTrends.slice(-6).map((trend, trendIndex) => (
                  <div key={trendIndex} className="flex items-center justify-between p-3 border rounded">
                    <div className="font-medium">{trend.month} {trend.year}</div>
                    <div className="flex gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{trend.views.toLocaleString()}</div>
                        <div className="text-muted-foreground">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{trend.inquiries}</div>
                        <div className="text-muted-foreground">Inquiries</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{trend.orders}</div>
                        <div className="text-muted-foreground">Orders</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">${trend.revenue.toLocaleString()}</div>
                        <div className="text-muted-foreground">Revenue</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Top Performing Products
                </CardTitle>
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
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{product.views} views</span>
                            <span>{product.inquiries} inquiries</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {product.conversionRate}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          conversion
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Category Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Category Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.categoryPerformance.map((category, categoryIndex) => (
                    <div key={categoryIndex} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{category.categoryName}</span>
                        <span className="text-sm text-muted-foreground">
                          {category.productCount} products
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Views:</span>
                          <span className="font-medium">{category.totalViews.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Revenue:</span>
                          <span className="font-medium">${category.totalRevenue.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min((category.totalViews / Math.max(...analytics.categoryPerformance.map(c => c.totalViews))) * 100, 100)}%` 
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
            {/* Top Customers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Customers
                </CardTitle>
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
                        <div className="text-sm text-muted-foreground">
                          {customer.totalOrders} orders
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Customers by Country */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Customers by Country
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.customerAnalytics.customersByCountry.slice(0, 5).map((country, countryIndex) => (
                    <div key={countryIndex} className="flex items-center justify-between">
                      <span className="font-medium">{country.country}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span>{country.customerCount} customers</span>
                        <span className="font-medium">${country.totalRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {analytics.customerAnalytics.totalCustomers}
                  </div>
                  <div className="text-muted-foreground">Total Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {analytics.customerAnalytics.repeatCustomers}
                  </div>
                  <div className="text-muted-foreground">Repeat Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {analytics.customerAnalytics.totalCustomers > 0 
                      ? Math.round((analytics.customerAnalytics.repeatCustomers / analytics.customerAnalytics.totalCustomers) * 100)
                      : 0}%
                  </div>
                  <div className="text-muted-foreground">Retention Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab - Enhanced */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Package className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold">{analytics.totalProducts}</div>
                <div className="text-sm text-muted-foreground">Total Products</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Eye className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Views</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold">{analytics.totalInquiries}</div>
                <div className="text-sm text-muted-foreground">Total Inquiries</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                <div className="text-2xl font-bold">{analytics.conversionRate}%</div>
                <div className="text-sm text-muted-foreground">Conversion Rate</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Top Performing Products
                </CardTitle>
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
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{product.views} views</span>
                            <span>{product.inquiries} inquiries</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {product.conversionRate}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          conversion
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Category Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Category Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.categoryPerformance.map((category, categoryIndex) => (
                    <div key={categoryIndex} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{category.categoryName}</span>
                        <span className="text-sm text-muted-foreground">
                          {category.productCount} products
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Views:</span>
                          <span className="font-medium">{category.totalViews.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Revenue:</span>
                          <span className="font-medium">${category.totalRevenue.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min((category.totalViews / Math.max(...analytics.categoryPerformance.map(c => c.totalViews))) * 100, 100)}%` 
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