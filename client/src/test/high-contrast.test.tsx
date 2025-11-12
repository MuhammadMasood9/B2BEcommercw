import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { HighContrastToggle } from '../components/HighContrastToggle';
import { HighContrastDemo } from '../components/HighContrastDemo';

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

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const renderWithThemeProvider = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('High Contrast Mode', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    
    // Reset document classes
    document.documentElement.className = '';
  });

  afterEach(() => {
    // Clean up document classes
    document.documentElement.className = '';
  });

  describe('HighContrastToggle Component', () => {
    it('renders button variant correctly', () => {
      renderWithThemeProvider(<HighContrastToggle variant="button" />);
      
      const button = screen.getByRole('switch');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    it('renders switch variant correctly', () => {
      renderWithThemeProvider(<HighContrastToggle variant="switch" showLabel={true} />);
      
      const switchElement = screen.getByRole('switch');
      const label = screen.getByText('High Contrast');
      
      expect(switchElement).toBeInTheDocument();
      expect(label).toBeInTheDocument();
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
    });

    it('toggles high contrast mode when clicked', async () => {
      renderWithThemeProvider(<HighContrastToggle variant="button" />);
      
      const button = screen.getByRole('switch');
      
      // Initially should be off
      expect(button).toHaveAttribute('aria-pressed', 'false');
      
      // Click to enable high contrast
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-pressed', 'true');
      });
      
      // Check that high-contrast class is added to document
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('high-contrast');
      });
    });

    it('persists high contrast preference in localStorage', async () => {
      renderWithThemeProvider(<HighContrastToggle variant="button" />);
      
      const button = screen.getByRole('switch');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'theme-preference-high-contrast',
          'true'
        );
      });
    });

    it('has proper accessibility attributes', () => {
      renderWithThemeProvider(<HighContrastToggle variant="button" showLabel={true} />);
      
      const button = screen.getByRole('switch');
      
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('title');
      expect(button.getAttribute('aria-label')).toContain('high contrast mode');
    });

    it('shows correct label text based on state', async () => {
      renderWithThemeProvider(<HighContrastToggle variant="button" showLabel={true} />);
      
      const button = screen.getByRole('switch');
      
      // Initially should show "High Contrast"
      expect(screen.getByText('High Contrast')).toBeInTheDocument();
      
      // Click to enable
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('High Contrast On')).toBeInTheDocument();
      });
    });
  });

  describe('High Contrast CSS Classes', () => {
    it('applies high-contrast class to document root', async () => {
      renderWithThemeProvider(<HighContrastToggle variant="button" />);
      
      const button = screen.getByRole('switch');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('high-contrast');
      });
    });

    it('removes high-contrast class when disabled', async () => {
      renderWithThemeProvider(<HighContrastToggle variant="button" />);
      
      const button = screen.getByRole('switch');
      
      // Enable high contrast
      fireEvent.click(button);
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('high-contrast');
      });
      
      // Disable high contrast
      fireEvent.click(button);
      await waitFor(() => {
        expect(document.documentElement).not.toHaveClass('high-contrast');
      });
    });
  });

  describe('System Preference Detection', () => {
    it('detects system high contrast preference', () => {
      // Mock system preference for high contrast
      window.matchMedia = vi.fn().mockImplementation(query => {
        if (query === '(prefers-contrast: high)') {
          return {
            matches: true,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
          };
        }
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        };
      });

      renderWithThemeProvider(<HighContrastToggle variant="button" />);
      
      // Should respect system preference
      expect(document.documentElement).toHaveClass('high-contrast');
    });
  });

  describe('Integration with Theme System', () => {
    it('works correctly with light theme', async () => {
      renderWithThemeProvider(
        <div>
          <HighContrastToggle variant="button" />
        </div>
      );
      
      const button = screen.getByRole('switch');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('high-contrast');
        // Should not have dark class by default
        expect(document.documentElement).not.toHaveClass('dark');
      });
    });

    it('works correctly with dark theme', async () => {
      // Set up dark theme
      document.documentElement.classList.add('dark');
      
      renderWithThemeProvider(<HighContrastToggle variant="button" />);
      
      const button = screen.getByRole('switch');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('high-contrast');
        expect(document.documentElement).toHaveClass('dark');
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('provides proper ARIA labels', () => {
      renderWithThemeProvider(<HighContrastToggle variant="switch" />);
      
      const switchElement = screen.getByRole('switch');
      const ariaLabel = switchElement.getAttribute('aria-label');
      
      expect(ariaLabel).toContain('high contrast mode');
      expect(ariaLabel).toContain('accessibility');
    });

    it('updates ARIA attributes when state changes', async () => {
      renderWithThemeProvider(<HighContrastToggle variant="switch" />);
      
      const switchElement = screen.getByRole('switch');
      
      // Initially unchecked
      expect(switchElement).toHaveAttribute('aria-checked', 'false');
      
      // Click to enable
      fireEvent.click(switchElement);
      
      await waitFor(() => {
        expect(switchElement).toHaveAttribute('aria-checked', 'true');
      });
    });

    it('has proper focus management', () => {
      renderWithThemeProvider(<HighContrastToggle variant="button" />);
      
      const button = screen.getByRole('switch');
      
      // Should be focusable
      button.focus();
      expect(document.activeElement).toBe(button);
      
      // Should have focus styles
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
    });
  });

  describe('HighContrastDemo Component', () => {
    it('renders all demo sections', () => {
      renderWithThemeProvider(<HighContrastDemo />);
      
      expect(screen.getByText('High Contrast Mode Demo')).toBeInTheDocument();
      expect(screen.getByText('Button Variants')).toBeInTheDocument();
      expect(screen.getByText('Form Elements')).toBeInTheDocument();
      expect(screen.getByText('Links & Navigation')).toBeInTheDocument();
      expect(screen.getByText('Status Indicators')).toBeInTheDocument();
      expect(screen.getByText('Accessibility Information')).toBeInTheDocument();
    });

    it('shows current theme and high contrast status', () => {
      renderWithThemeProvider(<HighContrastDemo />);
      
      // Should show current status
      expect(screen.getByText(/Current:/)).toBeInTheDocument();
      expect(screen.getByText(/mode/)).toBeInTheDocument();
    });

    it('includes interactive elements for testing', () => {
      renderWithThemeProvider(<HighContrastDemo />);
      
      // Should have various button types
      expect(screen.getByText('Primary Button')).toBeInTheDocument();
      expect(screen.getByText('Secondary Button')).toBeInTheDocument();
      expect(screen.getByText('Outline Button')).toBeInTheDocument();
      
      // Should have form inputs
      expect(screen.getByPlaceholderText('Enter some text...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
      
      // Should have links
      expect(screen.getAllByText(/link/i)).toHaveLength(5); // Various link texts
    });
  });

  describe('Error Handling', () => {
    it('handles localStorage errors gracefully', () => {
      // Mock localStorage to throw an error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      renderWithThemeProvider(<HighContrastToggle variant="button" />);
      
      const button = screen.getByRole('switch');
      
      // Should not throw when localStorage fails
      expect(() => {
        fireEvent.click(button);
      }).not.toThrow();
    });

    it('handles missing matchMedia gracefully', () => {
      // Remove matchMedia
      const originalMatchMedia = window.matchMedia;
      delete (window as any).matchMedia;
      
      expect(() => {
        renderWithThemeProvider(<HighContrastToggle variant="button" />);
      }).not.toThrow();
      
      // Restore matchMedia
      window.matchMedia = originalMatchMedia;
    });
  });
});

describe('High Contrast CSS Variables', () => {
  beforeEach(() => {
    // Add high-contrast class to test CSS variables
    document.documentElement.classList.add('high-contrast');
  });

  afterEach(() => {
    document.documentElement.classList.remove('high-contrast');
  });

  it('defines high contrast color variables', () => {
    const styles = getComputedStyle(document.documentElement);
    
    // Should have high contrast orange colors
    expect(styles.getPropertyValue('--brand-orange-500')).toBeTruthy();
    expect(styles.getPropertyValue('--brand-orange-accessible')).toBeTruthy();
    
    // Should have high contrast grey colors
    expect(styles.getPropertyValue('--brand-grey-900')).toBeTruthy();
    expect(styles.getPropertyValue('--brand-text-on-light')).toBeTruthy();
  });

  it('provides enhanced focus ring variables', () => {
    const styles = getComputedStyle(document.documentElement);
    
    expect(styles.getPropertyValue('--focus-ring-width')).toBe('3px');
    expect(styles.getPropertyValue('--focus-ring-offset')).toBe('2px');
  });
});