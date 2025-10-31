import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Package, 
  Shield, 
  BarChart3, 
  Settings, 
  Bell,
  Download,
  Upload,
  Search,
  Plus,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  MessageSquare,
  FileText
} from "lucide-react";
import { Link } from "wouter";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
  priority: 'high' | 'medium' | 'low';
}

interface QuickActionsProps {
  pendingCounts?: {
    suppliers: number;
    products: number;
    verifications: number;
    disputes: number;
    payouts: number;
  };
  onActionClick?: (actionId: string) => void;
}

const colorClasses = {
  blue: "border-blue-200 hover:border-blue-300 hover:bg-blue-50",
  green: "border-green-200 hover:border-green-300 hover:bg-green-50", 
  purple: "border-purple-200 hover:border-purple-300 hover:bg-purple-50",
  orange: "border-orange-200 hover:border-orange-300 hover:bg-orange-50",
  red: "border-red-200 hover:border-red-300 hover:bg-red-50",
  yellow: "border-yellow-200 hover:border-yellow-300 hover:bg-yellow-50",
};

const iconColorClasses = {
  blue: "text-blue-600",
  green: "text-green-600",
  purple: "text-purple-600", 
  orange: "text-orange-600",
  red: "text-red-600",
  yellow: "text-yellow-600",
};

export default function QuickActions({ pendingCounts, onActionClick }: QuickActionsProps) {
  const quickActions: QuickAction[] = [
    {
      id: 'review-suppliers',
      title: 'Review Suppliers',
      description: 'Approve pending supplier applications',
      icon: Users,
      href: '/admin/suppliers/pending',
      badge: pendingCounts?.suppliers ? {
        text: pendingCounts.suppliers.toString(),
        variant: pendingCounts.suppliers > 10 ? 'destructive' : 'default'
      } : undefined,
      color: 'blue',
      priority: 'high'
    },
    {
      id: 'verify-documents',
      title: 'Verify Documents',
      description: 'Review supplier verification documents',
      icon: Shield,
      href: '/admin/verification',
      badge: pendingCounts?.verifications ? {
        text: pendingCounts.verifications.toString(),
        variant: pendingCounts.verifications > 5 ? 'destructive' : 'default'
      } : undefined,
      color: 'green',
      priority: 'high'
    },
    {
      id: 'approve-products',
      title: 'Approve Products',
      description: 'Review and approve new products',
      icon: Package,
      href: '/admin/products/pending',
      badge: pendingCounts?.products ? {
        text: pendingCounts.products.toString(),
        variant: pendingCounts.products > 20 ? 'destructive' : 'default'
      } : undefined,
      color: 'purple',
      priority: 'high'
    },
    {
      id: 'process-payouts',
      title: 'Process Payouts',
      description: 'Review and process supplier payouts',
      icon: DollarSign,
      href: '/admin/financial/payouts',
      badge: pendingCounts?.payouts ? {
        text: pendingCounts.payouts.toString(),
        variant: 'default'
      } : undefined,
      color: 'green',
      priority: 'medium'
    },
    {
      id: 'resolve-disputes',
      title: 'Resolve Disputes',
      description: 'Handle buyer-supplier disputes',
      icon: AlertTriangle,
      href: '/admin/disputes',
      badge: pendingCounts?.disputes ? {
        text: pendingCounts.disputes.toString(),
        variant: pendingCounts.disputes > 0 ? 'destructive' : 'default'
      } : undefined,
      color: 'red',
      priority: 'high'
    },
    {
      id: 'view-analytics',
      title: 'View Analytics',
      description: 'Platform performance and insights',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'blue',
      priority: 'medium'
    },
    {
      id: 'system-monitoring',
      title: 'System Monitoring',
      description: 'Monitor platform health and performance',
      icon: Eye,
      href: '/admin/monitoring',
      color: 'orange',
      priority: 'medium'
    },
    {
      id: 'platform-settings',
      title: 'Platform Settings',
      description: 'Configure platform parameters',
      icon: Settings,
      href: '/admin/settings',
      color: 'purple',
      priority: 'low'
    },
    {
      id: 'send-notifications',
      title: 'Send Notifications',
      description: 'Broadcast messages to users',
      icon: Bell,
      href: '/admin/notifications',
      color: 'yellow',
      priority: 'low'
    },
    {
      id: 'export-reports',
      title: 'Export Reports',
      description: 'Generate and download reports',
      icon: Download,
      href: '/admin/reports',
      color: 'green',
      priority: 'low'
    },
    {
      id: 'bulk-operations',
      title: 'Bulk Operations',
      description: 'Perform bulk actions on data',
      icon: Upload,
      href: '/admin/bulk',
      color: 'orange',
      priority: 'low'
    },
    {
      id: 'audit-logs',
      title: 'Audit Logs',
      description: 'Review system activity logs',
      icon: FileText,
      href: '/admin/audit',
      color: 'blue',
      priority: 'low'
    }
  ];

  // Sort actions by priority and pending counts
  const sortedActions = quickActions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority];
    const bPriority = priorityOrder[b.priority];
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    // If same priority, sort by badge count (higher first)
    const aBadgeCount = a.badge ? parseInt(a.badge.text) : 0;
    const bBadgeCount = b.badge ? parseInt(b.badge.text) : 0;
    return bBadgeCount - aBadgeCount;
  });

  const highPriorityActions = sortedActions.filter(action => action.priority === 'high');
  const otherActions = sortedActions.filter(action => action.priority !== 'high');

  return (
    <div className="space-y-6">
      {/* High Priority Actions */}
      {highPriorityActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Urgent Actions Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {highPriorityActions.map((action) => {
                const IconComponent = action.icon;
                
                return (
                  <Link key={action.id} href={action.href}>
                    <Card 
                      className={`cursor-pointer transition-all duration-200 ${colorClasses[action.color]} hover:shadow-md`}
                      onClick={() => onActionClick?.(action.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                              <IconComponent className={`h-5 w-5 ${iconColorClasses[action.color]}`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-sm">{action.title}</h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {action.description}
                              </p>
                            </div>
                          </div>
                          {action.badge && (
                            <Badge variant={action.badge.variant} className="ml-2">
                              {action.badge.text}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {otherActions.map((action) => {
              const IconComponent = action.icon;
              
              return (
                <Link key={action.id} href={action.href}>
                  <Button
                    variant="outline"
                    className={`w-full h-auto p-4 flex flex-col items-center gap-2 ${colorClasses[action.color]}`}
                    onClick={() => onActionClick?.(action.id)}
                  >
                    <IconComponent className={`h-6 w-6 ${iconColorClasses[action.color]}`} />
                    <div className="text-center">
                      <div className="font-medium text-sm">{action.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {action.description}
                      </div>
                    </div>
                    {action.badge && (
                      <Badge variant={action.badge.variant} className="mt-1">
                        {action.badge.text}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}