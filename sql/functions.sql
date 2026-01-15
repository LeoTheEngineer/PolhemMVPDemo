-- ============================================
-- POLHEM MVP SQL FUNCTIONS
-- Run this script in Supabase SQL Editor after creating the schema
-- These functions can be called via Supabase RPC for optimized queries
-- ============================================

-- ============================================
-- DROP ALL FUNCTIONS (allows re-running this file)
-- ============================================
DROP FUNCTION IF EXISTS get_orders_quantity_by_date_range(DATE, DATE, UUID, UUID, order_status_enum);
DROP FUNCTION IF EXISTS get_production_quantity_by_time_range(TIMESTAMPTZ, TIMESTAMPTZ, UUID, UUID, UUID);
DROP FUNCTION IF EXISTS get_machine_oee(UUID, DATE);
DROP FUNCTION IF EXISTS get_all_machines_oee(DATE);
DROP FUNCTION IF EXISTS calculate_projected_stock(UUID, DATE);
DROP FUNCTION IF EXISTS calculate_all_products_projected_stock(DATE);
DROP FUNCTION IF EXISTS find_matching_predicted_order(UUID, UUID, DATE, INTEGER);
DROP FUNCTION IF EXISTS match_order_to_prediction(UUID, UUID);
DROP FUNCTION IF EXISTS regenerate_schedule(JSONB, JSONB);
DROP FUNCTION IF EXISTS get_orders_with_details(order_status_enum, UUID, DATE, DATE);
DROP FUNCTION IF EXISTS get_production_blocks_with_details(TIMESTAMPTZ, TIMESTAMPTZ, UUID);
DROP FUNCTION IF EXISTS get_dashboard_summary();
DROP FUNCTION IF EXISTS update_product_stock(UUID, INTEGER, VARCHAR);

-- ============================================
-- AGGREGATION FUNCTIONS
-- ============================================

-- Get total order quantity within a date range
-- Optional filters: product_id, customer_id, status
CREATE OR REPLACE FUNCTION get_orders_quantity_by_date_range(
    p_start_date DATE,
    p_end_date DATE,
    p_product_id UUID DEFAULT NULL,
    p_customer_id UUID DEFAULT NULL,
    p_status order_status_enum DEFAULT NULL
)
RETURNS TABLE (
    total_quantity BIGINT,
    order_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(o.quantity), 0)::BIGINT AS total_quantity,
        COUNT(o.id)::BIGINT AS order_count
    FROM orders o
    WHERE o.due_date >= p_start_date
      AND o.due_date <= p_end_date
      AND (p_product_id IS NULL OR o.product_id = p_product_id)
      AND (p_customer_id IS NULL OR o.customer_id = p_customer_id)
      AND (p_status IS NULL OR o.status = p_status);
END;
$$ LANGUAGE plpgsql STABLE;

-- Get total production quantity within a time range
-- Optional filters: product_id, machine_id, customer_id
CREATE OR REPLACE FUNCTION get_production_quantity_by_time_range(
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_product_id UUID DEFAULT NULL,
    p_machine_id UUID DEFAULT NULL,
    p_customer_id UUID DEFAULT NULL
)
RETURNS TABLE (
    total_quantity BIGINT,
    block_count BIGINT,
    total_production_minutes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(pb.batch_size), 0)::BIGINT AS total_quantity,
        COUNT(pb.id)::BIGINT AS block_count,
        COALESCE(SUM(EXTRACT(EPOCH FROM (pb.end_time - pb.start_time)) / 60), 0)::BIGINT AS total_production_minutes
    FROM production_blocks pb
    WHERE pb.start_time >= p_start_time
      AND pb.end_time <= p_end_time
      AND (p_product_id IS NULL OR pb.product_id = p_product_id)
      AND (p_machine_id IS NULL OR pb.machine_id = p_machine_id)
      AND (p_customer_id IS NULL OR pb.customer_id = p_customer_id);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- OEE (Overall Equipment Effectiveness) CALCULATION
-- ============================================

-- Calculate machine OEE for a specific date
-- OEE = (actual production time / available work hours) * 100
CREATE OR REPLACE FUNCTION get_machine_oee(
    p_machine_id UUID,
    p_date DATE
)
RETURNS TABLE (
    machine_id UUID,
    date DATE,
    production_minutes NUMERIC,
    available_minutes NUMERIC,
    oee_percentage NUMERIC
) AS $$
DECLARE
    v_work_hours INTEGER;
