/**
 * Rate Limiting Module
 * 
 * In-memory rate limiter for API endpoints.
 * Supports both IP-based and user-based limiting.
 * 
 * IMPORTANT: This uses in-memory storage, which means:
 * - Rate limit counters reset when the server restarts
 * - Not suitable for distributed/serverless environments at scale
 * - For production at scale, migrate to Redis/Upstash
 */

// ============================================
// STORAGE
// ============================================

/**
 * In-memory storage for rate limit data
 * Structure: Map<key, { count: number, resetAt: number }>
 */
const rateLimitStore = new Map();

/**
 * Cleanup interval reference
 */
let cleanupInterval = null;

// ============================================
// CONSTANTS
// ============================================

/**
 * Time windows in milliseconds
 */
const TIME_WINDOWS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
};

/**
 * Default rate limit presets
 */
const PRESETS = {
  // Standard read operations
  STANDARD_READ: { limit: 60, window: TIME_WINDOWS.MINUTE },
  
  // Standard write operations (more restrictive)
  STANDARD_WRITE: { limit: 30, window: TIME_WINDOWS.MINUTE },
  
  // Heavy operations (schedule generation, bulk updates)
  HEAVY_OPERATION: { limit: 5, window: TIME_WINDOWS.MINUTE },
  
  // Very restrictive (settings changes, dangerous operations)
  RESTRICTIVE: { limit: 10, window: TIME_WINDOWS.HOUR },
  
  // Delete operations
  DELETE_OPERATION: { limit: 20, window: TIME_WINDOWS.MINUTE },
  
  // Health check (generous)
  HEALTH_CHECK: { limit: 120, window: TIME_WINDOWS.MINUTE },
  
  // Bulk delete (very restrictive)
  BULK_DELETE: { limit: 2, window: TIME_WINDOWS.HOUR },
};

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Generate a rate limit key
 * @param {string} identifier - IP address or user ID
 * @param {string} endpoint - API endpoint path
 * @param {string} method - HTTP method
 * @returns {string} Rate limit key
 */
function generateKey(identifier, endpoint, method) {
  return `${identifier}:${method}:${endpoint}`;
}

/**
 * Check if a request is rate limited
 * @param {string} key - Rate limit key
 * @param {number} limit - Maximum requests allowed
 * @param {number} window - Time window in milliseconds
 * @returns {{ allowed: boolean, remaining: number, resetAt: number, retryAfter: number | null }}
 */
function checkRateLimit(key, limit, window) {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  // No existing record - create one
  if (!record) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + window,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + window,
      retryAfter: null,
    };
  }
  
  // Record has expired - reset it
  if (now >= record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + window,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + window,
      retryAfter: null,
    };
  }
  
  // Record is active - check count
  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
      retryAfter,
    };
  }
  
  // Increment count
  record.count += 1;
  rateLimitStore.set(key, record);
  
  return {
    allowed: true,
    remaining: limit - record.count,
    resetAt: record.resetAt,
    retryAfter: null,
  };
}

/**
 * Get rate limit headers for a response
 * @param {number} limit - Maximum requests allowed
 * @param {number} remaining - Remaining requests
 * @param {number} resetAt - Reset timestamp
 * @returns {Object} Headers object
 */
function getRateLimitHeaders(limit, remaining, resetAt) {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(Math.max(0, remaining)),
    'X-RateLimit-Reset': String(Math.floor(resetAt / 1000)),
  };
}

/**
 * Create a rate limiter function for an endpoint
 * @param {Object} options - Rate limit options
 * @param {number} options.limit - Maximum requests allowed
 * @param {number} options.window - Time window in milliseconds
 * @param {string} [options.keyPrefix] - Optional prefix for the key
 * @returns {Function} Rate limiter function
 */
function createRateLimiter(options) {
  const { limit, window, keyPrefix = '' } = options;
  
  /**
   * Rate limit check function
   * @param {Request} request - Next.js request object
   * @param {Object} [context] - Optional context with userId
   * @returns {{ success: boolean, headers: Object, error?: { message: string, retryAfter: number } }}
   */
  return function rateLimiter(request, context = {}) {
    // Get identifier (prefer userId over IP)
    const userId = context.userId || null;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
    
    // Generate key based on identifier type
    const identifier = userId ? `user:${userId}` : `ip:${ip}`;
    const url = new URL(request.url);
    const endpoint = keyPrefix || url.pathname;
    const method = request.method;
    
    const key = generateKey(identifier, endpoint, method);
    const result = checkRateLimit(key, limit, window);
    
    const headers = getRateLimitHeaders(limit, result.remaining, result.resetAt);
    
    if (!result.allowed) {
      return {
        success: false,
        headers,
        error: {
          message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter,
        },
      };
    }
    
    return {
      success: true,
      headers,
    };
  };
}

/**
 * Apply rate limiting to a request and return a response if limited
 * @param {Request} request - Next.js request object
 * @param {Object} options - Rate limit options
 * @param {number} options.limit - Maximum requests allowed
 * @param {number} options.window - Time window in milliseconds
 * @param {Object} [context] - Optional context with userId
 * @returns {{ limited: boolean, response?: Response, headers: Object }}
 */
function applyRateLimit(request, options, context = {}) {
  const limiter = createRateLimiter(options);
  const result = limiter(request, context);
  
  if (!result.success) {
    return {
      limited: true,
      headers: result.headers,
      response: {
        error: result.error,
        status: 429,
      },
    };
  }
  
  return {
    limited: false,
    headers: result.headers,
  };
}

// ============================================
// CLEANUP
// ============================================

/**
 * Clean up expired rate limit records
 * Call this periodically to prevent memory leaks
 */
function cleanupExpiredRecords() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, record] of rateLimitStore.entries()) {
    if (now >= record.resetAt) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`[RateLimit] Cleaned up ${cleaned} expired records`);
  }
}

/**
 * Start automatic cleanup interval
 * @param {number} [intervalMs=60000] - Cleanup interval in milliseconds
 */
function startCleanupInterval(intervalMs = 60000) {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  cleanupInterval = setInterval(cleanupExpiredRecords, intervalMs);
  console.log(`[RateLimit] Cleanup interval started (every ${intervalMs}ms)`);
}

/**
 * Stop automatic cleanup interval
 */
function stopCleanupInterval() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('[RateLimit] Cleanup interval stopped');
  }
}

/**
 * Clear all rate limit records (useful for testing)
 */
function clearAllRecords() {
  rateLimitStore.clear();
  console.log('[RateLimit] All records cleared');
}

/**
 * Get current store size (for monitoring)
 * @returns {number} Number of records in store
 */
function getStoreSize() {
  return rateLimitStore.size;
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Core functions
  createRateLimiter,
  applyRateLimit,
  checkRateLimit,
  generateKey,
  getRateLimitHeaders,
  
  // Presets
  PRESETS,
  TIME_WINDOWS,
  
  // Cleanup functions
  cleanupExpiredRecords,
  startCleanupInterval,
  stopCleanupInterval,
  clearAllRecords,
  getStoreSize,
};
