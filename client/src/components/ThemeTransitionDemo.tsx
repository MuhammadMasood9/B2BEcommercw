import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeAnimation } from '../hooks/useThemeAnimation';
import { ThemeTransition, withThemeTransition } from './ThemeTransition';
import { ThemeToggle } from './ThemeToggle';

// Enhanced card component with theme transitions
const TransitionCard = withThemeTransition(
  ({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => (
    <div className={`p-6 rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-3 theme-transition-text">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  ),
  { enableElegantEffect: true }
);

// Enhanced button component with theme transitions
const TransitionButton = withThemeTransition(
  ({ children, variant = 'primary', onClick, className = '' }: {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline';
    onClick?: () => void;
    className?: string;
  }) => {
    const variantClasses = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    };

    return (
      <button
        onClick={onClick}
        className={`px-4 py-2 rounded-md font-medium transition-colors theme-transition-button ${variantClasses[variant]} ${className}`}
      >
        {children}
      </button>
    );
  }
);

export const ThemeTransitionDemo: React.FC = () => {
  const { theme, resolvedTheme, setTheme, isHighContrast, setHighContrast } = useTheme();
  const [demoState, setDemoState] = useState({
    showStagger: false,
    showElegant: false,
    showLoading: false,
  });

  const { 
    triggerRippleEffect, 
    applyStaggeredAnimation, 
    addTransitionClass,
    isAnimating,
    animationPhase 
  } = useThemeAnimation({
    enableLoadingState: true,
    enableRippleEffect: true,
    enableStaggeredAnimation: true,
    onAnimationStart: () => console.log('Theme animation started'),
    onAnimationEnd: () => console.log('Theme animation ended'),
  });

  const handleStaggerDemo = () => {
    const container = document.querySelector('.stagger-demo-container');
    if (container) {
      applyStaggeredAnimation(container as HTMLElement);
      setDemoState(prev => ({ ...prev, showStagger: true }));
      setTimeout(() => setDemoState(prev => ({ ...prev, showStagger: false })), 2000);
    }
  };

  const handleRippleDemo = (event: React.MouseEvent) => {
    const button = event.currentTarget as HTMLElement;
    triggerRippleEffect(button);
  };

  const handleElegantDemo = () => {
    const container = document.querySelector('.elegant-demo-container');
    if (container) {
      addTransitionClass(container as HTMLElement, 'theme-transition-elegant');
      setDemoState(prev => ({ ...prev, showElegant: true }));
      setTimeout(() => setDemoState(prev => ({ ...prev, showElegant: false })), 1000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold theme-transition-text">
          Enhanced Theme Transition System
        </h1>
        <p className="text-muted-foreground theme-transition-text">
          Demonstrating smooth animations, loading states, and elegant transition effects
        </p>
        
        {/* Theme Controls */}
        <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-muted/50">
          <ThemeToggle variant="enhanced-dropdown" showLabel showHighContrast />
          <div className="text-sm text-muted-foreground">
            Current: {theme} ({resolvedTheme}) {isHighContrast && '• High Contrast'}
          </div>
        </div>

        {/* Animation Status */}
        {isAnimating && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Animation Phase: {animationPhase}
          </div>
        )}
      </div>

      {/* Theme Toggle Variants */}
      <TransitionCard title="Theme Toggle Variants" className="theme-transition-card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">Button</h4>
            <ThemeToggle variant="button" size="md" />
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Switch</h4>
            <ThemeToggle variant="switch" size="md" />
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Dropdown</h4>
            <ThemeToggle variant="dropdown" size="md" />
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Enhanced</h4>
            <ThemeToggle variant="enhanced-dropdown" size="md" showHighContrast />
          </div>
        </div>
      </TransitionCard>

      {/* Animation Demos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Staggered Animation Demo */}
        <TransitionCard title="Staggered Animations" className="theme-transition-card">
          <TransitionButton onClick={handleStaggerDemo} className="mb-4">
            Trigger Staggered Animation
          </TransitionButton>
          <div className="stagger-demo-container space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className={`p-3 rounded bg-muted/50 theme-transition-optimized ${
                  demoState.showStagger ? 'theme-stagger-item' : ''
                }`}
              >
                Staggered Item {i + 1}
              </div>
            ))}
          </div>
        </TransitionCard>

        {/* Ripple Effect Demo */}
        <TransitionCard title="Ripple Effects" className="theme-transition-card">
          <div className="space-y-4">
            <TransitionButton onClick={handleRippleDemo}>
              Click for Ripple Effect
            </TransitionButton>
            <TransitionButton variant="secondary" onClick={handleRippleDemo}>
              Secondary Ripple
            </TransitionButton>
            <TransitionButton variant="outline" onClick={handleRippleDemo}>
              Outline Ripple
            </TransitionButton>
          </div>
        </TransitionCard>
      </div>

      {/* Elegant Transition Demo */}
      <TransitionCard title="Elegant Transition Effects" className="theme-transition-card">
        <div className="space-y-4">
          <TransitionButton onClick={handleElegantDemo}>
            Trigger Elegant Effect
          </TransitionButton>
          <div className={`elegant-demo-container p-6 rounded-lg border-2 border-dashed border-muted-foreground/25 ${
            demoState.showElegant ? 'theme-transition-elegant' : ''
          }`}>
            <h4 className="font-medium mb-2">Elegant Transition Container</h4>
            <p className="text-sm text-muted-foreground">
              This container demonstrates the elegant wave effect during theme transitions.
              The effect creates a subtle gradient animation that flows across the element.
            </p>
          </div>
        </div>
      </TransitionCard>

      {/* Performance Metrics */}
      <TransitionCard title="Performance & Accessibility" className="theme-transition-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <h4 className="font-medium">Transition Duration</h4>
            <p className="text-muted-foreground">300ms (optimized)</p>
          </div>
          <div className="space-y-1">
            <h4 className="font-medium">GPU Acceleration</h4>
            <p className="text-muted-foreground">Hardware accelerated</p>
          </div>
          <div className="space-y-1">
            <h4 className="font-medium">Reduced Motion</h4>
            <p className="text-muted-foreground">Respects user preferences</p>
          </div>
        </div>
        
        <div className="mt-4 p-3 rounded bg-muted/50">
          <h4 className="font-medium mb-2">Accessibility Features</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Respects prefers-reduced-motion</li>
            <li>• Enhanced focus indicators</li>
            <li>• High contrast mode support</li>
            <li>• Screen reader announcements</li>
            <li>• Keyboard navigation support</li>
          </ul>
        </div>
      </TransitionCard>

      {/* Theme Transition with Stagger */}
      <ThemeTransition enableStagger enableElegantEffect className="space-y-4">
        <TransitionCard title="Auto-Staggered Cards" className="theme-transition-card">
          <p className="text-sm text-muted-foreground">
            These cards automatically stagger their animations when the theme changes.
          </p>
        </TransitionCard>
        <TransitionCard title="Smooth Transitions" className="theme-transition-card">
          <p className="text-sm text-muted-foreground">
            All elements transition smoothly with optimized performance.
          </p>
        </TransitionCard>
        <TransitionCard title="Elegant Effects" className="theme-transition-card">
          <p className="text-sm text-muted-foreground">
            Elegant wave effects enhance the visual experience.
          </p>
        </TransitionCard>
      </ThemeTransition>
    </div>
  );
};

export default ThemeTransitionDemo;