import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";

interface NavigationPreferences {
  expandedItems: Set<string>;
  favoriteItems: Set<string>;
  recentItems: string[];
  hiddenItems: Set<string>;
  compactMode: boolean;
  sidebarCollapsed: boolean;
}

interface NavigationState extends NavigationPreferences {
  currentPath: string;
  breadcrumbs: Array<{
    label: string;
    href?: string;
  }>;
}

const STORAGE_KEY = 'admin-navigation-preferences';
const MAX_RECENT_ITEMS = 10;

// Default navigation preferences
const defaultPreferences: NavigationPreferences = {
  expandedItems: new Set(['suppliers', 'products', 'orders', 'financial']),
  favoriteItems: new Set(['dashboard', 'suppliers-pending', 'orders-inquiries']),
  recentItems: [],
  hiddenItems: new Set(),
  compactMode: false,
  sidebarCollapsed: false
};

export function useAdminNavigation() {
  const [location] = useLocation();
  const [navigationState, setNavigationState] = useState<NavigationState>(() => {
    // Load preferences from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    const preferences = stored ? JSON.parse(stored) : defaultPreferences;
    
    // Convert arrays back to Sets
    return {
      ...preferences,
      expandedItems: new Set(preferences.expandedItems || []),
      favoriteItems: new Set(preferences.favoriteItems || []),
      hiddenItems: new Set(preferences.hiddenItems || []),
      currentPath: location,
      breadcrumbs: []
    };
  });

  // Save preferences to localStorage
  const savePreferences = useCallback((state: NavigationState) => {
    const preferences = {
      expandedItems: Array.from(state.expandedItems),
      favoriteItems: Array.from(state.favoriteItems),
      recentItems: state.recentItems,
      hiddenItems: Array.from(state.hiddenItems),
      compactMode: state.compactMode,
      sidebarCollapsed: state.sidebarCollapsed
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, []);

  // Update current path and recent items when location changes
  useEffect(() => {
    setNavigationState(prev => {
      const newState = {
        ...prev,
        currentPath: location
      };

      // Add to recent items if it's a new path
      if (location !== prev.currentPath && location.startsWith('/admin')) {
        const pathSegments = location.split('/');
        const pageId = pathSegments[pathSegments.length - 1] || 'dashboard';
        
        newState.recentItems = [
          pageId,
          ...prev.recentItems.filter(item => item !== pageId)
        ].slice(0, MAX_RECENT_ITEMS);
      }

      savePreferences(newState);
      return newState;
    });
  }, [location, savePreferences]);

  // Navigation actions
  const toggleExpanded = useCallback((itemId: string) => {
    setNavigationState(prev => {
      const newState = {
        ...prev,
        expandedItems: prev.expandedItems.has(itemId)
          ? new Set([...prev.expandedItems].filter(id => id !== itemId))
          : new Set([...prev.expandedItems, itemId])
      };
      savePreferences(newState);
      return newState;
    });
  }, [savePreferences]);

  const toggleFavorite = useCallback((itemId: string) => {
    setNavigationState(prev => {
      const newState = {
        ...prev,
        favoriteItems: prev.favoriteItems.has(itemId)
          ? new Set([...prev.favoriteItems].filter(id => id !== itemId))
          : new Set([...prev.favoriteItems, itemId])
      };
      savePreferences(newState);
      return newState;
    });
  }, [savePreferences]);

  const toggleHidden = useCallback((itemId: string) => {
    setNavigationState(prev => {
      const newState = {
        ...prev,
        hiddenItems: prev.hiddenItems.has(itemId)
          ? new Set([...prev.hiddenItems].filter(id => id !== itemId))
          : new Set([...prev.hiddenItems, itemId])
      };
      savePreferences(newState);
      return newState;
    });
  }, [savePreferences]);

  const toggleCompactMode = useCallback(() => {
    setNavigationState(prev => {
      const newState = {
        ...prev,
        compactMode: !prev.compactMode
      };
      savePreferences(newState);
      return newState;
    });
  }, [savePreferences]);

  const toggleSidebarCollapsed = useCallback(() => {
    setNavigationState(prev => {
      const newState = {
        ...prev,
        sidebarCollapsed: !prev.sidebarCollapsed
      };
      savePreferences(newState);
      return newState;
    });
  }, [savePreferences]);

  const addToFavorites = useCallback((itemId: string) => {
    setNavigationState(prev => {
      const newState = {
        ...prev,
        favoriteItems: new Set([...prev.favoriteItems, itemId])
      };
      savePreferences(newState);
      return newState;
    });
  }, [savePreferences]);

  const removeFromFavorites = useCallback((itemId: string) => {
    setNavigationState(prev => {
      const newState = {
        ...prev,
        favoriteItems: new Set([...prev.favoriteItems].filter(id => id !== itemId))
      };
      savePreferences(newState);
      return newState;
    });
  }, [savePreferences]);

  const clearRecentItems = useCallback(() => {
    setNavigationState(prev => {
      const newState = {
        ...prev,
        recentItems: []
      };
      savePreferences(newState);
      return newState;
    });
  }, [savePreferences]);

  const resetPreferences = useCallback(() => {
    setNavigationState(prev => {
      const newState = {
        ...defaultPreferences,
        expandedItems: new Set(defaultPreferences.expandedItems),
        favoriteItems: new Set(defaultPreferences.favoriteItems),
        hiddenItems: new Set(defaultPreferences.hiddenItems),
        currentPath: prev.currentPath,
        breadcrumbs: prev.breadcrumbs
      };
      savePreferences(newState);
      return newState;
    });
  }, [savePreferences]);

  // Utility functions
  const isExpanded = useCallback((itemId: string) => {
    return navigationState.expandedItems.has(itemId);
  }, [navigationState.expandedItems]);

  const isFavorite = useCallback((itemId: string) => {
    return navigationState.favoriteItems.has(itemId);
  }, [navigationState.favoriteItems]);

  const isHidden = useCallback((itemId: string) => {
    return navigationState.hiddenItems.has(itemId);
  }, [navigationState.hiddenItems]);

  const isActive = useCallback((path: string) => {
    return navigationState.currentPath === path;
  }, [navigationState.currentPath]);

  const isParentActive = useCallback((basePath: string) => {
    return navigationState.currentPath.startsWith(basePath);
  }, [navigationState.currentPath]);

  return {
    // State
    navigationState,
    
    // Actions
    toggleExpanded,
    toggleFavorite,
    toggleHidden,
    toggleCompactMode,
    toggleSidebarCollapsed,
    addToFavorites,
    removeFromFavorites,
    clearRecentItems,
    resetPreferences,
    
    // Utilities
    isExpanded,
    isFavorite,
    isHidden,
    isActive,
    isParentActive
  };
}

// Hook for keyboard shortcuts
export function useAdminKeyboardShortcuts() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette: Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      
      // Quick search: Cmd/Ctrl + /
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setQuickSearchOpen(true);
      }
      
      // Close modals: Escape
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setQuickSearchOpen(false);
      }
      
      // Quick navigation shortcuts
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        switch (e.key) {
          case 'D':
            e.preventDefault();
            window.location.href = '/admin';
            break;
          case 'S':
            e.preventDefault();
            window.location.href = '/admin/suppliers';
            break;
          case 'P':
            e.preventDefault();
            window.location.href = '/admin/products';
            break;
          case 'O':
            e.preventDefault();
            window.location.href = '/admin/orders';
            break;
          case 'M':
            e.preventDefault();
            window.location.href = '/admin/monitoring';
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    commandPaletteOpen,
    setCommandPaletteOpen,
    quickSearchOpen,
    setQuickSearchOpen
  };
}

export default useAdminNavigation;