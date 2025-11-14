import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ReactNode } from "react";

interface Tab {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface ModernTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function ModernTabs({ tabs, activeTab, onTabChange, children, className = "" }: ModernTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className={`space-y-6 ${className}`}>
      <TabsList className="inline-flex h-12 items-center justify-start rounded-lg bg-gray-100 p-1 w-full">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-brand-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-gray-200 data-[state=active]:hover:bg-brand-orange-600"
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}

// Alternative pill-style tabs
export function PillTabs({ tabs, activeTab, onTabChange, children, className = "" }: ModernTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className={`space-y-6 ${className}`}>
      <TabsList className="inline-flex h-11 items-center justify-start rounded-full bg-white border border-gray-200 p-1 shadow-sm">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-brand-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-50 data-[state=active]:hover:bg-brand-orange-600"
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}

// Underline-style tabs
export function UnderlineTabs({ tabs, activeTab, onTabChange, children, className = "" }: ModernTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className={`space-y-6 ${className}`}>
      <TabsList className="inline-flex h-12 items-center justify-start border-b border-gray-200 bg-transparent p-0 w-full">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap border-b-2 border-transparent px-6 py-3 text-sm font-medium text-gray-600 transition-all hover:text-brand-orange-600 hover:border-brand-orange-200 data-[state=active]:border-brand-orange-500 data-[state=active]:text-brand-orange-600 data-[state=active]:bg-brand-orange-50/50"
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}
