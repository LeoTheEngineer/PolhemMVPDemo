# 04 - Seed Data Updates

## Purpose

Add predicted orders data to the database. The `predicted_orders` table stores system-generated predictions that will be displayed alongside real orders in the Orders timeline view.

---

## Prerequisites

- `03-database-setup.md` completed
- All tables created and base seed data inserted
- Supabase SQL Editor access

---

## Overview

The existing `seed-data.sql` creates:
- Orders (real orders with random due dates in next 30 days)
- Product forecasts (customer-provided forecasts)

We need to add:
- **Predicted orders** (system predictions similar to orders but for future dates with confidence scores)

---

## Implementation

### Step 1: Add Predicted Orders to Seed Data

Run the following SQL in Supabase SQL Editor to insert predicted orders:

```sql
-- ============================================
-- PREDICTED ORDERS (System-generated predictions)
-- These are similar to actual orders but for future dates
-- with slight variations and confidence scores
-- ============================================

DO $$
DECLARE
    prod_record RECORD;
    v_predicted_date DATE;
    v_quantity INTEGER;
    v_confidence DECIMAL(5,2);
    v_basis TEXT;
    i INTEGER;
BEGIN
    -- Create predicted orders for each product
    FOR prod_record IN 
        SELECT p.id as product_id, p.customer_id, p.name as product_name, c.name as customer_name
        FROM products p
        JOIN customers c ON p.customer_id = c.id
    LOOP
        -- Create 3-5 predicted orders per product, spanning next 60 days
        FOR i IN 1..FLOOR(RANDOM() * 3 + 3)::INTEGER LOOP
            -- Predicted date between 7 and 60 days from now
            v_predicted_date := CURRENT_DATE + (7 + FLOOR(RANDOM() * 53))::INTEGER;
            
            -- Quantity between 2000 and 15000 (multiples of 500)
            v_quantity := (FLOOR(RANDOM() * 26 + 4) * 500)::INTEGER;
            
            -- Confidence score between 0.60 and 0.95
            -- Higher confidence for nearer dates
            v_confidence := ROUND(
                (0.95 - ((v_predicted_date - CURRENT_DATE) * 0.005))::NUMERIC, 
                2
            );
            -- Clamp between 0.60 and 0.95
            IF v_confidence < 0.60 THEN v_confidence := 0.60; END IF;
            IF v_confidence > 0.95 THEN v_confidence := 0.95; END IF;
            
            -- Basis text explaining the prediction
            IF RANDOM() < 0.4 THEN
                v_basis := 'historical_pattern';
            ELSIF RANDOM() < 0.7 THEN
                v_basis := 'recurring_monthly';
            ELSE
                v_basis := 'seasonal_trend';
            END IF;
            
            INSERT INTO predicted_orders (
                product_id,
                customer_id,
                predicted_quantity,
                predicted_date,
                confidence_score,
                basis
            ) VALUES (
                prod_record.product_id,
                prod_record.customer_id,
                v_quantity,
                v_predicted_date,
                v_confidence,
                v_basis
            );
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Predicted orders created successfully';
END $$;
```

---

### Step 2: Verify Predicted Orders

Run this query to verify the data was inserted:

```sql
-- Count predicted orders
SELECT COUNT(*) as total_predicted_orders FROM predicted_orders;

-- View sample predicted orders with product and customer names
SELECT 
    po.id,
    c.name as customer,
    p.name as product,
    po.predicted_quantity,
    po.predicted_date,
    po.confidence_score,
    po.basis
FROM predicted_orders po
JOIN customers c ON po.customer_id = c.id
JOIN products p ON po.product_id = p.id
ORDER BY po.predicted_date
LIMIT 20;
```

**Expected results:**
- Total predicted orders: ~45-75 (3-5 per product × 15 products)
- Each row should have valid customer and product names
- Dates should range from 7-60 days in the future
- Confidence scores should range from 0.60-0.95

---

### Step 3: Verify Combined Order View

This query simulates what the Orders timeline will show - combining real orders and predictions:

```sql
-- Combined view of real orders and predicted orders for a specific product
WITH combined_orders AS (
    -- Real orders
    SELECT 
        o.id,
        'real' as order_type,
        c.name as customer,
        p.name as product,
        o.quantity,
        o.due_date as date,
        1.00::DECIMAL as confidence,
        o.status::TEXT as status
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    JOIN products p ON o.product_id = p.id
    
    UNION ALL
    
    -- Predicted orders
    SELECT 
        po.id,
        'predicted' as order_type,
        c.name as customer,
        p.name as product,
        po.predicted_quantity as quantity,
        po.predicted_date as date,
        po.confidence_score as confidence,
        po.basis as status
    FROM predicted_orders po
    JOIN customers c ON po.customer_id = c.id
    JOIN products p ON po.product_id = p.id
)
SELECT * FROM combined_orders
ORDER BY date, order_type
LIMIT 30;
```

---

### Step 4: Add Sample Matched Orders (Optional)

