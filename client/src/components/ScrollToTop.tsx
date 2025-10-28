import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    // Don't scroll on messages page - it has its own scroll handling
    if (location.includes('/messages') || location.includes('/chat')) {
      return;
    }
    
    // Scroll to top when route changes
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location]);

  return null;
}

