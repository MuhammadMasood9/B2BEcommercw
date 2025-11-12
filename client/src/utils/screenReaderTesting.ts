/**
 * Screen Reader Compatibility Testing Utilities
 * Validates ARIA attributes, semantic HTML, and screen reader announcements
 */

export interface ScreenReaderTestResult {
  passed: boolean;
  message: string;
  element?: Element;
  recommendation?: string;
}

export interface ScreenReaderReport {
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    warnings: number;
    compliancePercentage: number;
  };
  results: {
    ariaLabels: ScreenReaderTestResult[];
    semanticStructure: ScreenReaderTestResult[];
    keyboardNavigation: ScreenReaderTestResult[];
    liveRegions: ScreenReaderTestResult[];
    formAccessibility: ScreenReaderTestResult[];
  };
  recommendations: string[];
  criticalIssues: string[];
}

/**
 * Test ARIA labels and attributes
 */
export function testAriaLabels(): ScreenReaderTestResult[] {
  const results: ScreenReaderTestResult[] = [];
  
  // Test buttons without accessible names
  const buttons = document.querySelectorAll('button');
  buttons.forEach((button, index) => {
    const hasText = button.textContent?.trim();
    const hasAriaLabel = button.getAttribute('aria-label');
    const hasAriaLabelledBy = button.getAttribute('aria-labelledby');
    
    if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
      results.push({
        passed: false,
        message: `Button ${index + 1} lacks accessible name`,
        element: button,
        recommendation: 'Add aria-label, aria-labelledby, or visible text content'
      });
    } else {
      results.push({
        passed: true,
        message: `Button ${index + 1} has accessible name`,
        element: button
      });
    }
  });
  
  // Test images without alt text
  const images = document.querySelectorAll('img');
  images.forEach((img, index) => {
    const altText = img.getAttribute('alt');
    const ariaLabel = img.getAttribute('aria-label');
    const role = img.getAttribute('role');
    
    if (altText === null && !ariaLabel && role !== 'presentation') {
      results.push({
        passed: false,
        message: `Image ${index + 1} missing alt text`,
        element: img,
        recommendation: 'Add alt attribute or role="presentation" for decorative images'
      });
    } else {
      results.push({
        passed: true,
        message: `Image ${index + 1} has proper alt text`,
        element: img
      });
    }
  });
  
  // Test form inputs without labels
  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach((input, index) => {
    const id = input.getAttribute('id');
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledBy = input.getAttribute('aria-labelledby');
    const label = id ? document.querySelector(`label[for="${id}"]`) : null;
    
    if (!label && !ariaLabel && !ariaLabelledBy) {
      results.push({
        passed: false,
        message: `Form input ${index + 1} lacks accessible label`,
        element: input,
        recommendation: 'Add associated label element or aria-label attribute'
      });
    } else {
      results.push({
        passed: true,
        message: `Form input ${index + 1} has accessible label`,
        element: input
      });
    }
  });
  
  // Test links without accessible names
  const links = document.querySelectorAll('a');
  links.forEach((link, index) => {
    const hasText = link.textContent?.trim();
    const hasAriaLabel = link.getAttribute('aria-label');
    const hasAriaLabelledBy = link.getAttribute('aria-labelledby');
    
    if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
      results.push({
        passed: false,
        message: `Link ${index + 1} lacks accessible name`,
        element: link,
        recommendation: 'Add descriptive text content or aria-label'
      });
    } else if (hasText && (hasText === 'click here' || hasText === 'read more' || hasText === 'learn more')) {
      results.push({
        passed: false,
        message: `Link ${index + 1} has non-descriptive text: "${hasText}"`,
        element: link,
        recommendation: 'Use more descriptive link text that explains the destination or purpose'
      });
    } else {
      results.push({
        passed: true,
        message: `Link ${index + 1} has descriptive accessible name`,
        element: link
      });
    }
  });
  
  return results;
}

/**
 * Test semantic HTML structure
 */
