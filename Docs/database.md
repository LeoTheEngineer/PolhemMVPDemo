# Database Schema Documentation
# Polhem MVP - Supabase PostgreSQL

---

## Overview

This document defines the complete database schema for the Polhem production planning system. The database is hosted on **Supabase** (PostgreSQL) and contains all tables, relationships, and constraints required for the demo MVP.

### Database Configuration

| Property | Value |
|----------|-------|
| Provider | Supabase |
| Engine | PostgreSQL 15 |
| Region | EU (Frankfurt) |
| RLS | Enabled on all tables |

---

## Entity Relationship Diagram

```
┌─────────────┐ (standalone lookup)
│  materials  │◄─────────────────────────────────┐
└─────────────┘                                  │ FK (material_id)
                                                 │
┌─────────────┐     1:N     ┌─────────────┐──────┘
│  customers  │────────────►│  products   │
└──────┬──────┘             └──────┬──────┘
       │                           │
       │ 1:N                       │ 1:N
       │         ┌─────────────────┼─────────────────┐
       │         │                 │                 │
       ▼         ▼                 ▼                 ▼
┌─────────────┐ ┌─────────────────┐ ┌───────────────┐ ┌───────────────────┐
│   orders    │ │product_forecasts│ │predicted      │ │ production_blocks │
└──────┬──────┘ └─────────────────┘ │_orders        │ └───────────────────┘
       │                            └───────┬───────┘          │
       │                                    │                  │
       │◄───────────────────────────────────┘                  │
       │        (matching_order_id)                            │
       │                                                       │
       │                            ┌─────────────┐            │
       │                            │  machines   │◄───────────┘
       │                            └─────────────┘
       │
       │              ┌─────────────┐ (single row monolith, id='main')
       └──────────────│  settings   │
                      └─────────────┘
```

---

## SQL Scripts

All SQL scripts are located in the `SQL/` folder:

| Script | Purpose |
|--------|---------|
| `SQL/drop-tables.sql` | Reset database (drops all tables, triggers, types) |
| `SQL/create-tables.sql` | Create schema with RLS enabled |
| `SQL/seed-data.sql` | Populate demo data |
| `SQL/functions.sql` | PostgreSQL functions for optimized queries |

---

## Custom Types (Enums)

### `order_interval_enum`
Represents typical ordering frequency for products.
Values: `'daily'`, `'weekly'`, `'biweekly'`, `'monthly'`, `'quarterly'`, `'yearly'`

### `order_status_enum`
Represents the fulfillment status of an order.
Values: `'pending'`, `'scheduled'`, `'in_production'`, `'completed'`, `'cancelled'`

---

## Tables

### 1. `customers`

Stores customer (client company) information. In production, this data syncs from Pyramid ERP.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | `uuid` | `PRIMARY KEY` | `gen_random_uuid()` | Unique identifier |
| `name` | `varchar(255)` | `NOT NULL` | - | Customer company name |
| `created_at` | `timestamptz` | `NOT NULL` | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | `NOT NULL` | `now()` | Last update timestamp |

**Indexes:**
- `PRIMARY KEY` on `id`

**Relationships:**
- Referenced by: `products`, `orders`, `product_forecasts`, `predicted_orders`, `production_blocks`

---

### 2. `materials`

Standalone lookup table for plastic materials used in injection molding.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | `uuid` | `PRIMARY KEY` | `gen_random_uuid()` | Unique identifier |
| `name` | `varchar(100)` | `NOT NULL, UNIQUE` | - | Material name (e.g., "ABS", "PP") |
| `cost_per_kg` | `decimal(10,2)` | `NOT NULL` | - | Cost in SEK per kilogram |
| `density` | `decimal(8,4)` | | `NULL` | Material density (g/cm³) |
| `properties` | `jsonb` | | `'{}'` | Additional material properties |
| `created_at` | `timestamptz` | `NOT NULL` | `now()` | Record creation timestamp |

**Indexes:**
- `PRIMARY KEY` on `id`
- `UNIQUE` on `name`

**Relationships:**
- Referenced by: `products.material_id` (FK), `machines.materials` (UUID array)

---

### 3. `machines`

