import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  TrendingUp,
  Download,
  Calendar,
  BarChart3,
  Users,
  FileSpreadsheet,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';

interface CommissionSummary {
  totalOrders: number;
  totalSales: number;
  totalCommission: number;
  totalPaidToSuppliers: number;
  avgCommissionRate: number;
  periodComparison: {
    ordersChange: number;
    salesChange: number;
    commissionChange: number;
  };
}

interface CommissionAnalytics {
  tierAnalytics: Array<{
    membershipTier: string;
    totalOrders: number;
    totalRevenue: number;
    totalCommission: number;
    avgOrderValue: number;
    avgCommissionRate: number;
  }>;
  topSuppliers: Array<{
    supplierId: string;
    supplierName: string;
    membershipTier: string;
    totalOrders: number;
    totalCommission: number;
    avgCommissionRate: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    totalCommission: number;
    totalOrders: number;
    avgRate: number;
  }>;
}

export const EnhancedCommissionDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [exportFormat, setExportFormat] = useState('csv');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [isExporting, setIsExporting] = useState(false);

  // Fetch commission summary
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['/api/commission/admin/summary', dateRange, customDateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (dateRange === 'custom' && customDateRange.startDate && customDateRange.endDate) {
        params.append('startDate', customDateRange.startDate);
        params.append('endDate', customDateRange.endDate);
      } else if (dateRange !== 'all') {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        params.append('startDate', startDate.toISOString());
        params.append('endDate', new Date().toISOString());
      }

      const response = await fetch(`/api/commission/admin/summary?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch commission summary');
      }

      return await response.json() as CommissionSummary;
    },
  });

  // Fetch commission analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/commission/admin/analytics', dateRange, customDateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (dateRange === 'custom' && customDateRange.startDate && customDateRange.endDate) {
        params.append('startDate', customDateRange.startDate);
        params.append('endDate', customDateRange.endDate);
      } else if (dateRange !== 'all') {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        params.append('startDate', startDate.toISOString());
        params.append('endDate', new Date().toISOString());
      }

      const response = await fetch(`/api/commission/admin/analytics?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch commission analytics');
      }

      return await response.json() as CommissionAnalytics;
    },
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.append('format', exportFormat);
      params.append('includeAdjustments', 'true');
      
      if (dateRange === 'custom' && customDateRange.startDate && customDateRange.endDate) {
        params.append('startDate', customDateRange.startDate);
        params.append('endDate', customDateRange.endDate);
      } else if (dateRange !== 'all') {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        params.append('startDate', startDate.toISOString());
        params.append('endDate', new Date().toISOString());
      }

      const response = await fetch(`/api/commission/admin/commission/export?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to export commission report');
      }

      if (exportFormat === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `commission-report-${new Date().toISOString().split('T')[0]}.csv`;
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
        a.download = `commission-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast.success('Commission report exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export commission report');
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Commission Dashboard</h2>
          <p className="text-gray-600">Monitor and analyze commission performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              refetchSummary();
            }}
            disabled={summaryLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${summaryLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Date Range:</span>
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            {dateRange === 'custom' && (
              <>
                <Input
                  type="date"
                  value={customDateRange.startDate}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, startDate: e.target.value })}
                  className="w-[150px]"
                />
                <Input
                  type="date"
                  value={customDateRange.endDate}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, endDate: e.target.value })}
                  className="w-[150px]"
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Commission</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(summary.totalCommission)}</p>
                  {summary.periodComparison && (
                    <p className={`text-sm ${summary.periodComparison.commissionChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(summary.periodComparison.commissionChange)} from last period
                    </p>
                  )}
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sales</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(summary.totalSales)}</p>
                  {summary.periodComparison && (
                    <p className={`text-sm ${summary.periodComparison.salesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(summary.periodComparison.salesChange)} from last period
                    </p>
                  )}
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.totalOrders.toLocaleString()}</p>
                  {summary.periodComparison && (
                    <p className={`text-sm ${summary.periodComparison.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(summary.periodComparison.ordersChange)} from last period
                    </p>
                  )}
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Commission Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{(summary.avgCommissionRate * 100).toFixed(1)}%</p>
                  <p className="text-sm text-gray-500">Across all tiers</p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="tiers" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tiers">Tier Analytics</TabsTrigger>
          <TabsTrigger value="suppliers">Top Suppliers</TabsTrigger>
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="tiers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Commission by Membership Tier</CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : analytics?.tierAnalytics ? (
                <div className="space-y-4">
                  {analytics.tierAnalytics.map((tier) => (
                    <div key={tier.membershipTier} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Badge variant={tier.membershipTier === 'platinum' ? 'default' : 'secondary'}>
                          {tier.membershipTier.toUpperCase()}
                        </Badge>
                        <div>
                          <p className="font-medium">{tier.totalOrders} orders</p>
                          <p className="text-sm text-gray-500">Avg: {formatCurrency(tier.avgOrderValue)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(tier.totalCommission)}</p>
                        <p className="text-sm text-gray-500">{(tier.avgCommissionRate * 100).toFixed(1)}% rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No tier analytics available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : analytics?.topSuppliers ? (
                <div className="space-y-4">
                  {analytics.topSuppliers.map((supplier, index) => (
                    <div key={supplier.supplierId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{supplier.supplierName}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{supplier.membershipTier}</Badge>
                            <span className="text-sm text-gray-500">{supplier.totalOrders} orders</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(supplier.totalCommission)}</p>
                        <p className="text-sm text-gray-500">{(supplier.avgCommissionRate * 100).toFixed(1)}% avg rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No supplier data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Commission Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : analytics?.monthlyTrends ? (
                <div className="space-y-4">
                  {analytics.monthlyTrends.map((trend) => (
                    <div key={trend.month} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{trend.month}</p>
                        <p className="text-sm text-gray-500">{trend.totalOrders} orders</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(trend.totalCommission)}</p>
                        <p className="text-sm text-gray-500">{(trend.avgRate * 100).toFixed(1)}% avg rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No trend data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedCommissionDashboard;