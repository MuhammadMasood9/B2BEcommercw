import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  Menu, 
  X, 
  Search, 
  Bell, 
  Settings, 
  User, 
  ChevronDown,
  Maximize2,
  Minimize2,
  Monitor,
  Smartphone,
  Tablet,
  Laptop
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AdminNavigation } from "./AdminNavigation";
import { EnhancedBreadcrumb } from "./EnhancedBreadcrumb";
import KeyboardShortcuts from "./KeyboardShortcuts";
import AdminThemeCustomizer from "./AdminThemeCustomizer";
import PWAInstaller from "./PWAInstaller";
import { useAdminNavigation, useAdminKeyboardShortcuts } from "@/hooks/useAdminNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface ResponsiveAdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbItems?: Array<{
    label: string;
    href?: string;
  }>;
}

// Breakpoint detection hook
function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return breakpoint;
}

// Touch gesture hook for mobile interactions
function useTouchGestures() {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > 50;
    const isRightSwipe = distanceX < -50;
    const isUpSwipe = distanceY > 50;
    const isDownSwipe = distanceY < -50;

    return { isLeftSwipe, isRightSwipe, isUpSwipe, isDownSwipe };
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}

export function ResponsiveAdminLayout({
  children,
  title,
  subtitle,
  actions,
  breadcrumbItems = []
}: ResponsiveAdminLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const breakpoint = useBreakpoint();
  const { onTouchStart, onTouchMove, onTouchEnd } = useTouchGestures();
  const { 
    navigationState, 
    toggleSidebarCollapsed,
    toggleCompactMode 
  } = useAdminNavigation();
  const { 
    commandPaletteOpen, 
    setCommandPaletteOpen 
  } = useAdminKeyboardShortcuts();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notifications] = useState([
    { id: 1, title: "New supplier application", type: "info", unread: true },
    { id: 2, title: "Payment processed", type: "success", unread: true },
    { id: 3, title: "System maintenance scheduled", type: "warning", unread: false }
  ]);

  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';
  const isDesktop = breakpoint === 'desktop';

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle touch gestures for mobile navigation
  const handleTouchEnd = () => {
    const gestures = onTouchEnd();
    if (gestures?.isRightSwipe && isMobile) {
      setMobileMenuOpen(true);
    }
    if (gestures?.isLeftSwipe && isMobile && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  // Get unread notifications count
  const unreadCount = notifications.filter(n => n.unread).length;

  // Responsive header component
  const Header = () => (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex h-14 lg:h-16 items-center px-4 lg:px-6">
        {/* Mobile menu trigger */}
        {(isMobile || isTablet) && (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="mr-2 lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Admin Panel</SheetTitle>
              </SheetHeader>
              <AdminNavigation compact={false} className="h-full" />
            </SheetContent>
          </Sheet>
        )}

        {/* Desktop sidebar toggle */}
        {isDesktop && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebarCollapsed}
            className="mr-2"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}

        {/* Breadcrumbs */}
        <div className="flex-1 min-w-0">
          <EnhancedBreadcrumb 
            items={breadcrumbItems}
            className="hidden sm:flex"
            maxItems={isMobile ? 2 : isTablet ? 3 : 5}
          />
          {/* Mobile title */}
          {isMobile && title && (
            <h1 className="text-lg font-semibold truncate sm:hidden">{title}</h1>
          )}
        </div>

        {/* Search - Hidden on mobile, shown on tablet+ */}
        {!isMobile && (
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
                onFocus={() => setCommandPaletteOpen(true)}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile search */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCommandPaletteOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
          )}

          {/* Responsive view toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden lg:flex">
                {breakpoint === 'mobile' && <Smartphone className="h-4 w-4" />}
                {breakpoint === 'tablet' && <Tablet className="h-4 w-4" />}
                {breakpoint === 'desktop' && <Monitor className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>View Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleCompactMode}>
                {navigationState.compactMode ? <Maximize2 className="h-4 w-4 mr-2" /> : <Minimize2 className="h-4 w-4 mr-2" />}
                {navigationState.compactMode ? 'Expand' : 'Compact'} View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleFullscreen}>
                <Monitor className="h-4 w-4 mr-2" />
                {isFullscreen ? 'Exit' : 'Enter'} Fullscreen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.slice(0, 5).map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex items-start p-3">
                  <div className="flex-1">
                    <div className="font-medium">{notification.title}</div>
                    <div className="text-sm text-muted-foreground">Just now</div>
                  </div>
                  {notification.unread && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={user?.firstName} />
                  <AvatarFallback>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* PWA Installer */}
          <PWAInstaller />
          
          {/* Keyboard Shortcuts */}
          <KeyboardShortcuts />
          
          {/* Theme Customizer */}
          <AdminThemeCustomizer />

          {/* Custom actions */}
          {actions}
        </div>
      </div>
    </header>
  );

  // Page header component
  const PageHeader = () => (
    <>
      {(title || subtitle) && (
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-4 lg:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                {title && (
                  <h1 className="text-2xl lg:text-3xl font-bold tracking-tight truncate">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-muted-foreground mt-1 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div 
      className="flex h-screen bg-background"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Desktop Sidebar */}
      {isDesktop && !navigationState.sidebarCollapsed && (
        <div className={cn(
          "hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:bg-background/95 lg:backdrop-blur",
          navigationState.compactMode && "lg:w-16"
        )}>
          <div className="p-4 border-b">
            <h2 className={cn(
              "text-lg font-semibold",
              navigationState.compactMode && "sr-only"
            )}>
              Admin Panel
            </h2>
          </div>
          <AdminNavigation 
            compact={navigationState.compactMode}
            className="flex-1"
          />
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <PageHeader />
        
        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className={cn(
            "h-full",
            isMobile ? "p-4" : isTablet ? "p-6" : "p-8"
          )}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ResponsiveAdminLayout;