import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  ThemeProvider,
  useTheme,
  type Theme,
  type ResolvedTheme,
} from '../ThemeContext';

describe('ThemeProvider light-only behaviour', () => {
  it('exports light-only theme types', () => {
    const lightTheme: Theme = 'light';
    const resolvedLight: ResolvedTheme = 'light';

    expect(lightTheme).toBe('light');
    expect(resolvedLight).toBe('light');
  });

  it('provides light theme context values', () => {
    let capturedTheme: Theme | null = null;
    let capturedResolved: ResolvedTheme | null = null;
    let capturedTransitionState: boolean | null = null;

    const Probe = () => {
      const themeContext = useTheme();
      capturedTheme = themeContext.theme;
      capturedResolved = themeContext.resolvedTheme;
      capturedTransitionState = themeContext.isTransitioning;
      return null;
    };

    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );

    expect(capturedTheme).toBe('light');
    expect(capturedResolved).toBe('light');
    expect(capturedTransitionState).toBe(false);
  });

  it('ensures document root stays in light mode', () => {
    render(
      <ThemeProvider>
        <div>theme probe</div>
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.classList.contains('high-contrast')).toBe(false);
  });
});