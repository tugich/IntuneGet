/**
 * Rate Limiting Middleware
 * Simple in-memory rate limiter for API endpoints
 */

import { NextResponse } from 'next/server';

// ============================================
// Types
// ============================================

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Optional custom key generator */
  keyGenerator?: (request: Request) => string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// ============================================
// Rate Limit Store
// ============================================

// In-memory store for rate limiting
// In production, consider using Redis for distributed rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

// ============================================
// Default Key Generators
// ============================================

/**
 * Generate rate limit key from user ID (for authenticated endpoints)
 */
export function getUserKey(userId: string): string {
  return `user:${userId}`;
}

/**
 * Generate rate limit key from IP address (for public endpoints)
 */
export function getIpKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return `ip:${ip}`;
}

/**
 * Generate rate limit key from organization ID (for MSP endpoints)
 */
export function getOrgKey(orgId: string): string {
  return `org:${orgId}`;
}

// ============================================
// Preset Configurations
// ============================================

/** Community endpoints: 10 requests/minute per user */
export const COMMUNITY_RATE_LIMIT: RateLimitConfig = {
  limit: 10,
  windowMs: 60 * 1000, // 1 minute
};

/** MSP API endpoints: 60 requests/minute per organization */
export const MSP_RATE_LIMIT: RateLimitConfig = {
  limit: 60,
  windowMs: 60 * 1000, // 1 minute
};

/** Public endpoints: 30 requests/minute per IP */
export const PUBLIC_RATE_LIMIT: RateLimitConfig = {
  limit: 30,
  windowMs: 60 * 1000, // 1 minute
};

/** Strict limit for sensitive operations: 5 requests/minute */
export const STRICT_RATE_LIMIT: RateLimitConfig = {
  limit: 5,
  windowMs: 60 * 1000, // 1 minute
};

// ============================================
// Rate Limiting Functions
// ============================================

/**
 * Check if a request should be rate limited
 * Returns null if allowed, or RateLimitResult if exceeded
 */
export interface RateLimitResult {
  limited: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  cleanupExpiredEntries();

  const now = Date.now();
  let entry = rateLimitStore.get(key);

  // Initialize or reset if window has passed
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment count
  entry.count++;

  const remaining = Math.max(0, config.limit - entry.count);
  const limited = entry.count > config.limit;

  return {
    limited,
    limit: config.limit,
    remaining,
    resetAt: entry.resetAt,
  };
}

/**
 * Apply rate limiting and return appropriate response if exceeded
 * Returns null if not rate limited, or a NextResponse if rate limited
 */
export function applyRateLimit(
  key: string,
  config: RateLimitConfig
): NextResponse | null {
  const result = checkRateLimit(key, config);

  if (result.limited) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);

    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
          'Retry-After': retryAfter.toString(),
        },
      }
    );
  }

  return null;
}

/**
 * Add rate limit headers to a successful response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  key: string,
  config: RateLimitConfig
): NextResponse {
  const result = checkRateLimit(key, config);

  // Decrement since we already counted this request
  const remaining = Math.max(0, result.remaining);

  response.headers.set('X-RateLimit-Limit', config.limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000).toString());

  return response;
}

// ============================================
// Higher-Order Function for Route Handlers
// ============================================

type RouteHandler = (request: Request) => Promise<NextResponse>;

/**
 * Wrap a route handler with rate limiting
 * @param handler The route handler function
 * @param config Rate limit configuration
 * @param keyGenerator Function to generate the rate limit key from the request
 */
export function withRateLimit(
  handler: RouteHandler,
  config: RateLimitConfig,
  keyGenerator: (request: Request) => string | null
): RouteHandler {
  return async (request: Request) => {
    const key = keyGenerator(request);

    // If no key (e.g., unauthenticated), skip rate limiting
    if (!key) {
      return handler(request);
    }

    const rateLimitResponse = applyRateLimit(key, config);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    return handler(request);
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Reset rate limit for a specific key (useful for testing)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Get current rate limit status for a key
 */
export function getRateLimitStatus(key: string, config: RateLimitConfig): RateLimitResult {
  const entry = rateLimitStore.get(key);
  const now = Date.now();

  if (!entry || entry.resetAt < now) {
    return {
      limited: false,
      limit: config.limit,
      remaining: config.limit,
      resetAt: now + config.windowMs,
    };
  }

  return {
    limited: entry.count >= config.limit,
    limit: config.limit,
    remaining: Math.max(0, config.limit - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Clear all rate limits (useful for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}
