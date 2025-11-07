import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart,
  DollarSign,
  BarChart3,
  UserCog,
  MessageSquare,
  Shield,
  Settings,
  Book,
  ChevronRight,
  Clock,
  Store,
  Activity,
  Bell,
  FileText,
  GraduationCap,
  AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/components/ui/sidebar";

// Simplified menu structure
interface MenuItem {
  id: string;
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children?: MenuItem[];
  roles?: string[];
}

// Menu sections for better organization
interface MenuSection {
  title?: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        url: '/admin/dashboard',
        icon: LayoutDashboard,
        roles: ['admin', 'manager', 'operator']
      }
    ]
  },
  {
    title: 'Management',
    items: [
      {
        id: 'suppliers',
        title: 'Suppliers',
        url: '/admin/suppliers',
        icon: Store,
        roles: ['admin', 'manager'],
        children: [
          {
            id: 'suppliers-all',
            title: 'All Suppliers',
            url: '/admin/suppliers',
            icon: Store,
            roles: ['admin', 'manager']
          },
          {
            id: 'suppliers-pending',
            title: 'Pending Approval',
            url: '/admin/suppliers/pending',
            icon: Clock,
            badge: '5',
            badgeVariant: 'destructive',
            roles: ['admin', 'manager']
          },
          {
            id: 'suppliers-verification',
            title: 'Verification',
            url: '/admin/verification',
            icon: Shield,
            roles: ['admin', 'manager']
          }
        ]
      },
      {
        id: 'products',
        title: 'Products',
        url: '/admin/products',
        icon: Package,
        roles: ['admin', 'manager', 'operator'],
        children: [
          {
            id: 'products-all',
            title: 'All Products',
            url: '/admin/products',
            icon: Package,
            roles: ['admin', 'manager', 'operator']
          },
          {
            id: 'products-categories',
            title: 'Categories',
            url: '/admin/categories',
            icon: Package,
            roles: ['admin', 'manager']
          }
        ]
      },
      {
        id: 'orders',
        title: 'Orders',
        url: '/admin/orders',
        icon: ShoppingCart,
        roles: ['admin', 'manager', 'operator'],
        children: [
          {
            id: 'orders-all',
            title: 'All Orders',
            url: '/admin/orders',
            icon: ShoppingCart,
            roles: ['admin', 'manager', 'operator']
          }
        ]
      }
    ]
  },
  {
    title: 'Finance & Analytics',
    items: [
      {
        id: 'financial',
        title: 'Financial',
        url: '/admin/financial',
        icon: DollarSign,
        roles: ['admin', 'financial_manager'],
        children: [
          {
            id: 'financial-commission',
            title: 'Commission Rates',
            url: '/admin/commission',
            icon: DollarSign,
            roles: ['admin', 'financial_manager']
          },
          {
            id: 'financial-payouts',
            title: 'Pending Payouts',
            url: '/admin/payouts',
            icon: DollarSign,
            badge: '8',
            badgeVariant: 'outline',
            roles: ['admin', 'financial_manager']
          }
        ]
      },
      {
        id: 'analytics',
        title: 'Analytics',
        url: '/admin/analytics',
        icon: BarChart3,
        roles: ['admin', 'manager'],
        children: [
          {
            id: 'analytics-monitoring',
            title: 'System Monitoring',
            url: '/admin/monitoring',
            icon: Activity,
            roles: ['admin', 'manager']
          },
          {
            id: 'analytics-reports',
            title: 'Reports',
            url: '/admin/reports',
            icon: FileText,
            roles: ['admin', 'manager']
          }
        ]
      }
    ]
  },
  {
    title: 'Administration',
    items: [
      {
        id: 'users',
        title: 'User Management',
        url: '/admin/users',
        icon: UserCog,
        roles: ['admin'],
        children: [
          {
            id: 'users-all',
            title: 'All Users',
            url: '/admin/users',
            icon: Users,
            roles: ['admin']
          },
          {
            id: 'users-access',
            title: 'Access Control',
            url: '/admin/access-management',
            icon: Shield,
            roles: ['admin']
          }
        ]
      },
      {
        id: 'communication',
        title: 'Communication',
        url: '/admin/communication',
        icon: MessageSquare,
        roles: ['admin', 'manager'],
        children: [
          {
            id: 'communication-notifications',
            title: 'Notifications',
            url: '/admin/notifications',
            icon: Bell,
            roles: ['admin', 'manager']
          }
        ]
      },
      {
        id: 'disputes',
        title: 'Dispute Management',
        url: '/admin/disputes',
        icon: AlertTriangle,
        roles: ['admin']
      },
      {
        id: 'compliance',
        title: 'Compliance & Security',
        url: '/admin/compliance',
        icon: Shield,
        roles: ['admin']
      }
    ]
  },
  {
    title: 'Support',
    items: [
      {
        id: 'help',
        title: 'Help & Training',
        url: '/admin/documentation',
        icon: Book,
        roles: ['admin', 'manager', 'operator'],
        children: [
          {
            id: 'help-docs',
            title: 'Documentation',
            url: '/admin/documentation',
            icon: Book,
            roles: ['admin', 'manager', 'operator']
          },
          {
            id: 'help-training',
            title: 'Training Center',
            url: '/admin/training',
            icon: GraduationCap,
            roles: ['admin', 'manager', 'operator']
          }
        ]
      },
      {
        id: 'settings',
        title: 'Platform Settings',
        url: '/admin/settings',
        icon: Settings,
        roles: ['admin']
      }
    ]
  }
];