BEGIN
    -- Get work hours from settings
    SELECT work_hours_per_day INTO v_work_hours FROM settings WHERE id = 'main';

    IF v_work_hours IS NULL OR v_work_hours = 0 THEN
        v_work_hours := 16; -- Default fallback
    END IF;

    RETURN QUERY
    SELECT
        p_machine_id AS machine_id,
        p_date AS date,
        COALESCE(SUM(EXTRACT(EPOCH FROM (pb.end_time - pb.start_time)) / 60), 0)::NUMERIC AS production_minutes,
        (v_work_hours * 60)::NUMERIC AS available_minutes,
        CASE
            WHEN v_work_hours > 0 THEN
                ROUND((COALESCE(SUM(EXTRACT(EPOCH FROM (pb.end_time - pb.start_time)) / 60), 0) / (v_work_hours * 60)) * 100, 2)
            ELSE 0
        END AS oee_percentage
    FROM production_blocks pb
    WHERE pb.machine_id = p_machine_id
      AND pb.start_time::DATE = p_date;
END;
$$ LANGUAGE plpgsql STABLE;

-- Calculate OEE for all machines on a specific date
CREATE OR REPLACE FUNCTION get_all_machines_oee(
    p_date DATE
)
RETURNS TABLE (
    machine_id UUID,
    machine_name VARCHAR,
    machine_code VARCHAR,
    production_minutes NUMERIC,
    available_minutes NUMERIC,
    oee_percentage NUMERIC
) AS $$
DECLARE
    v_work_hours INTEGER;
BEGIN
    -- Get work hours from settings
    SELECT work_hours_per_day INTO v_work_hours FROM settings WHERE id = 'main';

    IF v_work_hours IS NULL OR v_work_hours = 0 THEN
        v_work_hours := 16;
    END IF;

    RETURN QUERY
    SELECT
        m.id AS machine_id,
        m.name AS machine_name,
        m.code AS machine_code,
        COALESCE(SUM(EXTRACT(EPOCH FROM (pb.end_time - pb.start_time)) / 60), 0)::NUMERIC AS production_minutes,
        (v_work_hours * 60)::NUMERIC AS available_minutes,
        CASE
            WHEN v_work_hours > 0 THEN
                ROUND((COALESCE(SUM(EXTRACT(EPOCH FROM (pb.end_time - pb.start_time)) / 60), 0) / (v_work_hours * 60)) * 100, 2)
            ELSE 0
        END AS oee_percentage
    FROM machines m
    LEFT JOIN production_blocks pb ON pb.machine_id = m.id AND pb.start_time::DATE = p_date
    GROUP BY m.id, m.name, m.code
    ORDER BY m.code;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- STOCK PROJECTION
-- ============================================

-- Calculate projected stock for a product at a future date
-- Formula: current_in_stock - orders_due_before_date + production_completed_before_date
CREATE OR REPLACE FUNCTION calculate_projected_stock(
    p_product_id UUID,
    p_target_date DATE
)
RETURNS TABLE (
    product_id UUID,
    current_stock INTEGER,
    orders_due INTEGER,
    production_scheduled INTEGER,
    projected_stock INTEGER
) AS $$
DECLARE
    v_current_stock INTEGER;
    v_orders_due INTEGER;
    v_production_scheduled INTEGER;
BEGIN
    -- Get current in_stock value
    SELECT COALESCE(p.in_stock, 0) INTO v_current_stock
    FROM products p
    WHERE p.id = p_product_id;

    -- Calculate total quantity from orders due before target date (pending/scheduled only)
    SELECT COALESCE(SUM(o.quantity), 0)::INTEGER INTO v_orders_due
    FROM orders o
    WHERE o.product_id = p_product_id
      AND o.due_date <= p_target_date
      AND o.status IN ('pending', 'scheduled', 'in_production');

    -- Calculate total quantity from production blocks completing before target date
    SELECT COALESCE(SUM(pb.batch_size), 0)::INTEGER INTO v_production_scheduled
    FROM production_blocks pb
    WHERE pb.product_id = p_product_id
      AND pb.end_time <= (p_target_date + INTERVAL '1 day')::TIMESTAMPTZ;

    RETURN QUERY
    SELECT
        p_product_id AS product_id,
        v_current_stock AS current_stock,
        v_orders_due AS orders_due,
        v_production_scheduled AS production_scheduled,
        (v_current_stock - v_orders_due + v_production_scheduled)::INTEGER AS projected_stock;
END;
$$ LANGUAGE plpgsql STABLE;

