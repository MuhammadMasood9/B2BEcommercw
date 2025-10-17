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
  FileText
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
    title: "Customer Inquiries",
    url: "/admin/inquiries",
    icon: MessageSquare,
  },
  {
    title: "Quotations",
    url: "/admin/quotations",
    icon: FileSpreadsheet,
  },
  {
    title: "RFQs",
    url: "/admin/rfqs",
    icon: FileText,
  },
  {
    title: "Orders",
    url: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "Customers",
    url: "/admin/customers",
    icon: Users,
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
