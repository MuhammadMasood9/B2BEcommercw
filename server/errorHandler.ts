import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Error types enum for categorization
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

// Custom error class for application errors
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;
  public readonly timestamp: Date;
  public readonly requestId?: string;

  constructor(
    message: string,
    type: ErrorType,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any,
    requestId?: string
  ) {
    super(message);
    
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date();
    this.requestId = requestId;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error response interface
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

// User-friendly error messages mapping
const ERROR_MESSAGES: Record<ErrorType, Record<string, string>> = {
  [ErrorType.VALIDATION]: {
    default: 'The information provided is invalid. Please check your input and try again.',
    required_field: 'Required fields are missing. Please fill in all required information.',
    invalid_format: 'The format of the provided information is incorrect.',
    invalid_email: 'Please provide a valid email address.',
    invalid_phone: 'Please provide a valid phone number.',
    password_weak: 'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers.',
    file_too_large: 'The uploaded file is too large. Please choose a smaller file.',
    invalid_file_type: 'The file type is not supported. Please upload a valid file.'
  },
  [ErrorType.AUTHENTICATION]: {
    default: 'Authentication failed. Please log in again.',
    invalid_credentials: 'Invalid email or password. Please try again.',
    token_expired: 'Your session has expired. Please log in again.',
    token_invalid: 'Invalid authentication token. Please log in again.',
    account_locked: 'Your account has been temporarily locked. Please contact support.',
    email_not_verified: 'Please verify your email address before continuing.'
  },
  [ErrorType.AUTHORIZATION]: {
    default: 'You do not have permission to perform this action.',
    insufficient_permissions: 'You do not have sufficient permissions for this operation.',
    role_required: 'This action requires a specific role that you do not have.',
    resource_access_denied: 'You do not have access to this resource.',
    supplier_not_approved: 'Your supplier account must be approved before performing this action.',
    verification_required: 'Account verification is required for this action.'
  },
  [ErrorType.NOT_FOUND]: {
    default: 'The requested resource was not found.',
    user_not_found: 'User account not found.',
    product_not_found: 'Product not found.',
    order_not_found: 'Order not found.',
    supplier_not_found: 'Supplier not found.',
    rfq_not_found: 'RFQ not found.',
    inquiry_not_found: 'Inquiry not found.',
    quotation_not_found: 'Quotation not found.',
    conversation_not_found: 'Conversation not found.'
  },
  [ErrorType.BUSINESS_LOGIC]: {
    default: 'This action cannot be completed due to business rules.',
    insufficient_inventory: 'Insufficient inventory available for this quantity.',
    order_already_processed: 'This order has already been processed.',
    rfq_expired: 'This RFQ has expired and can no longer be responded to.',
    quotation_expired: 'This quotation has expired.',
    minimum_order_not_met: 'The order quantity does not meet the minimum order requirement.',
    duplicate_application: 'You have already submitted an application for this.',
    invalid_status_transition: 'Cannot change status from current state.',
    payment_required: 'Payment is required to complete this action.'
  },
  [ErrorType.DATABASE]: {
    default: 'A database error occurred. Please try again later.',
    connection_failed: 'Unable to connect to the database. Please try again.',
    query_timeout: 'The operation took too long to complete. Please try again.',
    constraint_violation: 'The operation violates data constraints.',
    duplicate_entry: 'This record already exists.',
    foreign_key_violation: 'Cannot complete operation due to related data dependencies.'
  },
  [ErrorType.EXTERNAL_SERVICE]: {
    default: 'An external service is temporarily unavailable. Please try again later.',
    payment_service_error: 'Payment processing is temporarily unavailable.',
    email_service_error: 'Email service is temporarily unavailable.',
    file_storage_error: 'File storage service is temporarily unavailable.',
    api_rate_limit: 'External service rate limit exceeded. Please try again later.'
  },
  [ErrorType.SYSTEM]: {
    default: 'A system error occurred. Please try again later.',
    server_overload: 'The server is currently overloaded. Please try again later.',
    maintenance_mode: 'The system is currently under maintenance. Please try again later.',
    configuration_error: 'System configuration error. Please contact support.',
    memory_limit: 'System memory limit exceeded. Please try again with smaller data.'
  },
  [ErrorType.RATE_LIMIT]: {
    default: 'Too many requests. Please wait before trying again.',
    login_attempts: 'Too many login attempts. Please wait before trying again.',
    api_calls: 'API rate limit exceeded. Please wait before making more requests.',
    file_uploads: 'Too many file uploads. Please wait before uploading more files.'
  },
  [ErrorType.FILE_UPLOAD]: {
    default: 'File upload failed. Please try again.',
    file_too_large: 'The uploaded file exceeds the maximum size limit.',
    invalid_file_type: 'The file type is not supported.',
    upload_failed: 'File upload failed. Please check your connection and try again.',
    virus_detected: 'The uploaded file failed security checks.',
    storage_full: 'Storage limit exceeded. Please delete some files and try again.'
  }
};

// Get user-friendly error message
export function getUserFriendlyMessage(type: ErrorType, code?: string): string {
  const typeMessages = ERROR_MESSAGES[type];
  if (code && typeMessages[code]) {
    return typeMessages[code];
  }
  return typeMessages.default || 'An unexpected error occurred. Please try again.';
}

// Error logger utility
export class ErrorLogger {
  private static instance: ErrorLogger;
  
  private constructor() {}
  
  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }
  
  public logError(error: Error | AppError, req?: Request, additionalContext?: any): void {
    const timestamp = new Date().toISOString();
    const requestId = req?.headers['x-request-id'] as string || 'unknown';
    
    const logEntry = {
      timestamp,
      requestId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        type: error instanceof AppError ? error.type : ErrorType.SYSTEM,
        statusCode: error instanceof AppError ? error.statusCode : 500,
        isOperational: error instanceof AppError ? error.isOperational : false,
        details: error instanceof AppError ? error.details : undefined
      },
      request: req ? {
        method: req.method,
        url: req.url,
        path: req.path,
        query: req.query,
        params: req.params,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: (req as any).user?.id
      } : undefined,
      additionalContext
    };
    
    // Log to console (in production, this should go to a proper logging service)
    if (error instanceof AppError && error.isOperational) {
      console.warn('Operational Error:', JSON.stringify(logEntry, null, 2));
    } else {
      console.error('System Error:', JSON.stringify(logEntry, null, 2));
    }
    
    // In production, send to monitoring service (e.g., Sentry, DataDog, etc.)
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(logEntry);
    }
  }
  
  private sendToMonitoringService(logEntry: any): void {
    // Placeholder for external monitoring service integration
    // Example: Sentry.captureException(error, { extra: logEntry });
  }
}

