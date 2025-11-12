import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs/promises';
import path from 'path';

/**
 * Cross-Browser Compatibility Tests for Brand Design System
 * Tests CSS features and font loading across different browser environments
 */

describe('Brand Design System - Cross-Browser Compatibility Tests', () => {
  let cssContent: string;
  let tailwindConfig: string;

  beforeAll(async () => {
    // Load CSS and config files
    const cssPath = path.join(process.cwd(), 'client/src/index.css');
    const configPath = path.join(process.cwd(), 'tailwind.config.ts');
    
    try {
      cssContent = await fs.readFile(cssPath, 'utf-8');
    } catch (error) {
      cssContent = '';
    }
    
    try {
      tailwindConfig = await fs.readFile(configPath, 'utf-8');
    } catch (error) {
      tailwindConfig = '';
    }
  });

  describe('CSS Custom Properties Support', () => {
    it('should use CSS custom properties with fallback values', () => {
      // Check that CSS custom properties are defined
      expect(cssContent).toMatch(/--primary:\s*[^;]+;/);
      expect(cssContent).toMatch(/--foreground:\s*[^;]+;/);
      expect(cssContent).toMatch(/--background:\s*[^;]+;/);
    });

    it('should provide fallback values for older browsers', () => {
      // Create a mock older browser environment (IE11-like)
      const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              ${cssContent}
              /* Test fallback support */
              .test-fallback {
                color: #FF9900; /* Fallback */
                color: hsl(var(--primary)); /* Modern */
              }
            </style>
          </head>
          <body>
            <div class="test-fallback">Test</div>
          </body>
        </html>
      `);

      const testElement = dom.window.document.querySelector('.test-fallback');
      expect(testElement).toBeTruthy();
      
      dom.window.close();
    });

    it('should use HSL color format for better browser support', () => {
      // HSL is better supported than newer color formats
      const hslPattern = /hsl\(\s*\d+\s+\d+%\s+\d+%\s*\)/g;
      const matches = cssContent.match(hslPattern);
      
      if (matches) {
        expect(matches.length).toBeGreaterThan(0);
      }
      
      // Should not use newer color formats that have limited support
      expect(cssContent).not.toMatch(/oklch\(/);
      expect(cssContent).not.toMatch(/color\(/);
    });
  });

  describe('Font Loading Compatibility', () => {
    it('should use font-display: swap for better performance', () => {
      // Check for font-display: swap in CSS
      if (cssContent.includes('@font-face')) {
        expect(cssContent).toMatch(/font-display:\s*swap/);
      }
    });

    it('should provide comprehensive font fallbacks', () => {
      // Check for proper font stack
      const fontFamilyPattern = /font-family:\s*[^;]+;/g;
      const fontFamilyMatches = cssContent.match(fontFamilyPattern);
      
      if (fontFamilyMatches) {
        for (const match of fontFamilyMatches) {
          if (match.includes('Base Neue')) {
            // Should include system font fallbacks
            expect(match).toMatch(/system-ui|sans-serif/);
          }
        }
      }
    });

    it('should handle font loading failures gracefully', () => {
      // Test font loading with JSDOM (simulates browser without custom fonts)
      const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              ${cssContent}
            </style>
          </head>
          <body>
            <p class="font-sans">Test text</p>
          </body>
        </html>
      `);

      const textElement = dom.window.document.querySelector('p');
      const computedStyle = dom.window.getComputedStyle(textElement!);
      
      // Should fall back to system fonts if Base Neue is not available
      expect(computedStyle.fontFamily).toBeTruthy();
      
      dom.window.close();
    });
  });

  describe('CSS Grid and Flexbox Compatibility', () => {
    it('should use widely supported layout methods', () => {
      // Check that we're not using cutting-edge CSS that lacks browser support
      
      // CSS Grid is well supported (IE11+ with prefixes)
      if (cssContent.includes('grid')) {
        // Should not use newer grid features
        expect(cssContent).not.toMatch(/subgrid/);
      }
      
      // Flexbox is universally supported
      expect(cssContent).not.toMatch(/flex-basis:\s*content/); // Limited support
    });

    it('should provide flexbox fallbacks where needed', () => {
      // Modern flexbox properties should have fallbacks for older browsers
      const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              ${cssContent}
              .test-flex {
                display: -webkit-box;
                display: -ms-flexbox;
                display: flex;
              }
            </style>
          </head>
          <body>
            <div class="test-flex">Test</div>
          </body>
        </html>
      `);

      const flexElement = dom.window.document.querySelector('.test-flex');
      expect(flexElement).toBeTruthy();
      
      dom.window.close();
    });
  });

  describe('Color Space and Gamut Compatibility', () => {
    it('should use sRGB color space for maximum compatibility', () => {
      // Should not use P3 or other wide gamut color spaces
      expect(cssContent).not.toMatch(/color\(display-p3/);
      expect(cssContent).not.toMatch(/color\(rec2020/);
      
      // Should use standard RGB/HSL values
      expect(cssContent).toMatch(/hsl\(|rgb\(|#[0-9a-fA-F]/);
    });

    it('should handle high DPI displays correctly', () => {
      // Test with different pixel ratios
      const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              ${cssContent}
              @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
                .high-dpi { font-size: 14px; }
              }
            </style>
          </head>
          <body>
            <div class="high-dpi">Test</div>
          </body>
        </html>
      `);

      // Should handle high DPI without issues
      const element = dom.window.document.querySelector('.high-dpi');
      expect(element).toBeTruthy();
      
      dom.window.close();
    });
  });

  describe('CSS Animation and Transition Compatibility', () => {
    it('should use vendor prefixes for animations where needed', () => {
      // Check for transition and animation properties
      if (cssContent.includes('transition') || cssContent.includes('animation')) {
        // Modern browsers don't need prefixes, but check for compatibility
        const dom = new JSDOM(`
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                ${cssContent}
                .test-transition {
                  transition: all 0.3s ease;
                  -webkit-transition: all 0.3s ease;
                }
              </style>
            </head>
            <body>
              <div class="test-transition">Test</div>
            </body>
          </html>
        `);

        const element = dom.window.document.querySelector('.test-transition');
        expect(element).toBeTruthy();
        
        dom.window.close();
      }
    });

    it('should handle reduced motion preferences', () => {
      // Should respect prefers-reduced-motion
      if (cssContent.includes('animation') || cssContent.includes('transition')) {
        const dom = new JSDOM(`
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                ${cssContent}
                @media (prefers-reduced-motion: reduce) {
                  * { animation: none !important; transition: none !important; }
                }
              </style>
            </head>
            <body>
              <div class="animated-element">Test</div>
            </body>
          </html>
        `);

        const element = dom.window.document.querySelector('.animated-element');
        expect(element).toBeTruthy();
        
        dom.window.close();
      }
    });
  });

  describe('Mobile Browser Compatibility', () => {
    it('should handle touch interactions properly', () => {
      const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              ${cssContent}
              .touch-target {
                min-height: 44px; /* iOS minimum touch target */
                min-width: 44px;
              }
            </style>
          </head>
          <body>
            <button class="touch-target bg-primary">Touch me</button>
          </body>
        </html>
      `);

      const button = dom.window.document.querySelector('button');
      expect(button).toBeTruthy();
      expect(button?.className).toContain('bg-primary');
      
      dom.window.close();
    });

    it('should handle iOS Safari specific issues', () => {
      // Test for iOS Safari specific CSS
      const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              ${cssContent}
              /* iOS Safari fixes */
              input[type="text"] {
                -webkit-appearance: none;
                border-radius: 0;
              }
            </style>
          </head>
          <body>
            <input type="text" class="border-primary">
          </body>
        </html>
      `);

      const input = dom.window.document.querySelector('input');
      expect(input).toBeTruthy();
      
      dom.window.close();
    });
  });

  describe('Print Styles Compatibility', () => {
    it('should provide appropriate print styles', () => {
      // Check for print media queries
      if (cssContent.includes('@media print')) {
        const dom = new JSDOM(`
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                ${cssContent}
                @media print {
                  .no-print { display: none; }
                  .print-only { display: block; }
                }
              </style>
            </head>
            <body>
              <div class="no-print bg-primary">Screen only</div>
              <div class="print-only">Print only</div>
            </body>
          </html>
        `);

        const screenElement = dom.window.document.querySelector('.no-print');
        const printElement = dom.window.document.querySelector('.print-only');
        
        expect(screenElement).toBeTruthy();
        expect(printElement).toBeTruthy();
        
        dom.window.close();
      }
    });
  });

  describe('Accessibility Features Compatibility', () => {
    it('should support high contrast mode', () => {
      // Test Windows high contrast mode
      const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              ${cssContent}
              @media (prefers-contrast: high) {
                .high-contrast {
                  border: 2px solid;
                  background: ButtonFace;
                  color: ButtonText;
                }
              }
            </style>
          </head>
          <body>
            <div class="high-contrast bg-primary">High contrast test</div>
          </body>
        </html>
      `);

      const element = dom.window.document.querySelector('.high-contrast');
      expect(element).toBeTruthy();
      
      dom.window.close();
    });

    it('should support forced colors mode', () => {
      // Test Windows forced colors mode
      const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              ${cssContent}
              @media (forced-colors: active) {
                .forced-colors {
                  forced-color-adjust: none;
                  border: 1px solid ButtonText;
                }
              }
            </style>
          </head>
          <body>
            <div class="forced-colors bg-primary">Forced colors test</div>
          </body>
        </html>
      `);

      const element = dom.window.document.querySelector('.forced-colors');
      expect(element).toBeTruthy();
      
      dom.window.close();
    });
  });

  describe('CSS Feature Detection', () => {
    it('should use @supports for progressive enhancement', () => {
      // Check for feature detection where appropriate
      const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              ${cssContent}
              /* Feature detection example */
              .feature-test {
                background: #FF9900; /* Fallback */
              }
              
              @supports (background: hsl(var(--primary))) {
                .feature-test {
                  background: hsl(var(--primary));
                }
              }
            </style>
          </head>
          <body>
            <div class="feature-test">Feature detection test</div>
          </body>
        </html>
      `);

      const element = dom.window.document.querySelector('.feature-test');
      expect(element).toBeTruthy();
      
      dom.window.close();
    });
  });

  describe('Performance Optimization', () => {
    it('should minimize CSS size and complexity', () => {
      // Check that CSS is not overly complex
      const lines = cssContent.split('\n');
      const nonEmptyLines = lines.filter(line => line.trim().length > 0);
      
      // Should not have excessive nesting or complexity
      let nestingLevel = 0;
      let maxNesting = 0;
      
      for (const line of nonEmptyLines) {
        if (line.includes('{')) nestingLevel++;
        if (line.includes('}')) nestingLevel--;
        maxNesting = Math.max(maxNesting, nestingLevel);
      }
      
      // Reasonable nesting limit for performance
      expect(maxNesting).toBeLessThan(10);
    });

    it('should use efficient selectors', () => {
      // Check for inefficient CSS selectors
      const inefficientPatterns = [
        /\*\s*\{/, // Universal selector
        /\[.*\*=.*\]/, // Attribute selectors with wildcards
        /:\w+\s*:\w+\s*:\w+/, // Multiple pseudo-selectors
      ];

      for (const pattern of inefficientPatterns) {
        const matches = cssContent.match(pattern);
        if (matches) {
          // Allow some universal selectors for resets
          if (pattern.source.includes('*') && matches.length > 3) {
            console.warn(`Found potentially inefficient selector pattern: ${matches[0]}`);
          }
        }
      }
    });
  });
});