import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  Users, 
  ShoppingCart,
  Upload,
  Settings,
  UserCog,
  Shield,
  BarChart3,
  UserPlus,
  FileSpreadsheet,
  UserCheck,
  MessageSquare,
  FileText,
  Bell,
  Activity,
  Store,
  Clock,
  DollarSign,
  CreditCard,
  Search,
  Command,
  ChevronRight,
  ChevronDown,
  Home,
  Filter,
  Star,
  Eye,
  EyeOff,
  Bookmark,
  BookmarkCheck,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Book,
  GraduationCap,
  Code
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

// Enhanced menu item interface with role-based access and metadata
interface AdminMenuItem {
  id: string;
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  description?: string;
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  roles?: string[]; // Roles that can access this item
  permissions?: string[]; // Specific permissions required
  category: 'core' | 'management' | 'analytics' | 'settings' | 'tools';
  priority: number; // For sorting and quick access
  keywords: string[]; // For search functionality
  children?: AdminMenuItem[];
  isNew?: boolean;
  isDeprecated?: boolean;
  requiresSetup?: boolean;
}

// Enhanced admin menu structure with role-based access
const adminMenuStructure: AdminMenuItem[] = [
  // Core Dashboard
  {
    id: 'dashboard',
    title: 'Dashboard',
    url: '/admin/dashboard',
    icon: LayoutDashboard,
    description: 'Main admin dashboard with key metrics',
    category: 'core',
    priority: 1,
    keywords: ['dashboard', 'overview', 'metrics', 'kpi', 'home'],
    roles: ['admin', 'manager', 'operator']
  },
  
  // Supplier Management
  {
    id: 'suppliers',
    title: 'Supplier Management',
    url: '/admin/suppliers',
    icon: Store,
    description: 'Manage suppliers and their performance',
    category: 'management',
    priority: 2,
    keywords: ['suppliers', 'vendors', 'partners', 'management'],
    roles: ['admin', 'manager'],
    children: [
      {
        id: 'suppliers-all',
        title: 'All Suppliers',
        url: '/admin/suppliers',
        icon: Store,
        description: 'View and manage all suppliers',
        category: 'management',
        priority: 1,
        keywords: ['suppliers', 'all', 'list'],
        roles: ['admin', 'manager']
      },
      {
        id: 'suppliers-pending',
        title: 'Pending Approvals',
        url: '/admin/suppliers/pending',
        icon: Clock,
        description: 'Review pending supplier applications',
        badge: { text: '5', variant: 'destructive' },
        category: 'management',
        priority: 2,
        keywords: ['pending', 'approvals', 'review'],
        roles: ['admin', 'manager']
      },
      {
        id: 'suppliers-verification',
        title: 'Verification',
        url: '/admin/verification',
        icon: Shield,
        description: 'Supplier verification and compliance',
        category: 'management',
        priority: 3,
        keywords: ['verification', 'compliance', 'documents'],
        roles: ['admin', 'manager']
      }
    ]
  },

  // Product Management
  {
    id: 'products',
    title: 'Product Management',
    url: '/admin/products',
    icon: Package,
    description: 'Manage products and inventory',
    category: 'management',
    priority: 3,
    keywords: ['products', 'inventory', 'catalog'],
    roles: ['admin', 'manager', 'operator'],
    children: [
      {
        id: 'products-all',
        title: 'All Products',
        url: '/admin/products',
        icon: Package,
        description: 'View and manage all products',
        category: 'management',
        priority: 1,
        keywords: ['products', 'all', 'catalog'],
        roles: ['admin', 'manager', 'operator']
      },
      {
        id: 'products-bulk-upload',
        title: 'Bulk Upload',
        url: '/admin/bulk-upload',
        icon: Upload,
        description: 'Upload products in bulk',
        category: 'tools',
        priority: 2,
        keywords: ['bulk', 'upload', 'import'],
        roles: ['admin', 'manager']
      },
      {
        id: 'products-categories',
        title: 'Categories',
        url: '/admin/categories',
        icon: FolderTree,
        description: 'Manage product categories',
        category: 'management',
        priority: 3,
        keywords: ['categories', 'taxonomy', 'organization'],
        roles: ['admin', 'manager']
      }
    ]
  },

  // Order Management
  {
    id: 'orders',
    title: 'Order Management',
    url: '/admin/orders',
    icon: ShoppingCart,
    description: 'Monitor and manage orders',
    category: 'management',
    priority: 4,
    keywords: ['orders', 'transactions', 'sales'],
    roles: ['admin', 'manager', 'operator'],
    children: [
      {
        id: 'orders-all',
        title: 'All Orders',
        url: '/admin/orders',
        icon: ShoppingCart,
        description: 'View all orders',
        category: 'management',
        priority: 1,
        keywords: ['orders', 'all', 'transactions'],
        roles: ['admin', 'manager', 'operator']
      },
      {
        id: 'orders-inquiries',
        title: 'Customer Inquiries',
        url: '/admin/inquiries',
        icon: MessageSquare,
        description: 'Manage customer inquiries',
        badge: { text: '12', variant: 'secondary' },
        category: 'management',
        priority: 2,
        keywords: ['inquiries', 'questions', 'support'],
        roles: ['admin', 'manager', 'operator']
      },
      {
        id: 'orders-quotations',
        title: 'Quotations',
        url: '/admin/quotations',
        icon: FileSpreadsheet,
        description: 'Manage price quotations',
        category: 'management',
        priority: 3,
        keywords: ['quotations', 'quotes', 'pricing'],
        roles: ['admin', 'manager']
      },
      {
        id: 'orders-rfqs',
        title: 'RFQs',
        url: '/admin/rfqs',
        icon: FileText,
        description: 'Request for quotations',
        category: 'management',
        priority: 4,
        keywords: ['rfq', 'requests', 'quotations'],
        roles: ['admin', 'manager']
      }
    ]
  },

  // Financial Management
  {
    id: 'financial',
    title: 'Financial Management',
    url: '/admin/financial',
    icon: DollarSign,
    description: 'Manage commissions and payouts',
    category: 'management',
    priority: 5,
    keywords: ['financial', 'money', 'revenue', 'commissions'],
    roles: ['admin', 'financial_manager'],
    children: [
      {
        id: 'financial-commission',
        title: 'Commission Management',
        url: '/admin/commission',
        icon: DollarSign,
        description: 'Configure commission rates',
        category: 'management',
        priority: 1,
        keywords: ['commission', 'rates', 'fees'],
        roles: ['admin', 'financial_manager']
      },
      {
        id: 'financial-payouts',
        title: 'Payout Management',
        url: '/admin/payouts',
        icon: CreditCard,
        description: 'Process supplier payouts',
        badge: { text: '8', variant: 'outline' },
        category: 'management',
        priority: 2,
        keywords: ['payouts', 'payments', 'suppliers'],
        roles: ['admin', 'financial_manager']
      }
    ]
  },

  // Analytics & Monitoring
  {
    id: 'analytics',
    title: 'Analytics & Reports',
    url: '/admin/analytics',
    icon: BarChart3,
    description: 'Platform analytics and reporting',
    category: 'analytics',
    priority: 6,
    keywords: ['analytics', 'reports', 'insights', 'data'],
    roles: ['admin', 'manager'],
    children: [
      {
        id: 'analytics-monitoring',
        title: 'Platform Monitoring',
        url: '/admin/monitoring',
        icon: Activity,
        description: 'Real-time platform monitoring',
        category: 'analytics',
        priority: 1,
        keywords: ['monitoring', 'performance', 'health'],
        roles: ['admin', 'manager']
      },
      {
        id: 'analytics-reports',
        title: 'Reports',
        url: '/admin/reports',
        icon: BarChart3,
        description: 'Generate custom reports',
        category: 'analytics',
        priority: 2,
        keywords: ['reports', 'export', 'data'],
        roles: ['admin', 'manager']
      }
    ]
  },

  // User Management
  {
    id: 'users',
    title: 'User Management',
    url: '/admin/users',
    icon: UserCog,
    description: 'Manage platform users',
    category: 'management',
    priority: 7,
    keywords: ['users', 'accounts', 'permissions'],
    roles: ['admin'],
    children: [
      {
        id: 'users-all',
        title: 'All Users',
        url: '/admin/users',
        icon: Users,
        description: 'View all platform users',
        category: 'management',
        priority: 1,
        keywords: ['users', 'all', 'accounts'],
        roles: ['admin']
      },
      {
        id: 'users-add',
        title: 'Add User',
        url: '/admin/users/add',
        icon: UserPlus,
        description: 'Create new user account',
        category: 'management',
        priority: 2,
        keywords: ['add', 'create', 'new', 'user'],
        roles: ['admin']
      },
      {
        id: 'users-access',
        title: 'Access Management',
        url: '/admin/access-management',
        icon: Shield,
        description: 'Manage user roles and permissions',
        isNew: true,
        category: 'management',
        priority: 3,
        keywords: ['access', 'roles', 'permissions', 'security'],
        roles: ['admin']
      }
    ]
  },

  // Communication
  {
    id: 'communication',
    title: 'Communication',
    url: '/admin/communication',
    icon: MessageSquare,
    description: 'Manage platform communications',
    category: 'tools',
    priority: 8,
    keywords: ['communication', 'messages', 'notifications'],
    roles: ['admin', 'manager'],
    children: [
      {
        id: 'communication-chat',
        title: 'Chat Management',
        url: '/admin/chat',
        icon: MessageSquare,
        description: 'Monitor platform chats',
        category: 'tools',
        priority: 1,
        keywords: ['chat', 'messages', 'support'],
        roles: ['admin', 'manager']
      },
      {
        id: 'communication-notifications',
        title: 'Notifications',
        url: '/admin/notifications',
        icon: Bell,
        description: 'Manage system notifications',
        category: 'tools',
        priority: 2,
        keywords: ['notifications', 'alerts', 'announcements'],
        roles: ['admin', 'manager']
      }
    ]
  },

  // Compliance & Security
  {
    id: 'compliance',
    title: 'Compliance & Security',
    url: '/admin/compliance',
    icon: Shield,
    description: 'Compliance and audit management',
    category: 'settings',
    priority: 9,
    keywords: ['compliance', 'security', 'audit', 'regulations'],
    roles: ['admin'],
    children: [
      {
        id: 'compliance-audit',
        title: 'Audit Logs',
        url: '/admin/activity-log',
        icon: Activity,
        description: 'View system audit logs',
        category: 'settings',
        priority: 1,
        keywords: ['audit', 'logs', 'activity', 'history'],
        roles: ['admin']
      },
      {
        id: 'compliance-reports',
        title: 'Compliance Reports',
        url: '/admin/compliance',
        icon: FileText,
        description: 'Generate compliance reports',
        category: 'settings',
        priority: 2,
        keywords: ['compliance', 'reports', 'regulatory'],
        roles: ['admin']
      }
    ]
  },

  // Documentation & Training
  {
    id: 'documentation',
    title: 'Documentation & Training',
    url: '/admin/documentation',
    icon: Book,
    description: 'Access documentation, training, and help resources',
    category: 'tools',
    priority: 9,
    keywords: ['documentation', 'training', 'help', 'guides', 'tutorials'],
    roles: ['admin', 'manager', 'operator'],
    children: [
      {
        id: 'documentation-guides',
        title: 'Documentation',
        url: '/admin/documentation',
        icon: Book,
        description: 'Comprehensive admin guides and references',
        category: 'tools',
        priority: 1,
        keywords: ['documentation', 'guides', 'help'],
        roles: ['admin', 'manager', 'operator']
      },
      {
        id: 'training-modules',
        title: 'Training & Certification',
        url: '/admin/training',
        icon: GraduationCap,
        description: 'Interactive training modules and certifications',
        category: 'tools',
        priority: 2,
        keywords: ['training', 'certification', 'learning'],
        roles: ['admin', 'manager', 'operator']
      },
      {
        id: 'api-documentation',
        title: 'API Reference',
        url: '/admin/api-docs',
        icon: Code,
        description: 'Complete API documentation for developers',
        category: 'tools',
        priority: 3,
        keywords: ['api', 'reference', 'developers', 'endpoints'],
        roles: ['admin']
      }
    ]
  },

  // Settings
  {
    id: 'settings',
    title: 'Platform Settings',
    url: '/admin/settings',
    icon: Settings,
    description: 'Configure platform settings',
    category: 'settings',
    priority: 10,
    keywords: ['settings', 'configuration', 'preferences'],
    roles: ['admin']
  }
];