// Convert various error types to AppError
export function normalizeError(error: any, requestId?: string): AppError {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return new AppError(
      getUserFriendlyMessage(ErrorType.VALIDATION, 'default'),
      ErrorType.VALIDATION,
      400,
      true,
      error.errors,
      requestId
    );
  }
  
  // Handle database errors
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return new AppError(
          getUserFriendlyMessage(ErrorType.DATABASE, 'duplicate_entry'),
          ErrorType.DATABASE,
          409,
          true,
          { constraint: error.constraint },
          requestId
        );
      case '23503': // Foreign key violation
        return new AppError(
          getUserFriendlyMessage(ErrorType.DATABASE, 'foreign_key_violation'),
          ErrorType.DATABASE,
          400,
          true,
          { constraint: error.constraint },
          requestId
        );
      case 'ECONNREFUSED':
        return new AppError(
          getUserFriendlyMessage(ErrorType.DATABASE, 'connection_failed'),
          ErrorType.DATABASE,
          503,
          true,
          undefined,
          requestId
        );
    }
  }
  
  // Handle file upload errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new AppError(
      getUserFriendlyMessage(ErrorType.FILE_UPLOAD, 'file_too_large'),
      ErrorType.FILE_UPLOAD,
      413,
      true,
      { limit: error.limit },
      requestId
    );
  }
  
  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return new AppError(
      getUserFriendlyMessage(ErrorType.AUTHENTICATION, 'token_invalid'),
      ErrorType.AUTHENTICATION,
      401,
      true,
      undefined,
      requestId
    );
  }
  
  if (error.name === 'TokenExpiredError') {
    return new AppError(
      getUserFriendlyMessage(ErrorType.AUTHENTICATION, 'token_expired'),
      ErrorType.AUTHENTICATION,
      401,
      true,
      undefined,
      requestId
    );
  }
  
  // If it's already an AppError, return as is
  if (error instanceof AppError) {
    return error;
  }
  
  // Default system error
  return new AppError(
    getUserFriendlyMessage(ErrorType.SYSTEM, 'default'),
    ErrorType.SYSTEM,
    500,
    false,
    { originalMessage: error.message },
    requestId
  );
}

