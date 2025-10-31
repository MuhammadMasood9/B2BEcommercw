import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  Users, 
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Settings,
  Eye,
  Share2
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

interface FinancialDashboardData {
  overview: {
    totalRevenue: number;
    totalCommission: number;
    totalPayouts: number;
    netProfit: number;
    revenueGrowth: number;
    commissionGrowth: number;
    payoutGrowth: number;
    profitMargin: number;
  };
  trends: {
    revenue: ChartDataPoint[];
    commission: ChartDataPoint[];
    payouts: ChartDataPoint[];
    profit: ChartDataPoint[];
  };
  breakdown: {
    byTier: TierBreakdown[];
    byCategory: CategoryBreakdown[];
    bySupplier: SupplierBreakdown[];
    byPaymentMethod: PaymentMethodBreakdown[];
  };
}

interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface TierBreakdown {
  tier: string;
  suppliers: number;
  orders: number;
  revenue: number;
  commission: number;
  avgCommissionRate: number;
  growth: number;
}

interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  orders: number;
  revenue: number;
  commission: number;
  suppliers: number;
  growth: number;
}

interface SupplierBreakdown {
  supplierId: string;
  supplierName: string;
  tier: string;
  orders: number;
  revenue: number;
  commission: number;
  payouts: number;
  commissionRate: number;
  growth: number;
}

interface PaymentMethodBreakdown {
  method: string;
  payouts: number;
  amount: number;
  successRate: number;
  avgProcessingTime: number;
  fees: number;
}

interface ReportParameters {
  dateRange: {
    start: Date;
    end: Date;
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  };
  filters: {
    supplierIds?: string[];
    categoryIds?: string[];
    tiers?: string[];
    paymentMethods?: string[];
    minAmount?: number;
    maxAmount?: number;
  };
  groupBy?: string[];
  metrics: string[];
  includeCharts: boolean;
  includeComparisons: boolean;
}

interface CustomReport {
  id: string;
  name: string;
  description: string;
  type: 'revenue' | 'commission' | 'payout' | 'supplier' | 'custom';
  parameters: ReportParameters;
  createdAt: Date;
  lastGenerated?: Date;
}

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

const PRESET_DATE_RANGES = {
  'last7days': { label: 'Last 7 Days', days: 7 },
  'last30days': { label: 'Last 30 Days', days: 30 },
  'last90days': { label: 'Last 90 Days', days: 90 },
  'thisMonth': { label: 'This Month', custom: true },
  'lastMonth': { label: 'Last Month', custom: true },
  'thisYear': { label: 'This Year', custom: true },
  'lastYear': { label: 'Last Year', custom: true },
  'custom': { label: 'Custom Range', custom: true }
};