export function testSemanticStructure(): ScreenReaderTestResult[] {
  const results: ScreenReaderTestResult[] = [];
  
  // Test heading hierarchy
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let previousLevel = 0;
  
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));
    
    if (index === 0 && level !== 1) {
      results.push({
        passed: false,
        message: 'Page should start with h1 heading',
        element: heading,
        recommendation: 'Use h1 for the main page heading'
      });
    } else if (level > previousLevel + 1) {
      results.push({
        passed: false,
        message: `Heading level skipped: h${previousLevel} to h${level}`,
        element: heading,
        recommendation: 'Use sequential heading levels (h1, h2, h3, etc.)'
      });
    } else {
      results.push({
        passed: true,
        message: `Heading ${index + 1} follows proper hierarchy`,
        element: heading
      });
    }
    
    previousLevel = level;
  });
  
  // Test landmark regions
  const landmarks = {
    main: document.querySelectorAll('main, [role="main"]'),
    nav: document.querySelectorAll('nav, [role="navigation"]'),
    banner: document.querySelectorAll('header, [role="banner"]'),
    contentinfo: document.querySelectorAll('footer, [role="contentinfo"]')
  };
  
  Object.entries(landmarks).forEach(([landmark, elements]) => {
    if (elements.length === 0) {
      results.push({
        passed: false,
        message: `Missing ${landmark} landmark`,
        recommendation: `Add <${landmark}> element or role="${landmark}" to improve navigation`
      });
    } else if (elements.length > 1 && (landmark === 'main' || landmark === 'banner' || landmark === 'contentinfo')) {
      results.push({
        passed: false,
        message: `Multiple ${landmark} landmarks found`,
        recommendation: `Use only one ${landmark} landmark per page`
      });
    } else {
      results.push({
        passed: true,
        message: `${landmark} landmark properly implemented`
      });
    }
  });
  
  // Test list structure
  const lists = document.querySelectorAll('ul, ol');
  lists.forEach((list, index) => {
    const listItems = list.querySelectorAll('li');
    if (listItems.length === 0) {
      results.push({
        passed: false,
        message: `List ${index + 1} contains no list items`,
        element: list,
        recommendation: 'Lists should contain li elements'
      });
    } else {
      results.push({
        passed: true,
        message: `List ${index + 1} has proper structure`,
        element: list
      });
    }
  });
  
  return results;
}

/**
 * Test keyboard navigation
 */
