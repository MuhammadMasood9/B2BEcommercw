import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';

export type Theme = 'light';
export type ResolvedTheme = 'light';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isTransitioning: boolean;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.classList.remove('dark', 'high-contrast', 'theme-switching');
    root.classList.add('light');
    root.style.colorScheme = 'light';
  }, []);

  const setTheme = useCallback((_theme: Theme) => {
    // Theme is locked to light mode; no-op setter keeps API compatibility.
  }, []);

  const toggleTheme = useCallback(() => {
    // No alternative themes available; toggle is a no-op for compatibility.
  }, []);

  const contextValue = useMemo<ThemeContextType>(() => ({
    theme: 'light',
    resolvedTheme: 'light',
    setTheme,
    toggleTheme,
    isTransitioning: false,
  }), [setTheme, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;