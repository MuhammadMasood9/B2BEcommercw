export function useHighContrast() {
  const toggleHighContrast = () => {
    // No-op: high contrast mode is disabled in light-only experience.
  };

  const resetToSystemPreference = () => {
    // No-op: system preference is ignored in light-only experience.
  };

  return {
    isHighContrast: false,
    systemPreference: false,
    toggleHighContrast,
    resetToSystemPreference
  };
}