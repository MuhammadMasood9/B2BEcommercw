# Theme Utilities and Hooks

This directory contains comprehensive theme utilities and hooks for the enhanced theme system. The implementation provides a complete solution for theme-aware styling, color manipulation, accessibility compliance, and component helpers.

## Overview

The theme system consists of several key components:

1. **useTheme Hook** - Main hook providing theme context and utilities
2. **Theme Utilities** - Advanced color manipulation and theme operations
3. **Component Helpers** - Theme-aware styling for UI components
4. **Accessibility Utilities** - WCAG compliance and accessibility features

## Main Hook: useTheme

The `useTheme` hook is the primary interface for accessing theme functionality.

### Basic Usage

```typescript
import { useTheme } from '../hooks/useTheme';

function MyComponent() {
  const {
    theme,           // Current theme setting ('light' | 'dark' | 'system')
    resolvedTheme,   // Actual theme being used ('light' | 'dark')
    toggleTheme,     // Function to toggle between themes
    isHighContrast,  // High contrast mode status
    setHighContrast, // Function to toggle high contrast
    brandColors,     // Brand color palette
    colors,          // Color manipulation utilities
    accessibility,   // Accessibility utilities
    components,      // Component styling helpers
    utils,           // General utility functions
  } = useTheme();

  return (
    <button onClick={toggleTheme}>
      Current theme: {resolvedTheme}
    </button>
  );
}
```

### Specialized Hooks

For specific use cases, you can use the specialized hooks:

```typescript
import { useThemeColors, useAccessibility, useColorUtils } from '../hooks/useTheme';

// Get only component styling helpers
const themeColors = useThemeColors();

// Get only accessibility utilities
const accessibility = useAccessibility();

// Get only color manipulation utilities
const colorUtils = useColorUtils();
```

## Color Utilities

The color utilities provide comprehensive color manipulation capabilities:

### Basic Color Operations

```typescript
const { colors } = useTheme();

// Convert between color formats
const rgb = colors.hexToRgb('#F2A30F');        // { r: 242, g: 163, b: 15 }
const hex = colors.rgbToHex(242, 163, 15);     // '#f2a30f'

// Lighten and darken colors
const lighter = colors.lighten('#F2A30F', 20);  // Lighten by 20%
const darker = colors.darken('#F2A30F', 20);    // Darken by 20%

// Add opacity
const withOpacity = colors.withOpacity('#F2A30F', 0.5); // 'rgba(242, 163, 15, 0.5)'

// Get theme-appropriate colors
const themeColor = colors.getThemeColor('#FFFFFF', '#000000', resolvedTheme);
```

### Advanced Color Manipulation

```typescript
import { ColorManipulator } from '../utils/themeUtils';

// Generate color palette
const palette = ColorManipulator.generatePalette('#F2A30F', 9);

// Find accessible color variant
const accessibleColor = ColorManipulator.findAccessibleColor(
  '#FFFF00',  // Target color
  '#FFFFFF',  // Background color
  4.5         // Target contrast ratio
);

// Calculate color difference (Delta E)
const deltaE = ColorManipulator.deltaE(
  { r: 255, g: 0, b: 0 },
  { r: 0, g: 255, b: 0 }
);
```

## Accessibility Utilities

The accessibility utilities ensure WCAG compliance and provide accessibility features:

### Contrast Testing

```typescript
const { accessibility } = useTheme();

// Test contrast ratio
const result = accessibility.testContrast('#F2A30F', '#FFFFFF');
console.log(result);
// {
//   ratio: 3.45,
//   wcagAA: false,
//   wcagAAA: false,
//   level: 'fail'
// }

// Check if colors are accessible
const isAccessible = accessibility.isAccessible('#000000', '#FFFFFF', 'AA'); // true

// Get accessible color alternative
const accessibleColor = accessibility.getAccessibleColor('#FFFF00', '#FFFFFF', 4.5);
```

### High Contrast Support

```typescript
const { accessibility } = useTheme();

// Get high contrast color variants
const highContrastColors = accessibility.getHighContrastColors();
console.log(highContrastColors);
// {
//   primary: '#A85C00',
//   secondary: '#000000',
//   background: '#FFFFFF',
//   foreground: '#000000'
// }
```

