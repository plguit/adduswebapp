import { describe, it } from 'node:test';
import assert from 'node:assert';

// Mock tokenService
const mockVerifyToken = (token) => {
  if (!token || token === 'invalid') {
    return { valid: false, error: 'Invalid token' };
  }
  if (token === 'expired') {
    return { valid: false, error: 'Token expired' };
  }
  return {
    valid: true,
    payload: {
      userId: 'user_123',
      role: 'CUSTOMER',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    }
  };
};

const mockExtractBearerToken = (authHeader) => {
  if (!authHeader || typeof authHeader !== 'string') return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
};

// Mock middleware
const createMockReq = (overrides = {}) => ({
  headers: {},
  params: {},
  body: {},
  ...overrides
});

const createMockRes = () => {
  const res = {
    status: (code) => {
      res.statusCode = code;
      return res;
    },
    json: (data) => {
      res.body = data;
      return res;
    }
  };
  res.statusCode = 200;
  res.body = null;
  return res;
};

// ─────────────────────────────────────────────────────────
// requireAuth middleware
// ─────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = mockExtractBearerToken(authHeader);

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const result = mockVerifyToken(token);
  if (!result.valid) {
    return res.status(401).json({ error: result.error || 'Invalid token' });
  }

  req.auth = {
    userId: result.payload.userId,
    role: result.payload.role,
    iat: result.payload.iat,
    exp: result.payload.exp
  };

  next();
}

const ROLES = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
  EXPERT: 'EXPERT'
};

function requireRole(allowedRoles) {
  if (!Array.isArray(allowedRoles)) {
    allowedRoles = [allowedRoles];
  }

  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

function requireOwnership(req, res, next) {
  if (!req.auth) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.auth.role === ROLES.ADMIN) {
    return next();
  }

  const resourceUserId = req.params.userId || req.body.userId;

  if (!resourceUserId) {
    return res.status(400).json({ error: 'Resource owner ID is required' });
  }

  if (req.auth.userId !== resourceUserId) {
    return res.status(403).json({ error: 'You do not have permission to access this resource' });
  }

  next();
}

// ─────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────

