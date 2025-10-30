import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Eye, 
  MessageSquare, 
  TrendingUp, 
  Package,
  Star,
  ShoppingCart,
  BarChart3,
  PieChart,
  Calendar
} from "lucide-react";

interface ProductAnalytics {
  totalProducts: number;
  approvedProducts: number;
  pendingProducts: number;
  rejectedProducts: number;
  totalViews: number;
  totalInquiries: number;
  averageRating: number;
  conversionRate: number;
  topPerformingProducts: Array<{
    id: string;
    name: string;
    views: number;
    inquiries: number;
    conversionRate: number;
    status: string;
  }>;
  categoryPerformance: Array<{
    categoryName: string;
    productCount: number;
    totalViews: number;
    totalInquiries: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    views: number;
    inquiries: number;
    newProducts: number;
  }>;
}

export default function ProductAnalytics() {
  const [analytics, setAnalytics] = useState<ProductAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics from the API
      const response = await fetch(`/api/suppliers/analytics/overview?timeRange=${timeRange}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      
      if (data.success && data.analytics) {
        const apiAnalytics = data.analytics;
        
        // Transform API data to match component interface
        const transformedAnalytics: ProductAnalytics = {
          totalProducts: apiAnalytics.totalProducts,
          approvedProducts: apiAnalytics.approvedProducts,
          pendingProducts: apiAnalytics.pendingProducts,
          rejectedProducts: apiAnalytics.rejectedProducts,
          totalViews: apiAnalytics.totalViews,
          totalInquiries: apiAnalytics.totalInquiries,
          averageRating: 4.3, // Mock for now - would come from reviews
          conversionRate: apiAnalytics.conversionRate,
          topPerformingProducts: apiAnalytics.topPerformingProducts,
          categoryPerformance: apiAnalytics.categoryPerformance,
          monthlyTrends: apiAnalytics.monthlyTrends
        };
        
        setAnalytics(transformedAnalytics);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      
      // Fallback to mock data if API fails
      const mockAnalytics: ProductAnalytics = {
        totalProducts: 0,
        approvedProducts: 0,
        pendingProducts: 0,
        rejectedProducts: 0,
        totalViews: 0,
        totalInquiries: 0,
        averageRating: 0,
        conversionRate: 0,
        topPerformingProducts: [],
        categoryPerformance: [],
        monthlyTrends: []
      };
      
      setAnalytics(mockAnalytics);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
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

  const stats = [
    {
      label: "Total Products",
      value: analytics.totalProducts.toString(),
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      label: "Total Views",
      value: analytics.totalViews.toLocaleString(),
      icon: Eye,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      label: "Total Inquiries",
      value: analytics.totalInquiries.toString(),
      icon: MessageSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      label: "Conversion Rate",
      value: `${analytics.conversionRate}%`,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Product Analytics</h2>
          <p className="text-muted-foreground">Track your product performance and insights</p>
        </div>
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
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Product Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Product Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {analytics.approvedProducts}
              </div>
              <Badge className="bg-green-100 text-green-800 mb-2">Approved</Badge>
              <p className="text-sm text-muted-foreground">
                {((analytics.approvedProducts / analytics.totalProducts) * 100).toFixed(1)}% of total
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {analytics.pendingProducts}
              </div>
              <Badge className="bg-yellow-100 text-yellow-800 mb-2">Pending</Badge>
              <p className="text-sm text-muted-foreground">
                {((analytics.pendingProducts / analytics.totalProducts) * 100).toFixed(1)}% of total
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {analytics.rejectedProducts}
              </div>
              <Badge className="bg-red-100 text-red-800 mb-2">Rejected</Badge>
              <p className="text-sm text-muted-foreground">
                {((analytics.rejectedProducts / analytics.totalProducts) * 100).toFixed(1)}% of total
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
            {analytics.topPerformingProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium">{product.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {product.views.toLocaleString()} views
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {product.inquiries} inquiries
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    {product.conversionRate}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    conversion rate
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
            {analytics.categoryPerformance.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{category.categoryName}</span>
                  <span className="text-sm text-muted-foreground">
                    {category.productCount} products
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Views:</span>
                    <span className="font-medium">{category.totalViews.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Inquiries:</span>
                    <span className="font-medium">{category.totalInquiries}</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ 
                      width: `${(category.totalViews / Math.max(...analytics.categoryPerformance.map(c => c.totalViews))) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
            {analytics.monthlyTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div className="font-medium">{trend.month}</div>
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
                    <div className="font-medium">{trend.newProducts}</div>
                    <div className="text-muted-foreground">New Products</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}