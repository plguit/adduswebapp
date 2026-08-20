/**
 * ADDUS Platform — Request ID Middleware
 *
 * Phase 5 implementation:
 *  - Generates unique request ID for tracing
 *  - Attaches to request object
 *  - Returns in X-Request-ID header
 */

import { randomUUID } from 'crypto';

export function requestId(req, res, next) {
  const requestId = req.headers['x-request-id'] || randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}
