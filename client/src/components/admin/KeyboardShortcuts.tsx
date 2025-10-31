import React, { useState, useEffect } from "react";
import { 
  Keyboard, 
  Command, 
  Search, 
  Home, 
  Package, 
  Users, 
  ShoppingCart, 
  BarChart3,
  Settings,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface KeyboardShortcut {
  id: string;
  keys: string[];
  description: string;
  category: 'navigation' | 'actions' | 'search' | 'general';
  action?: () => void;
  icon?: React.ComponentType<any>;
}

const shortcuts: KeyboardShortcut[] = [
  // Navigation shortcuts
  {
    id: 'dashboard',
    keys: ['Ctrl', 'Shift', 'D'],
    description: 'Go to Dashboard',
    category: 'navigation',
    icon: Home,
    action: () => window.location.href = '/admin'
  },
  {
    id: 'suppliers',
    keys: ['Ctrl', 'Shift', 'S'],
    description: 'Go to Suppliers',
    category: 'navigation',
    icon: Users,
    action: () => window.location.href = '/admin/suppliers'
  },
  {
    id: 'products',
    keys: ['Ctrl', 'Shift', 'P'],
    description: 'Go to Products',
    category: 'navigation',
    icon: Package,
    action: () => window.location.href = '/admin/products'
  },
  {
    id: 'orders',
    keys: ['Ctrl', 'Shift', 'O'],
    description: 'Go to Orders',
    category: 'navigation',
    icon: ShoppingCart,
    action: () => window.location.href = '/admin/orders'
  },
  {
    id: 'analytics',
    keys: ['Ctrl', 'Shift', 'A'],
    description: 'Go to Analytics',
    category: 'navigation',
    icon: BarChart3,
    action: () => window.location.href = '/admin/monitoring'
  },
  {
    id: 'settings',
    keys: ['Ctrl', 'Shift', ','],
    description: 'Go to Settings',
    category: 'navigation',
    icon: Settings,
    action: () => window.location.href = '/admin/settings'
  },

  // Search shortcuts
  {
    id: 'command-palette',
    keys: ['Ctrl', 'K'],
    description: 'Open Command Palette',
    category: 'search',
    icon: Command
  },
  {
    id: 'quick-search',
    keys: ['Ctrl', '/'],
    description: 'Quick Search',
    category: 'search',
    icon: Search
  },
  {
    id: 'global-search',
    keys: ['Ctrl', 'Shift', 'F'],
    description: 'Global Search',
    category: 'search',
    icon: Search
  },

  // General shortcuts
  {
    id: 'help',
    keys: ['?'],
    description: 'Show Keyboard Shortcuts',
    category: 'general',
    icon: Keyboard
  },
  {
    id: 'escape',
    keys: ['Esc'],
    description: 'Close Modal/Cancel',
    category: 'general'
  },
  {
    id: 'refresh',
    keys: ['Ctrl', 'R'],
    description: 'Refresh Page',
    category: 'general'
  },

  // Action shortcuts
  {
    id: 'new-item',
    keys: ['Ctrl', 'N'],
    description: 'Create New Item',
    category: 'actions'
  },
  {
    id: 'save',
    keys: ['Ctrl', 'S'],
    description: 'Save Changes',
    category: 'actions'
  },
  {
    id: 'delete',
    keys: ['Del'],
    description: 'Delete Selected Item',
    category: 'actions'
  },
  {
    id: 'select-all',
    keys: ['Ctrl', 'A'],
    description: 'Select All Items',
    category: 'actions'
  }
];

interface KeyboardShortcutsProps {
  className?: string;
}

export function KeyboardShortcuts({ className }: KeyboardShortcutsProps) {
  const [open, setOpen] = useState(false);
  const [activeShortcuts, setActiveShortcuts] = useState<Set<string>>(new Set());

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show help with '?' key
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setOpen(true);
        return;
      }

      // Handle other shortcuts
      shortcuts.forEach(shortcut => {
        if (shortcut.action) {
          const keys = shortcut.keys.map(k => k.toLowerCase());
          const isCtrl = keys.includes('ctrl') && (e.ctrlKey || e.metaKey);
          const isShift = keys.includes('shift') && e.shiftKey;
          const isAlt = keys.includes('alt') && e.altKey;
          const key = e.key.toLowerCase();

          // Check if all required keys match
          let matches = true;
          
          if (keys.includes('ctrl') && !isCtrl) matches = false;
          if (keys.includes('shift') && !isShift) matches = false;
          if (keys.includes('alt') && !isAlt) matches = false;
          
          // Check the main key
          const mainKey = keys.find(k => !['ctrl', 'shift', 'alt'].includes(k));
          if (mainKey && mainKey !== key) matches = false;

          if (matches) {
            e.preventDefault();
            shortcut.action();
            
            // Visual feedback
            setActiveShortcuts(prev => new Set([...prev, shortcut.id]));
            setTimeout(() => {
              setActiveShortcuts(prev => {
                const newSet = new Set(prev);
                newSet.delete(shortcut.id);
                return newSet;
              });
            }, 200);
          }
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderKey = (key: string) => (
    <Badge 
      key={key} 
      variant="outline" 
      className="px-2 py-1 text-xs font-mono bg-muted"
    >
      {key === 'Ctrl' ? (navigator.platform.includes('Mac') ? '⌘' : 'Ctrl') : key}
    </Badge>
  );

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  const categoryLabels = {
    navigation: 'Navigation',
    search: 'Search & Find',
    actions: 'Actions',
    general: 'General'
  };

  const categoryIcons = {
    navigation: Home,
    search: Search,
    actions: Package,
    general: Keyboard
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("gap-2", className)}
          title="Keyboard Shortcuts (Press ? for help)"
        >
          <Keyboard className="h-4 w-4" />
          <span className="hidden sm:inline">Shortcuts</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
            <Badge variant="outline" className="ml-auto">Press ? anytime</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons];
            
            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <h3 className="font-semibold">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </h3>
                </div>
                
                <div className="space-y-2">
                  {categoryShortcuts.map(shortcut => (
                    <div 
                      key={shortcut.id}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-md transition-colors",
                        activeShortcuts.has(shortcut.id) && "bg-accent",
                        "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {shortcut.icon && (
                          <shortcut.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="text-sm truncate">{shortcut.description}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {shortcut.keys.map(renderKey)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <Separator className="my-6" />

        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium">Tips:</p>
          <ul className="space-y-1 ml-4">
            <li>• Press <Badge variant="outline" className="mx-1 text-xs">?</Badge> anytime to show this help</li>
            <li>• Use <Badge variant="outline" className="mx-1 text-xs">Ctrl</Badge> + <Badge variant="outline" className="mx-1 text-xs">K</Badge> to open the command palette</li>
            <li>• Most shortcuts work globally across the admin panel</li>
            <li>• On Mac, <Badge variant="outline" className="mx-1 text-xs">Ctrl</Badge> is replaced with <Badge variant="outline" className="mx-1 text-xs">⌘</Badge></li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook for registering custom shortcuts
export function useKeyboardShortcut(
  keys: string[],
  callback: () => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const normalizedKeys = keys.map(k => k.toLowerCase());
      const isCtrl = normalizedKeys.includes('ctrl') && (e.ctrlKey || e.metaKey);
      const isShift = normalizedKeys.includes('shift') && e.shiftKey;
      const isAlt = normalizedKeys.includes('alt') && e.altKey;
      const key = e.key.toLowerCase();

      let matches = true;
      
      if (normalizedKeys.includes('ctrl') && !isCtrl) matches = false;
      if (normalizedKeys.includes('shift') && !isShift) matches = false;
      if (normalizedKeys.includes('alt') && !isAlt) matches = false;
      
      const mainKey = normalizedKeys.find(k => !['ctrl', 'shift', 'alt'].includes(k));
      if (mainKey && mainKey !== key) matches = false;

      if (matches) {
        e.preventDefault();
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, deps);
}

export default KeyboardShortcuts;