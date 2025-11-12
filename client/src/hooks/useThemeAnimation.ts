import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeAnimationOptions {
  enableLoadingState?: boolean;
  enableRippleEffect?: boolean;
  enableStaggeredAnimation?: boolean;
  loadingDuration?: number;
  staggerDelay?: number;
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
}

interface ThemeAnimationState {
  isLoading: boolean;
  isAnimating: boolean;
  animationPhase: 'idle' | 'starting' | 'transitioning' | 'ending';
}

export const useThemeAnimation = (options: ThemeAnimationOptions = {}) => {
  const {
    enableLoadingState = true,
    enableRippleEffect = false,
    enableStaggeredAnimation = false,
    loadingDuration = 300,
    staggerDelay = 25,
    onAnimationStart,
    onAnimationEnd,
  } = options;

  const { isTransitioning, resolvedTheme } = useTheme();
  const [animationState, setAnimationState] = useState<ThemeAnimationState>({
    isLoading: false,
    isAnimating: false,
    animationPhase: 'idle',
  });

  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousThemeRef = useRef(resolvedTheme);

  // Detect theme changes and trigger animations
  useEffect(() => {
    if (previousThemeRef.current !== resolvedTheme) {
      previousThemeRef.current = resolvedTheme;
      
      if (enableLoadingState) {
        startAnimation();
      }
    }
  }, [resolvedTheme, enableLoadingState]);

  // Handle transition state changes
  useEffect(() => {
    if (isTransitioning) {
      setAnimationState(prev => ({
        ...prev,
        isAnimating: true,
        animationPhase: 'transitioning',
      }));
    } else {
      // Delay ending to allow CSS transitions to complete
      const timeout = setTimeout(() => {
        setAnimationState(prev => ({
          ...prev,
          isAnimating: false,
          animationPhase: 'idle',
        }));
        onAnimationEnd?.();
      }, 100);

      return () => clearTimeout(timeout);
    }
  }, [isTransitioning, onAnimationEnd]);

  const startAnimation = useCallback(() => {
    // Clear any existing timeouts
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Start animation sequence
    setAnimationState({
      isLoading: true,
      isAnimating: true,
      animationPhase: 'starting',
    });

    onAnimationStart?.();

    // Transition to main animation phase
    animationTimeoutRef.current = setTimeout(() => {
      setAnimationState(prev => ({
        ...prev,
        animationPhase: 'transitioning',
      }));
    }, 50);

    // End loading state
    if (enableLoadingState) {
      loadingTimeoutRef.current = setTimeout(() => {
        setAnimationState(prev => ({
          ...prev,
          isLoading: false,
          animationPhase: 'ending',
        }));
      }, loadingDuration);
    }
  }, [enableLoadingState, loadingDuration, onAnimationStart]);

  const triggerRippleEffect = useCallback((element: HTMLElement, x?: number, y?: number) => {
    if (!enableRippleEffect) return;

    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('div');
    
    // Calculate ripple position
    const rippleX = x !== undefined ? x - rect.left : rect.width / 2;
    const rippleY = y !== undefined ? y - rect.top : rect.height / 2;
    
    // Style the ripple
    ripple.className = 'theme-ripple-effect';
    ripple.style.cssText = `
      position: absolute;
      left: ${rippleX}px;
      top: ${rippleY}px;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: hsl(var(--primary) / 0.3);
      transform: translate(-50%, -50%);
      animation: theme-ripple 0.6s ease-out;
      pointer-events: none;
      z-index: 1000;
    `;

    // Add ripple to element
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    // Remove ripple after animation
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);
  }, [enableRippleEffect]);

  const applyStaggeredAnimation = useCallback((container: HTMLElement) => {
    if (!enableStaggeredAnimation) return;

    const children = Array.from(container.children) as HTMLElement[];
    
    children.forEach((child, index) => {
      const delay = index * staggerDelay;
      child.style.setProperty('--theme-stagger-delay', `${delay}ms`);
      child.classList.add('theme-stagger-item');
      
      // Add fade-in animation
      child.style.animation = `theme-fade-in 300ms ease-out ${delay}ms both`;
    });

    // Clean up after animation
    const cleanup = () => {
      children.forEach(child => {
        child.style.removeProperty('--theme-stagger-delay');
        child.classList.remove('theme-stagger-item');
        child.style.animation = '';
      });
    };

    setTimeout(cleanup, 300 + (children.length * staggerDelay));
  }, [enableStaggeredAnimation, staggerDelay]);

  const addTransitionClass = useCallback((element: HTMLElement, className: string) => {
    element.classList.add(className);
    
    // Remove class after transition
    const cleanup = () => {
      element.classList.remove(className);
    };

    setTimeout(cleanup, loadingDuration);
    
    return cleanup;
  }, [loadingDuration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  return {
    animationState,
    startAnimation,
    triggerRippleEffect,
    applyStaggeredAnimation,
    addTransitionClass,
    isLoading: animationState.isLoading,
    isAnimating: animationState.isAnimating,
    animationPhase: animationState.animationPhase,
  };
};

export default useThemeAnimation;