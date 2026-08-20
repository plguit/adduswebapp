/**
 * Phase 1 Tests — SSRF Protection, URL Validation, Source Classification
 * Uses Node.js built-in test runner (node:test)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Import the modules under test
import {
  parseIp,
  ipv4ToBigInt,
  ipv6ToBigInt,
  cidrContains,
  isBlockedIp,
  isBlockedHostname,
  resolveHostname,
  validateResolvedAddresses,
  validateHostnameForFetch
} from '../backend/utils/ssrfProtection.js';

import { validateAndNormalizeUrl } from '../backend/routes/websiteRetrievalService.js';

// ─────────────────────────────────────────────────────────
// IP Parsing Tests
// ─────────────────────────────────────────────────────────

describe('parseIp', () => {
  it('should parse valid IPv4 addresses', () => {
    const result = parseIp('192.168.1.1');
    assert.strictEqual(result.type, 'IPv4');
    assert.strictEqual(result.normalized, '192.168.1.1');
  });

  it('should parse IPv4-mapped IPv6 addresses', () => {
    const result = parseIp('::ffff:127.0.0.1');
    assert.strictEqual(result.type, 'IPv4');
    assert.strictEqual(result.normalized, '127.0.0.1');
  });

  it('should parse compressed IPv6', () => {
    const result = parseIp('::1');
    assert.strictEqual(result.type, 'IPv6');
    assert.strictEqual(result.normalized, '::1');
  });

  it('should parse full IPv6', () => {
    const result = parseIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    assert.strictEqual(result.type, 'IPv6');
  });

  it('should parse IPv6 loopback', () => {
    const result = parseIp('::1');
    assert.strictEqual(result.type, 'IPv6');
  });

  it('should parse IPv6 unique local', () => {
    const result = parseIp('fc00::1');
    assert.strictEqual(result.type, 'IPv6');
  });

  it('should parse IPv6 link-local', () => {
    const result = parseIp('fe80::1');
    assert.strictEqual(result.type, 'IPv6');
  });

  it('should throw on invalid IP', () => {
    assert.throws(() => parseIp('not-an-ip'));
  });
});

// ─────────────────────────────────────────────────────────
// CIDR Tests
// ─────────────────────────────────────────────────────────

describe('cidrContains', () => {
  it('should match IPv4 within range', () => {
    assert.strictEqual(cidrContains('10.0.0.0/8', '10.5.5.5'), true);
  });

  it('should reject IPv4 outside range', () => {
    assert.strictEqual(cidrContains('10.0.0.0/8', '11.0.0.1'), false);
  });

  it('should match loopback', () => {
    assert.strictEqual(cidrContains('127.0.0.0/8', '127.0.0.1'), true);
  });

  it('should match private 192.168', () => {
    assert.strictEqual(cidrContains('192.168.0.0/16', '192.168.1.100'), true);
  });

  it('should match link-local', () => {
    assert.strictEqual(cidrContains('169.254.0.0/16', '169.254.169.254'), true);
  });

  it('should match cloud metadata endpoint', () => {
    assert.strictEqual(cidrContains('169.254.0.0/16', '169.254.169.254'), true);
  });

  it('should match IPv6 loopback', () => {
    assert.strictEqual(cidrContains('::1/128', '::1'), true);
  });

  it('should match IPv6 unique local', () => {
    assert.strictEqual(cidrContains('fc00::/7', 'fc00::1'), true);
    assert.strictEqual(cidrContains('fd00::/8', 'fd00::1'), true);
  });

  it('should match IPv6 link-local', () => {
    assert.strictEqual(cidrContains('fe80::/10', 'fe80::1'), true);
  });

  it('should match IPv4-mapped IPv6', () => {
    assert.strictEqual(cidrContains('127.0.0.0/8', '::ffff:127.0.0.1'), true);
    assert.strictEqual(cidrContains('10.0.0.0/8', '::ffff:10.0.0.1'), true);
  });

  it('should reject public IPv4', () => {
    assert.strictEqual(cidrContains('10.0.0.0/8', '8.8.8.8'), false);
    assert.strictEqual(cidrContains('192.168.0.0/16', '1.1.1.1'), false);
  });

  it('should handle 0.0.0.0', () => {
    assert.strictEqual(cidrContains('0.0.0.0/8', '0.0.0.1'), true);
  });
});

// ─────────────────────────────────────────────────────────
// Blocked IP Tests
// ─────────────────────────────────────────────────────────

describe('isBlockedIp', () => {
  const blockedIPs = [
    '127.0.0.1',
    '10.0.0.1',
    '172.16.0.1',
    '192.168.1.1',
    '169.254.169.254',
    '0.0.0.1',
    '::1',
    'fc00::1',
    'fd00::1',
    'fe80::1',
    'ff02::1',
    '::ffff:127.0.0.1',
    '::ffff:10.0.0.1',
    '224.0.0.1',
    '240.0.0.1'
  ];

  for (const ip of blockedIPs) {
    it(`should block ${ip}`, () => {
      assert.strictEqual(isBlockedIp(ip), true, `${ip} should be blocked`);
    });
  }

  const publicIPs = [
    '8.8.8.8',
    '1.1.1.1',
    '208.67.222.222',
    '2001:4860:4860::8888',
    '2606:4700:4700::1111'
  ];

  for (const ip of publicIPs) {
    it(`should allow ${ip}`, () => {
      assert.strictEqual(isBlockedIp(ip), false, `${ip} should be allowed`);
    });
  }
});

// ─────────────────────────────────────────────────────────
// Blocked Hostname Tests
// ─────────────────────────────────────────────────────────

describe('isBlockedHostname', () => {
  it('should block localhost', () => {
    assert.strictEqual(isBlockedHostname('localhost'), true);
  });

  it('should block metadata.google.internal', () => {
    assert.strictEqual(isBlockedHostname('metadata.google.internal'), true);
  });

  it('should allow example.com', () => {
    assert.strictEqual(isBlockedHostname('example.com'), false);
  });
});

// ─────────────────────────────────────────────────────────
// URL Validation Tests
// ─────────────────────────────────────────────────────────

describe('validateAndNormalizeUrl', () => {
  it('should reject null/undefined', () => {
    const result = validateAndNormalizeUrl(null);
    assert.strictEqual(result.isValid, false);
  });

  it('should reject empty string', () => {
    const result = validateAndNormalizeUrl('');
    assert.strictEqual(result.isValid, false);
  });

  it('should reject excessively long URLs', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2048);
    const result = validateAndNormalizeUrl(longUrl);
    assert.strictEqual(result.isValid, false);
  });

  it('should reject URLs with embedded credentials', () => {
    const result = validateAndNormalizeUrl('https://user:pass@example.com');
    assert.strictEqual(result.isValid, false);
  });

  it('should accept valid HTTPS URLs', () => {
    const result = validateAndNormalizeUrl('https://example.com');
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.normalizedUrl, 'https://example.com/');
  });

  it('should add https:// if missing', () => {
    const result = validateAndNormalizeUrl('example.com');
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.normalizedUrl, 'https://example.com/');
  });

  it('should reject URLs without domain', () => {
    const result = validateAndNormalizeUrl('https://localhost');
    assert.strictEqual(result.isValid, false);
  });

  it('should reject malformed URLs', () => {
    const result = validateAndNormalizeUrl('://invalid');
    assert.strictEqual(result.isValid, false);
  });
});

// ─────────────────────────────────────────────────────────
// Source Classification Tests
// ─────────────────────────────────────────────────────────

describe('businessSourceClassification', () => {
  // We'll test classifyBusinessSource indirectly through retrieveWebsiteEvidence
  // or we can export it for direct testing. For now, we'll verify the
  // classification logic through the retrieval service's behavior.
  
  it('should have classification function accessible', async () => {
    // This test verifies the module exports are correct
    const module = await import('../backend/routes/websiteRetrievalService.js');
    assert.ok(typeof module.retrieveWebsiteEvidence === 'function');
  });
});

// ─────────────────────────────────────────────────────────
// DNS Resolution Tests
// ─────────────────────────────────────────────────────────

describe('DNS resolution', () => {
  it('should resolve both A and AAAA for public hostnames', async () => {
    const result = await resolveHostname('example.com');
    assert.ok(Array.isArray(result.addresses));
    assert.ok(result.attempted.ipv4);
    assert.ok(result.attempted.ipv6);
    assert.ok(result.addresses.length > 0, 'Should resolve at least one address');
  });

  it('should validate resolved addresses', async () => {
    const resolution = await resolveHostname('example.com');
    const validation = validateResolvedAddresses(resolution);
    assert.ok(validation.safe, 'example.com should resolve to safe addresses');
    assert.ok(validation.safeAddresses.length > 0);
  });

  it('should reject hostnames that resolve to blocked IPs', async () => {
    // This test requires a hostname that resolves to a private IP.
    // We'll use a known one or skip if not available.
    // For now, we test the validation function directly.
    const mockResolution = {
      hostname: 'test.local',
      addresses: [
        { ip: '127.0.0.1', family: 4 },
        { ip: '192.168.1.1', family: 4 }
      ],
      attempted: { ipv4: true, ipv6: false },
      errors: { ipv4: null, ipv6: null }
    };
    const validation = validateResolvedAddresses(mockResolution);
    assert.strictEqual(validation.safe, false);
    assert.ok(validation.blockedAddresses.length > 0);
  });
});

// ─────────────────────────────────────────────────────────
// Edge Cases
// ─────────────────────────────────────────────────────────

describe('Edge cases', () => {
  it('should handle empty address sets', async () => {
    const mockResolution = {
      hostname: 'nonexistent.invalid',
      addresses: [],
      attempted: { ipv4: true, ipv6: true },
      errors: { ipv4: 'ENODATA', ipv6: 'ENODATA' }
    };
    const validation = validateResolvedAddresses(mockResolution);
    assert.strictEqual(validation.safe, false);
    assert.strictEqual(validation.reason, 'DNS resolution returned no addresses');
  });

  it('should handle IPv6 compressed notation', () => {
    const result = parseIp('2001:db8::1');
    assert.strictEqual(result.type, 'IPv6');
  });

  it('should handle IPv6 all zeros', () => {
    const result = parseIp('::');
    assert.strictEqual(result.type, 'IPv6');
  });

  it('should block 0.0.0.0', () => {
    assert.strictEqual(isBlockedIp('0.0.0.0'), true);
  });

  it('should block multicast 224.0.0.1', () => {
    assert.strictEqual(isBlockedIp('224.0.0.1'), true);
  });

  it('should block reserved 240.0.0.1', () => {
    assert.strictEqual(isBlockedIp('240.0.0.1'), true);
  });
});

console.log('Phase 1 tests loaded. Run with: node --test tests/');
