import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReportData {
  supplierGrowth: Array<{
    month: string;
    newSuppliers: number;
    activeSuppliers: number;
    suspendedSuppliers: number;
  }>;
  productApprovals: Array<{
    month: string;
    approved: number;
    rejected: number;
    pending: number;
  }>;
  revenueMetrics: Array<{
    month: string;
    revenue: number;
    commission: number;
    orders: number;
  }>;
  riskDistribution: Array<{
    level: string;
    count: number;
    percentage: number;
  }>;
  complianceMetrics: Array<{
    category: string;
    score: number;
    violations: number;
  }>;
  topIssues: Array<{
    type: string;
    count: number;
    severity: string;
  }>;
}

interface PlatformReportingProps {
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function PlatformReporting({ className }: PlatformReportingProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last_30_days');
  const [reportType, setReportType] = useState('overview');
  const { toast } = useToast();

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // For now, we'll use mock data since the backend endpoints would need more complex aggregation
      // In a real implementation, you'd call multiple endpoints or a dedicated reporting endpoint
      
      const mockData: ReportData = {
        supplierGrowth: [
          { month: 'Jan', newSuppliers: 12, activeSuppliers: 145, suspendedSuppliers: 3 },
          { month: 'Feb', newSuppliers: 18, activeSuppliers: 160, suspendedSuppliers: 2 },
          { month: 'Mar', newSuppliers: 25, activeSuppliers: 182, suspendedSuppliers: 4 },
          { month: 'Apr', newSuppliers: 22, activeSuppliers: 198, suspendedSuppliers: 1 },
          { month: 'May', newSuppliers: 30, activeSuppliers: 225, suspendedSuppliers: 3 },
          { month: 'Jun', newSuppliers: 28, activeSuppliers: 248, suspendedSuppliers: 2 },
        ],
        productApprovals: [
          { month: 'Jan', approved: 156, rejected: 23, pending: 12 },
          { month: 'Feb', approved: 189, rejected: 18, pending: 15 },
          { month: 'Mar', approved: 234, rejected: 31, pending: 18 },
          { month: 'Apr', approved: 267, rejected: 25, pending: 22 },
          { month: 'May', approved: 298, rejected: 29, pending: 19 },
          { month: 'Jun', approved: 325, rejected: 22, pending: 16 },
        ],
        revenueMetrics: [
          { month: 'Jan', revenue: 125000, commission: 6250, orders: 342 },
          { month: 'Feb', revenue: 148000, commission: 7400, orders: 398 },
          { month: 'Mar', revenue: 167000, commission: 8350, orders: 445 },
          { month: 'Apr', revenue: 189000, commission: 9450, orders: 512 },
          { month: 'May', revenue: 212000, commission: 10600, orders: 578 },
          { month: 'Jun', revenue: 234000, commission: 11700, orders: 634 },
        ],
        riskDistribution: [
          { level: 'Low', count: 186, percentage: 75 },
          { level: 'Medium', count: 49, percentage: 20 },
          { level: 'High', count: 12, percentage: 5 },
        ],
        complianceMetrics: [
          { category: 'Product Quality', score: 87, violations: 12 },
          { category: 'Communication', score: 92, violations: 8 },
          { category: 'Shipping', score: 89, violations: 15 },
          { category: 'Documentation', score: 94, violations: 6 },
          { category: 'Pricing', score: 91, violations: 9 },
        ],
        topIssues: [
          { type: 'Missing Product Images', count: 45, severity: 'warning' },
          { type: 'Poor Response Rate', count: 23, severity: 'error' },
          { type: 'Pricing Anomalies', count: 18, severity: 'warning' },
          { type: 'Fake Reviews Suspected', count: 8, severity: 'critical' },
          { type: 'Incomplete Documentation', count: 34, severity: 'warning' },
        ],
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setReportData(mockData);
      
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch report data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const exportReport = (format: 'pdf' | 'excel') => {
    toast({
      title: 'Export Started',
      description: `Generating ${format.toUpperCase()} report...`,
    });
    
    // In a real implementation, this would call an API endpoint to generate the report
    setTimeout(() => {
      toast({
        title: 'Export Complete',
        description: `Report has been downloaded as ${format.toUpperCase()}`,
      });
    }, 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (!reportData) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">Failed to load report data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Platform Management Reports</CardTitle>
            <CardDescription>Comprehensive analytics and insights for platform oversight</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                <SelectItem value="last_year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => exportReport('excel')}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportReport('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="growth" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="growth">Growth</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="growth" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">New Suppliers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {reportData.supplierGrowth[reportData.supplierGrowth.length - 1]?.newSuppliers || 0}
                  </div>
                  <p className="text-xs text-gray-600">This month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {reportData.supplierGrowth[reportData.supplierGrowth.length - 1]?.activeSuppliers || 0}
                  </div>
                  <p className="text-xs text-gray-600">Total active</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Suspended</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {reportData.supplierGrowth[reportData.supplierGrowth.length - 1]?.suspendedSuppliers || 0}
                  </div>
                  <p className="text-xs text-gray-600">This month</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Supplier Growth Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.supplierGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="newSuppliers" stroke="#10B981" name="New Suppliers" />
                    <Line type="monotone" dataKey="activeSuppliers" stroke="#3B82F6" name="Active Suppliers" />
                    <Line type="monotone" dataKey="suspendedSuppliers" stroke="#EF4444" name="Suspended" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Product Approval Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.productApprovals}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="approved" fill="#10B981" name="Approved" />
                    <Bar dataKey="rejected" fill="#EF4444" name="Rejected" />
                    <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(reportData.revenueMetrics[reportData.revenueMetrics.length - 1]?.revenue || 0)}
                  </div>
                  <p className="text-xs text-gray-600">This month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(reportData.revenueMetrics[reportData.revenueMetrics.length - 1]?.commission || 0)}
                  </div>
                  <p className="text-xs text-gray-600">This month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {reportData.revenueMetrics[reportData.revenueMetrics.length - 1]?.orders || 0}
                  </div>
                  <p className="text-xs text-gray-600">This month</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue & Commission Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.revenueMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Line type="monotone" dataKey="revenue" stroke="#10B981" name="Revenue" />
                    <Line type="monotone" dataKey="commission" stroke="#3B82F6" name="Commission" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Risk Level Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={reportData.riskDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ level, percentage }) => `${level} (${percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {reportData.riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.topIssues.map((issue, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {issue.severity === 'critical' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          {issue.severity === 'error' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                          {issue.severity === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                          <span className="font-medium">{issue.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{issue.count}</Badge>
                          <Badge 
                            variant={
                              issue.severity === 'critical' ? 'destructive' : 
                              issue.severity === 'error' ? 'destructive' : 'secondary'
                            }
                          >
                            {issue.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Compliance Scores by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.complianceMetrics.map((metric, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{metric.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{metric.score}%</span>
                          {metric.score >= 90 ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            metric.score >= 90 ? 'bg-green-500' : 
                            metric.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${metric.score}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Score: {metric.score}%</span>
                        <span>Violations: {metric.violations}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}