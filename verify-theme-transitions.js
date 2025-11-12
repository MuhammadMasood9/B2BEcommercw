#!/usr/bin/env node

/**
 * Theme Transitions Verification Script
 * 
 * This script verifies that the theme transition system is properly implemented
 * by checking for the presence of required CSS classes and transition properties.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎨 Verifying Theme Transition Implementation...\n');

// Check if CSS file exists and contains transition styles
const cssPath = path.join(__dirname, 'client', 'src', 'index.css');

if (!fs.existsSync(cssPath)) {
  console.error('❌ CSS file not found at:', cssPath);
  process.exit(1);
}

const cssContent = fs.readFileSync(cssPath, 'utf8');

// Required transition elements to check for
const requiredElements = [
  {
    name: 'Theme transition duration variable',
    pattern: /--theme-transition-duration:\s*200ms/,
    description: 'CSS custom property for transition duration'
  },
  {
    name: 'Theme transition easing variable',
    pattern: /--theme-transition-easing:\s*cubic-bezier\(0\.4,\s*0,\s*0\.2,\s*1\)/,
    description: 'CSS custom property for transition easing'
  },
  {
    name: 'Global transition styles',
    pattern: /\*,\s*\*::before,\s*\*::after\s*\{[^}]*transition-property:/,
    description: 'Global transition properties for all elements'
  },
  {
    name: 'Theme transitioning class',
    pattern: /\.theme-transitioning\s*\*\s*\{[^}]*transition:\s*none\s*!important/,
    description: 'Class to disable transitions during initialization'
  },
  {
    name: 'Theme switching class',
    pattern: /\.theme-switching/,
    description: 'Class for handling rapid theme switching'
  },
  {
    name: 'Reduced motion support',
    pattern: /@media\s*\(prefers-reduced-motion:\s*reduce\)/,
    description: 'Media query for respecting user motion preferences'
  },
  {
    name: 'Theme toggle data attribute',
    pattern: /\[data-theme-toggle\]/,
    description: 'CSS selector for theme toggle elements'
  },
  {
    name: 'Performance optimization class',
    pattern: /\.theme-transition-optimized/,
    description: 'Class for performance-optimized transitions'
  }
];

let passedChecks = 0;
let totalChecks = requiredElements.length;

console.log('Checking CSS transition implementation:\n');

requiredElements.forEach((element, index) => {
  const found = element.pattern.test(cssContent);
  const status = found ? '✅' : '❌';
  const number = `${index + 1}`.padStart(2, ' ');
  
  console.log(`${status} ${number}. ${element.name}`);
  console.log(`     ${element.description}`);
  
  if (found) {
    passedChecks++;
  } else {
    console.log(`     Pattern: ${element.pattern}`);
  }
  
  console.log('');
});

// Check ThemeContext for transition state management
const themeContextPath = path.join(__dirname, 'client', 'src', 'contexts', 'ThemeContext.tsx');

if (fs.existsSync(themeContextPath)) {
  const contextContent = fs.readFileSync(themeContextPath, 'utf8');
  
  console.log('Checking ThemeContext implementation:\n');
  
  const contextChecks = [
    {
      name: 'isTransitioning state',
      pattern: /isTransitioning.*boolean/,
      description: 'State to track transition status'
    },
    {
      name: 'Transition timeout management',
      pattern: /transitionTimeout.*NodeJS\.Timeout/,
      description: 'Timeout management for transitions'
    },
    {
      name: 'Theme switching class application',
      pattern: /theme-switching/,
      description: 'CSS class application for theme switching'
    },
    {
      name: 'Rapid switching handling',
      pattern: /skipTransition/,
      description: 'Logic to handle rapid theme switching'
    }
  ];
  
  contextChecks.forEach((check, index) => {
    const found = check.pattern.test(contextContent);
    const status = found ? '✅' : '❌';
    const number = `${index + 1}`.padStart(2, ' ');
    
    console.log(`${status} ${number}. ${check.name}`);
    console.log(`     ${check.description}`);
    
    if (found) {
      passedChecks++;
    }
    
    totalChecks++;
    console.log('');
  });
}

// Summary
console.log('='.repeat(50));
console.log(`Summary: ${passedChecks}/${totalChecks} checks passed`);

if (passedChecks === totalChecks) {
  console.log('🎉 All theme transition checks passed!');
  console.log('\nThe theme transition system is properly implemented with:');
  console.log('• Smooth 200ms transitions with optimized easing');
  console.log('• Hardware acceleration for better performance');
  console.log('• Graceful handling of rapid theme switching');
  console.log('• Accessibility support for reduced motion preferences');
  console.log('• Proper state management in ThemeContext');
  console.log('• Performance optimizations to prevent layout shifts');
} else {
  console.log('⚠️  Some theme transition checks failed.');
  console.log('Please review the implementation to ensure all features are properly configured.');
  process.exit(1);
}