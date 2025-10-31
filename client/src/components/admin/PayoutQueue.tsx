import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Play, 
  Pause, 
  Settings, 
  Download,
  AlertTriangle,
  Users,
  CreditCard,
  TrendingUp,
  Filter,
  Calendar,
  RotateCcw,
  Eye,
  Send,
  Archive
} from "lucide-react";
import { format } from "date-fns";

interface PayoutQueueItem {
  id: string;
  supplierId: string;
  supplierName: string;
  membershipTier: string;
  amount: number;
  netAmount: number;
  commissionAmount: number;
  method: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scheduledDate: string;
  processedDate?: string;
  failureReason?: string;
  transactionId?: string;
  createdAt: string;
}

interface PayoutBatch {
  id: string;
  batchNumber: string;
  totalAmount: number;
  totalPayouts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scheduledDate: string;
  processedDate?: string;
  completedDate?: string;
  processedBy?: string;
  approvedBy?: string;
  failureReason?: string;
  retryCount: number;
  createdAt: string;
}

interface PayoutSummary {
  totalPending: number;
  totalProcessing: number;
  totalCompleted: number;
  totalFailed: number;
  pendingAmount: number;
  processingAmount: number;
  completedAmount: number;
  failedAmount: number;
}

interface BatchProcessingResult {
  batchId: string;
  processed: number;
  successful: number;
  failed: number;
  totalAmount: number;
  results: Array<{
    payoutId: string;
    success: boolean;
    transactionId?: string;
    error?: string;
  }>;
}

