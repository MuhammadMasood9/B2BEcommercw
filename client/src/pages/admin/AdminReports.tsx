import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Breadcrumb from "@/components/Breadcrumb";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar,
  DollarSign,
  Users,
  Package,
  ShoppingCart,
  Building2,
  FileText,
  Eye
} from "lucide-react";

export default function AdminReports() {
  const [dateRange, setDateRange] = useState("30");
  const [reportType, setReportType] = useState("overview");

  // Mock data for reports - in real app, this would come from API
  const { data: reports } = useQuery({
    queryKey: ["/api/reports", dateRange],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        overview: {
          totalRevenue: 125000,
          totalOrders: 342,
          totalUsers: 1256,
          totalProducts: 89,
          revenueGrowth: 12.5,
          ordersGrowth: 8.3,
          usersGrowth: 15.2,
          productsGrowth: 5.7,
        },
        sales: [
          { month: "Jan", revenue: 45000, orders: 89 },
          { month: "Feb", revenue: 52000, orders: 102 },
          { month: "Mar", revenue: 48000, orders: 95 },
          { month: "Apr", revenue: 61000, orders: 118 },
          { month: "May", revenue: 55000, orders: 108 },
          { month: "Jun", revenue: 67000, orders: 125 },
        ],
        topProducts: [
          { name: "Industrial Machinery", revenue: 25000, orders: 45, growth: 15.2 },
          { name: "Electronics Components", revenue: 18000, orders: 67, growth: 8.7 },
          { name: "Textile Materials", revenue: 15000, orders: 89, growth: 22.1 },
          { name: "Chemical Products", revenue: 12000, orders: 34, growth: -2.3 },
          { name: "Automotive Parts", revenue: 10000, orders: 28, growth: 12.5 },
        ],
        topSuppliers: [
          { name: "TechCorp Industries", revenue: 35000, orders: 78, rating: 4.8 },
          { name: "Global Manufacturing", revenue: 28000, orders: 65, rating: 4.6 },
          { name: "Premium Supplies Ltd", revenue: 22000, orders: 52, rating: 4.9 },
          { name: "Industrial Solutions", revenue: 18000, orders: 43, rating: 4.4 },
          { name: "Quality Products Co", revenue: 15000, orders: 38, rating: 4.7 },
        ],
        userStats: {
          newUsers: 89,
          activeUsers: 456,
          totalUsers: 1256,
          userRetention: 78.5,
        },
        orderStats: {
          pending: 23,
          processing: 45,
          shipped: 67,
          delivered: 189,
          cancelled: 8,
        }
      };
    }
  });

  const dateRangeOptions = [
    { value: "7", label: "Last 7 days" },
    { value: "30", label: "Last 30 days" },
    { value: "90", label: "Last 3 months" },
    { value: "365", label: "Last year" },
  ];

  const reportTypes = [
    { value: "overview", label: "Overview" },
    { value: "sales", label: "Sales Report" },
    { value: "products", label: "Product Performance" },
    { value: "suppliers", label: "Supplier Analysis" },
    { value: "users", label: "User Analytics" },
  ];

  const exportReport = (type: string) => {
    // In real app, this would trigger file download
    console.log(`Exporting ${type} report for ${dateRange} days`);
  };

  if (!reports) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "Reports" }]} />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2">Comprehensive insights into your B2B marketplace performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportReport(reportType)}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {reportTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue - Green */}
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Total Revenue</CardTitle>
            <DollarSign className="h-6 w-6 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">${reports.overview.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-200 mr-1" />
              <span className="text-sm text-green-200">+{reports.overview.revenueGrowth}%</span>
              <span className="text-sm text-green-100 ml-2">from last period</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Orders - Blue */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Orders</CardTitle>
            <ShoppingCart className="h-6 w-6 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{reports.overview.totalOrders}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-blue-200 mr-1" />
              <span className="text-sm text-blue-200">+{reports.overview.ordersGrowth}%</span>
              <span className="text-sm text-blue-100 ml-2">from last period</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Users - Purple */}
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Total Users</CardTitle>
            <Users className="h-6 w-6 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{reports.overview.totalUsers}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-purple-200 mr-1" />
              <span className="text-sm text-purple-200">+{reports.overview.usersGrowth}%</span>
              <span className="text-sm text-purple-100 ml-2">from last period</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Products - Orange */}
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-100">Total Products</CardTitle>
            <Package className="h-6 w-6 text-orange-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{reports.overview.totalProducts}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-orange-200 mr-1" />
              <span className="text-sm text-orange-200">+{reports.overview.productsGrowth}%</span>
              <span className="text-sm text-orange-100 ml-2">from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Sales Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Sales chart would be displayed here</p>
              <p className="text-sm text-muted-foreground">Integration with Chart.js or similar library</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Top Performing Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.orders} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${product.revenue.toLocaleString()}</p>
                  <div className="flex items-center gap-1">
                    {product.growth > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`text-xs ${product.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.growth > 0 ? '+' : ''}{product.growth}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Suppliers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Top Suppliers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.topSuppliers.map((supplier, index) => (
              <div key={supplier.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{supplier.name}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-xs ${i < Math.floor(supplier.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">({supplier.rating})</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${supplier.revenue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{supplier.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Order Status Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Order Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(reports.orderStats).map(([status, count]) => (
                <div key={status} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="capitalize">{status}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <Progress 
                    value={(count / Object.values(reports.orderStats).reduce((a, b) => a + b, 0)) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">New Users</p>
                  <p className="text-sm text-muted-foreground">This period</p>
                </div>
                <span className="text-2xl font-bold text-blue-600">{reports.userStats.newUsers}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium">Active Users</p>
                  <p className="text-sm text-muted-foreground">Currently online</p>
                </div>
                <span className="text-2xl font-bold text-green-600">{reports.userStats.activeUsers}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium">User Retention</p>
                  <p className="text-sm text-muted-foreground">30-day retention rate</p>
                </div>
                <span className="text-2xl font-bold text-purple-600">{reports.userStats.userRetention}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
