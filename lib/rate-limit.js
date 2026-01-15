/**
 * Rate Limiting Library Wrapper
 * 
 * ES Module wrapper for Modules/rate-limit.js
 * Use this in API routes to apply rate limiting.
 * 
 * @example
 * // In an API route:
 * import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
 * 
 * export async function GET(request) {
 *   const rateLimitResult = withRateLimit(request, RATE_LIMITS.STANDARD_READ);
 *   if (rateLimitResult.limited) {
 *     return NextResponse.json(rateLimitResult.response.error, { 
 *       status: 429,
 *       headers: rateLimitResult.headers 
 *     });
 *   }
 *   // ... rest of handler
 * }
 */

import { createRequire } from 'module';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const require = createRequire(import.meta.url);
const rateLimitModule = require('../Modules/rate-limit');

// ============================================
// RE-EXPORT CORE FUNCTIONS
// ============================================

export const createRateLimiter = rateLimitModule.createRateLimiter;
export const applyRateLimit = rateLimitModule.applyRateLimit;
export const checkRateLimit = rateLimitModule.checkRateLimit;
export const generateKey = rateLimitModule.generateKey;
export const getRateLimitHeaders = rateLimitModule.getRateLimitHeaders;

// ============================================
// RE-EXPORT CONSTANTS
// ============================================

export const PRESETS = rateLimitModule.PRESETS;
export const TIME_WINDOWS = rateLimitModule.TIME_WINDOWS;

// ============================================
// PREDEFINED RATE LIMITS FOR API ENDPOINTS
// ============================================

/**
 * Rate limits for each API endpoint and method
 * Adjust these values based on your requirements
 */
