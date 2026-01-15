# 06 - API Routes

## Purpose

Create all API route handlers for CRUD operations on database tables with rate limiting protection.

---

## Prerequisites

- `05-lib-utilities.md` completed
- `05b-rate-limiting.md` completed
- `lib/supabase.js` created
- `lib/rate-limit.js` created

---

## API Routes Overview

| Route | Methods | Rate Limits | Purpose |
|-------|---------|-------------|---------|
| `/api/customers` | GET, PUT | 60/min, 30/min | List all, Update |
| `/api/materials` | GET, PUT | 60/min, 30/min | List all, Update |
| `/api/machines` | GET, PUT | 60/min, 30/min | List all, Update |
| `/api/products` | GET, PUT | 60/min, 30/min | List all, Update |
| `/api/orders` | GET, POST, PUT, DELETE | 120/60/60/20 per min | Full CRUD |
| `/api/predicted-orders` | GET, POST, PUT, DELETE | 60/20/30/20 per min | Full CRUD |
| `/api/forecasts` | GET | 60/min | List product forecasts (read-only) |
| `/api/production-blocks` | GET, POST, PUT, DELETE | 120/30/60/20 per min | Full CRUD + Generate |
| `/api/production-blocks/generate` | POST | 5/min | Heavy computation |
| `/api/settings` | GET, PUT | 60/min, 10/min | Get/Update settings |
| `/api/health` | GET | 120/min | Health check for deployment |

**Note:** The `product_forecasts` table is read-only via API. Forecasts are customer-provided data separate from system-generated `predicted_orders`.

---

## Files to Create

```
app/api/
├── customers/
│   └── route.js
├── materials/
│   └── route.js
├── machines/
│   └── route.js
├── products/
│   └── route.js
├── orders/
│   └── route.js
├── predicted-orders/
│   └── route.js
├── forecasts/
│   └── route.js
├── production-blocks/
│   ├── route.js
│   └── generate/
│       └── route.js
├── settings/
│   └── route.js
└── health/
    └── route.js
```

---

## Implementation

### Step 1: Create `app/api/customers/route.js`

**Rate Limits:** GET 60/min, PUT 30/min

```javascript
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(request) {
  // Rate limit: 60 requests per minute
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

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('GET /api/customers error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}

export async function PUT(request) {
  // Rate limit: 30 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.CUSTOMERS_PUT);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: { message: 'ID is required' } },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('PUT /api/customers error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}
```

---

### Step 2: Create `app/api/materials/route.js`

**Rate Limits:** GET 60/min, PUT 30/min

```javascript
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(request) {
  // Rate limit: 60 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.MATERIALS_GET);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('name');

    if (error) throw error;

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('GET /api/materials error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}

export async function PUT(request) {
  // Rate limit: 30 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.MATERIALS_PUT);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: { message: 'ID is required' } },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('materials')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('PUT /api/materials error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}
```

---

### Step 3: Create `app/api/machines/route.js`

**Rate Limits:** GET 60/min, PUT 30/min

```javascript
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(request) {
  // Rate limit: 60 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.MACHINES_GET);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .order('code');

    if (error) throw error;

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('GET /api/machines error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}

export async function PUT(request) {
  // Rate limit: 30 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.MACHINES_PUT);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: { message: 'ID is required' } },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('machines')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('PUT /api/machines error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}
```

---

### Step 4: Create `app/api/products/route.js`

**Rate Limits:** GET 60/min, PUT 30/min

```javascript
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(request) {
  // Rate limit: 60 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.PRODUCTS_GET);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        customer:customers(id, name),
        material:materials(id, name, cost_per_kg)
      `)
      .order('name');

    if (error) throw error;

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}

