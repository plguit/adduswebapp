/**
 * ADDUS Platform — SSRF Protection & IP Classification
 * 
 * Provides:
 * - IPv4/IPv6 parsing and normalization
 * - CIDR range containment checks
 * - Blocked-address classification
 * - DNS resolution with full A+AAA validation
 * 
 * No external dependencies. Uses only Node.js built-in modules.
 */

import dns from 'dns';
import { promisify } from 'util';
import https from 'https';

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

const DNS_RESOLVE_TIMEOUT_MS = 3000;
const DNS_OVER_HTTPS_URL = 'https://dns.google/resolve';
const DNS_FALLBACK_TIMEOUT = 5000;

function withTimeout(promise, timeoutMs, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

// ─────────────────────────────────────────────────────────
// 1. IP Parsing & Normalization
// ─────────────────────────────────────────────────────────

/**
 * Convert an IPv4 string to a 32-bit unsigned integer (BigInt).
 */
export function ipv4ToBigInt(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => Number.isNaN(p) || p < 0 || p > 255)) {
    throw new Error(`Invalid IPv4 address: ${ip}`);
  }
  return (
    (BigInt(parts[0]) << 24n) |
    (BigInt(parts[1]) << 16n) |
    (BigInt(parts[2]) << 8n)  |
    (BigInt(parts[3]))
  );
}

/**
 * Convert an IPv6 string to a 128-bit unsigned integer (BigInt).
 * Handles compressed notation (::), IPv4-mapped IPv6, etc.
 */
