import React, { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  MessageSquare,
  ShoppingCart,
  BarChart3,
  Settings,
  Users,
  DollarSign,
  FileText,
  Bell,
  Store,
  Star,
  Shield,
  Upload,
  Search,
  Command,
  ChevronRight,
  ChevronDown,
  Bookmark,
  BookmarkCheck,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Eye,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface SupplierMenuItem {
  id: string;
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  description?: string;
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  permissions?: string[];
  category: 'core' | 'products' | 'orders' | 'analytics' | 'settings';
  priority: number;
  keywords: string[];
  children?: SupplierMenuItem[];
  isNew?: boolean;
  requiresApproval?: boolean;
}

interface SupplierNavigationProps {
  className?: string;
  compact?: boolean;
  pendingCounts?: {
    inquiries: number;
    orders: number;
    quotations: number;
    products: number;
  };
}

const supplierMenuStructure: SupplierMenuItem[] = [
  // Core Dashboard
  {
    id: 'dashboard',
    title: 'Dashboard',
    url: '/supplier',
    icon: LayoutDashboard,
    description: 'Main supplier dashboard with key metrics',
    category: 'core',
    priority: 1,
    keywords: ['dashboard', 'overview', 'metrics', 'home']
  },

  // Product Management
  {
    id: 'products',
    title: 'Product Management',
    url: '/supplier/products',
    icon: Package,
    description: 'Manage your product catalog',
    category: 'products',
    priority: 2,
    keywords: ['products', 'catalog', 'inventory', 'listings'],
    children: [
      {
        id: 'products-all',
        title: 'All Products',
        url: '/supplier/products',
        icon: Package,
        description: 'View and manage all products',
        category: 'products',
        priority: 1,
        keywords: ['products', 'all', 'list']
      },
      {
        id: 'products-add',
        title: 'Add Product',
        url: '/supplier/products/add',
        icon: Package,
        description: 'Add new product to catalog',
        category: 'products',
        priority: 2,
        keywords: ['add', 'create', 'new', 'product']
      },
      {
        id: 'products-bulk',
        title: 'Bulk Upload',
        url: '/supplier/products/bulk-upload',
        icon: Upload,
        description: 'Upload multiple products at once',
        category: 'products',
        priority: 3,
        keywords: ['bulk', 'upload', 'import', 'excel']
      },
      {
        id: 'products-analytics',
        title: 'Product Analytics',
        url: '/supplier/products/analytics',
        icon: BarChart3,
        description: 'View product performance metrics',
        category: 'analytics',
        priority: 4,
        keywords: ['analytics', 'performance', 'metrics', 'views']
      }
    ]
  },

  // Order Management
  {
    id: 'orders',
    title: 'Order Management',
    url: '/supplier/orders',
    icon: ShoppingCart,
    description: 'Manage customer orders',
    category: 'orders',
    priority: 3,
    keywords: ['orders', 'sales', 'fulfillment'],
    children: [
      {
        id: 'orders-all',
        title: 'All Orders',
        url: '/supplier/orders',
        icon: ShoppingCart,
        description: 'View all orders',
        category: 'orders',
        priority: 1,
        keywords: ['orders', 'all', 'list']
      },
      {
        id: 'orders-pending',
        title: 'Pending Orders',
        url: '/supplier/orders?status=pending',
        icon: Clock,
        description: 'Orders awaiting processing',
        badge: { text: '5', variant: 'destructive' },
        category: 'orders',
        priority: 2,
        keywords: ['pending', 'processing', 'new']
      },
      {
        id: 'orders-completed',
        title: 'Completed Orders',
        url: '/supplier/orders?status=completed',
        icon: CheckCircle,
        description: 'Successfully completed orders',
        category: 'orders',
        priority: 3,
        keywords: ['completed', 'finished', 'delivered']
      }
    ]
  },

  // Inquiries & RFQs
  {
    id: 'inquiries',
    title: 'Inquiries & RFQs',
    url: '/supplier/inquiries',
    icon: MessageSquare,
    description: 'Manage customer inquiries and RFQs',
    category: 'orders',
    priority: 4,
    keywords: ['inquiries', 'rfq', 'questions', 'quotes'],
    children: [
      {
        id: 'inquiries-all',
        title: 'All Inquiries',
        url: '/supplier/inquiries',
        icon: MessageSquare,
        description: 'View all customer inquiries',
        category: 'orders',
        priority: 1,
        keywords: ['inquiries', 'all', 'messages']
      },
      {
        id: 'inquiries-rfq',
        title: 'RFQ Management',
        url: '/supplier/rfqs',
        icon: FileText,
        description: 'Manage request for quotations',
        badge: { text: '3', variant: 'outline' },
        category: 'orders',
        priority: 2,
        keywords: ['rfq', 'quotations', 'requests']
      },
      {
        id: 'quotations',
        title: 'Quotations',
        url: '/supplier/quotations',
        icon: FileText,
        description: 'Manage price quotations',
        category: 'orders',
        priority: 3,
        keywords: ['quotations', 'quotes', 'pricing']
      }
    ]
  },

  // Analytics & Reports
  {
    id: 'analytics',
    title: 'Analytics & Reports',
    url: '/supplier/analytics',
    icon: BarChart3,
    description: 'View business analytics and reports',
    category: 'analytics',
    priority: 5,
    keywords: ['analytics', 'reports', 'insights', 'performance'],
    children: [
      {
        id: 'analytics-overview',
        title: 'Analytics Overview',
        url: '/supplier/analytics',
        icon: BarChart3,
        description: 'Comprehensive business analytics',
        category: 'analytics',
        priority: 1,
        keywords: ['analytics', 'overview', 'dashboard']
      },
      {
        id: 'analytics-products',
        title: 'Product Performance',
        url: '/supplier/analytics/products',
        icon: TrendingUp,
        description: 'Product-specific analytics',
        category: 'analytics',
        priority: 2,
        keywords: ['products', 'performance', 'views', 'sales']
      },
      {
        id: 'analytics-customers',
        title: 'Customer Insights',
        url: '/supplier/analytics/customers',
        icon: Users,
        description: 'Customer behavior and insights',
        category: 'analytics',
        priority: 3,
        keywords: ['customers', 'behavior', 'insights']
      }
    ]
  },

  // Earnings & Financials
  {
    id: 'earnings',
    title: 'Earnings & Financials',
    url: '/supplier/earnings',
    icon: DollarSign,
    description: 'Track earnings and financial performance',
    category: 'analytics',
    priority: 6,
    keywords: ['earnings', 'revenue', 'financial', 'money'],
    children: [
      {
        id: 'earnings-overview',
        title: 'Earnings Overview',
        url: '/supplier/earnings',
        icon: DollarSign,
        description: 'View earnings summary',
        category: 'analytics',
        priority: 1,
        keywords: ['earnings', 'overview', 'revenue']
      },
      {
        id: 'earnings-payouts',
        title: 'Payouts',
        url: '/supplier/earnings/payouts',
        icon: DollarSign,
        description: 'Track payout history',
        category: 'analytics',
        priority: 2,
        keywords: ['payouts', 'payments', 'history']
      }
    ]
  },

  // Store Management
  {
    id: 'store',
    title: 'Store Management',
    url: '/supplier/store',
    icon: Store,
    description: 'Manage your store profile and settings',
    category: 'settings',
    priority: 7,
    keywords: ['store', 'profile', 'settings', 'branding'],
    children: [
      {
        id: 'store-profile',
        title: 'Store Profile',
        url: '/supplier/store/profile',
        icon: Store,
        description: 'Edit store information',
        category: 'settings',
        priority: 1,
        keywords: ['profile', 'information', 'details']
      },
      {
        id: 'store-verification',
        title: 'Verification',
        url: '/supplier/verification',
        icon: Shield,
        description: 'Manage verification status',
        category: 'settings',
        priority: 2,
        keywords: ['verification', 'documents', 'compliance'],
        requiresApproval: true
      },
      {
        id: 'store-staff',
        title: 'Staff Management',
        url: '/supplier/staff',
        icon: Users,
        description: 'Manage staff members',
        category: 'settings',
        priority: 3,
        keywords: ['staff', 'team', 'members', 'permissions']
      }
    ]
  },

  // Settings
  {
    id: 'settings',
    title: 'Settings',
    url: '/supplier/settings',
    icon: Settings,
    description: 'Account and notification settings',
    category: 'settings',
    priority: 8,
    keywords: ['settings', 'preferences', 'notifications', 'account']
  }
];

export function SupplierNavigation({ 
  className, 
  compact = false, 
  pendingCounts 
}: SupplierNavigationProps) {
  const [location] = useLocation();
  const { user, hasPermission, isSupplierApproved } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(['products', 'orders', 'inquiries'])
  );
  const [favoriteItems, setFavoriteItems] = useState<Set<string>>(
    new Set(['dashboard', 'products-all', 'orders-pending'])
  );

  // Filter menu items based on permissions and approval status
  const filteredMenuItems = useMemo(() => {
    const filterItems = (items: SupplierMenuItem[]): SupplierMenuItem[] => {
      return items
        .filter(item => {
          // Check if requires approval and user is not approved
          if (item.requiresApproval && !isSupplierApproved) {
            return false;
          }
          
          // Check permissions
          if (item.permissions && !item.permissions.some(perm => hasPermission('products', perm))) {
            return false;
          }
          
          return true;
        })
        .map(item => ({
          ...item,
          children: item.children ? filterItems(item.children) : undefined,
          // Add pending counts to badges
          badge: item.id === 'orders-pending' && pendingCounts?.orders ? 
            { text: pendingCounts.orders.toString(), variant: 'destructive' as const } :
            item.id === 'inquiries-rfq' && pendingCounts?.quotations ?
            { text: pendingCounts.quotations.toString(), variant: 'outline' as const } :
            item.badge
        }))
        .sort((a, b) => a.priority - b.priority);
    };

    return filterItems(supplierMenuStructure);
  }, [hasPermission, isSupplierApproved, pendingCounts]);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const results: SupplierMenuItem[] = [];
    
    const searchItems = (items: SupplierMenuItem[], parentPath: string[] = []) => {
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
    return results.slice(0, 8);
  }, [searchQuery, filteredMenuItems]);

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

  const toggleFavorite = (itemId: string) => {
    setFavoriteItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const renderMenuItem = (item: SupplierMenuItem, level: number = 0) => {
    const isActive = location === item.url;
    const isExpanded = expandedItems.has(item.id);
    const isFavorite = favoriteItems.has(item.id);
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
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
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
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
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={cn("flex flex-col h-full", className)}>
        {/* Search Bar */}
        {!compact && (
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search supplier functions..."
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

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-2">
            {filteredMenuItems.map(item => renderMenuItem(item))}
          </div>
        </div>
      </div>

      {/* Command Palette */}
      <Dialog open={showCommandPalette} onOpenChange={setShowCommandPalette}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Command className="h-5 w-5" />
              Supplier Command Palette
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for functions, pages, or actions..."
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
                <div className="text-center py-8 text-muted-foreground">
                  <Command className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Start typing to search...</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}