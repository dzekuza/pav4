import { RequestHandler } from "express";
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import mcache from 'memory-cache';

// Rate limiting middleware
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    if (req.ip) return req.ip;
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string') return xff;
    if (Array.isArray(xff)) return xff[0];
    if (req.connection?.remoteAddress) return req.connection.remoteAddress;
    return 'unknown';
  },
});

export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (req.ip) return req.ip;
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string') return xff;
    if (Array.isArray(xff)) return xff[0];
    if (req.connection?.remoteAddress) return req.connection.remoteAddress;
    return 'unknown';
  },
});

export const businessRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { error: 'Too many business operations, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (req.ip) return req.ip;
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string') return xff;
    if (Array.isArray(xff)) return xff[0];
    if (req.connection?.remoteAddress) return req.connection.remoteAddress;
    return 'unknown';
  },
});

// Input validation middleware
export const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
];

export const validateBusinessRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  body('domain')
    .isFQDN()
    .withMessage('Please provide a valid domain (e.g., example.com)'),
  body('website')
    .custom((value) => {
      // Accept if it's a valid URL (with protocol)
      try {
        new URL(value);
        return true;
      } catch {}
      // Accept if it's a valid FQDN (plain domain)
      const fqdnRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.[A-Za-z]{2,}$/;
      if (fqdnRegex.test(value)) return true;
      throw new Error('Please provide a valid website URL or domain (e.g., example.com or https://example.com)');
    }),
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const handleValidationErrors: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

// Caching middleware
export const cache = (duration: number) => {
  return (req: any, res: any, next: any) => {
    const key = `__express__${req.originalUrl || req.url}`;
    const cachedBody = mcache.get(key);
    
    if (cachedBody) {
      res.send(cachedBody);
      return;
    }
    
    res.sendResponse = res.send;
    res.send = (body: any) => {
      mcache.put(key, body, duration * 1000);
      res.sendResponse(body);
    };
    next();
  };
};

// Security headers middleware
export const securityHeaders: RequestHandler = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

// Request logging middleware
export const requestLogger: RequestHandler = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString(),
    };
    
    // Log security-relevant events
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn('Security event:', logData);
    } else if (res.statusCode >= 400) {
      console.error('Error event:', logData);
    } else {
      console.log('Request:', logData);
    }
  });
  
  next();
};

// Input sanitization middleware
export const sanitizeInput: RequestHandler = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = (req.query[key] as string).trim();
      }
    });
  }
  
  next();
};

// URL validation middleware
export const validateUrl: RequestHandler = (req, res, next) => {
  const url = req.body?.url || req.query?.url;
  
  if (url) {
    try {
      const parsedUrl = new URL(url);
      
      // Check for allowed protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ error: 'Invalid URL protocol' });
      }
      
      // Check for allowed domains (optional)
      const allowedDomains = [
        'amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.it', 'amazon.es',
        'ebay.com', 'ebay.co.uk', 'ebay.de', 'ebay.fr', 'ebay.it', 'ebay.es',
        'walmart.com', 'bestbuy.com', 'target.com', 'apple.com', 'playstation.com',
        'newegg.com', 'costco.com', 'larq.com', 'livelarq.com', 'sonos.com',
        'shopify.com', 'etsy.com', 'aliexpress.com', 'banggood.com', 'gearbest.com'
      ];
      
      const hostname = parsedUrl.hostname.toLowerCase().replace('www.', '');
      if (!allowedDomains.some(domain => hostname.includes(domain))) {
        console.warn(`Attempted access to non-whitelisted domain: ${hostname}`);
        // Don't block, just log for monitoring
      }
      
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
  }
  
  next();
}; 