// Request ID middleware
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string || 
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
}

// Global error handler middleware
export function globalErrorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string;
  const normalizedError = normalizeError(error, requestId);
  
  // Log the error
  ErrorLogger.getInstance().logError(normalizedError, req);
  
  // Don't send error details in production for non-operational errors
  const shouldExposeDetails = process.env.NODE_ENV !== 'production' || normalizedError.isOperational;
  
  const errorResponse: ErrorResponse = {
    error: {
      code: `${normalizedError.type}_${normalizedError.statusCode}`,
      message: normalizedError.message,
      type: normalizedError.type,
      details: shouldExposeDetails ? normalizedError.details : undefined,
      timestamp: normalizedError.timestamp.toISOString(),
      requestId: normalizedError.requestId,
      path: req.path
    }
  };
  
  // Set appropriate status code
  res.status(normalizedError.statusCode);
  
  // Send JSON response
  res.json(errorResponse);
}

// Async error wrapper for route handlers
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Common error factory functions
export const ErrorFactory = {
  validation: (message?: string, details?: any, requestId?: string) => 
    new AppError(
      message || getUserFriendlyMessage(ErrorType.VALIDATION),
      ErrorType.VALIDATION,
      400,
      true,
      details,
      requestId
    ),
    
  authentication: (code: string = 'default', requestId?: string) =>
    new AppError(
      getUserFriendlyMessage(ErrorType.AUTHENTICATION, code),
      ErrorType.AUTHENTICATION,
      401,
      true,
      undefined,
      requestId
    ),
    
  authorization: (code: string = 'default', requestId?: string) =>
    new AppError(
      getUserFriendlyMessage(ErrorType.AUTHORIZATION, code),
      ErrorType.AUTHORIZATION,
      403,
      true,
      undefined,
      requestId
    ),
    
  notFound: (resource: string = 'resource', requestId?: string) =>
    new AppError(
      getUserFriendlyMessage(ErrorType.NOT_FOUND, `${resource}_not_found`) ||
      getUserFriendlyMessage(ErrorType.NOT_FOUND),
      ErrorType.NOT_FOUND,
      404,
      true,
      { resource },
      requestId
    ),
    
  businessLogic: (code: string = 'default', details?: any, requestId?: string) =>
    new AppError(
      getUserFriendlyMessage(ErrorType.BUSINESS_LOGIC, code),
      ErrorType.BUSINESS_LOGIC,
      400,
      true,
      details,
      requestId
    ),
    
  database: (code: string = 'default', requestId?: string) =>
    new AppError(
      getUserFriendlyMessage(ErrorType.DATABASE, code),
      ErrorType.DATABASE,
      500,
      true,
      undefined,
      requestId
    ),
    
  externalService: (service: string, code: string = 'default', requestId?: string) =>
    new AppError(
      getUserFriendlyMessage(ErrorType.EXTERNAL_SERVICE, code),
      ErrorType.EXTERNAL_SERVICE,
      503,
      true,
      { service },
      requestId
    ),
    
  rateLimit: (code: string = 'default', requestId?: string) =>
    new AppError(
      getUserFriendlyMessage(ErrorType.RATE_LIMIT, code),
      ErrorType.RATE_LIMIT,
      429,
      true,
      undefined,
      requestId
    ),
    
  fileUpload: (code: string = 'default', details?: any, requestId?: string) =>
    new AppError(
      getUserFriendlyMessage(ErrorType.FILE_UPLOAD, code),
      ErrorType.FILE_UPLOAD,
      400,
      true,
      details,
      requestId
    )
};