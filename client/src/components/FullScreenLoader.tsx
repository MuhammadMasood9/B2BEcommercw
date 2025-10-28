import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FullScreenLoaderProps {
  isLoading: boolean;
  message?: string;
  showProgress?: boolean;
  progress?: number;
  isAdmin?: boolean; // New prop to determine admin vs user loader
}

export default function FullScreenLoader({ 
  isLoading, 
  message = "Loading...", 
  showProgress = false,
  progress = 0,
  isAdmin = false 
}: FullScreenLoaderProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`fixed inset-0 z-[10000] flex items-center justify-center backdrop-blur-sm ${
            isAdmin 
              ? "bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700" 
              : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
          }`}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center justify-center space-y-6 p-8"
          >
            {/* Main Loading Spinner */}
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="h-16 w-16 rounded-full border-4 border-gray-200 dark:border-gray-800"
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className={`absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent ${
                  isAdmin ? "border-t-white" : "border-t-gray-600 dark:border-t-gray-400"
                }`}
              />
              <div className={`absolute inset-2 h-12 w-12 rounded-full flex items-center justify-center ${
                isAdmin 
                  ? "bg-gradient-to-br from-blue-400 to-blue-500" 
                  : "bg-gradient-to-br from-gray-500 to-gray-600"
              }`}>
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
            </div>

            {/* Loading Message */}
            <div className="text-center space-y-2">
              <motion.h3
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`text-xl font-semibold ${
                  isAdmin ? "text-white" : "text-gray-900 dark:text-white"
                }`}
              >
                {message}{dots}
              </motion.h3>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className={`text-sm ${
                  isAdmin ? "text-blue-100" : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {isAdmin ? "Managing your B2B marketplace" : "Please wait while we prepare your experience"}
              </motion.p>
            </div>

            {/* Progress Bar */}
            {showProgress && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="w-64 space-y-2"
              >
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Loading</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${
                  isAdmin ? "bg-blue-900/50" : "bg-gray-200 dark:bg-gray-700"
                }`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      isAdmin 
                        ? "bg-gradient-to-r from-blue-400 to-blue-500" 
                        : "bg-gradient-to-r from-gray-500 to-gray-600"
                    }`}
                  />
                </div>
              </motion.div>
            )}

            {/* Animated Dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex space-x-1"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="h-2 w-2 bg-gray-500 rounded-full"
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