Physical injection molding machines with capabilities and specifications.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | `uuid` | `PRIMARY KEY` | `gen_random_uuid()` | Unique identifier |
| `name` | `varchar(100)` | `NOT NULL` | - | Machine display name |
| `code` | `varchar(20)` | `NOT NULL, UNIQUE` | - | Machine code identifier |
| `max_shot_weight` | `decimal(10,2)` | `NOT NULL` | - | Maximum shot weight (grams) |
| `clamp_force` | `integer` | `NOT NULL` | - | Clamping force (tons) |
| `max_pressure` | `decimal(10,2)` | `NOT NULL` | - | Maximum injection pressure |
| `max_temperature` | `decimal(10,2)` | `NOT NULL` | - | Maximum operating temp (°C) |
| `compatible_materials` | `text[]` | | `'{}'` | Array of compatible material names |
| `hourly_rate` | `decimal(10,2)` | `NOT NULL` | `150.00` | Machine hourly rate (SEK) |
| `status` | `varchar(50)` | | `'available'` | Machine status (available, in_use, maintenance, offline) |
| `properties` | `jsonb` | | `'{}'` | Additional machine properties |
| `created_at` | `timestamptz` | | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | | `now()` | Last update timestamp |

**Indexes:**
- `PRIMARY KEY` on `id`
- `UNIQUE` on `code`

**Relationships:**
- Referenced by: `production_blocks`

**Status Values:**
- `available` - Ready for scheduling
- `in_use` - Currently in production
- `maintenance` - Under maintenance
- `offline` - Not operational

---

### 4. `products`

Product catalog with manufacturing specifications. Each product belongs to one customer.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | `uuid` | `PRIMARY KEY` | `gen_random_uuid()` | Unique identifier |
| `customer_id` | `uuid` | `NOT NULL, REFERENCES customers(id)` | - | Owning customer |
| `name` | `varchar(255)` | `NOT NULL` | - | Product name |
| `sku` | `varchar(100)` | `UNIQUE` | `NULL` | Stock keeping unit code |
| `material_id` | `uuid` | `REFERENCES materials(id)` | `NULL` | Required material |
| `weight_per_unit` | `decimal(10,4)` | `NOT NULL` | - | Weight per unit in grams |
| `cycle_time` | `integer` | `NOT NULL` | - | Cycle time in seconds |
| `cavity_count` | `integer` | `NOT NULL` | `1` | Number of cavities in mold |
| `required_pressure` | `decimal(10,2)` | | `NULL` | Required injection pressure |
| `required_temperature` | `decimal(10,2)` | | `NULL` | Required mold temperature (°C) |
| `tool_id` | `varchar(100)` | | `NULL` | Tool/mold identifier |
| `compatible_machines` | `uuid[]` | | `'{}'` | Array of compatible machine IDs |
| `storage_cost_per_day` | `decimal(10,2)` | | `0.50` | Storage cost per unit per day |
| `in_stock` | `integer` | `NOT NULL` | `0` | Current inventory quantity |
| `properties` | `jsonb` | | `'{}'` | Additional product properties |
| `created_at` | `timestamptz` | | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | | `now()` | Last update timestamp |

**Indexes:**
- `PRIMARY KEY` on `id`
- `UNIQUE` on `sku`
- `INDEX` on `customer_id`
- `INDEX` on `material_id`

**Relationships:**
- Belongs to: `customers` (via `customer_id`)
- Belongs to: `materials` (via `material_id`)
- Referenced by: `orders`, `product_forecasts`, `predicted_orders`, `production_blocks`

**Constraints:**
- `in_stock >= 0`

---

### 5. `orders`

Actual customer orders (historical and current). In production, syncs from Pyramid ERP.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | `uuid` | `PRIMARY KEY` | `gen_random_uuid()` | Unique identifier |
| `customer_id` | `uuid` | `NOT NULL, REFERENCES customers(id)` | - | Ordering customer |
| `product_id` | `uuid` | `NOT NULL, REFERENCES products(id)` | - | Ordered product |
| `quantity` | `integer` | `NOT NULL` | - | Number of units ordered |
| `due_date` | `date` | `NOT NULL` | - | Required delivery date |
| `status` | `order_status_enum` | | `'pending'` | Fulfillment status |
| `priority` | `integer` | | `5` | Priority level (1=highest, 10=lowest) |
| `notes` | `text` | | `NULL` | Additional order notes |
| `created_at` | `timestamptz` | | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | | `now()` | Last update timestamp |

