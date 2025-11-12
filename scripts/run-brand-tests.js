#!/usr/bin/env node

/**
 * Script to run all brand design system tests
 * This script runs the comprehensive testing suite for the brand design system
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎨 Running Brand Design System Test Suite...\n');

const testFiles = [
  'tests/brand-design-system/index.test.ts',
  'tests/brand-design-system/visual-regression.test.ts',
  'tests/brand-design-system/blue-color-detection.test.ts',
  'tests/brand-design-system/cross-browser-compatibility.test.ts',
  'tests/brand-design-system/font-performance.test.ts'
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

for (const testFile of testFiles) {
  console.log(`\n📋 Running ${testFile}...`);
  
  try {
    const result = execSync(`npm test ${testFile} --run`, { 
      encoding: 'utf-8',
      cwd: path.join(__dirname, '..')
    });
    
    console.log('✅ PASSED');
    
    // Parse test results (basic parsing)
    const lines = result.split('\n');
    const testLine = lines.find(line => line.includes('Tests'));
    if (testLine) {
      const matches = testLine.match(/(\d+) passed/);
      if (matches) {
        const passed = parseInt(matches[1]);
        passedTests += passed;
        totalTests += passed;
      }
    }
    
  } catch (error) {
    console.log('❌ FAILED');
    console.log(error.stdout || error.message);
    
    // Parse failed test results
    const output = error.stdout || '';
    const lines = output.split('\n');
    const testLine = lines.find(line => line.includes('Tests'));
    if (testLine) {
      const passedMatches = testLine.match(/(\d+) passed/);
      const failedMatches = testLine.match(/(\d+) failed/);
      
      if (passedMatches) {
        const passed = parseInt(passedMatches[1]);
        passedTests += passed;
        totalTests += passed;
      }
      
      if (failedMatches) {
        const failed = parseInt(failedMatches[1]);
        failedTests += failed;
        totalTests += failed;
      }
    }
  }
}

console.log('\n' + '='.repeat(60));
console.log('🎨 Brand Design System Test Suite Results');
console.log('='.repeat(60));
console.log(`📊 Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`📈 Success Rate: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`);

if (failedTests === 0) {
  console.log('\n🎉 All brand design system tests passed!');
  console.log('✨ The brand design system implementation is ready.');
} else {
  console.log('\n⚠️  Some tests failed. Please review the output above.');
  console.log('🔧 Fix the failing tests before proceeding.');
}

console.log('\n📚 Test Coverage Areas:');
console.log('  • Visual regression tests for key components');
console.log('  • Blue color detection and removal validation');
console.log('  • Cross-browser compatibility testing');
console.log('  • Font loading and performance optimization');
console.log('  • Accessibility and contrast validation');

process.exit(failedTests > 0 ? 1 : 0);