export default function FinancialReports() {
  const [dashboardData, setDashboardData] = useState<FinancialDashboardData | null>(null);
  const [customReports, setCustomReports] = useState<CustomReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Filter states
  const [dateRange, setDateRange] = useState('last30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [compareWithPrevious, setCompareWithPrevious] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  
  // Report generation states
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportType, setReportType] = useState<'revenue' | 'commission' | 'payout' | 'supplier' | 'custom'>('revenue');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['revenue', 'commission']);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeComparisons, setIncludeComparisons] = useState(true);

  useEffect(() => {
    fetchFinancialData();
    fetchCustomReports();
  }, [dateRange, startDate, endDate, compareWithPrevious]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Calculate date range
      let start: Date, end: Date;
      const now = new Date();
      
      switch (dateRange) {
        case 'thisMonth':
          start = startOfMonth(now);
          end = endOfMonth(now);
          break;
        case 'lastMonth':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          start = startOfMonth(lastMonth);
          end = endOfMonth(lastMonth);
          break;
        case 'thisYear':
          start = startOfYear(now);
          end = endOfYear(now);
          break;
        case 'lastYear':
          const lastYear = new Date(now.getFullYear() - 1, 0, 1);
          start = startOfYear(lastYear);
          end = endOfYear(lastYear);
          break;
        case 'custom':
          if (!startDate || !endDate) return;
          start = new Date(startDate);
          end = new Date(endDate);
          break;
        default:
          const preset = PRESET_DATE_RANGES[dateRange as keyof typeof PRESET_DATE_RANGES];
          if (preset && preset.days) {
            start = subDays(now, preset.days);
            end = now;
          } else {
            start = subDays(now, 30);
            end = now;
          }
      }
      
      params.append('startDate', start.toISOString());
      params.append('endDate', end.toISOString());
      params.append('compareWithPrevious', compareWithPrevious.toString());

      const response = await fetch(`/api/admin/financial/dashboard?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomReports = async () => {
    try {
      const response = await fetch('/api/admin/financial/reports/custom');
      if (response.ok) {
        const reports = await response.json();
        setCustomReports(reports);
      }
    } catch (error) {
      console.error('Error fetching custom reports:', error);
    }
  };

  const generateCustomReport = async () => {
    if (!reportName || selectedMetrics.length === 0) return;

    setGenerating(true);
    try {
      const now = new Date();
      const start = startDate ? new Date(startDate) : subDays(now, 30);
      const end = endDate ? new Date(endDate) : now;

      const parameters: ReportParameters = {
        dateRange: {
          start,
          end,
          period: 'daily'
        },
        filters: {},
        metrics: selectedMetrics,
        includeCharts,
        includeComparisons
      };

      const response = await fetch('/api/admin/financial/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: reportName,
          description: reportDescription,
          type: reportType,
          parameters
        }),
      });

      if (response.ok) {
        const report = await response.json();
        alert('Custom report generated successfully!');
        setShowReportDialog(false);
        setReportName('');
        setReportDescription('');
        fetchCustomReports();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error generating custom report:', error);
      alert('Failed to generate custom report');
    } finally {
      setGenerating(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel' | 'csv' | 'json') => {
    if (!dashboardData) return;

    setExporting(true);
    try {
      const response = await fetch('/api/admin/financial/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          reportData: dashboardData
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `financial_report_${format(new Date(), 'yyyy-MM-dd')}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        alert(`Export error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return `${rate.toFixed(1)}%`;
  };

  const renderChart = (data: ChartDataPoint[], title: string, color: string = '#8884d8') => {
    const ChartComponent = chartType === 'bar' ? BarChart : chartType === 'area' ? AreaChart : LineChart;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {title}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={chartType === 'line' ? 'default' : 'outline'}
                onClick={() => setChartType('line')}
              >
                <LineChartIcon className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={chartType === 'bar' ? 'default' : 'outline'}
                onClick={() => setChartType('bar')}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={chartType === 'area' ? 'default' : 'outline'}
                onClick={() => setChartType('area')}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ChartComponent data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              {chartType === 'bar' ? (
                <Bar dataKey="value" fill={color} />
              ) : chartType === 'area' ? (
                <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.3} />
              ) : (
                <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} />
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderPieChart = (data: any[], title: string, dataKey: string, nameKey: string) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={dataKey}
                nameKey={nameKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Reports</h1>
          <p className="text-muted-foreground">Comprehensive financial analytics and reporting</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
            <DialogTrigger asChild>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Generate Custom Report</DialogTitle>
                <DialogDescription>
                  Create a custom financial report with specific parameters
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reportName">Report Name</Label>
                    <Input
                      id="reportName"
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      placeholder="Enter report name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reportType">Report Type</Label>
                    <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="revenue">Revenue Report</SelectItem>
                        <SelectItem value="commission">Commission Report</SelectItem>
                        <SelectItem value="payout">Payout Report</SelectItem>
                        <SelectItem value="supplier">Supplier Report</SelectItem>
                        <SelectItem value="custom">Custom Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="reportDescription">Description</Label>
                  <Input
                    id="reportDescription"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Enter report description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Metrics to Include</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['revenue', 'commission', 'payouts', 'profit', 'orders', 'suppliers'].map((metric) => (
                      <div key={metric} className="flex items-center space-x-2">
                        <Checkbox
                          id={metric}
                          checked={selectedMetrics.includes(metric)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedMetrics([...selectedMetrics, metric]);
                            } else {
                              setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
                            }
                          }}
                        />
                        <Label htmlFor={metric} className="capitalize">{metric}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeCharts"
                      checked={includeCharts}
                      onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                    />
                    <Label htmlFor="includeCharts">Include Charts</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeComparisons"
                      checked={includeComparisons}
                      onCheckedChange={(checked) => setIncludeComparisons(checked as boolean)}
                    />
                    <Label htmlFor="includeComparisons">Include Comparisons</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={generateCustomReport} disabled={generating || !reportName || selectedMetrics.length === 0}>
                  {generating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Generate Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button onClick={fetchFinancialData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRESET_DATE_RANGES).map(([key, range]) => (
                    <SelectItem key={key} value={key}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {dateRange === 'custom' && (
              <>
                <div>
                  <Label htmlFor="customStartDate">Start Date</Label>
                  <Input
                    id="customStartDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="customEndDate">End Date</Label>
                  <Input
                    id="customEndDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
            
            <div className="flex items-center space-x-2 mt-6">
              <Checkbox
                id="compareWithPrevious"
                checked={compareWithPrevious}
                onCheckedChange={(checked) => setCompareWithPrevious(checked as boolean)}
              />
              <Label htmlFor="compareWithPrevious">Compare with previous period</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={() => exportReport('pdf')} disabled={exporting} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={() => exportReport('excel')} disabled={exporting} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={() => exportReport('csv')} disabled={exporting} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => exportReport('json')} disabled={exporting} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {dashboardData && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="custom-reports">Custom Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(dashboardData.overview.totalRevenue)}
                  </div>
                  {compareWithPrevious && (
                    <p className={`text-xs ${dashboardData.overview.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {dashboardData.overview.revenueGrowth >= 0 ? '+' : ''}
                      {formatPercentage(dashboardData.overview.revenueGrowth)} from previous period
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(dashboardData.overview.totalCommission)}
                  </div>
                  {compareWithPrevious && (
                    <p className={`text-xs ${dashboardData.overview.commissionGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {dashboardData.overview.commissionGrowth >= 0 ? '+' : ''}
                      {formatPercentage(dashboardData.overview.commissionGrowth)} from previous period
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(dashboardData.overview.totalPayouts)}
                  </div>
                  {compareWithPrevious && (
                    <p className={`text-xs ${dashboardData.overview.payoutGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {dashboardData.overview.payoutGrowth >= 0 ? '+' : ''}
                      {formatPercentage(dashboardData.overview.payoutGrowth)} from previous period
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(dashboardData.overview.netProfit)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatPercentage(dashboardData.overview.profitMargin)} profit margin
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderChart(dashboardData.trends.revenue, 'Revenue Trend', '#8884d8')}
              {renderChart(dashboardData.trends.commission, 'Commission Trend', '#82ca9d')}
              {renderChart(dashboardData.trends.payouts, 'Payouts Trend', '#ffc658')}
              {renderChart(dashboardData.trends.profit, 'Profit Trend', '#ff7300')}
            </div>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderPieChart(dashboardData.breakdown.byTier, 'Revenue by Tier', 'revenue', 'tier')}
              {renderPieChart(dashboardData.breakdown.byCategory, 'Revenue by Category', 'revenue', 'categoryName')}
              {renderPieChart(dashboardData.breakdown.byPaymentMethod, 'Payouts by Method', 'amount', 'method')}
              
              <Card>
                <CardHeader>
                  <CardTitle>Top Suppliers by Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData.breakdown.bySupplier.slice(0, 5).map((supplier, index) => (
                      <div key={supplier.supplierId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{supplier.supplierName}</div>
                            <div className="text-sm text-muted-foreground">
                              <Badge variant="outline" className="mr-2">{supplier.tier}</Badge>
                              {supplier.orders} orders
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(supplier.revenue)}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(supplier.commission)} commission
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="custom-reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Custom Reports</CardTitle>
                <CardDescription>
                  Manage and view your custom financial reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{report.name}</div>
                        <div className="text-sm text-muted-foreground">{report.description}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{report.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            Created: {format(new Date(report.createdAt), 'MMM dd, yyyy')}
                          </span>
                          {report.lastGenerated && (
                            <span className="text-xs text-muted-foreground">
                              Last generated: {format(new Date(report.lastGenerated), 'MMM dd, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                        <Button size="sm" variant="outline">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  ))}
                  {customReports.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      No custom reports created yet. Click "Generate Report" to create your first report.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}