import React, { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Search,
  FileText,
  MessageSquare,
  ShoppingCart,
  Heart,
  Bookmark,
  Settings,
  Bell,
  BarChart3,
  DollarSign,
  Package,
  Users,
  Star,
  Clock,
  CheckCircle,
  Eye,
  Filter,
  Command,
  ChevronRight,
  ChevronDown,
  BookmarkCheck,
  Activity,
  TrendingUp,
  Globe,
  Shield
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

interface BuyerMenuItem {
  id: string;
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  description?: string;
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  category: 'core' | 'sourcing' | 'orders' | 'communication' | 'analytics' | 'settings';
  priority: number;
  keywords: string[];
  children?: BuyerMenuItem[];
  isNew?: boolean;
}

interface BuyerNavigationProps {
  className?: string;
  compact?: boolean;
  pendingCounts?: {
    rfqs: number;
    inquiries: number;
    messages: number;
    quotations: number;
    orders: number;
  };
}

const buyerMenuStructure: BuyerMenuItem[] = [
  // Core Dashboard
  {
    id: 'dashboard',
    title: 'Dashboard',
    url: '/buyer',
    icon: LayoutDashboard,
    description: 'Main buyer dashboard with overview',
    category: 'core',
    priority: 1,
    keywords: ['dashboard', 'overview', 'home']
  },

  // Product Discovery & Sourcing
  {
    id: 'product-discovery',
    title: 'Product Discovery',
    url: '/products',
    icon: Search,
    description: 'Search and discover products',
    category: 'sourcing',
    priority: 2,
    keywords: ['products', 'search', 'discovery', 'browse'],
    children: [
      {
        id: 'browse-products',
        title: 'Browse Products',
        url: '/products',
        icon: Package,
        description: 'Browse all available products',
        category: 'sourcing',
        priority: 1,
        keywords: ['browse', 'products', 'catalog']
      },
      {
        id: 'advanced-search',
        title: 'Advanced Search',
        url: '/products/search',
        icon: Filter,
        description: 'Advanced product search with filters',
        category: 'sourcing',
        priority: 2,
        keywords: ['advanced', 'search', 'filters']
      },
      {
        id: 'saved-searches',
        title: 'Saved Searches',
        url: '/buyer/saved-searches',
        icon: Bookmark,
        description: 'Your saved product searches',
        category: 'sourcing',
        priority: 3,
        keywords: ['saved', 'searches', 'bookmarks']
      },
      {
        id: 'favorites',
        title: 'Favorite Products',
        url: '/favorites',
        icon: Heart,
        description: 'Products you\'ve favorited',
        category: 'sourcing',
        priority: 4,
        keywords: ['favorites', 'liked', 'saved']
      }
    ]
  },

  // RFQs & Inquiries
  {
    id: 'rfqs-inquiries',
    title: 'RFQs & Inquiries',
    url: '/buyer/rfqs',
    icon: FileText,
    description: 'Manage RFQs and product inquiries',
    category: 'sourcing',
    priority: 3,
    keywords: ['rfq', 'inquiries', 'requests', 'quotes'],
    children: [
      {
        id: 'rfqs-all',
        title: 'All RFQs',
        url: '/buyer/rfqs',
        icon: FileText,
        description: 'View all your RFQs',
        category: 'sourcing',
        priority: 1,
        keywords: ['rfqs', 'all', 'requests']
      },
      {
        id: 'rfqs-create',
        title: 'Create RFQ',
        url: '/rfq/create',
        icon: FileText,
        description: 'Create new request for quotation',
        category: 'sourcing',
        priority: 2,
        keywords: ['create', 'new', 'rfq']
      },
      {
        id: 'inquiries-all',
        title: 'Product Inquiries',
        url: '/buyer/inquiries',
        icon: MessageSquare,
        description: 'View your product inquiries',
        badge: { text: '3', variant: 'outline' },
        category: 'sourcing',
        priority: 3,
        keywords: ['inquiries', 'questions', 'products']
      },
      {
        id: 'quotations',
        title: 'Quotations',
        url: '/buyer/quotations',
        icon: DollarSign,
        description: 'Received quotations from suppliers',
        category: 'sourcing',
        priority: 4,
        keywords: ['quotations', 'quotes', 'prices']
      }
    ]
  },

  // Orders & Purchases
  {
    id: 'orders',
    title: 'Orders & Purchases',
    url: '/buyer/orders',
    icon: ShoppingCart,
    description: 'Manage your orders and purchases',
    category: 'orders',
    priority: 4,
    keywords: ['orders', 'purchases', 'buying'],
    children: [
      {
        id: 'orders-all',
        title: 'All Orders',
        url: '/buyer/orders',
        icon: ShoppingCart,
        description: 'View all your orders',
        category: 'orders',
        priority: 1,
        keywords: ['orders', 'all', 'purchases']
      },
      {
        id: 'orders-pending',
        title: 'Pending Orders',
        url: '/buyer/orders?status=pending',
        icon: Clock,
        description: 'Orders awaiting processing',
        badge: { text: '2', variant: 'destructive' },
        category: 'orders',
        priority: 2,
        keywords: ['pending', 'processing', 'waiting']
      },
      {
        id: 'orders-completed',
        title: 'Completed Orders',
        url: '/buyer/orders?status=completed',
        icon: CheckCircle,
        description: 'Successfully completed orders',
        category: 'orders',
        priority: 3,
        keywords: ['completed', 'finished', 'delivered']
      },
      {
        id: 'order-tracking',
        title: 'Order Tracking',
        url: '/buyer/tracking',
        icon: Package,
        description: 'Track your order shipments',
        category: 'orders',
        priority: 4,
        keywords: ['tracking', 'shipment', 'delivery']
      }
    ]
  },

  // Communication
  {
    id: 'communication',
    title: 'Communication',
    url: '/messages',
    icon: MessageSquare,
    description: 'Messages and conversations',
    category: 'communication',
    priority: 5,
    keywords: ['messages', 'chat', 'communication'],
    children: [
      {
        id: 'messages-all',
        title: 'All Messages',
        url: '/messages',
        icon: MessageSquare,
        description: 'View all conversations',
        badge: { text: '5', variant: 'destructive' },
        category: 'communication',
        priority: 1,
        keywords: ['messages', 'all', 'conversations']
      },
      {
        id: 'supplier-chat',
        title: 'Supplier Chats',
        url: '/messages?type=supplier',
        icon: Users,
        description: 'Conversations with suppliers',
        category: 'communication',
        priority: 2,
        keywords: ['suppliers', 'chat', 'vendors']
      },
      {
        id: 'support-chat',
        title: 'Support',
        url: '/messages?type=support',
        icon: Shield,
        description: 'Customer support conversations',
        category: 'communication',
        priority: 3,
        keywords: ['support', 'help', 'assistance']
      }
    ]
  },

  // Analytics & Reports
  {
    id: 'analytics',
    title: 'Analytics & Insights',
    url: '/buyer/analytics',
    icon: BarChart3,
    description: 'Sourcing analytics and insights',
    category: 'analytics',
    priority: 6,
    keywords: ['analytics', 'insights', 'reports', 'data'],
    children: [
      {
        id: 'sourcing-analytics',
        title: 'Sourcing Analytics',
        url: '/buyer/analytics',
        icon: TrendingUp,
        description: 'Analyze your sourcing performance',
        category: 'analytics',
        priority: 1,
        keywords: ['sourcing', 'performance', 'analytics']
      },
      {
        id: 'spending-analysis',
        title: 'Spending Analysis',
        url: '/buyer/analytics/spending',
        icon: DollarSign,
        description: 'Track and analyze spending patterns',
        category: 'analytics',
        priority: 2,
        keywords: ['spending', 'costs', 'budget']
      },
      {
        id: 'supplier-performance',
        title: 'Supplier Performance',
        url: '/buyer/analytics/suppliers',
        icon: Star,
        description: 'Evaluate supplier performance',
        category: 'analytics',
        priority: 3,
        keywords: ['suppliers', 'performance', 'ratings']
      }
    ]
  },

  // Account & Settings
  {
    id: 'account',
    title: 'Account & Settings',
    url: '/buyer/settings',
    icon: Settings,
    description: 'Account settings and preferences',
    category: 'settings',
    priority: 7,
    keywords: ['settings', 'account', 'preferences'],
    children: [
      {
        id: 'profile',
        title: 'Profile Settings',
        url: '/buyer/profile',
        icon: Users,
        description: 'Manage your profile information',
        category: 'settings',
        priority: 1,
        keywords: ['profile', 'information', 'details']
      },
      {
        id: 'notifications',
        title: 'Notifications',
        url: '/buyer/notifications',
        icon: Bell,
        description: 'Notification preferences',
        category: 'settings',
        priority: 2,
        keywords: ['notifications', 'alerts', 'preferences']
      },
      {
        id: 'preferences',
        title: 'Preferences',
        url: '/buyer/preferences',
        icon: Settings,
        description: 'Platform preferences and settings',
        category: 'settings',
        priority: 3,
        keywords: ['preferences', 'settings', 'configuration']
      }
    ]
  }
];

export function BuyerNavigation({ 
  className, 
  compact = false, 
  pendingCounts 
}: BuyerNavigationProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(['product-discovery', 'rfqs-inquiries', 'orders'])
  );
  const [favoriteItems, setFavoriteItems] = useState<Set<string>>(
    new Set(['dashboard', 'browse-products', 'rfqs-all'])
  );

  // Add pending counts to badges
  const menuItemsWithCounts = useMemo(() => {
    const updateBadges = (items: BuyerMenuItem[]): BuyerMenuItem[] => {
      return items.map(item => ({
        ...item,
        badge: item.id === 'inquiries-all' && pendingCounts?.inquiries ? 
          { text: pendingCounts.inquiries.toString(), variant: 'outline' as const } :
          item.id === 'messages-all' && pendingCounts?.messages ?
          { text: pendingCounts.messages.toString(), variant: 'destructive' as const } :
          item.id === 'orders-pending' && pendingCounts?.orders ?
          { text: pendingCounts.orders.toString(), variant: 'destructive' as const } :
          item.badge,
        children: item.children ? updateBadges(item.children) : undefined
      }));
    };

    return updateBadges(buyerMenuStructure);
  }, [pendingCounts]);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const results: BuyerMenuItem[] = [];
    
    const searchItems = (items: BuyerMenuItem[], parentPath: string[] = []) => {
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
    
    searchItems(menuItemsWithCounts);
    return results.slice(0, 8);
  }, [searchQuery, menuItemsWithCounts]);

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

  const renderMenuItem = (item: BuyerMenuItem, level: number = 0) => {
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
                placeholder="Search buyer functions..."
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
            {menuItemsWithCounts.map(item => renderMenuItem(item))}
          </div>
        </div>
      </div>

      {/* Command Palette */}
      <Dialog open={showCommandPalette} onOpenChange={setShowCommandPalette}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Command className="h-5 w-5" />
              Buyer Command Palette
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