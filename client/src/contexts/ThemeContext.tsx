import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

// Theme types
export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

// Theme context interface
interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isHighContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  isTransitioning: boolean;
}

// Theme provider props
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

// Create theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
  storageKey = 'theme-preference',
  enableSystem = true,
  disableTransitionOnChange = false,
}) => {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Use refs to avoid dependency issues
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Get system theme preference
  const getSystemTheme = (): ResolvedTheme => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Get high contrast preference
  const getSystemHighContrast = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-contrast: high)').matches;
  };

  // Resolve theme based on current theme setting
  const resolveTheme = (currentTheme: Theme): ResolvedTheme => {
    if (currentTheme === 'system') {
      return getSystemTheme();
    }
    return currentTheme;
  };

  // Apply theme to document
  const applyTheme = (newResolvedTheme: ResolvedTheme, highContrast: boolean) => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    // Clear any existing transition timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }

    // Start transition state
    if (!disableTransitionOnChange && isInitializedRef.current) {
      setIsTransitioning(true);
      root.classList.add('theme-switching');
    }

    // Apply theme classes
    root.classList.remove('light', 'dark', 'high-contrast');
    root.classList.add(newResolvedTheme);
    
    if (highContrast) {
      root.classList.add('high-contrast');
    }

    // Set color scheme for browser UI
    root.style.colorScheme = newResolvedTheme;

    // Clean up after transition
    if (!disableTransitionOnChange && isInitializedRef.current) {
      transitionTimeoutRef.current = setTimeout(() => {
        root.classList.remove('theme-switching');
        setIsTransitioning(false);
      }, 300);
    }
  };

  // Load theme from localStorage
  const loadStoredTheme = (): Theme => {
    if (typeof window === 'undefined') return defaultTheme;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored as Theme;
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }
    
    return defaultTheme;
  };

  // Load high contrast preference from localStorage
  const loadStoredHighContrast = (): boolean => {
    if (typeof window === 'undefined') return false;
    
    try {
      const stored = localStorage.getItem(`${storageKey}-high-contrast`);
      if (stored !== null) {
        return stored === 'true';
      }
    } catch (error) {
      console.warn('Failed to load high contrast preference from localStorage:', error);
    }
    
    return getSystemHighContrast();
  };

  // Save theme to localStorage
  const saveTheme = (newTheme: Theme) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  };

  // Save high contrast preference to localStorage
  const saveHighContrast = (enabled: boolean) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(`${storageKey}-high-contrast`, enabled.toString());
    } catch (error) {
      console.warn('Failed to save high contrast preference to localStorage:', error);
    }
  };

  // Set theme function
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    saveTheme(newTheme);
    
    const newResolvedTheme = resolveTheme(newTheme);
    setResolvedTheme(newResolvedTheme);
    applyTheme(newResolvedTheme, isHighContrast);
  }, [isHighContrast, storageKey, disableTransitionOnChange]);

  // Toggle between light and dark themes
  const toggleTheme = useCallback(() => {
    if (theme === 'system') {
      // If currently system, toggle to opposite of current resolved theme
      setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
    } else {
      // Toggle between light and dark
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  }, [theme, resolvedTheme, setTheme]);

  // Set high contrast function
  const setHighContrastMode = useCallback((enabled: boolean) => {
    setIsHighContrast(enabled);
    saveHighContrast(enabled);
    applyTheme(resolvedTheme, enabled);
  }, [resolvedTheme, storageKey]);

  // Initialize theme on mount - ONLY ONCE
  useEffect(() => {
    if (typeof window === 'undefined' || isInitializedRef.current) return;

    const storedTheme = loadStoredTheme();
    const storedHighContrast = loadStoredHighContrast();
    const initialResolvedTheme = resolveTheme(storedTheme);

    setThemeState(storedTheme);
    setResolvedTheme(initialResolvedTheme);
    setIsHighContrast(storedHighContrast);
    applyTheme(initialResolvedTheme, storedHighContrast);
    
    isInitializedRef.current = true;
    setIsInitialized(true);
  }, []); // Empty dependency array - only run once

  // Listen for system theme changes
  useEffect(() => {
    if (!enableSystem || typeof window === 'undefined' || !isInitializedRef.current) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const newResolvedTheme = e.matches ? 'dark' : 'light';
        setResolvedTheme(newResolvedTheme);
        applyTheme(newResolvedTheme, isHighContrast);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme, isHighContrast, enableSystem]);

  // Listen for system high contrast changes
  useEffect(() => {
    if (typeof window === 'undefined' || !isInitializedRef.current) return;

    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleSystemHighContrastChange = (e: MediaQueryListEvent) => {
      // Only auto-update if user hasn't manually set high contrast
      const storedHighContrast = localStorage.getItem(`${storageKey}-high-contrast`);
      if (storedHighContrast === null) {
        setIsHighContrast(e.matches);
        applyTheme(resolvedTheme, e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleSystemHighContrastChange);
    return () => mediaQuery.removeEventListener('change', handleSystemHighContrastChange);
  }, [resolvedTheme, storageKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  // Prevent flash of unstyled content
  if (!isInitialized) {
    return null;
  }

  const contextValue: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isHighContrast,
    setHighContrast: setHighContrastMode,
    isTransitioning,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;