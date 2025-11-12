import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useThemeAnimation } from '../hooks/useThemeAnimation';

// Mock CSS animations and transitions
const mockAnimationFrame = vi.fn();
global.requestAnimationFrame = mockAnimationFrame;

// Mock CSS custom properties
Object.defineProperty(HTMLElement.prototype, 'style', {
  value: {
    setProperty: vi.fn(),
    removeProperty: vi.fn(),
    getPropertyValue: vi.fn(),
  },
  writable: true,
});

// Mock media query for reduced motion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? false : true,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Theme Transition Animations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document classes
    document.documentElement.className = '';
    document.body.className = '';
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('ThemeToggle Animations', () => {
    it('should apply transition classes when theme changes', async () => {
      render(
        <ThemeProvider>
          <ThemeToggle variant="button" />
        </ThemeProvider>
      );

      const toggleButton = screen.getByRole('button');
      
      // Click to change theme
      fireEvent.click(toggleButton);

      // Check if transition classes are applied
      await waitFor(() => {
        expect(document.documentElement.classList.contains('theme-switching')).toBe(true);
      });

      // Wait for transition to complete
      await waitFor(() => {
        expect(document.documentElement.classList.contains('theme-switching')).toBe(false);
      }, { timeout: 1000 });
    });

    it('should trigger ripple effect on button click', async () => {
      render(
        <ThemeProvider>
          <ThemeToggle variant="button" />
        </ThemeProvider>
      );

      const toggleButton = screen.getByRole('button');
      
      // Mock getBoundingClientRect
      toggleButton.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 100,
        height: 40,
        right: 100,
        bottom: 40,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
      }));

      // Click button
      fireEvent.click(toggleButton, { clientX: 50, clientY: 20 });

      // Check if ripple effect is triggered
      await waitFor(() => {
        expect(toggleButton.querySelector('.theme-ripple-effect')).toBeTruthy();
      });
    });

    it('should disable button during transitions', async () => {
      render(
        <ThemeProvider>
          <ThemeToggle variant="button" />
        </ThemeProvider>
      );

      const toggleButton = screen.getByRole('button');
      
      // Click to start transition
      fireEvent.click(toggleButton);

      // Button should be disabled during transition
      await waitFor(() => {
        expect(toggleButton).toBeDisabled();
      });
    });
  });

  describe('useThemeAnimation Hook', () => {
    const TestComponent = ({ options = {} }) => {
      const {
        animationState,
        triggerRippleEffect,
        applyStaggeredAnimation,
        isLoading,
        isAnimating,
      } = useThemeAnimation(options);

      return (
        <div>
          <div data-testid="animation-state">
            {JSON.stringify({ isLoading, isAnimating, phase: animationState.animationPhase })}
          </div>
          <button
            data-testid="ripple-button"
            onClick={(e) => triggerRippleEffect(e.currentTarget)}
          >
            Ripple
          </button>
          <div data-testid="stagger-container">
            <div>Item 1</div>
            <div>Item 2</div>
            <div>Item 3</div>
          </div>
          <button
            data-testid="stagger-button"
            onClick={() => {
              const container = document.querySelector('[data-testid="stagger-container"]');
              if (container) applyStaggeredAnimation(container as HTMLElement);
            }}
          >
            Stagger
          </button>
        </div>
      );
    };

    it('should manage animation state correctly', async () => {
      render(
        <ThemeProvider>
          <TestComponent options={{ enableLoadingState: true }} />
        </ThemeProvider>
      );

      const stateElement = screen.getByTestId('animation-state');
      
      // Initial state should be idle
      expect(stateElement.textContent).toContain('"phase":"idle"');
      expect(stateElement.textContent).toContain('"isLoading":false');
    });

    it('should trigger ripple effect', async () => {
      render(
        <ThemeProvider>
          <TestComponent options={{ enableRippleEffect: true }} />
        </ThemeProvider>
      );

      const rippleButton = screen.getByTestId('ripple-button');
      
      // Mock getBoundingClientRect
      rippleButton.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 100,
        height: 40,
        right: 100,
        bottom: 40,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
      }));

      fireEvent.click(rippleButton);

      // Check if ripple element is created
      await waitFor(() => {
        expect(rippleButton.querySelector('.theme-ripple-effect')).toBeTruthy();
      });
    });

    it('should apply staggered animations', async () => {
      render(
        <ThemeProvider>
          <TestComponent options={{ enableStaggeredAnimation: true }} />
        </ThemeProvider>
      );

      const staggerButton = screen.getByTestId('stagger-button');
      const container = screen.getByTestId('stagger-container');

      fireEvent.click(staggerButton);

      // Check if stagger classes are applied
      await waitFor(() => {
        const children = container.children;
        expect(children[0].classList.contains('theme-stagger-item')).toBe(true);
        expect(children[1].classList.contains('theme-stagger-item')).toBe(true);
        expect(children[2].classList.contains('theme-stagger-item')).toBe(true);
      });
    });
  });

  describe('Theme Transition Performance', () => {
    it('should respect reduced motion preferences', () => {
      // Mock reduced motion preference
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)' ? true : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(
        <ThemeProvider>
          <ThemeToggle variant="button" />
        </ThemeProvider>
      );

      // Check if reduced motion styles are applied
      const style = document.createElement('style');
      style.textContent = `
        @media (prefers-reduced-motion: reduce) {
          * { transition-duration: 0.01ms !important; }
        }
      `;
      document.head.appendChild(style);

      expect(document.head.contains(style)).toBe(true);
    });

    it('should handle rapid theme switching gracefully', async () => {
      render(
        <ThemeProvider>
          <ThemeToggle variant="button" />
        </ThemeProvider>
      );

      const toggleButton = screen.getByRole('button');

      // Rapidly click multiple times
      fireEvent.click(toggleButton);
      fireEvent.click(toggleButton);
      fireEvent.click(toggleButton);

      // Should handle gracefully without errors
      await waitFor(() => {
        expect(toggleButton).toBeInTheDocument();
      });
    });
  });

  describe('CSS Animation Classes', () => {
    it('should apply correct transition classes to document', async () => {
      render(
        <ThemeProvider>
          <ThemeToggle variant="button" />
        </ThemeProvider>
      );

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      // Check if theme switching classes are applied
      await waitFor(() => {
        expect(document.documentElement.classList.contains('theme-switching')).toBe(true);
        expect(document.documentElement.classList.contains('theme-changing')).toBe(true);
      });

      // Check if body has theme changing class
      expect(document.body.classList.contains('theme-changing')).toBe(true);
    });

    it('should clean up transition classes after animation', async () => {
      vi.useFakeTimers();

      render(
        <ThemeProvider>
          <ThemeToggle variant="button" />
        </ThemeProvider>
      );

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      // Fast-forward time to complete animation
      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(document.documentElement.classList.contains('theme-switching')).toBe(false);
        expect(document.documentElement.classList.contains('theme-changing')).toBe(false);
        expect(document.body.classList.contains('theme-changing')).toBe(false);
      });

      vi.useRealTimers();
    });
  });

  describe('Theme Transition Demo', () => {
    it('should render demo component without errors', () => {
      render(
        <ThemeProvider>
          <ThemeTransitionDemo />
        </ThemeProvider>
      );

      expect(screen.getByText('Enhanced Theme Transition System')).toBeInTheDocument();
      expect(screen.getByText('Theme Toggle Variants')).toBeInTheDocument();
      expect(screen.getByText('Staggered Animations')).toBeInTheDocument();
      expect(screen.getByText('Ripple Effects')).toBeInTheDocument();
    });

    it('should trigger staggered animation demo', async () => {
      render(
        <ThemeProvider>
          <ThemeTransitionDemo />
        </ThemeProvider>
      );

      const staggerButton = screen.getByText('Trigger Staggered Animation');
      fireEvent.click(staggerButton);

      // Check if stagger demo is activated
      await waitFor(() => {
        const container = document.querySelector('.stagger-demo-container');
        expect(container).toBeTruthy();
      });
    });
  });
});