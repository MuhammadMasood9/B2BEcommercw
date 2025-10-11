import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Users, Building2, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { data: analytics, isLoading } = useQuery<{
    totalProducts: number;
    totalOrders: number;
    totalCustomers: number;
    totalSuppliers: number;
    totalRevenue: number;
    recentOrders: any[];
  }>({
    queryKey: ["/api/analytics"],
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Products",
      value: analytics?.totalProducts || 0,
      icon: Package,
    },
    {
      title: "Total Orders",
      value: analytics?.totalOrders || 0,
      icon: ShoppingCart,
    },
    {
      title: "Total Customers",
      value: analytics?.totalCustomers || 0,
      icon: Users,
    },
    {
      title: "Total Suppliers",
      value: analytics?.totalSuppliers || 0,
      icon: Building2,
    },
    {
      title: "Total Revenue",
      value: `$${analytics?.totalRevenue?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'default';
      case 'processing': return 'secondary';
      case 'shipped': return 'outline';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8" data-testid="text-dashboard-title">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title} data-testid={`card-stat-${stat.title.toLowerCase().replace(' ', '-')}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`text-stat-${stat.title.toLowerCase().replace(' ', '-')}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {analytics?.recentOrders && analytics.recentOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.recentOrders.map((order: any) => (
                  <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                    <TableCell className="font-medium" data-testid={`text-order-number-${order.id}`}>
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(order.status)} data-testid={`badge-status-${order.id}`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-amount-${order.id}`}>
                      ${parseFloat(order.totalAmount).toFixed(2)}
                    </TableCell>
                    <TableCell data-testid={`text-date-${order.id}`}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
