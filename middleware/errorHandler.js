/**
 * ADDUS Platform — Global Error Handler Middleware
 *
 * Phase 5 implementation:
 *  - Centralized error handling
 *  - Sanitizes error responses
 *  - Logs errors with request context
 *  - Returns consistent error format
 */

export function errorHandler(err, req, res, next) {
  const requestId = req.requestId || 'unknown';
  const timestamp = new Date().toISOString();

  console.error(`[${timestamp}] [Error] ${req.method} ${req.url} - ${err.message}`, {
    requestId,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  const statusCode = err.statusCode || 500;
  const errorResponse = {
    error: err.message || 'Internal server error',
    requestId,
    timestamp
  };

  if (statusCode === 500) {
    errorResponse.error = 'Internal server error';
  }

  res.status(statusCode).json(errorResponse);
}