export const RATE_LIMITS = {
  // ==========================================
  // CUSTOMERS API
  // ==========================================
  CUSTOMERS_GET: {
    limit: 60,
    window: TIME_WINDOWS.MINUTE,
    description: '60 requests per minute - standard read',
  },
  CUSTOMERS_PUT: {
    limit: 30,
    window: TIME_WINDOWS.MINUTE,
    description: '30 requests per minute - standard update',
  },
  
  // ==========================================
  // MATERIALS API
  // ==========================================
  MATERIALS_GET: {
    limit: 60,
    window: TIME_WINDOWS.MINUTE,
    description: '60 requests per minute - standard read',
  },
  MATERIALS_PUT: {
    limit: 30,
    window: TIME_WINDOWS.MINUTE,
    description: '30 requests per minute - standard update',
  },
  
  // ==========================================
  // MACHINES API
  // ==========================================
  MACHINES_GET: {
    limit: 60,
    window: TIME_WINDOWS.MINUTE,
    description: '60 requests per minute - standard read',
  },
  MACHINES_PUT: {
    limit: 30,
    window: TIME_WINDOWS.MINUTE,
    description: '30 requests per minute - standard update',
  },
  
  // ==========================================
  // PRODUCTS API
  // ==========================================
  PRODUCTS_GET: {
    limit: 60,
    window: TIME_WINDOWS.MINUTE,
    description: '60 requests per minute - standard read',
  },
  PRODUCTS_PUT: {
    limit: 30,
    window: TIME_WINDOWS.MINUTE,
    description: '30 requests per minute - standard update',
  },
  
  // ==========================================
  // ORDERS API (Full CRUD - more usage expected)
  // ==========================================
  ORDERS_GET: {
    limit: 120,
    window: TIME_WINDOWS.MINUTE,
    description: '120 requests per minute - high-traffic read',
  },
  ORDERS_POST: {
    limit: 30,
    window: TIME_WINDOWS.MINUTE,
    description: '30 requests per minute - create new orders',
  },
  ORDERS_PUT: {
    limit: 60,
    window: TIME_WINDOWS.MINUTE,
    description: '60 requests per minute - update orders',
  },
  ORDERS_DELETE: {
    limit: 20,
    window: TIME_WINDOWS.MINUTE,
    description: '20 requests per minute - delete orders',
  },
  
  // ==========================================
  // PREDICTED ORDERS API
  // ==========================================
  PREDICTED_ORDERS_GET: {
    limit: 60,
    window: TIME_WINDOWS.MINUTE,
    description: '60 requests per minute - standard read',
  },
  PREDICTED_ORDERS_POST: {
    limit: 20,
    window: TIME_WINDOWS.MINUTE,
    description: '20 requests per minute - create predictions',
  },
  PREDICTED_ORDERS_PUT: {
    limit: 30,
    window: TIME_WINDOWS.MINUTE,
    description: '30 requests per minute - update predictions',
  },
  PREDICTED_ORDERS_DELETE: {
    limit: 20,
    window: TIME_WINDOWS.MINUTE,
    description: '20 requests per minute - delete predictions',
  },
  
  // ==========================================
  // FORECASTS API (Read-only)
  // ==========================================
  FORECASTS_GET: {
    limit: 60,
    window: TIME_WINDOWS.MINUTE,
    description: '60 requests per minute - standard read',
  },
  
  // ==========================================
  // PRODUCTION BLOCKS API
  // ==========================================
  PRODUCTION_BLOCKS_GET: {
    limit: 120,
    window: TIME_WINDOWS.MINUTE,
    description: '120 requests per minute - high-traffic for schedule view',
  },
  PRODUCTION_BLOCKS_POST: {
    limit: 30,
    window: TIME_WINDOWS.MINUTE,
    description: '30 requests per minute - create blocks',
  },
  PRODUCTION_BLOCKS_PUT: {
    limit: 60,
    window: TIME_WINDOWS.MINUTE,
    description: '60 requests per minute - update blocks (drag-drop)',
  },
  PRODUCTION_BLOCKS_DELETE: {
    limit: 20,
    window: TIME_WINDOWS.MINUTE,
    description: '20 requests per minute - delete single block',
  },
  PRODUCTION_BLOCKS_DELETE_ALL: {
    limit: 2,
    window: TIME_WINDOWS.HOUR,
    description: '2 requests per hour - bulk delete (dangerous)',
  },
  
  // ==========================================
  // SCHEDULE GENERATION (Heavy operation)
  // ==========================================
  SCHEDULE_GENERATE: {
    limit: 5,
    window: TIME_WINDOWS.MINUTE,
    description: '5 requests per minute - heavy computation',
  },
  
  // ==========================================
  // SETTINGS API
  // ==========================================
  SETTINGS_GET: {
    limit: 60,
    window: TIME_WINDOWS.MINUTE,
    description: '60 requests per minute - standard read',
  },
  SETTINGS_PUT: {
    limit: 10,
    window: TIME_WINDOWS.MINUTE,
    description: '10 requests per minute - settings are rarely changed',
  },
  
  // ==========================================
  // HEALTH CHECK
  // ==========================================
  HEALTH_GET: {
    limit: 120,
    window: TIME_WINDOWS.MINUTE,
    description: '120 requests per minute - monitoring needs frequent access',
  },
  
  // ==========================================
  // GENERIC PRESETS (for convenience)
  // ==========================================
  STANDARD_READ: {
    limit: 60,
    window: TIME_WINDOWS.MINUTE,
    description: '60 requests per minute',
  },
  STANDARD_WRITE: {
    limit: 30,
    window: TIME_WINDOWS.MINUTE,
    description: '30 requests per minute',
  },
  HEAVY_OPERATION: {
    limit: 5,
    window: TIME_WINDOWS.MINUTE,
    description: '5 requests per minute',
  },
  RESTRICTIVE: {
    limit: 10,
    window: TIME_WINDOWS.HOUR,
    description: '10 requests per hour',
  },
};

// ============================================
// CONVENIENCE WRAPPERS
// ============================================

/**
 * Apply rate limiting to a request
 * Returns rate limit result with headers
 * 
 * @param {Request} request - Next.js request object
 * @param {Object} options - Rate limit options ({ limit, window })
 * @param {Object} [context] - Optional context with userId
 * @returns {{ limited: boolean, response?: Object, headers: Object }}
 * 
 * @example
 * const result = withRateLimit(request, RATE_LIMITS.ORDERS_GET);
 * if (result.limited) {
 *   return NextResponse.json(result.response.error, { status: 429, headers: result.headers });
 * }
 */
