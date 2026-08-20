/**
 * Rate Limiter Middleware
 * 
 * Restricts requests per user session to configurable requests per 60-second window.
 * Default: 20 requests per minute for normal users, 100 for bulk operations.
 */

const userRequests = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '20', 10);
const BULK_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_BULK_MAX_REQUESTS || '100', 10);

export function rateLimiter(req, res, next) {
  const userId = req.body?.userId || req.params?.userId || req.ip || 'anonymous';
  const isBulkOperation = req.path === '/api/analyze-website' && req.headers['x-bulk-operation'] === 'true';
  const maxRequests = isBulkOperation ? BULK_MAX_REQUESTS : DEFAULT_MAX_REQUESTS;
  const now = Date.now();

  if (!userRequests.has(userId)) {
    userRequests.set(userId, []);
  }

  const timestamps = userRequests.get(userId);
  
  // Filter out timestamps older than 60 seconds
  const validTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  userRequests.set(userId, validTimestamps);

  if (validTimestamps.length >= maxRequests) {
    console.warn(`[Rate Limiter Warning] User "${userId}" exceeded rate limit (${validTimestamps.length}/${maxRequests} reqs in 60s).`);
    return res.status(429).json({
      content: `Rate limit exceeded. ADDI allows up to ${maxRequests} requests per minute per user. Please wait a few seconds before sending another message.`,
      error: "RATE_LIMIT_EXCEEDED",
      retryAfter: Math.ceil((validTimestamps[0] + RATE_LIMIT_WINDOW_MS - now) / 1000)
    });
  }

  validTimestamps.push(now);
  next();
}
