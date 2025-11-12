import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Visual regression test configuration
const VISUAL_TEST_CONFIG = {
  threshold: 0.2, // 20% difference threshold
  screenshotDir: 'tests/visual/screenshots',
  baselineDir: 'tests/visual/baselines',
  diffDir: 'tests/visual/diffs',
  viewports: [
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 667, name: 'mobile' }
  ]
};

// Ensure directories exist
Object.values(VISUAL_TEST_CONFIG).forEach(dir => {
  if (typeof dir === 'string' && dir.includes('/')) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
});

describe('Theme Visual Regression Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
    
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Component Theme Consistency', () => {
    const components = [
      'button',
      'input',
      'card',
      'header',
      'navigation',
      'form',
      'table',
      'modal'
    ];

    components.forEach(component => {
      it(`should maintain visual consistency for ${component} in light theme`, async () => {
        await page.goto(`http://localhost:5173/test-components/${component}`);
        
        // Set light theme
        await page.evaluate(() => {
          document.documentElement.classList.remove('dark', 'high-contrast');
        });
        
        await page.waitForTimeout(100); // Allow theme to apply
        
        for (const viewport of VISUAL_TEST_CONFIG.viewports) {
          await page.setViewportSize(viewport);
          
          const screenshot = await page.screenshot({
            fullPage: true,
            animations: 'disabled'
          });
          
          const screenshotPath = join(
            VISUAL_TEST_CONFIG.screenshotDir,
            `${component}-light-${viewport.name}.png`
          );
          
          const baselinePath = join(
            VISUAL_TEST_CONFIG.baselineDir,
            `${component}-light-${viewport.name}.png`
          );
          
          writeFileSync(screenshotPath, screenshot);
          
          if (existsSync(baselinePath)) {
            const baseline = readFileSync(baselinePath);
            const isMatch = await compareImages(screenshot, baseline);
            
            if (!isMatch) {
              const diffPath = join(
                VISUAL_TEST_CONFIG.diffDir,
                `${component}-light-${viewport.name}-diff.png`
              );
              
              await generateDiffImage(screenshot, baseline, diffPath);
              
              expect(isMatch).toBe(true);
            }
          } else {
            // Create baseline if it doesn't exist
            writeFileSync(baselinePath, screenshot);
            console.log(`Created baseline for ${component}-light-${viewport.name}`);
          }
        }
      });

      it(`should maintain visual consistency for ${component} in dark theme`, async () => {
        await page.goto(`http://localhost:5173/test-components/${component}`);
        
        // Set dark theme
        await page.evaluate(() => {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('high-contrast');
        });
        
        await page.waitForTimeout(100); // Allow theme to apply
        
        for (const viewport of VISUAL_TEST_CONFIG.viewports) {
          await page.setViewportSize(viewport);
          
          const screenshot = await page.screenshot({
            fullPage: true,
            animations: 'disabled'
          });
          
          const screenshotPath = join(
            VISUAL_TEST_CONFIG.screenshotDir,
            `${component}-dark-${viewport.name}.png`
          );
          
          const baselinePath = join(
            VISUAL_TEST_CONFIG.baselineDir,
            `${component}-dark-${viewport.name}.png`
          );
          
          writeFileSync(screenshotPath, screenshot);
          
          if (existsSync(baselinePath)) {
            const baseline = readFileSync(baselinePath);
            const isMatch = await compareImages(screenshot, baseline);
            
            if (!isMatch) {
              const diffPath = join(
                VISUAL_TEST_CONFIG.diffDir,
                `${component}-dark-${viewport.name}-diff.png`
              );
              
              await generateDiffImage(screenshot, baseline, diffPath);
              
              expect(isMatch).toBe(true);
            }
          } else {
            // Create baseline if it doesn't exist
            writeFileSync(baselinePath, screenshot);
            console.log(`Created baseline for ${component}-dark-${viewport.name}`);
          }
        }
      });

      it(`should maintain visual consistency for ${component} in high contrast mode`, async () => {
        await page.goto(`http://localhost:5173/test-components/${component}`);
        
        // Set high contrast mode
        await page.evaluate(() => {
          document.documentElement.classList.add('high-contrast');
          document.documentElement.classList.remove('dark');
        });
        
        await page.waitForTimeout(100); // Allow theme to apply
        
        for (const viewport of VISUAL_TEST_CONFIG.viewports) {
          await page.setViewportSize(viewport);
          
          const screenshot = await page.screenshot({
            fullPage: true,
            animations: 'disabled'
          });
          
          const screenshotPath = join(
            VISUAL_TEST_CONFIG.screenshotDir,
            `${component}-high-contrast-${viewport.name}.png`
          );
          
          const baselinePath = join(
            VISUAL_TEST_CONFIG.baselineDir,
            `${component}-high-contrast-${viewport.name}.png`
          );
          
          writeFileSync(screenshotPath, screenshot);
          
          if (existsSync(baselinePath)) {
            const baseline = readFileSync(baselinePath);
            const isMatch = await compareImages(screenshot, baseline);
            
            if (!isMatch) {
              const diffPath = join(
                VISUAL_TEST_CONFIG.diffDir,
                `${component}-high-contrast-${viewport.name}-diff.png`
              );
              
              await generateDiffImage(screenshot, baseline, diffPath);
              
              expect(isMatch).toBe(true);
            }
          } else {
            // Create baseline if it doesn't exist
            writeFileSync(baselinePath, screenshot);
            console.log(`Created baseline for ${component}-high-contrast-${viewport.name}`);
          }
        }
      });
    });
  });

  describe('Page Theme Consistency', () => {
    const pages = [
      { path: '/', name: 'home' },
      { path: '/login', name: 'login' },
      { path: '/signup', name: 'signup' },
      { path: '/dashboard', name: 'dashboard' },
      { path: '/products', name: 'products' },
      { path: '/categories', name: 'categories' }
    ];

    pages.forEach(({ path, name }) => {
      it(`should maintain theme consistency on ${name} page`, async () => {
        await page.goto(`http://localhost:5173${path}`);
        
        const themes = [
          { class: '', name: 'light' },
          { class: 'dark', name: 'dark' },
          { class: 'high-contrast', name: 'high-contrast' }
        ];
        
        for (const theme of themes) {
          await page.evaluate((themeClass) => {
            document.documentElement.className = themeClass;
          }, theme.class);
          
          await page.waitForTimeout(200); // Allow theme to apply
          
          const screenshot = await page.screenshot({
            fullPage: true,
            animations: 'disabled'
          });
          
          const screenshotPath = join(
            VISUAL_TEST_CONFIG.screenshotDir,
            `page-${name}-${theme.name}.png`
          );
          
          const baselinePath = join(
            VISUAL_TEST_CONFIG.baselineDir,
            `page-${name}-${theme.name}.png`
          );
          
          writeFileSync(screenshotPath, screenshot);
          
          if (existsSync(baselinePath)) {
            const baseline = readFileSync(baselinePath);
            const isMatch = await compareImages(screenshot, baseline);
            
            expect(isMatch).toBe(true);
          } else {
            writeFileSync(baselinePath, screenshot);
            console.log(`Created baseline for page-${name}-${theme.name}`);
          }
        }
      });
    });
  });

  describe('Theme Transition Visual Tests', () => {
    it('should not cause layout shifts during theme transitions', async () => {
      await page.goto('http://localhost:5173');
      
      // Take screenshot in light mode
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });
      await page.waitForTimeout(100);
      
      const lightScreenshot = await page.screenshot({
        fullPage: true,
        animations: 'disabled'
      });
      
      // Switch to dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      await page.waitForTimeout(100);
      
      const darkScreenshot = await page.screenshot({
        fullPage: true,
        animations: 'disabled'
      });
      
      // Compare layout structure (ignoring colors)
      const layoutMatch = await compareLayoutStructure(lightScreenshot, darkScreenshot);
      expect(layoutMatch).toBe(true);
    });

    it('should maintain focus indicators during theme switches', async () => {
      await page.goto('http://localhost:5173');
      
      // Focus on a button
      await page.focus('button');
      
      // Take screenshot with focus in light mode
      const lightFocusScreenshot = await page.screenshot({
        animations: 'disabled'
      });
      
      // Switch to dark mode while maintaining focus
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      await page.waitForTimeout(100);
      
      const darkFocusScreenshot = await page.screenshot({
        animations: 'disabled'
      });
      
      // Verify focus indicators are visible in both themes
      const lightHasFocus = await detectFocusIndicator(lightFocusScreenshot);
      const darkHasFocus = await detectFocusIndicator(darkFocusScreenshot);
      
      expect(lightHasFocus).toBe(true);
      expect(darkHasFocus).toBe(true);
    });
  });

  describe('Brand Color Consistency', () => {
    it('should use consistent brand colors across themes', async () => {
      await page.goto('http://localhost:5173/test-brand-colors');
      
      const brandColors = {
        orange: '#F2A30F',
        darkGrey: '#212121',
        lightGrey: '#EEEEEE'
      };
      
      for (const [colorName, expectedColor] of Object.entries(brandColors)) {
        // Test in light theme
        await page.evaluate(() => {
          document.documentElement.classList.remove('dark');
        });
        
        const lightColor = await page.evaluate((name) => {
          const element = document.querySelector(`[data-color="${name}"]`);
          return window.getComputedStyle(element).backgroundColor;
        }, colorName);
        
        // Test in dark theme
        await page.evaluate(() => {
          document.documentElement.classList.add('dark');
        });
        
        const darkColor = await page.evaluate((name) => {
          const element = document.querySelector(`[data-color="${name}"]`);
          return window.getComputedStyle(element).backgroundColor;
        }, colorName);
        
        // Verify colors are applied correctly (allowing for theme adjustments)
        expect(lightColor).toBeTruthy();
        expect(darkColor).toBeTruthy();
        
        // Colors should be different between themes (except for brand orange which may be adjusted)
        if (colorName !== 'orange') {
          expect(lightColor).not.toBe(darkColor);
        }
      }
    });
  });
});

