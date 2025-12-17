/**
 * Rate limiting middleware
 * Protects API from abuse by limiting requests per IP
 */

import rateLimit from 'express-rate-limit';
import { getAppConfig } from '../config/app';
import { createRateLimitError } from '../utils/error-factory';

/**
 * Rate limiter options type
 */
export type RateLimiterOptions = {
  readonly windowMs?: number;
  readonly max?: number;
  readonly message?: string;
  readonly skipSuccessfulRequests?: boolean;
  readonly skipFailedRequests?: boolean;
};

/**
 * Create rate limiter middleware
 * Factory function that returns configured rate limiter
 */
export const createRateLimiter = (options: RateLimiterOptions = {}) => {
  const config = getAppConfig();
  
  return rateLimit({
    windowMs: options.windowMs ?? config.rateLimitWindow,
    max: options.max ?? config.rateLimitMax,
    message: options.message ?? 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests ?? false,
    skipFailedRequests: options.skipFailedRequests ?? false,
    handler: (req, res) => {
      const error = createRateLimitError(
        options.message ?? 'Too many requests from this IP, please try again later'
      );
      res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
          timestamp: error.timestamp.toISOString(),
          path: req.path,
        },
      });
    },
  });
};

/**
 * Default rate limiter
 * Uses configuration from environment variables
 */
export const rateLimiter = createRateLimiter();

/**
 * Strict rate limiter for sensitive endpoints
 * More restrictive limits for authentication, etc.
 */
export const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many attempts, please try again later',
});

/**
 * Lenient rate limiter for read operations
 * Less restrictive for GET requests
 */
export const lenientRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  skipSuccessfulRequests: true,
});