### Accessibility Enhancement Utilities

```typescript
import { AccessibilityEnhancer } from '../utils/themeUtils';

// Generate focus ring styles
const focusRing = AccessibilityEnhancer.focusRing('brand-orange-500');

// Generate skip link styles
const skipLink = AccessibilityEnhancer.skipLink();

// Generate screen reader only styles
const srOnly = AccessibilityEnhancer.srOnly();

// Detect user preferences
const isHighContrast = AccessibilityEnhancer.detectHighContrast();
const isReducedMotion = AccessibilityEnhancer.detectReducedMotion();
```

## Component Helpers

The component helpers provide theme-aware styling for UI components:

### Button Styling

```typescript
const { components } = useTheme();

// Get button colors for different variants
const primaryButton = components.getButtonColors('primary');
const secondaryButton = components.getButtonColors('secondary');
const outlineButton = components.getButtonColors('outline');

console.log(primaryButton);
// {
//   background: '#F2A30F',
//   foreground: '#FFFFFF',
//   hover: '#EA580C',
//   active: '#C2410C'
// }
```

### Input Field Styling

```typescript
const { components } = useTheme();

const inputColors = components.getInputColors();
console.log(inputColors);
// {
//   background: '#FFFFFF',
//   foreground: '#212121',
//   border: '#D4D4D4',
//   focus: '#F2A30F',
//   placeholder: '#737373'
// }
```

### Card Styling

```typescript
const { components } = useTheme();

const cardColors = components.getCardColors();
console.log(cardColors);
// {
//   background: '#FFFFFF',
//   foreground: '#212121',
//   border: '#EEEEEE',
//   shadow: 'rgba(0, 0, 0, 0.1)'
// }
```

### Navigation Styling

```typescript
const { components } = useTheme();

const navColors = components.getNavigationColors();
console.log(navColors);
// {
//   background: '#FFFFFF',
//   foreground: '#212121',
//   active: '#F2A30F',
//   activeForeground: '#FFFFFF',
//   hover: '#FAFAFA'
// }
```

### Status Colors

```typescript
const { components } = useTheme();

const statusColors = components.getStatusColors();
console.log(statusColors);
// {
//   success: { background: '#22C55E', foreground: '#FFFFFF' },
//   warning: { background: '#F2A30F', foreground: '#FFFFFF' },
//   error: { background: '#EF4444', foreground: '#FFFFFF' },
//   info: { background: '#3B82F6', foreground: '#FFFFFF' }
// }
```

### CSS Variables Generation

```typescript
const { components } = useTheme();

const cssVariables = components.getCSSVariables();
console.log(cssVariables);
// {
//   '--color-primary': '#F2A30F',
//   '--color-secondary': '#212121',
//   '--color-background': '#FFFFFF',
//   '--color-foreground': '#212121',
//   '--color-border': '#EEEEEE'
// }
```

## Advanced Component Helpers

For more complex styling needs, use the advanced component helpers:

### Theme Class Generator

```typescript
import { ThemeClassGenerator } from '../utils/themeUtils';

// Generate responsive theme classes
const responsiveClasses = ThemeClassGenerator.responsive(
  'base-class',
  'light-class',
  'dark-class',
  'high-contrast-class'
);

// Generate button classes
const buttonClasses = ThemeClassGenerator.button('primary', 'md');

// Generate input classes
const inputClasses = ThemeClassGenerator.input();

// Generate card classes
const cardClasses = ThemeClassGenerator.card();
```

### Theme Component Helper

```typescript
import { ThemeComponentHelper } from '../utils/themeComponentHelpers';

// Generate complete component styles
const buttonStyles = ThemeComponentHelper.generateComponentStyles(
  'button',
  'primary',
  resolvedTheme,
  isHighContrast,
  'md'
);

// Convert styles to CSS string
const cssString = ThemeComponentHelper.stylesToCSS(buttonStyles);

// Convert styles to CSS custom properties
const customProps = ThemeComponentHelper.stylesToCustomProperties(
  buttonStyles,
  'btn-'
);
```

## Utility Functions

The utility functions provide convenient helpers for theme operations:

