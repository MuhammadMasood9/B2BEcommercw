import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { Button } from "@/components/ui/button";
import { Settings, Minimize2, Maximize2 } from "lucide-react";
import { useAdminNavigation } from "@/hooks/useAdminNavigation";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const { 
    navigationState, 
    toggleCompactMode, 
    toggleSidebarCollapsed 
  } = useAdminNavigation();
  
  return (
    <Sidebar 
      className={cn(
        "transition-all duration-300",
        navigationState.sidebarCollapsed && "w-16"
      )}
    >
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center justify-between">
          {!navigationState.sidebarCollapsed && (
            <h2 className="text-lg font-semibold">Admin Panel</h2>
          )}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={toggleCompactMode}
              title={navigationState.compactMode ? "Expand view" : "Compact view"}
            >
              {navigationState.compactMode ? (
                <Maximize2 className="h-3 w-3" />
              ) : (
                <Minimize2 className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={toggleSidebarCollapsed}
              title={navigationState.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-0">
        <AdminNavigation 
          compact={navigationState.compactMode || navigationState.sidebarCollapsed}
          className="h-full"
        />
      </SidebarContent>
    </Sidebar>
  );
}
