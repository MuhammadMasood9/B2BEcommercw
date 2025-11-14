import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Package, Users, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Commission {
  id: string;
  orderId: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  storeName: string;
  orderAmount: string;
  commissionRate: string;
  commissionAmount: string;
  supplierAmount: string;
  status: string;
  createdAt: string;
  orderStatus: string;
}

interface CommissionAnalytics {
  totalRevenue: number;
  totalOrders: number;
  pendingRevenue: number;
  paidRevenue: number;
  disputedRevenue: number;
  recentRevenue: number;
  recentOrders: number;
  topSuppliers: Array<{
    supplierId: string;
    supplierName: string;
    storeName: string;
    totalCommission: number;
    totalOrders: number;
    averageCommission: number;
  }>;
}

export default function AdminCommissions() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch commission analytics
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/commissions/admin/commissions/analytics"],
    queryFn: async () => {
      const response = await fetch("/api/commissions/admin/commissions/analytics", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch commission analytics");
      return response.json();
    },
  });

  const analytics: CommissionAnalytics | undefined = analyticsData?.analytics;

  // Fetch commissions list
  const { data: commissionsData, isLoading } = useQuery({
    queryKey: ["/api/commissions/admin/commissions", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      const url = `/api/commissions/admin/commissions${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch commissions");
      return response.json();
    },
  });

  const commissions: Commission[] = commissionsData?.commissions || [];

  // Fetch overdue commissions
  const { data: overdueData } = useQuery({
    queryKey: ["/api/commissions/admin/commissions", "overdue"],
    queryFn: async () => {
      const response = await fetch("/api/commissions/admin/commissions?status=overdue", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch overdue commissions");
      return response.json();
    },
  });

  const overdueCommissions: Commission[] = overdueData?.commissions || [];

  // Calculate unpaid count from commissions
  const unpaidCount = commissions.filter(c => c.status === 'unpaid' || c.status === 'payment_submitted').length;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      unpaid: "secondary",
      payment_submitted: "outline",
      paid: "default",
      overdue: "destructive",
      disputed: "destructive",
    };

    const labels: Record<string, string> = {
      unpaid: "Unpaid",
      payment_submitted: "Payment Submitted",
      paid: "Paid",
      overdue: "Overdue",
      disputed: "Disputed",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (analyticsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Commission Analytics</h1>
        <p className="text-muted-foreground">Platform revenue and commission tracking</p>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{analytics.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  From {analytics.totalOrders} orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">₹{analytics.paidRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Completed transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
                <Package className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">₹{analytics.pendingRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {unpaidCount} unpaid commission{unpaidCount !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Revenue</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{analytics.recentRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days ({analytics.recentOrders} orders)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Overdue Commissions Alert */}
          {overdueCommissions.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-900">Overdue Commissions</CardTitle>
                </div>
                <CardDescription className="text-red-700">
                  {overdueCommissions.length} commission{overdueCommissions.length !== 1 ? 's' : ''} past due date
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overdueCommissions.slice(0, 5).map((commission) => (
                    <div
                      key={commission.id}
                      className="flex items-center justify-between p-3 bg-white border border-red-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">Order #{commission.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {commission.supplierName} ({commission.storeName})
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">
                          ₹{parseFloat(commission.commissionAmount).toFixed(2)}
                        </div>
                        <Badge variant="destructive" className="text-xs">Overdue</Badge>
                      </div>
                    </div>
                  ))}
                  {overdueCommissions.length > 5 && (
                    <p className="text-sm text-center text-muted-foreground">
                      And {overdueCommissions.length - 5} more overdue commission{overdueCommissions.length - 5 !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Suppliers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Revenue Suppliers</CardTitle>
              <CardDescription>Suppliers generating the most commission revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topSuppliers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No supplier data available yet
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics.topSuppliers.map((supplier, index) => (
                    <div
                      key={supplier.supplierId}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{supplier.supplierName}</p>
                          <p className="text-sm text-muted-foreground">{supplier.storeName}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-lg text-green-600">
                          ₹{supplier.totalCommission.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {supplier.totalOrders} orders | Avg: ₹{supplier.averageCommission.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Commission Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Transactions</CardTitle>
          <CardDescription>All commission records across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
              <TabsTrigger value="payment_submitted">Payment Submitted</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
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
                          {commission.supplierName} ({commission.storeName})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(commission.createdAt), "PPP")}
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="font-bold text-lg text-green-600">
                          +₹{parseFloat(commission.commissionAmount).toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Order: ₹{parseFloat(commission.orderAmount).toFixed(2)} | 
                          Rate: {(parseFloat(commission.commissionRate) * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Supplier: ₹{parseFloat(commission.supplierAmount).toFixed(2)}
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

      {/* Revenue Breakdown */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Paid Revenue</CardTitle>
              <CardDescription>Completed transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ₹{analytics.paidRevenue.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {analytics.totalOrders > 0 
                  ? `${((analytics.paidRevenue / analytics.totalRevenue) * 100).toFixed(1)}% of total`
                  : 'No orders yet'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Revenue</CardTitle>
              <CardDescription>Awaiting order completion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                ₹{analytics.pendingRevenue.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {unpaidCount} unpaid commission{unpaidCount !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          {analytics.disputedRevenue > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Disputed Revenue</CardTitle>
                <CardDescription>Requires attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  ₹{analytics.disputedRevenue.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Needs resolution
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
