import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLoading } from "@/contexts/LoadingContext";
import { useAsyncLoader } from "@/hooks/usePageLoader";

export default function LoadingExamples() {
  const { setLoading, setLoadingWithProgress, setProgress } = useLoading();
  const { withLoader } = useAsyncLoader();
  const [loadingState, setLoadingState] = useState("");

  // Basic loading example
  const handleBasicLoading = () => {
    setLoading(true, "Processing your request...");
    
    setTimeout(() => {
      setLoading(false);
      setLoadingState("Basic loading completed!");
    }, 2000);
  };

  // Loading with progress
  const handleProgressLoading = () => {
    setLoadingWithProgress(true, "Uploading files...", true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setLoading(false);
            setLoadingState("Progress loading completed!");
          }, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  };

  // Async loading with error handling
  const handleAsyncLoading = async () => {
    try {
      const result = await withLoader(
        async () => {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1500));
          return "Data loaded successfully!";
        },
        "Fetching data from server...",
        true
      );
      setLoadingState(result);
    } catch (error) {
      setLoadingState("Error occurred during loading");
    }
  };

  // Custom message loading
  const handleCustomMessage = () => {
    const messages = [
      "Connecting to suppliers...",
      "Loading product catalog...",
      "Preparing your dashboard...",
      "Almost ready..."
    ];
    
    let currentIndex = 0;
    setLoading(true, messages[currentIndex]);
    
    const interval = setInterval(() => {
      currentIndex++;
      if (currentIndex < messages.length) {
        setLoading(true, messages[currentIndex]);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setLoading(false);
          setLoadingState("Custom message loading completed!");
        }, 500);
      }
    }, 800);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Loading System Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={handleBasicLoading} className="w-full">
              Basic Loading (2s)
            </Button>
            
            <Button onClick={handleProgressLoading} className="w-full">
              Progress Loading
            </Button>
            
            <Button onClick={handleAsyncLoading} className="w-full">
              Async Loading with Progress
            </Button>
            
            <Button onClick={handleCustomMessage} className="w-full">
              Custom Messages
            </Button>
          </div>
          
          {loadingState && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-green-800 dark:text-green-200">{loadingState}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