```typescript
const { utils } = useTheme();

// Theme state checks
const isDark = utils.isDark;           // boolean
const isLight = utils.isLight;         // boolean
const isSystemTheme = utils.isSystemTheme; // boolean

// Get opposite theme
const oppositeTheme = utils.getOppositeTheme(); // 'light' | 'dark'

// Apply theme-aware styles
const styles = utils.themeStyles('light-class', 'dark-class');

// Get brand colors
const orangeColor = utils.getBrandColor('orange', '500');
const greyColor = utils.getBrandColor('grey', '900');

// Create theme-aware class names
const className = utils.themeClass('base', 'modifier', null, false, 'additional');
```

## Brand Colors

The brand colors are available throughout the theme system:

```typescript
import { BRAND_COLORS } from '../hooks/useTheme';

// Orange color scale
BRAND_COLORS.orange[50]   // '#FFF7ED'
BRAND_COLORS.orange[100]  // '#FFEDD5'
BRAND_COLORS.orange[200]  // '#FED7AA'
BRAND_COLORS.orange[300]  // '#FDBA74'
BRAND_COLORS.orange[400]  // '#FB923C'
BRAND_COLORS.orange[500]  // '#F2A30F' (Primary brand orange)
BRAND_COLORS.orange[600]  // '#EA580C'
BRAND_COLORS.orange[700]  // '#C2410C'
BRAND_COLORS.orange[800]  // '#9A3412'
BRAND_COLORS.orange[900]  // '#7C2D12'

// Grey color scale
BRAND_COLORS.grey[50]     // '#FAFAFA'
BRAND_COLORS.grey[100]    // '#F5F5F5'
BRAND_COLORS.grey[200]    // '#EEEEEE' (Light grey background)
BRAND_COLORS.grey[300]    // '#D4D4D4'
BRAND_COLORS.grey[400]    // '#A3A3A3'
BRAND_COLORS.grey[500]    // '#737373'
BRAND_COLORS.grey[600]    // '#525252'
BRAND_COLORS.grey[700]    // '#404040'
BRAND_COLORS.grey[800]    // '#262626'
BRAND_COLORS.grey[900]    // '#212121' (Dark grey/black)
```

## Performance Utilities

For performance optimization, use the performance utilities:

```typescript
import { ThemePerformance } from '../utils/themeUtils';

// Preload theme assets
ThemePerformance.preloadThemeAssets(resolvedTheme);

// Measure theme switch performance
const switchTime = await ThemePerformance.measureThemeSwitchPerformance(() => {
  toggleTheme();
});

console.log(`Theme switch took ${switchTime}ms`);
```

## Animation Utilities

For smooth theme transitions:

```typescript
import { ThemeAnimations } from '../utils/themeUtils';

// Create transition CSS
const transitionCSS = ThemeAnimations.createTransitionCSS();

// Create loading animation
const loadingAnimation = ThemeAnimations.createLoadingAnimation();
```

## Error Handling

The theme utilities handle errors gracefully:

- Invalid hex colors return `null` or fallback values
- Missing theme context throws descriptive errors
- Browser API failures are handled with fallbacks
- Color calculations handle edge cases

## Testing

The theme utilities include comprehensive tests. Run them with:

```bash
npm test client/src/hooks/__tests__/useTheme.test.ts
```

## Best Practices

1. **Use the main useTheme hook** for most use cases
2. **Use specialized hooks** for specific functionality
3. **Test color combinations** for accessibility compliance
4. **Use high contrast mode** for better accessibility
5. **Leverage component helpers** for consistent styling
6. **Test theme switching** in your components
7. **Use CSS custom properties** for dynamic theming
8. **Follow WCAG guidelines** for color contrast

## Examples

See `client/src/examples/ThemeUtilsDemo.tsx` for a comprehensive demo of all theme utilities and their usage.

## Requirements Covered

This implementation covers the following requirements from the enhanced theme system:

- **6.5**: Theme-aware component helpers for consistent styling
- **7.1**: Accessibility compliance with WCAG AA standards
- **7.4**: High contrast mode support and accessibility enhancements

The utilities provide a complete solution for theme-aware development with accessibility as a first-class concern.