// Navigation state management
interface NavigationState {
  expandedItems: Set<string>;
  favoriteItems: Set<string>;
  recentItems: string[];
  hiddenItems: Set<string>;
}

interface AdminNavigationProps {
  className?: string;
  compact?: boolean;
}

export function AdminNavigation({ className, compact = false }: AdminNavigationProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [navigationState, setNavigationState] = useState<NavigationState>({
    expandedItems: new Set(['suppliers', 'products', 'orders']), // Default expanded
    favoriteItems: new Set(['dashboard', 'suppliers-pending', 'orders-inquiries']),
    recentItems: [],
    hiddenItems: new Set()
  });

  // Filter menu items based on user role and permissions
  const filteredMenuItems = useMemo(() => {
    const userRole = user?.role || 'operator';
    
    const filterItems = (items: AdminMenuItem[]): AdminMenuItem[] => {
      return items
        .filter(item => {
          // Check role access
          if (item.roles && !item.roles.includes(userRole)) {
            return false;
          }
          
          // Check if item is hidden
          if (navigationState.hiddenItems.has(item.id)) {
            return false;
          }
          
          return true;
        })
        .map(item => ({
          ...item,
          children: item.children ? filterItems(item.children) : undefined
        }))
        .sort((a, b) => a.priority - b.priority);
    };

    return filterItems(adminMenuStructure);
  }, [user?.role, navigationState.hiddenItems]);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const results: AdminMenuItem[] = [];
    
    const searchItems = (items: AdminMenuItem[], parentPath: string[] = []) => {
      items.forEach(item => {
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDescription = item.description?.toLowerCase().includes(query);
        const matchesKeywords = item.keywords.some(keyword => keyword.includes(query));
        
        if (matchesTitle || matchesDescription || matchesKeywords) {
          results.push({
            ...item,
            title: parentPath.length > 0 ? `${parentPath.join(' > ')} > ${item.title}` : item.title
          });
        }
        
        if (item.children) {
          searchItems(item.children, [...parentPath, item.title]);
        }
      });
    };
    
    searchItems(filteredMenuItems);
    return results.slice(0, 10); // Limit results
  }, [searchQuery, filteredMenuItems]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      
      // Escape to close command palette
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setSearchQuery("");
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update recent items when location changes
  useEffect(() => {
    const currentItem = filteredMenuItems
      .flatMap(item => [item, ...(item.children || [])])
      .find(item => item.url === location);
    
    if (currentItem) {
      setNavigationState(prev => ({
        ...prev,
        recentItems: [
          currentItem.id,
          ...prev.recentItems.filter(id => id !== currentItem.id)
        ].slice(0, 5)
      }));
    }
  }, [location, filteredMenuItems]);

  const toggleExpanded = (itemId: string) => {
    setNavigationState(prev => ({
      ...prev,
      expandedItems: prev.expandedItems.has(itemId)
        ? new Set([...prev.expandedItems].filter(id => id !== itemId))
        : new Set([...prev.expandedItems, itemId])
    }));
  };

  const toggleFavorite = (itemId: string) => {
    setNavigationState(prev => ({
      ...prev,
      favoriteItems: prev.favoriteItems.has(itemId)
        ? new Set([...prev.favoriteItems].filter(id => id !== itemId))
        : new Set([...prev.favoriteItems, itemId])
    }));
  };

  const toggleHidden = (itemId: string) => {
    setNavigationState(prev => ({
      ...prev,
      hiddenItems: prev.hiddenItems.has(itemId)
        ? new Set([...prev.hiddenItems].filter(id => id !== itemId))
        : new Set([...prev.hiddenItems, itemId])
    }));
  };

  const renderMenuItem = (item: AdminMenuItem, level: number = 0) => {
    const isActive = location === item.url;
    const isExpanded = navigationState.expandedItems.has(item.id);
    const isFavorite = navigationState.favoriteItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    
    return (
      <div key={item.id} className="relative">
        {hasChildren ? (
          <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(item.id)}>
            <div className="flex items-center group">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-auto p-2 font-normal",
                    level > 0 && "ml-4",
                    isActive && "bg-accent text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.title}</span>
                  {item.badge && (
                    <Badge variant={item.badge.variant} className="ml-2 text-xs">
                      {item.badge.text}
                    </Badge>
                  )}
                  {item.isNew && (
                    <Badge variant="secondary" className="ml-2 text-xs">New</Badge>
                  )}
                  <ChevronDown className={cn(
                    "h-4 w-4 ml-2 transition-transform",
                    isExpanded && "rotate-180"
                  )} />
                </Button>
              </CollapsibleTrigger>
              
              {!compact && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item.id);
                    }}
                  >
                    {isFavorite ? (
                      <BookmarkCheck className="h-3 w-3 text-yellow-500" />
                    ) : (
                      <Bookmark className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              )}
            </div>
            
            <CollapsibleContent className="space-y-1">
              {item.children?.map(child => renderMenuItem(child, level + 1))}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <div className="flex items-center group">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start h-auto p-2 font-normal",
                level > 0 && "ml-4",
                isActive && "bg-accent text-accent-foreground"
              )}
              asChild
            >
              <Link href={item.url}>
                <item.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="flex-1 text-left">{item.title}</span>
                {item.badge && (
                  <Badge variant={item.badge.variant} className="ml-2 text-xs">
                    {item.badge.text}
                  </Badge>
                )}
                {item.isNew && (
                  <Badge variant="secondary" className="ml-2 text-xs">New</Badge>
                )}
                {isFavorite && (
                  <Star className="h-3 w-3 ml-2 text-yellow-500 fill-current" />
                )}
              </Link>
            </Button>
            
            {!compact && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(item.id);
                  }}
                >
                  {isFavorite ? (
                    <BookmarkCheck className="h-3 w-3 text-yellow-500" />
                  ) : (
                    <Bookmark className="h-3 w-3" />
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Get favorite items for quick access
  const favoriteItems = filteredMenuItems
    .flatMap(item => [item, ...(item.children || [])])
    .filter(item => navigationState.favoriteItems.has(item.id));

  // Get recent items
  const recentItems = navigationState.recentItems
    .map(id => filteredMenuItems
      .flatMap(item => [item, ...(item.children || [])])
      .find(item => item.id === id)
    )
    .filter(Boolean) as AdminMenuItem[];

  return (
    <>
      <div className={cn("flex flex-col h-full", className)}>
        {/* Search Bar */}
        {!compact && (
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search admin functions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-12"
                onFocus={() => setShowCommandPalette(true)}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setShowCommandPalette(true)}
              >
                <Command className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Quick Access - Favorites */}
        {!compact && favoriteItems.length > 0 && (
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Quick Access</h3>
              <Star className="h-3 w-3 text-yellow-500" />
            </div>
            <div className="space-y-1">
              {favoriteItems.slice(0, 5).map(item => (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 font-normal"
                  asChild
                >
                  <Link href={item.url}>
                    <item.icon className="h-3 w-3 mr-2" />
                    <span className="truncate">{item.title}</span>
                    {item.badge && (
                      <Badge variant={item.badge.variant} className="ml-auto text-xs">
                        {item.badge.text}
                      </Badge>
                    )}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-2">
            {filteredMenuItems.map(item => renderMenuItem(item))}
          </div>
        </div>

        {/* Recent Items */}
        {!compact && recentItems.length > 0 && (
          <div className="p-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent</h3>
            <div className="space-y-1">
              {recentItems.slice(0, 3).map(item => (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 font-normal"
                  asChild
                >
                  <Link href={item.url}>
                    <item.icon className="h-3 w-3 mr-2" />
                    <span className="truncate">{item.title}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Command Palette */}
      <Dialog open={showCommandPalette} onOpenChange={setShowCommandPalette}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Command className="h-5 w-5" />
              Command Palette
              <Badge variant="outline" className="ml-auto">Ctrl+K</Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for admin functions, pages, or actions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            <div className="max-h-96 overflow-y-auto">
              {searchQuery.trim() ? (
                searchResults.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.map(item => (
                      <Button
                        key={item.id}
                        variant="ghost"
                        className="w-full justify-start h-auto p-3 font-normal"
                        onClick={() => {
                          window.location.href = item.url;
                          setShowCommandPalette(false);
                          setSearchQuery("");
                        }}
                      >
                        <item.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{item.title}</div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground">{item.description}</div>
                          )}
                        </div>
                        {item.badge && (
                          <Badge variant={item.badge.variant} className="ml-2">
                            {item.badge.text}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No results found for "{searchQuery}"</p>
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  {favoriteItems.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Favorites</h4>
                      <div className="space-y-1">
                        {favoriteItems.slice(0, 5).map(item => (
                          <Button
                            key={item.id}
                            variant="ghost"
                            className="w-full justify-start h-auto p-3 font-normal"
                            onClick={() => {
                              window.location.href = item.url;
                              setShowCommandPalette(false);
                            }}
                          >
                            <item.icon className="h-4 w-4 mr-3" />
                            <div className="flex-1 text-left">
                              <div className="font-medium">{item.title}</div>
                              {item.description && (
                                <div className="text-sm text-muted-foreground">{item.description}</div>
                              )}
                            </div>
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {recentItems.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Recent</h4>
                      <div className="space-y-1">
                        {recentItems.slice(0, 5).map(item => (
                          <Button
                            key={item.id}
                            variant="ghost"
                            className="w-full justify-start h-auto p-3 font-normal"
                            onClick={() => {
                              window.location.href = item.url;
                              setShowCommandPalette(false);
                            }}
                          >
                            <item.icon className="h-4 w-4 mr-3" />
                            <div className="flex-1 text-left">
                              <div className="font-medium">{item.title}</div>
                              {item.description && (
                                <div className="text-sm text-muted-foreground">{item.description}</div>
                              )}
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}