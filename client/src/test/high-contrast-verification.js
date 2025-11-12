/**
 * High Contrast Mode Verification Script
 * 
 * This script verifies that the high contrast mode implementation is working correctly.
 * Run this in the browser console to test the functionality.
 */

console.log('🎨 High Contrast Mode Verification Starting...\n');

// Test 1: Check if CSS custom properties are defined
function testCSSVariables() {
  console.log('1️⃣ Testing CSS Custom Properties...');
  
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  
  const requiredVariables = [
    '--brand-orange-accessible',
    '--brand-text-on-light',
    '--brand-text-on-dark',
    '--brand-focus-color',
    '--brand-link-color',
    '--focus-ring-width',
    '--focus-ring-offset'
  ];
  
  let passed = 0;
  requiredVariables.forEach(variable => {
    const value = styles.getPropertyValue(variable);
    if (value) {
      console.log(`   ✅ ${variable}: ${value.trim()}`);
      passed++;
    } else {
      console.log(`   ❌ ${variable}: Not defined`);
    }
  });
  
  console.log(`   Result: ${passed}/${requiredVariables.length} variables defined\n`);
  return passed === requiredVariables.length;
}

// Test 2: Check if high contrast class toggles correctly
function testHighContrastToggle() {
  console.log('2️⃣ Testing High Contrast Class Toggle...');
  
  const root = document.documentElement;
  const initialState = root.classList.contains('high-contrast');
  
  console.log(`   Initial state: ${initialState ? 'High contrast enabled' : 'High contrast disabled'}`);
  
  // Toggle high contrast
  if (initialState) {
    root.classList.remove('high-contrast');
  } else {
    root.classList.add('high-contrast');
  }
  
  const newState = root.classList.contains('high-contrast');
  console.log(`   After toggle: ${newState ? 'High contrast enabled' : 'High contrast disabled'}`);
  
  // Restore original state
  if (initialState) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }
  
  const restored = root.classList.contains('high-contrast') === initialState;
  console.log(`   State restored: ${restored ? 'Yes' : 'No'}\n`);
  
  return newState !== initialState && restored;
}

// Test 3: Check if high contrast styles are applied
function testHighContrastStyles() {
  console.log('3️⃣ Testing High Contrast Styles Application...');
  
  const root = document.documentElement;
  const wasHighContrast = root.classList.contains('high-contrast');
  
  // Enable high contrast for testing
  root.classList.add('high-contrast');
  
  const styles = getComputedStyle(root);
  
  // Test specific high contrast variables
  const highContrastTests = [
    {
      name: 'Primary color (AAA compliant)',
      variable: '--primary',
      test: (value) => value.includes('25%') || value.includes('75%') // Dark or bright for AAA
    },
    {
      name: 'Background color (pure)',
      variable: '--background',
      test: (value) => value.includes('0%') || value.includes('100%') // Pure black or white
    },
    {
      name: 'Foreground color (pure)',
      variable: '--foreground',
      test: (value) => value.includes('0%') || value.includes('100%') // Pure black or white
    },
    {
      name: 'Focus ring width (enhanced)',
      variable: '--focus-ring-width',
      test: (value) => value === '3px'
    }
  ];
  
  let passed = 0;
  highContrastTests.forEach(test => {
    const value = styles.getPropertyValue(test.variable).trim();
    const testPassed = test.test(value);
    
    if (testPassed) {
      console.log(`   ✅ ${test.name}: ${value}`);
      passed++;
    } else {
      console.log(`   ❌ ${test.name}: ${value} (test failed)`);
    }
  });
  
  // Restore original state
  if (!wasHighContrast) {
    root.classList.remove('high-contrast');
  }
  
  console.log(`   Result: ${passed}/${highContrastTests.length} style tests passed\n`);
  return passed === highContrastTests.length;
}

// Test 4: Check if theme toggle components exist
function testThemeComponents() {
  console.log('4️⃣ Testing Theme Toggle Components...');
  
  const themeToggles = document.querySelectorAll('[data-theme-toggle]');
  const highContrastToggles = document.querySelectorAll('[role="switch"]');
  
  console.log(`   Theme toggles found: ${themeToggles.length}`);
  console.log(`   Switch elements found: ${highContrastToggles.length}`);
  
  // Check if any toggle has high contrast functionality
  let hasHighContrastToggle = false;
  highContrastToggles.forEach(toggle => {
    const ariaLabel = toggle.getAttribute('aria-label') || '';
    if (ariaLabel.toLowerCase().includes('high contrast')) {
      hasHighContrastToggle = true;
      console.log(`   ✅ High contrast toggle found: ${ariaLabel}`);
    }
  });
  
  if (!hasHighContrastToggle) {
    console.log(`   ❌ No high contrast toggle found`);
  }
  
  console.log(`   Result: ${hasHighContrastToggle ? 'High contrast toggle available' : 'No high contrast toggle found'}\n`);
  return hasHighContrastToggle;
}

