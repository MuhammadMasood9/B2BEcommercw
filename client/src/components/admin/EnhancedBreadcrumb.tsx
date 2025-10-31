import React from "react";
import { Link, useLocation } from "wouter";
import { ChevronRight, Home, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<any>;
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  description?: string;
  actions?: Array<{
    label: string;
    icon?: React.ComponentType<any>;
    onClick: () => void;
  }>;
}

interface EnhancedBreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  showCopyLink?: boolean;
  showShareLink?: boolean;
  className?: string;
  maxItems?: number;
}

// Route mapping for automatic breadcrumb generation
const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/admin': [
    { label: 'Dashboard', href: '/admin' }
  ],
  '/admin/suppliers': [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Supplier Management', href: '/admin/suppliers' }
  ],
  '/admin/suppliers/pending': [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Supplier Management', href: '/admin/suppliers' },
    { label: 'Pending Approvals', href: '/admin/suppliers/pending', badge: { text: '5', variant: 'destructive' } }
  ],
  '/admin/products': [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Product Management', href: '/admin/products' }
  ],
  '/admin/orders': [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Order Management', href: '/admin/orders' }
  ],
  '/admin/financial': [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Financial Management', href: '/admin/financial' }
  ],
  '/admin/commission': [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Financial Management', href: '/admin/financial' },
    { label: 'Commission Management', href: '/admin/commission' }
  ],
  '/admin/payouts': [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Financial Management', href: '/admin/financial' },
    { label: 'Payout Management', href: '/admin/payouts', badge: { text: '8', variant: 'outline' } }
  ],
  '/admin/monitoring': [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Analytics & Reports', href: '/admin/analytics' },
    { label: 'Platform Monitoring', href: '/admin/monitoring' }
  ],
  '/admin/users': [
    { label: 'Dashboard', href: '/admin' },
    { label: 'User Management', href: '/admin/users' }
  ],
  '/admin/access-management': [
    { label: 'Dashboard', href: '/admin' },
    { label: 'User Management', href: '/admin/users' },
    { label: 'Access Management', href: '/admin/access-management', badge: { text: 'New', variant: 'secondary' } }
  ],
  '/admin/compliance': [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Compliance & Security', href: '/admin/compliance' }
  ],
  '/admin/settings': [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Platform Settings', href: '/admin/settings' }
  ]
};

export function EnhancedBreadcrumb({
  items: providedItems,
  showHome = true,
  showCopyLink = true,
  showShareLink = false,
  className,
  maxItems = 5
}: EnhancedBreadcrumbProps) {
  const [location] = useLocation();
  
  // Use provided items or generate from route mapping
  const items = providedItems.length > 0 
    ? providedItems 
    : routeMapping[location] || [{ label: 'Dashboard', href: '/admin' }];

  // Truncate items if they exceed maxItems
  const displayItems = items.length > maxItems 
    ? [
        items[0], // Always show first item
        { label: '...', href: undefined }, // Ellipsis
        ...items.slice(-(maxItems - 2)) // Show last items
      ]
    : items;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const copyCurrentLink = () => {
    navigator.clipboard.writeText(currentUrl);
    toast.success('Link copied to clipboard');
  };

  const shareCurrentLink = () => {
    if (navigator.share) {
      navigator.share({
        title: items[items.length - 1]?.label || 'Admin Panel',
        url: currentUrl
      });
    } else {
      copyCurrentLink();
    }
  };

  const renderBreadcrumbItem = (item: BreadcrumbItem, index: number, isLast: boolean) => {
    if (item.label === '...') {
      return (
        <DropdownMenu key={index}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-muted-foreground">
              ...
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {items.slice(1, -(maxItems - 2)).map((hiddenItem, hiddenIndex) => (
              <DropdownMenuItem key={hiddenIndex} asChild>
                <Link href={hiddenItem.href || '#'} className="flex items-center">
                  {hiddenItem.icon && <hiddenItem.icon className="h-4 w-4 mr-2" />}
                  {hiddenItem.label}
                  {hiddenItem.badge && (
                    <Badge variant={hiddenItem.badge.variant} className="ml-2 text-xs">
                      {hiddenItem.badge.text}
                    </Badge>
                  )}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    const content = (
      <div className="flex items-center">
        {item.icon && <item.icon className="h-4 w-4 mr-1" />}
        <span className={cn(
          "text-sm",
          isLast ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
        )}>
          {item.label}
        </span>
        {item.badge && (
          <Badge variant={item.badge.variant} className="ml-2 text-xs">
            {item.badge.text}
          </Badge>
        )}
      </div>
    );

    if (item.href && !isLast) {
      return (
        <Link key={index} href={item.href} className="transition-colors">
          {content}
        </Link>
      );
    }

    if (item.actions && item.actions.length > 0) {
      return (
        <DropdownMenu key={index}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-auto p-1">
              {content}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {item.description && (
              <>
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  {item.description}
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            {item.actions.map((action, actionIndex) => (
              <DropdownMenuItem key={actionIndex} onClick={action.onClick}>
                {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <div key={index}>
        {content}
      </div>
    );
  };

  return (
    <nav className={cn("flex items-center space-x-1 text-sm", className)} aria-label="Breadcrumb">
      {showHome && (
        <>
          <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          {displayItems.length > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </>
      )}
      
      {displayItems.map((item, index) => {
        const isLast = index === displayItems.length - 1;
        
        return (
          <React.Fragment key={index}>
            {renderBreadcrumbItem(item, index, isLast)}
            {!isLast && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </React.Fragment>
        );
      })}

      {/* Action buttons */}
      {(showCopyLink || showShareLink) && (
        <div className="flex items-center ml-4 space-x-1">
          {showCopyLink && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={copyCurrentLink}
              title="Copy link"
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
          
          {showShareLink && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={shareCurrentLink}
              title="Share link"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </nav>
  );
}

// Hook for automatic breadcrumb generation
export function useAutoBreadcrumb(): BreadcrumbItem[] {
  const [location] = useLocation();
  return routeMapping[location] || [{ label: 'Dashboard', href: '/admin' }];
}

// Utility function to generate breadcrumbs from path
export function generateBreadcrumbsFromPath(path: string): BreadcrumbItem[] {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];
  
  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Convert segment to readable label
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    breadcrumbs.push({
      label,
      href: index === segments.length - 1 ? undefined : currentPath
    });
  });
  
  return breadcrumbs;
}

export default EnhancedBreadcrumb;