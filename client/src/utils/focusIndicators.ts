/**
 * Focus indicator utilities for accessibility
 */

import { testContrast, BRAND_COLORS } from './accessibility';

export interface FocusStyle {
  outline: string;
  outlineOffset: string;
  boxShadow?: string;
}

/**
 * Get accessible focus indicator style based on background
 */
export function getFocusIndicator(backgroundColor: string = '#FFFFFF'): FocusStyle {
  // Test contrast of orange against background
  const orangeContrast = testContrast(BRAND_COLORS.primary, backgroundColor);
  
  // If orange has good contrast, use it
  if (orangeContrast.wcagAA) {
    return {
      outline: `2px solid ${BRAND_COLORS.primary}`,
      outlineOffset: '2px'
    };
  }
  
  // If background is light, use dark outline
  const darkContrast = testContrast(BRAND_COLORS.darkGrey, backgroundColor);
  if (darkContrast.wcagAA) {
    return {
      outline: `2px solid ${BRAND_COLORS.darkGrey}`,
      outlineOffset: '2px'
    };
  }
  
  // Fallback to high contrast outline with shadow
  return {
    outline: `2px solid ${BRAND_COLORS.primary}`,
    outlineOffset: '2px',
    boxShadow: `0 0 0 4px rgba(255, 255, 255, 0.8)`
  };
}

/**
 * CSS classes for focus indicators
 */
export const FOCUS_CLASSES = {
  // Standard focus for light backgrounds
  standard: 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  
  // Focus for dark backgrounds
  dark: 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900',
  
  // High contrast focus
  highContrast: 'focus:outline-none focus:ring-4 focus:ring-primary focus:ring-offset-4 focus:ring-offset-white',
  
  // Button focus
  button: 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus-visible:ring-2',
  
  // Input focus
  input: 'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
  
  // Link focus
  link: 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded-sm'
};

/**
 * Apply focus indicator to element
 */
export function applyFocusIndicator(element: HTMLElement, backgroundColor?: string): void {
  const style = getFocusIndicator(backgroundColor);
  
  element.style.outline = style.outline;
  element.style.outlineOffset = style.outlineOffset;
  
  if (style.boxShadow) {
    element.style.boxShadow = style.boxShadow;
  }
}

/**
 * Remove focus indicator from element
 */
export function removeFocusIndicator(element: HTMLElement): void {
  element.style.outline = '';
  element.style.outlineOffset = '';
  element.style.boxShadow = '';
}

/**
 * Enhanced focus management for complex components
 */
export class FocusManager {
  private focusedElement: HTMLElement | null = null;
  private backgroundColor: string;
  private isHighContrast: boolean = false;

  constructor(backgroundColor: string = '#FFFFFF') {
    this.backgroundColor = backgroundColor;
    this.detectHighContrastMode();
  }

  private detectHighContrastMode(): void {
    this.isHighContrast = document.documentElement.classList.contains('high-contrast');
    
    // Listen for high contrast mode changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          this.isHighContrast = document.documentElement.classList.contains('high-contrast');
          if (this.focusedElement) {
            this.applyEnhancedFocus(this.focusedElement);
          }
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  private applyEnhancedFocus(element: HTMLElement): void {
    if (this.isHighContrast) {
      element.style.outline = `4px solid ${BRAND_COLORS.primaryAccessible}`;
      element.style.outlineOffset = '3px';
      element.style.boxShadow = `0 0 0 8px rgba(168, 92, 0, 0.3)`;
    } else {
      applyFocusIndicator(element, this.backgroundColor);
    }
  }

  focus(element: HTMLElement): void {
    this.blur();
    this.focusedElement = element;
    this.applyEnhancedFocus(element);
    element.focus();
  }

  blur(): void {
    if (this.focusedElement) {
      removeFocusIndicator(this.focusedElement);
      this.focusedElement = null;
    }
  }

  setBackgroundColor(color: string): void {
    this.backgroundColor = color;
    if (this.focusedElement) {
      this.applyEnhancedFocus(this.focusedElement);
    }
  }

  setHighContrastMode(enabled: boolean): void {
    this.isHighContrast = enabled;
    if (this.focusedElement) {
      this.applyEnhancedFocus(this.focusedElement);
    }
  }
}

/**
 * Keyboard navigation manager
 */
export class KeyboardNavigationManager {
  private focusableElements: HTMLElement[] = [];
  private currentIndex: number = -1;
  private container: HTMLElement;

  constructor(container: HTMLElement = document.body) {
    this.container = container;
    this.updateFocusableElements();
    this.setupKeyboardListeners();
  }