-- Calculate projected stock for all products at a future date
CREATE OR REPLACE FUNCTION calculate_all_products_projected_stock(
    p_target_date DATE
)
RETURNS TABLE (
    product_id UUID,
    product_name VARCHAR,
    sku VARCHAR,
    customer_name VARCHAR,
    current_stock INTEGER,
    orders_due INTEGER,
    production_scheduled INTEGER,
    projected_stock INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.sku,
        c.name AS customer_name,
        COALESCE(p.in_stock, 0) AS current_stock,
        COALESCE((
            SELECT SUM(o.quantity)::INTEGER
            FROM orders o
            WHERE o.product_id = p.id
              AND o.due_date <= p_target_date
              AND o.status IN ('pending', 'scheduled', 'in_production')
        ), 0) AS orders_due,
        COALESCE((
            SELECT SUM(pb.batch_size)::INTEGER
            FROM production_blocks pb
            WHERE pb.product_id = p.id
              AND pb.end_time <= (p_target_date + INTERVAL '1 day')::TIMESTAMPTZ
        ), 0) AS production_scheduled,
        (
            COALESCE(p.in_stock, 0)
            - COALESCE((
                SELECT SUM(o.quantity)::INTEGER
                FROM orders o
                WHERE o.product_id = p.id
                  AND o.due_date <= p_target_date
                  AND o.status IN ('pending', 'scheduled', 'in_production')
            ), 0)
            + COALESCE((
                SELECT SUM(pb.batch_size)::INTEGER
                FROM production_blocks pb
                WHERE pb.product_id = p.id
                  AND pb.end_time <= (p_target_date + INTERVAL '1 day')::TIMESTAMPTZ
            ), 0)
        )::INTEGER AS projected_stock
    FROM products p
    JOIN customers c ON c.id = p.customer_id
    ORDER BY c.name, p.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- PREDICTED ORDER MATCHING
-- ============================================

-- Find a matching predicted order based on time proximity (±10% of interval)
-- Returns the matching predicted_order or NULL if no match found
CREATE OR REPLACE FUNCTION find_matching_predicted_order(
    p_product_id UUID,
    p_customer_id UUID,
    p_order_date DATE,
    p_interval_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    predicted_order_id UUID,
    predicted_date DATE,
    predicted_quantity INTEGER,
    confidence_score DECIMAL,
    days_difference INTEGER,
    is_within_threshold BOOLEAN
) AS $$
DECLARE
    v_threshold_days INTEGER;
BEGIN
    -- Calculate threshold: ±10% of interval
    v_threshold_days := GREATEST(CEIL(p_interval_days * 0.1), 1);

    RETURN QUERY
    SELECT
        po.id AS predicted_order_id,
        po.predicted_date,
        po.predicted_quantity,
        po.confidence_score,
        ABS(po.predicted_date - p_order_date)::INTEGER AS days_difference,
        (ABS(po.predicted_date - p_order_date) <= v_threshold_days) AS is_within_threshold
    FROM predicted_orders po
    WHERE po.product_id = p_product_id
      AND po.customer_id = p_customer_id
      AND po.matching_order_id IS NULL  -- Not already matched
      AND ABS(po.predicted_date - p_order_date) <= v_threshold_days
    ORDER BY ABS(po.predicted_date - p_order_date) ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Match an order to a predicted order (transactional update)
CREATE OR REPLACE FUNCTION match_order_to_prediction(
    p_order_id UUID,
    p_predicted_order_id UUID
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_existing_match UUID;
BEGIN
    -- Check if predicted order is already matched
    SELECT matching_order_id INTO v_existing_match
    FROM predicted_orders
    WHERE id = p_predicted_order_id;

    IF v_existing_match IS NOT NULL THEN
        RETURN QUERY SELECT FALSE, 'Predicted order is already matched to another order';
        RETURN;
    END IF;

    -- Update the predicted order with the matching order ID
    UPDATE predicted_orders
    SET matching_order_id = p_order_id,
        updated_at = NOW()
    WHERE id = p_predicted_order_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Predicted order not found';
        RETURN;
    END IF;

    RETURN QUERY SELECT TRUE, 'Order matched successfully';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SCHEDULE REGENERATION (TRANSACTIONAL)
-- ============================================

-- Regenerate the entire production schedule
-- Deletes all existing blocks and inserts new ones atomically
CREATE OR REPLACE FUNCTION regenerate_schedule(
    p_blocks JSONB,
    p_metrics JSONB DEFAULT '{}'
)
RETURNS TABLE (
    success BOOLEAN,
    blocks_deleted INTEGER,
    blocks_inserted INTEGER,
    message TEXT
) AS $$
DECLARE
    v_deleted_count INTEGER;
    v_inserted_count INTEGER;
    v_block JSONB;
BEGIN
    -- Delete all existing production blocks
    DELETE FROM production_blocks;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    -- Insert new blocks from JSON array
    v_inserted_count := 0;

    FOR v_block IN SELECT * FROM jsonb_array_elements(p_blocks)
    LOOP
        INSERT INTO production_blocks (
            machine_id,
            product_id,
            customer_id,
            batch_size,
            start_time,
            end_time,
            setup_time_minutes,
            estimated_cost
        ) VALUES (
            (v_block->>'machine_id')::UUID,
            (v_block->>'product_id')::UUID,
            (v_block->>'customer_id')::UUID,
            (v_block->>'batch_size')::INTEGER,
            (v_block->>'start_time')::TIMESTAMPTZ,
            (v_block->>'end_time')::TIMESTAMPTZ,
            COALESCE((v_block->>'setup_time_minutes')::INTEGER, 0),
            (v_block->>'estimated_cost')::DECIMAL
        );
        v_inserted_count := v_inserted_count + 1;
    END LOOP;

    -- Update settings with new schedule metrics
    IF p_metrics IS NOT NULL AND p_metrics != '{}'::JSONB THEN
        UPDATE settings
        SET schedule_metrics = p_metrics,
            updated_at = NOW()
        WHERE id = 'main';
    END IF;

    RETURN QUERY SELECT TRUE, v_deleted_count, v_inserted_count, 'Schedule regenerated successfully';

EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 0, 0, 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ORDERS WITH PRODUCT & CUSTOMER INFO
-- ============================================

-- Get orders with full product and customer details
CREATE OR REPLACE FUNCTION get_orders_with_details(
    p_status order_status_enum DEFAULT NULL,
    p_customer_id UUID DEFAULT NULL,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    order_id UUID,
    order_quantity INTEGER,
    due_date DATE,
    status order_status_enum,
    priority INTEGER,
    notes TEXT,
    product_id UUID,
    product_name VARCHAR,
    product_sku VARCHAR,
    weight_per_unit DECIMAL,
    cycle_time INTEGER,
    cavity_count INTEGER,
    customer_id UUID,
    customer_name VARCHAR,
    material_id UUID,
    material_name VARCHAR,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id AS order_id,
        o.quantity AS order_quantity,
        o.due_date,
        o.status,
        o.priority,
        o.notes,
        p.id AS product_id,
        p.name AS product_name,
        p.sku AS product_sku,
        p.weight_per_unit,
        p.cycle_time,
        p.cavity_count,
        c.id AS customer_id,
        c.name AS customer_name,
        m.id AS material_id,
        m.name AS material_name,
        o.created_at
    FROM orders o
    JOIN products p ON p.id = o.product_id
    JOIN customers c ON c.id = o.customer_id
    LEFT JOIN materials m ON m.id = p.material_id
    WHERE (p_status IS NULL OR o.status = p_status)
      AND (p_customer_id IS NULL OR o.customer_id = p_customer_id)
      AND (p_start_date IS NULL OR o.due_date >= p_start_date)
      AND (p_end_date IS NULL OR o.due_date <= p_end_date)
    ORDER BY o.due_date ASC, o.priority ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- PRODUCTION BLOCKS WITH FULL DETAILS
-- ============================================

-- Get production blocks with product, machine, and customer details
CREATE OR REPLACE FUNCTION get_production_blocks_with_details(
    p_start_time TIMESTAMPTZ DEFAULT NULL,
    p_end_time TIMESTAMPTZ DEFAULT NULL,
    p_machine_id UUID DEFAULT NULL
)
RETURNS TABLE (
    block_id UUID,
    batch_size INTEGER,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    setup_time_minutes INTEGER,
    estimated_cost DECIMAL,
    machine_id UUID,
    machine_name VARCHAR,
    machine_code VARCHAR,
    product_id UUID,
    product_name VARCHAR,
    product_sku VARCHAR,
    customer_id UUID,
    customer_name VARCHAR,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pb.id AS block_id,
        pb.batch_size,
        pb.start_time,
        pb.end_time,
        pb.setup_time_minutes,
        pb.estimated_cost,
        m.id AS machine_id,
        m.name AS machine_name,
        m.code AS machine_code,
        p.id AS product_id,
        p.name AS product_name,
        p.sku AS product_sku,
        c.id AS customer_id,
        c.name AS customer_name,
        pb.created_at
    FROM production_blocks pb
    JOIN machines m ON m.id = pb.machine_id
    JOIN products p ON p.id = pb.product_id
    JOIN customers c ON c.id = pb.customer_id
    WHERE (p_start_time IS NULL OR pb.start_time >= p_start_time)
      AND (p_end_time IS NULL OR pb.end_time <= p_end_time)
      AND (p_machine_id IS NULL OR pb.machine_id = p_machine_id)
    ORDER BY pb.start_time ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- DASHBOARD SUMMARY STATISTICS
-- ============================================

-- Get dashboard summary statistics
CREATE OR REPLACE FUNCTION get_dashboard_summary()
RETURNS TABLE (
    total_customers BIGINT,
    total_products BIGINT,
    total_machines BIGINT,
    pending_orders BIGINT,
    scheduled_orders BIGINT,
    in_production_orders BIGINT,
    total_pending_quantity BIGINT,
    production_blocks_today BIGINT,
    average_oee_today NUMERIC
) AS $$
DECLARE
    v_work_hours INTEGER;
BEGIN
    SELECT work_hours_per_day INTO v_work_hours FROM settings WHERE id = 'main';
    IF v_work_hours IS NULL OR v_work_hours = 0 THEN
        v_work_hours := 16;
    END IF;

    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM customers)::BIGINT AS total_customers,
        (SELECT COUNT(*) FROM products)::BIGINT AS total_products,
        (SELECT COUNT(*) FROM machines)::BIGINT AS total_machines,
        (SELECT COUNT(*) FROM orders WHERE status = 'pending')::BIGINT AS pending_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'scheduled')::BIGINT AS scheduled_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'in_production')::BIGINT AS in_production_orders,
        (SELECT COALESCE(SUM(quantity), 0) FROM orders WHERE status IN ('pending', 'scheduled'))::BIGINT AS total_pending_quantity,
        (SELECT COUNT(*) FROM production_blocks WHERE start_time::DATE = CURRENT_DATE)::BIGINT AS production_blocks_today,
        (
            SELECT COALESCE(
                ROUND(AVG(
                    CASE
                        WHEN v_work_hours > 0 THEN
                            (COALESCE(machine_prod.prod_minutes, 0) / (v_work_hours * 60)) * 100
                        ELSE 0
                    END
                ), 2),
                0
            )
            FROM machines m
            LEFT JOIN (
                SELECT
                    pb.machine_id,
                    SUM(EXTRACT(EPOCH FROM (pb.end_time - pb.start_time)) / 60) AS prod_minutes
                FROM production_blocks pb
                WHERE pb.start_time::DATE = CURRENT_DATE
                GROUP BY pb.machine_id
            ) machine_prod ON machine_prod.machine_id = m.id
        )::NUMERIC AS average_oee_today;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- UPDATE PRODUCT STOCK (TRANSACTIONAL)
-- ============================================

-- Update product stock after production completion
CREATE OR REPLACE FUNCTION update_product_stock(
    p_product_id UUID,
    p_quantity_change INTEGER,
    p_operation VARCHAR DEFAULT 'add' -- 'add' or 'subtract'
)
RETURNS TABLE (
    success BOOLEAN,
    old_stock INTEGER,
    new_stock INTEGER,
    message TEXT
) AS $$
DECLARE
    v_old_stock INTEGER;
    v_new_stock INTEGER;
BEGIN
    -- Get current stock
    SELECT in_stock INTO v_old_stock FROM products WHERE id = p_product_id;

    IF v_old_stock IS NULL THEN
        RETURN QUERY SELECT FALSE, 0, 0, 'Product not found';
        RETURN;
    END IF;

    -- Calculate new stock
    IF p_operation = 'add' THEN
        v_new_stock := v_old_stock + p_quantity_change;
    ELSIF p_operation = 'subtract' THEN
        v_new_stock := v_old_stock - p_quantity_change;
        IF v_new_stock < 0 THEN
            v_new_stock := 0; -- Don't allow negative stock
        END IF;
    ELSE
        RETURN QUERY SELECT FALSE, v_old_stock, v_old_stock, 'Invalid operation. Use "add" or "subtract"';
        RETURN;
    END IF;

    -- Update stock
    UPDATE products
    SET in_stock = v_new_stock,
        updated_at = NOW()
    WHERE id = p_product_id;

    RETURN QUERY SELECT TRUE, v_old_stock, v_new_stock, 'Stock updated successfully';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'All SQL functions created successfully.' AS status;
