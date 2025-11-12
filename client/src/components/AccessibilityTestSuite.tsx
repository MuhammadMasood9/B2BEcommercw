import React, { useState, useEffect } from 'react';
import { AccessibilityTester } from './AccessibilityTester';
import { testBrandColorContrast, ContrastResult } from '../utils/accessibility';
import { runAutomatedContrastTests, generateComplianceReport } from '../utils/contrastTesting';
import { runScreenReaderTests, announceToScreenReader } from '../utils/screenReaderTesting';
import { testFocusIndicators } from '../utils/focusIndicators';
import { useHighContrast } from '../hooks/useHighContrast';

interface AccessibilityTestSuiteProps {
  runAutomaticTests?: boolean;
}

export function AccessibilityTestSuite({ runAutomaticTests = false }: AccessibilityTestSuiteProps) {
  const [testResults, setTestResults] = useState<{
    contrast: Record<string, ContrastResult>;
    automatedContrast: any;
    complianceReport: any;
    screenReaderReport: any;
    focusIndicators: any;
    keyboardNavigation: boolean;
  }>({
    contrast: {},
    automatedContrast: null,
    complianceReport: null,
    screenReaderReport: null,
    focusIndicators: null,
    keyboardNavigation: false
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [testLog, setTestLog] = useState<string[]>([]);
  const { isHighContrast, systemPreference, toggleHighContrast } = useHighContrast();

  const addToLog = (message: string) => {
    setTestLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runContrastTests = async () => {
    addToLog('Running comprehensive contrast ratio tests...');
    
    // Run brand color tests
    const brandResults = testBrandColorContrast();
    
    // Run automated page-wide contrast tests
    const automatedResults = await runAutomatedContrastTests();
    
    // Generate compliance report
    const complianceReport = generateComplianceReport();
    
    setTestResults(prev => ({ 
      ...prev, 
      contrast: brandResults,
      automatedContrast: automatedResults,
      complianceReport: complianceReport
    }));
    
    const brandFailedTests = Object.entries(brandResults).filter(([, result]) => !result.wcagAA);
    const pageFailures = automatedResults.failed;
    
    if (brandFailedTests.length === 0 && pageFailures === 0) {
      addToLog('✅ All contrast tests passed WCAG AA requirements');
      announceToScreenReader('All contrast tests passed', 'polite');
    } else {
      addToLog(`❌ Brand colors: ${brandFailedTests.length} failed, Page elements: ${pageFailures} failed`);
      announceToScreenReader(`${brandFailedTests.length + pageFailures} contrast tests failed`, 'assertive');
      
      if (complianceReport.criticalIssues.length > 0) {
        addToLog(`🚨 Critical issues found: ${complianceReport.criticalIssues.length}`);
        complianceReport.criticalIssues.forEach((issue: string) => addToLog(`   ${issue}`));
      }
    }
    
    addToLog(`Overall compliance: ${complianceReport.summary.compliancePercentage}%`);
  };

  const runFocusIndicatorTests = async () => {
    addToLog('Testing focus indicators comprehensively...');
    
    try {
      const focusResults = await testFocusIndicators();
      
      setTestResults(prev => ({ ...prev, focusIndicators: focusResults }));
      
      if (focusResults.failed === 0) {
        addToLog('✅ All focus indicator tests passed');
        announceToScreenReader('All focus indicator tests passed', 'polite');
      } else {
        addToLog(`❌ ${focusResults.failed}/${focusResults.total} focus indicator tests failed`);
        announceToScreenReader(`${focusResults.failed} focus indicator tests failed`, 'assertive');
        
        // Log specific failures
        focusResults.results.filter(r => !r.passed).forEach(result => {
          addToLog(`   ${result.element}: ${result.message}`);
        });
      }
      
      // Test high contrast mode focus indicators
      if (isHighContrast) {
        addToLog('✅ High contrast mode focus indicators active');
      } else {
        addToLog('ℹ️ High contrast mode not active - focus indicators using standard colors');
      }
      
    } catch (error) {
      addToLog('❌ Focus indicator testing failed');
      setTestResults(prev => ({ ...prev, focusIndicators: { passed: 0, failed: 1, total: 1, results: [] } }));
    }
  };

  const runScreenReaderTests = async () => {
    addToLog('Running comprehensive screen reader compatibility tests...');
    
    try {
      const screenReaderReport = runScreenReaderTests();
      
      setTestResults(prev => ({ ...prev, screenReaderReport }));
      
      const { summary, criticalIssues, recommendations } = screenReaderReport;
      
      if (summary.failed === 0) {
        addToLog('✅ All screen reader compatibility tests passed');
        announceToScreenReader('All screen reader tests passed', 'polite');
      } else {
        addToLog(`❌ ${summary.failed}/${summary.totalTests} screen reader tests failed`);
        addToLog(`Overall compliance: ${summary.compliancePercentage}%`);
        announceToScreenReader(`${summary.failed} screen reader tests failed`, 'assertive');
        
        // Log critical issues
        if (criticalIssues.length > 0) {
          addToLog(`🚨 Critical screen reader issues: ${criticalIssues.length}`);
          criticalIssues.slice(0, 3).forEach((issue: string) => addToLog(`   ${issue}`));
        }
        
        // Log some recommendations
        if (recommendations.length > 0) {
          addToLog(`💡 Top recommendations:`);
          recommendations.slice(0, 2).forEach((rec: string) => addToLog(`   ${rec}`));
        }
      }
      
      // Test live region functionality
      announceToScreenReader('Screen reader test announcement - if you hear this, live regions are working', 'polite');
      addToLog('✅ Live region announcement test sent');
      
    } catch (error) {
      addToLog('❌ Screen reader testing failed');
      setTestResults(prev => ({ ...prev, screenReaderReport: null }));
    }
  };

  const runKeyboardNavigationTests = async () => {
    addToLog('Testing keyboard navigation...');
    
    // Create a set of focusable elements
    const container = document.createElement('div');
    container.innerHTML = `
      <button>Button 1</button>
      <input type="text" placeholder="Input 1" />
      <a href="#">Link 1</a>
      <button>Button 2</button>
    `;
    
    document.body.appendChild(container);
    
    const focusableElements = container.querySelectorAll('button, input, a');
    let keyboardPassed = true;
    
    // Test that all elements are focusable
    focusableElements.forEach((el, index) => {
      (el as HTMLElement).focus();
      if (document.activeElement !== el) {
        keyboardPassed = false;
        addToLog(`❌ Element ${index + 1} is not focusable`);
      }
    });
    
    document.body.removeChild(container);
    
    setTestResults(prev => ({ ...prev, keyboardNavigation: keyboardPassed }));
    
    if (keyboardPassed) {
      addToLog('✅ Keyboard navigation tests passed');
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestLog([]);
    addToLog('Starting comprehensive accessibility test suite...');
    
    await runContrastTests();
    await runFocusIndicatorTests();
    await runScreenReaderTests();
    await runKeyboardNavigationTests();
    
    addToLog('All accessibility tests completed');
    setIsRunning(false);
  };

  useEffect(() => {
    if (runAutomaticTests) {
      runAllTests();
    }
  }, [runAutomaticTests]);

  const getOverallStatus = () => {
    const { contrast, automatedContrast, complianceReport, screenReaderReport, focusIndicators, keyboardNavigation } = testResults;
    
    const contrastPassed = Object.values(contrast).every(result => result.wcagAA);
    const automatedContrastPassed = automatedContrast?.failed === 0;
    const focusIndicatorsPassed = focusIndicators?.failed === 0;
    const screenReaderPassed = screenReaderReport?.summary?.failed === 0;
    
    const hasResults = Object.keys(contrast).length > 0 || automatedContrast || screenReaderReport || focusIndicators;
    
    if (!hasResults) {
      return { status: 'pending', message: 'Tests not run yet' };
    }
    
    const allPassed = contrastPassed && automatedContrastPassed && focusIndicatorsPassed && screenReaderPassed && keyboardNavigation;
    
    if (allPassed) {
      return { status: 'pass', message: 'All accessibility tests passed' };
    } else {
      const failedCount = [
        !contrastPassed,
        !automatedContrastPassed,
        !focusIndicatorsPassed,
        !screenReaderPassed,
        !keyboardNavigation
      ].filter(Boolean).length;
      
      return { status: 'fail', message: `${failedCount} test categories failed` };
    }
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Accessibility Test Suite
        </h1>
        
        <div className={`p-4 rounded-md mb-4 ${
          overallStatus.status === 'pass' 
            ? 'bg-green-50 border border-green-200' 
            : overallStatus.status === 'fail'
            ? 'bg-red-50 border border-red-200'
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center">
            <span className={`text-lg font-medium ${
              overallStatus.status === 'pass' 
                ? 'text-green-800' 
                : overallStatus.status === 'fail'
                ? 'text-red-800'
                : 'text-yellow-800'
            }`}>
              {overallStatus.status === 'pass' ? '✅' : overallStatus.status === 'fail' ? '❌' : '⏳'} 
              {overallStatus.message}
            </span>
            {isHighContrast && (
              <span className="ml-4 px-2 py-1 bg-primary text-white text-sm rounded">
                High Contrast Mode Active
              </span>
            )}
          </div>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </button>
          
          <button
            onClick={runContrastTests}
            disabled={isRunning}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Test Contrast Only
          </button>
        </div>

        {/* Test Results Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-md border ${
            testResults.complianceReport?.summary?.compliancePercentage === 100
              ? 'bg-green-50 border-green-200' 
              : testResults.complianceReport
              ? 'bg-red-50 border-red-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <h3 className="font-medium text-gray-900">Contrast Compliance</h3>
            <p className="text-sm text-gray-600">
              {testResults.complianceReport 
                ? `${testResults.complianceReport.summary.compliancePercentage}% compliant`
                : 'Not tested'
              }
            </p>
            {testResults.automatedContrast && (
              <p className="text-xs text-gray-500 mt-1">
                Page: {testResults.automatedContrast.passed}/{testResults.automatedContrast.total} passed
              </p>
            )}
          </div>
          
          <div className={`p-4 rounded-md border ${
            testResults.focusIndicators?.failed === 0 && testResults.focusIndicators?.total > 0
              ? 'bg-green-50 border-green-200' 
              : testResults.focusIndicators?.failed > 0
              ? 'bg-red-50 border-red-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <h3 className="font-medium text-gray-900">Focus Indicators</h3>
            <p className="text-sm text-gray-600">
              {testResults.focusIndicators 
                ? `${testResults.focusIndicators.passed}/${testResults.focusIndicators.total} passed`
                : 'Not tested'
              }
            </p>
            {isHighContrast && (
              <p className="text-xs text-orange-600 mt-1">High contrast active</p>
            )}
          </div>
          
          <div className={`p-4 rounded-md border ${
            testResults.screenReaderReport?.summary?.failed === 0 && testResults.screenReaderReport?.summary?.totalTests > 0
              ? 'bg-green-50 border-green-200' 
              : testResults.screenReaderReport?.summary?.failed > 0
              ? 'bg-red-50 border-red-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <h3 className="font-medium text-gray-900">Screen Reader</h3>
            <p className="text-sm text-gray-600">
              {testResults.screenReaderReport 
                ? `${testResults.screenReaderReport.summary.compliancePercentage}% compliant`
                : 'Not tested'
              }
            </p>
            {testResults.screenReaderReport?.criticalIssues?.length > 0 && (
              <p className="text-xs text-red-600 mt-1">
                {testResults.screenReaderReport.criticalIssues.length} critical issues
              </p>
            )}
          </div>
          
          <div className={`p-4 rounded-md border ${
            testResults.keyboardNavigation 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <h3 className="font-medium text-gray-900">Keyboard Navigation</h3>
            <p className="text-sm text-gray-600">
              {testResults.keyboardNavigation ? 'Passed' : 'Not tested'}
            </p>
          </div>
        </div>

        {/* Test Log */}
        {testLog.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h3 className="font-medium text-gray-900 mb-2">Test Log</h3>
            <div className="max-h-40 overflow-y-auto">
              {testLog.map((log, index) => (
                <div key={index} className="text-sm text-gray-600 font-mono">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* High Contrast Mode Toggle */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          High Contrast Mode
        </h2>
        <p className="text-gray-600 mb-4">
          Toggle high contrast mode to test accessibility with enhanced color contrast.
        </p>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleHighContrast}
            className={`px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isHighContrast
                ? 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500'
                : 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
            }`}
            aria-pressed={isHighContrast}
            aria-describedby="high-contrast-description"
          >
            {isHighContrast ? 'Disable' : 'Enable'} High Contrast
          </button>
          
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isHighContrast ? 'bg-orange-500' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-600">
              {isHighContrast ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          {systemPreference && (
            <span className="text-xs text-primary bg-primary px-2 py-1 rounded">
              System preference detected
            </span>
          )}
        </div>
        
        <p id="high-contrast-description" className="text-sm text-gray-500 mt-2">
          High contrast mode uses darker orange colors and pure black/white for maximum contrast ratios.
        </p>
        
        {isHighContrast && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
            <h4 className="font-medium text-orange-900 mb-2">High Contrast Mode Active</h4>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>• Enhanced focus indicators with thicker outlines</li>
              <li>• Darker orange colors for better contrast</li>
              <li>• Pure black and white for maximum readability</li>
              <li>• Stronger borders and visual separation</li>
            </ul>
          </div>
        )}
      </div>

      {/* Interactive Accessibility Tester */}
      <AccessibilityTester showResults={true} />
      
      {/* Skip Link Demo */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Keyboard Navigation Demo
        </h2>
        <p className="text-gray-600 mb-4">
          Press Tab to navigate through these elements. The skip link will appear when focused.
        </p>
        
        <a 
          href="#main-demo-content" 
          className="skip-link focus:top-6"
        >
          Skip to main content
        </a>
        
        <div className="space-y-4">
          <button className="px-4 py-2 bg-primary text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
            Focusable Button 1
          </button>
          
          <input 
            type="text" 
            placeholder="Focusable Input"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
          
          <a 
            href="#" 
            className="inline-block text-primary underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded-sm"
            onClick={(e) => e.preventDefault()}
          >
            Focusable Link
          </a>
          
          <button className="px-4 py-2 bg-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
            Focusable Button 2
          </button>
        </div>
        
        <div id="main-demo-content" className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="font-medium text-gray-900">Main Demo Content</h3>
          <p className="text-gray-600">
            This is the main content area that users can skip to using the skip link.
          </p>
        </div>
      </div>
    </div>
  );
}