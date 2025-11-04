import { toast } from 'sonner';

// Error types that match server-side ErrorType enum
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  DATABASE = 'DATABASE',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  SYSTEM = 'SYSTEM',
  RATE_LIMIT = 'RATE_LIMIT',
  FILE_UPLOAD = 'FILE_UPLOAD'
}

// Error response interface matching server
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    type: ErrorType;
    details?: any;
    timestamp: string;
    requestId?: string;
    path: string;
  };
}

// Network error interface
export interface NetworkError {
  message: string;
  status?: number;
  statusText?: string;
  isNetworkError: boolean;
}

// Client-side error class
export class ClientError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly requestId?: string;
  public readonly timestamp: Date;

  constructor(
    message: string,
    type: ErrorType,
    statusCode: number = 500,
    details?: any,
    requestId?: string
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.requestId = requestId;
    this.timestamp = new Date();
  }
}

// Error recovery strategies
export enum RecoveryStrategy {
  RETRY = 'RETRY',
  REDIRECT = 'REDIRECT',
  REFRESH = 'REFRESH',
  LOGOUT = 'LOGOUT',
  IGNORE = 'IGNORE',
  MANUAL = 'MANUAL'
}

// Recovery action interface
export interface RecoveryAction {
  strategy: RecoveryStrategy;
  label: string;
  action: () => void | Promise<void>;
  autoExecute?: boolean;
  delay?: number;
}

// Error handling configuration
interface ErrorHandlerConfig {
  showToast: boolean;
  logToConsole: boolean;
  reportToService: boolean;
  enableRecovery: boolean;
  maxRetries: number;
  retryDelay: number;
}

// Default configuration
const DEFAULT_CONFIG: ErrorHandlerConfig = {
  showToast: true,
  logToConsole: true,
  reportToService: process.env.NODE_ENV === 'production',
  enableRecovery: true,
  maxRetries: 3,
  retryDelay: 1000
};

// Error handler class
export class ClientErrorHandler {
  private static instance: ClientErrorHandler;
  private config: ErrorHandlerConfig;
  private retryAttempts: Map<string, number> = new Map();

  private constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public static getInstance(config?: Partial<ErrorHandlerConfig>): ClientErrorHandler {
    if (!ClientErrorHandler.instance) {
      ClientErrorHandler.instance = new ClientErrorHandler(config);
    }
    return ClientErrorHandler.instance;
  }

  // Handle API errors
  public async handleApiError(
    error: any,
    context?: string,
    recoveryActions?: RecoveryAction[]
  ): Promise<void> {
    const clientError = this.normalizeError(error);
    
    if (this.config.logToConsole) {
      console.error('API Error:', {
        error: clientError,
        context,
        timestamp: new Date().toISOString()
      });
    }

    if (this.config.reportToService) {
      this.reportError(clientError, context);
    }

    if (this.config.showToast) {
      this.showErrorToast(clientError, recoveryActions);
    }

    // Execute automatic recovery if available
    if (this.config.enableRecovery && recoveryActions) {
      const autoAction = recoveryActions.find(action => action.autoExecute);
      if (autoAction) {
        if (autoAction.delay) {
          setTimeout(() => autoAction.action(), autoAction.delay);
        } else {
          await autoAction.action();
        }
      }
    }
  }

