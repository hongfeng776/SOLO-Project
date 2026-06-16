import rateLimit from 'express-rate-limit';
import { rateLimitConfig } from '@config/index';

export const apiLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 429,
    message: 'Too many requests, please try again later',
    data: null,
    timestamp: new Date().toISOString(),
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 429,
    message: 'Too many login attempts, please try again later',
    data: null,
    timestamp: new Date().toISOString(),
  },
});

export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 429,
    message: 'Too many requests for sensitive operation',
    data: null,
    timestamp: new Date().toISOString(),
  },
});
