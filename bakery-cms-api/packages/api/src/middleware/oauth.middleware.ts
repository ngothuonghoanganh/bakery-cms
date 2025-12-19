/**
 * OAuth Middleware
 * Middleware functions for OAuth authentication flow
 */

import { Request, Response, NextFunction } from 'express';
import { OAuthProvider } from '@bakery-cms/common';

/**
 * Simple console logger for OAuth middleware
 */
const logger = {
  info: (message: string, meta?: any) => console.log('[OAuth]', message, meta),
  warn: (message: string, meta?: any) => console.warn('[OAuth]', message, meta),
  error: (message: string, meta?: any) => console.error('[OAuth]', message, meta),
};

/**
 * Validate OAuth provider parameter
 * Ensures provider is supported (google, facebook)
 */
export const validateOAuthProvider = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const provider = req.params['provider']?.toLowerCase();

  if (!provider) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'OAuth provider is required',
      },
    });
    return;
  }

  const validProviders = Object.values(OAuthProvider);

  if (!validProviders.includes(provider as OAuthProvider)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Unsupported OAuth provider. Supported: ${validProviders.join(', ')}`,
      },
    });
    return;
  }

  next();
};

/**
 * Validate OAuth callback parameters
 * Ensures code and state are present in callback
 */
export const validateOAuthCallback = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const code = req.query['code'] as string;
  const state = req.query['state'] as string;
  const error = req.query['error'] as string;

  // OAuth provider returned an error
  if (error) {
    logger.warn('OAuth provider returned error', {
      error,
      errorDescription: req.query['error_description'],
    });
    next(); // Let controller handle OAuth errors
    return;
  }

  // Missing required parameters
  if (!code || !state) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Missing required OAuth callback parameters (code, state)',
      },
    });
    return;
  }

  next();
};

/**
 * Validate OAuth code exchange request body
 * Ensures all required fields for direct code exchange
 */
export const validateOAuthExchangeBody = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { code, codeVerifier, redirectUri } = req.body;

  const missingFields: string[] = [];

  if (!code) missingFields.push('code');
  if (!codeVerifier) missingFields.push('codeVerifier');
  if (!redirectUri) missingFields.push('redirectUri');

  if (missingFields.length > 0) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Missing required fields: ${missingFields.join(', ')}`,
      },
    });
    return;
  }

  // Validate redirect URI format
  try {
    new URL(redirectUri);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid redirectUri format',
      },
    });
    return;
  }

  next();
};

/**
 * Rate limiting for OAuth endpoints
 * Prevents abuse of OAuth authorization flow
 */
export const rateLimitOAuth = (
  _req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // TODO: Implement rate limiting using Redis or in-memory store
  // For now, just pass through
  // In production, should limit to ~10 requests per minute per IP
  next();
};

/**
 * Sanitize OAuth redirect URI
 * Ensures redirect URI is to allowed domains
 */
export const sanitizeRedirectUri = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const redirectUri = (req.query['redirect_uri'] || req.body.redirectUri) as string;

  if (!redirectUri) {
    next();
    return;
  }

  try {
    const url = new URL(redirectUri);
    const allowedDomains = (process.env['OAUTH_ALLOWED_REDIRECT_DOMAINS'] || 'localhost')
      .split(',')
      .map((d) => d.trim());

    const isAllowed = allowedDomains.some((domain) => {
      return url.hostname === domain || url.hostname.endsWith(`.${domain}`);
    });

    if (!isAllowed) {
      logger.warn('Blocked redirect to unauthorized domain', {
        redirectUri,
        hostname: url.hostname,
        allowedDomains,
      });

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Redirect URI domain not allowed',
        },
      });
      return;
    }

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid redirect URI format',
      },
    });
  }
};

/**
 * Log OAuth events for audit trail
 */
export const logOAuthEvent = (eventType: 'authorize' | 'callback' | 'exchange') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const provider = req.params['provider'];
    const state = req.query['state'] || req.body.state;
    const clientIp = req.ip || req.socket.remoteAddress;

    logger.info(`OAuth ${eventType} event`, {
      provider,
      state,
      clientIp,
      userAgent: req.headers['user-agent'],
    });

    next();
  };
};
