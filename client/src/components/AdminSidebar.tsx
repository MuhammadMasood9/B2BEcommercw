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
  CheckCircle,
  DollarSign
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
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";

const adminMenuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Suppliers",
    url: "/admin/suppliers",
    icon: Store,
  },
  {
    title: "Product Approval",
    url: "/admin/product-approval",
    icon: CheckCircle,
  },
  {
    title: "Products",
    url: "/admin/products",
    icon: Package,
  },
  {
    title: "Bulk Upload",
    url: "/admin/bulk-upload",
    icon: Upload,
  },
  {
    title: "Categories",
    url: "/admin/categories",
    icon: FolderTree,
  },
  {
    title: "Orders",
    url: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "Commissions",
    url: "/admin/commissions",
    icon: DollarSign,
  },
  {
    title: "Payouts",
    url: "/admin/payouts",
    icon: DollarSign,
  },
  {
    title: "Payment Verification",
    url: "/admin/commission-payments",
    icon: DollarSign,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: UserCog,
    children: [
      {
        title: "All Users",
        url: "/admin/users",
        icon: Users,
      },
      {
        title: "Add User",
        url: "/admin/users/add",
        icon: UserPlus,
      },
      {
        title: "Import/Export",
        url: "/admin/users/import-export",
        icon: FileSpreadsheet,
      },
    ]
  },
  {
    title: "Reports",
    url: "/admin/reports",
    icon: BarChart3,
  },
  {
    title: "Chat Management",
    url: "/admin/chat",
    icon: MessageSquare,
  },
  {
    title: "Notifications",
    url: "/admin/notifications",
    icon: Bell,
  },
  {
    title: "Activity Log",
    url: "/admin/activity-log",
    icon: Activity,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const [location] = useLocation();
  
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-admin-${item.title.toLowerCase().replace(' ', '-')}`}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
