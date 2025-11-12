import React from 'react';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggleDemo: React.FC = () => {
  const { theme, resolvedTheme, isTransitioning } = useTheme();

  return (
    <div className="p-8 space-y-8 bg-white dark:bg-gray-900 min-h-screen theme-transition-optimized">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Theme Toggle Component Demo
        </h1>
        
        {/* Theme Status Display */}
        <section className="mb-8">
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
              Current Theme Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-orange-700 dark:text-orange-300">Theme Setting:</span>
                <span className="ml-2 text-orange-600 dark:text-orange-400 capitalize">{theme}</span>
              </div>
              <div>
                <span className="font-medium text-orange-700 dark:text-orange-300">Resolved Theme:</span>
                <span className="ml-2 text-orange-600 dark:text-orange-400 capitalize">{resolvedTheme}</span>
              </div>
              <div>
                <span className="font-medium text-orange-700 dark:text-orange-300">Transitioning:</span>
                <span className={`ml-2 ${isTransitioning ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                  {isTransitioning ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </section>
        
        {/* Button Variants */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            Button Variant
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Small</h3>
              <div className="flex flex-col space-y-2">
                <ThemeToggle variant="button" size="sm" />
                <ThemeToggle variant="button" size="sm" showLabel={true} />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Medium (Default)</h3>
              <div className="flex flex-col space-y-2">
                <ThemeToggle variant="button" size="md" />
                <ThemeToggle variant="button" size="md" showLabel={true} />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Large</h3>
              <div className="flex flex-col space-y-2">
                <ThemeToggle variant="button" size="lg" />
                <ThemeToggle variant="button" size="lg" showLabel={true} />
              </div>
            </div>
          </div>
        </section>

        {/* Switch Variants */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            Switch Variant
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Small</h3>
              <div className="flex flex-col space-y-2">
                <ThemeToggle variant="switch" size="sm" />
                <ThemeToggle variant="switch" size="sm" showLabel={true} />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Medium (Default)</h3>
              <div className="flex flex-col space-y-2">
                <ThemeToggle variant="switch" size="md" />
                <ThemeToggle variant="switch" size="md" showLabel={true} />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Large</h3>
              <div className="flex flex-col space-y-2">
                <ThemeToggle variant="switch" size="lg" />
                <ThemeToggle variant="switch" size="lg" showLabel={true} />
              </div>
            </div>
          </div>
        </section>

        {/* Dropdown Variants */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            Dropdown Variant
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Small</h3>
              <div className="flex flex-col space-y-2">
                <ThemeToggle variant="dropdown" size="sm" />
                <ThemeToggle variant="dropdown" size="sm" showLabel={true} />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Medium (Default)</h3>
              <div className="flex flex-col space-y-2">
                <ThemeToggle variant="dropdown" size="md" />
                <ThemeToggle variant="dropdown" size="md" showLabel={true} />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Large</h3>
              <div className="flex flex-col space-y-2">
                <ThemeToggle variant="dropdown" size="lg" />
                <ThemeToggle variant="dropdown" size="lg" showLabel={true} />
              </div>
            </div>
          </div>
        </section>

        {/* Custom Styling Example */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            Custom Styling
          </h2>
          
          <div className="flex flex-wrap gap-4">
            <ThemeToggle 
              variant="button" 
              className="bg-orange-100 dark:bg-orange-900 border-orange-300 dark:border-orange-700" 
            />
            <ThemeToggle 
              variant="switch" 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 p-2 rounded-lg" 
            />
            <ThemeToggle 
              variant="dropdown" 
              className="shadow-lg border-2 border-orange-200 dark:border-orange-800" 
            />
          </div>
        </section>

        {/* Transition Demo */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            Smooth Theme Transitions
          </h2>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              The theme system includes smooth transitions optimized for performance:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800 dark:text-gray-200">Transition Features:</h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• 200ms smooth color transitions</li>
                  <li>• Hardware-accelerated animations</li>
                  <li>• Prevents layout shifts during theme changes</li>
                  <li>• Handles rapid theme switching gracefully</li>
                  <li>• Respects user's reduced motion preferences</li>
                  <li>• Optimized for performance</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800 dark:text-gray-200">Test Transitions:</h3>
                <div className="flex flex-wrap gap-2">
                  <ThemeToggle variant="button" size="sm" />
                  <ThemeToggle variant="switch" size="sm" />
                  <ThemeToggle variant="dropdown" size="sm" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Try switching themes rapidly to see smooth handling
                </p>
              </div>
            </div>
            
            {/* Visual transition demo elements */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                <div className="w-8 h-8 bg-orange-500 rounded-full mx-auto mb-2"></div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Primary Color</p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                <div className="w-8 h-8 bg-gray-900 dark:bg-gray-100 rounded-full mx-auto mb-2"></div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Text Color</p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto mb-2 border border-gray-300 dark:border-gray-500"></div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Background</p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-2"></div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Border Color</p>
              </div>
            </div>
          </div>
        </section>

        {/* Accessibility Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            Accessibility Features
          </h2>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>• All variants include proper ARIA labels and attributes</li>
              <li>• Keyboard navigation support (Tab, Enter, Escape)</li>
              <li>• Focus indicators with proper contrast ratios</li>
              <li>• Screen reader announcements for theme changes</li>
              <li>• High contrast mode support</li>
              <li>• Smooth transitions that respect user preferences</li>
              <li>• Buttons disabled during transitions to prevent conflicts</li>
            </ul>
          </div>
        </section>

        {/* Usage Instructions */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            Usage Instructions
          </h2>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Try interacting with the theme toggles above to see the smooth transitions and different variants in action:
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>• <strong>Button variant:</strong> Simple click to toggle between light/dark</li>
              <li>• <strong>Switch variant:</strong> Visual toggle switch with smooth animation</li>
              <li>• <strong>Dropdown variant:</strong> Full theme selector with light/dark/system options</li>
              <li>• Use keyboard navigation to test accessibility features</li>
              <li>• Theme preference is automatically saved to localStorage</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ThemeToggleDemo;