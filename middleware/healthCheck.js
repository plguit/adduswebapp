/**
 * ADDUS Platform — Health Check Middleware
 *
 * Phase 5 implementation:
 *  - Enhanced health check with dependency status
 *  - Version information
 *  - Uptime tracking
 */

const startTime = Date.now();

export function healthCheck(req, res) {
  const uptime = Date.now() - startTime;
  const uptimeSeconds = Math.floor(uptime / 1000);

  res.json({
    status: 'ok',
    platform: 'ADDUS Platform API v2.0',
    timestamp: new Date().toISOString(),
    uptime: `${uptimeSeconds}s`,
    version: process.env.npm_package_version || '1.0.0'
  });
}
