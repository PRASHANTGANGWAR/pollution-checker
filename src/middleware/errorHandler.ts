import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import { CustomApiError, ErrorCodes, handleApiError } from "../utils/errorUtils";
import { ResponseFormatter } from "../utils/responseFormatter";
/**
 * Global error handling middleware
 * Provides consistent error responses across the application
 */

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error("Error occurred", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    requestId: req.context?.requestId,
  });

  // Handle custom API errors
  if (err instanceof CustomApiError) {
    const errorResponse = ResponseFormatter.error(
      err.message,
      err.code
    );
    
    res.status(err.statusCode).json(errorResponse);
    return;
  }

  // Handle other errors using our error handling utility
  const apiError = handleApiError(err);
  const errorResponse = ResponseFormatter.error(
    apiError.message,
    apiError.code
  );

  res.status(apiError.statusCode || 500).json(errorResponse);
};

export default errorHandler;
