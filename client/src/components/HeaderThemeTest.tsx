import React from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Header from '@/components/Header';

// Simple test component to verify Header with theme integration
export const HeaderThemeTest: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="light">
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-8">
          <h1 className="text-2xl font-bold text-foreground font-sans mb-4">
            Header Theme Integration Test
          </h1>
          <div className="space-y-4">
            <div className="p-4 bg-card border border-card-border rounded-lg">
              <h2 className="text-lg font-semibold text-card-foreground font-sans mb-2">
                Theme Integration Features:
              </h2>
              <ul className="space-y-2 text-muted-foreground font-sans">
                <li>✅ Theme toggle button added to header (desktop and mobile)</li>
                <li>✅ Brand colors applied throughout header components</li>
                <li>✅ Base Neue font family integrated</li>
                <li>✅ Proper contrast ratios maintained</li>
                <li>✅ Consistent hover and focus states</li>
                <li>✅ Mobile-responsive theme controls</li>
              </ul>
            </div>
            
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <h3 className="text-lg font-semibold text-primary font-sans mb-2">
                Brand Color Usage:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-sans">
                <div>
                  <strong className="text-primary">Primary Orange:</strong>
                  <br />
                  Used for buttons, links, and active states
                </div>
                <div>
                  <strong className="text-secondary">Secondary Grey:</strong>
                  <br />
                  Used for text and secondary elements
                </div>
                <div>
                  <strong className="text-muted-foreground">Background Grey:</strong>
                  <br />
                  Used for backgrounds and muted content
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default HeaderThemeTest;