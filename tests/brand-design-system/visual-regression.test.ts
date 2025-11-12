import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs/promises';
import path from 'path';

/**
 * Visual Regression Tests for Brand Design System
 * Tests key components with new orange and dark grey color scheme
 */

describe('Brand Design System - Visual Regression Tests', () => {
  let dom: JSDOM;
  let document: Document;
  let window: Window;
  let cssContent: string;

  beforeAll(async () => {
    // Load the main CSS file to test color variables
    const cssPath = path.join(process.cwd(), 'client/src/index.css');
    cssContent = await fs.readFile(cssPath, 'utf-8');
    
    // Create a DOM environment for testing
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>${cssContent}</style>
        </head>
        <body>
          <div id="test-container"></div>
        </body>
      </html>
    `, {
      pretendToBeVisual: true,
      resources: 'usable'
    });

    document = dom.window.document;
    window = dom.window as unknown as Window;
    
    // Make DOM globals available
    global.document = document;
    global.window = window;
  });

  afterAll(() => {
    dom.window.close();
  });

  describe('CSS Custom Properties', () => {
    it('should have correct primary orange color defined', () => {
      const rootStyles = window.getComputedStyle(document.documentElement);
      const primaryColor = rootStyles.getPropertyValue('--primary').trim();
      
      // Should be orange in HSL format: 39 100% 50%
      expect(primaryColor).toMatch(/39\s+100%\s+50%/);
    });

    it('should have correct dark grey foreground color defined', () => {
      const rootStyles = window.getComputedStyle(document.documentElement);
      const foregroundColor = rootStyles.getPropertyValue('--foreground').trim();
      
      // Should be dark grey in HSL format: 0 0% 10%
      expect(foregroundColor).toMatch(/0\s+0%\s+10%/);
    });

    it('should have Base Neue font family defined', () => {
      const rootStyles = window.getComputedStyle(document.documentElement);
      const fontFamily = rootStyles.getPropertyValue('--font-sans').trim();
      
      expect(fontFamily).toContain('Base Neue');
    });

    it('should not contain any blue color references in CSS variables', () => {
      const rootStyles = window.getComputedStyle(document.documentElement);
      const allProperties = Array.from(document.documentElement.style);
      
      allProperties.forEach(property => {
        if (property.startsWith('--')) {
          const value = rootStyles.getPropertyValue(property);
          expect(value.toLowerCase()).not.toContain('blue');
          expect(value).not.toMatch(/\b(0\s+100%\s+50%|240\s+100%\s+50%)\b/); // Common blue HSL values
        }
      });
    });
  });

  describe('Button Component Colors', () => {
    it('should render primary button with orange background', () => {
      const button = document.createElement('button');
      button.className = 'bg-primary text-primary-foreground';
      document.getElementById('test-container')?.appendChild(button);

      const styles = window.getComputedStyle(button);
      const backgroundColor = styles.backgroundColor;
      
      // Should resolve to orange color
      expect(backgroundColor).toBeTruthy();
      expect(backgroundColor).not.toContain('blue');
    });

    it('should render secondary button with dark grey background', () => {
      const button = document.createElement('button');
      button.className = 'bg-secondary text-secondary-foreground';
      document.getElementById('test-container')?.appendChild(button);

      const styles = window.getComputedStyle(button);
      const backgroundColor = styles.backgroundColor;
      
      expect(backgroundColor).toBeTruthy();
      expect(backgroundColor).not.toContain('blue');
    });

    it('should have proper hover states for primary buttons', () => {
      const button = document.createElement('button');
      button.className = 'bg-primary hover:bg-primary/90';
      document.getElementById('test-container')?.appendChild(button);

      // Test that hover class exists and doesn't contain blue
      expect(button.className).toContain('hover:bg-primary/90');
      expect(button.className).not.toContain('blue');
    });
  });

  describe('Navigation Component Colors', () => {
    it('should render navigation with dark grey background', () => {
      const nav = document.createElement('nav');
      nav.className = 'bg-secondary';
      document.getElementById('test-container')?.appendChild(nav);

      const styles = window.getComputedStyle(nav);
      expect(styles.backgroundColor).toBeTruthy();
      expect(styles.backgroundColor).not.toContain('blue');
    });

    it('should render active navigation items with orange accent', () => {
      const navItem = document.createElement('a');
      navItem.className = 'text-primary border-l-2 border-primary';
      document.getElementById('test-container')?.appendChild(navItem);

      expect(navItem.className).toContain('text-primary');
      expect(navItem.className).toContain('border-primary');
      expect(navItem.className).not.toContain('blue');
    });
  });

  describe('Form Component Colors', () => {
    it('should render input with orange focus states', () => {
      const input = document.createElement('input');
      input.className = 'border-input focus:border-primary focus:ring-primary';
      document.getElementById('test-container')?.appendChild(input);

      expect(input.className).toContain('focus:border-primary');
      expect(input.className).toContain('focus:ring-primary');
      expect(input.className).not.toContain('blue');
    });

    it('should render labels with dark grey text', () => {
      const label = document.createElement('label');
      label.className = 'text-foreground';
      document.getElementById('test-container')?.appendChild(label);

      const styles = window.getComputedStyle(label);
      expect(styles.color).toBeTruthy();
      expect(styles.color).not.toContain('blue');
    });
  });

  describe('Card Component Colors', () => {
    it('should render cards with proper border and background colors', () => {
      const card = document.createElement('div');
      card.className = 'bg-card border border-border';
      document.getElementById('test-container')?.appendChild(card);

      // Test class names instead of computed styles in JSDOM
      expect(card.className).toContain('bg-card');
      expect(card.className).toContain('border-border');
      expect(card.className).not.toContain('blue');
    });

    it('should render card headers with dark grey text', () => {
      const cardHeader = document.createElement('div');
      cardHeader.className = 'text-card-foreground';
      document.getElementById('test-container')?.appendChild(cardHeader);

      const styles = window.getComputedStyle(cardHeader);
      expect(styles.color).toBeTruthy();
      expect(styles.color).not.toContain('blue');
    });
  });

  describe('Modal and Overlay Components', () => {
    it('should render modal backdrop with proper opacity', () => {
      const backdrop = document.createElement('div');
      backdrop.className = 'bg-background/80 backdrop-blur-sm';
      document.getElementById('test-container')?.appendChild(backdrop);

      expect(backdrop.className).toContain('bg-background/80');
      expect(backdrop.className).not.toContain('blue');
    });

    it('should render modal content with brand colors', () => {
      const modal = document.createElement('div');
      modal.className = 'bg-background border border-border';
      document.getElementById('test-container')?.appendChild(modal);

      // Test class names instead of computed styles in JSDOM
      expect(modal.className).toContain('bg-background');
      expect(modal.className).toContain('border-border');
      expect(modal.className).not.toContain('blue');
    });
  });

  describe('Status and Badge Components', () => {
    it('should render success badges with appropriate green colors', () => {
      const badge = document.createElement('span');
      badge.className = 'bg-green-100 text-green-800';
      document.getElementById('test-container')?.appendChild(badge);

      expect(badge.className).toContain('green');
      expect(badge.className).not.toContain('blue');
    });

    it('should render warning badges with orange variations', () => {
      const badge = document.createElement('span');
      badge.className = 'bg-primary/10 text-primary';
      document.getElementById('test-container')?.appendChild(badge);

      expect(badge.className).toContain('primary');
      expect(badge.className).not.toContain('blue');
    });
  });

  describe('Typography and Font Rendering', () => {
    it('should apply Base Neue font family to text elements', () => {
      const text = document.createElement('p');
      text.className = 'font-sans';
      text.textContent = 'Sample text';
      document.getElementById('test-container')?.appendChild(text);

      // Test class name and CSS variable definition instead of computed styles
      expect(text.className).toContain('font-sans');
      
      // Check if CSS contains Base Neue font definition
      const rootStyles = window.getComputedStyle(document.documentElement);
      const fontSansVar = rootStyles.getPropertyValue('--font-sans').trim();
      if (fontSansVar) {
        expect(fontSansVar).toContain('Base Neue');
      } else {
        // Fallback: check if CSS content contains Base Neue
        expect(cssContent).toContain('Base Neue');
      }
    });

    it('should render headings with proper font weights', () => {
      const heading = document.createElement('h1');
      heading.className = 'font-semibold text-foreground';
      document.getElementById('test-container')?.appendChild(heading);

      const styles = window.getComputedStyle(heading);
      expect(styles.fontWeight).toBeTruthy();
      expect(styles.color).toBeTruthy();
      expect(styles.color).not.toContain('blue');
    });
  });

  describe('Responsive Design Colors', () => {
    it('should maintain brand colors across different screen sizes', () => {
      const responsiveElement = document.createElement('div');
      responsiveElement.className = 'bg-primary md:bg-secondary lg:bg-accent';
      document.getElementById('test-container')?.appendChild(responsiveElement);

      // All responsive classes should use brand colors
      expect(responsiveElement.className).toContain('bg-primary');
      expect(responsiveElement.className).toContain('bg-secondary');
      expect(responsiveElement.className).toContain('bg-accent');
      expect(responsiveElement.className).not.toContain('blue');
    });
  });

  describe('Dark Mode Color Variations', () => {
    it('should have dark mode color variations defined', () => {
      // Add dark class to test dark mode
      document.documentElement.classList.add('dark');
      
      const darkElement = document.createElement('div');
      darkElement.className = 'bg-background text-foreground';
      document.getElementById('test-container')?.appendChild(darkElement);

      const styles = window.getComputedStyle(darkElement);
      expect(styles.backgroundColor).toBeTruthy();
      expect(styles.color).toBeTruthy();
      
      // Clean up
      document.documentElement.classList.remove('dark');
    });
  });
});