export async function PUT(request) {
  // Rate limit: 30 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.PRODUCTS_PUT);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: { message: 'ID is required' } },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    // Remove nested objects if present
    delete updates.customer;
    delete updates.material;

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        customer:customers(id, name),
        material:materials(id, name, cost_per_kg)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('PUT /api/products error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}
```

---

### Step 5: Create `app/api/orders/route.js`

**This has full CRUD (Create, Read, Update, Delete).**

**Rate Limits:** GET 120/min, POST 30/min, PUT 60/min, DELETE 20/min

```javascript
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(request) {
  // Rate limit: 120 requests per minute (high-traffic endpoint)
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.ORDERS_GET);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const productId = searchParams.get('product_id');
    const status = searchParams.get('status');

    const supabase = createServerClient();
    let query = supabase
      .from('orders')
      .select(`
        *,
        customer:customers(id, name),
        product:products(id, name, sku, cycle_time, cavity_count)
      `)
      .order('due_date', { ascending: true });

    if (customerId) query = query.eq('customer_id', customerId);
    if (productId) query = query.eq('product_id', productId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('GET /api/orders error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}

export async function POST(request) {
  // Rate limit: 30 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.ORDERS_POST);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const body = await request.json();
    const { customer_id, product_id, quantity, due_date, priority, notes } = body;

    // Validation
    if (!customer_id || !product_id || !quantity || !due_date) {
      return NextResponse.json(
        { error: { message: 'customer_id, product_id, quantity, and due_date are required' } },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('orders')
      .insert({
        customer_id,
        product_id,
        quantity,
        due_date,
        priority: priority || 5,
        notes: notes || null,
        status: 'pending',
      })
      .select(`
        *,
        customer:customers(id, name),
        product:products(id, name, sku)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201, headers: rateLimitResult.headers });
  } catch (error) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}

export async function PUT(request) {
  // Rate limit: 60 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.ORDERS_PUT);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: { message: 'ID is required' } },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    // Remove nested objects if present
    delete updates.customer;
    delete updates.product;

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        customer:customers(id, name),
        product:products(id, name, sku)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('PUT /api/orders error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}

export async function DELETE(request) {
  // Rate limit: 20 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.ORDERS_DELETE);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: { message: 'ID is required' } },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const supabase = createServerClient();
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('DELETE /api/orders error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}
```

---

### Step 6: Create `app/api/predicted-orders/route.js`

**Rate Limits:** GET 60/min, POST 20/min, PUT 30/min, DELETE 20/min

```javascript
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(request) {
  // Rate limit: 60 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.PREDICTED_ORDERS_GET);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const productId = searchParams.get('product_id');

    const supabase = createServerClient();
    let query = supabase
      .from('predicted_orders')
      .select(`
        *,
        customer:customers(id, name),
        product:products(id, name, sku, cycle_time, cavity_count)
      `)
      .order('predicted_date', { ascending: true });

    if (customerId) query = query.eq('customer_id', customerId);
    if (productId) query = query.eq('product_id', productId);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('GET /api/predicted-orders error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}

export async function POST(request) {
  // Rate limit: 20 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.PREDICTED_ORDERS_POST);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const body = await request.json();
    const { product_id, customer_id, predicted_quantity, predicted_date, confidence_score, basis } = body;

    // Validation
    if (!product_id || !customer_id || !predicted_quantity || !predicted_date) {
      return NextResponse.json(
        { error: { message: 'product_id, customer_id, predicted_quantity, and predicted_date are required' } },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('predicted_orders')
      .insert({
        product_id,
        customer_id,
        predicted_quantity,
        predicted_date,
        confidence_score: confidence_score || 0.8,
        basis: basis || 'manual',
      })
      .select(`
        *,
        customer:customers(id, name),
        product:products(id, name, sku)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201, headers: rateLimitResult.headers });
  } catch (error) {
    console.error('POST /api/predicted-orders error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}

export async function PUT(request) {
  // Rate limit: 30 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.PREDICTED_ORDERS_PUT);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: { message: 'ID is required' } },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    // Remove nested objects if present
    delete updates.customer;
    delete updates.product;

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('predicted_orders')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        customer:customers(id, name),
        product:products(id, name, sku)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('PUT /api/predicted-orders error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}

export async function DELETE(request) {
  // Rate limit: 20 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.PREDICTED_ORDERS_DELETE);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: { message: 'ID is required' } },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const supabase = createServerClient();
    const { error } = await supabase
      .from('predicted_orders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('DELETE /api/predicted-orders error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}
```

---

### Step 6b: Create `app/api/forecasts/route.js`

This route provides read-only access to customer-provided product forecasts.

**Rate Limits:** GET 60/min

```javascript
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(request) {
  // Rate limit: 60 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.FORECASTS_GET);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const productId = searchParams.get('product_id');

    const supabase = createServerClient();
    let query = supabase
      .from('product_forecasts')
      .select(`
        *,
        customer:customers(id, name),
        product:products(id, name, sku)
      `)
      .order('forecast_date', { ascending: true });

    if (customerId) query = query.eq('customer_id', customerId);
    if (productId) query = query.eq('product_id', productId);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('GET /api/forecasts error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}
```

---

### Step 7: Create `app/api/production-blocks/route.js`

**Rate Limits:** GET 120/min, POST 30/min, PUT 60/min, DELETE 20/min (single), DELETE 2/hour (bulk)

```javascript
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(request) {
  // Rate limit: 120 requests per minute (high-traffic for Gantt chart)
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.PRODUCTION_BLOCKS_GET);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const machineId = searchParams.get('machine_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const supabase = createServerClient();
    let query = supabase
      .from('production_blocks')
      .select(`
        *,
        machine:machines(id, name, code, hourly_rate),
        product:products(id, name, sku, cycle_time, cavity_count),
        customer:customers(id, name)
      `)
      .order('start_time', { ascending: true });

    if (machineId) query = query.eq('machine_id', machineId);
    if (startDate) query = query.gte('start_time', startDate);
    if (endDate) query = query.lte('end_time', endDate);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('GET /api/production-blocks error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}

export async function POST(request) {
  // Rate limit: 30 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.PRODUCTION_BLOCKS_POST);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const body = await request.json();
    const { machine_id, product_id, customer_id, batch_size, start_time, end_time, setup_time_minutes } = body;

    // Validation
    if (!machine_id || !product_id || !customer_id || !batch_size || !start_time || !end_time) {
      return NextResponse.json(
        { error: { message: 'machine_id, product_id, customer_id, batch_size, start_time, and end_time are required' } },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('production_blocks')
      .insert({
        machine_id,
        product_id,
        customer_id,
        batch_size,
        start_time,
        end_time,
        setup_time_minutes: setup_time_minutes || 0,
      })
      .select(`
        *,
        machine:machines(id, name, code),
        product:products(id, name, sku),
        customer:customers(id, name)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201, headers: rateLimitResult.headers });
  } catch (error) {
    console.error('POST /api/production-blocks error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}

export async function PUT(request) {
  // Rate limit: 60 requests per minute (for drag-drop operations)
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.PRODUCTION_BLOCKS_PUT);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: { message: 'ID is required' } },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    // Remove nested objects if present
    delete updates.machine;
    delete updates.product;
    delete updates.customer;

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('production_blocks')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        machine:machines(id, name, code),
        product:products(id, name, sku),
        customer:customers(id, name)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('PUT /api/production-blocks error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const deleteAll = searchParams.get('all');

  // Different rate limits for single delete vs bulk delete
  const rateLimit = deleteAll === 'true' 
    ? RATE_LIMITS.PRODUCTION_BLOCKS_DELETE_ALL  // 2 requests per hour (dangerous)
    : RATE_LIMITS.PRODUCTION_BLOCKS_DELETE;     // 20 requests per minute

  const rateLimitResult = withRateLimit(request, rateLimit);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const supabase = createServerClient();

    if (deleteAll === 'true') {
      // Delete all production blocks (very restrictive: 2/hour)
      const { error } = await supabase
        .from('production_blocks')
        .delete()
        .gte('created_at', '1970-01-01'); // Delete all rows

      if (error) throw error;

      return NextResponse.json(
        { success: true, message: 'All blocks deleted' },
        { headers: rateLimitResult.headers }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: { message: 'ID is required' } },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const { error } = await supabase
      .from('production_blocks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('DELETE /api/production-blocks error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}
```

---

### Step 8: Create `app/api/production-blocks/generate/route.js`

This endpoint generates the production schedule using the simplified algorithm.

**Rate Limits:** POST 5/min (heavy computation)

```javascript
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { generateSchedule, calculateScheduleMetrics } from '@/models/schedule-generator';

export async function POST(request) {
  // Rate limit: 5 requests per minute (heavy computation)
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.SCHEDULE_GENERATE);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const supabase = createServerClient();

    // 1. Get all pending orders and predicted orders
    const [ordersResult, predictedResult, machinesResult, productsResult, settingsResult] = await Promise.all([
      supabase.from('orders').select('*, product:products(*)').in('status', ['pending', 'scheduled']),
      supabase.from('predicted_orders').select('*, product:products(*)'),
      supabase.from('machines').select('*').eq('status', 'available'),
      supabase.from('products').select('*'),
      supabase.from('settings').select('*').eq('id', 'main').single(),
    ]);

    if (ordersResult.error) throw ordersResult.error;
    if (predictedResult.error) throw predictedResult.error;
    if (machinesResult.error) throw machinesResult.error;
    if (productsResult.error) throw productsResult.error;
    if (settingsResult.error) throw settingsResult.error;

    const orders = ordersResult.data || [];
    const predictedOrders = predictedResult.data || [];
    const machines = machinesResult.data || [];
    const products = productsResult.data || [];
    const settings = settingsResult.data;

    // 2. Delete existing production blocks
    const { error: deleteError } = await supabase
      .from('production_blocks')
      .delete()
      .gte('created_at', '1970-01-01'); // Delete all rows

    if (deleteError) throw deleteError;

    // 3. Generate new schedule
    const blocks = generateSchedule({
      orders,
      predictedOrders,
      machines,
      products,
      settings,
    });

    // 4. Insert new blocks
    if (blocks.length > 0) {
      const { error: insertError } = await supabase
        .from('production_blocks')
        .insert(blocks);

      if (insertError) throw insertError;
    }

    // 5. Calculate and update metrics
    const metrics = calculateScheduleMetrics(blocks, machines, settings);

    const { error: metricsError } = await supabase
      .from('settings')
      .update({
        schedule_metrics: {
          ...metrics,
          has_manual_edits: false,
          last_generated_at: new Date().toISOString(),
        },
      })
      .eq('id', 'main');

    if (metricsError) throw metricsError;

    // 6. Return the generated blocks with related data
    const { data: resultBlocks, error: fetchError } = await supabase
      .from('production_blocks')
      .select(`
        *,
        machine:machines(id, name, code),
        product:products(id, name, sku),
        customer:customers(id, name)
      `)
      .order('start_time', { ascending: true });

    if (fetchError) throw fetchError;

    return NextResponse.json(
      {
        data: resultBlocks,
        metrics,
        message: `Generated ${blocks.length} production blocks`,
      },
      { headers: rateLimitResult.headers }
    );
  } catch (error) {
    console.error('POST /api/production-blocks/generate error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}
```

---

### Step 9: Create `app/api/settings/route.js`

**Rate Limits:** GET 60/min, PUT 10/min

```javascript
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(request) {
  // Rate limit: 60 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.SETTINGS_GET);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 'main')
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('GET /api/settings error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}

export async function PUT(request) {
  // Rate limit: 10 requests per minute (settings rarely change)
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.SETTINGS_PUT);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const body = await request.json();

    // Remove id from updates (it's fixed as 'main')
    delete body.id;
    delete body.created_at;

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('settings')
      .update(body)
      .eq('id', 'main')
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('PUT /api/settings error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}
```

---

### Step 10: Create `app/api/health/route.js`

This endpoint is used by DigitalOcean App Platform for health checks.

**Rate Limits:** GET 120/min (monitoring needs frequent access)

```javascript
import { NextResponse } from 'next/server';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(request) {
  // Rate limit: 120 requests per minute (for monitoring)
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.HEALTH_GET);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
    { headers: rateLimitResult.headers }
  );
}
```

---

## Folder Structure Commands

Create the necessary directories:

```bash
mkdir -p app/api/customers
mkdir -p app/api/materials
mkdir -p app/api/machines
mkdir -p app/api/products
mkdir -p app/api/orders
mkdir -p app/api/predicted-orders
mkdir -p app/api/forecasts
mkdir -p app/api/production-blocks/generate
mkdir -p app/api/settings
mkdir -p app/api/health
```

---

## Rate Limiting Summary

| Endpoint | GET | POST | PUT | DELETE |
|----------|-----|------|-----|--------|
| `/api/customers` | 60/min | - | 30/min | - |
| `/api/materials` | 60/min | - | 30/min | - |
| `/api/machines` | 60/min | - | 30/min | - |
| `/api/products` | 60/min | - | 30/min | - |
| `/api/orders` | 120/min | 30/min | 60/min | 20/min |
| `/api/predicted-orders` | 60/min | 20/min | 30/min | 20/min |
| `/api/forecasts` | 60/min | - | - | - |
| `/api/production-blocks` | 120/min | 30/min | 60/min | 20/min or 2/hour |
| `/api/production-blocks/generate` | - | 5/min | - | - |
| `/api/settings` | 60/min | - | 10/min | - |
| `/api/health` | 120/min | - | - | - |

---

## Verification

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test each endpoint with curl (check headers):**

   ```bash
   # Get customers (check rate limit headers)
   curl -i http://localhost:3000/api/customers
   
   # You should see these headers in the response:
   # X-RateLimit-Limit: 60
   # X-RateLimit-Remaining: 59
   # X-RateLimit-Reset: 1705312800
   ```

3. **Test rate limiting:**

   ```bash
   # Run this to trigger rate limit on health endpoint
   for i in {1..130}; do
     curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/health
   done
   
   # After 120 requests, you should see 429 responses
   ```

4. **Expected responses:**
   - All endpoints should return `{ "data": [...] }` or `{ "data": {...} }`
   - Rate limited responses return `{ "error": { "message": "Rate limit exceeded...", "retryAfter": N } }` with status 429
   - All responses include `X-RateLimit-*` headers

---

## API Response Format

All endpoints follow this format:

**Success:**
```json
{
  "data": { ... }
}
```

**Error:**
```json
{
  "error": {
    "message": "Error description"
  }
}
```

**Rate Limited (429):**
```json
{
  "error": {
    "message": "Rate limit exceeded. Try again in 45 seconds.",
    "retryAfter": 45
  }
}
```

---

## Next Step

Proceed to `07-business-models.md` to create the simplified calculation models.
