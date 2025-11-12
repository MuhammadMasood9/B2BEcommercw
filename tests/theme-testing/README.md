# Theme Testing Suite

This directory contains comprehensive tests for the enhanced theme system, covering unit tests, visual regression tests, accessibility tests, and end-to-end tests.

## Test Structure

### Unit Tests (`tests/unit/`)
- **theme-provider.test.ts**: Tests ThemeProvider component functionality, state management, and context behavior
- **theme-utilities.test.ts**: Tests theme utility functions including color conversion, contrast calculation, and theme validation

### Visual Regression Tests (`tests/visual/`)
- **theme-visual-regression.test.ts**: Tests visual consistency across themes using Playwright screenshots

### Accessibility Tests (`tests/accessibility/`)
- **theme-contrast.test.ts**: Tests WCAG compliance and contrast ratios across all theme variations

### End-to-End Tests (`tests/e2e/`)
- **theme-switching.test.ts**: Tests complete user workflows for theme switching, persistence, and performance

## Running Tests

### Run all theme tests
```bash
npm run test:theme
```

### Run specific test categories
```bash
# Unit tests only
npm run test:theme:unit

# Visual regression tests
npm run test:theme:visual

# Accessibility tests
npm run test:theme:accessibility

# E2E tests
npm run test:theme:e2e
```

### Run tests with coverage
```bash
npm run test:theme:coverage
```

### Run tests in watch mode
```bash
npm run test:theme:watch
```

## Test Coverage

### Theme Provider Tests
- ✅ Initialization with different default themes
- ✅ System preference detection and handling
- ✅ Theme state management and persistence
- ✅ High contrast mode functionality
- ✅ DOM class management
- ✅ Error handling for localStorage failures
- ✅ Configuration options validation

### Theme Utilities Tests
- ✅ Color conversion functions (hex ↔ HSL)
- ✅ Color manipulation (lighten, darken)
- ✅ Contrast ratio calculations
- ✅ WCAG compliance validation
- ✅ Color scale generation
- ✅ Theme-specific color adjustments
- ✅ Theme validation functions
- ✅ Edge case handling

### Visual Regression Tests
- ✅ Component consistency across themes
- ✅ Page-level theme consistency
- ✅ Layout stability during transitions
- ✅ Brand color consistency
- ✅ Cross-viewport compatibility

### Accessibility Tests
- ✅ WCAG AA/AAA contrast compliance
- ✅ Live page contrast validation
- ✅ Interactive element accessibility
- ✅ Form element contrast
- ✅ Focus indicator visibility

### E2E Tests
- ✅ Theme toggle functionality
- ✅ Persistence across sessions and pages
- ✅ High contrast mode integration
- ✅ System preference handling
- ✅ Performance and transition timing
- ✅ Keyboard navigation during transitions
- ✅ Error handling and edge cases

## Test Requirements Coverage

This test suite covers all requirements from the enhanced theme system specification:

### Requirement 7.1 (Accessibility Compliance)
- ✅ WCAG AA contrast requirements (4.5:1 minimum)
- ✅ Focus indicator visibility testing
- ✅ Screen reader compatibility validation
- ✅ High contrast mode testing

### Requirement 8.5 (Performance Optimization)
- ✅ Theme switching performance measurement
- ✅ Layout shift detection
- ✅ Rapid switching handling
- ✅ Memory leak prevention

## Browser Compatibility

Tests are configured to run on:
- ✅ Chromium (primary)
- ✅ Firefox (via Playwright)
- ✅ WebKit/Safari (via Playwright)

## CI/CD Integration

Tests are designed for continuous integration:

```yaml
# Example GitHub Actions workflow
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install

- name: Run theme tests
  run: npm run test:theme

- name: Upload test results
  uses: actions/upload-artifact@v3
  with:
    name: theme-test-results
    path: test-results/
```

## Visual Test Baselines

Visual regression tests create baseline images on first run. To update baselines:

```bash
# Update all baselines
npm run test:theme:visual -- --update-snapshots

# Update specific component baselines
npm run test:theme:visual -- --grep "button" --update-snapshots
```

## Troubleshooting

### Common Issues

1. **Visual test failures**: Usually caused by font rendering differences or timing issues
   - Solution: Update baselines or adjust threshold in test config

2. **E2E test timeouts**: Network or performance issues
   - Solution: Increase timeout values or check server performance

3. **Accessibility test failures**: Contrast ratio issues
   - Solution: Review color combinations and adjust theme colors

4. **Unit test failures**: Logic errors in theme utilities
   - Solution: Review utility functions and test expectations

### Debug Mode

Run tests with debug output:
```bash
DEBUG=1 npm run test:theme
```

### Headful Mode (for E2E tests)
```bash
HEADFUL=1 npm run test:theme:e2e
```

## Contributing

When adding new theme features:

1. Add corresponding unit tests for utility functions
2. Add visual regression tests for UI components
3. Add accessibility tests for new interactive elements
4. Add E2E tests for user workflows
5. Update this README with new test coverage

## Performance Benchmarks

Expected performance targets:
- Theme switching: < 300ms
- Initial theme load: < 100ms
- Visual regression comparison: < 5s per component
- Accessibility scan: < 2s per page

## Test Data

Tests use the following brand colors:
- Primary Orange: #F2A30F
- Dark Grey: #212121
- Light Grey: #EEEEEE
- White: #FFFFFF
- Black: #000000

Contrast ratios tested:
- Orange on White: ~2.8:1 (fails AA)
- Dark Grey on White: ~15.8:1 (passes AAA)
- White on Dark Grey: ~15.8:1 (passes AAA)
- Black on White: 21:1 (passes AAA)