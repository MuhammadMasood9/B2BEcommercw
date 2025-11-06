import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign,
  Users,
  Package,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  Clock,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KPIData {
  title: string;
  value: number | string;
  change?: number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<any>;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
  format?: 'currency' | 'number' | 'percentage' | 'rating';
  drillDownUrl?: string;
}

interface KPICardsProps {
  kpis: {
    totalRevenue: number;
    totalCommission: number;
    activeSuppliers: number;
    totalSuppliers: number;
    pendingApprovals: number;
    totalProducts: number;
    approvedProducts: number;
    totalOrders: number;
    averageSupplierRating: number;
    averageResponseRate: number;
    // Additional KPIs for enhanced admin dashboard
    pendingVerifications?: number;
    activeDisputes?: number;
    pendingPayouts?: number;
    totalBuyers?: number;
    activeBuyers?: number;
    monthlyGrowthRate?: number;
    systemUptime?: number;
  };
  comparisons?: {
    revenue: { changePercent: number };
    suppliers: { changePercent: number };
    products: { changePercent: number };
    orders: { changePercent: number };
  };
  onDrillDown?: (url: string) => void;
}

const colorClasses = {
  blue: "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg",
  green: "bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg",
  purple: "bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg",
  orange: "bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg",
  red: "bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg",
  yellow: "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0 shadow-lg",
};

const iconColorClasses = {
  blue: "text-blue-200",
  green: "text-green-200",
  purple: "text-purple-200",
  orange: "text-orange-200",
  red: "text-red-200",
  yellow: "text-yellow-200",
};

const textColorClasses = {
  blue: "text-blue-100",
  green: "text-green-100",
  purple: "text-purple-100",
  orange: "text-orange-100",
  red: "text-red-100",
  yellow: "text-yellow-100",
};

export default function KPICards({ kpis, comparisons, onDrillDown }: KPICardsProps) {
  const formatValue = (value: number | string, format?: string): string => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'rating':
        return `${value.toFixed(1)}`;
      case 'number':
      default:
        return value.toLocaleString();
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-3 w-3" />;
      case 'down':
        return <ArrowDownRight className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getTrendColor = (changePercent?: number) => {
    if (!changePercent) return 'text-gray-300';
    return changePercent > 0 ? 'text-green-300' : 'text-red-300';
  };

  const kpiData: KPIData[] = [
    {
      title: "Total Revenue",
      value: kpis.totalRevenue,
      change: comparisons?.revenue?.changePercent,
      changePercent: comparisons?.revenue?.changePercent,
      trend: comparisons?.revenue?.changePercent ? (comparisons.revenue.changePercent > 0 ? 'up' : 'down') : 'neutral',
      icon: DollarSign,
      color: 'green',
      format: 'currency',
      drillDownUrl: '/admin/financial/revenue'
    },
    {
      title: "Active Suppliers",
      value: kpis.activeSuppliers,
      change: comparisons?.suppliers?.changePercent,
      changePercent: comparisons?.suppliers?.changePercent,
      trend: comparisons?.suppliers?.changePercent ? (comparisons.suppliers.changePercent > 0 ? 'up' : 'down') : 'neutral',
      icon: Users,
      color: 'blue',
      format: 'number',
      drillDownUrl: '/admin/suppliers'
    },
    {
      title: "Total Products",
      value: kpis.totalProducts,
      change: comparisons?.products?.changePercent,
      changePercent: comparisons?.products?.changePercent,
      trend: comparisons?.products?.changePercent ? (comparisons.products.changePercent > 0 ? 'up' : 'down') : 'neutral',
      icon: Package,
      color: 'purple',
      format: 'number',
      drillDownUrl: '/admin/products'
    },
    {
      title: "Total Orders",
      value: kpis.totalOrders,
      change: comparisons?.orders?.changePercent,
      changePercent: comparisons?.orders?.changePercent,
      trend: comparisons?.orders?.changePercent ? (comparisons.orders.changePercent > 0 ? 'up' : 'down') : 'neutral',
      icon: ShoppingCart,
      color: 'orange',
      format: 'number',
      drillDownUrl: '/admin/orders'
    },
    {
      title: "Pending Approvals",
      value: kpis.pendingApprovals,
      icon: Clock,
      color: 'yellow',
      format: 'number',
      drillDownUrl: '/admin/suppliers/pending'
    },
    {
      title: "Commission Revenue",
      value: kpis.totalCommission,
      icon: DollarSign,
      color: 'green',
      format: 'currency',
      drillDownUrl: '/admin/financial/commission'
    },
    {
      title: "Approved Products",
      value: kpis.approvedProducts,
      icon: CheckCircle,
      color: 'green',
      format: 'number',
      drillDownUrl: '/admin/products?status=approved'
    },
    {
      title: "Avg Supplier Rating",
      value: kpis.averageSupplierRating,
      icon: Star,
      color: 'purple',
      format: 'rating',
      drillDownUrl: '/admin/suppliers?sortBy=rating'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiData.map((kpi, index) => {
        const IconComponent = kpi.icon;
        
        return (
          <Card 
            key={index} 
            className={cn(
              colorClasses[kpi.color],
              "hover:shadow-xl transition-shadow duration-200 cursor-pointer group"
            )}
            onClick={() => kpi.drillDownUrl && onDrillDown?.(kpi.drillDownUrl)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn("text-sm font-medium", textColorClasses[kpi.color])}>
                {kpi.title}
              </CardTitle>
              <IconComponent className={cn("h-6 w-6", iconColorClasses[kpi.color])} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-2">
                {formatValue(kpi.value, kpi.format)}
              </div>
              
              {kpi.changePercent !== undefined && (
                <div className="flex items-center gap-1">
                  <span className={cn("text-sm flex items-center gap-1", getTrendColor(kpi.changePercent))}>
                    {getTrendIcon(kpi.trend)}
                    {kpi.changePercent > 0 ? '+' : ''}{kpi.changePercent.toFixed(1)}%
                  </span>
                  <span className={cn("text-sm", textColorClasses[kpi.color])}>
                    from last period
                  </span>
                </div>
              )}
              
              {kpi.drillDownUrl && (
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDrillDown?.(kpi.drillDownUrl!);
                    }}
                  >
                    View Details
                    <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}