**Indexes:**
- `PRIMARY KEY` on `id`
- `INDEX` on `customer_id`
- `INDEX` on `product_id`
- `INDEX` on `due_date`
- `INDEX` on `status`

**Relationships:**
- Belongs to: `customers` (via `customer_id`)
- Belongs to: `products` (via `product_id`)
- Referenced by: `predicted_orders.matching_order_id`

**Constraints:**
- `quantity > 0`

---

### 6. `product_forecasts`

Customer-provided forecasts for future demand before actual orders are placed.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | `uuid` | `PRIMARY KEY` | `gen_random_uuid()` | Unique identifier |
| `product_id` | `uuid` | `NOT NULL, REFERENCES products(id)` | - | Forecasted product |
| `customer_id` | `uuid` | `NOT NULL, REFERENCES customers(id)` | - | Forecasting customer |
| `forecast_date` | `date` | `NOT NULL` | - | Date of the forecast |
| `predicted_quantity` | `integer` | `NOT NULL` | - | Forecasted quantity |
| `confidence_level` | `decimal(5,2)` | | `0.80` | Confidence level (0-1) |
| `created_at` | `timestamptz` | | `now()` | Record creation timestamp |

**Indexes:**
- `PRIMARY KEY` on `id`
- `UNIQUE` on `(product_id, forecast_date)`
- `INDEX` on `product_id`
- `INDEX` on `customer_id`

**Relationships:**
- Belongs to: `customers` (via `customer_id`)
- Belongs to: `products` (via `product_id`)

**Constraints:**
- `predicted_quantity > 0`

---

### 7. `predicted_orders`

System-generated order predictions based on historical data and patterns.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | `uuid` | `PRIMARY KEY` | `gen_random_uuid()` | Unique identifier |
| `product_id` | `uuid` | `NOT NULL, REFERENCES products(id)` | - | Product |
| `customer_id` | `uuid` | `NOT NULL, REFERENCES customers(id)` | - | Customer |
| `predicted_quantity` | `integer` | `NOT NULL` | - | Predicted order quantity |
| `predicted_date` | `date` | `NOT NULL` | - | Expected order date |
| `confidence_score` | `decimal(5,2)` | `NOT NULL` | - | Prediction confidence (0-1) |
| `basis` | `text` | | `NULL` | Basis for prediction (historical_pattern, recurring_monthly, seasonal_trend) |
| `matching_order_id` | `uuid` | `REFERENCES orders(id)` | `NULL` | Matched actual order (if any) |
| `created_at` | `timestamptz` | | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | | `now()` | Last update timestamp |

**Indexes:**
- `PRIMARY KEY` on `id`
- `INDEX` on `product_id`
- `INDEX` on `customer_id`
- `INDEX` on `matching_order_id`

**Relationships:**
- Belongs to: `customers` (via `customer_id`)
- Belongs to: `products` (via `product_id`)
- References: `orders` (via `matching_order_id`) - optional link to matched order

**Constraints:**
- `predicted_quantity > 0`
- `confidence_score BETWEEN 0 AND 1`

**Basis Values:**
- `historical_pattern` - Based on past order history
- `recurring_monthly` - Based on monthly recurring patterns
- `seasonal_trend` - Based on seasonal demand patterns

**Note:** When a real order comes in within a close timeframe (e.g., 2 days) of a predicted order for the same product/customer, the `matching_order_id` is set to link them for future analysis and model training.

---

### 8. `production_blocks`

