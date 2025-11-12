/**
 * Demo component showing how to use the theme utilities and hooks
 */

import React from 'react';
import { useTheme, useThemeColors, useAccessibility, useColorUtils } from '../hooks/useTheme';
import { ThemeComponentHelper } from '../utils/themeComponentHelpers';
import { ColorManipulator, ThemeClassGenerator, AccessibilityEnhancer } from '../utils/themeUtils';

export const ThemeUtilsDemo: React.FC = () => {
  const {
    theme,
    resolvedTheme,
    toggleTheme,
    isHighContrast,
    setHighContrast,
    brandColors,
    utils,
  } = useTheme();

  const themeColors = useThemeColors();
  const accessibility = useAccessibility();
  const colorUtils = useColorUtils();

  // Example: Using color utilities
  const lightenedOrange = colorUtils.lighten(brandColors.orange[500], 20);
  const darkenedOrange = colorUtils.darken(brandColors.orange[500], 20);
  const orangeWithOpacity = colorUtils.withOpacity(brandColors.orange[500], 0.5);

  // Example: Using accessibility utilities
  const contrastResult = accessibility.testContrast(brandColors.orange[500], '#FFFFFF');
  const accessibleOrange = accessibility.getAccessibleColor(brandColors.orange[500], '#FFFFFF', 4.5);

  // Example: Using component helpers
  const primaryButtonColors = themeColors.getButtonColors('primary');
  const inputColors = themeColors.getInputColors();
  const cardColors = themeColors.getCardColors();

  // Example: Using advanced color manipulation
  const colorPalette = ColorManipulator.generatePalette(brandColors.orange[500], 5);
  const accessibleColor = ColorManipulator.findAccessibleColor('#FFFF00', '#FFFFFF', 4.5);

  // Example: Using theme class generator
  const buttonClasses = ThemeClassGenerator.button('primary', 'md');
  const inputClasses = ThemeClassGenerator.input();
  const cardClasses = ThemeClassGenerator.card();

  // Example: Using accessibility enhancer
  const focusRingClasses = AccessibilityEnhancer.focusRing();
  const skipLinkClasses = AccessibilityEnhancer.skipLink();

  // Example: Using component helper for complete styles
  const completeButtonStyles = ThemeComponentHelper.generateComponentStyles(
    'button',
    'primary',
    resolvedTheme,
    isHighContrast,
    'md'
  );

  return (
    <div className="p-8 space-y-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Theme Utilities Demo</h1>

        {/* Theme Controls */}
        <section className="mb-8 p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Theme Controls</h2>
          <div className="flex gap-4 items-center">
            <button
              onClick={toggleTheme}
              className={buttonClasses}
            >
              Toggle Theme (Current: {theme})
            </button>
            <button
              onClick={() => setHighContrast(!isHighContrast)}
              className={ThemeClassGenerator.button('secondary', 'md')}
            >
              Toggle High Contrast ({isHighContrast ? 'On' : 'Off'})
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Resolved theme: {resolvedTheme} | System theme: {utils.isSystemTheme ? 'Yes' : 'No'}
          </p>
        </section>

        {/* Color Utilities Demo */}
        <section className="mb-8 p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Color Utilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Original Orange</h3>
              <div
                className="w-full h-12 rounded border"
                style={{ backgroundColor: brandColors.orange[500] }}
              />
              <p className="text-sm mt-1">{brandColors.orange[500]}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Lightened Orange (+20%)</h3>
              <div
                className="w-full h-12 rounded border"
                style={{ backgroundColor: lightenedOrange }}
              />
              <p className="text-sm mt-1">{lightenedOrange}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Darkened Orange (-20%)</h3>
              <div
                className="w-full h-12 rounded border"
                style={{ backgroundColor: darkenedOrange }}
              />
              <p className="text-sm mt-1">{darkenedOrange}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Orange with Opacity (50%)</h3>
              <div
                className="w-full h-12 rounded border"
                style={{ backgroundColor: orangeWithOpacity }}
              />
              <p className="text-sm mt-1">{orangeWithOpacity}</p>
            </div>
          </div>
        </section>

        {/* Generated Color Palette */}
        <section className="mb-8 p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Generated Color Palette</h2>
          <div className="flex gap-2">
            {colorPalette.map((color, index) => (
              <div key={index} className="flex-1">
                <div
                  className="w-full h-16 rounded border"
                  style={{ backgroundColor: color }}
                />
                <p className="text-xs mt-1 text-center">{color}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Accessibility Demo */}
        <section className="mb-8 p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Accessibility Testing</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Contrast Test: Orange on White</h3>
              <div className="p-4 border rounded" style={{ backgroundColor: '#FFFFFF', color: brandColors.orange[500] }}>
                <p>Sample text in orange on white background</p>
                <p className="text-sm mt-2">
                  Contrast Ratio: {contrastResult.ratio}:1 | 
                  WCAG AA: {contrastResult.wcagAA ? '✅' : '❌'} | 
                  WCAG AAA: {contrastResult.wcagAAA ? '✅' : '❌'} | 
                  Level: {contrastResult.level.toUpperCase()}
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Accessible Color Alternative</h3>
              <div className="p-4 border rounded" style={{ backgroundColor: '#FFFFFF', color: accessibleOrange }}>
                <p>Sample text with accessible orange color</p>
                <p className="text-sm mt-2">Accessible Color: {accessibleOrange}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Component Styles Demo */}
        <section className="mb-8 p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Component Styles</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Button Variants</h3>
              <div className="flex gap-2 flex-wrap">
                <button className={ThemeClassGenerator.button('primary', 'md')}>
                  Primary Button
                </button>
                <button className={ThemeClassGenerator.button('secondary', 'md')}>
                  Secondary Button
                </button>
                <button className={ThemeClassGenerator.button('outline', 'md')}>
                  Outline Button
                </button>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Input Field</h3>
              <input
                type="text"
                placeholder="Sample input field"
                className={inputClasses}
              />
            </div>
            <div>
              <h3 className="font-medium mb-2">Card Component</h3>
              <div className={cardClasses + ' p-4'}>
                <p>This is a sample card component with theme-aware styling.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Focus and Accessibility Features */}
        <section className="mb-8 p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Accessibility Features</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Focus Ring Example</h3>
              <button className={`px-4 py-2 bg-blue-500 text-white rounded ${focusRingClasses}`}>
                Focus me to see the ring
              </button>
            </div>
            <div>
              <h3 className="font-medium mb-2">Skip Link (Focus to see)</h3>
              <a href="#main-content" className={skipLinkClasses}>
                Skip to main content
              </a>
            </div>
          </div>
        </section>

        {/* Dynamic Styles */}
        <section className="mb-8 p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Dynamic Component Styles</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Button with Dynamic Styles</h3>
              <button
                style={{
                  ...completeButtonStyles,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = completeButtonStyles['--hover-bg'] || completeButtonStyles.backgroundColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = completeButtonStyles.backgroundColor;
                }}
              >
                Dynamic Styled Button
              </button>
            </div>
            <div>
              <h3 className="font-medium mb-2">Card with Dynamic Colors</h3>
              <div
                style={{
                  backgroundColor: cardColors.background,
                  color: cardColors.foreground,
                  border: `1px solid ${cardColors.border}`,
                  boxShadow: cardColors.shadow,
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <p>This card uses dynamic colors from the theme system.</p>
                <p className="text-sm mt-2 opacity-75">
                  Background: {cardColors.background} | 
                  Foreground: {cardColors.foreground} | 
                  Border: {cardColors.border}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Utility Functions Demo */}
        <section className="mb-8 p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Utility Functions</h2>
          <div className="space-y-2">
            <p><strong>Is Dark Theme:</strong> {utils.isDark ? 'Yes' : 'No'}</p>
            <p><strong>Is Light Theme:</strong> {utils.isLight ? 'Yes' : 'No'}</p>
            <p><strong>Is System Theme:</strong> {utils.isSystemTheme ? 'Yes' : 'No'}</p>
            <p><strong>Opposite Theme:</strong> {utils.getOppositeTheme()}</p>
            <p><strong>Brand Orange 500:</strong> {utils.getBrandColor('orange', '500')}</p>
            <p><strong>Brand Grey 900:</strong> {utils.getBrandColor('grey', '900')}</p>
          </div>
        </section>

        {/* CSS Variables */}
        <section className="mb-8 p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">CSS Variables</h2>
          <div className="space-y-2">
            {Object.entries(themeColors.getCSSVariables()).map(([property, value]) => (
              <div key={property} className="flex justify-between">
                <code className="text-sm">{property}</code>
                <span className="text-sm">{value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ThemeUtilsDemo;