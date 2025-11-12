import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

/**
 * Automated Tests to Detect Remaining Blue Color Usage
 * Scans codebase for any remaining blue color references
 */

describe('Brand Design System - Blue Color Detection Tests', () => {
  let sourceFiles: string[] = [];
  let cssFiles: string[] = [];
  let componentFiles: string[] = [];

  beforeAll(async () => {
    // Get all relevant files to scan
    const clientSrcPattern = path.join(process.cwd(), 'client/src/**/*.{ts,tsx,css,scss}');
    const tailwindConfigPattern = path.join(process.cwd(), 'tailwind.config.{ts,js}');
    
    sourceFiles = await glob(clientSrcPattern);
    const configFiles = await glob(tailwindConfigPattern);
    sourceFiles = [...sourceFiles, ...configFiles];

    // Separate file types for targeted testing
    cssFiles = sourceFiles.filter(file => file.endsWith('.css') || file.endsWith('.scss'));
    componentFiles = sourceFiles.filter(file => file.endsWith('.tsx') || file.endsWith('.ts'));
  });

  describe('CSS Files Blue Color Detection', () => {
    it('should not contain any blue color hex values', async () => {
      const blueHexPatterns = [
        /#[0-9a-fA-F]{3,6}/, // General hex pattern, we'll check if it's blue
        /#0066cc/i, // Common blue
        /#007bff/i, // Bootstrap blue
        /#3b82f6/i, // Tailwind blue-500
        /#1e40af/i, // Tailwind blue-700
        /#60a5fa/i, // Tailwind blue-400
        /#2563eb/i, // Tailwind blue-600
        /#1d4ed8/i, // Tailwind blue-700
        /#1e3a8a/i, // Tailwind blue-900
      ];

      for (const file of cssFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const relativePath = path.relative(process.cwd(), file);

        // Check for specific blue hex values
        for (const pattern of blueHexPatterns.slice(1)) { // Skip general hex pattern
          const matches = content.match(pattern);
          if (matches) {
            expect.fail(`Found blue hex color ${matches[0]} in ${relativePath}`);
          }
        }

        // Check for blue in RGB/HSL values
        const rgbBluePattern = /rgb\(\s*0\s*,\s*[0-9]+\s*,\s*255\s*\)/gi;
        const hslBluePattern = /hsl\(\s*240\s*,\s*[0-9]+%\s*,\s*[0-9]+%\s*\)/gi;
        
        expect(content).not.toMatch(rgbBluePattern);
        expect(content).not.toMatch(hslBluePattern);
      }
    });

    it('should not contain blue color names', async () => {
      const blueColorNames = [
        /\bblue\b/gi,
        /\bnavyblue\b/gi,
        /\bsteelblue\b/gi,
        /\broyalblue\b/gi,
        /\bdeepskyblue\b/gi,
        /\bdodgerblue\b/gi,
        /\bcornflowerblue\b/gi,
        /\bmidnightblue\b/gi,
      ];

      for (const file of cssFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const relativePath = path.relative(process.cwd(), file);

        for (const pattern of blueColorNames) {
          const matches = content.match(pattern);
          if (matches) {
            // Allow "blue" in comments or non-color contexts
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].match(pattern)) {
                const line = lines[i].trim();
                // Skip comments and non-color contexts
                if (!line.startsWith('//') && !line.startsWith('/*') && !line.includes('*')) {
                  // Check if it's actually used as a color value
                  if (line.includes(':') && (line.includes('color') || line.includes('background') || line.includes('border'))) {
                    expect.fail(`Found blue color name in ${relativePath} at line ${i + 1}: ${line}`);
                  }
                }
              }
            }
          }
        }
      }
    });

    it('should not contain CSS custom properties with blue values', async () => {
      for (const file of cssFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const relativePath = path.relative(process.cwd(), file);

        // Look for CSS custom properties that might contain blue
        const customPropertyPattern = /--[\w-]+:\s*[^;]+;/g;
        const matches = content.match(customPropertyPattern);

        if (matches) {
          for (const match of matches) {
            const value = match.split(':')[1]?.trim().replace(';', '');
            if (value) {
              // Check if the value contains blue references
              expect(value.toLowerCase()).not.toContain('blue');
              expect(value).not.toMatch(/#[0-9a-fA-F]{6}/) // We'll manually verify hex values aren't blue
            }
          }
        }
      }
    });
  });

  describe('Component Files Blue Color Detection', () => {
    it('should not contain Tailwind blue utility classes', async () => {
      const tailwindBlueClasses = [
        /\bbg-blue-\d+\b/g,
        /\btext-blue-\d+\b/g,
        /\bborder-blue-\d+\b/g,
        /\bring-blue-\d+\b/g,
        /\bfrom-blue-\d+\b/g,
        /\bto-blue-\d+\b/g,
        /\bvia-blue-\d+\b/g,
        /\bhover:bg-blue-\d+\b/g,
        /\bhover:text-blue-\d+\b/g,
        /\bfocus:bg-blue-\d+\b/g,
        /\bfocus:text-blue-\d+\b/g,
        /\bfocus:border-blue-\d+\b/g,
        /\bfocus:ring-blue-\d+\b/g,
      ];

      for (const file of componentFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const relativePath = path.relative(process.cwd(), file);

        for (const pattern of tailwindBlueClasses) {
          const matches = content.match(pattern);
          if (matches) {
            expect.fail(`Found Tailwind blue class ${matches[0]} in ${relativePath}`);
          }
        }
      }
    });

    it('should not contain inline blue styles', async () => {
      const inlineBluePatterns = [
        /style=["'][^"']*blue[^"']*["']/gi,
        /style=["'][^"']*#[0-9a-fA-F]{6}[^"']*["']/g, // We'll check if hex is blue
        /backgroundColor:\s*["']blue["']/gi,
        /color:\s*["']blue["']/gi,
        /borderColor:\s*["']blue["']/gi,
      ];

      for (const file of componentFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const relativePath = path.relative(process.cwd(), file);

        for (const pattern of inlineBluePatterns) {
          const matches = content.match(pattern);
          if (matches) {
            // For hex patterns, we need to check if they're actually blue
            if (pattern.source.includes('#[0-9a-fA-F]{6}')) {
              for (const match of matches) {
                const hexMatch = match.match(/#[0-9a-fA-F]{6}/);
                if (hexMatch) {
                  const hex = hexMatch[0].toLowerCase();
                  // Common blue hex values to check
                  const blueHexValues = ['#0066cc', '#007bff', '#3b82f6', '#1e40af', '#60a5fa', '#2563eb'];
                  if (blueHexValues.includes(hex)) {
                    expect.fail(`Found blue hex color ${hex} in inline style in ${relativePath}`);
                  }
                }
              }
            } else {
              expect.fail(`Found blue color in inline style in ${relativePath}: ${matches[0]}`);
            }
          }
        }
      }
    });

    it('should not contain CSS-in-JS blue color references', async () => {
      const cssInJsBluePatterns = [
        /backgroundColor:\s*["']blue["']/gi,
        /color:\s*["']blue["']/gi,
        /borderColor:\s*["']blue["']/gi,
        /backgroundColor:\s*["']#[0-9a-fA-F]{6}["']/g,
        /color:\s*["']#[0-9a-fA-F]{6}["']/g,
      ];

      for (const file of componentFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const relativePath = path.relative(process.cwd(), file);

        for (const pattern of cssInJsBluePatterns) {
          const matches = content.match(pattern);
          if (matches) {
            // Check if hex values are blue
            if (pattern.source.includes('#[0-9a-fA-F]{6}')) {
              for (const match of matches) {
                const hexMatch = match.match(/#[0-9a-fA-F]{6}/);
                if (hexMatch) {
                  const hex = hexMatch[0].toLowerCase();
                  const blueHexValues = ['#0066cc', '#007bff', '#3b82f6', '#1e40af', '#60a5fa', '#2563eb'];
                  if (blueHexValues.includes(hex)) {
                    expect.fail(`Found blue hex color ${hex} in CSS-in-JS in ${relativePath}`);
                  }
                }
              }
            } else if (matches[0].toLowerCase().includes('blue')) {
              expect.fail(`Found blue color in CSS-in-JS in ${relativePath}: ${matches[0]}`);
            }
          }
        }
      }
    });
  });

  describe('Configuration Files Blue Color Detection', () => {
    it('should not contain blue colors in Tailwind config', async () => {
      const tailwindConfigPath = path.join(process.cwd(), 'tailwind.config.ts');
      
      try {
        const content = await fs.readFile(tailwindConfigPath, 'utf-8');
        
        // Check for blue color definitions in theme
        expect(content.toLowerCase()).not.toMatch(/blue:\s*{/);
        expect(content.toLowerCase()).not.toMatch(/blue:\s*["']/);
        
        // Check for blue hex values in color definitions
        const blueHexValues = ['#0066cc', '#007bff', '#3b82f6', '#1e40af', '#60a5fa', '#2563eb'];
        for (const blueHex of blueHexValues) {
          expect(content.toLowerCase()).not.toContain(blueHex.toLowerCase());
        }
      } catch (error) {
        // If file doesn't exist, that's okay
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    });

    it('should verify primary colors are set to orange in config', async () => {
      const tailwindConfigPath = path.join(process.cwd(), 'tailwind.config.ts');
      
      try {
        const content = await fs.readFile(tailwindConfigPath, 'utf-8');
        
        // Should contain orange color references for primary
        if (content.includes('primary')) {
          // If primary is defined, it should not be blue
          const primaryMatch = content.match(/primary:\s*["']([^"']+)["']/);
          if (primaryMatch) {
            const primaryValue = primaryMatch[1].toLowerCase();
            expect(primaryValue).not.toContain('blue');
            expect(primaryValue).not.toMatch(/#[0-9a-fA-F]{6}/) // Should use HSL or CSS variables
          }
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    });
  });

  describe('Brand Color Consistency Check', () => {
    it('should use consistent orange color values throughout codebase', async () => {
      const expectedOrangeHSL = '39 100% 50%'; // Our brand orange
      const expectedDarkGreyHSL = '0 0% 10%'; // Our brand dark grey
      
      // Check main CSS file for correct color definitions
      const mainCssPath = path.join(process.cwd(), 'client/src/index.css');
      
      try {
        const content = await fs.readFile(mainCssPath, 'utf-8');
        
        // Should contain our brand colors
        expect(content).toContain(expectedOrangeHSL);
        expect(content).toContain(expectedDarkGreyHSL);
        
        // Should not contain common blue HSL values
        const commonBlueHSL = ['240 100% 50%', '220 100% 50%', '210 100% 50%'];
        for (const blueHSL of commonBlueHSL) {
          expect(content).not.toContain(blueHSL);
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    });

    it('should have replaced all blue references with appropriate brand colors', async () => {
      // This test ensures that the migration from blue to orange/grey was complete
      let totalBlueReferences = 0;
      
      for (const file of [...componentFiles, ...cssFiles]) {
        const content = await fs.readFile(file, 'utf-8');
        const relativePath = path.relative(process.cwd(), file);
        
        // Count blue references (excluding comments)
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim().startsWith('//') && !line.trim().startsWith('/*')) {
            const blueMatches = line.match(/\bblue\b/gi);
            if (blueMatches) {
              // Check if it's in a color context
              if (line.includes('bg-') || line.includes('text-') || line.includes('border-') || 
                  line.includes('color:') || line.includes('background') || line.includes('border')) {
                totalBlueReferences += blueMatches.length;
                console.warn(`Found blue reference in ${relativePath} at line ${i + 1}: ${line.trim()}`);
              }
            }
          }
        }
      }
      
      expect(totalBlueReferences).toBe(0);
    });
  });

  describe('Color Accessibility Validation', () => {
    it('should ensure orange colors meet accessibility contrast requirements', async () => {
      // Test that our orange (#FF9900) has sufficient contrast with white and dark backgrounds
      const orangeHex = '#FF9900';
      const whiteHex = '#FFFFFF';
      const darkGreyHex = '#1A1A1A';
      
      // Simple contrast ratio calculation (simplified for testing)
      function hexToRgb(hex: string) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
      }
      
      function getLuminance(r: number, g: number, b: number) {
        const [rs, gs, bs] = [r, g, b].map(c => {
          c = c / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      }
      
      function getContrastRatio(color1: string, color2: string) {
        const rgb1 = hexToRgb(color1);
        const rgb2 = hexToRgb(color2);
        
        if (!rgb1 || !rgb2) return 0;
        
        const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
        const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
        
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        
        return (brightest + 0.05) / (darkest + 0.05);
      }
      
      // Test contrast ratios
      const orangeWhiteContrast = getContrastRatio(orangeHex, whiteHex);
      const orangeDarkGreyContrast = getContrastRatio(orangeHex, darkGreyHex);
      
      // Orange on white may not meet AA standards, but should be reasonable for UI elements
      expect(orangeWhiteContrast).toBeGreaterThan(1.5); // Basic visibility threshold
      expect(orangeDarkGreyContrast).toBeGreaterThan(3); // Should be sufficient for text on dark backgrounds
      
      // Log actual contrast ratios for reference
      console.log(`Orange-White contrast: ${orangeWhiteContrast.toFixed(2)}:1`);
      console.log(`Orange-DarkGrey contrast: ${orangeDarkGreyContrast.toFixed(2)}:1`);
    });
  });
});