export function ipv6ToBigInt(ip) {
  // Handle IPv4-mapped IPv6: ::ffff:192.168.1.1
  const ipv4MappedMatch = ip.match(/^::ffff:([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)$/);
  if (ipv4MappedMatch) {
    return ipv4ToBigInt(ipv4MappedMatch[1]);
  }

  // Expand compressed IPv6
  const segments = ip.split(':');
  if (segments.length > 8) {
    throw new Error(`Invalid IPv6 address: ${ip}`);
  }

  // Count empty segments (compression)
  const emptyIndex = segments.indexOf('');
  if (emptyIndex !== -1) {
    const nonEmptyCount = segments.filter(s => s !== '').length;
    const fillCount = 8 - nonEmptyCount;
    const expanded = [];
    let filling = false;
    for (const seg of segments) {
      if (seg === '') {
        if (!filling) {
          for (let j = 0; j < fillCount; j++) {
            expanded.push('0000');
          }
          filling = true;
        }
        // Skip subsequent empty strings in the contiguous block
      } else {
        expanded.push(seg.padStart(4, '0'));
      }
    }
    return segmentsFromExpanded(expanded);
  }

  return segmentsFromExpanded(segments.map(s => s.padStart(4, '0')));
}

function segmentsFromExpanded(segments) {
  if (segments.length !== 8) {
    throw new Error(`Invalid IPv6 expansion: ${segments.join(':')}`);
  }
  let value = 0n;
  for (const seg of segments) {
    value = (value << 16n) | BigInt(parseInt(seg, 16));
  }
  return value;
}

/**
 * Normalize any IP string to a consistent representation.
 * Returns { type: 'IPv4' | 'IPv6', normalized: string, bigInt: BigInt }
 */
export function parseIp(ip) {
  if (!ip || typeof ip !== 'string') {
    throw new Error('IP address is required');
  }

  // IPv4-mapped IPv6 (must have dotted-decimal IPv4 in last 32 bits)
  const ipv4MappedMatch = ip.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (ipv4MappedMatch) {
    const v4 = ipv4MappedMatch[1];
    const v4BigInt = ipv4ToBigInt(v4);
    return {
      type: 'IPv4',
      normalized: v4,
      bigInt: v4BigInt,
      original: ip
    };
  }

  // IPv6 (contains :)
  if (ip.includes(':')) {
    const bigInt = ipv6ToBigInt(ip);
    return {
      type: 'IPv6',
      normalized: ip.toLowerCase(),
      bigInt,
      original: ip
    };
  }

  // IPv4
  const bigInt = ipv4ToBigInt(ip);
  return {
    type: 'IPv4',
    normalized: ip,
    bigInt,
    original: ip
  };
}

// ─────────────────────────────────────────────────────────
// 2. CIDR / Range Matching
// ─────────────────────────────────────────────────────────

/**
 * Parse CIDR notation into { network: BigInt, mask: BigInt, prefixLength: number }
 */
export function parseCidr(cidr) {
  const [networkStr, prefixStr] = cidr.split('/');
  const prefixLength = parseInt(prefixStr, 10);
  if (Number.isNaN(prefixLength) || prefixLength < 0 || prefixLength > 128) {
    throw new Error(`Invalid CIDR prefix length: ${prefixStr}`);
  }

  const parsed = parseIp(networkStr);
  if (parsed.type === 'IPv6') {
    if (prefixLength > 128) throw new Error(`IPv6 prefix too long: ${prefixLength}`);
    const mask = prefixLength === 0 ? 0n : (~0n) << (128n - BigInt(prefixLength));
    return { ...parsed, mask, prefixLength, cidr };
  } else {
    if (prefixLength > 32) throw new Error(`IPv4 prefix too long: ${prefixLength}`);
    const mask = prefixLength === 0 ? 0n : (~0n) << (32n - BigInt(prefixLength));
    return { ...parsed, mask, prefixLength, cidr };
  }
}

/**
 * Check if an IP falls within a CIDR range.
 */
export function cidrContains(cidr, ip) {
  const range = parseCidr(cidr);
  const target = parseIp(ip);
  if (range.type !== target.type) return false;
  const masked = target.bigInt & range.mask;
  return masked === range.bigInt;
}

// ─────────────────────────────────────────────────────────
// 3. Blocked IP Classification
// ─────────────────────────────────────────────────────────

const BLOCKED_IPV4_CIDRS = [
  '0.0.0.0/8',        // "This" network
  '10.0.0.0/8',       // RFC1918 private
  '100.64.0.0/10',    // Shared address space (RFC6598)
  '127.0.0.0/8',      // Loopback
  '169.254.0.0/16',   // Link-local / cloud metadata
  '172.16.0.0/12',    // RFC1918 private
  '192.0.0.0/24',     // IETF Protocol Assignments
  '192.0.2.0/24',     // TEST-NET-1 (documentation)
  '192.168.0.0/16',   // RFC1918 private
  '198.18.0.0/15',    // Network benchmark tests
  '198.51.100.0/24',  // TEST-NET-2 (documentation)
  '203.0.113.0/24',   // TEST-NET-3 (documentation)
  '224.0.0.0/4',      // Multicast
  '240.0.0.0/4',      // Reserved
  '255.255.255.255/32' // Broadcast
];

const BLOCKED_IPV6_CIDRS = [
  '::/128',           // Unspecified
  '::1/128',          // Loopback
  '::ffff:0:0/96',    // IPv4-mapped (handled separately, but block anyway for safety)
  'fc00::/7',         // Unique local
  'fe80::/10',        // Link-local
  'ff00::/8',         // Multicast
  '2001:db8::/32',    // Documentation (RFC3849)
  '2001:10::/28',     // ORCHID (deprecated)
  '3fff::/20',        // Formerly reserved for 6bone
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'metadata.google.internal',
  'metadata.internal',
  'metadata.google',
];

/**
 * Check if an IP address is blocked (private, loopback, link-local, etc.).
 */
export function isBlockedIp(ip) {
  try {
    const parsed = parseIp(ip);
    
    // Check IPv4-mapped IPv6 first (normalize and check IPv4 rules)
    if (parsed.original.startsWith('::ffff:')) {
      const v4 = parsed.original.slice(7);
      return BLOCKED_IPV4_CIDRS.some(cidr => cidrContains(cidr, v4));
    }

    // Check by type
    if (parsed.type === 'IPv4') {
      return BLOCKED_IPV4_CIDRS.some(cidr => cidrContains(cidr, parsed.normalized));
    }

    // IPv6
    return BLOCKED_IPV6_CIDRS.some(cidr => cidrContains(cidr, parsed.normalized));
  } catch (err) {
    // If we cannot parse the IP, treat it as blocked
    return true;
  }
}

/**
 * Check if a hostname is explicitly blocked.
 */
export function isBlockedHostname(hostname) {
  const lower = hostname.toLowerCase().trim();
  return BLOCKED_HOSTNAMES.some(blocked => lower === blocked || lower.endsWith('.' + blocked.toLowerCase()));
}

// ─────────────────────────────────────────────────────────
// 4. DNS Resolution with Full Validation
// ─────────────────────────────────────────────────────────

/**
 * Resolve A and AAAA records for a hostname.
 * Returns explicit resolution state for security auditing.
 * Falls back to DNS-over-HTTPS (Google) if system DNS fails.
 */
export async function resolveHostname(hostname) {
  const result = {
    hostname,
    addresses: [],
    attempted: { ipv4: false, ipv6: false },
    errors: { ipv4: null, ipv6: null },
    fallbackUsed: false
  };

  // Resolve IPv4
  result.attempted.ipv4 = true;
  try {
    const ipv4Addresses = await withTimeout(resolve4(hostname), DNS_RESOLVE_TIMEOUT_MS, 'IPv4 DNS resolution');
    result.addresses.push(...ipv4Addresses.map(ip => ({ ip, family: 4 })));
  } catch (err) {
    result.errors.ipv4 = err.message;
    // ENODATA (no A records) is not a failure; other errors are noted
  }

  // Resolve IPv6
  result.attempted.ipv6 = true;
  try {
    const ipv6Addresses = await withTimeout(resolve6(hostname), DNS_RESOLVE_TIMEOUT_MS, 'IPv6 DNS resolution');
    result.addresses.push(...ipv6Addresses.map(ip => ({ ip, family: 6 })));
  } catch (err) {
    result.errors.ipv6 = err.message;
  }

  // Fallback to DNS-over-HTTPS if system DNS returned no addresses
  if (result.addresses.length === 0) {
    result.fallbackUsed = true;
    try {
      const dohAddresses = await resolveDnsOverHttps(hostname);
      result.addresses.push(...dohAddresses);
      result.errors.ipv4 = null;
      result.errors.ipv6 = null;
    } catch (dohErr) {
      result.errors.ipv4 = result.errors.ipv4 || dohErr.message;
      result.errors.ipv6 = result.errors.ipv6 || dohErr.message;
    }
  }

  return result;
}

/**
 * Query Google DNS-over-HTTPS for A and AAAA records.
 */
async function resolveDnsOverHttps(hostname) {
  const addresses = [];

  // Query A records
  try {
    const aRecords = await dohQuery(hostname, 1); // 1 = A
    addresses.push(...aRecords.map(ip => ({ ip, family: 4 })));
  } catch (err) {
    // A records not found or query failed
  }

  // Query AAAA records
  try {
    const aaaaRecords = await dohQuery(hostname, 28); // 28 = AAAA
    addresses.push(...aaaaRecords.map(ip => ({ ip, family: 6 })));
  } catch (err) {
    // AAAA records not found or query failed
  }

  return addresses;
}

/**
 * Perform a single DNS-over-HTTPS query.
 * @param {string} hostname
 * @param {number} type - DNS record type (1=A, 28=AAAA)
 * @returns {Promise<string[]>} Array of IP addresses
 */
function dohQuery(hostname, type) {
  return new Promise((resolve, reject) => {
    const url = new URL(DNS_OVER_HTTPS_URL);
    url.searchParams.set('name', hostname);
    url.searchParams.set('type', type);

    const req = https.request(url, {
      method: 'GET',
      timeout: DNS_FALLBACK_TIMEOUT,
      headers: {
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.Status !== 0) {
            reject(new Error(`DNS query failed with status ${json.Status}`));
            return;
          }
          const ips = json.Answer
            .filter(a => a.type === type)
            .map(a => a.data);
          resolve(ips);
        } catch (e) {
          reject(new Error(`Failed to parse DNS response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('DNS-over-HTTPS request timed out'));
    });

    req.end();
  });
}

/**
 * Validate all resolved addresses for a hostname.
 * Returns validation result with explicit pass/fail per address.
 */
export function validateResolvedAddresses(resolutionResult) {
  const validation = {
    hostname: resolutionResult.hostname,
    safe: false,
    blockedAddresses: [],
    safeAddresses: [],
    reason: null
  };

  const { addresses } = resolutionResult;

  if (addresses.length === 0) {
    validation.reason = 'DNS resolution returned no addresses';
    return validation;
  }

  for (const entry of addresses) {
    if (isBlockedIp(entry.ip)) {
      validation.blockedAddresses.push({ ip: entry.ip, family: entry.family });
    } else {
      validation.safeAddresses.push({ ip: entry.ip, family: entry.family });
    }
  }

  if (validation.blockedAddresses.length > 0) {
    validation.reason = `Blocked addresses resolved: ${validation.blockedAddresses.map(a => a.ip).join(', ')}`;
    return validation;
  }

  if (validation.safeAddresses.length === 0) {
    validation.reason = 'No safe addresses resolved';
    return validation;
  }

  validation.safe = true;
  return validation;
}

/**
 * Complete hostname validation: resolve + check all addresses.
 * Returns the validated safe addresses or throws.
 */
export async function validateHostnameForFetch(hostname) {
  // Check explicit hostname blocklist first
  if (isBlockedHostname(hostname)) {
    throw new Error(`Hostname is explicitly blocked: ${hostname}`);
  }

  // Resolve both A and AAAA
  const resolution = await resolveHostname(hostname);
  
  // Validate ALL resolved addresses
  const validation = validateResolvedAddresses(resolution);
  
  if (!validation.safe) {
    throw new Error(validation.reason || 'Hostname resolves to blocked addresses');
  }

  return validation.safeAddresses;
}