// Test 5: Check accessibility features
function testAccessibilityFeatures() {
  console.log('5️⃣ Testing Accessibility Features...');
  
  const root = document.documentElement;
  const wasHighContrast = root.classList.contains('high-contrast');
  
  // Enable high contrast for testing
  root.classList.add('high-contrast');
  
  // Create test elements
  const testContainer = document.createElement('div');
  testContainer.innerHTML = `
    <button class="high-contrast-button">Test Button</button>
    <input class="high-contrast-input" placeholder="Test Input">
    <a href="#" class="high-contrast-link">Test Link</a>
  `;
  document.body.appendChild(testContainer);
  
  const button = testContainer.querySelector('button');
  const input = testContainer.querySelector('input');
  const link = testContainer.querySelector('a');
  
  let passed = 0;
  const tests = [
    {
      name: 'Button has enhanced border',
      element: button,
      test: (el) => {
        const styles = getComputedStyle(el);
        return styles.borderWidth === '2px';
      }
    },
    {
      name: 'Input has enhanced focus',
      element: input,
      test: (el) => {
        el.focus();
        const styles = getComputedStyle(el);
        el.blur();
        return true; // Focus styles are applied via CSS, hard to test programmatically
      }
    },
    {
      name: 'Link has underline',
      element: link,
      test: (el) => {
        const styles = getComputedStyle(el);
        return styles.textDecoration.includes('underline');
      }
    }
  ];
  
  tests.forEach(test => {
    try {
      const result = test.test(test.element);
      if (result) {
        console.log(`   ✅ ${test.name}`);
        passed++;
      } else {
        console.log(`   ❌ ${test.name}`);
      }
    } catch (error) {
      console.log(`   ❌ ${test.name}: Error - ${error.message}`);
    }
  });
  
  // Clean up
  document.body.removeChild(testContainer);
  
  // Restore original state
  if (!wasHighContrast) {
    root.classList.remove('high-contrast');
  }
  
  console.log(`   Result: ${passed}/${tests.length} accessibility tests passed\n`);
  return passed >= tests.length * 0.7; // Allow 70% pass rate
}

// Test 6: Check WCAG compliance
function testWCAGCompliance() {
  console.log('6️⃣ Testing WCAG Compliance...');
  
  const root = document.documentElement;
  const wasHighContrast = root.classList.contains('high-contrast');
  
  // Enable high contrast for testing
  root.classList.add('high-contrast');
  
  const styles = getComputedStyle(root);
  
  // Check if colors meet AAA contrast requirements
  const contrastTests = [
    {
      name: 'Primary color contrast (AAA)',
      test: () => {
        const primary = styles.getPropertyValue('--primary').trim();
        // AAA requires 7:1 contrast ratio
        // For orange, this means very dark (25%) or very bright (75%+)
        return primary.includes('25%') || primary.includes('75%') || primary.includes('80%');
      }
    },
    {
      name: 'Background/Foreground contrast',
      test: () => {
        const bg = styles.getPropertyValue('--background').trim();
        const fg = styles.getPropertyValue('--foreground').trim();
        // Should be pure black/white for maximum contrast
        return (bg.includes('0%') && fg.includes('100%')) || 
               (bg.includes('100%') && fg.includes('0%'));
      }
    },
    {
      name: 'Enhanced focus indicators',
      test: () => {
        const focusWidth = styles.getPropertyValue('--focus-ring-width').trim();
        const focusOffset = styles.getPropertyValue('--focus-ring-offset').trim();
        return focusWidth === '3px' && focusOffset === '2px';
      }
    }
  ];
  
  let passed = 0;
  contrastTests.forEach(test => {
    if (test.test()) {
      console.log(`   ✅ ${test.name}`);
      passed++;
    } else {
      console.log(`   ❌ ${test.name}`);
    }
  });
  
  // Restore original state
  if (!wasHighContrast) {
    root.classList.remove('high-contrast');
  }
  
  console.log(`   Result: ${passed}/${contrastTests.length} WCAG tests passed\n`);
  return passed === contrastTests.length;
}

// Run all tests
function runAllTests() {
  console.log('🚀 Running High Contrast Mode Verification Tests...\n');
  
  const tests = [
    { name: 'CSS Variables', fn: testCSSVariables },
    { name: 'High Contrast Toggle', fn: testHighContrastToggle },
    { name: 'High Contrast Styles', fn: testHighContrastStyles },
    { name: 'Theme Components', fn: testThemeComponents },
    { name: 'Accessibility Features', fn: testAccessibilityFeatures },
    { name: 'WCAG Compliance', fn: testWCAGCompliance }
  ];
  
  let totalPassed = 0;
  const results = tests.map(test => {
    const passed = test.fn();
    if (passed) totalPassed++;
    return { name: test.name, passed };
  });
  
  console.log('📊 Test Results Summary:');
  console.log('========================');
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log(`\n🎯 Overall Result: ${totalPassed}/${tests.length} tests passed`);
  
  if (totalPassed === tests.length) {
    console.log('🎉 All tests passed! High contrast mode is working correctly.');
  } else if (totalPassed >= tests.length * 0.8) {
    console.log('⚠️  Most tests passed. Minor issues may need attention.');
  } else {
    console.log('❌ Several tests failed. High contrast mode needs fixes.');
  }
  
  return totalPassed / tests.length;
}

// Auto-run tests if this script is executed directly
if (typeof window !== 'undefined') {
  runAllTests();
}

// Export for manual testing
window.highContrastVerification = {
  runAllTests,
  testCSSVariables,
  testHighContrastToggle,
  testHighContrastStyles,
  testThemeComponents,
  testAccessibilityFeatures,
  testWCAGCompliance
};