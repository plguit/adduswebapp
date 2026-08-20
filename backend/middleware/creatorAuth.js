/**
 * ADDUS Platform — Creator Authentication Middleware
 *
 * Phase 1 implementation:
 *  - JWT validation for creators
 *  - Creator-specific ownership checks
 *  - Active creator verification
 */

import { verifyToken, extractBearerToken } from '../utils/tokenService.js';
import { getCreatorVault } from '../services/creatorVaultService.js';

function authError(res, status, error) {
  return res.status(status).json({ error });
}

export function requireCreatorAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);

  if (!token) {
    return authError(res, 401, 'Missing authorization token');
  }

  const result = verifyToken(token);
  if (!result.valid) {
    return authError(res, 401, result.error || 'Invalid token');
  }

  if (result.payload.role !== 'CREATOR') {
    return authError(res, 403, 'Creator access required');
  }

  req.auth = {
    userId: result.payload.userId,
    role: result.payload.role,
    creatorId: result.payload.creatorId,
    iat: result.payload.iat,
    exp: result.payload.exp
  };

  next();
}

export async function requireActiveCreator(req, res, next) {
  if (!req.auth) {
    return authError(res, 401, 'Authentication required');
  }

  try {
    const vault = getCreatorVault(req.auth.creatorId);

    if (!vault) {
      return authError(res, 404, 'Creator profile not found');
    }

    if (vault.blocked === true) {
      return authError(res, 403, 'Your account has been blocked. Please contact support at addusindia@gmail.com');
    }

    if (vault.verificationStatus === 'rejected') {
      return authError(res, 403, 'Your profile was rejected. Please complete and resubmit your profile.');
    }

    req.creator = { ...req.auth, vault };
    next();
  } catch (err) {
    return authError(res, 500, 'Failed to verify creator status');
  }
}

export function requireCreatorOwnership(req, res, next) {
  if (!req.auth) {
    return authError(res, 401, 'Authentication required');
  }

  const resourceCreatorId = req.params.creatorId || req.body.creatorId;

  if (!resourceCreatorId) {
    return authError(res, 400, 'Resource creator ID is required');
  }

  if (req.auth.creatorId !== resourceCreatorId && req.auth.role !== 'ADMIN') {
    return authError(res, 403, 'You do not have permission to access this resource');
  }

  next();
}

export function requireCreatorRole(allowedRoles) {
  if (!Array.isArray(allowedRoles)) {
    allowedRoles = [allowedRoles];
  }

  return (req, res, next) => {
    if (!req.auth) {
      return authError(res, 401, 'Authentication required');
    }

    if (req.auth.role !== 'CREATOR') {
      return authError(res, 403, 'Creator role required');
    }

    if (!allowedRoles.includes(req.auth.creatorRole)) {
      return authError(res, 403, 'Insufficient creator permissions');
    }

    next();
  };
}
