import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '../../client/src/contexts/ThemeContext';
import React from 'react';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia for system preference detection
const matchMediaMock = vi.fn();
Object.defineProperty(window, 'matchMedia', {
  value: matchMediaMock,
});

// Test component that uses the theme context
const TestComponent = () => {
  const { theme, resolvedTheme, setTheme, toggleTheme, isHighContrast, setHighContrast } = useTheme();
  
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <div data-testid="resolved-theme">{resolvedTheme}</div>
      <div data-testid="high-contrast">{isHighContrast.toString()}</div>
      <button data-testid="toggle-theme" onClick={toggleTheme}>
        Toggle Theme
      </button>
      <button data-testid="set-light" onClick={() => setTheme('light')}>
        Set Light
      </button>
      <button data-testid="set-dark" onClick={() => setTheme('dark')}>
        Set Dark
      </button>
      <button data-testid="set-system" onClick={() => setTheme('system')}>
        Set System
      </button>
      <button data-testid="toggle-contrast" onClick={() => setHighContrast(!isHighContrast)}>
        Toggle Contrast
      </button>
    </div>
  );
};

describe('ThemeProvider', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Mock system preference as light by default
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    // Clean up DOM
    document.documentElement.classList.remove('dark', 'high-contrast');
  });

  describe('Initialization', () => {
    it('should initialize with light theme by default', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
      expect(screen.getByTestId('high-contrast')).toHaveTextContent('false');
    });

    it('should initialize with system preference when available', () => {
      // Mock dark system preference
      matchMediaMock.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      render(
        <ThemeProvider defaultTheme="system">
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
    });

    it('should restore theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('dark');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
    });

    it('should restore high contrast setting from localStorage', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'theme') return 'light';
        if (key === 'high-contrast') return 'true';
        return null;
      });

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
    });
  });

  describe('Theme Switching', () => {
    it('should switch to dark theme when setTheme is called', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('set-dark'));

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should toggle between light and dark themes', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Initially light
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');

      // Toggle to dark
      await user.click(screen.getByTestId('toggle-theme'));
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');

      // Toggle back to light
      await user.click(screen.getByTestId('toggle-theme'));
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
    });

    it('should handle system theme correctly', async () => {
      const user = userEvent.setup();
      
      // Mock system preference change
      let systemPreferenceCallback: ((e: MediaQueryListEvent) => void) | null = null;
      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: vi.fn((event, callback) => {
          if (event === 'change') {
            systemPreferenceCallback = callback;
          }
        }),
        removeEventListener: vi.fn(),
      });

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Set to system theme
      await user.click(screen.getByTestId('set-system'));
      expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');

      // Simulate system preference change to dark
      if (systemPreferenceCallback) {
        act(() => {
          systemPreferenceCallback({ matches: true } as MediaQueryListEvent);
        });
      }

      await waitFor(() => {
        expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
      });
    });
  });

  describe('High Contrast Mode', () => {
    it('should toggle high contrast mode', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('high-contrast')).toHaveTextContent('false');

      await user.click(screen.getByTestId('toggle-contrast'));
      expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('high-contrast', 'true');
    });

    it('should apply high-contrast class to document', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('toggle-contrast'));
      expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
    });
  });

  describe('DOM Class Management', () => {
    it('should apply dark class to document when dark theme is active', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('set-dark'));
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove dark class when switching to light theme', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Set to dark first
      await user.click(screen.getByTestId('set-dark'));
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // Switch to light
      await user.click(screen.getByTestId('set-light'));
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('Persistence', () => {
    it('should persist theme changes to localStorage', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider storageKey="custom-theme">
          <TestComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('set-dark'));
      expect(localStorageMock.setItem).toHaveBeenCalledWith('custom-theme', 'dark');
    });

    it('should persist high contrast setting to localStorage', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('toggle-contrast'));
      expect(localStorageMock.setItem).toHaveBeenCalledWith('high-contrast', 'true');
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      expect(() => {
        render(
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>
        );
      }).not.toThrow();

      // Should fall back to default theme
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });

    it('should handle invalid localStorage values', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Should fall back to default theme
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });
  });

  describe('Configuration Options', () => {
    it('should respect defaultTheme prop', () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    it('should use custom storage key', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider storageKey="my-app-theme">
          <TestComponent />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId('set-dark'));
      expect(localStorageMock.setItem).toHaveBeenCalledWith('my-app-theme', 'dark');
    });

    it('should disable system preference detection when enableSystem is false', () => {
      render(
        <ThemeProvider enableSystem={false} defaultTheme="system">
          <TestComponent />
        </ThemeProvider>
      );

      // Should fall back to light since system is disabled
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });
  });
});