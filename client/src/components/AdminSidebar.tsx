import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { CleanAdminSidebar } from "@/components/admin/CleanAdminSidebar";

export function AdminSidebar() {
  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-0">
        <div className="px-3 py-2 border-b">
          <h2 className="text-sm font-semibold text-foreground">Admin Panel</h2>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-0">
        <CleanAdminSidebar />
      </SidebarContent>
    </Sidebar>
  );
}