export default function PayoutQueue() {
  const [payoutSummary, setPayoutSummary] = useState<PayoutSummary | null>(null);
  const [pendingPayouts, setPendingPayouts] = useState<PayoutQueueItem[]>([]);
  const [processingPayouts, setProcessingPayouts] = useState<PayoutQueueItem[]>([]);
  const [completedPayouts, setCompletedPayouts] = useState<PayoutQueueItem[]>([]);
  const [failedPayouts, setFailedPayouts] = useState<PayoutQueueItem[]>([]);
  const [payoutBatches, setPayoutBatches] = useState<PayoutBatch[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('queue');
  const [dateRange, setDateRange] = useState('30d');
  
  // Selection and batch processing
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [batchSize, setBatchSize] = useState(50);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchProcessingResult | null>(null);
  
  // Filters
  const [methodFilter, setMethodFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  useEffect(() => {
    fetchPayoutData();
  }, [dateRange, methodFilter, tierFilter, minAmount, maxAmount]);

  const fetchPayoutData = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (dateRange !== 'all') {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        params.append('startDate', startDate.toISOString());
        params.append('endDate', new Date().toISOString());
      }
      if (methodFilter !== 'all') params.append('method', methodFilter);
      if (tierFilter !== 'all') params.append('tier', tierFilter);
      if (minAmount) params.append('minAmount', minAmount);
      if (maxAmount) params.append('maxAmount', maxAmount);

      // Fetch payout summary
      const summaryResponse = await fetch(`/api/admin/financial/payouts/automated-processing/summary?${params}`);
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setPayoutSummary(summaryData);
      }

      // Fetch payout queues
      const queueResponse = await fetch(`/api/admin/financial/payouts/automated-processing/queue?${params}`);
      if (queueResponse.ok) {
        const queueData = await queueResponse.json();
        setPendingPayouts(queueData.pending || []);
        setProcessingPayouts(queueData.processing || []);
        setCompletedPayouts(queueData.completed || []);
        setFailedPayouts(queueData.failed || []);
      }

      // Fetch batch history
      const batchResponse = await fetch(`/api/admin/financial/payouts/automated-processing/batches?${params}`);
      if (batchResponse.ok) {
        const batchData = await batchResponse.json();
        setPayoutBatches(batchData);
      }
    } catch (error) {
      console.error('Error fetching payout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processBatchPayouts = async () => {
    if (selectedPayouts.length === 0) return;

    setProcessing(true);
    setShowBatchDialog(false);
    setShowProgressDialog(true);
    setProcessingProgress(0);

    try {
      const response = await fetch('/api/admin/financial/payouts/automated-processing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payoutIds: selectedPayouts,
          batchSize: batchSize,
        }),
      });

      if (response.ok) {
        const result: BatchProcessingResult = await response.json();
        setBatchResult(result);
        setProcessingProgress(100);
        
        // Clear selections
        setSelectedPayouts([]);
        setSelectAll(false);
        
        // Refresh data
        setTimeout(() => {
          fetchPayoutData();
          setShowProgressDialog(false);
        }, 2000);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        setShowProgressDialog(false);
      }
    } catch (error) {
      console.error('Error processing batch payouts:', error);
      alert('Failed to process batch payouts');
      setShowProgressDialog(false);
    } finally {
      setProcessing(false);
    }
  };

  const retryFailedPayout = async (payoutId: string) => {
    try {
      const response = await fetch(`/api/admin/financial/payouts/automated-processing/retry/${payoutId}`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Payout retry initiated successfully!');
        fetchPayoutData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error retrying payout:', error);
      alert('Failed to retry payout');
    }
  };

  const cancelPayout = async (payoutId: string) => {
    try {
      const response = await fetch(`/api/admin/financial/payouts/automated-processing/cancel/${payoutId}`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Payout cancelled successfully!');
        fetchPayoutData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error cancelling payout:', error);
      alert('Failed to cancel payout');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedPayouts(pendingPayouts.map(p => p.id));
    } else {
      setSelectedPayouts([]);
    }
  };

  const handleSelectPayout = (payoutId: string, checked: boolean) => {
    if (checked) {
      setSelectedPayouts([...selectedPayouts, payoutId]);
    } else {
      setSelectedPayouts(selectedPayouts.filter(id => id !== payoutId));
      setSelectAll(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pending', icon: Clock },
      processing: { variant: 'default' as const, label: 'Processing', icon: RefreshCw },
      completed: { variant: 'default' as const, label: 'Completed', icon: CheckCircle },
      failed: { variant: 'destructive' as const, label: 'Failed', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getMethodBadge = (method: string) => {
    const methodConfig = {
      bank_transfer: { label: 'Bank Transfer', color: 'bg-blue-100 text-blue-800' },
      paypal: { label: 'PayPal', color: 'bg-yellow-100 text-yellow-800' },
      stripe: { label: 'Stripe', color: 'bg-purple-100 text-purple-800' },
      wire: { label: 'Wire Transfer', color: 'bg-green-100 text-green-800' },
    };

    const config = methodConfig[method as keyof typeof methodConfig] || methodConfig.bank_transfer;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
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
          <h1 className="text-3xl font-bold">Payout Queue</h1>
          <p className="text-muted-foreground">Manage and process supplier payouts with batch processing</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
            <DialogTrigger asChild>
              <Button disabled={selectedPayouts.length === 0}>
                <Play className="h-4 w-4 mr-2" />
                Process Selected ({selectedPayouts.length})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Process Batch Payouts</DialogTitle>
                <DialogDescription>
                  Process {selectedPayouts.length} selected payouts in batches
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="batchSize">Batch Size</Label>
                  <Input
                    id="batchSize"
                    type="number"
                    min="1"
                    max="100"
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value) || 50)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Number of payouts to process simultaneously
                  </p>
                </div>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This will process {selectedPayouts.length} payouts with a total amount of{' '}
                    {formatCurrency(
                      pendingPayouts
                        .filter(p => selectedPayouts.includes(p.id))
                        .reduce((sum, p) => sum + p.netAmount, 0)
                    )}
                  </AlertDescription>
                </Alert>
              </div>
              <DialogFooter>
                <Button onClick={processBatchPayouts} disabled={processing}>
                  {processing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Process Batch
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button onClick={fetchPayoutData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payoutSummary?.totalPending || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(payoutSummary?.pendingAmount || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payoutSummary?.totalProcessing || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(payoutSummary?.processingAmount || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payoutSummary?.totalCompleted || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(payoutSummary?.completedAmount || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payoutSummary?.totalFailed || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(payoutSummary?.failedAmount || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="methodFilter">Payment Method</Label>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="wire">Wire Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="tierFilter">Membership Tier</Label>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="minAmount">Min Amount</Label>
              <Input
                id="minAmount"
                type="number"
                placeholder="0"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="maxAmount">Max Amount</Label>
              <Input
                id="maxAmount"
                type="number"
                placeholder="No limit"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="queue">Payout Queue ({payoutSummary?.totalPending || 0})</TabsTrigger>
          <TabsTrigger value="processing">Processing ({payoutSummary?.totalProcessing || 0})</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="failed">Failed ({payoutSummary?.totalFailed || 0})</TabsTrigger>
          <TabsTrigger value="batches">Batch History</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Pending Payouts</CardTitle>
                  <CardDescription>
                    Payouts ready for processing
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="selectAll"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="selectAll">Select All</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Net Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No pending payouts
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingPayouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedPayouts.includes(payout.id)}
                            onCheckedChange={(checked) => handleSelectPayout(payout.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {payout.supplierName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payout.membershipTier}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(payout.amount)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payout.netAmount)}
                        </TableCell>
                        <TableCell>{getMethodBadge(payout.method)}</TableCell>
                        <TableCell>
                          {format(new Date(payout.scheduledDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Payout</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to cancel this payout? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => cancelPayout(payout.id)}>
                                    Cancel Payout
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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

        <TabsContent value="processing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Processing Payouts</CardTitle>
              <CardDescription>
                Payouts currently being processed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Net Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processingPayouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No payouts currently processing
                      </TableCell>
                    </TableRow>
                  ) : (
                    processingPayouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell className="font-medium">
                          {payout.supplierName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payout.membershipTier}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(payout.amount)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payout.netAmount)}
                        </TableCell>
                        <TableCell>{getMethodBadge(payout.method)}</TableCell>
                        <TableCell>
                          {payout.processedDate && format(new Date(payout.processedDate), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>{getStatusBadge(payout.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Completed Payouts</CardTitle>
              <CardDescription>
                Successfully processed payouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Net Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Completed Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedPayouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No completed payouts in selected period
                      </TableCell>
                    </TableRow>
                  ) : (
                    completedPayouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell className="font-medium">
                          {payout.supplierName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payout.membershipTier}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(payout.amount)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payout.netAmount)}
                        </TableCell>
                        <TableCell>{getMethodBadge(payout.method)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {payout.transactionId}
                        </TableCell>
                        <TableCell>
                          {payout.processedDate && format(new Date(payout.processedDate), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Failed Payouts</CardTitle>
              <CardDescription>
                Payouts that failed processing and need attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Net Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Failure Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failedPayouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No failed payouts
                      </TableCell>
                    </TableRow>
                  ) : (
                    failedPayouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell className="font-medium">
                          {payout.supplierName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payout.membershipTier}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(payout.amount)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payout.netAmount)}
                        </TableCell>
                        <TableCell>{getMethodBadge(payout.method)}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-red-600 truncate">
                              {payout.failureReason}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryFailedPayout(payout.id)}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Retry
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
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

        <TabsContent value="batches" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Batch Processing History</CardTitle>
              <CardDescription>
                History of batch payout processing operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Total Payouts</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Processed Date</TableHead>
                    <TableHead>Processed By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payoutBatches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No batch processing history
                      </TableCell>
                    </TableRow>
                  ) : (
                    payoutBatches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium font-mono">
                          {batch.batchNumber}
                        </TableCell>
                        <TableCell>{batch.totalPayouts}</TableCell>
                        <TableCell>{formatCurrency(batch.totalAmount)}</TableCell>
                        <TableCell>{getStatusBadge(batch.status)}</TableCell>
                        <TableCell>
                          {batch.processedDate && format(new Date(batch.processedDate), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>{batch.processedBy || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
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
      </Tabs>

      {/* Batch Processing Progress Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Processing Batch Payouts</DialogTitle>
            <DialogDescription>
              Processing payouts in batches...
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Progress value={processingProgress} className="w-full" />
            
            {batchResult && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Processed:</span>
                    <span className="font-medium ml-2">{batchResult.processed}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Successful:</span>
                    <span className="font-medium ml-2 text-green-600">{batchResult.successful}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Failed:</span>
                    <span className="font-medium ml-2 text-red-600">{batchResult.failed}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-medium ml-2">{formatCurrency(batchResult.totalAmount)}</span>
                  </div>
                </div>
                
                {processingProgress === 100 && (
                  <Alert className="mt-4">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Batch processing completed successfully!
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}