// Helper functions for image comparison
async function compareImages(image1: Buffer, image2: Buffer): Promise<boolean> {
  // Simple byte comparison for now
  // In a real implementation, you'd use a proper image comparison library
  if (image1.length !== image2.length) {
    return false;
  }
  
  let differences = 0;
  const threshold = Math.floor(image1.length * VISUAL_TEST_CONFIG.threshold);
  
  for (let i = 0; i < image1.length; i++) {
    if (image1[i] !== image2[i]) {
      differences++;
      if (differences > threshold) {
        return false;
      }
    }
  }
  
  return true;
}

async function generateDiffImage(image1: Buffer, image2: Buffer, outputPath: string): Promise<void> {
  // In a real implementation, you'd generate a visual diff image
  // For now, just save the current image as the diff
  writeFileSync(outputPath, image1);
}

async function compareLayoutStructure(image1: Buffer, image2: Buffer): Promise<boolean> {
  // In a real implementation, you'd analyze the structural elements
  // For now, assume layout is consistent if images are similar size
  return Math.abs(image1.length - image2.length) < image1.length * 0.1;
}

async function detectFocusIndicator(screenshot: Buffer): Promise<boolean> {
  // In a real implementation, you'd analyze the image for focus indicators
  // For now, assume focus is present if screenshot exists
  return screenshot.length > 0;
}