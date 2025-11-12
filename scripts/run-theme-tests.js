#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Test configuration
const TEST_CONFIG = {
  unit: {
    pattern: 'tests/unit/theme-*.test.ts',
    description: 'Unit tests for ThemeProvider and theme utilities'
  },
  visual: {
    pattern: 'tests/visual/theme-*.test.ts',
    description: 'Visual regression tests for theme consistency'
  },
  accessibility: {
    pattern: 'tests/accessibility/theme-*.test.ts',
    description: 'Accessibility tests for contrast ratios and WCAG compliance'
  },
  e2e: {
    pattern: 'tests/e2e/theme-*.test.ts',
    description: 'End-to-end tests for theme switching workflows'
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const testType = args[0] || 'all';
const isWatch = args.includes('--watch');
const isCoverage = args.includes('--coverage');
const isVerbose = args.includes('--verbose');

console.log('🎨 Enhanced Theme System Test Suite');
console.log('=====================================\n');

// Function to run tests
function runTests(pattern, description) {
  return new Promise((resolve, reject) => {
    console.log(`📋 Running: ${description}`);
    console.log(`🔍 Pattern: ${pattern}\n`);

    const vitestArgs = [
      isWatch ? 'vitest' : 'vitest --run',
      pattern
    ];

    if (isCoverage) {
      vitestArgs.push('--coverage');
    }

    if (isVerbose) {
      vitestArgs.push('--reporter=verbose');
    }

    const command = vitestArgs.join(' ');
    
    const child = spawn('npm', ['run', 'test', '--', ...vitestArgs.slice(1)], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} - PASSED\n`);
        resolve();
      } else {
        console.log(`❌ ${description} - FAILED\n`);
        reject(new Error(`Tests failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.error(`❌ Error running ${description}:`, error);
      reject(error);
    });
  });
}

// Function to run all tests sequentially
async function runAllTests() {
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  for (const [type, config] of Object.entries(TEST_CONFIG)) {
    results.total++;
    try {
      await runTests(config.pattern, config.description);
      results.passed++;
    } catch (error) {
      results.failed++;
      if (!isWatch) {
        console.error(`Failed to run ${type} tests:`, error.message);
      }
    }
  }

  return results;
}

// Function to run specific test type
async function runSpecificTests(type) {
  if (!TEST_CONFIG[type]) {
    console.error(`❌ Unknown test type: ${type}`);
    console.log('Available test types:', Object.keys(TEST_CONFIG).join(', '));
    process.exit(1);
  }

  const config = TEST_CONFIG[type];
  try {
    await runTests(config.pattern, config.description);
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Tests failed:', error.message);
    process.exit(1);
  }
}

// Main execution
async function main() {
  try {
    // Check if server is running for E2E tests
    if (testType === 'e2e' || testType === 'all') {
      console.log('🚀 Note: E2E tests require the development server to be running');
      console.log('   Start it with: npm run dev\n');
    }

    // Check if Playwright is installed for visual/E2E tests
    if (testType === 'visual' || testType === 'e2e' || testType === 'all') {
      console.log('🎭 Note: Visual and E2E tests require Playwright');
      console.log('   Install it with: npx playwright install\n');
    }

    if (testType === 'all') {
      console.log('🔄 Running all theme tests...\n');
      const results = await runAllTests();
      
      console.log('📊 Test Results Summary');
      console.log('=======================');
      console.log(`✅ Passed: ${results.passed}/${results.total}`);
      console.log(`❌ Failed: ${results.failed}/${results.total}`);
      
      if (results.failed > 0) {
        console.log('\n❌ Some tests failed. Check the output above for details.');
        process.exit(1);
      } else {
        console.log('\n🎉 All theme tests passed successfully!');
      }
    } else {
      await runSpecificTests(testType);
    }
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Help text
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node scripts/run-theme-tests.js [test-type] [options]');
  console.log('');
  console.log('Test types:');
  Object.entries(TEST_CONFIG).forEach(([type, config]) => {
    console.log(`  ${type.padEnd(12)} - ${config.description}`);
  });
  console.log('  all          - Run all theme tests');
  console.log('');
  console.log('Options:');
  console.log('  --watch      - Run tests in watch mode');
  console.log('  --coverage   - Generate coverage report');
  console.log('  --verbose    - Verbose output');
  console.log('  --help, -h   - Show this help');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/run-theme-tests.js unit');
  console.log('  node scripts/run-theme-tests.js all --coverage');
  console.log('  node scripts/run-theme-tests.js e2e --watch');
  process.exit(0);
}

// Run main function
main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});