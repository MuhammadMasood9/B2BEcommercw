import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeLoadingOverlayProps {
  show: boolean;
  duration?: number;
}

export const ThemeLoadingOverlay: React.FC<ThemeLoadingOverlayProps> = ({
  show,
  duration = 300,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      // Small delay to ensure the overlay is rendered before showing
      const showTimeout = setTimeout(() => {
        setIsVisible(true);
      }, 10);

      return () => clearTimeout(showTimeout);
    } else {
      setIsVisible(false);
      // Keep rendered until transition completes
      const hideTimeout = setTimeout(() => {
        setShouldRender(false);
      }, duration);

      return () => clearTimeout(hideTimeout);
    }
  }, [show, duration]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`theme-loading-overlay ${isVisible ? 'active' : ''}`}
      style={{
        transitionDuration: `${duration}ms`,
      }}
      aria-hidden="true"
    >
      <div className="theme-loading-spinner" />
    </div>
  );
};

export default ThemeLoadingOverlay;