export function testKeyboardNavigation(): ScreenReaderTestResult[] {
  const results: ScreenReaderTestResult[] = [];
  
  // Test focusable elements
  const focusableElements = document.querySelectorAll(
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  focusableElements.forEach((element, index) => {
    const tabIndex = element.getAttribute('tabindex');
    
    // Check for positive tabindex (anti-pattern)
    if (tabIndex && parseInt(tabIndex) > 0) {
      results.push({
        passed: false,
        message: `Element ${index + 1} uses positive tabindex (${tabIndex})`,
        element: element,
        recommendation: 'Avoid positive tabindex values. Use 0 or -1, or rely on natural tab order'
      });
    } else {
      results.push({
        passed: true,
        message: `Element ${index + 1} has proper tab order`,
        element: element
      });
    }
    
    // Check if element is visible but not focusable
    const computedStyle = window.getComputedStyle(element);
    const isVisible = computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';
    const isDisabled = (element as HTMLInputElement).disabled;
    
    if (isVisible && !isDisabled && tabIndex === '-1') {
      results.push({
        passed: false,
        message: `Visible interactive element ${index + 1} is not keyboard accessible`,
        element: element,
        recommendation: 'Remove tabindex="-1" or make element focusable'
      });
    }
  });
  
  // Test skip links
  const skipLinks = document.querySelectorAll('a[href^="#"]');
  let hasSkipToMain = false;
  
  skipLinks.forEach((link) => {
    const href = link.getAttribute('href');
    const text = link.textContent?.toLowerCase();
    
    if (text?.includes('skip') && text?.includes('main')) {
      hasSkipToMain = true;
      
      // Check if target exists
      const target = document.querySelector(href || '');
      if (!target) {
        results.push({
          passed: false,
          message: 'Skip link target does not exist',
          element: link,
          recommendation: `Ensure element with id="${href?.slice(1)}" exists`
        });
      } else {
        results.push({
          passed: true,
          message: 'Skip link properly implemented',
          element: link
        });
      }
    }
  });
  
  if (!hasSkipToMain) {
    results.push({
      passed: false,
      message: 'No skip to main content link found',
      recommendation: 'Add skip link for keyboard users to bypass navigation'
    });
  }
  
  return results;
}

/**
 * Test live regions and dynamic content
 */
export function testLiveRegions(): ScreenReaderTestResult[] {
  const results: ScreenReaderTestResult[] = [];
  
  // Test for live regions
  const liveRegions = document.querySelectorAll('[aria-live]');
  
  liveRegions.forEach((region, index) => {
    const ariaLive = region.getAttribute('aria-live');
    const ariaAtomic = region.getAttribute('aria-atomic');
    
    if (ariaLive !== 'polite' && ariaLive !== 'assertive' && ariaLive !== 'off') {
      results.push({
        passed: false,
        message: `Live region ${index + 1} has invalid aria-live value: "${ariaLive}"`,
        element: region,
        recommendation: 'Use aria-live="polite" or aria-live="assertive"'
      });
    } else {
      results.push({
        passed: true,
        message: `Live region ${index + 1} properly configured`,
        element: region
      });
    }
    
    // Recommend aria-atomic for better announcements
    if (!ariaAtomic) {
      results.push({
        passed: false,
        message: `Live region ${index + 1} missing aria-atomic attribute`,
        element: region,
        recommendation: 'Add aria-atomic="true" for complete announcements'
      });
    }
  });
  
  // Check for status messages
  const statusElements = document.querySelectorAll('[role="status"], [role="alert"]');
  
  statusElements.forEach((element, index) => {
    const role = element.getAttribute('role');
    const ariaLive = element.getAttribute('aria-live');
    
    if (role === 'alert' && ariaLive && ariaLive !== 'assertive') {
      results.push({
        passed: false,
        message: `Alert ${index + 1} should use aria-live="assertive"`,
        element: element,
        recommendation: 'Use aria-live="assertive" for urgent messages'
      });
    } else {
      results.push({
        passed: true,
        message: `Status element ${index + 1} properly configured`,
        element: element
      });
    }
  });
  
  return results;
}

/**
 * Test form accessibility
 */
export function testFormAccessibility(): ScreenReaderTestResult[] {
  const results: ScreenReaderTestResult[] = [];
  
  // Test form structure
  const forms = document.querySelectorAll('form');
  
  forms.forEach((form, formIndex) => {
    // Test fieldsets and legends
    const fieldsets = form.querySelectorAll('fieldset');
    fieldsets.forEach((fieldset, index) => {
      const legend = fieldset.querySelector('legend');
      if (!legend) {
        results.push({
          passed: false,
          message: `Fieldset ${index + 1} in form ${formIndex + 1} missing legend`,
          element: fieldset,
          recommendation: 'Add legend element to describe the group of form controls'
        });
      } else {
        results.push({
          passed: true,
          message: `Fieldset ${index + 1} has proper legend`,
          element: fieldset
        });
      }
    });
    
    // Test required fields
    const requiredInputs = form.querySelectorAll('[required]');
    requiredInputs.forEach((input, index) => {
      const ariaRequired = input.getAttribute('aria-required');
      const hasRequiredIndicator = input.parentElement?.textContent?.includes('*') ||
                                  input.parentElement?.textContent?.toLowerCase().includes('required');
      
      if (!ariaRequired && !hasRequiredIndicator) {
        results.push({
          passed: false,
          message: `Required field ${index + 1} not clearly marked`,
          element: input,
          recommendation: 'Add aria-required="true" and visual indicator for required fields'
        });
      } else {
        results.push({
          passed: true,
          message: `Required field ${index + 1} properly marked`,
          element: input
        });
      }
    });
    
    // Test error messages
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach((input, index) => {
      const ariaDescribedBy = input.getAttribute('aria-describedby');
      const ariaInvalid = input.getAttribute('aria-invalid');
      
      if (ariaInvalid === 'true' && !ariaDescribedBy) {
        results.push({
          passed: false,
          message: `Invalid field ${index + 1} missing error description`,
          element: input,
          recommendation: 'Use aria-describedby to associate error messages with form fields'
        });
      } else if (ariaInvalid === 'true' && ariaDescribedBy) {
        const errorElement = document.getElementById(ariaDescribedBy);
        if (!errorElement) {
          results.push({
            passed: false,
            message: `Error description element not found for field ${index + 1}`,
            element: input,
            recommendation: `Ensure element with id="${ariaDescribedBy}" exists`
          });
        } else {
          results.push({
            passed: true,
            message: `Field ${index + 1} has proper error description`,
            element: input
          });
        }
      }
    });
  });
  
  return results;
}

/**
 * Run comprehensive screen reader compatibility tests
 */
export function runScreenReaderTests(): ScreenReaderReport {
  const ariaLabels = testAriaLabels();
  const semanticStructure = testSemanticStructure();
  const keyboardNavigation = testKeyboardNavigation();
  const liveRegions = testLiveRegions();
  const formAccessibility = testFormAccessibility();
  
  const allResults = [
    ...ariaLabels,
    ...semanticStructure,
    ...keyboardNavigation,
    ...liveRegions,
    ...formAccessibility
  ];
  
  const totalTests = allResults.length;
  const passed = allResults.filter(r => r.passed).length;
  const failed = totalTests - passed;
  const warnings = allResults.filter(r => !r.passed && r.recommendation).length;
  const compliancePercentage = Math.round((passed / totalTests) * 100);
  
  const recommendations: string[] = [];
  const criticalIssues: string[] = [];
  
  allResults.forEach(result => {
    if (!result.passed && result.recommendation) {
      if (result.message.includes('Button') || result.message.includes('Form') || result.message.includes('heading')) {
        criticalIssues.push(`CRITICAL: ${result.message} - ${result.recommendation}`);
      } else {
        recommendations.push(`${result.message} - ${result.recommendation}`);
      }
    }
  });
  
  // Add general recommendations
  if (compliancePercentage < 100) {
    recommendations.push(
      'Test with actual screen reader software (NVDA, JAWS, VoiceOver)',
      'Implement automated accessibility testing in CI/CD pipeline',
      'Conduct user testing with people who use assistive technologies',
      'Provide alternative formats for complex content (audio descriptions, transcripts)'
    );
  }
  
  return {
    summary: {
      totalTests,
      passed,
      failed,
      warnings,
      compliancePercentage
    },
    results: {
      ariaLabels,
      semanticStructure,
      keyboardNavigation,
      liveRegions,
      formAccessibility
    },
    recommendations,
    criticalIssues
  };
}

/**
 * Create live region for screen reader announcements
 */
export function createLiveRegion(id: string = 'live-region'): HTMLElement {
  let liveRegion = document.getElementById(id);
  
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = id;
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only live-region';
    document.body.appendChild(liveRegion);
  }
  
  return liveRegion;
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const liveRegion = createLiveRegion();
  liveRegion.setAttribute('aria-live', priority);
  
  // Clear previous message
  liveRegion.textContent = '';
  
  // Add new message after a brief delay to ensure it's announced
  setTimeout(() => {
    liveRegion.textContent = message;
  }, 100);
  
  // Clear message after announcement
  setTimeout(() => {
    liveRegion.textContent = '';
  }, 3000);
}

/**
 * Test color scheme compatibility with screen readers
 */
export function testColorSchemeCompatibility(): ScreenReaderTestResult[] {
  const results: ScreenReaderTestResult[] = [];
  
  // Test if color is the only way to convey information
  const colorOnlyElements = document.querySelectorAll('[style*="color:"], .text-red, .text-green, .text-primary, .bg-red, .bg-green, .bg-primary');
  
  colorOnlyElements.forEach((element, index) => {
    const hasTextIndicator = element.textContent?.includes('✓') || 
                            element.textContent?.includes('✗') ||
                            element.textContent?.includes('!') ||
                            element.textContent?.includes('*');
    
    const hasAriaLabel = element.getAttribute('aria-label');
    const hasTitle = element.getAttribute('title');
    const hasPattern = element.classList.contains('pattern-accessible');
    
    if (!hasTextIndicator && !hasAriaLabel && !hasTitle && !hasPattern) {
      results.push({
        passed: false,
        message: `Element ${index + 1} may rely solely on color to convey information`,
        element: element,
        recommendation: 'Add text indicators, icons, or patterns in addition to color'
      });
    } else {
      results.push({
        passed: true,
        message: `Element ${index + 1} has non-color indicators`,
        element: element
      });
    }
  });
  
  return results;
}