import React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Shield,
  AlertTriangle,
  Clock,
  UserCheck,
  FileText,
  Activity,
  Settings,
  MessageSquare,
  BarChart3,
  Upload,
  Download,
  Plus,
  Search,
  Filter,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  url: string;
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'yellow';
  priority: 'high' | 'medium' | 'low';
  roles: string[];
  category: 'management' | 'monitoring' | 'financial' | 'system';
}

interface EnhancedQuickActionsProps {
  pendingCounts: {
    suppliers: number;
    products: number;
    verifications: number;
    disputes: number;
    payouts: number;
    orders?: number;
    inquiries?: number;
  };
  onActionClick?: (actionId: string) => void;
  className?: string;
}

const colorClasses = {
  blue: "border-blue-200 hover:border-blue-300 hover:bg-blue-50",
  green: "border-green-200 hover:border-green-300 hover:bg-green-50",
  orange: "border-orange-200 hover:border-orange-300 hover:bg-orange-50",
  red: "border-red-200 hover:border-red-300 hover:bg-red-50",
  purple: "border-purple-200 hover:border-purple-300 hover:bg-purple-50",
  yellow: "border-yellow-200 hover:border-yellow-300 hover:bg-yellow-50",
};

const iconColorClasses = {
  blue: "text-blue-600",
  green: "text-green-600",
  orange: "text-orange-600",
  red: "text-red-600",
  purple: "text-purple-600",
  yellow: "text-yellow-600",
};

