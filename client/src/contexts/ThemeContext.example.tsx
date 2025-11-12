// Example usage of ThemeProvider - this file is for testing purposes only
import React from 'react';
import { ThemeProvider, useTheme } from './ThemeContext';

// Example component that uses the theme
const ExampleComponent: React.FC = () => {
  const { theme, resolvedTheme, setTheme, toggleTheme, isHighContrast, setHighContrast } = useTheme();

  return (
    <div className={`theme-${resolvedTheme} ${isHighContrast ? 'high-contrast' : ''}`}>
      <h1>Current Theme: {theme}</h1>
      <p>Resolved Theme: {resolvedTheme}</p>
      <p>High Contrast: {isHighContrast ? 'Enabled' : 'Disabled'}</p>
      
      <div>
        <button onClick={() => setTheme('light')}>Light Mode</button>
        <button onClick={() => setTheme('dark')}>Dark Mode</button>
        <button onClick={() => setTheme('system')}>System Mode</button>
        <button onClick={toggleTheme}>Toggle Theme</button>
        <button onClick={() => setHighContrast(!isHighContrast)}>
          Toggle High Contrast
        </button>
      </div>
    </div>
  );
};

// Example app with ThemeProvider
const ExampleApp: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="example-theme">
      <ExampleComponent />
    </ThemeProvider>
  );
};

export default ExampleApp;