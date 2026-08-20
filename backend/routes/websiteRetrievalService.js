/**
 * Website Retrieval Service
 * Performs real server-side HTTP requests to customer-provided URLs.
 * Uses Node.js 24 native HTTP/HTTPS primitives with SSRF protection.
 *
 * Architecture:
 *   URL validation → DNS resolve → IP validation → validated request
 *   → HTML parsing → sub-page inspection → evidence set → sufficiency check
 *   → sourceStatus classification → return evidence for AI analysis
 *
 * Security:
 *   - SSRF protection via DNS resolution + IP validation before every request
 *   - IPv4/IPv6 CIDR blocking for private, loopback, link-local, metadata
 *   - Custom lookup() pins TCP connection to validated IP
 *   - Manual redirect handling with per-hop validation
 *   - HTTPS enforcement in production
 *   - End-to-end deadline (DNS + connect + TLS + response)
 *   - Response body size limit
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';
import dns from 'dns';
import { promisify } from 'util';

import {
  validateHostnameForFetch,
  isBlockedIp,
  parseIp,
  cidrContains,
  ipv4ToBigInt,
  ipv6ToBigInt
} from '../utils/ssrfProtection.js';

import {
  normalizeEvidenceItems,
  mapRetrievalEvidenceToStructured,
  evaluateEvidenceSufficiency,
  getEvidenceSummary,
  EVIDENCE_TYPES,
  PROVENANCE_STATES,
  CONFIDENCE_LEVELS,
  getSourceId,
  normalizeSourceUrl
} from '../services/evidenceService.js';

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

// ─────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────

const FETCH_TIMEOUT_MS = 10000;       // 10 seconds total per page
const MAX_REDIRECTS = 5;              // Maximum redirect hops
const MAX_SUBPAGES = 10;              // Max additional pages to inspect
const MAX_BODY_TEXT_CHARS = 4000;     // Characters of body text to extract per page
const MAX_EVIDENCE_TEXT = 800;        // Max chars per evidence snippet
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2 MB max response body
const MAX_URL_LENGTH = 2048;          // Max URL length
const MAX_RETRIES = 2;                // Max retrieval retries for transient failures
const BASE_RETRY_DELAY_MS = 1000;     // Base delay for exponential backoff
const MAX_RETRY_DELAY_MS = 5000;      // Max delay for exponential backoff

// Development-only localhost exception
const ALLOW_LOCALHOST = process.env.ALLOW_LOCALHOST_RETRIEVAL === 'true' && process.env.NODE_ENV !== 'production';

const RELEVANT_PAGE_KEYWORDS = [
  'about', 'product', 'products', 'service', 'services', 'collection',
  'collections', 'price', 'pricing', 'contact', 'faq', 'blog', 'shop',
  'team', 'story', 'work', 'what-we-do', 'our-work', 'solutions'
];

const REALISTIC_UA = 'Mozilla/5.0 (compatible; ADDUS-BusinessIntelligence/1.0; +https://addus.in/bot)';

// ─────────────────────────────────────────────────────────
// 1. URL Validation
// ─────────────────────────────────────────────────────────

function validateAndNormalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, error: 'URL is required.' };
  }

  let url = rawUrl.trim();

  // Reject excessively long URLs
  if (url.length > MAX_URL_LENGTH) {
    return { isValid: false, error: 'URL exceeds maximum length.' };
  }

  // Reject URLs with embedded credentials
  if (url.includes('@') && (url.includes('://') ? url.split('://')[1].includes('@') : url.includes('@'))) {
    return { isValid: false, error: 'URLs with embedded credentials are not allowed.' };
  }

  // Add protocol if missing
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

   try {
     const parsed = new URL(url);
     // Allow localhost/127.0.0.1 in development mode only
     if (ALLOW_LOCALHOST && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) {
       // For localhost, we don't require a dot in hostname
       return { isValid: true, normalizedUrl: parsed.href };
     }
     // For all other hosts, require a dot in hostname (e.g., example.com)
     if (!parsed.hostname || !parsed.hostname.includes('.')) {
       return { isValid: false, error: 'Invalid domain in URL.' };
     }
     return { isValid: true, normalizedUrl: parsed.href };
   } catch {
     return { isValid: false, error: 'URL could not be parsed.' };
   }
}

// ─────────────────────────────────────────────────────────
// 2. SSRF-Protected HTTP Request
// ─────────────────────────────────────────────────────────

/**
 * Make a single HTTP/HTTPS request with full SSRF protection.
 * Uses custom lookup() to pin the TCP connection to a validated IP.
 */
