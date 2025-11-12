import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { HighContrastToggle } from './HighContrastToggle';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export const HighContrastDemo: React.FC = () => {
  const { isHighContrast, resolvedTheme } = useTheme();

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">
          High Contrast Mode Demo
        </h1>
        <p className="text-muted-foreground">
          Test the accessibility features and high contrast mode implementation
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Theme:</span>
            <ThemeToggle variant="enhanced-dropdown" showHighContrast={true} showLabel={true} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">High Contrast:</span>
            <HighContrastToggle variant="switch" showLabel={true} />
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Current: {resolvedTheme} mode {isHighContrast ? '(High Contrast)' : '(Normal)'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buttons Demo */}
        <Card className="high-contrast-card">
          <CardHeader>
            <CardTitle className="high-contrast-text">Button Variants</CardTitle>
            <CardDescription>Test different button styles in high contrast mode</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button className="w-full high-contrast-button">
                Primary Button
              </Button>
              <Button variant="secondary" className="w-full high-contrast-button">
                Secondary Button
              </Button>
              <Button variant="outline" className="w-full high-contrast-button">
                Outline Button
              </Button>
              <Button variant="ghost" className="w-full high-contrast-button">
                Ghost Button
              </Button>
              <Button variant="destructive" className="w-full high-contrast-button">
                Destructive Button
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Form Elements Demo */}
        <Card className="high-contrast-card">
          <CardHeader>
            <CardTitle className="high-contrast-text">Form Elements</CardTitle>
            <CardDescription>Test form inputs and focus indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="demo-input" className="text-sm font-medium high-contrast-text">
                Text Input
              </label>
              <Input
                id="demo-input"
                placeholder="Enter some text..."
                className="high-contrast-input high-contrast-focus"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="demo-email" className="text-sm font-medium high-contrast-text">
                Email Input
              </label>
              <Input
                id="demo-email"
                type="email"
                placeholder="your@email.com"
                className="high-contrast-input high-contrast-focus"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="demo-textarea" className="text-sm font-medium high-contrast-text">
                Textarea
              </label>
              <textarea
                id="demo-textarea"
                placeholder="Enter a longer message..."
                rows={3}
                className="w-full px-3 py-2 border rounded-md high-contrast-input high-contrast-focus"
              />
            </div>
          </CardContent>
        </Card>

        {/* Links Demo */}
        <Card className="high-contrast-card">
          <CardHeader>
            <CardTitle className="high-contrast-text">Links & Navigation</CardTitle>
            <CardDescription>Test link styles and focus indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="high-contrast-text">
                This is a paragraph with a{' '}
                <a href="#" className="high-contrast-link">
                  regular link
                </a>{' '}
                and another{' '}
                <a href="#" className="high-contrast-link">
                  link for testing
                </a>
                .
              </p>
              
              <nav className="space-y-1">
                <a href="#" className="block px-3 py-2 rounded-md high-contrast-link high-contrast-focus">
                  Navigation Link 1
                </a>
                <a href="#" className="block px-3 py-2 rounded-md high-contrast-link high-contrast-focus">
                  Navigation Link 2
                </a>
                <a href="#" className="block px-3 py-2 rounded-md high-contrast-link high-contrast-focus">
                  Navigation Link 3
                </a>
              </nav>
            </div>
          </CardContent>
        </Card>

        {/* Status Indicators Demo */}
        <Card className="high-contrast-card">
          <CardHeader>
            <CardTitle className="high-contrast-text">Status Indicators</CardTitle>
            <CardDescription>Test status colors and accessibility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="high-contrast-text">Success Status</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="high-contrast-text">Warning Status</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="high-contrast-text">Error Status</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="high-contrast-text">Info Status</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 high-contrast-button">
                Success Action
              </Button>
              <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 high-contrast-button">
                Warning Action
              </Button>
              <Button size="sm" variant="destructive" className="high-contrast-button">
                Error Action
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 high-contrast-button">
                Info Action
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accessibility Information */}
      <Card className="high-contrast-card">
        <CardHeader>
          <CardTitle className="high-contrast-text">Accessibility Information</CardTitle>
          <CardDescription>Current accessibility settings and compliance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold high-contrast-text">Current Settings</h4>
              <ul className="space-y-1 text-sm">
                <li className="high-contrast-text">
                  <strong>Theme:</strong> {resolvedTheme}
                </li>
                <li className="high-contrast-text">
                  <strong>High Contrast:</strong> {isHighContrast ? 'Enabled' : 'Disabled'}
                </li>
                <li className="high-contrast-text">
                  <strong>Focus Indicators:</strong> Enhanced
                </li>
                <li className="high-contrast-text">
                  <strong>Border Width:</strong> {isHighContrast ? '2-3px' : '1px'}
                </li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold high-contrast-text">WCAG Compliance</h4>
              <ul className="space-y-1 text-sm">
                <li className="high-contrast-text">
                  <strong>Contrast Ratio:</strong> {isHighContrast ? 'AAA (7:1+)' : 'AA (4.5:1+)'}
                </li>
                <li className="high-contrast-text">
                  <strong>Focus Indicators:</strong> ✓ Visible
                </li>
                <li className="high-contrast-text">
                  <strong>Keyboard Navigation:</strong> ✓ Supported
                </li>
                <li className="high-contrast-text">
                  <strong>Screen Reader:</strong> ✓ Compatible
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="high-contrast-card">
        <CardHeader>
          <CardTitle className="high-contrast-text">Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm high-contrast-text">
            <div>
              <h4 className="font-semibold mb-2">Keyboard Testing:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Use Tab to navigate between interactive elements</li>
                <li>Use Enter or Space to activate buttons</li>
                <li>Use Escape to close dropdowns</li>
                <li>Check that focus indicators are clearly visible</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Visual Testing:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Toggle high contrast mode and observe changes</li>
                <li>Check that all text meets contrast requirements</li>
                <li>Verify that borders and outlines are prominent</li>
                <li>Test with different zoom levels (up to 200%)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Screen Reader Testing:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>All interactive elements should be announced</li>
                <li>State changes (like high contrast toggle) should be announced</li>
                <li>Form labels should be properly associated</li>
                <li>Button purposes should be clear</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HighContrastDemo;