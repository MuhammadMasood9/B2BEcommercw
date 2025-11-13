import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Test component that uses theme-aware classes
const TestComponent = () => {
  return (
    <div className="min-h-screen bg-background theme-transition">
      <Card className="bg-card border-border theme-transition">
        <CardHeader>
          <CardTitle className="text-foreground theme-transition">Test Title</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground theme-transition">Test content</p>
          <Button className="btn-brand-primary theme-transition">Test Button</Button>
        </CardContent>
      </Card>
    </div>
  );
};

describe('Theme Consistency Tests', () => {
  test('components use theme-aware classes', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Check that theme-aware classes are applied
    const container = screen.getByText('Test Title').closest('.min-h-screen');
    expect(container).toHaveClass('bg-background', 'theme-transition');

    const card = screen.getByText('Test Title').closest('[class*="bg-card"]');
    expect(card).toHaveClass('bg-card', 'border-border', 'theme-transition');

    const title = screen.getByText('Test Title');
    expect(title).toHaveClass('text-foreground', 'theme-transition');

    const content = screen.getByText('Test content');
    expect(content).toHaveClass('text-muted-foreground', 'theme-transition');

    const button = screen.getByText('Test Button');
    expect(button).toHaveClass('btn-brand-primary', 'theme-transition');
  });

  test('theme classes are consistent across components', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Verify consistent use of theme classes
    const themeElements = document.querySelectorAll('.theme-transition');
    expect(themeElements.length).toBeGreaterThan(0);

    const backgroundElements = document.querySelectorAll('.bg-background');
    expect(backgroundElements.length).toBeGreaterThan(0);

    const foregroundElements = document.querySelectorAll('.text-foreground');
    expect(foregroundElements.length).toBeGreaterThan(0);
  });
});

export default TestComponent;