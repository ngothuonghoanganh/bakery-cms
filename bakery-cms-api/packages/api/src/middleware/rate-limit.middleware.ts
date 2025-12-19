/**
 * Rate Limiting Middleware
 * Protects endpoints from brute force attacks
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Rate limit store entry
 */
type RateLimitEntry = {
  count: number;
  resetTime: number;
  blockedUntil?: number;
};

/**
 * In-memory store for rate limiting
 * In production, use Redis or similar
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration
 */
export type RateLimitConfig = {
  windowMs: number; // Time window in milliseconds
  maxAttempts: number; // Max attempts per window
  blockDurationMs?: number; // Block duration after max attempts exceeded
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  message?: string; // Custom error message
};

/**
 * Default rate limit configurations
 */
export const RATE_LIMIT_CONFIGS = {
  // Login endpoint: 5 attempts per 15 minutes
  LOGIN: {
    windowMs: 15 * 60 * 1000,
    maxAttempts: 5,
    blockDurationMs: 30 * 60 * 1000, // 30 minutes block
    message: 'Too many login attempts. Please try again later.',
  },
  // Registration endpoint: 3 attempts per hour
  REGISTER: {
    windowMs: 60 * 60 * 1000,
    maxAttempts: 3,
    blockDurationMs: 60 * 60 * 1000, // 1 hour block
    message: 'Too many registration attempts. Please try again later.',
  },
  // Password reset: 3 attempts per hour
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000,
    maxAttempts: 3,
    blockDurationMs: 60 * 60 * 1000,
    message: 'Too many password reset attempts. Please try again later.',
  },
  // OAuth: 10 attempts per 15 minutes
  OAUTH: {
    windowMs: 15 * 60 * 1000,
    maxAttempts: 10,
    blockDurationMs: 15 * 60 * 1000,
    message: 'Too many OAuth attempts. Please try again later.',
  },
  // General API: 100 requests per 15 minutes
  API: {
    windowMs: 15 * 60 * 1000,
    maxAttempts: 100,
    message: 'Too many requests. Please try again later.',
  },
} as const;

/**
 * Default key generator using IP address
 */
const defaultKeyGenerator = (req: Request): string => {
  return req.ip || req.socket.remoteAddress || 'unknown';
};

/**
 * Clean up expired entries from store
 */
const cleanupStore = (): void => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime && (!entry.blockedUntil || now > entry.blockedUntil)) {
      rateLimitStore.delete(key);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupStore, 5 * 60 * 1000);

/**
 * Create rate limiting middleware
 */
export const createRateLimiter = (config: RateLimitConfig) => {
  const {
    windowMs,
    maxAttempts,
    blockDurationMs,
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    message = 'Too many requests. Please try again later.',
  } = config;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    // Initialize or reset entry
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    // Check if currently blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      const remainingTime = Math.ceil((entry.blockedUntil - now) / 1000 / 60);
      res.status(429).json({
        code: 'RATE_LIMIT_EXCEEDED',
        message: `${message} Try again in ${remainingTime} minutes.`,
        statusCode: 429,
        timestamp: new Date(),
      });
      return;
    }

    // Increment count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > maxAttempts) {
      if (blockDurationMs) {
        entry.blockedUntil = now + blockDurationMs;
      }
      res.status(429).json({
        code: 'RATE_LIMIT_EXCEEDED',
        message,
        statusCode: 429,
        timestamp: new Date(),
      });
      return;
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxAttempts.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxAttempts - entry.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

    // If skipSuccessfulRequests, reset count on successful response
    if (skipSuccessfulRequests) {
      const originalJson = res.json.bind(res);
      res.json = function (body: any) {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          const currentEntry = rateLimitStore.get(key);
          if (currentEntry) {
            currentEntry.count = Math.max(0, currentEntry.count - 1);
          }
        }
        return originalJson(body);
      };
    }

    next();
  };
};

/**
 * Predefined rate limiters
 */
export const rateLimitLogin = createRateLimiter(RATE_LIMIT_CONFIGS.LOGIN);
export const rateLimitRegister = createRateLimiter(RATE_LIMIT_CONFIGS.REGISTER);
export const rateLimitPasswordReset = createRateLimiter(RATE_LIMIT_CONFIGS.PASSWORD_RESET);
export const rateLimitOAuth = createRateLimiter(RATE_LIMIT_CONFIGS.OAUTH);
export const rateLimitApi = createRateLimiter(RATE_LIMIT_CONFIGS.API);

/**
 * Reset rate limit for a specific key (useful for testing or manual intervention)
 */
export const resetRateLimit = (key: string): void => {
  rateLimitStore.delete(key);
};

/**
 * Get current rate limit status for a key
 */
export const getRateLimitStatus = (key: string): RateLimitEntry | null => {
  return rateLimitStore.get(key) || null;
};
