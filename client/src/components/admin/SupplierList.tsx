import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Eye, Edit, Ban, CheckCircle, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Supplier {
  id: string;
  businessName: string;
  storeName: string;
  email: string;
  country: string;
  membershipTier: string;
  verificationLevel: string;
  status: string;
  rating: number;
  totalReviews: number;
  totalSales: number;
  totalOrders: number;
  responseRate: number;
  isActive: boolean;
  isSuspended: boolean;
  createdAt: string;
  performance?: {
    performanceScore: number;
    riskLevel: string;
    trends: {
      salesTrend: string;
      orderTrend: string;
      ratingTrend: string;
    };
  };
}

interface SupplierListProps {
  onSupplierSelect?: (supplier: Supplier) => void;
  onSupplierAction?: (action: string, supplierId: string) => void;
  showPerformanceMetrics?: boolean;
}

export function SupplierList({ 
  onSupplierSelect, 
  onSupplierAction, 
  showPerformanceMetrics = false 
}: SupplierListProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('totalSales');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSuppliers, setTotalSuppliers] = useState(0);

  const pageSize = 20;

  useEffect(() => {
    fetchSuppliers();
  }, [searchTerm, statusFilter, tierFilter, verificationFilter, sortBy, sortOrder, currentPage]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
        sortBy,
        sortOrder,
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (tierFilter !== 'all') params.append('membershipTier', tierFilter);
      if (verificationFilter !== 'all') params.append('verificationLevel', verificationFilter);

      const endpoint = showPerformanceMetrics 
        ? `/api/admin/suppliers/performance/comprehensive?${params}`
        : `/api/admin/suppliers?${params}`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.success) {
        setSuppliers(data.suppliers);
        setTotalSuppliers(data.total);
        setTotalPages(Math.ceil(data.total / pageSize));
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierAction = async (action: string, supplierId: string) => {
    if (onSupplierAction) {
      onSupplierAction(action, supplierId);
    }
    
    // Refresh the list after action
    await fetchSuppliers();
  };

  const getStatusBadge = (status: string, isActive: boolean, isSuspended: boolean) => {
    if (isSuspended) {
      return <Badge variant="destructive">Suspended</Badge>;
    }
    
    switch (status) {
      case 'approved':
        return isActive ? 
          <Badge variant="default" className="bg-green-500">Active</Badge> :
          <Badge variant="secondary">Inactive</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      free: 'bg-gray-500',
      silver: 'bg-gray-400',
      gold: 'bg-yellow-500',
      platinum: 'bg-purple-500',
    };
    
    return (
      <Badge className={colors[tier as keyof typeof colors] || 'bg-gray-500'}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    );
  };

  const getVerificationBadge = (level: string) => {
    const colors = {
      none: 'bg-red-500',
      basic: 'bg-yellow-500',
      business: 'bg-blue-500',
      premium: 'bg-green-500',
      trade_assurance: 'bg-purple-500',
    };
    
    return (
      <Badge className={colors[level as keyof typeof colors] || 'bg-gray-500'}>
        {level.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getRiskBadge = (riskLevel: string) => {
    const colors = {
      low: 'bg-green-500',
      medium: 'bg-yellow-500',
      high: 'bg-orange-500',
      critical: 'bg-red-500',
    };
    
    return (
      <Badge className={colors[riskLevel as keyof typeof colors] || 'bg-gray-500'}>
        {riskLevel.toUpperCase()}
      </Badge>
    );
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> :
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Suppliers ({totalSuppliers})</span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                Export
              </Button>
              <Button size="sm">
                Add Supplier
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>

              <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Verification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="trade_assurance">Trade Assurance</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="totalSales">Total Sales</SelectItem>
                  <SelectItem value="totalOrders">Total Orders</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="responseRate">Response Rate</SelectItem>
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="businessName">Business Name</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Response Rate</TableHead>
                {showPerformanceMetrics && (
                  <>
                    <TableHead>Performance</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Trends</TableHead>
                  </>
                )}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={showPerformanceMetrics ? 12 : 9} className="text-center py-8">
                    Loading suppliers...
                  </TableCell>
                </TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showPerformanceMetrics ? 12 : 9} className="text-center py-8">
                    No suppliers found
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow 
                    key={supplier.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSupplierSelect?.(supplier)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{supplier.businessName}</div>
                        <div className="text-sm text-muted-foreground">
                          {supplier.storeName} • {supplier.country}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {supplier.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(supplier.status, supplier.isActive, supplier.isSuspended)}
                    </TableCell>
                    <TableCell>
                      {getTierBadge(supplier.membershipTier)}
                    </TableCell>
                    <TableCell>
                      {getVerificationBadge(supplier.verificationLevel)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">{supplier.rating.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">
                          ({supplier.totalReviews})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(supplier.totalSales)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {supplier.totalOrders.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">{supplier.responseRate}%</span>
                        {supplier.responseRate < 80 && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </TableCell>
                    {showPerformanceMetrics && supplier.performance && (
                      <>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="font-medium">
                              {supplier.performance.performanceScore.toFixed(1)}
                            </div>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${supplier.performance.performanceScore}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRiskBadge(supplier.performance.riskLevel)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {getTrendIcon(supplier.performance.trends.salesTrend)}
                            {getTrendIcon(supplier.performance.trends.orderTrend)}
                            {getTrendIcon(supplier.performance.trends.ratingTrend)}
                          </div>
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleSupplierAction('view', supplier.id);
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleSupplierAction('edit', supplier.id);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {supplier.status === 'pending' && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleSupplierAction('approve', supplier.id);
                            }}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          {!supplier.isSuspended ? (
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSupplierAction('suspend', supplier.id);
                              }}
                              className="text-red-600"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleSupplierAction('activate', supplier.id);
                            }}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalSuppliers)} of {totalSuppliers} suppliers
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}