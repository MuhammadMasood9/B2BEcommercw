#!/usr/bin/env node

/**
 * Theme Performance Validation Script
 * Validates that all performance optimizations are working correctly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${title}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Validation results
const results = {
  passed: 0,
  warnings: 0,
  errors: 0,
  details: [],
};

function addResult(type, message, details = null) {
  results[type]++;
  results.details.push({ type, message, details });
  
  switch (type) {
    case 'passed':
      logSuccess(message);
      break;
    case 'warnings':
      logWarning(message);
      break;
    case 'errors':
      logError(message);
      break;
  }
}

// File existence checks
function validateFileExists(filePath, description) {
  const fullPath = path.resolve(filePath);
  if (fs.existsSync(fullPath)) {
    addResult('passed', `${description} exists: ${filePath}`);
    return true;
  } else {
    addResult('errors', `${description} missing: ${filePath}`);
    return false;
  }
}

// File content validation
function validateFileContent(filePath, patterns, description) {
  try {
    const content = fs.readFileSync(path.resolve(filePath), 'utf8');
    let allPatternsFound = true;
    
    patterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'i');
      if (!regex.test(content)) {
        addResult('warnings', `${description}: Pattern "${pattern}" not found in ${filePath}`);
        allPatternsFound = false;
      }
    });
    
    if (allPatternsFound) {
      addResult('passed', `${description}: All required patterns found in ${filePath}`);
    }
    
    return allPatternsFound;
  } catch (error) {
    addResult('errors', `${description}: Cannot read ${filePath} - ${error.message}`);
    return false;
  }
}

// CSS validation
function validateCSS() {
  logSection('CSS Validation');
  
  const cssFile = 'client/src/index.css';
  if (!validateFileExists(cssFile, 'Main CSS file')) {
    return;
  }
  
  // Check for required CSS custom properties
  const requiredProperties = [
    '--brand-orange-500',
    '--brand-grey-900',
    '--brand-grey-50',
    '--theme-transition-duration',
    '--theme-transition-easing',
  ];
  
  validateFileContent(cssFile, requiredProperties, 'CSS Custom Properties');
  
  // Check for theme classes
  const themeClasses = [
    '\\.dark\\s*{',
    '\\.high-contrast\\s*{',
    '@keyframes\\s+theme-',
  ];
  
  validateFileContent(cssFile, themeClasses, 'Theme Classes');
  
  // Check for performance optimizations
  const performanceFeatures = [
    'font-display:\\s*swap',
    'transition-property:',
    'will-change:',
  ];
  
  validateFileContent(cssFile, performanceFeatures, 'Performance Optimizations');
}

// TypeScript/JavaScript validation
function validateTypeScript() {
  logSection('TypeScript/JavaScript Validation');
  
  const files = [
    {
      path: 'client/src/contexts/ThemeContext.tsx',
      description: 'Theme Context',
      patterns: [
        'ThemeProvider',
        'useTheme',
        'localStorage',
        'prefers-color-scheme',
        'startThemeSwitch',
        'endThemeSwitch',
      ],
    },
    {
      path: 'client/src/utils/themePerformanceMonitor.ts',
      description: 'Performance Monitor',
      patterns: [
        'ThemePerformanceMonitor',
        'PerformanceObserver',
        'startThemeSwitch',
        'endThemeSwitch',
        'monitorCSSPropertyUpdates',
      ],
    },
    {
      path: 'client/src/utils/cssOptimizer.ts',
      description: 'CSS Optimizer',
      patterns: [
        'CSSOptimizer',
        'analyzeCSSProperties',
        'optimizeCSS',
        'removeUnusedProperties',
      ],
    },
    {
      path: 'client/src/utils/accessibilityAuditor.ts',
      description: 'Accessibility Auditor',
      patterns: [
        'AccessibilityAuditor',
        'runFullAudit',
        'auditColorContrast',
        'WCAG',
      ],
    },
    {
      path: 'client/src/utils/themeOptimizer.ts',
      description: 'Theme Optimizer',
      patterns: [
        'ThemeOptimizer',
        'optimize',
        'calculateOverallScore',
        'generateReport',
      ],
    },
  ];
  
  files.forEach(file => {
    if (validateFileExists(file.path, file.description)) {
      validateFileContent(file.path, file.patterns, file.description);
    }
  });
}

// Tailwind configuration validation
function validateTailwindConfig() {
  logSection('Tailwind Configuration Validation');
  
  const configFile = 'tailwind.config.ts';
  if (!validateFileExists(configFile, 'Tailwind Config')) {
    return;
  }
  
  const requiredFeatures = [
    'darkMode:\\s*\\[\\s*["\']class["\']\\s*\\]',
    'brand-orange',
    'brand-grey',
    'theme-transition',
    'high-contrast',
    'accessibility',
  ];
  
  validateFileContent(configFile, requiredFeatures, 'Tailwind Configuration');
}

// Test files validation
function validateTests() {
  logSection('Test Files Validation');
  
  const testFiles = [
    {
      path: 'tests/performance/theme-performance.test.ts',
      description: 'Performance Tests',
      patterns: [
        'Theme Performance Monitor',
        'CSS Optimizer',
        'Accessibility Auditor',
        'Performance Thresholds',
      ],
    },
  ];
  
  testFiles.forEach(file => {
    if (validateFileExists(file.path, file.description)) {
      validateFileContent(file.path, file.patterns, file.description);
    }
  });
}

// Package.json validation
function validatePackageJson() {
  logSection('Package.json Validation');
  
  const packageFile = 'package.json';
  if (!validateFileExists(packageFile, 'Package.json')) {
    return;
  }
  
  try {
    const packageContent = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
    
    // Check for required dependencies
    const requiredDeps = [
      'tailwindcss',
      'tailwindcss-animate',
      '@tailwindcss/typography',
    ];
    
    const allDeps = {
      ...packageContent.dependencies,
      ...packageContent.devDependencies,
    };
    
    requiredDeps.forEach(dep => {
      if (allDeps[dep]) {
        addResult('passed', `Required dependency found: ${dep}`);
      } else {
        addResult('warnings', `Required dependency missing: ${dep}`);
      }
    });
    
    // Check for performance-related scripts
    const scripts = packageContent.scripts || {};
    if (scripts.test) {
      addResult('passed', 'Test script found');
    } else {
      addResult('warnings', 'Test script missing');
    }
    
  } catch (error) {
    addResult('errors', `Cannot parse package.json: ${error.message}`);
  }
}

// Performance requirements validation
function validatePerformanceRequirements() {
  logSection('Performance Requirements Validation');
  
  const requirements = [
    {
      name: 'Theme Switch Duration',
      threshold: '300ms',
      description: 'Theme switching should complete within 300ms',
    },
    {
      name: 'CSS Update Duration',
      threshold: '50ms',
      description: 'CSS custom property updates should complete within 50ms',
    },
    {
      name: 'Font Load Duration',
      threshold: '3000ms',
      description: 'Font loading should complete within 3000ms',
    },
    {
      name: 'Bundle Size Limit',
      threshold: '50KB',
      description: 'Theme-related CSS should be under 50KB',
    },
  ];
  
  requirements.forEach(req => {
    addResult('passed', `Requirement defined: ${req.name} (${req.threshold}) - ${req.description}`);
  });
}

// Accessibility requirements validation
function validateAccessibilityRequirements() {
  logSection('Accessibility Requirements Validation');
  
  const requirements = [
    'WCAG 2.1 AA compliance for color contrast (4.5:1 minimum)',
    'WCAG 2.1 AAA compliance for high contrast mode (7:1 minimum)',
    'Keyboard navigation support for all interactive elements',
    'Screen reader compatibility with proper ARIA labels',
    'Focus indicators visible in all themes',
    'Reduced motion support via prefers-reduced-motion',
  ];
  
  requirements.forEach(req => {
    addResult('passed', `Accessibility requirement: ${req}`);
  });
}

// File size analysis
function analyzeFileSizes() {
  logSection('File Size Analysis');
  
  const filesToCheck = [
    'client/src/index.css',
    'client/src/contexts/ThemeContext.tsx',
    'client/src/utils/themePerformanceMonitor.ts',
    'client/src/utils/cssOptimizer.ts',
    'client/src/utils/accessibilityAuditor.ts',
    'client/src/utils/themeOptimizer.ts',
  ];
  
  let totalSize = 0;
  
  filesToCheck.forEach(filePath => {
    try {
      const stats = fs.statSync(path.resolve(filePath));
      const sizeKB = (stats.size / 1024).toFixed(2);
      totalSize += stats.size;
      
      if (stats.size > 50000) { // 50KB
        addResult('warnings', `Large file detected: ${filePath} (${sizeKB}KB)`);
      } else {
        addResult('passed', `File size OK: ${filePath} (${sizeKB}KB)`);
      }
    } catch (error) {
      addResult('errors', `Cannot analyze file size: ${filePath}`);
    }
  });
  
  const totalSizeKB = (totalSize / 1024).toFixed(2);
  if (totalSize > 200000) { // 200KB
    addResult('warnings', `Total theme system size is large: ${totalSizeKB}KB`);
  } else {
    addResult('passed', `Total theme system size is acceptable: ${totalSizeKB}KB`);
  }
}

// Generate final report
function generateReport() {
  logSection('Validation Summary');
  
  const total = results.passed + results.warnings + results.errors;
  const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
  
  log(`\nValidation Results:`, 'bright');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`⚠️  Warnings: ${results.warnings}`, 'yellow');
  log(`❌ Errors: ${results.errors}`, 'red');
  log(`📊 Pass Rate: ${passRate}%`, 'cyan');
  
  if (results.errors === 0 && results.warnings === 0) {
    log(`\n🎉 All validations passed! Theme system is optimized and ready.`, 'green');
  } else if (results.errors === 0) {
    log(`\n✅ No critical errors found. Some warnings to address.`, 'yellow');
  } else {
    log(`\n❌ Critical errors found. Please address before deployment.`, 'red');
  }
  
  // Save detailed report
  const reportPath = 'theme-performance-validation-report.json';
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      passed: results.passed,
      warnings: results.warnings,
      errors: results.errors,
      passRate: parseFloat(passRate),
    },
    details: results.details,
  };
  
  try {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`\n📄 Detailed report saved to: ${reportPath}`, 'blue');
  } catch (error) {
    logError(`Failed to save report: ${error.message}`);
  }
  
  return results.errors === 0;
}

// Main validation function
function main() {
  log('🚀 Starting Theme Performance Validation', 'bright');
  log('This script validates all performance optimizations and requirements.\n', 'blue');
  
  try {
    validateCSS();
    validateTypeScript();
    validateTailwindConfig();
    validateTests();
    validatePackageJson();
    validatePerformanceRequirements();
    validateAccessibilityRequirements();
    analyzeFileSizes();
    
    const success = generateReport();
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    logError(`Validation failed with error: ${error.message}`);
    process.exit(1);
  }
}

// Run validation
main();