import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  MessageSquare,
  FileText,
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface AnalyticsOverview {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  totalViews: number;
  totalInquiries: number;
  totalQuotations: number;
  responseRate: number;
  averageResponseTime: number;
  inquiryToQuotationRate: number;
  quotationToOrderRate: number;
}

interface TrendData {
  date: string;
  revenue: number;
  orders: number;
  inquiries: number;
  quotations: number;
  views: number;
}

interface ProductPerformance {
  productId: string;
  productName: string;
  views: number;
  inquiries: number;
  quotations: number;
  orders: number;
  revenue: number;
}

interface TopBuyer {
  buyerId: string;
  buyerName: string;
  buyerCompany: string;
  totalOrders: number;
  totalRevenue: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function SupplierAnalytics() {
  const [dateRange, setDateRange] = useState<string>("30");

  // Fetch analytics overview
  const { data: overview, isLoading: overviewLoading } = useQuery<AnalyticsOverview>({
    queryKey: ['/api/suppliers/analytics/overview', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/suppliers/analytics/overview?days=${dateRange}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch overview');
      return response.json();
    },
  });

  // Fetch trends data
  const { data: trends = [], isLoading: trendsLoading } = useQuery<TrendData[]>({
    queryKey: ['/api/suppliers/analytics/trends', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/suppliers/analytics/trends?days=${dateRange}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch trends');
      return response.json();
    },
  });

  // Fetch product performance
  const { data: products = [], isLoading: productsLoading } = useQuery<ProductPerformance[]>({
    queryKey: ['/api/suppliers/analytics/products', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/suppliers/analytics/products?days=${dateRange}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });

  // Fetch top buyers
  const { data: buyers = [], isLoading: buyersLoading } = useQuery<TopBuyer[]>({
    queryKey: ['/api/suppliers/analytics/buyers', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/suppliers/analytics/buyers?days=${dateRange}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch buyers');
      return response.json();
    },
  });

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/suppliers/analytics/export?days=${dateRange}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to export data');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${dateRange}days-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Calculate trends for KPI cards
  const calculateTrend = (data: TrendData[], key: keyof TrendData) => {
    if (data.length < 2) return { value: 0, direction: 'up' as const };
    
    const recent = data.slice(-7);
    const previous = data.slice(-14, -7);
    
    if (previous.length === 0) return { value: 0, direction: 'up' as const };
    
    const recentAvg = recent.reduce((sum, item) => sum + (item[key] as number), 0) / recent.length;
    const previousAvg = previous.reduce((sum, item) => sum + (item[key] as number), 0) / previous.length;
    
    if (previousAvg === 0) return { value: 0, direction: 'up' as const };
    
    const percentChange = ((recentAvg - previousAvg) / previousAvg) * 100;
    return {
      value: Math.abs(percentChange),
      direction: percentChange >= 0 ? 'up' as const : 'down' as const
    };
  };

  const revenueTrend = calculateTrend(trends, 'revenue');
  const ordersTrend = calculateTrend(trends, 'orders');
  const inquiriesTrend = calculateTrend(trends, 'inquiries');
  const quotationsTrend = calculateTrend(trends, 'quotations');

  // Prepare conversion funnel data
  const funnelData = overview ? [
    { name: 'Views', value: overview.totalViews, fill: COLORS[0] },
    { name: 'Inquiries', value: overview.totalInquiries, fill: COLORS[1] },
    { name: 'Quotations', value: overview.totalQuotations, fill: COLORS[2] },
    { name: 'Orders', value: overview.totalOrders, fill: COLORS[3] }
  ] : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track your business performance and insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overviewLoading ? "..." : formatCurrency(overview?.totalRevenue || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {revenueTrend.direction === 'up' ? (
                <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className={revenueTrend.direction === 'up' ? 'text-green-600' : 'text-red-600'}>
                {formatPercentage(revenueTrend.value)}
              </span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overviewLoading ? "..." : formatNumber(overview?.totalOrders || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {ordersTrend.direction === 'up' ? (
                <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className={ordersTrend.direction === 'up' ? 'text-green-600' : 'text-red-600'}>
                {formatPercentage(ordersTrend.value)}
              </span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inquiries</CardTitle>
            <MessageSquare className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overviewLoading ? "..." : formatNumber(overview?.totalInquiries || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {inquiriesTrend.direction === 'up' ? (
                <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className={inquiriesTrend.direction === 'up' ? 'text-green-600' : 'text-red-600'}>
                {formatPercentage(inquiriesTrend.value)}
              </span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quotations</CardTitle>
            <FileText className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overviewLoading ? "..." : formatNumber(overview?.totalQuotations || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {quotationsTrend.direction === 'up' ? (
                <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className={quotationsTrend.direction === 'up' ? 'text-green-600' : 'text-red-600'}>
                {formatPercentage(quotationsTrend.value)}
              </span>
              <span className="ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Loading chart...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Conversion Funnel Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Loading chart...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip formatter={(value: number) => formatNumber(value)} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Activity Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Loading chart...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip labelFormatter={(label) => new Date(label).toLocaleDateString()} />
                <Legend />
                <Line type="monotone" dataKey="views" stroke={COLORS[0]} strokeWidth={2} name="Views" />
                <Line type="monotone" dataKey="inquiries" stroke={COLORS[1]} strokeWidth={2} name="Inquiries" />
                <Line type="monotone" dataKey="quotations" stroke={COLORS[2]} strokeWidth={2} name="Quotations" />
                <Line type="monotone" dataKey="orders" stroke={COLORS[3]} strokeWidth={2} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Buyer Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overviewLoading ? "..." : formatPercentage(overview?.responseRate || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Percentage of inquiries responded to
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overviewLoading ? "..." : `${overview?.averageResponseTime || 0}h`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average time to respond to inquiries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overviewLoading ? "..." : formatPercentage(overview?.conversionRate || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Quotations converted to orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Product Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Top Performing Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No product data available</div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Inquiries</TableHead>
                    <TableHead className="text-right">Quotations</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.slice(0, 10).map((product) => (
                    <TableRow key={product.productId}>
                      <TableCell className="font-medium">{product.productName}</TableCell>
                      <TableCell className="text-right">{formatNumber(product.views)}</TableCell>
                      <TableCell className="text-right">{formatNumber(product.inquiries)}</TableCell>
                      <TableCell className="text-right">{formatNumber(product.quotations)}</TableCell>
                      <TableCell className="text-right">{formatNumber(product.orders)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Buyers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Buyers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {buyersLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading buyers...</div>
          ) : buyers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No buyer data available</div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="text-right">Total Orders</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buyers.slice(0, 10).map((buyer) => (
                    <TableRow key={buyer.buyerId}>
                      <TableCell className="font-medium">{buyer.buyerName}</TableCell>
                      <TableCell>{buyer.buyerCompany}</TableCell>
                      <TableCell className="text-right">{formatNumber(buyer.totalOrders)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(buyer.totalRevenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
