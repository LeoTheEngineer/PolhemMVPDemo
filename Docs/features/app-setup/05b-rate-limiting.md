# 05b - Rate Limiting

## Purpose

Implement rate limiting for all API endpoints to prevent abuse and protect the database from excessive requests.

---

## Prerequisites

- `05-lib-utilities.md` completed
- `lib/supabase.js` created

---

## Overview

Rate limiting protects your API from:
- **Abuse:** Malicious users making excessive requests
- **Resource exhaustion:** Database overload from too many queries
- **Cost control:** Preventing runaway API usage

### Architecture

```
Request → Rate Limit Check → API Handler → Response
              ↓
         [In-Memory Store]
              ↓
    ┌─────────────────────────┐
    │ Key: ip:1.2.3.4:GET:/api│
    │ Count: 45               │
    │ Reset: 1705312800000    │
    └─────────────────────────┘
```

### Limiting Strategy

| Identifier Type | When Used | Example Key |
|-----------------|-----------|-------------|
| IP Address | Unauthenticated requests | `ip:192.168.1.1:GET:/api/orders` |
| User ID | Authenticated requests (via Clerk) | `user:user_abc123:POST:/api/orders` |

---

## Files Created

```
Modules/
└── rate-limit.js      # Core rate limiting module (CommonJS)

lib/
└── rate-limit.js      # ES Module wrapper for API routes
```

---

## Rate Limits by Endpoint

### Summary Table

| Endpoint | Method | Limit | Window | Reason |
|----------|--------|-------|--------|--------|
| `/api/customers` | GET | 60 | 1 min | Standard read |
| `/api/customers` | PUT | 30 | 1 min | Standard update |
| `/api/materials` | GET | 60 | 1 min | Standard read |
| `/api/materials` | PUT | 30 | 1 min | Standard update |
| `/api/machines` | GET | 60 | 1 min | Standard read |
| `/api/machines` | PUT | 30 | 1 min | Standard update |
| `/api/products` | GET | 60 | 1 min | Standard read |
| `/api/products` | PUT | 30 | 1 min | Standard update |
| `/api/orders` | GET | 120 | 1 min | High-traffic (timeline view) |
| `/api/orders` | POST | 30 | 1 min | Create orders |
| `/api/orders` | PUT | 60 | 1 min | Update orders |
| `/api/orders` | DELETE | 20 | 1 min | Delete orders |
| `/api/predicted-orders` | GET | 60 | 1 min | Standard read |
| `/api/predicted-orders` | POST | 20 | 1 min | Create predictions |
| `/api/predicted-orders` | PUT | 30 | 1 min | Update predictions |
| `/api/predicted-orders` | DELETE | 20 | 1 min | Delete predictions |
| `/api/forecasts` | GET | 60 | 1 min | Read-only endpoint |
| `/api/production-blocks` | GET | 120 | 1 min | High-traffic (Gantt chart) |
| `/api/production-blocks` | POST | 30 | 1 min | Create blocks |
| `/api/production-blocks` | PUT | 60 | 1 min | Update blocks (drag-drop) |
| `/api/production-blocks` | DELETE | 20 | 1 min | Delete single block |
| `/api/production-blocks?all=true` | DELETE | 2 | 1 hour | Bulk delete (dangerous) |
| `/api/production-blocks/generate` | POST | 5 | 1 min | Heavy computation |
| `/api/settings` | GET | 60 | 1 min | Standard read |
| `/api/settings` | PUT | 10 | 1 min | Rarely changed |
| `/api/health` | GET | 120 | 1 min | Monitoring needs |

---

## Implementation

The rate limiting module has already been created. This document shows how to use it in API routes.

### Usage Pattern 1: Simple Rate Limiting

Use this pattern for straightforward rate limiting:

```javascript
import { NextResponse } from 'next/server';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { createServerClient } from '@/lib/supabase';

export async function GET(request) {
  // Apply rate limiting
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.CUSTOMERS_GET);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    if (error) throw error;

    return NextResponse.json(
      { data },
      { headers: rateLimitResult.headers }
    );
  } catch (error) {
    console.error('GET /api/customers error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}
```

### Usage Pattern 2: Handler Wrapper

Use this for cleaner code with the handler wrapper:

```javascript
import { NextResponse } from 'next/server';
import { withRateLimitHandler, RATE_LIMITS } from '@/lib/rate-limit';
import { createServerClient } from '@/lib/supabase';

async function getCustomers(request) {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/customers error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
  }
}

export const GET = withRateLimitHandler(getCustomers, RATE_LIMITS.CUSTOMERS_GET);
```

### Usage Pattern 3: Multiple Methods with createRateLimitedHandler

Use this when you have multiple HTTP methods in one route:

