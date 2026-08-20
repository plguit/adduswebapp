/**
 * ADDUS Platform — Request Timeout Middleware
 *
 * Phase 5 implementation:
 *  - Enforces request timeouts
 *  - Prevents hanging requests
 *  - Returns 504 Gateway Timeout on timeout
 */

export function requestTimeout(ms = 30000) {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          error: 'Request timeout',
          message: 'The server took too long to respond. Please try again.',
          requestId: req.requestId || 'unknown'
        });
      }
    }, ms);

    res.on('finish', () => clearTimeout(timeout));
    next();
  };
}
