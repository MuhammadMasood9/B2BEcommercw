import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  Search,
  Filter,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SupplierPerformanceMetrics {
  supplierId: string;
  businessName: string;
  storeName: string;
  membershipTier: string;
  verificationLevel: string;
  totalOrders: number;
  totalSales: number;
  averageOrderValue: number;
  responseRate: number;
  responseTime: string;
  rating: number;
  totalReviews: number;
  totalProducts: number;
  approvedProducts: number;
  pendingProducts: number;
  rejectedProducts: number;
  complianceScore: number;
  policyViolations: number;
  disputeCount: number;
  lastActivity: Date;
  isActive: boolean;
  isSuspended: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
}

interface SupplierPerformanceMonitorProps {
  className?: string;
}

export default function SupplierPerformanceMonitor({ className }: SupplierPerformanceMonitorProps) {
  const [suppliers, setSuppliers] = useState<SupplierPerformanceMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('totalSales');
  const [sortOrder, setSortOrder] = useState('desc');
  const [riskFilter, setRiskFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  const fetchSupplierMetrics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '20',
        offset: ((page - 1) * 20).toString(),
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/admin/oversight/suppliers/performance?${params}`);
      if (!response.ok) throw new Error('Failed to fetch supplier metrics');
      
      const data = await response.json();
      setSuppliers(data.suppliers);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching supplier metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch supplier performance metrics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplierMetrics();
  }, [page, sortBy, sortOrder]);

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.storeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'all' || supplier.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const exportData = () => {
    const csvContent = [
      ['Business Name', 'Store Name', 'Risk Level', 'Compliance Score', 'Total Sales', 'Orders', 'Rating', 'Response Rate'].join(','),
      ...filteredSuppliers.map(supplier => [
        supplier.businessName,
        supplier.storeName,
        supplier.riskLevel,
        supplier.complianceScore,
        supplier.totalSales,
        supplier.totalOrders,
        supplier.rating,
        supplier.responseRate
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supplier-performance-metrics.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Supplier Performance Monitor</CardTitle>
            <CardDescription>Real-time performance metrics and risk assessment</CardDescription>
          </div>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="totalSales">Total Sales</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="complianceScore">Compliance</SelectItem>
              <SelectItem value="riskLevel">Risk Level</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Performance Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No suppliers found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.supplierId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{supplier.businessName}</p>
                        <p className="text-sm text-gray-600">{supplier.storeName}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {supplier.membershipTier}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRiskBadgeVariant(supplier.riskLevel)}>
                        {supplier.riskLevel}
                      </Badge>
                      {supplier.riskFactors.length > 0 && (
                        <div className="mt-1">
                          <AlertTriangle className="h-3 w-3 inline mr-1 text-yellow-500" />
                          <span className="text-xs text-gray-600">
                            {supplier.riskFactors.length} factors
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${getComplianceColor(supplier.complianceScore)}`}>
                          {supplier.complianceScore}%
                        </span>
                        {supplier.complianceScore >= 90 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      {supplier.policyViolations > 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          {supplier.policyViolations} violations
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">{supplier.rating.toFixed(1)}/5</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${
                                  i < Math.floor(supplier.rating) ? 'bg-yellow-400' : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600">
                          {supplier.responseRate.toFixed(1)}% response rate
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatCurrency(supplier.totalSales)}</p>
                        <p className="text-sm text-gray-600">{supplier.totalOrders} orders</p>
                        <p className="text-xs text-gray-500">
                          AOV: {formatCurrency(supplier.averageOrderValue)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{supplier.totalProducts} total</p>
                        <div className="flex gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {supplier.approvedProducts} approved
                          </Badge>
                        </div>
                        {supplier.pendingProducts > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {supplier.pendingProducts} pending
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {supplier.isActive ? (
                          <Badge variant="secondary">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                        {supplier.isSuspended && (
                          <Badge variant="destructive">Suspended</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} suppliers
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page * 20 >= total}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}