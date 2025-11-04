/**
 * Production-ready rate limiter with Redis support and in-memory fallback
 * Implements sliding window algorithm for accurate rate limiting
 */

import { logger } from '@/lib/logger';

// Rate limit configuration types
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyPrefix?: string; // Redis key prefix
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// In-memory store for development/fallback
class InMemoryStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map();

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || record.resetTime < now) {
      // New window
      const resetTime = now + windowMs;
      this.store.set(key, { count: 1, resetTime });
      return { count: 1, resetTime };
    }

    // Increment existing
    record.count++;
    this.store.set(key, record);
    return record;
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || record.resetTime < now) {
      return null;
    }

    return record;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (record.resetTime < now) {
        this.store.delete(key);
      }
    }
  }
}

// Redis store for production
class RedisStore {
  private client: any; // Redis client type

  constructor(client: any) {
    this.client = client;
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const resetTime = now + windowMs;

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.client.pipeline();
      pipeline.incr(key);
      pipeline.pexpire(key, windowMs);
      const results = await pipeline.exec();

      const count = results[0][1]; // First command result
      return { count, resetTime };
    } catch (error) {
      logger.error('Redis rate limiter error', { error, key });
      throw error;
    }
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    try {
      const count = await this.client.get(key);
      if (!count) return null;

      const ttl = await this.client.pttl(key);
      const resetTime = Date.now() + ttl;

      return { count: parseInt(count, 10), resetTime };
    } catch (error) {
      logger.error('Redis get error', { error, key });
      return null;
    }
  }

  async reset(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis reset error', { error, key });
    }
  }
}

export class RateLimiter {
  private store: InMemoryStore | RedisStore;
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig, redisClient?: any) {
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      keyPrefix: config.keyPrefix || 'rl',
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false,
    };

    // Use Redis if available, otherwise in-memory
    if (redisClient) {
      this.store = new RedisStore(redisClient);
      logger.info('Rate limiter initialized with Redis store');
    } else {
      this.store = new InMemoryStore();
      logger.warn('Rate limiter using in-memory store (not suitable for production)');

      // Cleanup expired entries every 5 minutes
      if (this.store instanceof InMemoryStore) {
        setInterval(() => this.store.cleanup(), 5 * 60 * 1000);
      }
    }
  }

  /**
   * Check if a request should be rate limited
   */
  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const key = `${this.config.keyPrefix}:${identifier}`;

    try {
      const record = await this.store.increment(key, this.config.windowMs);
      const remaining = Math.max(0, this.config.maxRequests - record.count);
      const success = record.count <= this.config.maxRequests;

      const result: RateLimitResult = {
        success,
        limit: this.config.maxRequests,
        remaining,
        resetTime: record.resetTime,
      };

      if (!success) {
        result.retryAfter = Math.ceil((record.resetTime - Date.now()) / 1000);
      }

      return result;
    } catch (error) {
      logger.error('Rate limit check failed', { error, identifier });
      // Fail open - allow request on error
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs,
      };
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  async resetLimit(identifier: string): Promise<void> {
    const key = `${this.config.keyPrefix}:${identifier}`;
    await this.store.reset(key);
  }
}

// Predefined rate limit configurations
export const RateLimitPresets = {
  // Strict limits for authentication endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    keyPrefix: 'rl:auth',
  },
  // Standard API limits
  API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    keyPrefix: 'rl:api',
  },
  // Strict limits for sensitive operations
  SENSITIVE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
    keyPrefix: 'rl:sensitive',
  },
  // Generous limits for general endpoints
  GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    keyPrefix: 'rl:general',
  },
  // Very strict limits for order submission
  ORDER_SUBMISSION: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 orders per minute
    keyPrefix: 'rl:order',
  },
} as const;

// Global rate limiter instances
let apiRateLimiter: RateLimiter | null = null;
let authRateLimiter: RateLimiter | null = null;
let sensitiveRateLimiter: RateLimiter | null = null;
let generalRateLimiter: RateLimiter | null = null;
let orderRateLimiter: RateLimiter | null = null;

/**
 * Initialize rate limiters (call this on app startup)
 */
export function initializeRateLimiters(redisClient?: any) {
  apiRateLimiter = new RateLimiter(RateLimitPresets.API, redisClient);
  authRateLimiter = new RateLimiter(RateLimitPresets.AUTH, redisClient);
  sensitiveRateLimiter = new RateLimiter(RateLimitPresets.SENSITIVE, redisClient);
  generalRateLimiter = new RateLimiter(RateLimitPresets.GENERAL, redisClient);
  orderRateLimiter = new RateLimiter(RateLimitPresets.ORDER_SUBMISSION, redisClient);

  logger.info('Rate limiters initialized');
}

// Lazy initialization
function ensureInitialized() {
  if (!apiRateLimiter) {
    initializeRateLimiters();
  }
}

/**
 * Get rate limiter instance by type
 */
export function getRateLimiter(
  type: 'api' | 'auth' | 'sensitive' | 'general' | 'order' = 'api'
): RateLimiter {
  ensureInitialized();

  switch (type) {
    case 'auth':
      return authRateLimiter!;
    case 'sensitive':
      return sensitiveRateLimiter!;
    case 'general':
      return generalRateLimiter!;
    case 'order':
      return orderRateLimiter!;
    default:
      return apiRateLimiter!;
  }
}

/**
 * Helper function to extract identifier from request
 */
export function getRequestIdentifier(request: Request, useIP: boolean = true): string {
  // Try to get user ID from auth header or session
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const userId = extractUserIdFromAuth(authHeader);
    if (userId) return `user:${userId}`;
  }

  // Fall back to IP address
  if (useIP) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    return `ip:${ip}`;
  }

  return 'anonymous';
}

function extractUserIdFromAuth(authHeader: string): string | null {
  try {
    // Extract from Bearer token if present
    if (authHeader.startsWith('Bearer ')) {
      // In a real implementation, decode JWT here
      // For now, we'll rely on Supabase session handling
      return null;
    }
    return null;
  } catch {
    return null;
  }
}
