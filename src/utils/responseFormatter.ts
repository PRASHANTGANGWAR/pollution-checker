/**
 * Response formatting utilities for consistent API responses
 */

export interface ApiResponse<T = any> {
  page?: number;
  limit?: number;
  total?: number;
  cities?: T;
  error?: string;
  code?: string;
}

export class ResponseFormatter {
  /**
   * Format successful response with pagination
   */
  static success<T>(
    cities: T,
    page: number = 1,
    limit: number = 10,
    total: number = 0
  ): ApiResponse<T> {
    return {
      page,
      limit,
      total,
      cities
    };
  }

  /**
   * Format error response
   */
  static error(
    message: string,
    code?: string
  ): ApiResponse {
    return {
      error: message,
      code
    };
  }
}

/**
 * Generate unique request ID for tracking
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
