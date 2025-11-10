import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Package, Users } from "lucide-react";
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
  const { data: analyticsData } = useQuery({
    queryKey: ["/api/commissions/admin/commissions/analytics"],
  });

  const analytics: CommissionAnalytics | undefined = analyticsData?.analytics;

  // Fetch commissions list
  const { data: commissionsData, isLoading } = useQuery({
    queryKey: ["/api/commissions/admin/commissions", { status: statusFilter !== "all" ? statusFilter : undefined }],
  });

  const commissions: Commission[] = commissionsData?.commissions || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      paid: "default",
      disputed: "destructive",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

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
                <div className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  From {analytics.totalOrders} orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analytics.pendingRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting completion
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Revenue</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analytics.recentRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days ({analytics.recentOrders} orders)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Suppliers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.topSuppliers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active revenue generators
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Suppliers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Revenue Suppliers</CardTitle>
              <CardDescription>Suppliers generating the most commission revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topSuppliers.map((supplier, index) => (
                  <div
                    key={supplier.supplierId}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{supplier.supplierName}</p>
                        <p className="text-sm text-muted-foreground">{supplier.storeName}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-lg">
                        ${supplier.totalCommission.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {supplier.totalOrders} orders | Avg: ${supplier.averageCommission.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                          {commission.supplierName} ({commission.storeName})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(commission.createdAt), "PPP")}
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="font-bold text-lg text-green-600">
                          +${parseFloat(commission.commissionAmount).toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Order: ${parseFloat(commission.orderAmount).toFixed(2)} | 
                          Rate: {(parseFloat(commission.commissionRate) * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Supplier: ${parseFloat(commission.supplierAmount).toFixed(2)}
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
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Commission status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="font-medium text-green-900">Paid Revenue</p>
                  <p className="text-sm text-green-700">Completed transactions</p>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  ${analytics.paidRevenue.toFixed(2)}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div>
                  <p className="font-medium text-yellow-900">Pending Revenue</p>
                  <p className="text-sm text-yellow-700">Awaiting order completion</p>
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  ${analytics.pendingRevenue.toFixed(2)}
                </div>
              </div>

              {analytics.disputedRevenue > 0 && (
                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div>
                    <p className="font-medium text-red-900">Disputed Revenue</p>
                    <p className="text-sm text-red-700">Requires attention</p>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    ${analytics.disputedRevenue.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
