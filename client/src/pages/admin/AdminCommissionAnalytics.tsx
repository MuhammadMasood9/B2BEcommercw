import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Package, Users, AlertCircle } from "lucide-react";
import { format } from "date-fns";

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

export default function AdminCommissionAnalytics() {
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

  // Fetch unpaid commissions
  const { data: unpaidData } = useQuery({
    queryKey: ["/api/commissions/admin/commissions", "unpaid"],
    queryFn: async () => {
      const response = await fetch("/api/commissions/admin/commissions?status=unpaid", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch unpaid commissions");
      return response.json();
    },
  });

  const unpaidCommissions: Commission[] = unpaidData?.commissions || [];

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
                  Awaiting completion
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

          {/* Revenue Breakdown */}
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
                  {unpaidCommissions.length} unpaid commission{unpaidCommissions.length !== 1 ? 's' : ''}
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
    </div>
  );
}
