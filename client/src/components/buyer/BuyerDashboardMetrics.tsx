import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  FileText,
  MessageSquare,
  ShoppingCart,
  DollarSign,
  Heart,
  Clock,
  CheckCircle,
  Eye,
  Users,
  Package,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Search,
  Bookmark
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BuyerMetric {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<any>;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
  format?: 'currency' | 'number' | 'percentage';
  description?: string;
  actionUrl?: string;
  priority: 'high' | 'medium' | 'low';
}

interface BuyerDashboardMetricsProps {
  metrics: {
    activeRfqs: number;
    pendingInquiries: number;
    unreadMessages: number;
    favoriteProducts: number;
    totalQuotations: number;
    totalOrders: number;
    totalSpent: number;
    savedSearches: number;
    activeConversations: number;
    completedOrders: number;
    averageResponseTime: number;
    supplierConnections: number;
  };
  comparisons?: {
    rfqs: { changePercent: number };
    inquiries: { changePercent: number };
    orders: { changePercent: number };
    spending: { changePercent: number };
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

export function BuyerDashboardMetrics({ 
  metrics, 
  comparisons, 
  onMetricClick, 
  className 
}: BuyerDashboardMetricsProps) {
  
  const formatValue = (value: number | string, format?: string): string => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
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

  const buyerMetrics: BuyerMetric[] = [
    {
      id: 'active-rfqs',
      title: 'Active RFQs',
      value: metrics.activeRfqs,
      change: comparisons?.rfqs?.changePercent,
      changePercent: comparisons?.rfqs?.changePercent,
      trend: comparisons?.rfqs?.changePercent ? 
        (comparisons.rfqs.changePercent > 0 ? 'up' : 'down') : 'neutral',
      icon: FileText,
      color: 'blue',
      format: 'number',
      description: 'Request for quotations in progress',
      actionUrl: '/buyer/rfqs',
      priority: 'high'
    },
    {
      id: 'pending-inquiries',
      title: 'Pending Inquiries',
      value: metrics.pendingInquiries,
      change: comparisons?.inquiries?.changePercent,
      changePercent: comparisons?.inquiries?.changePercent,
      trend: comparisons?.inquiries?.changePercent ? 
        (comparisons.inquiries.changePercent > 0 ? 'up' : 'down') : 'neutral',
      icon: MessageSquare,
      color: 'orange',
      format: 'number',
      description: 'Inquiries awaiting supplier response',
      actionUrl: '/buyer/inquiries',
      priority: 'high'
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
      color: 'green',
      format: 'number',
      description: 'Orders placed this month',
      actionUrl: '/buyer/orders',
      priority: 'high'
    },
    {
      id: 'total-spent',
      title: 'Total Spent',
      value: metrics.totalSpent,
      change: comparisons?.spending?.changePercent,
      changePercent: comparisons?.spending?.changePercent,
      trend: comparisons?.spending?.changePercent ? 
        (comparisons.spending.changePercent > 0 ? 'up' : 'down') : 'neutral',
      icon: DollarSign,
      color: 'purple',
      format: 'currency',
      description: 'Total spending this month',
      actionUrl: '/buyer/orders',
      priority: 'high'
    },
    {
      id: 'unread-messages',
      title: 'Unread Messages',
      value: metrics.unreadMessages,
      icon: MessageSquare,
      color: 'red',
      format: 'number',
      description: 'Messages requiring attention',
      actionUrl: '/messages',
      priority: 'medium'
    },
    {
      id: 'total-quotations',
      title: 'Total Quotations',
      value: metrics.totalQuotations,
      icon: FileText,
      color: 'blue',
      format: 'number',
      description: 'Quotations received from suppliers',
      actionUrl: '/buyer/quotations',
      priority: 'medium'
    },
    {
      id: 'favorite-products',
      title: 'Favorite Products',
      value: metrics.favoriteProducts,
      icon: Heart,
      color: 'red',
      format: 'number',
      description: 'Products saved to favorites',
      actionUrl: '/favorites',
      priority: 'low'
    },
    {
      id: 'saved-searches',
      title: 'Saved Searches',
      value: metrics.savedSearches,
      icon: Bookmark,
      color: 'yellow',
      format: 'number',
      description: 'Product searches saved for later',
      actionUrl: '/buyer/saved-searches',
      priority: 'low'
    }
  ];

  const handleMetricClick = (metric: BuyerMetric) => {
    onMetricClick?.(metric.id);
    if (metric.actionUrl) {
      window.location.href = metric.actionUrl;
    }
  };

  // Sort metrics by priority
  const sortedMetrics = buyerMetrics.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return (
    <div className={cn("space-y-6", className)}>
      {/* Primary Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Sourcing Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedMetrics.slice(0, 4).map((metric) => {
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
          {sortedMetrics.slice(4).map((metric) => {
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
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Supplier Connections</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {metrics.supplierConnections}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Explore
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Active Conversations</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {metrics.activeConversations}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}