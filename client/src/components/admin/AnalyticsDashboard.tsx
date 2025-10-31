import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  DollarSign, 
  ShoppingCart,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useToast } from '@/hooks/use-toast';

interface ComprehensivePlatformAnalytics {
  overview: {
    totalUsers: number;
    totalSuppliers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    totalCommission: number;
    growthRate: number;
    marketplaceHealth: 'excellent' | 'good' | 'fair' | 'poor';
  };
  userAnalytics: {
    newUsers: number;
    activeUsers: number;
    userRetention: number;
    userEngagement: number;
    topUserSegments: Array<{
      segment: string;
      count: number;
      percentage: number;
    }>;
  };
  supplierAnalytics: {
    newSuppliers: number;
    activeSuppliers: number;
    supplierRetention: number;
    averageSupplierRating: number;
    topSupplierTiers: Array<{
      tier: string;
      count: number;
      revenue: number;
    }>;
  };
  productAnalytics: {
    newProducts: number;
    activeProducts: number;
    productApprovalRate: number;
    averageProductRating: number;
    topCategories: Array<{
      category: string;
      productCount: number;
      revenue: number;
    }>;
  };
  orderAnalytics: {
    newOrders: number;
    completedOrders: number;
    orderFulfillmentRate: number;
    averageOrderValue: number;
    orderTrends: Array<{
      date: string;
      orderCount: number;
      revenue: number;
    }>;
  };
  revenueAnalytics: {
    totalRevenue: number;
    commissionRevenue: number;
    revenueGrowth: number;
    revenueByTier: Array<{
      tier: string;
      revenue: number;
      percentage: number;
    }>;
    monthlyRevenueTrend: Array<{
      month: string;
      revenue: number;
      commission: number;
    }>;
  };
  engagementAnalytics: {
    totalInquiries: number;
    inquiryResponseRate: number;
    averageResponseTime: number;
    quotationConversionRate: number;
    topEngagementChannels: Array<{
      channel: string;
      engagements: number;
      conversions: number;
    }>;
  };
  predictiveAnalytics: {
    growthProjection: {
      nextMonth: number;
      nextQuarter: number;
      nextYear: number;
    };
    churnPrediction: {
      supplierChurnRisk: number;
      userChurnRisk: number;
      riskFactors: string[];
    };
    marketTrends: {
      emergingCategories: string[];
      decliningCategories: string[];
      seasonalTrends: Array<{
        category: string;
        seasonality: 'high' | 'medium' | 'low';
        peakMonths: string[];
      }>;
    };
  };
  comparativeAnalytics: {
    industryBenchmarks: {
      conversionRate: number;
      averageOrderValue: number;
      supplierRetention: number;
      customerSatisfaction: number;
    };
    competitivePosition: {
      marketShare: number;
      competitiveAdvantages: string[];
      improvementAreas: string[];
    };
    performanceComparison: {
      vsLastMonth: number;
      vsLastQuarter: number;
      vsLastYear: number;
    };
  };
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<ComprehensivePlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });
  const [selectedMetrics, setSelectedMetrics] = useState(['revenue', 'orders', 'users']);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(
        `/api/admin/analytics/platform/comprehensive?startDate=${dateRange.startDate.toISOString()}&endDate=${dateRange.endDate.toISOString()}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setAnalytics(data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshData = async () => {
    await fetchAnalytics();
    toast({
      title: 'Success',
      description: 'Analytics data refreshed',
    });
  };

  const exportData = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch('/api/admin/analytics/platform/custom-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: selectedMetrics,
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
          format,
          includeComparative: true,
          includePredictive: true
        }),
      });

      if (!response.ok) throw new Error('Failed to export data');

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_report_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_report_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast({
        title: 'Success',
        description: `Analytics report exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Error',
        description: 'Failed to export analytics data',
        variant: 'destructive',
      });
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics data...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Alert>
        <Activity className="h-4 w-4" />
        <AlertDescription>
          Failed to load analytics data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedMetrics.join(',')} onValueChange={(value) => setSelectedMetrics(value.split(','))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select metrics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue,orders,users">Core Metrics</SelectItem>
              <SelectItem value="revenue,orders,users,suppliers">Extended Metrics</SelectItem>
              <SelectItem value="revenue,orders,users,suppliers,products">All Metrics</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportData('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => exportData('json')}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.overview.totalRevenue)}</div>
            <div className="flex items-center space-x-2 mt-2">
              {analytics.overview.growthRate >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm ${analytics.overview.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(analytics.overview.growthRate)}
              </span>
              <span className="text-sm text-gray-600">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalOrders.toLocaleString()}</div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="secondary">
                {analytics.orderAnalytics.orderFulfillmentRate.toFixed(1)}% fulfilled
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.supplierAnalytics.activeSuppliers.toLocaleString()}</div>
            <div className="flex items-center space-x-2 mt-2">
              <Progress value={analytics.supplierAnalytics.supplierRetention} className="flex-1 h-2" />
              <span className="text-sm text-gray-600">{analytics.supplierAnalytics.supplierRetention.toFixed(1)}% retention</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{analytics.overview.marketplaceHealth}</div>
            <div className="mt-2">
              <Badge className={getHealthColor(analytics.overview.marketplaceHealth)}>
                {analytics.overview.marketplaceHealth}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.revenueAnalytics.monthlyRevenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6}
                      name="Revenue"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="commission" 
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      fillOpacity={0.6}
                      name="Commission"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Order Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Order Volume Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.orderAnalytics.orderTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="orderCount" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Orders"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatPercentage(analytics.comparativeAnalytics.performanceComparison.vsLastMonth)}
                  </div>
                  <p className="text-sm text-gray-600">vs Last Month</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatPercentage(analytics.comparativeAnalytics.performanceComparison.vsLastQuarter)}
                  </div>
                  <p className="text-sm text-gray-600">vs Last Quarter</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatPercentage(analytics.comparativeAnalytics.performanceComparison.vsLastYear)}
                  </div>
                  <p className="text-sm text-gray-600">vs Last Year</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Tier */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Supplier Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={analytics.revenueAnalytics.revenueByTier}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ tier, percentage }: any) => `${tier}: ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {analytics.revenueAnalytics.revenueByTier.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="font-semibold">{formatCurrency(analytics.revenueAnalytics.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Commission Revenue</span>
                  <span className="font-semibold">{formatCurrency(analytics.revenueAnalytics.commissionRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenue Growth</span>
                  <span className={`font-semibold ${analytics.revenueAnalytics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(analytics.revenueAnalytics.revenueGrowth)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Order Value</span>
                  <span className="font-semibold">{formatCurrency(analytics.orderAnalytics.averageOrderValue)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Segments */}
            <Card>
              <CardHeader>
                <CardTitle>User Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.userAnalytics.topUserSegments}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="segment" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>User Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">New Users</span>
                  <span className="font-semibold">{analytics.userAnalytics.newUsers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Users</span>
                  <span className="font-semibold">{analytics.userAnalytics.activeUsers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">User Retention</span>
                  <span className="font-semibold">{analytics.userAnalytics.userRetention.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">User Engagement</span>
                  <span className="font-semibold">{analytics.userAnalytics.userEngagement.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Supplier Tiers */}
            <Card>
              <CardHeader>
                <CardTitle>Supplier Distribution by Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.supplierAnalytics.topSupplierTiers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tier" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" name="Suppliers" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Supplier Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Supplier Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">New Suppliers</span>
                  <span className="font-semibold">{analytics.supplierAnalytics.newSuppliers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Suppliers</span>
                  <span className="font-semibold">{analytics.supplierAnalytics.activeSuppliers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Supplier Retention</span>
                  <span className="font-semibold">{analytics.supplierAnalytics.supplierRetention.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Rating</span>
                  <span className="font-semibold">{analytics.supplierAnalytics.averageSupplierRating.toFixed(1)}/5</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Engagement Channels */}
            <Card>
              <CardHeader>
                <CardTitle>Top Engagement Channels</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.engagementAnalytics.topEngagementChannels}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="engagements" fill="#8884d8" name="Engagements" />
                    <Bar dataKey="conversions" fill="#82ca9d" name="Conversions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Inquiries</span>
                  <span className="font-semibold">{analytics.engagementAnalytics.totalInquiries.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Response Rate</span>
                  <span className="font-semibold">{analytics.engagementAnalytics.inquiryResponseRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Response Time</span>
                  <span className="font-semibold">{analytics.engagementAnalytics.averageResponseTime.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Conversion Rate</span>
                  <span className="font-semibold">{analytics.engagementAnalytics.quotationConversionRate.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Growth Projections */}
            <Card>
              <CardHeader>
                <CardTitle>Growth Projections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Next Month</span>
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold">{formatCurrency(analytics.predictiveAnalytics.growthProjection.nextMonth)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Next Quarter</span>
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="font-semibold">{formatCurrency(analytics.predictiveAnalytics.growthProjection.nextQuarter)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Next Year</span>
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-purple-500" />
                    <span className="font-semibold">{formatCurrency(analytics.predictiveAnalytics.growthProjection.nextYear)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Churn Risk */}
            <Card>
              <CardHeader>
                <CardTitle>Churn Risk Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Supplier Churn Risk</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={analytics.predictiveAnalytics.churnPrediction.supplierChurnRisk} className="w-20 h-2" />
                    <span className="font-semibold">{analytics.predictiveAnalytics.churnPrediction.supplierChurnRisk.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">User Churn Risk</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={analytics.predictiveAnalytics.churnPrediction.userChurnRisk} className="w-20 h-2" />
                    <span className="font-semibold">{analytics.predictiveAnalytics.churnPrediction.userChurnRisk.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Risk Factors:</h4>
                  <ul className="space-y-1">
                    {analytics.predictiveAnalytics.churnPrediction.riskFactors.map((factor, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <Zap className="h-3 w-3 mr-2 text-yellow-500" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Market Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2 text-green-600">Emerging Categories</h4>
                  <ul className="space-y-1">
                    {analytics.predictiveAnalytics.marketTrends.emergingCategories.map((category, index) => (
                      <li key={index} className="text-sm flex items-center">
                        <TrendingUp className="h-3 w-3 mr-2 text-green-500" />
                        {category}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-red-600">Declining Categories</h4>
                  <ul className="space-y-1">
                    {analytics.predictiveAnalytics.marketTrends.decliningCategories.map((category, index) => (
                      <li key={index} className="text-sm flex items-center">
                        <TrendingDown className="h-3 w-3 mr-2 text-red-500" />
                        {category}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );}