interface CleanAdminSidebarProps {
  className?: string;
}

export function CleanAdminSidebar({ className }: CleanAdminSidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { state } = useSidebar();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['suppliers', 'products']));
  
  const isCollapsed = state === "collapsed";

  // Filter menu sections based on user role
  const filteredMenuSections = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      const userRole = user?.role || 'operator';
      return !item.roles || item.roles.includes(userRole);
    }).map(item => ({
      ...item,
      children: item.children?.filter(child => 
        !child.roles || child.roles.includes(user?.role || 'operator')
      )
    }))
  })).filter(section => section.items.length > 0);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isActive = location === item.url || (item.children && item.children.some(child => child.url === location));
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    
    return (
      <div key={item.id} className="relative">
        {hasChildren ? (
          <div>
            <button
              onClick={() => !isCollapsed && toggleExpanded(item.id)}
              className={cn(
                "w-full flex items-center justify-start h-7 px-2 text-xs font-medium hover:bg-accent/50 rounded-sm transition-all duration-200 group",
                level > 0 && !isCollapsed && "ml-2 pl-4",
                isActive && "bg-accent text-accent-foreground shadow-sm",
                isCollapsed && "justify-center px-1"
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <item.icon className="h-3 w-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left truncate ml-2">{item.title}</span>
                  {item.badge && (
                    <Badge variant={item.badgeVariant || 'default'} className="ml-1 text-xs h-3 px-1 font-medium">
                      {item.badge}
                    </Badge>
                  )}
                  <ChevronRight className={cn(
                    "h-3 w-3 ml-1 transition-transform duration-200 flex-shrink-0",
                    isExpanded && "rotate-90"
                  )} />
                </>
              )}
            </button>
            
            {isExpanded && !isCollapsed && (
              <div className="mt-0.5 space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                {item.children?.map(child => renderMenuItem(child, level + 1))}
              </div>
            )}
          </div>
        ) : (
          <Link href={item.url}>
            <div className={cn(
              "w-full flex items-center justify-start h-7 px-2 text-xs font-medium hover:bg-accent/50 rounded-sm transition-all duration-200 cursor-pointer group",
              level > 0 && !isCollapsed && "ml-2 pl-4",
              location === item.url && "bg-accent text-accent-foreground shadow-sm",
              isCollapsed && "justify-center px-1"
            )}
            title={isCollapsed ? item.title : undefined}
            >
              <item.icon className="h-3 w-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left truncate ml-2">{item.title}</span>
                  {item.badge && (
                    <Badge variant={item.badgeVariant || 'default'} className="ml-1 text-xs h-3 px-1 font-medium">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </Link>
        )}
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Navigation */}
      <div className="flex-1 py-1">
        <div className="px-2 space-y-1">
          {filteredMenuSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className={cn(sectionIndex > 0 && "mt-2")}>
              {section.title && !isCollapsed && (
                <div className="px-2 py-0.5 mb-1">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {section.title}
                  </h3>
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => renderMenuItem(item))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="px-2 py-1 border-t bg-muted/30 mt-auto">
          <div className="text-xs text-muted-foreground truncate">
            {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'Admin User'}
          </div>
          <div className="text-xs text-muted-foreground capitalize">
            {user?.role || 'Operator'}
          </div>
        </div>
      )}
    </div>
  );
}