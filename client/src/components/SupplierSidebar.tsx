import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  FileText,
  MessageSquare,
  ShoppingCart,
  Store,
  DollarSign,
  BarChart3,
  Settings,
  Star,
  TrendingUp,
  Inbox,
  Send,
  Gavel,
  Handshake,
  User
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

// Fetch notification counts from API
function useNotificationCounts() {
  return useQuery({
    queryKey: ['/api/suppliers/dashboard/stats'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

const supplierMenuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/supplier/dashboard",
    badgeKey: null,
  },
  {
    title: "Products",
    icon: Package,
    href: "/supplier/products",
    badgeKey: null,
  },
  {
    title: "Inquiries",
    icon: Inbox,
    href: "/supplier/inquiries",
    badgeKey: "pendingInquiries",
  },
  {
    title: "RFQs",
    icon: FileText,
    href: "/supplier/rfqs",
    badgeKey: "newRfqs",
  },
  {
    title: "Auctions",
    icon: Gavel,
    href: "/supplier/auctions",
    badgeKey: null,
  },
  {
    title: "Negotiations",
    icon: Handshake,
    href: "/supplier/negotiations",
    badgeKey: null,
  },
  {
    title: "Quotations",
    icon: Send,
    href: "/supplier/quotations",
    badgeKey: null,
  },
  {
    title: "Orders",
    icon: ShoppingCart,
    href: "/supplier/orders",
    badgeKey: "pendingOrders",
  },
  {
    title: "Messages",
    icon: MessageSquare,
    href: "/supplier/messages",
    badgeKey: null,
  },
];

const storeMenuItems = [
  {
    title: "Store Profile",
    icon: Store,
    href: "/supplier/store",
  },
  {
    title: "Supplier Profile",
    icon: User,
    href: "/supplier/profile",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    href: "/supplier/analytics",
  },
  {
    title: "Reviews",
    icon: Star,
    href: "/supplier/reviews",
  },
];

const financeMenuItems = [
  {
    title: "Commissions",
    icon: DollarSign,
    href: "/supplier/commissions",
  },
  {
    title: "Payouts",
    icon: TrendingUp,
    href: "/supplier/payouts",
  },
];

export function SupplierSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { data: stats } = useNotificationCounts();

  const isActive = (href: string) => {
    if (href === "/supplier/dashboard") {
      return location === href;
    }
    return location.startsWith(href);
  };

  // Get badge count for a menu item
  const getBadgeCount = (badgeKey: string | null): number | null => {
    if (!badgeKey || !stats) return null;
    
    // Map badge keys to stats data
    const count = stats[badgeKey as keyof typeof stats];
    return typeof count === 'number' && count > 0 ? count : null;
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/supplier/dashboard">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Supplier Portal
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {supplierMenuItems.map((item) => {
                const badgeCount = getBadgeCount(item.badgeKey);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      className={cn(
                        "w-full justify-start gap-3 px-3 py-2.5",
                        isActive(item.href) &&
                          "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                        {badgeCount !== null && (
                          <Badge
                            variant="destructive"
                            className="ml-auto text-xs px-1.5 py-0.5 min-w-[20px] justify-center"
                          >
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Store Management */}
        <SidebarGroup>
          <SidebarGroupLabel>Store Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {storeMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    className={cn(
                      "w-full justify-start gap-3 px-3 py-2.5",
                      isActive(item.href) &&
                        "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Finance */}
        <SidebarGroup>
          <SidebarGroupLabel>Finance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financeMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    className={cn(
                      "w-full justify-start gap-3 px-3 py-2.5",
                      isActive(item.href) &&
                        "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/supplier/settings")}
                  className={cn(
                    "w-full justify-start gap-3 px-3 py-2.5",
                    isActive("/supplier/settings") &&
                      "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold"
                  )}
                >
                  <Link href="/supplier/settings">
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          <p>Supplier Portal v1.0</p>
          <Link href="/help">
            <span className="text-blue-600 hover:text-blue-700 cursor-pointer">
              Need Help?
            </span>
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