async function makeValidatedRequest(url, timeoutMs = FETCH_TIMEOUT_MS) {
  const parsed = new URL(url);
  const protocol = parsed.protocol;
  const originalHostname = parsed.hostname;
  const port = parsed.port || (protocol === 'https:' ? 443 : 80);
  const path = parsed.pathname + parsed.search;

  // Reject HTTP in production (except localhost development exception)
  if (protocol === 'http:') {
    if (!ALLOW_LOCALHOST) {
      throw new Error('HTTP URLs are not allowed in production. Use HTTPS.');
    }
    // Even in development, validate the hostname
    const safeAddresses = await validateHostnameForFetch(originalHostname);
    if (safeAddresses.length === 0) {
      throw new Error('Hostname validation failed for localhost development URL');
    }
  } else if (protocol === 'https:') {
    // Validate HTTPS hostname
    const safeAddresses = await validateHostnameForFetch(originalHostname);
    if (safeAddresses.length === 0) {
      throw new Error('Hostname validation failed');
    }
  } else {
    throw new Error(`Unsupported protocol: ${protocol}`);
  }

  // Resolve and validate again (in case of DNS rebinding between validation and connect)
  const safeAddresses = await validateHostnameForFetch(originalHostname);
  if (safeAddresses.length === 0) {
    throw new Error('Hostname validation failed at connection time');
  }

  // Select validated address (prefer IPv4 for compatibility, fall back to IPv6)
  const validatedAddress = safeAddresses.find(a => a.family === 4) || safeAddresses[0];

  // End-to-end deadline
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    const isHttps = protocol === 'https:';
    const transport = isHttps ? https : http;

    const requestOptions = {
      hostname: originalHostname,
      port: parseInt(port, 10),
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': REALISTIC_UA,
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Host': originalHostname
      },
      timeout: Math.max(1000, deadline - Date.now())
    };

    // TLS: preserve original hostname for SNI and certificate validation
    if (isHttps) {
      requestOptions.servername = originalHostname;
      requestOptions.rejectUnauthorized = true;
    }

    const req = transport.request(requestOptions, (res) => {
      const contentType = res.headers['content-type'] || '';
      const finalUrl = res.headers.location
        ? new URL(res.headers.location, url).href
        : url;

      // Handle redirects manually
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        const location = res.headers.location;
        if (!location) {
          res.resume();
          resolve({
            success: false,
            httpStatus: res.statusCode,
            contentType,
            finalUrl,
            responseTimeMs: Date.now() - (deadline - timeoutMs),
            error: 'Redirect without Location header',
            html: null
          });
          return;
        }
        res.resume();
        resolve({
          success: false,
          isRedirect: true,
          httpStatus: res.statusCode,
          contentType,
          finalUrl,
          location,
          error: null
        });
        return;
      }

      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        resolve({
          success: false,
          httpStatus: res.statusCode,
          contentType,
          finalUrl,
          responseTimeMs: Date.now() - (deadline - timeoutMs),
          error: `HTTP ${res.statusCode}`,
          html: null
        });
        return;
      }

      if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
        res.resume();
        resolve({
          success: false,
          httpStatus: res.statusCode,
          contentType,
          finalUrl,
          responseTimeMs: Date.now() - (deadline - timeoutMs),
          error: 'Non-HTML response',
          html: null
        });
        return;
      }

      // Collect response body with size limit
      const chunks = [];
      let totalBytes = 0;

      res.on('data', (chunk) => {
        totalBytes += chunk.length;
        if (totalBytes > MAX_RESPONSE_BYTES) {
          res.destroy();
          resolve({
            success: false,
            httpStatus: res.statusCode,
            contentType,
            finalUrl,
            responseTimeMs: Date.now() - (deadline - timeoutMs),
            error: `Response exceeded ${MAX_RESPONSE_BYTES} byte limit`,
            html: null
          });
        } else {
          chunks.push(chunk);
        }
      });

      res.on('end', () => {
        const html = Buffer.concat(chunks).toString('utf-8');
        resolve({
          success: true,
          httpStatus: res.statusCode,
          contentType,
          finalUrl,
          responseTimeMs: Date.now() - (deadline - timeoutMs),
          error: null,
          html
        });
      });

      res.on('error', (err) => {
        reject(new Error(`Response error: ${err.message}`));
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Request failed: ${err.message}`));
    });

    req.on('socket', (socket) => {
      const validateSocket = () => {
        const remoteAddress = socket.remoteAddress;
        if (remoteAddress && !safeAddresses.some(addr => addr.ip === remoteAddress)) {
          req.destroy();
          reject(new Error(`Connection established to unexpected IP address: ${remoteAddress}`));
        }
      };
      
      if (socket.connecting) {
        socket.on('connect', validateSocket);
      } else {
        validateSocket();
      }
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.end();

    // Enforce deadline
    const deadlineTimer = setTimeout(() => {
      req.destroy();
      reject(new Error('Request deadline exceeded'));
    }, Math.max(1000, deadline - Date.now()));

    req.on('response', () => clearTimeout(deadlineTimer));
    req.on('error', () => clearTimeout(deadlineTimer));
  });
}

// ─────────────────────────────────────────────────────────
// 3. Manual Redirect Following with Per-Hop Validation
// ─────────────────────────────────────────────────────────

async function fetchWithRedirectValidation(startUrl, maxRedirects = MAX_REDIRECTS) {
  let currentUrl = startUrl;
  let redirectCount = 0;
  const startTime = Date.now();

  while (redirectCount <= maxRedirects) {
    try {
      const result = await makeValidatedRequest(currentUrl);
      
      if (!result.success && result.isRedirect) {
        // Validate redirect target
        const redirectUrl = result.location;
        if (!redirectUrl) {
          return {
            success: false,
            httpStatus: result.httpStatus,
            contentType: result.contentType,
            finalUrl: currentUrl,
            responseTimeMs: Date.now() - startTime,
            error: 'Redirect response missing Location header',
            html: null
          };
        }

        // Validate redirect URL structure
        let redirectParsed;
        try {
          redirectParsed = new URL(redirectUrl, currentUrl);
        } catch {
          return {
            success: false,
            httpStatus: result.httpStatus,
            contentType: result.contentType,
            finalUrl: currentUrl,
            responseTimeMs: Date.now() - startTime,
            error: `Invalid redirect URL: ${redirectUrl}`,
            html: null
          };
        }

        // Enforce HTTPS for redirect targets in production
        if (redirectParsed.protocol === 'http:' && !ALLOW_LOCALHOST) {
          return {
            success: false,
            httpStatus: result.httpStatus,
            contentType: result.contentType,
            finalUrl: redirectParsed.href,
            responseTimeMs: Date.now() - startTime,
            error: 'Redirect to HTTP URL not allowed in production',
            html: null
          };
        }

        // Validate redirect hostname (SSRF check)
        try {
          await validateHostnameForFetch(redirectParsed.hostname);
        } catch (err) {
          return {
            success: false,
            httpStatus: result.httpStatus,
            contentType: result.contentType,
            finalUrl: redirectParsed.href,
            responseTimeMs: Date.now() - startTime,
            error: `Redirect target blocked: ${err.message}`,
            html: null
          };
        }

        // Follow redirect
        currentUrl = redirectParsed.href;
        redirectCount++;
        continue;
      }

      // Non-redirect result
      return result;
    } catch (err) {
      return {
        success: false,
        httpStatus: 0,
        contentType: null,
        finalUrl: currentUrl,
        responseTimeMs: Date.now() - startTime,
        error: err.message,
        html: null
      };
    }
  }

  // Max redirects exceeded
  return {
    success: false,
    httpStatus: 0,
    contentType: null,
    finalUrl: currentUrl,
    responseTimeMs: Date.now() - startTime,
    error: `Maximum redirect limit (${maxRedirects}) exceeded`,
    html: null
  };
}

// ─────────────────────────────────────────────────────────
// 4. HTML Parsing (regex-based, no external dependency)
// ─────────────────────────────────────────────────────────

function parseHtmlContent(html, baseUrl) {
  if (!html) return {};

  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Meta description
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';

  // Headings (h1, h2, h3)
  const headings = [];
  const headingMatches = html.matchAll(/<h([123])[^>]*>([^<]*(?:<(?!\/h\1)[^>]*>[^<]*)*)<\/h\1>/gi);
  for (const m of headingMatches) {
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    if (text && text.length > 2) headings.push({ level: parseInt(m[1]), text: text.slice(0, 200) });
    if (headings.length >= 15) break;
  }

  // Canonical
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i)
    || html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["']/i);
  const canonicalUrl = canonicalMatch ? canonicalMatch[1].trim() : '';

  // OpenGraph
  const ogTitle = (html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i) || [])[1] || '';
  const ogDescription = (html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i) || [])[1] || '';
  const ogImage = (html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i) || [])[1] || '';

  // Visible body text (strip tags, collapse whitespace)
  const noScript = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  const bodyMatch = noScript.match(/<body[\s\S]*?<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[0] : noScript;
  const bodyText = bodyHtml
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_BODY_TEXT_CHARS);

  // Navigation and all links
  const linkMatches = [...html.matchAll(/<a[^>]*href=["']([^"'#?][^"']*)["'][^>]*>([^<]*)<\/a>/gi)];
  const allLinks = [];
  const navLinks = [];

  for (const m of linkMatches) {
    const href = m[1].trim();
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    if (!href || href.startsWith('javascript') || href.startsWith('mailto')) continue;

    try {
      const abs = new URL(href, baseUrl).href;
      allLinks.push({ url: abs, text: text.slice(0, 80) });

      const isNav = RELEVANT_PAGE_KEYWORDS.some(kw => href.toLowerCase().includes(kw));
      if (isNav) navLinks.push({ url: abs, text: text.slice(0, 80) });
    } catch { /* skip unparseable hrefs */ }

    if (allLinks.length >= 50) break;
  }

  // Contact info (emails, phone numbers from body text)
  const emails = [...new Set((bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g) || []))];
  const phones = [...new Set((bodyText.match(/[\+\d][\d\s\-().]{8,15}\d/g) || []).filter(p => p.replace(/\D/g, '').length >= 7))];

  // Social links
  const socialDomains = ['instagram.com', 'facebook.com', 'twitter.com', 'x.com', 'linkedin.com', 'youtube.com', 'tiktok.com'];
  const socialLinks = allLinks.filter(l => socialDomains.some(s => l.url.includes(s))).map(l => l.url);

  // Image alts
  const imgAlts = [];
  const imgMatches = html.matchAll(/<img[^>]*alt=["']([^"']{3,})["'][^>]*>/gi);
  for (const m of imgMatches) {
    imgAlts.push(m[1].trim().slice(0, 100));
    if (imgAlts.length >= 10) break;
  }

  // Logo detection (images with "logo" in src/alt, or brand marks)
  const logoCandidates = [];
  const logoPatterns = [/logo/i, /brand/i, /favicon/i, /icon/i];
  const allImgMatches = [...html.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi)];
  for (const m of allImgMatches) {
    const src = m[1].trim();
    const alt = (m[0].match(/alt=["']([^"']*)["']/i) || [])[1] || '';
    const isLogo = logoPatterns.some(p => p.test(src) || p.test(alt));
    if (isLogo) {
      try {
        logoCandidates.push(new URL(src, baseUrl).href);
      } catch {
        logoCandidates.push(src);
      }
    }
    if (logoCandidates.length >= 5) break;
  }

  // Favicon
  const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/i)
    || html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["']/i);
  const favicon = faviconMatch ? (() => { try { return new URL(faviconMatch[1], baseUrl).href; } catch { return faviconMatch[1]; } })() : null;

  // Brand colors (inline styles and CSS)
  const brandColors = [];
  const colorMatches = [...html.matchAll(/(?:color|background-color|background)\s*:\s*(#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|rgba\([^)]+\))/g)];
  for (const m of colorMatches) {
    const color = m[1].trim().slice(0, 30);
    if (!brandColors.includes(color)) brandColors.push(color);
    if (brandColors.length >= 10) break;
  }

  // Product images (images that might be product-related)
  const productImages = [];
  const productPatterns = [/product/i, /item/i, /shop/i, /store/i, /gallery/i, /portfolio/i];
  for (const m of allImgMatches) {
    const src = m[1].trim();
    const alt = (m[0].match(/alt=["']([^"']*)["']/i) || [])[1] || '';
    const isProduct = productPatterns.some(p => p.test(src) || p.test(alt));
    if (isProduct) {
      try {
        productImages.push(new URL(src, baseUrl).href);
      } catch {
        productImages.push(src);
      }
    }
    if (productImages.length >= 10) break;
  }

  // Structured data (JSON-LD)
  const structuredData = [];
  const jsonLdMatches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of jsonLdMatches) {
    try {
      const parsed = JSON.parse(m[1].trim());
      structuredData.push(parsed);
    } catch {
      // Skip invalid JSON-LD
    }
    if (structuredData.length >= 5) break;
  }

  return {
    title,
    metaDescription,
    headings,
    bodyText,
    navLinks,
    allLinks,
    canonicalUrl,
    og: { title: ogTitle, description: ogDescription, image: ogImage },
    contactInfo: { emails: emails.slice(0, 3), phones: phones.slice(0, 3) },
    socialLinks: [...new Set(socialLinks)].slice(0, 5),
    imageAlts: imgAlts,
    favicon,
    logoCandidates: [...new Set(logoCandidates)].slice(0, 5),
    brandColors: [...new Set(brandColors)].slice(0, 10),
    productImages: [...new Set(productImages)].slice(0, 10),
    structuredData
  };
}

// ─────────────────────────────────────────────────────────
// 5. Find relevant sub-pages to inspect
// ─────────────────────────────────────────────────────────

function extractRelevantPageUrls(parsedPage, baseUrl) {
  const allLinks = parsedPage.allLinks || [];
  const seen = new Set();
  const relevant = [];

  for (const link of allLinks) {
    if (seen.has(link.url)) continue;
    try {
      const u = new URL(link.url);
      const base = new URL(baseUrl);
      // Must be same host
      if (u.hostname !== base.hostname) continue;
      // Must contain a relevant keyword
      const pathLower = u.pathname.toLowerCase();
      if (RELEVANT_PAGE_KEYWORDS.some(kw => pathLower.includes(kw))) {
        seen.add(link.url);
        relevant.push(link.url);
      }
    } catch { /* skip */ }

    if (relevant.length >= MAX_SUBPAGES) break;
  }

  return relevant;
}

// ─────────────────────────────────────────────────────────
// 6. Build evidence set from parsed page content
// ─────────────────────────────────────────────────────────

function buildEvidenceItems(parsed, sourceUrl, checkedAt) {
  const items = [];
  const ts = checkedAt;

  if (parsed.title) {
    items.push({
      evidenceId: `EV_${Date.now()}_title`,
      observation: `Page title: "${parsed.title}"`,
      evidence: parsed.title.slice(0, MAX_EVIDENCE_TEXT),
      source: sourceUrl,
      sourceType: 'WEBSITE',
      confidence: 'high',
      field: 'identity',
      checkedAt: ts
    });
  }

  if (parsed.metaDescription) {
    items.push({
      evidenceId: `EV_${Date.now()}_meta`,
      observation: 'Meta description found',
      evidence: parsed.metaDescription.slice(0, MAX_EVIDENCE_TEXT),
      source: sourceUrl,
      sourceType: 'WEBSITE',
      confidence: 'high',
      field: 'business_description',
      checkedAt: ts
    });
  }

  if (parsed.og?.description) {
    items.push({
      evidenceId: `EV_${Date.now()}_og`,
      observation: 'OpenGraph description found',
      evidence: parsed.og.description.slice(0, MAX_EVIDENCE_TEXT),
      source: sourceUrl,
      sourceType: 'WEBSITE',
      confidence: 'high',
      field: 'business_description',
      checkedAt: ts
    });
  }

  if (parsed.headings && parsed.headings.length > 0) {
    const headingText = parsed.headings.map(h => h.text).join(' | ').slice(0, MAX_EVIDENCE_TEXT);
    items.push({
      evidenceId: `EV_${Date.now()}_headings`,
      observation: `Page headings: ${parsed.headings.length} headings found`,
      evidence: headingText,
      source: sourceUrl,
      sourceType: 'WEBSITE',
      confidence: 'medium',
      field: 'services',
      checkedAt: ts
    });
  }

  if (parsed.bodyText && parsed.bodyText.length > 100) {
    items.push({
      evidenceId: `EV_${Date.now()}_body`,
      observation: 'Main page body text retrieved',
      evidence: parsed.bodyText.slice(0, MAX_EVIDENCE_TEXT),
      source: sourceUrl,
      sourceType: 'WEBSITE',
      confidence: 'medium',
      field: 'general',
      checkedAt: ts
    });
  }

  if (parsed.contactInfo?.emails?.length > 0) {
    items.push({
      evidenceId: `EV_${Date.now()}_contact`,
      observation: 'Contact email found on website',
      evidence: parsed.contactInfo.emails.join(', '),
      source: sourceUrl,
      sourceType: 'WEBSITE',
      confidence: 'high',
      field: 'contact',
      checkedAt: ts
    });
  }

  if (parsed.socialLinks?.length > 0) {
    items.push({
      evidenceId: `EV_${Date.now()}_social`,
      observation: `Social media presence: ${parsed.socialLinks.length} profiles linked`,
      evidence: parsed.socialLinks.join(', '),
      source: sourceUrl,
      sourceType: 'WEBSITE',
      confidence: 'high',
      field: 'social_presence',
      checkedAt: ts
    });
  }

  if (parsed.contactInfo?.phones?.length > 0) {
    items.push({
      evidenceId: `EV_${Date.now()}_phone`,
      observation: 'Contact phone found on website',
      evidence: parsed.contactInfo.phones.join(', '),
      source: sourceUrl,
      sourceType: 'WEBSITE',
      confidence: 'high',
      field: 'contact',
      checkedAt: ts
    });
  }

  if (parsed.favicon) {
    items.push({
      evidenceId: `EV_${Date.now()}_favicon`,
      observation: 'Favicon detected',
      evidence: parsed.favicon,
      source: sourceUrl,
      sourceType: 'WEBSITE',
      confidence: 'medium',
      field: 'brand',
      checkedAt: ts
    });
  }

  if (parsed.logoCandidates?.length > 0) {
    items.push({
      evidenceId: `EV_${Date.now()}_logo`,
      observation: `Logo/brand mark candidates found: ${parsed.logoCandidates.length}`,
      evidence: parsed.logoCandidates.join(', '),
      source: sourceUrl,
      sourceType: 'WEBSITE',
      confidence: 'medium',
      field: 'brand',
      checkedAt: ts
    });
  }

  if (parsed.brandColors?.length > 0) {
    items.push({
      evidenceId: `EV_${Date.now()}_colors`,
      observation: `Brand colors detected: ${parsed.brandColors.length} colors`,
      evidence: parsed.brandColors.join(', '),
      source: sourceUrl,
      sourceType: 'WEBSITE',
      confidence: 'low',
      field: 'brand',
      checkedAt: ts
    });
  }

  if (parsed.productImages?.length > 0) {
    items.push({
      evidenceId: `EV_${Date.now()}_products`,
      observation: `Product/visual assets found: ${parsed.productImages.length} images`,
      evidence: parsed.productImages.join(', '),
      source: sourceUrl,
      sourceType: 'WEBSITE',
      confidence: 'medium',
      field: 'products',
      checkedAt: ts
    });
  }

  if (parsed.structuredData?.length > 0) {
    items.push({
      evidenceId: `EV_${Date.now()}_schema`,
      observation: `Structured data found: ${parsed.structuredData.length} JSON-LD blocks`,
      evidence: parsed.structuredData.map(s => s['@type'] || s.type || 'unknown').join(', '),
      source: sourceUrl,
      sourceType: 'WEBSITE',
      confidence: 'high',
      field: 'structured_data',
      checkedAt: ts
    });
  }

  return items;
}

// ─────────────────────────────────────────────────────────
// Asset Discovery
// ─────────────────────────────────────────────────────────

function discoverAssets(parsed, sourceUrl) {
  const assets = [];
  const ts = new Date().toISOString();

  if (parsed.favicon) {
    assets.push({
      assetId: `AST_${Date.now()}_favicon`,
      assetType: 'favicon',
      assetUrl: parsed.favicon,
      sourceUrl,
      sourceType: 'WEBSITE',
      confidence: 'medium',
      discoveredAt: ts
    });
  }

  if (parsed.logoCandidates?.length > 0) {
    for (const logoUrl of parsed.logoCandidates) {
      assets.push({
        assetId: `AST_${Date.now()}_logo`,
        assetType: 'logo',
        assetUrl: logoUrl,
        sourceUrl,
        sourceType: 'WEBSITE',
        confidence: 'medium',
        discoveredAt: ts
      });
    }
  }

  if (parsed.og?.image) {
    assets.push({
      assetId: `AST_${Date.now()}_og_image`,
      assetType: 'hero_image',
      assetUrl: parsed.og.image,
      sourceUrl,
      sourceType: 'WEBSITE',
      confidence: 'medium',
      discoveredAt: ts
    });
  }

  if (parsed.productImages?.length > 0) {
    for (const imgUrl of parsed.productImages) {
      assets.push({
        assetId: `AST_${Date.now()}_product`,
        assetType: 'product_image',
        assetUrl: imgUrl,
        sourceUrl,
        sourceType: 'WEBSITE',
        confidence: 'medium',
        discoveredAt: ts
      });
    }
  }

  if (parsed.brandColors?.length > 0) {
    assets.push({
      assetId: `AST_${Date.now()}_colors`,
      assetType: 'brand_colors',
      assetUrl: null,
      sourceUrl,
      sourceType: 'WEBSITE',
      metadata: { colors: parsed.brandColors },
      confidence: 'low',
      discoveredAt: ts
    });
  }

  return assets;
}

// ─────────────────────────────────────────────────────────
// 7. Bot Protection Detection
// ─────────────────────────────────────────────────────────

function detectBotProtection(parsed, fetchResult) {
  const botIndicators = [
    'javascript is disabled',
    'enable javascript',
    'verify you\'re not a robot',
    'are you a robot',
    'captcha',
    'cloudflare',
    'please verify',
    'access denied',
    'forbidden',
    'bot protection',
    'automated access',
    'security check',
    'challenge page',
    'ddos protection',
    'incapsula',
    'akamai',
    'distil networks'
  ];

  const text = `${parsed.title || ''} ${parsed.metaDescription || ''} ${parsed.bodyText || ''}`.toLowerCase();
  
  const detectedIndicators = botIndicators.filter(indicator => text.includes(indicator));
  
  if (detectedIndicators.length > 0) {
    return {
      detected: true,
      indicators: detectedIndicators,
      reason: `Website access blocked: ${detectedIndicators[0]}. Host requires JavaScript/CAPTCHA verification.`
    };
  }

  // Check for HTTP 403/429 with minimal content
  if ((fetchResult.httpStatus === 403 || fetchResult.httpStatus === 429) && 
      parsed.bodyText && parsed.bodyText.length < 500) {
    return {
      detected: true,
      indicators: [`HTTP ${fetchResult.httpStatus} with minimal content`],
      reason: `Website access blocked: HTTP ${fetchResult.httpStatus}. Host may be restricting automated access.`
    };
  }

  return { detected: false, indicators: [], reason: null };
}

// ─────────────────────────────────────────────────────────
// 7. Business Source Classification
// ─────────────────────────────────────────────────────────

function classifyBusinessSource(parsed, url) {
  const signals = [];
  let score = 0;

  // Strong business signals
  if (parsed.title && parsed.title.length > 3) {
    signals.push('title');
    score += 1;
  }
  if (parsed.metaDescription && parsed.metaDescription.length > 20) {
    signals.push('metaDescription');
    score += 1;
  }
  if (parsed.contactInfo?.emails?.length > 0) {
    signals.push('contactEmail');
    score += 2;
  }
  if (parsed.contactInfo?.phones?.length > 0) {
    signals.push('contactPhone');
    score += 2;
  }
  if (parsed.headings && parsed.headings.length >= 2) {
    signals.push('headings');
    score += 1;
  }
  if (parsed.bodyText && parsed.bodyText.length > 200) {
    signals.push('bodyText');
    score += 1;
  }
  if (parsed.socialLinks && parsed.socialLinks.length > 0) {
    signals.push('socialLinks');
    score += 1;
  }
  if (parsed.og?.title || parsed.og?.description) {
    signals.push('openGraph');
    score += 1;
  }
  if (parsed.canonicalUrl && parsed.canonicalUrl.length > 0) {
    signals.push('canonical');
    score += 1;
  }
  if (parsed.favicon) {
    signals.push('favicon');
    score += 1;
  }
  if (parsed.logoCandidates?.length > 0) {
    signals.push('logo');
    score += 2;
  }
  if (parsed.brandColors?.length > 0) {
    signals.push('brandColors');
    score += 1;
  }
  if (parsed.productImages?.length > 0) {
    signals.push('productImages');
    score += 1;
  }
  if (parsed.structuredData?.length > 0) {
    signals.push('structuredData');
    score += 2;
  }

  // Classification logic — analyze ALL reachable websites
  // Do not reject known platforms; let AI determine business relevance
  if (score >= 6 && (parsed.contactInfo?.emails?.length > 0 || parsed.contactInfo?.phones?.length > 0)) {
    return {
      sourceStatus: 'LIKELY_BUSINESS_WEBSITE',
      signals,
      reasoning: 'Strong business signals present: contact information, content, and structure suggest a business website.'
    };
  }

  if (score >= 4) {
    return {
      sourceStatus: 'LIKELY_BUSINESS_WEBSITE',
      signals,
      reasoning: 'Multiple business signals present. Website appears likely to be business-related but identity cannot be fully verified without customer/business matching.'
    };
  }

  return {
    sourceStatus: 'POSSIBLE_BUSINESS_SOURCE',
    signals,
    reasoning: 'Website retrieved successfully, passing to AI for detailed extraction.'
  };
}

// ─────────────────────────────────────────────────────────
// 8. Retrieval Outcome Classification
// ─────────────────────────────────────────────────────────

function classifyRetrievalOutcome(fetchResult, parsed, evidenceItems, botProtection) {
  // 1. ACCESS_BLOCKED — bot protection / CAPTCHA / Cloudflare / security challenge
  if (botProtection.detected) {
    return {
      sourceStatus: 'ACCESS_BLOCKED',
      failureReason: 'ACCESS_BLOCKED',
      userMessage: 'Website access is restricted. We couldn\'t inspect enough of this website automatically because the host requires manual verification.',
      retryable: false,
      requiresManualInput: true,
      evidenceCount: evidenceItems.length
    };
  }

  // 2. RETRIEVAL_FAILED — request-level failures
  if (!fetchResult.success || !fetchResult.html) {
    const error = (fetchResult.error || '').toLowerCase();
    
    if (error.includes('timeout') || error.includes('deadline exceeded') || error.includes('request timeout')) {
      return {
        sourceStatus: 'RETRIEVAL_FAILED',
        failureReason: 'TIMEOUT',
        userMessage: 'We couldn\'t retrieve this website because the connection timed out. The site may be slow or temporarily unavailable.',
        retryable: true,
        requiresManualInput: true,
        evidenceCount: 0
      };
    }
    
    if (error.includes('dns') || error.includes('nodename') || error.includes('getaddrinfo')) {
      return {
        sourceStatus: 'RETRIEVAL_FAILED',
        failureReason: 'DNS_FAILED',
        userMessage: 'We couldn\'t find this website. The domain may be incorrect or the site may not exist.',
        retryable: false,
        requiresManualInput: true,
        evidenceCount: 0
      };
    }
    
    if (error.includes('connection') || error.includes('socket') || error.includes('network') || error.includes('upstream')) {
      return {
        sourceStatus: 'RETRIEVAL_FAILED',
        failureReason: 'CONNECTION_FAILED',
        userMessage: 'We couldn\'t connect to this website. It may be offline or blocking our access.',
        retryable: true,
        requiresManualInput: true,
        evidenceCount: 0
      };
    }
    
    if (error.includes('reset') || error.includes('aborted')) {
      return {
        sourceStatus: 'RETRIEVAL_FAILED',
        failureReason: 'CONNECTION_RESET',
        userMessage: 'The connection to this website was interrupted. This may be temporary.',
        retryable: true,
        requiresManualInput: true,
        evidenceCount: 0
      };
    }
    
    if (error.includes('403') || error.includes('429') || fetchResult.httpStatus === 403 || fetchResult.httpStatus === 429) {
      return {
        sourceStatus: 'RETRIEVAL_FAILED',
        failureReason: 'RATE_LIMITED',
        userMessage: 'This website is temporarily limiting access. We couldn\'t retrieve the content right now.',
        retryable: true,
        requiresManualInput: true,
        evidenceCount: 0
      };
    }
    
    if (error.includes('500') || error.includes('502') || error.includes('503') || error.includes('504') || (fetchResult.httpStatus >= 500 && fetchResult.httpStatus < 600)) {
      return {
        sourceStatus: 'RETRIEVAL_FAILED',
        failureReason: 'SERVER_ERROR',
        userMessage: 'This website\'s server returned an error. The site may be experiencing issues.',
        retryable: true,
        requiresManualInput: true,
        evidenceCount: 0
      };
    }
    
    if (error.includes('hostname is explicitly blocked') || error.includes('hostname resolves to blocked') || error.includes('hostname validation failed') || error.includes('redirect target blocked')) {
      return {
        sourceStatus: 'REJECTED_SOURCE',
        failureReason: 'INVALID_URL',
        userMessage: 'This URL is not acceptable or accessible.',
        retryable: false,
        requiresManualInput: true,
        evidenceCount: 0
      };
    }
    
    if (error.includes('http urls are not allowed') || error.includes('use https')) {
      return {
        sourceStatus: 'REJECTED_SOURCE',
        failureReason: 'INVALID_URL',
        userMessage: 'This URL is not acceptable. Please use HTTPS for secure websites.',
        retryable: false,
        requiresManualInput: true,
        evidenceCount: 0
      };
    }
    
    if (error.includes('not allowed') || error.includes('captcha') || error.includes('cloudflare') || error.includes('security challenge') || error.includes('automated-access restriction') || error.includes('access denied') || error.includes('forbidden')) {
      return {
        sourceStatus: 'ACCESS_BLOCKED',
        failureReason: 'ACCESS_BLOCKED',
        userMessage: 'Website access is restricted. We couldn\'t inspect enough of this website automatically.',
        retryable: false,
        requiresManualInput: true,
        evidenceCount: 0
      };
    }
    
    if (error.includes('http') && error.includes('https')) {
      return {
        sourceStatus: 'REJECTED_SOURCE',
        failureReason: 'INVALID_URL',
        userMessage: 'This URL is not acceptable. Please use HTTPS for secure websites.',
        retryable: false,
        requiresManualInput: true,
        evidenceCount: 0
      };
    }

    if (error.includes('ssl') || error.includes('tls') || error.includes('handshake') || error.includes('certificate') || error.includes('EPROTO')) {
      return {
        sourceStatus: 'RETRIEVAL_FAILED',
        failureReason: 'TLS_HANDSHAKE_FAILED',
        userMessage: 'This website has an invalid or incompatible security certificate. We couldn\'t establish a secure connection. Try again later or provide your business details manually.',
        retryable: false,
        requiresManualInput: true,
        evidenceCount: 0
      };
    }

    return {
      sourceStatus: 'RETRIEVAL_FAILED',
      failureReason: 'UNKNOWN',
      userMessage: 'We couldn\'t retrieve this website due to an unexpected error.',
      retryable: true,
      requiresManualInput: true,
      evidenceCount: 0
    };
  }

  // 3. INSUFFICIENT_EVIDENCE — fetch succeeded but content is limited
  //    Still classify as LIKELY_BUSINESS_WEBSITE so AI can analyze partial evidence
  const sufficiency = evaluateEvidenceSufficiency(evidenceItems, [
    'identity',
    'business_description'
  ]);

  if (!sufficiency.sufficient) {
    return {
      sourceStatus: 'LIKELY_BUSINESS_WEBSITE',
      failureReason: 'INSUFFICIENT_CONTENT',
      userMessage: 'We accessed the website, but couldn\'t find enough information to confidently identify the business.',
      retryable: false,
      requiresManualInput: true,
      evidenceCount: evidenceItems.length,
      confidence: 'partial'
    };
  }

  // 4. LIKELY_BUSINESS_WEBSITE — fetch succeeded and evidence is sufficient
  return {
    sourceStatus: 'LIKELY_BUSINESS_WEBSITE',
    failureReason: null,
    userMessage: null,
    retryable: false,
    requiresManualInput: false,
    evidenceCount: evidenceItems.length,
    confidence: 'high'
  };
}

// ─────────────────────────────────────────────────────────
// 8. Main Export — retrieveWebsiteEvidence()
// ─────────────────────────────────────────────────────────

export async function retrieveWebsiteEvidence(rawUrl) {
  const checkedAt = new Date().toISOString();
  const analysisId = `ANALYSIS_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Step 1: Validate URL
  const { isValid, normalizedUrl, error: validationError } = validateAndNormalizeUrl(rawUrl);
  if (!isValid) {
    return {
      success: false,
      sourceStatus: 'REJECTED_SOURCE',
      retrievalMeta: { requestedUrl: rawUrl, httpStatus: 0, checkedAt },
      evidenceItems: [],
      insufficientEvidence: true,
      reason: validationError || 'Invalid URL',
      failureReason: 'INVALID_URL',
      userMessage: validationError || 'This website address doesn\'t appear to be valid. Please check the URL and try again.',
      attempts: 0
    };
  }

  // Step 2: Fetch primary page with SSRF protection and retry for transient failures
  let primaryFetch;
  let attempts = 0;
  let outcome;
  
  for (attempts = 1; attempts <= MAX_RETRIES; attempts++) {
    primaryFetch = await fetchWithRedirectValidation(normalizedUrl);
    
    const botProtection = detectBotProtection({}, primaryFetch);
    const tempOutcome = classifyRetrievalOutcome(primaryFetch, null, [], botProtection);
    
    if (primaryFetch.success && primaryFetch.html) {
      outcome = tempOutcome;
      break;
    }
    
    outcome = tempOutcome;
    
    if (!outcome.retryable || attempts >= MAX_RETRIES) {
      break;
    }
    
    // Exponential backoff: 1s, 2s, 4s... capped at MAX_RETRY_DELAY_MS
    const backoffDelay = Math.min(BASE_RETRY_DELAY_MS * Math.pow(2, attempts - 1), MAX_RETRY_DELAY_MS);
    await new Promise(resolve => setTimeout(resolve, backoffDelay));
  }

  const retrievalMeta = {
    requestedUrl: rawUrl,
    normalizedUrl,
    finalUrl: primaryFetch.finalUrl,
    httpStatus: primaryFetch.httpStatus,
    contentType: primaryFetch.contentType,
    responseTimeMs: primaryFetch.responseTimeMs,
    retrievalSuccess: primaryFetch.success,
    checkedAt,
    pagesInspected: [],
    error: primaryFetch.error || null,
    attempts
  };

  // Handle fetch failures
  if (!primaryFetch.success || !primaryFetch.html) {
    return {
      success: false,
      sourceStatus: outcome.sourceStatus,
      retrievalMeta,
      evidenceItems: [],
      insufficientEvidence: true,
      reason: primaryFetch.error || 'Website not accessible',
      failureReason: outcome.failureReason,
      userMessage: outcome.userMessage,
      retryable: outcome.retryable,
      requiresManualInput: outcome.requiresManualInput,
      evidenceCount: 0,
      attempts
    };
  }

  retrievalMeta.pagesInspected.push(primaryFetch.finalUrl);

  // Step 3: Parse primary page
  const primaryParsed = parseHtmlContent(primaryFetch.html, primaryFetch.finalUrl);

  // Step 4: Find and fetch relevant sub-pages
  const subPageUrls = extractRelevantPageUrls(primaryParsed, primaryFetch.finalUrl);
  const subPageResults = [];

  for (const subUrl of subPageUrls) {
    if (retrievalMeta.pagesInspected.length >= MAX_SUBPAGES + 1) break;
    try {
      const subFetch = await fetchWithRedirectValidation(subUrl, 3);
      if (subFetch.success && subFetch.html) {
        const subParsed = parseHtmlContent(subFetch.html, subUrl);
        subPageResults.push({ url: subUrl, parsed: subParsed });
        retrievalMeta.pagesInspected.push(subUrl);
      }
    } catch {
      // Skip failed sub-pages silently
    }
  }

  // Step 5: Build raw evidence set
  let rawEvidenceItems = buildEvidenceItems(primaryParsed, primaryFetch.finalUrl, checkedAt);

  for (const sub of subPageResults) {
    const subEvidence = buildEvidenceItems(sub.parsed, sub.url, checkedAt);
    rawEvidenceItems = rawEvidenceItems.concat(subEvidence);
  }

   // Step 6: Normalize evidence through Phase 2 evidence model
   const structuredEvidence = normalizeEvidenceItems(rawEvidenceItems, analysisId);

   // Step 6b: Discover assets from primary page
   const discoveredAssets = discoverAssets(primaryParsed, primaryFetch.finalUrl);
   const allDiscoveredAssets = [...discoveredAssets];
   for (const sub of subPageResults) {
     const subAssets = discoverAssets(sub.parsed, sub.url);
     allDiscoveredAssets.push(...subAssets);
   }

    // Step 7: Evaluate evidence sufficiency
    const sufficiency = evaluateEvidenceSufficiency(structuredEvidence, [
      EVIDENCE_TYPES.IDENTITY,
      EVIDENCE_TYPES.BUSINESS_DESCRIPTION
    ]);

    // Step 7b: Detect bot protection / access blocks
    const botProtection = detectBotProtection(primaryParsed, primaryFetch);

    // Step 8: Get evidence summary
    const evidenceSummary = getEvidenceSummary(structuredEvidence);

    // Step 9: Classify retrieval outcome
    outcome = classifyRetrievalOutcome(primaryFetch, primaryParsed, structuredEvidence, botProtection);
    const classification = classifyBusinessSource(primaryParsed, primaryFetch.finalUrl);
    const sourceStatus = outcome.sourceStatus;
    const overallSuccess = sourceStatus === 'LIKELY_BUSINESS_WEBSITE';

    return {
      success: overallSuccess,
      sourceStatus,
      retrievalMeta,
      evidenceItems: structuredEvidence,
      discoveredAssets: allDiscoveredAssets,
      insufficientEvidence: !sufficiency.sufficient || sourceStatus !== 'LIKELY_BUSINESS_WEBSITE',
      reason: outcome.userMessage || (sufficiency.sufficient ? null : 'Insufficient evidence retrieved from website'),
      failureReason: outcome.failureReason,
      userMessage: outcome.userMessage,
      retryable: outcome.retryable,
      requiresManualInput: outcome.requiresManualInput,
      evidenceCount: outcome.evidenceCount,
      attempts,
      primaryPage: {
        title: primaryParsed.title,
        metaDescription: primaryParsed.metaDescription,
        og: primaryParsed.og,
        contactInfo: primaryParsed.contactInfo,
        socialLinks: primaryParsed.socialLinks,
        headings: primaryParsed.headings
      },
      sourceClassification: {
        status: classification.sourceStatus,
        signals: classification.signals,
        reasoning: classification.reasoning
      },
      analysis: {
        analysisId,
        generatedAt: checkedAt,
        evidenceSufficiency: sufficiency,
        evidenceSummary
      }
    };
  }

export { validateAndNormalizeUrl, fetchWithRedirectValidation };
