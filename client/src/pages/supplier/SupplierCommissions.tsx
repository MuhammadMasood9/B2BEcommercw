import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Commission {
  id: string;
  orderId: string;
  orderNumber: string;
  orderAmount: string;
  commissionRate: string;
  commissionAmount: string;
  supplierAmount: string;
  status: string;
  createdAt: string;
  orderStatus: string;
}

interface CommissionSummary {
  commissionRate: number;
  totalEarnings: number;
  totalCommissions: number;
  totalOrders: number;
  pendingAmount: number;
  paidAmount: number;
  disputedAmount: number;
  recentEarnings: number;
  recentOrders: number;
}

export default function SupplierCommissions() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch commission summary
  const { data: summaryData } = useQuery({
    queryKey: ["/api/commissions/supplier/commissions/summary"],
    queryFn: async () => {
      const response = await fetch("/api/commissions/supplier/commissions/summary", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch commission summary");
      return response.json();
    },
  });

  const summary: CommissionSummary | undefined = summaryData?.summary;

  // Fetch commissions list
  const { data: commissionsData, isLoading } = useQuery({
    queryKey: ["/api/commissions/supplier/commissions", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      const url = `/api/commissions/supplier/commissions${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch commissions");
      return response.json();
    },
  });

  const commissions: Commission[] = commissionsData?.commissions || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
      pending: { variant: "secondary", icon: Clock },
      paid: { variant: "default", icon: CheckCircle },
      disputed: { variant: "destructive", icon: AlertCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Commission & Earnings</h1>
        <p className="text-muted-foreground">Track your earnings and commission details</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.totalEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                From {summary.totalOrders} orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Commission</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.commissionRate}%</div>
              <p className="text-xs text-muted-foreground">
                ${summary.totalCommissions.toFixed(2)} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.pendingAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting payout
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Earnings</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.recentEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days ({summary.recentOrders} orders)
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Commission Details */}
      <Card>
        <CardHeader>
          <CardTitle>Commission History</CardTitle>
          <CardDescription>View all your commission transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="disputed">Disputed</TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter} className="space-y-4 mt-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : commissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No commissions found
                </div>
              ) : (
                <div className="space-y-4">
                  {commissions.map((commission) => (
                    <div
                      key={commission.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">Order #{commission.orderNumber}</p>
                          {getStatusBadge(commission.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(commission.createdAt), "PPP")}
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="font-bold text-lg">
                          ${parseFloat(commission.supplierAmount).toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Order: ${parseFloat(commission.orderAmount).toFixed(2)} | 
                          Commission: ${parseFloat(commission.commissionAmount).toFixed(2)} 
                          ({(parseFloat(commission.commissionRate) * 100).toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Commission Breakdown Info */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Understanding Your Earnings</CardTitle>
            <CardDescription>How commission is calculated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">Your Commission Rate</h4>
                <p className="text-sm text-muted-foreground">
                  The platform charges a {summary.commissionRate}% commission on each order. 
                  This helps us maintain and improve the marketplace.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Payment Process</h4>
                <p className="text-sm text-muted-foreground">
                  Commission is automatically calculated when an order is created. 
                  You can request payouts from the Payouts page once orders are completed.
                </p>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Example Calculation</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Order Amount:</span>
                  <span className="font-medium">$1,000.00</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Platform Commission ({summary.commissionRate}%):</span>
                  <span>-${(1000 * (summary.commissionRate / 100)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Your Earnings:</span>
                  <span className="text-green-600">
                    ${(1000 - (1000 * (summary.commissionRate / 100))).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
