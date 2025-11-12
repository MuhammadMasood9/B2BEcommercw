import React, { useState, useRef, useEffect } from 'react';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import { HighContrastToggle } from './HighContrastToggle';
import { useThemeAnimation } from '../hooks/useThemeAnimation';

// Icons for theme toggle
const SunIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const MoonIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

const SystemIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const ChevronDownIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const HighContrastIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3}
      d="M12 8v8"
    />
  </svg>
);

// Theme option configuration
const themeOptions = [
  { value: 'light' as Theme, label: 'Light', icon: SunIcon },
  { value: 'dark' as Theme, label: 'Dark', icon: MoonIcon },
  { value: 'system' as Theme, label: 'System', icon: SystemIcon },
];

// Component props interface
export interface ThemeToggleProps {
  variant?: 'button' | 'switch' | 'dropdown' | 'enhanced-dropdown';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showHighContrast?: boolean;
  className?: string;
}

// Button variant component
const ButtonVariant: React.FC<Omit<ThemeToggleProps, 'variant'>> = ({
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const { theme, resolvedTheme, toggleTheme, isTransitioning } = useTheme();
  const { triggerRippleEffect, isAnimating } = useThemeAnimation({
    enableRippleEffect: true,
    enableLoadingState: true,
  });

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const getCurrentIcon = () => {
    if (theme === 'system') {
      return SystemIcon;
    }
    return resolvedTheme === 'light' ? SunIcon : MoonIcon;
  };

  const CurrentIcon = getCurrentIcon();

  const getAriaLabel = () => {
    if (theme === 'system') {
      return `Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode (currently system: ${resolvedTheme})`;
    }
    return `Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`;
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Trigger ripple effect at click position
    triggerRippleEffect(button, x, y);
    
    // Toggle theme
    toggleTheme();
  };

  return (
    <button
      onClick={handleClick}
      disabled={isTransitioning || isAnimating}
      data-theme-toggle
      className={`
        relative inline-flex items-center justify-center
        rounded-lg border border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-800
        text-gray-700 dark:text-gray-200
        hover:bg-gray-50 dark:hover:bg-gray-700
        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        theme-transition-optimized theme-transition-button
        ${sizeClasses[size]}
        ${className}
      `}
      aria-label={getAriaLabel()}
      title={getAriaLabel()}
    >
      <div className="relative">
        <CurrentIcon 
          className={`
            ${iconSizeClasses[size]}
            transition-transform duration-200 ease-in-out
            hover:scale-110
            ${isAnimating ? 'animate-pulse' : ''}
          `}
        />
      </div>
      {showLabel && (
        <span className="ml-2 text-sm font-medium theme-transition-text">
          {theme === 'system' ? `System (${resolvedTheme})` : theme}
        </span>
      )}
      {isAnimating && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-pulse" />
      )}
    </button>
  );
};

