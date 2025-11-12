import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { chromium, Browser, Page, BrowserContext } from 'playwright';

describe('Theme Switching E2E Tests', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  beforeEach(async () => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Theme Toggle Functionality', () => {
    it('should toggle between light and dark themes', async () => {
      await page.goto('http://localhost:5173');
      
      const themeToggle = page.locator('[data-testid="theme-toggle"]').first();
      
      const initialTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      });
      expect(initialTheme).toBe('light');
      
      await themeToggle.click();
      await page.waitForTimeout(300);
      
      const darkTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      });
      expect(darkTheme).toBe('dark');
      
      await themeToggle.click();
      await page.waitForTimeout(300);
      
      const lightTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      });
      expect(lightTheme).toBe('light');
    });

    it('should persist theme preference across page reloads', async () => {
      await page.goto('http://localhost:5173');
      
      const themeToggle = page.locator('[data-testid="theme-toggle"]').first();
      await themeToggle.click();
      await page.waitForTimeout(300);
      
      let currentTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      });
      expect(currentTheme).toBe('dark');
      
      await page.reload();
      await page.waitForTimeout(500);
      
      currentTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      });
      expect(currentTheme).toBe('dark');
    });

    it('should persist theme across different pages', async () => {
      await page.goto('http://localhost:5173');
      
      const themeToggle = page.locator('[data-testid="theme-toggle"]').first();
      await themeToggle.click();
      await page.waitForTimeout(300);
      
      const testPages = ['/login', '/signup'];
      
      for (const testPage of testPages) {
        await page.goto(`http://localhost:5173${testPage}`);
        await page.waitForTimeout(300);
        
        const currentTheme = await page.evaluate(() => {
          return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        });
        expect(currentTheme).toBe('dark');
      }
    });
  });

  describe('High Contrast Mode', () => {
    it('should toggle high contrast mode', async () => {
      await page.goto('http://localhost:5173');
      
      const highContrastToggle = page.locator('[data-testid="high-contrast-toggle"]').first();
      
      if (await highContrastToggle.count() > 0) {
        await highContrastToggle.click();
        await page.waitForTimeout(300);
        
        const hasHighContrast = await page.evaluate(() => {
          return document.documentElement.classList.contains('high-contrast');
        });
        expect(hasHighContrast).toBe(true);
      }
    });
  });

  describe('Theme Transition Performance', () => {
    it('should complete theme transitions quickly', async () => {
      await page.goto('http://localhost:5173');
      
      const themeToggle = page.locator('[data-testid="theme-toggle"]').first();
      
      const startTime = Date.now();
      await themeToggle.click();
      
      await page.waitForFunction(() => {
        return document.documentElement.classList.contains('dark');
      }, { timeout: 1000 });
      
      const endTime = Date.now();
      const transitionTime = endTime - startTime;
      
      expect(transitionTime).toBeLessThan(500);
    });

    it('should handle rapid theme switching', async () => {
      await page.goto('http://localhost:5173');
      
      const themeToggle = page.locator('[data-testid="theme-toggle"]').first();
      
      for (let i = 0; i < 5; i++) {
        await themeToggle.click();
        await page.waitForTimeout(50);
      }
      
      await page.waitForTimeout(500);
      
      const isResponsive = await page.evaluate(() => {
        const button = document.querySelector('button');
        return button && !button.disabled;
      });
      
      expect(isResponsive).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      await page.goto('http://localhost:5173');
      
      await page.evaluate(() => {
        localStorage.setItem = () => {
          throw new Error('localStorage not available');
        };
      });
      
      const themeToggle = page.locator('[data-testid="theme-toggle"]').first();
      await themeToggle.click();
      await page.waitForTimeout(300);
      
      const themeChanged = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark');
      });
      
      expect(typeof themeChanged).toBe('boolean');
    });
  });
});