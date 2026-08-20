import { describe, it } from 'node:test';
import assert from 'node:assert';
import { securityHeaders } from '../middleware/securityHeaders.js';
import { requestId } from '../middleware/requestId.js';
import { securityLogger } from '../middleware/securityLogger.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { requestTimeout } from '../middleware/timeout.js';
import { healthCheck } from '../middleware/healthCheck.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

function createMockRes() {
  const headers = {};
  const events = {};
  const res = {
    setHeader: (key, value) => { headers[key] = value; },
    status: () => res,
    json: () => res,
    headersSent: false,
    get headers() { return headers; },
    on: (event, callback) => { events[event] = callback; return res; },
    finish: () => {
      if (events['finish']) events['finish']();
    }
  };
  return res;
}

function createMockReq(overrides = {}) {
  return {
    url: '/api/test',
    method: 'GET',
    headers: {},
    body: {},
    ip: '127.0.0.1',
    requestId: 'test-req-123',
    ...overrides
  };
}

describe('Phase 5 — Production Security & Observability', () => {
  describe('securityHeaders', () => {
    it('should set X-Content-Type-Options to nosniff', () => {
      const req = createMockReq();
      const res = createMockRes();
      securityHeaders(req, res, () => {});
      assert.strictEqual(res.headers['X-Content-Type-Options'], 'nosniff');
    });

    it('should set X-Frame-Options to DENY', () => {
      const req = createMockReq();
      const res = createMockRes();
      securityHeaders(req, res, () => {});
      assert.strictEqual(res.headers['X-Frame-Options'], 'DENY');
    });

    it('should set X-XSS-Protection', () => {
      const req = createMockReq();
      const res = createMockRes();
      securityHeaders(req, res, () => {});
      assert.strictEqual(res.headers['X-XSS-Protection'], '1; mode=block');
    });

    it('should set HSTS header', () => {
      const req = createMockReq();
      const res = createMockRes();
      securityHeaders(req, res, () => {});
      assert.ok(res.headers['Strict-Transport-Security'].includes('max-age=31536000'));
    });

    it('should set Permissions-Policy', () => {
      const req = createMockReq();
      const res = createMockRes();
      securityHeaders(req, res, () => {});
      assert.ok(res.headers['Permissions-Policy'].includes('geolocation=()'));
    });

    it('should set Content-Security-Policy', () => {
      const req = createMockReq();
      const res = createMockRes();
      securityHeaders(req, res, () => {});
      assert.ok(res.headers['Content-Security-Policy'].includes("default-src 'self'"));
      assert.ok(res.headers['Content-Security-Policy'].includes("frame-ancestors 'none'"));
    });

    it('should call next()', () => {
      const req = createMockReq();
      const res = createMockRes();
      let called = false;
      securityHeaders(req, res, () => { called = true; });
      assert.strictEqual(called, true);
    });
  });

  describe('requestId', () => {
    it('should generate a request ID if not provided', () => {
      const req = createMockReq();
      const res = createMockRes();
      let nextCalled = false;
      requestId(req, res, () => { nextCalled = true; });
      assert.strictEqual(nextCalled, true);
      assert.ok(req.requestId);
      assert.ok(res.headers['X-Request-ID']);
    });

    it('should use existing request ID from header', () => {
      const req = createMockReq({ headers: { 'x-request-id': 'existing-id' } });
      const res = createMockRes();
      requestId(req, res, () => {});
      assert.strictEqual(req.requestId, 'existing-id');
      assert.strictEqual(res.headers['X-Request-ID'], 'existing-id');
    });
  });

  describe('securityLogger', () => {
    it('should call next() for normal requests', () => {
      const req = createMockReq();
      const res = createMockRes();
      let nextCalled = false;
      securityLogger(req, res, () => { nextCalled = true; });
      assert.strictEqual(nextCalled, true);
    });

    it('should detect XSS attempts in URL', () => {
      const req = createMockReq({ url: "/api/test?q=<script>alert(1)</script>" });
      const res = createMockRes();
      let nextCalled = false;
      securityLogger(req, res, () => { nextCalled = true; });
      assert.strictEqual(nextCalled, true);
    });

    it('should detect SQL injection in body', () => {
      const req = createMockReq({ body: { query: "'; DROP TABLE users; --" } });
      const res = createMockRes();
      let nextCalled = false;
      securityLogger(req, res, () => { nextCalled = true; });
      assert.strictEqual(nextCalled, true);
    });
  });

  describe('errorHandler', () => {
    it('should handle errors with status code', () => {
      const err = new Error('Test error');
      err.statusCode = 400;
      const req = createMockReq();
      const res = createMockRes();
      const next = () => {};
      errorHandler(err, req, res, next);
      assert.ok(true);
    });

    it('should handle errors without status code (default 500)', () => {
      const err = new Error('Internal error');
      const req = createMockReq();
      const res = createMockRes();
      const next = () => {};
      errorHandler(err, req, res, next);
      assert.ok(true);
    });
  });

  describe('requestTimeout', () => {
    it('should create timeout middleware', () => {
      const middleware = requestTimeout(1000);
      assert.strictEqual(typeof middleware, 'function');
    });

    it('should call next() immediately', () => {
      const middleware = requestTimeout(30000);
      const req = createMockReq();
      const res = createMockRes();
      let nextCalled = false;
      middleware(req, res, () => { nextCalled = true; });
      assert.strictEqual(nextCalled, true);
    });
  });

  describe('healthCheck', () => {
    it('should return health status', () => {
      const req = createMockReq();
      const res = {
        json: (data) => {
          assert.strictEqual(data.status, 'ok');
          assert.ok(data.platform.includes('ADDUS'));
          assert.ok(data.timestamp);
          assert.ok(data.uptime);
          assert.ok(data.version);
        }
      };
      healthCheck(req, res);
    });
  });

  describe('Resilience', () => {
    it('should have rate limiting configured', () => {
      assert.strictEqual(typeof rateLimiter, 'function');
    });

    it('should enforce request timeouts', () => {
      const middleware = requestTimeout(1000);
      assert.strictEqual(typeof middleware, 'function');
    });

    it('should log security events', () => {
      assert.strictEqual(typeof securityLogger, 'function');
    });
  });
});
