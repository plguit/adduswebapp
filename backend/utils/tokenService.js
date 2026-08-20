/**
 * ADDUS Platform — Token Service
 *
 * Minimal HMAC-based token service using Node.js built-in crypto.
 * No external dependencies.
 *
 * Token structure (JWT-like, but simplified):
 *   header.payload.signature
 *
 * Payload:
 *   {
 *     userId: string,
 *     role: 'CUSTOMER' | 'ADMIN' | 'EXPERT',
 *     iat: number (epoch seconds),
 *     exp: number (epoch seconds)
 *   }
 */

import crypto from 'crypto';

const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET;

if (!TOKEN_SECRET) {
  throw new Error('AUTH_TOKEN_SECRET environment variable is required. Application startup aborted.');
}

const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function base64UrlEncode(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

export function generateToken({ userId, role = 'CUSTOMER', creatorId }) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    userId,
    role,
    creatorId: creatorId || null,
    iat: now,
    exp: now + Math.floor(TOKEN_EXPIRY_MS / 1000)
  };

  const headerB64 = base64UrlEncode(Buffer.from(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(Buffer.from(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(signingInput)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${signingInput}.${signature}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token is required' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Invalid token format' };
  }

  const [headerB64, payloadB64, signature] = parts;
  const signingInput = `${headerB64}.${payloadB64}`;

  const expectedSignature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(signingInput)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  if (signature !== expectedSignature) {
    return { valid: false, error: 'Invalid token signature' };
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf-8'));

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token expired' };
    }

    return {
      valid: true,
      payload: {
        userId: payload.userId,
        role: payload.role,
        creatorId: payload.creatorId || null,
        iat: payload.iat,
        exp: payload.exp
      }
    };
  } catch {
    return { valid: false, error: 'Invalid token payload' };
  }
}

export function extractBearerToken(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

export function getTokenExpiryMs() {
  return TOKEN_EXPIRY_MS;
}
