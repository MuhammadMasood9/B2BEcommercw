import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DollarSign, Clock, CheckCircle, XCircle, RefreshCw, Play, RotateCcw, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface PayoutSummary {
  totalPending: number;
  totalProcessing: number;
  totalCompleted: number;
  totalFailed: number;
  pendingAmount: number;
  completedAmount: number;
  failedAmount: number;
}

interface PayoutRecord {
  id: string;
  supplierId: string;
  orderId?: string;
  amount: number;
  commissionAmount: number;
  netAmount: number;
  method: string;
  status: string;
  scheduledDate: string;
  processedDate?: string;
  transactionId?: string;
  failureReason?: string;
  createdAt: string;
  supplierName?: string;
}

interface ProcessingResult {
  processed: number;
  successful: number;
  failed: number;
  results: Array<{
    success: boolean;
    payoutId?: string;
    transactionId?: string;
    error?: string;
  }>;
}

export default function PayoutManagement() {
  const [payoutSummary, setPayoutSummary] = useState<PayoutSummary | null>(null);
  const [pendingPayouts, setPendingPayouts] = useState<PayoutRecord[]>([]);
  const [completedPayouts, setCompletedPayouts] = useState<PayoutRecord[]>([]);
  const [failedPayouts, setFailedPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [selectedPayout, setSelectedPayout] = useState<PayoutRecord | null>(null);

  useEffect(() => {
    fetchPayoutData();
  }, [dateRange]);

  const fetchPayoutData = async () => {
    setLoading(true);
    try {
      // Fetch payout summary
      const summaryParams = new URLSearchParams();
      if (dateRange !== 'all') {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        summaryParams.append('startDate', startDate.toISOString());
        summaryParams.append('endDate', new Date().toISOString());
      }

      const summaryResponse = await fetch(`/api/payouts/admin/summary?${summaryParams}`);
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setPayoutSummary(summaryData);
      }

      // Fetch pending payouts
      const pendingResponse = await fetch('/api/payouts/admin/pending');
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingPayouts(pendingData);
      }

      // For now, we'll simulate completed and failed payouts
      // In a real implementation, these would come from separate endpoints
      setCompletedPayouts([]);
      setFailedPayouts([]);
    } catch (error) {
      console.error('Error fetching payout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAllPayouts = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/payouts/admin/process-all', {
        method: 'POST',
      });

      if (response.ok) {
        const result: ProcessingResult = await response.json();
        alert(`Processed ${result.processed} payouts: ${result.successful} successful, ${result.failed} failed`);
        fetchPayoutData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error processing payouts:', error);
      alert('Failed to process payouts');
    } finally {
      setProcessing(false);
    }
  };

  const processSinglePayout = async (payoutId: string) => {
    try {
      const response = await fetch(`/api/payouts/admin/process/${payoutId}`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        alert('Payout processed successfully!');
        fetchPayoutData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error processing payout:', error);
      alert('Failed to process payout');
    }
  };

  const retryFailedPayout = async (payoutId: string) => {
    try {
      const response = await fetch(`/api/payouts/admin/retry/${payoutId}`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        alert('Payout retry initiated successfully!');
        fetchPayoutData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error retrying payout:', error);
      alert('Failed to retry payout');
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
          <h1 className="text-3xl font-bold">Payout Management</h1>
          <p className="text-muted-foreground">Process and manage supplier payouts</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchPayoutData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={processing || (payoutSummary?.totalPending || 0) === 0}>
                {processing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Process All Payouts
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Process All Pending Payouts</AlertDialogTitle>
                <AlertDialogDescription>
                  This will process all pending payouts ({payoutSummary?.totalPending || 0} payouts, 
                  total amount: {formatCurrency(payoutSummary?.pendingAmount || 0)}). 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={processAllPayouts}>
                  Process All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
              Currently being processed
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pending">Pending ({payoutSummary?.totalPending || 0})</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="failed">Failed ({payoutSummary?.totalFailed || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payout Overview</CardTitle>
              <CardDescription>
                Summary of all payout activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Total Payouts Processed</p>
                    <p className="text-2xl font-bold">
                      {(payoutSummary?.totalCompleted || 0) + (payoutSummary?.totalFailed || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Success Rate</p>
                    <p className="text-2xl font-bold">
                      {payoutSummary?.totalCompleted && payoutSummary?.totalFailed ? 
                        ((payoutSummary.totalCompleted / (payoutSummary.totalCompleted + payoutSummary.totalFailed)) * 100).toFixed(1) + '%' :
                        '100%'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Payout Processing</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Payouts are processed automatically on scheduled dates</p>
                    <p>• Failed payouts can be retried manually</p>
                    <p>• Minimum payout threshold: $50</p>
                    <p>• Processing typically takes 1-3 business days</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payouts</CardTitle>
              <CardDescription>
                Payouts scheduled for processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
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
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No pending payouts
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingPayouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell className="font-medium">
                          {payout.supplierName || 'Unknown Supplier'}
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
                          <Button
                            size="sm"
                            onClick={() => processSinglePayout(payout.id)}
                          >
                            Process Now
                          </Button>
                        </TableCell>
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
                    <TableHead>Amount</TableHead>
                    <TableHead>Net Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Processed Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedPayouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No completed payouts in selected period
                      </TableCell>
                    </TableRow>
                  ) : (
                    completedPayouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell className="font-medium">
                          {payout.supplierName || 'Unknown Supplier'}
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
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No failed payouts
                      </TableCell>
                    </TableRow>
                  ) : (
                    failedPayouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell className="font-medium">
                          {payout.supplierName || 'Unknown Supplier'}
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryFailedPayout(payout.id)}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Retry
                          </Button>
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
    </div>
  );
}