  // Handle network errors
  public async handleNetworkError(
    error: NetworkError,
    context?: string,
    retryFunction?: () => Promise<any>
  ): Promise<void> {
    const errorKey = `${context || 'unknown'}_${error.status || 'network'}`;
    const attempts = this.retryAttempts.get(errorKey) || 0;

    if (this.config.logToConsole) {
      console.error('Network Error:', {
        error,
        context,
        attempts,
        timestamp: new Date().toISOString()
      });
    }

    // Auto-retry for network errors
    if (retryFunction && attempts < this.config.maxRetries) {
      this.retryAttempts.set(errorKey, attempts + 1);
      
      toast.info(`Connection failed. Retrying... (${attempts + 1}/${this.config.maxRetries})`, {
        duration: 2000
      });

      setTimeout(async () => {
        try {
          await retryFunction();
          this.retryAttempts.delete(errorKey);
          toast.success('Connection restored');
        } catch (retryError) {
          await this.handleNetworkError(error, context, retryFunction);
        }
      }, this.config.retryDelay * (attempts + 1));
    } else {
      // Max retries reached
      this.retryAttempts.delete(errorKey);
      
      const recoveryActions: RecoveryAction[] = [
        {
          strategy: RecoveryStrategy.RETRY,
          label: 'Try Again',
          action: async () => {
            if (retryFunction) {
              this.retryAttempts.delete(errorKey);
              await retryFunction();
            }
          }
        },
        {
          strategy: RecoveryStrategy.REFRESH,
          label: 'Refresh Page',
          action: () => window.location.reload()
        }
      ];

      toast.error('Connection failed. Please check your internet connection.', {
        duration: 10000,
        action: {
          label: 'Try Again',
          onClick: recoveryActions[0].action
        }
      });
    }
  }

  // Normalize different error types
  private normalizeError(error: any): ClientError {
    // Handle fetch/axios errors
    if (error.response) {
      const response = error.response;
      if (response.data && response.data.error) {
        const serverError = response.data.error;
        return new ClientError(
          serverError.message,
          serverError.type || ErrorType.SYSTEM,
          response.status,
          serverError.details,
          serverError.requestId
        );
      }
      
      return new ClientError(
        response.statusText || 'Request failed',
        this.getErrorTypeFromStatus(response.status),
        response.status
      );
    }

    // Handle network errors
    if (error.request || error.code === 'NETWORK_ERROR') {
      return new ClientError(
        'Network connection failed',
        ErrorType.SYSTEM,
        0
      );
    }

    // Handle validation errors
    if (error.name === 'ValidationError' || error.type === 'validation') {
      return new ClientError(
        error.message || 'Validation failed',
        ErrorType.VALIDATION,
        400,
        error.details
      );
    }

    // Default error
    return new ClientError(
      error.message || 'An unexpected error occurred',
      ErrorType.SYSTEM,
      500
    );
  }

  // Get error type from HTTP status code
  private getErrorTypeFromStatus(status: number): ErrorType {
    switch (Math.floor(status / 100)) {
      case 4:
        if (status === 401) return ErrorType.AUTHENTICATION;
        if (status === 403) return ErrorType.AUTHORIZATION;
        if (status === 404) return ErrorType.NOT_FOUND;
        if (status === 422) return ErrorType.VALIDATION;
        if (status === 429) return ErrorType.RATE_LIMIT;
        return ErrorType.VALIDATION;
      case 5:
        return ErrorType.SYSTEM;
      default:
        return ErrorType.SYSTEM;
    }
  }

  // Show error toast with recovery actions
  private showErrorToast(error: ClientError, recoveryActions?: RecoveryAction[]): void {
    const toastOptions: any = {
      duration: this.getToastDuration(error.type),
      description: error.requestId ? `Request ID: ${error.requestId}` : undefined
    };

    // Add recovery action to toast if available
    if (recoveryActions && recoveryActions.length > 0) {
      const primaryAction = recoveryActions[0];
      toastOptions.action = {
        label: primaryAction.label,
        onClick: primaryAction.action
      };
    }

    // Show appropriate toast based on error type
    switch (error.type) {
      case ErrorType.VALIDATION:
        toast.error(error.message, toastOptions);
        break;
      case ErrorType.AUTHENTICATION:
        toast.error(error.message, {
          ...toastOptions,
          action: {
            label: 'Login',
            onClick: () => window.location.href = '/login'
          }
        });
        break;
      case ErrorType.AUTHORIZATION:
        toast.error(error.message, toastOptions);
        break;
      case ErrorType.NOT_FOUND:
        toast.error(error.message, toastOptions);
        break;
      case ErrorType.BUSINESS_LOGIC:
        toast.warning(error.message, toastOptions);
        break;
      case ErrorType.RATE_LIMIT:
        toast.warning(error.message, toastOptions);
        break;
      case ErrorType.EXTERNAL_SERVICE:
        toast.error(error.message, {
          ...toastOptions,
          description: 'External service temporarily unavailable'
        });
        break;
      default:
        toast.error(error.message, toastOptions);
    }
  }

