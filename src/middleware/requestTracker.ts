/**
 * Request tracking middleware for monitoring and debugging
 */

import { Request, Response, NextFunction } from 'express';
import { generateRequestId } from '../utils/responseFormatter';

export interface RequestContext {
  requestId: string;
  startTime: number;
  method: string;
  path: string;
  userAgent?: string;
  ip?: string;
}

declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}

export function requestTracker(req: Request, res: Response, next: NextFunction) {
  // Generate unique request ID
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  // Create request context
  req.context = {
    requestId,
    startTime,
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress
  };

  // Add request ID and performance headers
  res.setHeader('X-Request-ID', requestId);
  
  // Log request start
  console.log(`[${requestId}] ${req.method} ${req.path} - Started`);
  
  // Track response completion with performance monitoring
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    const statusColor = status >= 400 ? '\x1b[31m' : status >= 300 ? '\x1b[33m' : '\x1b[32m';
    const resetColor = '\x1b[0m';
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`[${requestId}] Slow request detected: ${duration}ms`);
    }
    
    console.log(
      `[${requestId}] ${req.method} ${req.path} - ${statusColor}${status}${resetColor} (${duration}ms)`
    );
  });

  next();
}

/**
 * Performance monitoring middleware
 */
export function performanceMonitor(req: Request, res: Response, next: NextFunction) {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`[${req.context?.requestId}] Slow request detected: ${duration.toFixed(2)}ms`);
    }
    
    // Note: Headers should be set before response is sent, not in finish event
    // Performance header is set in the requestTracker middleware
  });
  
  next();
}

/**
 * Request validation middleware
 */
export function validateRequest(req: Request, res: Response, next: NextFunction) {
  const { method, path } = req;
  
  // Validate content type for POST/PUT requests
  if ((method === 'POST' || method === 'PUT') && !req.is('application/json')) {
    return res.status(400).json({
      success: false,
      error: 'Content-Type must be application/json',
      code: 'INVALID_CONTENT_TYPE',
      timestamp: new Date().toISOString()
    });
  }
  
  // Validate query parameters for cities endpoint
  if (path === '/cities') {
    const { page, limit } = req.query;
    
    if (page && (isNaN(Number(page)) || Number(page) < 1)) {
      return res.status(400).json({
        success: false,
        error: 'Page must be a positive integer',
        code: 'INVALID_PAGE_PARAMETER',
        timestamp: new Date().toISOString()
      });
    }
    
    if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 100',
        code: 'INVALID_LIMIT_PARAMETER',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  next();
}