// Switch variant component
const SwitchVariant: React.FC<Omit<ThemeToggleProps, 'variant'>> = ({
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const { theme, resolvedTheme, setTheme, isTransitioning } = useTheme();

  const sizeClasses = {
    sm: 'w-10 h-5',
    md: 'w-12 h-6',
    lg: 'w-14 h-7',
  };

  const thumbSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconSizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  };

  // For switch, we only toggle between light and dark (not system)
  const isDark = theme === 'dark' || (theme === 'system' && resolvedTheme === 'dark');

  const handleToggle = () => {
    if (theme === 'system') {
      // If system, switch to the opposite of current resolved theme
      setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
    } else {
      // Toggle between light and dark
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  };

  const getAriaLabel = () => {
    return `Switch to ${isDark ? 'light' : 'dark'} mode`;
  };

  return (
    <div className={`flex items-center ${className}`}>
      {showLabel && (
        <span className="mr-3 text-sm font-medium text-gray-700 dark:text-gray-200">
          Theme
        </span>
      )}
      <button
        onClick={handleToggle}
        disabled={isTransitioning}
        data-theme-toggle
        className={`
          relative inline-flex items-center
          ${sizeClasses[size]}
          rounded-full border-2 border-transparent
          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          theme-transition-optimized
          ${isDark 
            ? 'bg-orange-500 hover:bg-orange-600' 
            : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500'
          }
        `}
        role="switch"
        aria-checked={isDark}
        aria-label={getAriaLabel()}
        title={getAriaLabel()}
      >
        <span
          className={`
            ${thumbSizeClasses[size]}
            pointer-events-none inline-block rounded-full
            bg-white shadow-lg ring-0
            transition-transform duration-200 ease-in-out
            flex items-center justify-center
            ${isDark ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'}
          `}
        >
          {isDark ? (
            <MoonIcon className={`${iconSizeClasses[size]} text-orange-500`} />
          ) : (
            <SunIcon className={`${iconSizeClasses[size]} text-gray-400`} />
          )}
        </span>
      </button>
    </div>
  );
};

// Dropdown variant component
const DropdownVariant: React.FC<Omit<ThemeToggleProps, 'variant'>> = ({
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const { theme, resolvedTheme, setTheme, isTransitioning } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const getCurrentOption = () => {
    return themeOptions.find(option => option.value === theme) || themeOptions[0];
  };

  const currentOption = getCurrentOption();
  const CurrentIcon = currentOption.icon;

  const handleOptionSelect = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
    setIsOpen(false);
  };

  const getDisplayLabel = () => {
    if (theme === 'system') {
      return showLabel ? `System (${resolvedTheme})` : 'System';
    }
    return showLabel ? currentOption.label : '';
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isTransitioning}
        data-theme-toggle
        className={`
          inline-flex items-center justify-center w-full
          rounded-lg border border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-800
          text-gray-700 dark:text-gray-200
          hover:bg-gray-50 dark:hover:bg-gray-700
          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          theme-transition-optimized
          ${sizeClasses[size]}
        `}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Theme selector. Current theme: ${theme === 'system' ? `System (${resolvedTheme})` : theme}`}
      >
        <CurrentIcon className={iconSizeClasses[size]} />
        {showLabel && (
          <span className="ml-2 font-medium">
            {getDisplayLabel()}
          </span>
        )}
        <ChevronDownIcon 
          className={`
            ${iconSizeClasses[size]} ml-1
            transition-transform duration-200 ease-in-out
            ${isOpen ? 'rotate-180' : 'rotate-0'}
          `}
        />
      </button>

      {/* Dropdown menu */}
      <div
        className={`
          absolute right-0 z-50 mt-2 w-48 origin-top-right
          rounded-lg bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700
          shadow-lg ring-1 ring-black ring-opacity-5
          transition-all duration-200 ease-in-out
          ${isOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
          }
        `}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="theme-menu"
      >
        <div className="py-1" role="none">
          {themeOptions.map((option) => {
            const OptionIcon = option.icon;
            const isSelected = theme === option.value;
            const isCurrentResolved = option.value === resolvedTheme;

            return (
              <button
                key={option.value}
                onClick={() => handleOptionSelect(option.value)}
                className={`
                  group flex items-center w-full px-4 py-2 text-sm
                  transition-colors duration-150 ease-in-out
                  ${isSelected
                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
                role="menuitem"
                aria-current={isSelected ? 'true' : 'false'}
              >
                <OptionIcon 
                  className={`
                    w-4 h-4 mr-3
                    ${isSelected 
                      ? 'text-orange-500' 
                      : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                    }
                  `}
                />
                <span className="flex-1 text-left">
                  {option.label}
                  {option.value === 'system' && (
                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                      ({resolvedTheme})
                    </span>
                  )}
                </span>
                {isSelected && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full ml-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Enhanced dropdown variant with high contrast support
const EnhancedDropdownVariant: React.FC<Omit<ThemeToggleProps, 'variant'>> = ({
  size = 'md',
  showLabel = false,
  showHighContrast = true,
  className = '',
}) => {
  const { theme, resolvedTheme, setTheme, isHighContrast, setHighContrast, isTransitioning } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const getCurrentOption = () => {
    return themeOptions.find(option => option.value === theme) || themeOptions[0];
  };

  const currentOption = getCurrentOption();
  const CurrentIcon = currentOption.icon;

  const handleOptionSelect = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
    setIsOpen(false);
  };

  const handleHighContrastToggle = () => {
    setHighContrast(!isHighContrast);
  };

  const getDisplayLabel = () => {
    if (theme === 'system') {
      return showLabel ? `System (${resolvedTheme})` : 'System';
    }
    return showLabel ? currentOption.label : '';
  };

  const buttonClasses = isHighContrast 
    ? 'border-2 border-black bg-white text-black hover:bg-gray-100'
    : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700';

  const dropdownClasses = isHighContrast
    ? 'bg-white border-2 border-black shadow-lg'
    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg ring-1 ring-black ring-opacity-5';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isTransitioning}
        data-theme-toggle
        className={`
          inline-flex items-center justify-center w-full
          rounded-lg
          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          theme-transition-optimized
          ${buttonClasses}
          ${sizeClasses[size]}
        `}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Theme and accessibility selector. Current theme: ${theme === 'system' ? `System (${resolvedTheme})` : theme}${isHighContrast ? ', High contrast enabled' : ''}`}
      >
        <CurrentIcon className={iconSizeClasses[size]} />
        {showLabel && (
          <span className={`ml-2 font-medium ${isHighContrast ? 'font-bold' : ''}`}>
            {getDisplayLabel()}
          </span>
        )}
        <ChevronDownIcon 
          className={`
            ${iconSizeClasses[size]} ml-1
            transition-transform duration-200 ease-in-out
            ${isOpen ? 'rotate-180' : 'rotate-0'}
          `}
        />
        {isHighContrast && (
          <div className="ml-2 w-2 h-2 bg-black rounded-full" aria-hidden="true" />
        )}
      </button>

      {/* Enhanced dropdown menu */}
      <div
        className={`
          absolute right-0 z-50 mt-2 w-56 origin-top-right
          rounded-lg
          transition-all duration-200 ease-in-out
          ${dropdownClasses}
          ${isOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
          }
        `}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="theme-accessibility-menu"
      >
        <div className="py-1" role="none">
          {/* Theme options */}
          <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${isHighContrast ? 'text-black border-b-2 border-black' : 'text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600'}`}>
            Theme
          </div>
          {themeOptions.map((option) => {
            const OptionIcon = option.icon;
            const isSelected = theme === option.value;

            return (
              <button
                key={option.value}
                onClick={() => handleOptionSelect(option.value)}
                className={`
                  group flex items-center w-full px-4 py-2 text-sm
                  transition-colors duration-150 ease-in-out
                  ${isHighContrast
                    ? isSelected
                      ? 'bg-black text-white font-bold'
                      : 'text-black hover:bg-gray-200 font-medium'
                    : isSelected
                      ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
                role="menuitem"
                aria-current={isSelected ? 'true' : 'false'}
              >
                <OptionIcon 
                  className={`
                    w-4 h-4 mr-3
                    ${isHighContrast
                      ? isSelected ? 'text-white' : 'text-black'
                      : isSelected 
                        ? 'text-orange-500' 
                        : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                    }
                  `}
                />
                <span className="flex-1 text-left">
                  {option.label}
                  {option.value === 'system' && (
                    <span className={`ml-1 text-xs ${isHighContrast ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                      ({resolvedTheme})
                    </span>
                  )}
                </span>
                {isSelected && (
                  <div className={`w-2 h-2 rounded-full ml-2 ${isHighContrast ? 'bg-white' : 'bg-orange-500'}`} />
                )}
              </button>
            );
          })}

          {/* High contrast toggle section */}
          {showHighContrast && (
            <>
              <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${isHighContrast ? 'text-black border-t-2 border-b-2 border-black' : 'text-gray-500 dark:text-gray-400 border-t border-b border-gray-200 dark:border-gray-600'} mt-1`}>
                Accessibility
              </div>
              <button
                onClick={handleHighContrastToggle}
                className={`
                  group flex items-center w-full px-4 py-2 text-sm
                  transition-colors duration-150 ease-in-out
                  ${isHighContrast
                    ? 'bg-black text-white font-bold'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium'
                  }
                `}
                role="menuitem"
                aria-pressed={isHighContrast}
              >
                <HighContrastIcon 
                  className={`
                    w-4 h-4 mr-3
                    ${isHighContrast ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'}
                  `}
                />
                <span className="flex-1 text-left">
                  High Contrast
                </span>
                <div className={`
                  w-8 h-4 rounded-full ml-2 relative transition-colors duration-200
                  ${isHighContrast ? 'bg-white' : 'bg-gray-300 dark:bg-gray-600'}
                `}>
                  <div className={`
                    w-3 h-3 rounded-full absolute top-0.5 transition-transform duration-200
                    ${isHighContrast 
                      ? 'translate-x-4 bg-black' 
                      : 'translate-x-0.5 bg-white'
                    }
                  `} />
                </div>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Main ThemeToggle component
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'button',
  size = 'md',
  showLabel = false,
  showHighContrast = false,
  className = '',
}) => {
  const commonProps = { size, showLabel, showHighContrast, className };

  switch (variant) {
    case 'switch':
      return <SwitchVariant {...commonProps} />;
    case 'dropdown':
      return <DropdownVariant {...commonProps} />;
    case 'enhanced-dropdown':
      return <EnhancedDropdownVariant {...commonProps} />;
    case 'button':
    default:
      return <ButtonVariant {...commonProps} />;
  }
};

export default ThemeToggle;