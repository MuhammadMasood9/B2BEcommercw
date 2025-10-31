import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    Star,
    Clock,
    DollarSign,
    Package,
    Users,
    Activity,
    Filter,
    RefreshCw,
    Bell,
    Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PerformanceMetrics {
    performanceScore: number;
    riskLevel: string;
    responseRate: number;
    rating: number;
    totalSales: number;
    totalOrders: number;
    totalProducts: number;
    averageOrderValue: number;
    trends: {
        salesTrend: string;
        orderTrend: string;
        ratingTrend: string;
        responseTrend: string;
    };
    lastUpdated: string;
}

interface Supplier {
    id: string;
    businessName: string;
    storeName: string;
    membershipTier: string;
    verificationLevel: string;
    isActive: boolean;
    isSuspended: boolean;
    performance: PerformanceMetrics;
}

interface PerformanceAlert {
    id: string;
    supplierId: string;
    supplierName: string;
    alertType: string;
    severity: string;
    message: string;
    currentValue: number;
    threshold: number;
    status: string;
    createdAt: string;
}

interface Benchmarks {
    industry: {
        averageRating: number;
        averageResponseRate: number;
        averageSales: number;
        averageOrders: number;
    };
    percentiles: {
        rating: { p25: number; p50: number; p75: number; p90: number };
        responseRate: { p25: number; p50: number; p75: number; p90: number };
        sales: { p25: number; p50: number; p75: number; p90: number };
    };
    topPerformers: Array<{
        id: string;
        businessName: string;
        rating: number;
        totalSales: number;
        responseRate: number;
    }>;
}

interface PerformanceThresholds {
    responseRate: { warning: number; critical: number };
    rating: { warning: number; critical: number };
    orderFulfillment: { warning: number; critical: number };
    disputeRate: { warning: number; critical: number };
}