export function withRateLimit(request, options, context = {}) {
  return applyRateLimit(request, options, context);
}

/**
 * Apply rate limiting with automatic Clerk user extraction
 * Use this when you want user-based rate limiting
 * 
 * @param {Request} request - Next.js request object
 * @param {Object} options - Rate limit options ({ limit, window })
 * @returns {Promise<{ limited: boolean, response?: Object, headers: Object, userId?: string }>}
 * 
 * @example
 * const result = await withUserRateLimit(request, RATE_LIMITS.ORDERS_POST);
 * if (result.limited) {
 *   return NextResponse.json(result.response.error, { status: 429, headers: result.headers });
 * }
 */
export async function withUserRateLimit(request, options) {
  let userId = null;
  
  try {
    const authResult = await auth();
    userId = authResult?.userId || null;
  } catch (error) {
    // Auth might not be available, fall back to IP-based
    console.warn('[RateLimit] Could not get user ID, falling back to IP-based limiting');
  }
  
  const result = applyRateLimit(request, options, { userId });
  return { ...result, userId };
}

/**
 * Create a rate-limited API handler wrapper
 * Automatically applies rate limiting before calling the handler
 * 
 * @param {Function} handler - API route handler function
 * @param {Object} rateLimitOptions - Rate limit options for each method
 * @returns {Object} Object with rate-limited handler methods
 * 
 * @example
 * const handlers = createRateLimitedHandler({
 *   GET: { handler: getHandler, rateLimit: RATE_LIMITS.ORDERS_GET },
 *   POST: { handler: postHandler, rateLimit: RATE_LIMITS.ORDERS_POST },
 * });
 * 
 * export const GET = handlers.GET;
 * export const POST = handlers.POST;
 */
export function createRateLimitedHandler(config) {
  const handlers = {};
  
  for (const [method, { handler, rateLimit }] of Object.entries(config)) {
    handlers[method] = async (request, context) => {
      // Apply rate limiting
      const rateLimitResult = withRateLimit(request, rateLimit);
      
      if (rateLimitResult.limited) {
        return NextResponse.json(
          { error: rateLimitResult.response.error },
          { 
            status: 429,
            headers: rateLimitResult.headers,
          }
        );
      }
      
      // Call the actual handler
      const response = await handler(request, context);
      
      // Add rate limit headers to successful response
      const headers = new Headers(response.headers);
      for (const [key, value] of Object.entries(rateLimitResult.headers)) {
        headers.set(key, value);
      }
      
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    };
  }
  
  return handlers;
}

/**
 * Higher-order function to wrap a single handler with rate limiting
 * 
 * @param {Function} handler - API route handler
 * @param {Object} rateLimit - Rate limit options
 * @returns {Function} Rate-limited handler
 * 
 * @example
 * async function myGetHandler(request) {
 *   // ... handler logic
 * }
 * 
 * export const GET = withRateLimitHandler(myGetHandler, RATE_LIMITS.ORDERS_GET);
 */
export function withRateLimitHandler(handler, rateLimit) {
  return async (request, context) => {
    const rateLimitResult = withRateLimit(request, rateLimit);
    
    if (rateLimitResult.limited) {
      return NextResponse.json(
        { error: rateLimitResult.response.error },
        { 
          status: 429,
          headers: rateLimitResult.headers,
        }
      );
    }
    
    const response = await handler(request, context);
    
    // Add rate limit headers to response
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(rateLimitResult.headers)) {
      headers.set(key, value);
    }
    
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

// ============================================
// CLEANUP EXPORTS
// ============================================

export const cleanupExpiredRecords = rateLimitModule.cleanupExpiredRecords;
export const startCleanupInterval = rateLimitModule.startCleanupInterval;
export const stopCleanupInterval = rateLimitModule.stopCleanupInterval;
export const clearAllRecords = rateLimitModule.clearAllRecords;
export const getStoreSize = rateLimitModule.getStoreSize;
