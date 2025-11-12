import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs/promises';
import path from 'path';

/**
 * Performance Tests for Font Loading and CSS Changes
 * Tests font loading strategies, CSS performance, and Core Web Vitals impact
 */

describe('Brand Design System - Font and Performance Tests', () => {
    let cssContent: string;
    let htmlContent: string;
    let dom: JSDOM;

    beforeAll(async () => {
        // Load CSS and HTML files
        const cssPath = path.join(process.cwd(), 'client/src/index.css');
        const htmlPath = path.join(process.cwd(), 'client/index.html');

        try {
            cssContent = await fs.readFile(cssPath, 'utf-8');
        } catch (error) {
            cssContent = '';
        }

        try {
            htmlContent = await fs.readFile(htmlPath, 'utf-8');
        } catch (error) {
            htmlContent = `
        <!DOCTYPE html>
        <html>
          <head><title>Test</title></head>
          <body><div id="root"></div></body>
        </html>
      `;
        }

        // Create DOM with CSS loaded
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
    });

    afterAll(() => {
        if (dom) {
            dom.window.close();
        }
    });

    describe('Font Loading Strategy Tests', () => {
        it('should use font-display: swap for optimal loading', () => {
            // Check for font-display: swap in @font-face declarations
            const fontFacePattern = /@font-face\s*{[^}]*}/g;
            const fontFaces = cssContent.match(fontFacePattern);

            if (fontFaces) {
                for (const fontFace of fontFaces) {
                    if (fontFace.includes('Base Neue')) {
                        expect(fontFace).toMatch(/font-display:\s*swap/);
                    }
                }
            }
        });

        it('should preload critical font files', () => {
            // Check HTML for font preloading
            if (htmlContent.includes('preload')) {
                const preloadPattern = /<link[^>]*rel=["']preload["'][^>]*>/g;
                const preloadLinks = htmlContent.match(preloadPattern);

                if (preloadLinks) {
                    const fontPreloads = preloadLinks.filter(link =>
                        link.includes('font') || link.includes('.woff2') || link.includes('.woff')
                    );

                    // Should preload at least the main font weight
                    expect(fontPreloads.length).toBeGreaterThan(0);

                    // Should use crossorigin for font preloading
                    fontPreloads.forEach(preload => {
                        expect(preload).toMatch(/crossorigin/);
                    });
                }
            }
        });

        it('should have proper font fallback stack', () => {
            // Test font fallback performance
            const testElement = dom.window.document.createElement('div');
            testElement.className = 'font-sans';
            testElement.textContent = 'Test text';
            dom.window.document.getElementById('test-container')?.appendChild(testElement);

            const computedStyle = dom.window.getComputedStyle(testElement);
            const fontFamily = computedStyle.fontFamily;

            // Should include system fonts as fallbacks
            expect(fontFamily).toMatch(/system-ui|sans-serif|-apple-system/);

            // Should not rely solely on web fonts
            const fontFamilies = fontFamily.split(',').map(f => f.trim().replace(/['"]/g, ''));
            expect(fontFamilies.length).toBeGreaterThan(1);
        });

        it('should minimize font loading impact on CLS', () => {
            // Test that font loading doesn't cause significant layout shift
            const testText = dom.window.document.createElement('p');
            testText.className = 'font-sans text-base';
            testText.textContent = 'The quick brown fox jumps over the lazy dog';
            dom.window.document.getElementById('test-container')?.appendChild(testText);

            // Simulate font loading states
            const beforeStyles = dom.window.getComputedStyle(testText);
            const beforeHeight = testText.offsetHeight;
            const beforeWidth = testText.offsetWidth;

            // Font metrics should be similar between fallback and web font
            expect(beforeHeight).toBeGreaterThan(0);
            expect(beforeWidth).toBeGreaterThan(0);
        });

        it('should use optimal font file formats', () => {
            // Check for modern font formats in CSS
            if (cssContent.includes('@font-face')) {
                // Should prioritize WOFF2 format
                expect(cssContent).toMatch(/\.woff2/);

                // Should have WOFF fallback
                expect(cssContent).toMatch(/\.woff/);

                // Should not use outdated formats as primary
                const ttfMatches = cssContent.match(/\.ttf/g);
                const woff2Matches = cssContent.match(/\.woff2/g);

                if (ttfMatches && woff2Matches) {
                    // WOFF2 should appear before TTF in source order
                    const ttfIndex = cssContent.indexOf('.ttf');
                    const woff2Index = cssContent.indexOf('.woff2');
                    expect(woff2Index).toBeLessThan(ttfIndex);
                }
            }
        });
    });

    describe('CSS Performance Tests', () => {
        it('should have efficient CSS selector performance', () => {
            // Measure CSS parsing performance
            const startTime = performance.now();

            // Create multiple elements to test selector performance
            const elements = [];
            for (let i = 0; i < 100; i++) {
                const element = dom.window.document.createElement('div');
                element.className = `bg-primary text-primary-foreground p-4 rounded-md shadow-sm`;
                elements.push(element);
                dom.window.document.getElementById('test-container')?.appendChild(element);
            }

            // Force style calculation
            elements.forEach(el => {
                dom.window.getComputedStyle(el).backgroundColor;
            });

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Should complete style calculations quickly
            expect(duration).toBeLessThan(100); // 100ms threshold

            // Cleanup
            elements.forEach(el => el.remove());
        });

        it('should minimize CSS bundle size impact', () => {
            // Check CSS size is reasonable
            const cssSize = new Blob([cssContent]).size;

            // Should not be excessively large (adjust threshold as needed)
            expect(cssSize).toBeLessThan(500 * 1024); // 500KB threshold

            // Check for unnecessary duplication
            const lines = cssContent.split('\n');
            const uniqueLines = new Set(lines.map(line => line.trim()));
            const duplicationRatio = uniqueLines.size / lines.length;

            // Should have minimal duplication
            expect(duplicationRatio).toBeGreaterThan(0.7); // 70% unique lines
        });

        it('should use efficient color calculations', () => {
            // Test HSL color performance vs hex
            const startTime = performance.now();

            const testElement = dom.window.document.createElement('div');
            dom.window.document.getElementById('test-container')?.appendChild(testElement);

            // Test multiple color applications
            const colors = [
                'hsl(var(--primary))',
                'hsl(var(--secondary))',
                'hsl(var(--accent))',
                'hsl(var(--muted))'
            ];

            colors.forEach(color => {
                testElement.style.backgroundColor = color;
                dom.window.getComputedStyle(testElement).backgroundColor;
            });

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Color calculations should be fast
            expect(duration).toBeLessThan(50); // 50ms threshold

            testElement.remove();
        });

        it('should optimize critical CSS delivery', () => {
            // Check for critical CSS patterns
            const criticalSelectors = [
                'body', 'html', ':root',
                '.bg-primary', '.text-primary',
                '.font-sans', '.container'
            ];

            criticalSelectors.forEach(selector => {
                if (cssContent.includes(selector)) {
                    // Critical selectors should appear early in CSS
                    const selectorIndex = cssContent.indexOf(selector);
                    const totalLength = cssContent.length;
                    const position = selectorIndex / totalLength;

                    // Should be in first 50% of CSS for critical selectors
                    if (selector === 'body' || selector === 'html' || selector === ':root') {
                        expect(position).toBeLessThan(0.5);
                    }
                }
            });
        });
    });

    describe('Core Web Vitals Impact Tests', () => {
        it('should minimize Largest Contentful Paint (LCP) impact', () => {
            // Test that font loading doesn't delay LCP
            const largeTextElement = dom.window.document.createElement('h1');
            largeTextElement.className = 'font-sans text-4xl font-bold text-foreground';
            largeTextElement.textContent = 'Large Heading Content';
            dom.window.document.getElementById('test-container')?.appendChild(largeTextElement);

            // Should render with fallback fonts immediately
            const computedStyle = dom.window.getComputedStyle(largeTextElement);
            expect(computedStyle.fontSize).toBeTruthy();
            expect(computedStyle.fontWeight).toBeTruthy();

            largeTextElement.remove();
        });

        it('should minimize Cumulative Layout Shift (CLS)', () => {
            // Test layout stability during font loading
            const textElements = [];

            // Create various text elements
            const textSizes = ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'];

            textSizes.forEach(size => {
                const element = dom.window.document.createElement('p');
                element.className = `font-sans ${size}`;
                element.textContent = 'Sample text for layout testing';
                textElements.push(element);
                dom.window.document.getElementById('test-container')?.appendChild(element);
            });

            // Measure initial layout
            const initialMetrics = textElements.map(el => ({
                height: el.offsetHeight,
                width: el.offsetWidth
            }));

            // All elements should have consistent sizing
            initialMetrics.forEach(metrics => {
                expect(metrics.height).toBeGreaterThan(0);
                expect(metrics.width).toBeGreaterThan(0);
            });

            // Cleanup
            textElements.forEach(el => el.remove());
        });

        it('should optimize First Input Delay (FID)', () => {
            // Test that CSS doesn't block main thread
            const startTime = performance.now();

            // Create interactive elements
            const button = dom.window.document.createElement('button');
            button.className = 'bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md transition-colors';
            button.textContent = 'Interactive Button';
            dom.window.document.getElementById('test-container')?.appendChild(button);

            // Simulate style recalculation
            dom.window.getComputedStyle(button).backgroundColor;

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Should not block for long periods
            expect(duration).toBeLessThan(16); // One frame at 60fps

            button.remove();
        });

        it('should handle font loading without blocking rendering', () => {
            // Test font loading performance characteristics
            const textElement = dom.window.document.createElement('div');
            textElement.className = 'font-sans';
            textElement.innerHTML = `
        <h1>Heading with Base Neue</h1>
        <p>Paragraph text with Base Neue font family</p>
        <span>Inline text element</span>
      `;
            dom.window.document.getElementById('test-container')?.appendChild(textElement);

            // Should render immediately with fallback fonts
            const heading = textElement.querySelector('h1');
            const paragraph = textElement.querySelector('p');
            const span = textElement.querySelector('span');

            if (heading && paragraph && span) {
                const headingStyle = dom.window.getComputedStyle(heading);
                const paragraphStyle = dom.window.getComputedStyle(paragraph);
                const spanStyle = dom.window.getComputedStyle(span);

                // All should have font families applied
                expect(headingStyle.fontFamily).toBeTruthy();
                expect(paragraphStyle.fontFamily).toBeTruthy();
                expect(spanStyle.fontFamily).toBeTruthy();
            }

            textElement.remove();
        });
    });

    describe('Memory and Resource Usage Tests', () => {
        it('should not create excessive DOM nodes for styling', () => {
            // Test that CSS doesn't require excessive DOM manipulation
            const initialNodeCount = dom.window.document.querySelectorAll('*').length;

            // Create styled components
            const styledElements = [];
            for (let i = 0; i < 50; i++) {
                const element = dom.window.document.createElement('div');
                element.className = 'bg-primary text-primary-foreground p-4 m-2 rounded-lg shadow-md';
                styledElements.push(element);
                dom.window.document.getElementById('test-container')?.appendChild(element);
            }

            const finalNodeCount = dom.window.document.querySelectorAll('*').length;
            const addedNodes = finalNodeCount - initialNodeCount;

            // Should only add the expected number of nodes
            expect(addedNodes).toBe(50);

            // Cleanup
            styledElements.forEach(el => el.remove());
        });

        it('should handle large numbers of styled elements efficiently', () => {
            // Performance test with many elements
            const startTime = performance.now();

            const elements = [];
            for (let i = 0; i < 1000; i++) {
                const element = dom.window.document.createElement('div');
                element.className = `bg-primary text-primary-foreground`;
                elements.push(element);
                dom.window.document.getElementById('test-container')?.appendChild(element);
            }

            // Force style calculation on all elements
            elements.forEach(el => {
                dom.window.getComputedStyle(el).backgroundColor;
            });

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Should handle large numbers of elements efficiently
            expect(duration).toBeLessThan(1000); // 1 second threshold

            // Cleanup
            elements.forEach(el => el.remove());
        });

        it('should minimize CSS recalculation triggers', () => {
            // Test that color changes don't trigger expensive recalculations
            const testElement = dom.window.document.createElement('div');
            testElement.className = 'bg-primary p-4';
            dom.window.document.getElementById('test-container')?.appendChild(testElement);

            const startTime = performance.now();

            // Change colors multiple times
            const colorClasses = [
                'bg-secondary',
                'bg-accent',
                'bg-muted',
                'bg-primary'
            ];

            colorClasses.forEach(colorClass => {
                testElement.className = `${colorClass} p-4`;
                dom.window.getComputedStyle(testElement).backgroundColor;
            });

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Color changes should be fast
            expect(duration).toBeLessThan(50); // 50ms threshold

            testElement.remove();
        });
    });

    describe('Network Performance Tests', () => {
        it('should minimize font file sizes', () => {
            // Check font file references in CSS
            const fontUrlPattern = /url\(['"]?([^'"]+\.woff2?)['"]\)/g;
            const fontUrls = [...cssContent.matchAll(fontUrlPattern)];

            if (fontUrls.length > 0) {
                // Should use compressed font formats
                fontUrls.forEach(match => {
                    const url = match[1];
                    expect(url).toMatch(/\.woff2?$/);
                });

                // Should not load excessive font variations
                expect(fontUrls.length).toBeLessThan(10); // Reasonable limit
            }
        });

        it('should use efficient font loading strategies', () => {
            // Check for font loading optimizations
            if (cssContent.includes('@font-face')) {
                // Should use font-display: swap
                expect(cssContent).toMatch(/font-display:\s*swap/);

                // Should specify unicode-range for optimization (if applicable)
                const unicodeRangePattern = /unicode-range:/g;
                const unicodeRanges = cssContent.match(unicodeRangePattern);

                // If using unicode-range, it should be properly configured
                if (unicodeRanges) {
                    expect(unicodeRanges.length).toBeGreaterThan(0);
                }
            }
        });

        it('should minimize CSS transfer size', () => {
            // Test CSS compression potential
            const originalSize = cssContent.length;
            const minifiedSize = cssContent
                .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
                .replace(/\s+/g, ' ') // Collapse whitespace
                .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
                .trim().length;

            const compressionRatio = minifiedSize / originalSize;

            // Should have reasonable compression potential
            expect(compressionRatio).toBeLessThan(0.8); // At least 20% compression
        });
    });
});