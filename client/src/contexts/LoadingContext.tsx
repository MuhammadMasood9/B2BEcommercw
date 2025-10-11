import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface LoadingContextType {
  isLoading: boolean;
  loadingMessage: string;
  showProgress: boolean;
  progress: number;
  setLoading: (loading: boolean, message?: string) => void;
  setProgress: (progress: number) => void;
  setLoadingWithProgress: (loading: boolean, message?: string, showProgress?: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}

interface LoadingProviderProps {
  children: ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);

  const setLoading = useCallback((loading: boolean, message: string = "Loading...") => {
    setIsLoading(loading);
    setLoadingMessage(message);
    if (!loading) {
      setShowProgress(false);
      setProgress(0);
    }
  }, []);

  const setLoadingWithProgress = useCallback((
    loading: boolean, 
    message: string = "Loading...", 
    showProgressBar: boolean = false
  ) => {
    setIsLoading(loading);
    setLoadingMessage(message);
    setShowProgress(showProgressBar);
    if (!loading) {
      setProgress(0);
    }
  }, []);

  const value: LoadingContextType = {
    isLoading,
    loadingMessage,
    showProgress,
    progress,
    setLoading,
    setProgress,
    setLoadingWithProgress,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}
