import { useEffect } from "react";
import { useLocation } from "wouter";
import { useLoading } from "@/contexts/LoadingContext";

export function usePageLoader() {
  const [location] = useLocation();
  const { setLoading } = useLoading();

  useEffect(() => {
    // Show loader when route changes
    setLoading(true, "Loading page...");
    
    // Simulate page loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800); // Adjust timing as needed

    return () => clearTimeout(timer);
  }, [location, setLoading]);
}

export function useAsyncLoader() {
  const { setLoading, setLoadingWithProgress, setProgress } = useLoading();

  const withLoader = async <T>(
    asyncFunction: () => Promise<T>,
    message: string = "Processing...",
    showProgress: boolean = false
  ): Promise<T> => {
    try {
      setLoadingWithProgress(true, message, showProgress);
      
      if (showProgress) {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) return prev;
            return prev + Math.random() * 10;
          });
        }, 200);
        
        const result = await asyncFunction();
        
        clearInterval(progressInterval);
        setProgress(100);
        
        // Small delay to show 100%
        setTimeout(() => {
          setLoading(false);
        }, 300);
        
        return result;
      } else {
        const result = await asyncFunction();
        setLoading(false);
        return result;
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  return { withLoader };
}
