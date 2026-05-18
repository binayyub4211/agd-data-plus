import rateLimit from 'express-rate-limit';

// General API rate limiter - Professional industry standard (allows active dashboard navigation)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from 100 to 1000 requests per 15 minutes to prevent blocking real users
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiter for authentication routes - Prevents brute force while avoiding developer/tester lockout
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes (reduced block duration from 1 hour)
  max: 150, // Increased from 30 to 150 attempts per 15 minutes to prevent accidental IP blockades
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
