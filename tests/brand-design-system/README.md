# Brand Design System Test Suite

This directory contains comprehensive tests for the brand design system implementation, covering visual regression, color consistency, cross-browser compatibility, and performance aspects.

## Test Files

### 1. Visual Regression Tests (`visual-regression.test.ts`)
Tests key components with the new orange and dark grey color scheme:

- **CSS Custom Properties**: Validates correct primary orange (#FF9900) and dark grey (#1A1A1A) colors
- **Component Colors**: Tests buttons, navigation, forms, cards, modals, and badges
- **Typography**: Validates Base Neue font family application
- **Responsive Design**: Ensures brand colors work across screen sizes
- **Dark Mode**: Tests dark mode color variations

### 2. Blue Color Detection Tests (`blue-color-detection.test.ts`)
Automated detection of any remaining blue color usage:

- **CSS Files**: Scans for blue hex values, color names, and CSS properties
- **Component Files**: Detects Tailwind blue classes and inline blue styles
- **Configuration Files**: Validates Tailwind config doesn't contain blue colors
- **Brand Consistency**: Ensures complete migration from blue to orange/grey
- **Accessibility**: Validates orange colors meet contrast requirements

### 3. Cross-Browser Compatibility Tests (`cross-browser-compatibility.test.ts`)
Tests CSS features and compatibility across different browsers:

- **CSS Custom Properties**: Tests fallback values for older browsers
- **Font Loading**: Validates font-display: swap and fallback fonts
- **Layout Methods**: Tests CSS Grid and Flexbox compatibility
- **Color Spaces**: Ensures sRGB compatibility for maximum support
- **Mobile Browsers**: Tests touch interactions and iOS Safari fixes
- **Accessibility**: Tests high contrast and forced colors modes

### 4. Font and Performance Tests (`font-performance.test.ts`)
Tests font loading strategies and performance impact:

- **Font Loading**: Tests font-display: swap and preloading strategies
- **CSS Performance**: Measures selector efficiency and bundle size
- **Core Web Vitals**: Tests LCP, CLS, and FID impact
- **Memory Usage**: Tests resource usage with many styled elements
- **Network Performance**: Validates font file sizes and loading strategies

## Running Tests

### Run all brand design system tests
```bash
npm test tests/brand-design-system
```

### Run specific test file
```bash
npm test tests/brand-design-system/visual-regression.test.ts
npm test tests/brand-design-system/blue-color-detection.test.ts
npm test tests/brand-design-system/cross-browser-compatibility.test.ts
npm test tests/brand-design-system/font-performance.test.ts
```

### Run tests with coverage
```bash
npm run test:coverage -- tests/brand-design-system
```

### Run tests in watch mode
```bash
npm run test:watch -- tests/brand-design-system
```

## Test Requirements Coverage

These tests cover the following requirements from the brand design system specification:

### Requirement 4.4 (Centralized Design System)
- ✅ Tests CSS custom properties configuration
- ✅ Validates reusable utility classes
- ✅ Ensures single source of truth for colors
- ✅ Tests component consistency

### Requirement 5.1 (Accessibility - Contrast)
- ✅ Tests contrast ratios between text and background colors
- ✅ Validates orange color accessibility compliance
- ✅ Tests high contrast mode support
- ✅ Ensures WCAG AA compliance

### Requirement 5.2 (Accessibility - Visual Impairments)
- ✅ Tests screen reader compatibility
- ✅ Validates color scheme accessibility
- ✅ Tests forced colors mode
- ✅ Ensures visual distinction between states

### Requirement 5.3 (Accessibility - Interactive Elements)
- ✅ Tests hover, active, and disabled states
- ✅ Validates focus indicators
- ✅ Tests keyboard navigation compatibility
- ✅ Ensures clear visual feedback

### Requirement 5.4 (Accessibility - Assistive Technology)
- ✅ Tests keyboard navigation with new design
- ✅ Validates screen reader compatibility
- ✅ Tests reduced motion preferences
- ✅ Ensures assistive technology support

## Test Environment

### Dependencies
- **vitest**: Test runner and framework
- **jsdom**: DOM environment for browser simulation
- **glob**: File pattern matching for code scanning
- **@types/jsdom**: TypeScript definitions

### Browser Simulation
Tests use JSDOM to simulate browser environments and test:
- CSS parsing and application
- Font loading behavior
- Color calculations
- Layout and rendering
- Accessibility features

### Performance Metrics
Tests measure:
- CSS parsing time
- Style calculation performance
- Font loading impact
- Memory usage
- Network resource optimization

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run brand design system tests
  run: npm test tests/brand-design-system
  
- name: Generate test coverage
  run: npm run test:coverage -- tests/brand-design-system
```

## Test Data and Cleanup

### Test Isolation
- Each test file is independent
- Tests use JSDOM for isolated DOM environments
- No persistent state between tests
- Automatic cleanup in afterAll hooks

### Mock Data
- Tests use synthetic CSS and HTML content
- No external dependencies on actual font files
- Simulated browser environments for compatibility testing
- Generated DOM elements for performance testing

## Troubleshooting

### Common Issues

**JSDOM Environment Issues**
- Ensure JSDOM is properly installed: `npm install --save-dev jsdom`
- Check that DOM globals are properly set up
- Verify CSS content is loaded correctly

**Font Loading Tests**
- Tests simulate font loading without actual font files
- Font fallback behavior is tested with system fonts
- Performance tests use synthetic font loading scenarios

**Color Detection False Positives**
- Blue color detection may flag legitimate uses (e.g., in comments)
- Tests include context checking to avoid false positives
- Manual review may be needed for edge cases

**Performance Test Variability**
- Performance thresholds may need adjustment based on test environment
- CI environments may have different performance characteristics
- Tests focus on relative performance rather than absolute values

### Debugging Tips

1. **Run tests individually** to isolate issues
2. **Check console output** for detailed error messages
3. **Verify file paths** are correct for your environment
4. **Update thresholds** if performance tests are too strict
5. **Check CSS content** is properly loaded in test environment

## Future Enhancements

Potential additions to the test suite:
- Visual screenshot comparison tests
- Real browser testing with Playwright or Puppeteer
- Performance regression testing
- Automated accessibility auditing
- Color blindness simulation testing
- Print stylesheet testing
- RTL (right-to-left) language support testing

## Contributing

When adding new tests:
1. Follow the existing test structure and naming conventions
2. Include proper cleanup in afterAll hooks
3. Add descriptive test names and comments
4. Update this README with new test coverage
5. Ensure tests are deterministic and don't rely on external resources