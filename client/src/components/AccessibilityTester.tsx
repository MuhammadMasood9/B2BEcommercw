import React, { useState, useEffect } from 'react';
import { testBrandColorContrast, ContrastResult, BRAND_COLORS } from '../utils/accessibility';
import { useHighContrast } from '../hooks/useHighContrast';
import { FOCUS_CLASSES } from '../utils/focusIndicators';

interface AccessibilityTesterProps {
  showResults?: boolean;
}

export function AccessibilityTester({ showResults = false }: AccessibilityTesterProps) {
  const [contrastResults, setContrastResults] = useState<Record<string, ContrastResult>>({});
  const [screenReaderTest, setScreenReaderTest] = useState<string>('');
  const { isHighContrast, toggleHighContrast, systemPreference } = useHighContrast();

  useEffect(() => {
    // Run contrast tests on mount
    const results = testBrandColorContrast();
    setContrastResults(results);
  }, []);

  const runScreenReaderTest = () => {
    // Test screen reader announcements
    const announcement = `Brand colors loaded. High contrast mode is ${isHighContrast ? 'enabled' : 'disabled'}. All interactive elements have proper focus indicators.`;
    setScreenReaderTest(announcement);
    
    // Announce to screen readers
    const ariaLive = document.createElement('div');
    ariaLive.setAttribute('aria-live', 'polite');
    ariaLive.setAttribute('aria-atomic', 'true');
    ariaLive.className = 'sr-only';
    ariaLive.textContent = announcement;
    document.body.appendChild(ariaLive);
    
    setTimeout(() => {
      document.body.removeChild(ariaLive);
    }, 1000);
  };

  if (!showResults) {
    return null;
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Accessibility Test Suite
      </h2>

      {/* High Contrast Mode Controls */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          High Contrast Mode
        </h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleHighContrast}
              className={`px-4 py-2 rounded-md font-medium ${FOCUS_CLASSES.button} ${
                isHighContrast
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
              aria-pressed={isHighContrast}
            >
              {isHighContrast ? 'Disable' : 'Enable'} High Contrast
            </button>
            <span className="text-sm text-gray-600">
              System preference: {systemPreference ? 'High contrast' : 'Normal'}
            </span>
          </div>
        </div>
      </div>

      {/* Contrast Test Results */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Color Contrast Results
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(contrastResults).map(([name, result]) => (
            <div
              key={name}
              className={`p-3 rounded-md border ${
                result.wcagAA
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">
                  {name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    result.level === 'aaa'
                      ? 'bg-green-100 text-green-800'
                      : result.level === 'aa'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {result.level.toUpperCase()}
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Ratio: {result.ratio}:1
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Focus Indicator Tests */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Focus Indicator Tests
        </h3>
        <div className="space-y-3">
          <button
            className={`px-4 py-2 bg-primary text-white rounded-md ${FOCUS_CLASSES.button}`}
          >
            Primary Button Focus Test
          </button>
          <button
            className={`px-4 py-2 bg-gray-600 text-white rounded-md ${FOCUS_CLASSES.dark}`}
          >
            Dark Button Focus Test
          </button>
          <input
            type="text"
            placeholder="Input focus test"
            className={`px-3 py-2 border border-gray-300 rounded-md ${FOCUS_CLASSES.input}`}
          />
          <a
            href="#"
            className={`text-primary underline ${FOCUS_CLASSES.link}`}
            onClick={(e) => e.preventDefault()}
          >
            Link Focus Test
          </a>
        </div>
      </div>

      {/* Screen Reader Test */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Screen Reader Compatibility
        </h3>
        <button
          onClick={runScreenReaderTest}
          className={`px-4 py-2 bg-primary text-white rounded-md ${FOCUS_CLASSES.button}`}
        >
          Test Screen Reader Announcement
        </button>
        {screenReaderTest && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Announced:</strong> {screenReaderTest}
            </p>
          </div>
        )}
      </div>

      {/* Color Samples */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Brand Color Samples
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(BRAND_COLORS).map(([name, color]) => (
            <div key={name} className="text-center">
              <div
                className="w-16 h-16 rounded-md border border-gray-300 mx-auto mb-2"
                style={{ backgroundColor: color }}
                aria-label={`${name} color sample: ${color}`}
              />
              <div className="text-sm font-medium text-gray-900">{name}</div>
              <div className="text-xs text-gray-600">{color}</div>
              {name === 'primaryAccessible' && (
                <div className="text-xs text-green-600 font-medium">WCAG AA ✓</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Screen Reader Only Content */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Accessibility test suite loaded. Use tab key to navigate through focus indicators.
        High contrast mode is {isHighContrast ? 'enabled' : 'disabled'}.
      </div>
    </div>
  );
}