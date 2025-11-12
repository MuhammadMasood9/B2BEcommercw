import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { getContrastRatio, isValidContrastRatio } from '../../client/src/utils/themeUtils';

describe('Theme Accessibility - Contrast Ratios', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
    
    // Inject helper functions for color conversion
    await page.addInitScript(() => {
      (window as any).rgbToHex = (rgb: string): string | null => {
        const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!match) return null;
        
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        
        return '#' + [r, g, b].map(x => {
          const hex = x.toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        }).join('');
      };
      
      (window as any).calculateContrastRatio = (color1: string, color2: string): number => {
        const getLuminance = (hex: string): number => {
          const rgb = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
          if (!rgb) return 0;
          
          const [r, g, b] = [
            parseInt(rgb[1], 16) / 255,
            parseInt(rgb[2], 16) / 255,
            parseInt(rgb[3], 16) / 255
          ].map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
          
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        
        const l1 = getLuminance(color1);
        const l2 = getLuminance(color2);
        
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        
        return (lighter + 0.05) / (darker + 0.05);
      };
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Brand Color Contrast Compliance', () => {
    const brandColors = {
      orange: '#F2A30F',
      darkGrey: '#212121',
      lightGrey: '#EEEEEE',
      white: '#FFFFFF',
      black: '#000000'
    };

    it('should meet WCAG AA standards for primary text combinations', () => {
      const combinations = [
        { bg: brandColors.white, fg: brandColors.darkGrey, name: 'Dark grey on white' },
        { bg: brandColors.lightGrey, fg: brandColors.darkGrey, name: 'Dark grey on light grey' },
        { bg: brandColors.darkGrey, fg: brandColors.white, name: 'White on dark grey' },
        { bg: brandColors.white, fg: brandColors.black, name: 'Black on white' }
      ];

      combinations.forEach(({ bg, fg, name }) => {
        const ratio = getContrastRatio(fg, bg);
        const isValid = isValidContrastRatio(fg, bg, 'AA');
        
        expect(isValid, `${name} should meet WCAG AA (4.5:1) - actual ratio: ${ratio.toFixed(2)}`).toBe(true);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    });

    it('should meet WCAG AAA standards for enhanced accessibility', () => {
      const highContrastCombinations = [
        { bg: brandColors.white, fg: brandColors.black, name: 'Black on white' },
        { bg: brandColors.darkGrey, fg: brandColors.white, name: 'White on dark grey' }
      ];

      highContrastCombinations.forEach(({ bg, fg, name }) => {
        const ratio = getContrastRatio(fg, bg);
        const isValid = isValidContrastRatio(fg, bg, 'AAA');
        
        expect(isValid, `${name} should meet WCAG AAA (7:1) - actual ratio: ${ratio.toFixed(2)}`).toBe(true);
        expect(ratio).toBeGreaterThanOrEqual(7);
      });
    });

    it('should handle large text contrast requirements', () => {
      const largTextCombinations = [
        { bg: brandColors.orange, fg: brandColors.white, name: 'White on orange (large text)' },
        { bg: brandColors.orange, fg: brandColors.black, name: 'Black on orange (large text)' }
      ];

      largTextCombinations.forEach(({ bg, fg, name }) => {
        const ratio = getContrastRatio(fg, bg);
        const isValidAA = isValidContrastRatio(fg, bg, 'AA', true);
        
        expect(isValidAA, `${name} should meet WCAG AA for large text (3:1) - actual ratio: ${ratio.toFixed(2)}`).toBe(true);
        expect(ratio).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('Live Page Contrast Testing', () => {
    const testPages = [
      { url: '/', name: 'Home' },
      { url: '/login', name: 'Login' },
      { url: '/signup', name: 'Signup' }
    ];

    testPages.forEach(({ url, name }) => {
      it(`should have accessible contrast ratios on ${name} page in light theme`, async () => {
        await page.goto(`http://localhost:5173${url}`);
        
        await page.evaluate(() => {
          document.documentElement.classList.remove('dark', 'high-contrast');
        });
        
        await page.waitForTimeout(100);
        
        const contrastIssues = await page.evaluate(() => {
          const issues: Array<{element: string, fg: string, bg: string, ratio: number}> = [];
          const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label');
          
          textElements.forEach((element, index) => {
            const styles = window.getComputedStyle(element);
            const fg = styles.color;
            const bg = styles.backgroundColor;
            
            if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
              return;
            }
            
            const fgHex = (window as any).rgbToHex(fg);
            const bgHex = (window as any).rgbToHex(bg);
            
            if (fgHex && bgHex) {
              const ratio = (window as any).calculateContrastRatio(fgHex, bgHex);
              
              if (ratio < 4.5) {
                issues.push({
                  element: `${element.tagName.toLowerCase()}[${index}]`,
                  fg: fgHex,
                  bg: bgHex,
                  ratio: ratio
                });
              }
            }
          });
          
          return issues;
        });
        
        expect(contrastIssues.length, `Contrast issues found on ${name} page: ${JSON.stringify(contrastIssues, null, 2)}`).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('Interactive Element Contrast', () => {
    it('should have accessible contrast for focus indicators', async () => {
      await page.goto('http://localhost:5173');
      
      const focusableElements = await page.$$('button, input, a');
      
      for (const element of focusableElements.slice(0, 3)) {
        await element.focus();
        
        const focusStyles = await page.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            outlineColor: styles.outlineColor,
            backgroundColor: styles.backgroundColor,
            color: styles.color
          };
        }, element);
        
        if (focusStyles.outlineColor && focusStyles.outlineColor !== 'rgba(0, 0, 0, 0)') {
          const outlineHex = await page.evaluate((color) => (window as any).rgbToHex(color), focusStyles.outlineColor);
          const bgHex = await page.evaluate((color) => (window as any).rgbToHex(color), focusStyles.backgroundColor);
          
          if (outlineHex && bgHex) {
            const ratio = getContrastRatio(outlineHex, bgHex);
            expect(ratio).toBeGreaterThanOrEqual(3);
          }
        }
      }
    });
  });
});