  private updateFocusableElements(): void {
    const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    this.focusableElements = Array.from(this.container.querySelectorAll(selector));
  }

  private setupKeyboardListeners(): void {
    this.container.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        this.handleTabNavigation(event);
      } else if (event.key === 'Escape') {
        this.handleEscape(event);
      }
    });
  }

  private handleTabNavigation(event: KeyboardEvent): void {
    this.updateFocusableElements();
    
    if (this.focusableElements.length === 0) return;
    
    const activeElement = document.activeElement as HTMLElement;
    this.currentIndex = this.focusableElements.indexOf(activeElement);
    
    if (event.shiftKey) {
      // Shift + Tab (backward)
      this.currentIndex = this.currentIndex <= 0 ? this.focusableElements.length - 1 : this.currentIndex - 1;
    } else {
      // Tab (forward)
      this.currentIndex = this.currentIndex >= this.focusableElements.length - 1 ? 0 : this.currentIndex + 1;
    }
    
    event.preventDefault();
    this.focusableElements[this.currentIndex]?.focus();
  }

  private handleEscape(event: KeyboardEvent): void {
    // Find the closest modal or dialog
    const modal = (event.target as HTMLElement).closest('[role="dialog"], [role="alertdialog"], .modal');
    if (modal) {
      // Focus the close button or first focusable element
      const closeButton = modal.querySelector('[aria-label*="close"], [data-close], .close-button') as HTMLElement;
      if (closeButton) {
        closeButton.focus();
      }
    }
  }

  focusFirst(): void {
    this.updateFocusableElements();
    if (this.focusableElements.length > 0) {
      this.currentIndex = 0;
      this.focusableElements[0].focus();
    }
  }

  focusLast(): void {
    this.updateFocusableElements();
    if (this.focusableElements.length > 0) {
      this.currentIndex = this.focusableElements.length - 1;
      this.focusableElements[this.currentIndex].focus();
    }
  }

  trapFocus(): void {
    this.container.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        this.updateFocusableElements();
        
        if (this.focusableElements.length === 0) {
          event.preventDefault();
          return;
        }
        
        const firstElement = this.focusableElements[0];
        const lastElement = this.focusableElements[this.focusableElements.length - 1];
        
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    });
  }
}

/**
 * Focus indicator testing utilities
 */
export function testFocusIndicators(): Promise<{
  passed: number;
  failed: number;
  total: number;
  results: Array<{
    element: string;
    passed: boolean;
    message: string;
    selector: string;
  }>;
}> {
  return new Promise((resolve) => {
    const results: Array<{
      element: string;
      passed: boolean;
      message: string;
      selector: string;
    }> = [];
    
    const focusableElements = document.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    let passed = 0;
    let failed = 0;
    
    focusableElements.forEach((element, index) => {
      const tagName = element.tagName.toLowerCase();
      const selector = `${tagName}:nth-child(${index + 1})`;
      
      // Test if element can receive focus
      (element as HTMLElement).focus();
      const hasFocus = document.activeElement === element;
      
      if (hasFocus) {
        // Test if focus indicator is visible
        const computedStyle = window.getComputedStyle(element, ':focus');
        const outline = computedStyle.outline;
        const boxShadow = computedStyle.boxShadow;
        const outlineWidth = computedStyle.outlineWidth;
        
        const hasVisibleFocus = outline !== 'none' || 
                               boxShadow !== 'none' || 
                               outlineWidth !== '0px';
        
        if (hasVisibleFocus) {
          passed++;
          results.push({
            element: tagName,
            passed: true,
            message: `Element has visible focus indicator`,
            selector
          });
        } else {
          failed++;
          results.push({
            element: tagName,
            passed: false,
            message: `Element lacks visible focus indicator`,
            selector
          });
        }
      } else {
        failed++;
        results.push({
          element: tagName,
          passed: false,
          message: `Element cannot receive focus`,
          selector
        });
      }
    });
    
    resolve({
      passed,
      failed,
      total: passed + failed,
      results
    });
  });
}

/**
 * Test focus trap functionality
 */
export function testFocusTrap(container: HTMLElement): boolean {
  const focusableElements = container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length === 0) return false;
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  // Test forward tab from last element
  lastElement.focus();
  const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
  container.dispatchEvent(tabEvent);
  
  // Should focus first element
  const focusedAfterTab = document.activeElement === firstElement;
  
  // Test backward tab from first element
  firstElement.focus();
  const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
  container.dispatchEvent(shiftTabEvent);
  
  // Should focus last element
  const focusedAfterShiftTab = document.activeElement === lastElement;
  
  return focusedAfterTab && focusedAfterShiftTab;
}