export function EnhancedQuickActions({ 
  pendingCounts, 
  onActionClick, 
  className 
}: EnhancedQuickActionsProps) {
  const { hasRole, hasPermission } = useAuth();

  const quickActions: QuickAction[] = [
    // High Priority Actions
    {
      id: 'supplier-approvals',
      title: 'Supplier Approvals',
      description: 'Review pending supplier applications',
      icon: Users,
      url: '/admin/suppliers/pending',
      badge: pendingCounts.suppliers > 0 ? {
        text: pendingCounts.suppliers.toString(),
        variant: 'destructive'
      } : undefined,
      color: 'orange',
      priority: 'high',
      roles: ['admin', 'manager'],
      category: 'management'
    },
    {
      id: 'document-verification',
      title: 'Document Verification',
      description: 'Verify supplier documents and credentials',
      icon: Shield,
      url: '/admin/verification',
      badge: pendingCounts.verifications > 0 ? {
        text: pendingCounts.verifications.toString(),
        variant: 'outline'
      } : undefined,
      color: 'blue',
      priority: 'high',
      roles: ['admin', 'manager'],
      category: 'management'
    },
    {
      id: 'dispute-resolution',
      title: 'Dispute Resolution',
      description: 'Resolve active disputes and conflicts',
      icon: AlertTriangle,
      url: '/admin/disputes',
      badge: pendingCounts.disputes > 0 ? {
        text: pendingCounts.disputes.toString(),
        variant: 'destructive'
      } : undefined,
      color: 'red',
      priority: 'high',
      roles: ['admin'],
      category: 'management'
    },
    {
      id: 'payout-processing',
      title: 'Payout Processing',
      description: 'Process supplier payments and commissions',
      icon: DollarSign,
      url: '/admin/payouts',
      badge: pendingCounts.payouts > 0 ? {
        text: pendingCounts.payouts.toString(),
        variant: 'secondary'
      } : undefined,
      color: 'green',
      priority: 'high',
      roles: ['admin', 'financial_manager'],
      category: 'financial'
    },

    // Medium Priority Actions
    {
      id: 'product-management',
      title: 'Product Management',
      description: 'Manage product catalog and approvals',
      icon: Package,
      url: '/admin/products',
      badge: pendingCounts.products > 0 ? {
        text: `${pendingCounts.products} pending`,
        variant: 'outline'
      } : undefined,
      color: 'purple',
      priority: 'medium',
      roles: ['admin', 'manager', 'operator'],
      category: 'management'
    },
    {
      id: 'order-monitoring',
      title: 'Order Monitoring',
      description: 'Monitor orders and transactions',
      icon: ShoppingCart,
      url: '/admin/orders',
      badge: pendingCounts.orders ? {
        text: `${pendingCounts.orders} active`,
        variant: 'secondary'
      } : undefined,
      color: 'blue',
      priority: 'medium',
      roles: ['admin', 'manager', 'operator'],
      category: 'monitoring'
    },
    {
      id: 'system-monitoring',
      title: 'System Monitoring',
      description: 'Monitor platform health and performance',
      icon: Activity,
      url: '/admin/monitoring',
      color: 'green',
      priority: 'medium',
      roles: ['admin', 'manager'],
      category: 'system'
    },
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Manage platform users and permissions',
      icon: UserCheck,
      url: '/admin/users',
      color: 'blue',
      priority: 'medium',
      roles: ['admin'],
      category: 'management'
    },

    // Low Priority Actions
    {
      id: 'analytics-reports',
      title: 'Analytics & Reports',
      description: 'View platform analytics and generate reports',
      icon: BarChart3,
      url: '/admin/analytics',
      color: 'purple',
      priority: 'low',
      roles: ['admin', 'manager'],
      category: 'monitoring'
    },
    {
      id: 'communication-center',
      title: 'Communication Center',
      description: 'Manage platform communications',
      icon: MessageSquare,
      url: '/admin/communication',
      badge: pendingCounts.inquiries ? {
        text: `${pendingCounts.inquiries} inquiries`,
        variant: 'outline'
      } : undefined,
      color: 'blue',
      priority: 'low',
      roles: ['admin', 'manager'],
      category: 'management'
    },
    {
      id: 'bulk-operations',
      title: 'Bulk Operations',
      description: 'Perform bulk uploads and operations',
      icon: Upload,
      url: '/admin/bulk-upload',
      color: 'yellow',
      priority: 'low',
      roles: ['admin', 'manager'],
      category: 'system'
    },
    {
      id: 'platform-settings',
      title: 'Platform Settings',
      description: 'Configure platform settings and preferences',
      icon: Settings,
      url: '/admin/settings',
      color: 'purple',
      priority: 'low',
      roles: ['admin'],
      category: 'system'
    }
  ];

  // Filter actions based on user role and permissions
  const filteredActions = quickActions.filter(action => {
    return action.roles.some(role => hasRole([role]));
  });

  // Sort by priority and then by pending counts
  const sortedActions = filteredActions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority];
    const bPriority = priorityOrder[b.priority];
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    // If same priority, sort by badge presence (pending items)
    const aHasBadge = !!a.badge;
    const bHasBadge = !!b.badge;
    
    if (aHasBadge && !bHasBadge) return -1;
    if (!aHasBadge && bHasBadge) return 1;
    
    return 0;
  });

  const handleActionClick = (action: QuickAction) => {
    onActionClick?.(action.id);
  };

  const renderAction = (action: QuickAction) => {
    const IconComponent = action.icon;
    
    return (
      <Card 
        key={action.id}
        className={cn(
          "transition-all duration-200 hover:shadow-md cursor-pointer group",
          colorClasses[action.color]
        )}
        onClick={() => handleActionClick(action)}
      >
        <CardContent className="p-4">
          <Link href={action.url}>
            <div className="flex items-center justify-between mb-3">
              <div className={cn(
                "p-2 rounded-lg transition-colors",
                action.color === 'blue' ? "bg-blue-100 group-hover:bg-blue-200" :
                action.color === 'green' ? "bg-green-100 group-hover:bg-green-200" :
                action.color === 'orange' ? "bg-orange-100 group-hover:bg-orange-200" :
                action.color === 'red' ? "bg-red-100 group-hover:bg-red-200" :
                action.color === 'purple' ? "bg-purple-100 group-hover:bg-purple-200" :
                "bg-yellow-100 group-hover:bg-yellow-200"
              )}>
                <IconComponent className={cn("h-5 w-5", iconColorClasses[action.color])} />
              </div>
              
              {action.badge && (
                <Badge variant={action.badge.variant} className="text-xs">
                  {action.badge.text}
                </Badge>
              )}
            </div>
            
            <div>
              <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                {action.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {action.description}
              </p>
            </div>
            
            {action.priority === 'high' && action.badge && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Button size="sm" variant="outline" className="w-full text-xs">
                  Take Action
                </Button>
              </div>
            )}
          </Link>
        </CardContent>
      </Card>
    );
  };

  // Group actions by category for better organization
  const actionsByCategory = sortedActions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = [];
    }
    acc[action.category].push(action);
    return acc;
  }, {} as Record<string, QuickAction[]>);

  const categoryTitles = {
    management: 'Management',
    monitoring: 'Monitoring',
    financial: 'Financial',
    system: 'System'
  };

  const categoryIcons = {
    management: Users,
    monitoring: Activity,
    financial: DollarSign,
    system: Settings
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {Object.entries(actionsByCategory).map(([category, actions]) => {
        const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons];
        
        return (
          <div key={category}>
            <div className="flex items-center space-x-2 mb-3">
              <CategoryIcon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">
                {categoryTitles[category as keyof typeof categoryTitles]}
              </h3>
              <div className="flex-1 h-px bg-border"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {actions.map(renderAction)}
            </div>
          </div>
        );
      })}

      {sortedActions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No quick actions available for your role</p>
        </div>
      )}
    </div>
  );
}