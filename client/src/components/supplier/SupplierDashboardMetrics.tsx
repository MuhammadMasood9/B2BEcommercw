import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  MessageSquare,
  Package,
  ShoppingCart,
  DollarSign,
  Star,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SupplierMetric {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<any>;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
  format?: 'currency' | 'number' | 'percentage' | 'rating';
  description?: string;
  actionUrl?: string;
}

interface SupplierDashboardMetricsProps {
  metrics: {
    productViews: number;
    inquiriesReceived: number;
    responseRate: number;
    activeProducts: number;
    totalOrders: number;
    monthlyRevenue: number;
    averageRating: number;
    profileViews: number;
    quotationsSent: number;
    conversionRate: number;
    pendingOrders: number;
    completedOrders: number;
  };
  comparisons?: {
    productViews: { changePercent: number };
    inquiries: { changePercent: number };
    revenue: { changePercent: number };
    orders: { changePercent: number };
  };
  onMetricClick?: (metricId: string) => void;
  className?: string;
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

export function SupplierDashboardMetrics({ 
  metrics, 
  comparisons, 
  onMetricClick, 
  className 
}: SupplierDashboardMetricsProps) {
  
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

  const supplierMetrics: SupplierMetric[] = [
    {
      id: 'product-views',
      title: 'Product Views',
      value: metrics.productViews,
      change: comparisons?.productViews?.changePercent,
      changePercent: comparisons?.productViews?.changePercent,
      trend: comparisons?.productViews?.changePercent ? 
        (comparisons.productViews.changePercent > 0 ? 'up' : 'down') : 'neutral',
      icon: Eye,
      color: 'blue',
      format: 'number',
      description: 'Total views across all products',
      actionUrl: '/supplier/analytics/products'
    },
    {
      id: 'inquiries-received',
      title: 'Inquiries Received',
      value: metrics.inquiriesReceived,
      change: comparisons?.inquiries?.changePercent,
      changePercent: comparisons?.inquiries?.changePercent,
      trend: comparisons?.inquiries?.changePercent ? 
        (comparisons.inquiries.changePercent > 0 ? 'up' : 'down') : 'neutral',
      icon: MessageSquare,
      color: 'green',
      format: 'number',
      description: 'Customer inquiries this month',
      actionUrl: '/supplier/inquiries'
    },
    {
      id: 'monthly-revenue',
      title: 'Monthly Revenue',
      value: metrics.monthlyRevenue,
      change: comparisons?.revenue?.changePercent,
      changePercent: comparisons?.revenue?.changePercent,
      trend: comparisons?.revenue?.changePercent ? 
        (comparisons.revenue.changePercent > 0 ? 'up' : 'down') : 'neutral',
      icon: DollarSign,
      color: 'green',
      format: 'currency',
      description: 'Revenue generated this month',
      actionUrl: '/supplier/earnings'
    },
    {
      id: 'total-orders',
      title: 'Total Orders',
      value: metrics.totalOrders,
      change: comparisons?.orders?.changePercent,
      changePercent: comparisons?.orders?.changePercent,
      trend: comparisons?.orders?.changePercent ? 
        (comparisons.orders.changePercent > 0 ? 'up' : 'down') : 'neutral',
      icon: ShoppingCart,
      color: 'orange',
      format: 'number',
      description: 'Orders received this month',
      actionUrl: '/supplier/orders'
    },
    {
      id: 'response-rate',
      title: 'Response Rate',
      value: metrics.responseRate,
      icon: TrendingUp,
      color: 'purple',
      format: 'percentage',
      description: 'Average inquiry response rate',
      actionUrl: '/supplier/inquiries/analytics'
    },
    {
      id: 'average-rating',
      title: 'Average Rating',
      value: metrics.averageRating,
      icon: Star,
      color: 'yellow',
      format: 'rating',
      description: 'Customer satisfaction rating',
      actionUrl: '/supplier/reviews'
    },
    {
      id: 'active-products',
      title: 'Active Products',
      value: metrics.activeProducts,
      icon: Package,
      color: 'purple',
      format: 'number',
      description: 'Currently active product listings',
      actionUrl: '/supplier/products'
    },
    {
      id: 'conversion-rate',
      title: 'Conversion Rate',
      value: metrics.conversionRate,
      icon: TrendingUp,
      color: 'blue',
      format: 'percentage',
      description: 'Inquiry to order conversion rate',
      actionUrl: '/supplier/analytics/conversion'
    }
  ];

  const handleMetricClick = (metric: SupplierMetric) => {
    onMetricClick?.(metric.id);
    if (metric.actionUrl) {
      window.location.href = metric.actionUrl;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Primary Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Store Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {supplierMetrics.slice(0, 4).map((metric) => {
            const IconComponent = metric.icon;
            
            return (
              <Card 
                key={metric.id}
                className={cn(
                  colorClasses[metric.color],
                  "hover:shadow-xl transition-shadow duration-200 cursor-pointer group"
                )}
                onClick={() => handleMetricClick(metric)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className={cn("text-sm font-medium", textColorClasses[metric.color])}>
                    {metric.title}
                  </CardTitle>
                  <IconComponent className={cn("h-6 w-6", iconColorClasses[metric.color])} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white mb-2">
                    {formatValue(metric.value, metric.format)}
                  </div>
                  
                  {metric.changePercent !== undefined && (
                    <div className="flex items-center gap-1 mb-2">
                      <span className={cn("text-sm flex items-center gap-1", getTrendColor(metric.changePercent))}>
                        {getTrendIcon(metric.trend)}
                        {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                      </span>
                      <span className={cn("text-sm", textColorClasses[metric.color])}>
                        from last month
                      </span>
                    </div>
                  )}
                  
                  {metric.description && (
                    <p className={cn("text-xs", textColorClasses[metric.color])}>
                      {metric.description}
                    </p>
                  )}
                  
                  <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMetricClick(metric);
                      }}
                    >
                      View Details
                      <ArrowUpRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Secondary Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Additional Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {supplierMetrics.slice(4).map((metric) => {
            const IconComponent = metric.icon;
            
            return (
              <Card 
                key={metric.id}
                className="hover:shadow-md transition-shadow duration-200 cursor-pointer group border-l-4 border-l-primary"
                onClick={() => handleMetricClick(metric)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IconComponent className="h-4 w-4 text-primary" />
                    </div>
                    {metric.changePercent !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-2xl font-bold mb-1">
                    {formatValue(metric.value, metric.format)}
                  </div>
                  
                  <p className="text-sm font-medium text-foreground mb-1">
                    {metric.title}
                  </p>
                  
                  {metric.description && (
                    <p className="text-xs text-muted-foreground">
                      {metric.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Status Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Quick Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Pending Orders</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {metrics.pendingOrders}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Process
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Completed Orders</p>
                    <p className="text-2xl font-bold text-green-600">
                      {metrics.completedOrders}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  View
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Quotations Sent</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {metrics.quotationsSent}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}