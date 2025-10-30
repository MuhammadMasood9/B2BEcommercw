import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, DollarSign, TrendingUp, Clock, Download, RefreshCw } from "lucide-react";
import { format, subDays, subMonths } from "date-fns";

interface EarningsSummary {
  totalEarnings: number;
  totalPayouts: number;
  pendingEarnings: number;
  pendingPayouts: number;
  totalOrders: number;
  totalSales: number;
  totalCommission: number;
  avgCommissionRate: number;
}

interface PayoutHistory {
  id: string;
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
}

interface PendingPayout {
  supplierId: string;
  amount: number;
  commissionAmount: number;
  netAmount: number;
  orderIds: string[];
  scheduledDate: string;
}

export default function EarningsOverview() {
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistory[]>([]);
  const [pendingPayout, setPendingPayout] = useState<PendingPayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchEarningsData();
  }, [dateRange]);

  const fetchEarningsData = async () => {
    setLoading(true);
    try {
      // Fetch earnings summary
      const earningsResponse = await fetch('/api/payouts/supplier/earnings');
      if (earningsResponse.ok) {
        const earningsData = await earningsResponse.json();
        setEarningsSummary(earningsData);
      }

      // Fetch payout history
      const historyParams = new URLSearchParams();
      if (dateRange !== 'all') {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const startDate = subDays(new Date(), days);
        historyParams.append('startDate', startDate.toISOString());
        historyParams.append('endDate', new Date().toISOString());
      }
      
      const historyResponse = await fetch(`/api/payouts/supplier/history?${historyParams}`);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setPayoutHistory(historyData);
      }

      // Fetch pending payout
      const pendingResponse = await fetch('/api/payouts/supplier/pending');
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingPayout(pendingData);
      }
    } catch (error) {
      console.error('Error fetching earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestPayout = async (method: string = 'bank_transfer') => {
    try {
      const response = await fetch('/api/payouts/supplier/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ method }),
      });

      if (response.ok) {
        const result = await response.json();
        alert('Payout request submitted successfully!');
        fetchEarningsData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      alert('Failed to request payout');
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
      pending: { variant: 'secondary' as const, label: 'Pending' },
      processing: { variant: 'default' as const, label: 'Processing' },
      completed: { variant: 'default' as const, label: 'Completed' },
      failed: { variant: 'destructive' as const, label: 'Failed' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
          <h1 className="text-3xl font-bold">Earnings Overview</h1>
          <p className="text-muted-foreground">Track your earnings, commissions, and payouts</p>
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
          <Button onClick={fetchEarningsData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="commission">Commission</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(earningsSummary?.totalEarnings || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {earningsSummary?.totalPayouts || 0} payouts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(earningsSummary?.pendingEarnings || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {earningsSummary?.pendingPayouts || 0} pending payouts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(earningsSummary?.totalSales || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {earningsSummary?.totalOrders || 0} orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commission Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(earningsSummary?.avgCommissionRate || 0).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Total commission: {formatCurrency(earningsSummary?.totalCommission || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Payout Card */}
          {pendingPayout && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Payout Available</CardTitle>
                <CardDescription>
                  You have earnings ready for payout
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(pendingPayout.netAmount)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      From {pendingPayout.orderIds.length} orders • 
                      Commission: {formatCurrency(pendingPayout.commissionAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Scheduled for: {format(new Date(pendingPayout.scheduledDate), 'PPP')}
                    </p>
                  </div>
                  <Button onClick={() => requestPayout()}>
                    Request Payout
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>
                Track all your payout requests and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payoutHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No payout history found
                  </p>
                ) : (
                  payoutHistory.map((payout) => (
                    <div
                      key={payout.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatCurrency(payout.netAmount)}
                          </span>
                          {getStatusBadge(payout.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {payout.method.replace('_', ' ').toUpperCase()} • 
                          Created: {format(new Date(payout.createdAt), 'PPp')}
                        </p>
                        {payout.processedDate && (
                          <p className="text-sm text-muted-foreground">
                            Processed: {format(new Date(payout.processedDate), 'PPp')}
                          </p>
                        )}
                        {payout.transactionId && (
                          <p className="text-xs text-muted-foreground">
                            Transaction ID: {payout.transactionId}
                          </p>
                        )}
                        {payout.failureReason && (
                          <p className="text-xs text-red-600">
                            Failure reason: {payout.failureReason}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Gross: {formatCurrency(payout.amount)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Commission: -{formatCurrency(payout.commissionAmount)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commission" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Commission Breakdown</CardTitle>
              <CardDescription>
                Understand how your commission is calculated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Average Commission Rate</p>
                    <p className="text-2xl font-bold">
                      {(earningsSummary?.avgCommissionRate || 0).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Commission Paid</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(earningsSummary?.totalCommission || 0)}
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Commission Structure</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Commission rates vary by membership tier</p>
                    <p>• Lower rates available with higher tier memberships</p>
                    <p>• Custom rates may apply for high-volume suppliers</p>
                    <p>• Commission is deducted from each completed order</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}