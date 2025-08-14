/**
 * Custom error utilities for better error handling and logging
 */

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  statusCode?: number;
}

export class CustomApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.name = 'CustomApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function createApiError(
  message: string, 
  statusCode: number = 500, 
  code: string = 'INTERNAL_ERROR',
  details?: any
): ApiError {
  return {
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
    statusCode
  };
}

export function isCustomApiError(error: any): error is CustomApiError {
  return error instanceof CustomApiError;
}

export function handleApiError(error: any): ApiError {
  if (isCustomApiError(error)) {
    return createApiError(error.message, error.statusCode, error.code, error.details);
  }
  
  // Handle axios errors
  if (error.response) {
    const statusCode = error.response.status;
    const message = error.response.data?.message || 'External API error';
    const code = `EXTERNAL_API_${statusCode}`;
    
    return createApiError(message, statusCode, code, {
      url: error.config?.url,
      method: error.config?.method
    });
  }
  
  // Handle network errors
  if (error.request) {
    return createApiError('Network error', 503, 'NETWORK_ERROR', {
      message: error.message
    });
  }
  
  // Handle other errors
  return createApiError(
    error.message || 'Internal server error',
    500,
    'INTERNAL_ERROR'
  );
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;
