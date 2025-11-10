import React from "react";
import { SupplierTopNav } from "@/components/SupplierTopNav";
import { cn } from "@/lib/utils";

interface SupplierLayoutProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  notificationCount?: number;
}

/**
 * SupplierLayout - Wrapper component for all supplier pages
 * Provides consistent layout with top navigation and content area
 * The sidebar is managed by SidebarProvider in App.tsx
 */
export function SupplierLayout({ 
  children, 
  title,
  className,
  notificationCount = 0
}: SupplierLayoutProps) {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Top Navigation */}
      <SupplierTopNav title={title} notificationCount={notificationCount} />
      
      {/* Main Content Area */}
      <main 
        className={cn(
          "flex-1 overflow-auto",
          "p-4 md:p-6 lg:p-8",
          "bg-gray-50 dark:bg-gray-950",
          className
        )}
      >
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
