import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ClientErrorHandler, 
  ErrorType, 
  RecoveryStrategy, 
  RecoveryAction,
  ErrorUtils 
} from '../utils/errorHandler';

export interface UseErrorHandlerOptions {
  showToast?: boolean;
  enableRetry?: boolean;
  enableRedirect?: boolean;
  defaultRetryDelay?: number;
  maxRetries?: number;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const navigate = useNavigate();
  const handler = ClientErrorHandler.getInstance();
  
  const {
    showToast = true,
    enableRetry = true,
    enableRedirect = true,
    defaultRetryDelay = 1000,
    maxRetries = 3
  } = options;

  // Handle API errors with automatic recovery actions
  const handleApiError = useCallback(async (
    error: any,
    context?: string,
    customRecoveryActions?: RecoveryAction[]
  ) => {
    const recoveryActions: RecoveryAction[] = customRecoveryActions || [];
    
    // Add default recovery actions based on error type
    if (error.response?.status === 401) {
      recoveryActions.push({
        strategy: RecoveryStrategy.LOGOUT,
        label: 'Login Again',
        action: () => {
          localStorage.removeItem('auth_token');
          navigate('/login');
        },
        autoExecute: true,
        delay: 2000
      });
    } else if (error.response?.status === 403) {
      recoveryActions.push({
        strategy: RecoveryStrategy.REDIRECT,
        label: 'Go Back',
        action: () => navigate(-1)
      });
    } else if (error.response?.status >= 500) {
      recoveryActions.push({
        strategy: RecoveryStrategy.REFRESH,
        label: 'Refresh Page',
        action: () => window.location.reload()
      });
    }
    
    await handler.handleApiError(error, context, recoveryActions);
  }, [navigate, handler]);

  // Handle form submission errors
  const handleFormError = useCallback((
    error: any,
    setFieldError?: (field: string, message: string) => void
  ) => {
    ErrorUtils.handleFormError(error, setFieldError);
  }, []);

  // Handle file upload errors with retry
  const handleFileUploadError = useCallback((
    error: any,
    retryUpload?: () => Promise<void>
  ) => {
    ErrorUtils.handleFileUploadError(error, retryUpload);
  }, []);

  // Handle data loading errors with retry
  const handleDataLoadError = useCallback((
    error: any,
    retryLoad?: () => Promise<void>
  ) => {
    ErrorUtils.handleDataLoadError(error, retryLoad);
  }, []);

  // Create a retry wrapper for async operations
  const withRetry = useCallback(<T>(
    operation: () => Promise<T>,
    context?: string,
    customMaxRetries?: number
  ) => {
    let attempts = 0;
    const maxAttempts = customMaxRetries || maxRetries;
    
    const executeWithRetry = async (): Promise<T> => {
      try {
        return await operation();
      } catch (error) {
        attempts++;
        
        if (attempts < maxAttempts && isRetryableError(error)) {
          toast.info(`Retrying... (${attempts}/${maxAttempts})`, {
            duration: 2000
          });
          
          // Exponential backoff
          const delay = defaultRetryDelay * Math.pow(2, attempts - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return executeWithRetry();
        } else {
          await handleApiError(error, context);
          throw error;
        }
      }
    };
    
    return executeWithRetry;
  }, [handleApiError, defaultRetryDelay, maxRetries]);

  // Check if error is retryable
  const isRetryableError = useCallback((error: any): boolean => {
    // Network errors
    if (!error.response) {
      return true;
    }
    
    // Server errors (5xx)
    if (error.response.status >= 500) {
      return true;
    }
    
    // Rate limiting
    if (error.response.status === 429) {
      return true;
    }
    
    // Timeout errors
    if (error.code === 'ECONNABORTED') {
      return true;
    }
    
    return false;
  }, []);

  // Handle authentication errors
  const handleAuthError = useCallback((error: any) => {
    ErrorUtils.handleAuthError(error);
  }, []);

  // Handle business logic errors with custom actions
  const handleBusinessError = useCallback((
    error: any,
    customActions?: Array<{
      label: string;
      action: () => void | Promise<void>;
    }>
  ) => {
    const recoveryActions: RecoveryAction[] = [];
    
    if (customActions) {
      customActions.forEach(action => {
        recoveryActions.push({
          strategy: RecoveryStrategy.MANUAL,
          label: action.label,
          action: action.action
        });
      });
    }
    
    handleApiError(error, 'business_logic', recoveryActions);
  }, [handleApiError]);

  // Handle validation errors with field mapping
  const handleValidationError = useCallback((
    error: any,
    fieldMapping?: Record<string, string>
  ) => {
    if (error.response?.data?.error?.details && Array.isArray(error.response.data.error.details)) {
      const validationErrors = error.response.data.error.details;
      
      validationErrors.forEach((validationError: any) => {
        if (validationError.path && validationError.message) {
          const fieldPath = validationError.path.join('.');
          const displayField = fieldMapping?.[fieldPath] || fieldPath;
          
          toast.error(`${displayField}: ${validationError.message}`, {
            duration: 5000
          });
        }
      });
    } else {
      handleApiError(error, 'validation');
    }
  }, [handleApiError]);

  // Clear retry attempts for a context
  const clearRetryAttempts = useCallback((context: string) => {
    handler.clearRetryAttempts(context);
  }, [handler]);

  // Create error boundary fallback
  const createErrorFallback = useCallback((
    customFallback?: React.ComponentType<{ error: Error; retry: () => void }>
  ) => {
    return ({ error, retry }: { error: Error; retry: () => void }) => {
      if (customFallback) {
        const CustomFallback = customFallback;
        return <CustomFallback error={error} retry={retry} />;
      }
      
      return (
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-sm text-gray-500 mb-4">
              We encountered an error while loading this content.
            </p>
            <button
              onClick={retry}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    };
  }, []);

  return {
    // Main error handlers
    handleError: handleApiError,
    handleApiError,
    handleFormError,
    handleFileUploadError,
    handleDataLoadError,
    handleAuthError,
    handleBusinessError,
    handleValidationError,
    
    // Utility functions
    withRetry,
    isRetryableError,
    clearRetryAttempts,
    createErrorFallback,
    
    // Direct access to error utils
    ...ErrorUtils
  };
}

// Hook for handling async operations with error handling
export function useAsyncOperation<T = any>() {
  const { handleError, withRetry } = useErrorHandler();
  
  const execute = useCallback(async (
    operation: () => Promise<T>,
    options: {
      context?: string;
      enableRetry?: boolean;
      maxRetries?: number;
      onSuccess?: (result: T) => void;
      onError?: (error: any) => void;
      loadingToast?: string;
      successToast?: string;
    } = {}
  ): Promise<T | undefined> => {
    const {
      context,
      enableRetry = true,
      maxRetries = 3,
      onSuccess,
      onError,
      loadingToast,
      successToast
    } = options;
    
    let toastId: string | number | undefined;
    
    try {
      if (loadingToast) {
        toastId = toast.loading(loadingToast);
      }
      
      const wrappedOperation = enableRetry 
        ? withRetry(operation, context, maxRetries)
        : operation;
      
      const result = await wrappedOperation();
      
      if (toastId) {
        toast.dismiss(toastId);
      }
      
      if (successToast) {
        toast.success(successToast);
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      if (toastId) {
        toast.dismiss(toastId);
      }
      
      if (onError) {
        onError(error);
      } else {
        await handleError(error, context);
      }
      
      return undefined;
    }
  }, [handleError, withRetry]);
  
  return { execute };
}