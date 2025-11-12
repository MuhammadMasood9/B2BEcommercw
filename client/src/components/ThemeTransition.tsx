import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeTransitionProps {
  children: React.ReactNode;
  className?: string;
  enableStagger?: boolean;
  enableElegantEffect?: boolean;
  staggerDelay?: number;
}

export const ThemeTransition: React.FC<ThemeTransitionProps> = ({
  children,
  className = '',
  enableStagger = false,
  enableElegantEffect = false,
  staggerDelay = 25,
}) => {
  const { isTransitioning } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [childElements, setChildElements] = useState<Element[]>([]);

  // Apply staggered animations to child elements
  useEffect(() => {
    if (!enableStagger || !containerRef.current) return;

    const elements = Array.from(containerRef.current.children);
    setChildElements(elements);

    elements.forEach((element, index) => {
      const delay = index * staggerDelay;
      (element as HTMLElement).style.setProperty('--theme-stagger-delay', `${delay}ms`);
      element.classList.add('theme-stagger-item');
    });

    return () => {
      elements.forEach(element => {
        element.classList.remove('theme-stagger-item');
        (element as HTMLElement).style.removeProperty('--theme-stagger-delay');
      });
    };
  }, [enableStagger, staggerDelay, children]);

  // Apply elegant transition effect
  useEffect(() => {
    if (!enableElegantEffect || !containerRef.current) return;

    containerRef.current.classList.add('theme-transition-elegant');

    return () => {
      if (containerRef.current) {
        containerRef.current.classList.remove('theme-transition-elegant');
      }
    };
  }, [enableElegantEffect]);

  const containerClasses = [
    'theme-transition-optimized',
    isTransitioning ? 'theme-transitioning-active' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div ref={containerRef} className={containerClasses}>
      {children}
    </div>
  );
};

// Higher-order component for wrapping components with theme transitions
export const withThemeTransition = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ThemeTransitionProps, 'children'> = {}
) => {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <ThemeTransition {...options}>
      <Component {...props} ref={ref} />
    </ThemeTransition>
  ));

  WrappedComponent.displayName = `withThemeTransition(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ThemeTransition;