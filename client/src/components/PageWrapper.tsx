import { useEffect, ReactNode } from "react";
import { useLoading } from "@/contexts/LoadingContext";

interface PageWrapperProps {
  children: ReactNode;
  loadingMessage?: string;
  loadingTime?: number;
  showProgress?: boolean;
}

export default function PageWrapper({ 
  children, 
  loadingMessage = "Loading...", 
  loadingTime = 800,
  showProgress = false 
}: PageWrapperProps) {
  const { setLoading, setLoadingWithProgress } = useLoading();

  useEffect(() => {
    if (showProgress) {
      setLoadingWithProgress(true, loadingMessage, true);
      
      // Simulate progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 90) {
          clearInterval(progressInterval);
        }
      }, 100);

      const timer = setTimeout(() => {
        clearInterval(progressInterval);
        setLoading(false);
      }, loadingTime);

      return () => {
        clearTimeout(timer);
        clearInterval(progressInterval);
      };
    } else {
      setLoading(true, loadingMessage);
      
      const timer = setTimeout(() => {
        setLoading(false);
      }, loadingTime);

      return () => clearTimeout(timer);
    }
  }, [setLoading, setLoadingWithProgress, loadingMessage, loadingTime, showProgress]);

  return <>{children}</>;
}