Individual production runs. Each block represents one product batch on one machine for a time period. Standalone blocks not connected to orders - used to plan production capacity.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | `uuid` | `PRIMARY KEY` | `gen_random_uuid()` | Unique identifier |
| `machine_id` | `uuid` | `NOT NULL, REFERENCES machines(id)` | - | Assigned machine |
| `product_id` | `uuid` | `NOT NULL, REFERENCES products(id)` | - | Product to manufacture |
| `customer_id` | `uuid` | `NOT NULL, REFERENCES customers(id)` | - | Customer (denormalized for fast lookup) |
| `batch_size` | `integer` | `NOT NULL` | - | Units to produce |
| `start_time` | `timestamptz` | `NOT NULL` | - | Block start datetime |
| `end_time` | `timestamptz` | `NOT NULL` | - | Block end datetime |
| `setup_time_minutes` | `integer` | | `0` | Setup time before production |
| `estimated_cost` | `decimal(10,2)` | | `NULL` | Material + labor cost |
| `created_at` | `timestamptz` | | `now()` | Record creation timestamp |

**Indexes:**
- `PRIMARY KEY` on `id`
- `INDEX` on `machine_id`
- `INDEX` on `product_id`
- `INDEX` on `customer_id`
- `INDEX` on `start_time`

**Relationships:**
- Belongs to: `machines` (via `machine_id`)
- Belongs to: `products` (via `product_id`)
- Belongs to: `customers` (via `customer_id`)

**Constraints:**
- `batch_size > 0`
- `end_time > start_time`
- `setup_time_minutes >= 0`
- `estimated_cost >= 0`

**Validation Rules (Application Level):**

1. **Machine Compatibility:**
   - Machine pressure must be >= product requirement
   - Product temperature must be within machine range
   - Machine must support product's material

2. **Single-Tool Constraint:**
   - No overlapping blocks for same product (each product has one tool)

3. **Machine Time Conflict:**
   - No overlapping blocks on same machine

---

### 9. `settings`

Global application settings stored as a single row (monolith pattern). The `id` is always `'main'`.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | `text` | `PRIMARY KEY` | `'main'` | Always 'main' |
| `prediction_error_threshold` | `decimal(5,2)` | `NOT NULL` | `25.00` | Max allowed prediction error (%) |
| `storage_cost_per_m3` | `decimal(10,2)` | `NOT NULL` | `0` | SEK per m³ per day |
| `employee_cost_per_hour` | `decimal(10,2)` | `NOT NULL` | `0` | SEK per hour |
| `interest_rate` | `decimal(5,2)` | `NOT NULL` | `0` | Annual interest rate (%) |
| `delivery_buffer_days` | `integer` | `NOT NULL` | `2` | Days buffer before delivery |
| `setup_time_minutes` | `integer` | `NOT NULL` | `45` | Default setup/changeover time |
| `work_hours_per_day` | `integer` | `NOT NULL` | `16` | Working hours per day |
| `shifts_per_day` | `integer` | `NOT NULL` | `2` | Number of shifts per day |
| `schedule_metrics` | `jsonb` | | `'{}'` | Calculated schedule metrics (OEE, revenue, etc.) |
| `created_at` | `timestamptz` | `NOT NULL` | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | `NOT NULL` | `now()` | Last update timestamp |

**Indexes:**
- `PRIMARY KEY` on `id`

**Constraints:**
- `id = 'main'` (enforced by CHECK constraint)
- `prediction_error_threshold BETWEEN 0 AND 100`
- `storage_cost_per_m3 >= 0`
- `employee_cost_per_hour >= 0`
- `interest_rate BETWEEN 0 AND 100`
- `delivery_buffer_days >= 0`
- `setup_time_minutes >= 0`
- `work_hours_per_day > 0 AND work_hours_per_day <= 24`
- `shifts_per_day > 0`

**schedule_metrics JSONB Structure:**
```json
{
  "total_oee": 0.85,
  "total_production_hours": 1250.5,
  "total_setup_hours": 45.0,
  "capital_tied_up": 125000.00,
  "estimated_revenue": 450000.00,
  "last_calculated_at": "2026-01-15T10:30:00Z"
}
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-12 | Claude/Leo | Initial schema documentation |
| 1.1 | 2026-01-12 | Claude/Leo | Removed machine_materials junction table |
| 2.0 | 2026-01-15 | Claude/Leo | Major restructure: settings monolith, removed production_schedules, standalone production_blocks, simplified orders |
| 2.1 | 2026-01-15 | Claude/Leo | Synced documentation with actual SQL schema (create-tables.sql): updated machines, products, orders, predicted_orders, product_forecasts tables |