export function PerformanceMonitor() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
    const [benchmarks, setBenchmarks] = useState<Benchmarks | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [riskFilter, setRiskFilter] = useState('all');
    const [tierFilter, setTierFilter] = useState('all');
    const [sortBy, setSortBy] = useState('performanceScore');
    const [sortOrder, setSortOrder] = useState('desc');
    const [thresholdsDialog, setThresholdsDialog] = useState(false);
    const [thresholds, setThresholds] = useState<PerformanceThresholds>({
        responseRate: { warning: 80, critical: 60 },
        rating: { warning: 4.0, critical: 3.5 },
        orderFulfillment: { warning: 90, critical: 80 },
        disputeRate: { warning: 5, critical: 10 },
    });

    useEffect(() => {
        fetchPerformanceData();
        fetchAlerts();
        fetchBenchmarks();
    }, [riskFilter, tierFilter, sortBy, sortOrder]);

    const fetchPerformanceData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                limit: '50',
                offset: '0',
                sortBy,
                sortOrder,
            });

            if (riskFilter !== 'all') params.append('riskLevel', riskFilter);
            if (tierFilter !== 'all') params.append('membershipTier', tierFilter);

            const response = await fetch(`/api/admin/suppliers/performance/comprehensive?${params}`);
            const data = await response.json();

            if (data.success) {
                setSuppliers(data.suppliers);
            }
        } catch (error) {
            console.error('Error fetching performance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAlerts = async () => {
        try {
            const response = await fetch('/api/admin/suppliers/performance/alerts?limit=20');
            const data = await response.json();

            if (data.success) {
                setAlerts(data.alerts);
            }
        } catch (error) {
            console.error('Error fetching alerts:', error);
        }
    };

    const fetchBenchmarks = async () => {
        try {
            const response = await fetch('/api/admin/suppliers/performance/benchmarks');
            const data = await response.json();

            if (data.success) {
                setBenchmarks(data.benchmarks);
            }
        } catch (error) {
            console.error('Error fetching benchmarks:', error);
        }
    };

    const updateThresholds = async () => {
        try {
            const response = await fetch('/api/admin/suppliers/performance/thresholds', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(thresholds),
            });

            const data = await response.json();

            if (data.success) {
                setThresholdsDialog(false);
                await fetchAlerts(); // Refresh alerts with new thresholds
            }
        } catch (error) {
            console.error('Error updating thresholds:', error);
        }
    };

    const flagSupplier = async (supplierId: string, reason: string, severity: string) => {
        try {
            const response = await fetch(`/api/admin/suppliers/${supplierId}/performance/flag`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reason,
                    severity,
                    notes: 'Flagged from performance monitor',
                }),
            });

            const data = await response.json();

            if (data.success) {
                await fetchPerformanceData();
                await fetchAlerts();
            }
        } catch (error) {
            console.error('Error flagging supplier:', error);
        }
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

    const getSeverityBadge = (severity: string) => {
        const colors = {
            info: 'bg-blue-500',
            warning: 'bg-yellow-500',
            error: 'bg-red-500',
            critical: 'bg-red-600',
        };

        return (
            <Badge className={colors[severity as keyof typeof colors] || 'bg-gray-500'}>
                {severity.toUpperCase()}
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getPerformanceColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        if (score >= 40) return 'text-orange-600';
        return 'text-red-600';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Performance Monitor</h1>
                    <p className="text-muted-foreground">
                        Real-time supplier performance tracking and alerts
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={() => setThresholdsDialog(true)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Thresholds
                    </Button>
                    <Button variant="outline" onClick={fetchPerformanceData}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Performance Overview Cards */}
            {benchmarks && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <Star className="h-5 w-5 text-yellow-500" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                                    <p className="text-xl font-bold">
                                        {benchmarks.industry.averageRating.toFixed(1)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <Clock className="h-5 w-5 text-blue-500" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Avg Response Rate</p>
                                    <p className="text-xl font-bold">
                                        {benchmarks.industry.averageResponseRate.toFixed(0)}%
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <DollarSign className="h-5 w-5 text-green-500" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Avg Sales</p>
                                    <p className="text-xl font-bold">
                                        {formatCurrency(benchmarks.industry.averageSales)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Active Alerts</p>
                                    <p className="text-xl font-bold">{alerts.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Performance Overview</TabsTrigger>
                    <TabsTrigger value="alerts">Alerts ({alerts.length})</TabsTrigger>
                    <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
                    <TabsTrigger value="rankings">Rankings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    {/* Filters */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-4">
                                <Select value={riskFilter} onValueChange={setRiskFilter}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Risk Level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Risk</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="critical">Critical</SelectItem>
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

                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="performanceScore">Performance Score</SelectItem>
                                        <SelectItem value="totalSales">Total Sales</SelectItem>
                                        <SelectItem value="rating">Rating</SelectItem>
                                        <SelectItem value="responseRate">Response Rate</SelectItem>
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
                        </CardContent>
                    </Card>

                    {/* Performance Table */}
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>Performance Score</TableHead>
                                        <TableHead>Risk Level</TableHead>
                                        <TableHead>Rating</TableHead>
                                        <TableHead>Response Rate</TableHead>
                                        <TableHead>Sales</TableHead>
                                        <TableHead>Trends</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8">
                                                Loading performance data...
                                            </TableCell>
                                        </TableRow>
                                    ) : suppliers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8">
                                                No suppliers found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        suppliers.map((supplier) => (
                                            <TableRow key={supplier.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{supplier.businessName}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {supplier.storeName}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <div className={`font-medium ${getPerformanceColor(supplier.performance.performanceScore)}`}>
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
                                                    <div className="flex items-center space-x-1">
                                                        <Star className="h-4 w-4 text-yellow-500" />
                                                        <span>{supplier.performance.rating.toFixed(1)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-1">
                                                        <span>{supplier.performance.responseRate}%</span>
                                                        {supplier.performance.responseRate < 80 && (
                                                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(supplier.performance.totalSales)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-1">
                                                        {getTrendIcon(supplier.performance.trends.salesTrend)}
                                                        {getTrendIcon(supplier.performance.trends.orderTrend)}
                                                        {getTrendIcon(supplier.performance.trends.ratingTrend)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-1">
                                                        {supplier.performance.riskLevel === 'high' || supplier.performance.riskLevel === 'critical' ? (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => flagSupplier(supplier.id, 'Poor performance metrics', 'warning')}
                                                            >
                                                                Flag
                                                            </Button>
                                                        ) : (
                                                            <Button size="sm" variant="ghost">
                                                                <Activity className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="alerts" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Bell className="h-5 w-5" />
                                <span>Performance Alerts</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {alerts.length === 0 ? (
                                <div className="text-center py-8">
                                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No Active Alerts</h3>
                                    <p className="text-muted-foreground">All suppliers are performing within acceptable thresholds.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {alerts.map((alert) => (
                                        <div key={alert.id} className="flex items-start justify-between p-4 border rounded-lg">
                                            <div className="flex items-start space-x-3">
                                                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                                                <div>
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <h4 className="font-medium">{alert.supplierName}</h4>
                                                        {getSeverityBadge(alert.severity)}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-1">{alert.message}</p>
                                                    <div className="text-xs text-muted-foreground">
                                                        Current: {alert.currentValue} | Threshold: {alert.threshold} | {formatDate(alert.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button size="sm" variant="outline">
                                                    Investigate
                                                </Button>
                                                <Button size="sm" variant="outline">
                                                    Dismiss
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="benchmarks" className="space-y-4">
                    {benchmarks && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Industry Benchmarks</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Average Rating</p>
                                            <p className="text-xl font-bold">{benchmarks.industry.averageRating.toFixed(1)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Response Rate</p>
                                            <p className="text-xl font-bold">{benchmarks.industry.averageResponseRate.toFixed(0)}%</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Average Sales</p>
                                            <p className="text-xl font-bold">{formatCurrency(benchmarks.industry.averageSales)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Average Orders</p>
                                            <p className="text-xl font-bold">{benchmarks.industry.averageOrders.toFixed(0)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Performance Percentiles</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span>Rating Distribution</span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 text-xs">
                                            <div className="text-center">
                                                <p className="text-muted-foreground">25th</p>
                                                <p className="font-medium">{benchmarks.percentiles.rating.p25}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-muted-foreground">50th</p>
                                                <p className="font-medium">{benchmarks.percentiles.rating.p50}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-muted-foreground">75th</p>
                                                <p className="font-medium">{benchmarks.percentiles.rating.p75}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-muted-foreground">90th</p>
                                                <p className="font-medium">{benchmarks.percentiles.rating.p90}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span>Response Rate Distribution</span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 text-xs">
                                            <div className="text-center">
                                                <p className="text-muted-foreground">25th</p>
                                                <p className="font-medium">{benchmarks.percentiles.responseRate.p25}%</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-muted-foreground">50th</p>
                                                <p className="font-medium">{benchmarks.percentiles.responseRate.p50}%</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-muted-foreground">75th</p>
                                                <p className="font-medium">{benchmarks.percentiles.responseRate.p75}%</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-muted-foreground">90th</p>
                                                <p className="font-medium">{benchmarks.percentiles.responseRate.p90}%</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="rankings" className="space-y-4">
                    {benchmarks && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Performers</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Rank</TableHead>
                                            <TableHead>Supplier</TableHead>
                                            <TableHead>Rating</TableHead>
                                            <TableHead>Response Rate</TableHead>
                                            <TableHead>Total Sales</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {benchmarks.topPerformers.map((performer, index) => (
                                            <TableRow key={performer.id}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                                                            {index + 1}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{performer.businessName}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-1">
                                                        <Star className="h-4 w-4 text-yellow-500" />
                                                        <span>{performer.rating.toFixed(1)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{performer.responseRate.toFixed(0)}%</TableCell>
                                                <TableCell>{formatCurrency(performer.totalSales)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* Thresholds Configuration Dialog */}
            <Dialog open={thresholdsDialog} onOpenChange={setThresholdsDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Performance Thresholds</DialogTitle>
                        <DialogDescription>
                            Configure alert thresholds for supplier performance monitoring
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label>Response Rate Thresholds (%)</Label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <div>
                                    <Label className="text-xs">Warning</Label>
                                    <Input
                                        type="number"
                                        value={thresholds.responseRate.warning}
                                        onChange={(e) => setThresholds({
                                            ...thresholds,
                                            responseRate: { ...thresholds.responseRate, warning: parseFloat(e.target.value) }
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Critical</Label>
                                    <Input
                                        type="number"
                                        value={thresholds.responseRate.critical}
                                        onChange={(e) => setThresholds({
                                            ...thresholds,
                                            responseRate: { ...thresholds.responseRate, critical: parseFloat(e.target.value) }
                                        })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label>Rating Thresholds</Label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <div>
                                    <Label className="text-xs">Warning</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={thresholds.rating.warning}
                                        onChange={(e) => setThresholds({
                                            ...thresholds,
                                            rating: { ...thresholds.rating, warning: parseFloat(e.target.value) }
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Critical</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={thresholds.rating.critical}
                                        onChange={(e) => setThresholds({
                                            ...thresholds,
                                            rating: { ...thresholds.rating, critical: parseFloat(e.target.value) }
                                        })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setThresholdsDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={updateThresholds}>
                            Save Thresholds
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}