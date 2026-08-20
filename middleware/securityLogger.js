/**
 * ADDUS Platform — Security Logger Middleware
 *
 * Phase 5 implementation:
 *  - Logs security-relevant events
 *  - Tracks suspicious patterns
 *  - Provides audit trail
 */

const suspiciousPatterns = [
  { pattern: /\.\.\//g, name: 'path_traversal' },
  { pattern: /<script[^>]*>/i, name: 'xss_attempt' },
  { pattern: /union\s+select/i, name: 'sql_injection' },
  { pattern: /eval\s*\(/i, name: 'code_injection' }
];

export function securityLogger(req, res, next) {
  const isSuspicious = suspiciousPatterns.some(({ pattern }) => {
    return pattern.test(req.url) || pattern.test(JSON.stringify(req.body || {}));
  });

  if (isSuspicious) {
    console.warn(`[Security Alert] Suspicious request detected: ${req.method} ${req.url} from ${req.ip}`);
  }

  res.on('finish', () => {
    if (res.statusCode >= 400) {
      console.warn(`[Security Log] ${req.method} ${req.url} - Status: ${res.statusCode} - IP: ${req.ip}`);
    }
  });

  next();
}
