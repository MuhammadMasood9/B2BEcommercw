import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

// High contrast icon
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

// Accessibility icon
const AccessibilityIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="12" cy="4" r="2" strokeWidth={2} />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6v6m0 0l-3 6m3-6l3 6M9 12h6"
    />
  </svg>
);

export interface HighContrastToggleProps {
  variant?: 'button' | 'switch';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

// Button variant component
const ButtonVariant: React.FC<Omit<HighContrastToggleProps, 'variant'>> = ({
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const { isHighContrast, setHighContrast, isTransitioning } = useTheme();

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

  const handleToggle = () => {
    setHighContrast(!isHighContrast);
  };

  const getAriaLabel = () => {
    return `${isHighContrast ? 'Disable' : 'Enable'} high contrast mode for better accessibility`;
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isTransitioning}
      className={`
        relative inline-flex items-center justify-center
        rounded-lg border-2
        ${isHighContrast 
          ? 'border-black bg-white text-black hover:bg-gray-100' 
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
        }
        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        theme-transition-optimized
        ${sizeClasses[size]}
        ${className}
      `}
      aria-label={getAriaLabel()}
      title={getAriaLabel()}
      aria-pressed={isHighContrast}
      role="switch"
    >
      <div className="relative">
        {isHighContrast ? (
          <HighContrastIcon 
            className={`
              ${iconSizeClasses[size]}
              transition-transform duration-200 ease-in-out
              hover:scale-110
            `}
          />
        ) : (
          <AccessibilityIcon 
            className={`
              ${iconSizeClasses[size]}
              transition-transform duration-200 ease-in-out
              hover:scale-110
            `}
          />
        )}
      </div>
      {showLabel && (
        <span className={`ml-2 text-sm font-medium ${isHighContrast ? 'font-bold' : ''}`}>
          {isHighContrast ? 'High Contrast On' : 'High Contrast'}
        </span>
      )}
    </button>
  );
};

// Switch variant component
const SwitchVariant: React.FC<Omit<HighContrastToggleProps, 'variant'>> = ({
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const { isHighContrast, setHighContrast, isTransitioning } = useTheme();

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

  const handleToggle = () => {
    setHighContrast(!isHighContrast);
  };

  const getAriaLabel = () => {
    return `${isHighContrast ? 'Disable' : 'Enable'} high contrast mode for better accessibility`;
  };

  return (
    <div className={`flex items-center ${className}`}>
      {showLabel && (
        <span className={`mr-3 text-sm font-medium ${isHighContrast ? 'text-black font-bold' : 'text-gray-700 dark:text-gray-200'}`}>
          High Contrast
        </span>
      )}
      <button
        onClick={handleToggle}
        disabled={isTransitioning}
        className={`
          relative inline-flex items-center
          ${sizeClasses[size]}
          rounded-full border-2
          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          theme-transition-optimized
          ${isHighContrast 
            ? 'bg-black border-black hover:bg-gray-800' 
            : 'bg-gray-200 border-gray-300 hover:bg-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:hover:bg-gray-500'
          }
        `}
        role="switch"
        aria-checked={isHighContrast}
        aria-label={getAriaLabel()}
        title={getAriaLabel()}
      >
        <span
          className={`
            ${thumbSizeClasses[size]}
            pointer-events-none inline-block rounded-full
            shadow-lg ring-0
            transition-transform duration-200 ease-in-out
            flex items-center justify-center
            ${isHighContrast 
              ? 'translate-x-5 sm:translate-x-6 bg-white border-2 border-black' 
              : 'translate-x-0 bg-white border-2 border-gray-300'
            }
          `}
        >
          {isHighContrast ? (
            <HighContrastIcon className={`${iconSizeClasses[size]} text-black`} />
          ) : (
            <AccessibilityIcon className={`${iconSizeClasses[size]} text-gray-400`} />
          )}
        </span>
      </button>
    </div>
  );
};

// Main HighContrastToggle component
export const HighContrastToggle: React.FC<HighContrastToggleProps> = ({
  variant = 'button',
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const commonProps = { size, showLabel, className };

  switch (variant) {
    case 'switch':
      return <SwitchVariant {...commonProps} />;
    case 'button':
    default:
      return <ButtonVariant {...commonProps} />;
  }
};

export default HighContrastToggle;