  // Get toast duration based on error type
  private getToastDuration(type: ErrorType): number {
    switch (type) {
      case ErrorType.VALIDATION:
        return 5000;
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return 8000;
      case ErrorType.RATE_LIMIT:
        return 6000;
      case ErrorType.SYSTEM:
      case ErrorType.DATABASE:
      case ErrorType.EXTERNAL_SERVICE:
        return 10000;
      default:
        return 5000;
    }
  }

  // Report error to monitoring service
  private reportError(error: ClientError, context?: string): void {
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry, LogRocket, etc.
      console.log('Would report to monitoring service:', { error, context });
    }
  }

  // Clear retry attempts for a specific context
  public clearRetryAttempts(context: string): void {
    const keysToDelete = Array.from(this.retryAttempts.keys())
      .filter(key => key.startsWith(context));
    
    keysToDelete.forEach(key => this.retryAttempts.delete(key));
  }

  // Update configuration
  public updateConfig(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Utility functions for common error scenarios
export const ErrorUtils = {
  // Handle form validation errors
  handleFormError: (error: any, setFieldError?: (field: string, message: string) => void) => {
    const handler = ClientErrorHandler.getInstance();
    const clientError = handler['normalizeError'](error);
    
    if (clientError.type === ErrorType.VALIDATION && clientError.details && setFieldError) {
      // Handle field-specific validation errors
      if (Array.isArray(clientError.details)) {
        clientError.details.forEach((detail: any) => {
          if (detail.path && detail.message) {
            setFieldError(detail.path.join('.'), detail.message);
          }
        });
      }
    } else {
      handler.handleApiError(error, 'form_submission');
    }
  },

  // Handle file upload errors
  handleFileUploadError: (error: any, retryUpload?: () => Promise<void>) => {
    const handler = ClientErrorHandler.getInstance();
    const recoveryActions: RecoveryAction[] = [];
    
    if (retryUpload) {
      recoveryActions.push({
        strategy: RecoveryStrategy.RETRY,
        label: 'Retry Upload',
        action: retryUpload
      });
    }
    
    handler.handleApiError(error, 'file_upload', recoveryActions);
  },

  // Handle authentication errors
  handleAuthError: (error: any) => {
    const handler = ClientErrorHandler.getInstance();
    const recoveryActions: RecoveryAction[] = [
      {
        strategy: RecoveryStrategy.LOGOUT,
        label: 'Login Again',
        action: () => {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        },
        autoExecute: true,
        delay: 2000
      }
    ];
    
    handler.handleApiError(error, 'authentication', recoveryActions);
  },

  // Handle data loading errors
  handleDataLoadError: (error: any, retryLoad?: () => Promise<void>) => {
    const handler = ClientErrorHandler.getInstance();
    const recoveryActions: RecoveryAction[] = [];
    
    if (retryLoad) {
      recoveryActions.push({
        strategy: RecoveryStrategy.RETRY,
        label: 'Retry',
        action: retryLoad
      });
    }
    
    recoveryActions.push({
      strategy: RecoveryStrategy.REFRESH,
      label: 'Refresh Page',
      action: () => window.location.reload()
    });
    
    handler.handleApiError(error, 'data_loading', recoveryActions);
  }
};

// React hook for error handling
export function useErrorHandler() {
  const handler = ClientErrorHandler.getInstance();
  
  return {
    handleError: (error: any, context?: string, recoveryActions?: RecoveryAction[]) =>
      handler.handleApiError(error, context, recoveryActions),
    handleNetworkError: (error: NetworkError, context?: string, retryFunction?: () => Promise<any>) =>
      handler.handleNetworkError(error, context, retryFunction),
    clearRetryAttempts: (context: string) => handler.clearRetryAttempts(context),
    ...ErrorUtils
  };
}

import React from 'react';

// Global error boundary for React
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const handler = ClientErrorHandler.getInstance();
    handler.handleApiError(error, 'react_error_boundary');
    
    console.error('React Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} />;
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Export singleton instance
export const errorHandler = ClientErrorHandler.getInstance();