```javascript
import { NextResponse } from 'next/server';
import { createRateLimitedHandler, RATE_LIMITS } from '@/lib/rate-limit';
import { createServerClient } from '@/lib/supabase';

async function handleGet(request) {
  const supabase = createServerClient();
  const { data, error } = await supabase.from('customers').select('*').order('name');
  if (error) throw error;
  return NextResponse.json({ data });
}

async function handlePut(request) {
  const body = await request.json();
  const { id, ...updates } = body;
  // ... update logic
  return NextResponse.json({ data });
}

const handlers = createRateLimitedHandler({
  GET: { handler: handleGet, rateLimit: RATE_LIMITS.CUSTOMERS_GET },
  PUT: { handler: handlePut, rateLimit: RATE_LIMITS.CUSTOMERS_PUT },
});

export const GET = handlers.GET;
export const PUT = handlers.PUT;
```

### Usage Pattern 4: User-Based Rate Limiting

For stricter per-user limits (uses Clerk userId):

```javascript
import { NextResponse } from 'next/server';
import { withUserRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request) {
  // This will use userId if authenticated, IP otherwise
  const rateLimitResult = await withUserRateLimit(request, RATE_LIMITS.ORDERS_POST);
  
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  // ... handler logic
}
```

---

## Response Headers

All rate-limited responses include these headers:

| Header | Description | Example |
|--------|-------------|---------|
| `X-RateLimit-Limit` | Maximum requests allowed | `60` |
| `X-RateLimit-Remaining` | Requests remaining in window | `45` |
| `X-RateLimit-Reset` | Unix timestamp when window resets | `1705312800` |

### Rate Limited Response (429)

When a request is rate limited, the response will be:

```json
{
  "error": {
    "message": "Rate limit exceeded. Try again in 45 seconds.",
    "retryAfter": 45
  }
}
```

---

## Customizing Rate Limits

### Adding a New Endpoint

Add the rate limit definition to `lib/rate-limit.js`:

```javascript
export const RATE_LIMITS = {
  // ... existing limits
  
  // Your new endpoint
  MY_ENDPOINT_GET: {
    limit: 30,
    window: TIME_WINDOWS.MINUTE,
    description: '30 requests per minute',
  },
};
```

### Custom Time Windows

Available time windows:

```javascript
import { TIME_WINDOWS } from '@/lib/rate-limit';

TIME_WINDOWS.SECOND  // 1000ms
TIME_WINDOWS.MINUTE  // 60000ms
TIME_WINDOWS.HOUR    // 3600000ms
TIME_WINDOWS.DAY     // 86400000ms
```

### Inline Custom Limits

You can also define limits inline:

```javascript
const rateLimitResult = withRateLimit(request, {
  limit: 5,
  window: 60000, // 1 minute
});
```

---

## Memory Management

The in-memory rate limiter automatically cleans up expired records. You can also manually manage it:

```javascript
import { 
  startCleanupInterval, 
  stopCleanupInterval,
  clearAllRecords,
  getStoreSize 
} from '@/lib/rate-limit';

// Start automatic cleanup (runs every 60 seconds by default)
startCleanupInterval();

// Check how many records are in memory
console.log(`Rate limit records: ${getStoreSize()}`);

// Clear all records (useful for testing)
clearAllRecords();
```

---

## Production Considerations

### Current Implementation: In-Memory

**Pros:**
- Simple, no external dependencies
- Fast (O(1) lookups)
- Zero configuration

**Cons:**
- Resets on server restart
- Not shared across serverless instances
- Memory usage grows with traffic

### When to Upgrade to Redis/Upstash

Consider upgrading when:
- Running multiple server instances
- Using serverless deployment (Vercel, Cloudflare Workers)
- Need persistence across restarts
- Traffic exceeds ~10,000 concurrent users

### Migration Path

To migrate to Upstash Redis:

1. Install: `npm install @upstash/ratelimit @upstash/redis`
2. Replace `Modules/rate-limit.js` implementation
3. Update environment variables with Redis credentials
4. Keep the same `lib/rate-limit.js` wrapper interface

---

## Testing Rate Limits

### Manual Testing with curl

```bash
# Make multiple requests quickly to trigger rate limit
for i in {1..70}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/customers
done

# You should see:
# 200 (60 times)
# 429 (10 times - rate limited)
```

### Check Response Headers

```bash
curl -i http://localhost:3000/api/customers

# Response headers:
# X-RateLimit-Limit: 60
# X-RateLimit-Remaining: 59
# X-RateLimit-Reset: 1705312800
```

---

## Verification

1. **Check files exist:**
   ```bash
   ls -la Modules/rate-limit.js
   ls -la lib/rate-limit.js
   ```

2. **Test import works:**
   ```javascript
   // In a test file or API route
   import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
   console.log(RATE_LIMITS.ORDERS_GET); // Should print { limit: 120, window: 60000, ... }
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Test an endpoint:**
   ```bash
   curl -i http://localhost:3000/api/health
   ```
   Should include `X-RateLimit-*` headers.

---

## Next Step

Proceed to `06-api-routes.md` to implement all API routes with rate limiting applied.