To demonstrate the matching feature (linking predictions to actual orders that came in), run:

```sql
-- Link some predicted orders to actual orders (simulating matches)
-- This shows how the system tracks prediction accuracy

DO $$
DECLARE
    pred_record RECORD;
    order_record RECORD;
BEGIN
    -- Find predicted orders that have similar actual orders (same product, similar date)
    FOR pred_record IN 
        SELECT po.id as predicted_id, po.product_id, po.predicted_date
        FROM predicted_orders po
        WHERE po.matching_order_id IS NULL
        LIMIT 5
    LOOP
        -- Find a matching actual order
        SELECT o.id INTO order_record
        FROM orders o
        WHERE o.product_id = pred_record.product_id
          AND ABS(o.due_date - pred_record.predicted_date) <= 7  -- Within 7 days
          AND NOT EXISTS (
              SELECT 1 FROM predicted_orders po2 
              WHERE po2.matching_order_id = o.id
          )
        LIMIT 1;
        
        -- If found, link them
        IF order_record.id IS NOT NULL THEN
            UPDATE predicted_orders 
            SET matching_order_id = order_record.id
            WHERE id = pred_record.predicted_id;
        END IF;
    END LOOP;
END $$;

-- Verify matched orders
SELECT 
    po.id as prediction_id,
    p.name as product,
    po.predicted_quantity,
    po.predicted_date,
    o.quantity as actual_quantity,
    o.due_date as actual_date,
    ABS(po.predicted_quantity - o.quantity)::DECIMAL / o.quantity * 100 as quantity_error_pct
FROM predicted_orders po
JOIN orders o ON po.matching_order_id = o.id
JOIN products p ON po.product_id = p.id;
```

---

## Alternative: Update seed-data.sql Directly

If you prefer to modify the `sql/seed-data.sql` file directly, add this section **after** the ORDERS section and **before** the SETTINGS section:

```sql
-- ============================================
-- PREDICTED ORDERS (System-generated predictions)
-- ============================================

DO $$
DECLARE
    prod_record RECORD;
    v_predicted_date DATE;
    v_quantity INTEGER;
    v_confidence DECIMAL(5,2);
    v_basis TEXT;
    i INTEGER;
BEGIN
    FOR prod_record IN 
        SELECT p.id as product_id, p.customer_id
        FROM products p
    LOOP
        FOR i IN 1..FLOOR(RANDOM() * 3 + 3)::INTEGER LOOP
            v_predicted_date := CURRENT_DATE + (7 + FLOOR(RANDOM() * 53))::INTEGER;
            v_quantity := (FLOOR(RANDOM() * 26 + 4) * 500)::INTEGER;
            v_confidence := ROUND(
                GREATEST(0.60, LEAST(0.95, 0.95 - ((v_predicted_date - CURRENT_DATE) * 0.005)))::NUMERIC, 
                2
            );
            
            IF RANDOM() < 0.4 THEN v_basis := 'historical_pattern';
            ELSIF RANDOM() < 0.7 THEN v_basis := 'recurring_monthly';
            ELSE v_basis := 'seasonal_trend';
            END IF;
            
            INSERT INTO predicted_orders (
                product_id, customer_id, predicted_quantity, 
                predicted_date, confidence_score, basis
            ) VALUES (
                prod_record.product_id, prod_record.customer_id, 
                v_quantity, v_predicted_date, v_confidence, v_basis
            );
        END LOOP;
    END LOOP;
END $$;
```

---

## Verification Checklist

Run the final verification query:

```sql
SELECT 
  'customers' as table_name, COUNT(*) as row_count FROM customers
UNION ALL SELECT 'materials', COUNT(*) FROM materials
UNION ALL SELECT 'machines', COUNT(*) FROM machines
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'product_forecasts', COUNT(*) FROM product_forecasts
UNION ALL SELECT 'predicted_orders', COUNT(*) FROM predicted_orders
UNION ALL SELECT 'production_blocks', COUNT(*) FROM production_blocks
UNION ALL SELECT 'settings', COUNT(*) FROM settings
ORDER BY table_name;
```

**Expected results:**

| table_name | row_count |
|------------|-----------|
| customers | 4 |
| machines | 10 |
| materials | 5 |
| orders | ~30-60 |
| predicted_orders | ~45-75 |
| product_forecasts | ~40 |
| production_blocks | 0 |
| products | 15 |
| settings | 1 |

---

## Data Relationships Summary

```
Real Orders (orders table)
├── customer_id → customers
├── product_id → products
└── status: pending/scheduled/in_production/completed

Predicted Orders (predicted_orders table)
├── customer_id → customers
├── product_id → products
├── confidence_score: 0.60-0.95
├── basis: historical_pattern/recurring_monthly/seasonal_trend
└── matching_order_id → orders (when prediction matches real order)
```

---

## Next Step

Proceed to `05-lib-utilities.md` to create the Supabase ES Module wrapper and utility functions.
