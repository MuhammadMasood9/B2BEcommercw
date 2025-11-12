import { useState, useEffect } from 'react';

/**
 * Hook for managing high contrast mode
 */
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [systemPreference, setSystemPreference] = useState(false);

  // Check system preference for high contrast
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setSystemPreference(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Check localStorage for user preference
  useEffect(() => {
    const stored = localStorage.getItem('high-contrast-mode');
    if (stored !== null) {
      setIsHighContrast(stored === 'true');
    } else {
      // Default to system preference if no user preference
      setIsHighContrast(systemPreference);
    }
  }, [systemPreference]);

  // Apply high contrast class to document
  useEffect(() => {
    const root = document.documentElement;
    if (isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  const toggleHighContrast = () => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);
    localStorage.setItem('high-contrast-mode', newValue.toString());
  };

  const resetToSystemPreference = () => {
    localStorage.removeItem('high-contrast-mode');
    setIsHighContrast(systemPreference);
  };

  return {
    isHighContrast,
    systemPreference,
    toggleHighContrast,
    resetToSystemPreference
  };
}