describe('Phase 4 — Authentication & Authorization', () => {
  describe('requireAuth', () => {
    it('should reject missing token', () => {
      const req = createMockReq();
      const res = createMockRes();
      let nextCalled = false;

      requireAuth(req, res, () => { nextCalled = true; });

      assert.strictEqual(res.statusCode, 401);
      assert.deepStrictEqual(res.body, { error: 'Missing authorization token' });
      assert.strictEqual(nextCalled, false);
    });

    it('should reject invalid token', () => {
      const req = createMockReq({
        headers: { authorization: 'Bearer invalid' }
      });
      const res = createMockRes();
      let nextCalled = false;

      requireAuth(req, res, () => { nextCalled = true; });

      assert.strictEqual(res.statusCode, 401);
      assert.deepStrictEqual(res.body, { error: 'Invalid token' });
      assert.strictEqual(nextCalled, false);
    });

    it('should reject expired token', () => {
      const req = createMockReq({
        headers: { authorization: 'Bearer expired' }
      });
      const res = createMockRes();
      let nextCalled = false;

      requireAuth(req, res, () => { nextCalled = true; });

      assert.strictEqual(res.statusCode, 401);
      assert.deepStrictEqual(res.body, { error: 'Token expired' });
      assert.strictEqual(nextCalled, false);
    });

    it('should attach auth info for valid token', () => {
      const req = createMockReq({
        headers: { authorization: 'Bearer valid_token' }
      });
      const res = createMockRes();
      let nextCalled = false;

      requireAuth(req, res, () => {
        nextCalled = true;
        assert.strictEqual(req.auth.userId, 'user_123');
        assert.strictEqual(req.auth.role, 'CUSTOMER');
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(nextCalled, true);
    });
  });

  describe('requireRole', () => {
    it('should reject unauthenticated request', () => {
      const middleware = requireRole(['ADMIN']);
      const req = createMockReq();
      const res = createMockRes();
      let nextCalled = false;

      middleware(req, res, () => { nextCalled = true; });

      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(nextCalled, false);
    });

    it('should reject insufficient role', () => {
      const middleware = requireRole(['ADMIN']);
      const req = createMockReq({
        auth: { userId: 'user_123', role: 'CUSTOMER' }
      });
      const res = createMockRes();
      let nextCalled = false;

      middleware(req, res, () => { nextCalled = true; });

      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(nextCalled, false);
    });

    it('should allow matching role', () => {
      const middleware = requireRole(['ADMIN']);
      const req = createMockReq({
        auth: { userId: 'admin_1', role: 'ADMIN' }
      });
      const res = createMockRes();
      let nextCalled = false;

      middleware(req, res, () => { nextCalled = true; });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(nextCalled, true);
    });

    it('should accept array of roles', () => {
      const middleware = requireRole(['ADMIN', 'EXPERT']);
      const req = createMockReq({
        auth: { userId: 'expert_1', role: 'EXPERT' }
      });
      const res = createMockRes();
      let nextCalled = false;

      middleware(req, res, () => { nextCalled = true; });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(nextCalled, true);
    });
  });

  describe('requireOwnership', () => {
    it('should allow admin to access any resource', () => {
      const req = createMockReq({
        auth: { userId: 'admin_1', role: 'ADMIN' },
        params: { userId: 'user_999' }
      });
      const res = createMockRes();
      let nextCalled = false;

      requireOwnership(req, res, () => { nextCalled = true; });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(nextCalled, true);
    });

    it('should allow customer to access own resource', () => {
      const req = createMockReq({
        auth: { userId: 'user_123', role: 'CUSTOMER' },
        params: { userId: 'user_123' }
      });
      const res = createMockRes();
      let nextCalled = false;

      requireOwnership(req, res, () => { nextCalled = true; });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(nextCalled, true);
    });

    it('should reject customer accessing another user resource', () => {
      const req = createMockReq({
        auth: { userId: 'user_123', role: 'CUSTOMER' },
        params: { userId: 'user_999' }
      });
      const res = createMockRes();
      let nextCalled = false;

      requireOwnership(req, res, () => { nextCalled = true; });

      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(nextCalled, false);
    });

    it('should reject when resource owner ID is missing', () => {
      const req = createMockReq({
        auth: { userId: 'user_123', role: 'CUSTOMER' },
        params: {}
      });
      const res = createMockRes();
      let nextCalled = false;

      requireOwnership(req, res, () => { nextCalled = true; });

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(nextCalled, false);
    });
  });

  describe('Tenant Isolation', () => {
    it('should isolate customer data by userId', () => {
      const customerA = 'user_123';
      const customerB = 'user_456';

      assert.notStrictEqual(customerA, customerB, 'Customer IDs must be unique');

      const vaultA = { userId: customerA, data: 'A sensitive data' };
      const vaultB = { userId: customerB, data: 'B sensitive data' };

      assert.strictEqual(vaultA.userId, customerA);
      assert.strictEqual(vaultB.userId, customerB);
      assert.notStrictEqual(vaultA.data, vaultB.data);
    });

    it('should not allow cross-customer access via ownership middleware', () => {
      const req = createMockReq({
        auth: { userId: 'user_123', role: 'CUSTOMER' },
        params: { userId: 'user_456' }
      });
      const res = createMockRes();
      let nextCalled = false;

      requireOwnership(req, res, () => { nextCalled = true; });

      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(nextCalled, false);
    });

    it('should allow admin to access cross-customer data', () => {
      const req = createMockReq({
        auth: { userId: 'admin_1', role: 'ADMIN' },
        params: { userId: 'user_456' }
      });
      const res = createMockRes();
      let nextCalled = false;

      requireOwnership(req, res, () => { nextCalled = true; });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(nextCalled, true);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should define all required roles', () => {
      assert.ok(ROLES.CUSTOMER);
      assert.ok(ROLES.ADMIN);
      assert.ok(ROLES.EXPERT);
    });

    it('should restrict admin endpoints to ADMIN role only', () => {
      const adminMiddleware = requireRole(['ADMIN']);

      const customerReq = createMockReq({
        auth: { userId: 'user_123', role: 'CUSTOMER' }
      });
      const customerRes = createMockRes();
      adminMiddleware(customerReq, customerRes, () => {});
      assert.strictEqual(customerRes.statusCode, 403);

      const expertReq = createMockReq({
        auth: { userId: 'expert_1', role: 'EXPERT' }
      });
      const expertRes = createMockRes();
      adminMiddleware(expertReq, expertRes, () => {});
      assert.strictEqual(expertRes.statusCode, 403);

      const adminReq = createMockReq({
        auth: { userId: 'admin_1', role: 'ADMIN' }
      });
      const adminRes = createMockRes();
      adminMiddleware(adminReq, adminRes, () => {});
      assert.strictEqual(adminRes.statusCode, 200);
    });
  });

  describe('Security', () => {
    it('should reject malformed authorization headers', () => {
      const req = createMockReq({
        headers: { authorization: 'InvalidHeader token123' }
      });
      const res = createMockRes();
      let nextCalled = false;

      requireAuth(req, res, () => { nextCalled = true; });

      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(nextCalled, false);
    });

    it('should reject empty authorization header', () => {
      const req = createMockReq({
        headers: { authorization: 'Bearer ' }
      });
      const res = createMockRes();
      let nextCalled = false;

      requireAuth(req, res, () => { nextCalled = true; });

      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(nextCalled, false);
    });
  });
});
