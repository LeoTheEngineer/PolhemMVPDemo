-- ============================================
-- POLHEM MVP BOILERPLATE DATA
-- Run this script after creating the schema to populate demo data
-- ============================================

-- ============================================
-- MATERIALS (5 common injection molding materials)
-- ============================================
INSERT INTO materials (name, cost_per_kg, density, properties) VALUES
('ABS', 2.50, 1.04, '{"melt_temp_min": 220, "melt_temp_max": 260, "mold_temp_min": 40, "mold_temp_max": 80, "shrinkage": 0.5}'),
('Polypropylene (PP)', 1.80, 0.91, '{"melt_temp_min": 200, "melt_temp_max": 280, "mold_temp_min": 20, "mold_temp_max": 60, "shrinkage": 1.5}'),
('HDPE', 1.60, 0.95, '{"melt_temp_min": 180, "melt_temp_max": 230, "mold_temp_min": 20, "mold_temp_max": 60, "shrinkage": 2.5}'),
('Polyamide (PA/Nylon)', 4.20, 1.14, '{"melt_temp_min": 260, "melt_temp_max": 290, "mold_temp_min": 60, "mold_temp_max": 100, "shrinkage": 1.0}'),
('Polycarbonate (PC)', 4.80, 1.20, '{"melt_temp_min": 280, "melt_temp_max": 320, "mold_temp_min": 80, "mold_temp_max": 120, "shrinkage": 0.6}');

-- ============================================
-- MACHINES (10 injection molding machines)
-- ============================================
INSERT INTO machines (name, code, max_shot_weight, clamp_force, max_pressure, max_temperature, compatible_materials, hourly_rate, status, properties) VALUES
('Arburg 370S', 'M1', 150.00, 700, 2000.00, 350.00, ARRAY['ABS', 'PP', 'HDPE', 'PA', 'PC'], 180.00, 'available', '{"year": 2019, "type": "hydraulic"}'),
('Arburg 470A', 'M2', 250.00, 1100, 2200.00, 380.00, ARRAY['ABS', 'PP', 'HDPE', 'PA', 'PC'], 220.00, 'available', '{"year": 2020, "type": "electric"}'),
('Engel Victory 200', 'M3', 180.00, 800, 2100.00, 360.00, ARRAY['ABS', 'PP', 'HDPE', 'PA'], 190.00, 'available', '{"year": 2018, "type": "hydraulic"}'),
('Engel e-mac 100', 'M4', 100.00, 500, 1800.00, 320.00, ARRAY['ABS', 'PP', 'HDPE'], 150.00, 'available', '{"year": 2021, "type": "electric"}'),
('KraussMaffei CX 160', 'M5', 200.00, 1600, 2300.00, 400.00, ARRAY['ABS', 'PP', 'HDPE', 'PA', 'PC'], 250.00, 'available', '{"year": 2020, "type": "hybrid"}'),
('Sumitomo SE100EV', 'M6', 120.00, 600, 1900.00, 340.00, ARRAY['ABS', 'PP', 'HDPE'], 160.00, 'available', '{"year": 2019, "type": "electric"}'),
('Husky HyPET 300', 'M7', 300.00, 2000, 2500.00, 350.00, ARRAY['PP', 'HDPE'], 280.00, 'available', '{"year": 2018, "type": "hydraulic", "specialty": "PET preforms"}'),
('Arburg 520A', 'M8', 350.00, 1500, 2400.00, 380.00, ARRAY['ABS', 'PP', 'HDPE', 'PA', 'PC'], 260.00, 'available', '{"year": 2021, "type": "electric"}'),
('Engel duo 500', 'M9', 500.00, 5000, 2600.00, 420.00, ARRAY['ABS', 'PP', 'HDPE', 'PA', 'PC'], 350.00, 'available', '{"year": 2022, "type": "two-platen"}'),
('Wittmann Battenfeld SmartPower 120', 'M10', 140.00, 700, 1950.00, 350.00, ARRAY['ABS', 'PP', 'HDPE', 'PA'], 175.00, 'available', '{"year": 2020, "type": "servo-hydraulic"}');

-- ============================================
-- CUSTOMERS (5 demo customers)
-- ============================================
INSERT INTO customers (name) VALUES
('Volvo Cars'),
('IKEA Components'),
('Electrolux'),
('Husqvarna'),
('Atlas Copco');

-- ============================================
-- PRODUCTS (15 products across customers)
-- ============================================

DO $$
DECLARE
    abs_id UUID;
    pp_id UUID;
    hdpe_id UUID;
    pa_id UUID;
    pc_id UUID;
    volvo_id UUID;
    ikea_id UUID;
    electrolux_id UUID;
    husqvarna_id UUID;
    atlas_id UUID;
    m1_id UUID;
    m2_id UUID;
    m3_id UUID;
    m4_id UUID;
    m5_id UUID;
    m6_id UUID;
    m8_id UUID;
    m9_id UUID;
BEGIN
    -- Get material IDs
    SELECT id INTO abs_id FROM materials WHERE name = 'ABS';
    SELECT id INTO pp_id FROM materials WHERE name = 'Polypropylene (PP)';
    SELECT id INTO hdpe_id FROM materials WHERE name = 'HDPE';
    SELECT id INTO pa_id FROM materials WHERE name = 'Polyamide (PA/Nylon)';
    SELECT id INTO pc_id FROM materials WHERE name = 'Polycarbonate (PC)';

    -- Get customer IDs
    SELECT id INTO volvo_id FROM customers WHERE name = 'Volvo Cars';
    SELECT id INTO ikea_id FROM customers WHERE name = 'IKEA Components';
    SELECT id INTO electrolux_id FROM customers WHERE name = 'Electrolux';
    SELECT id INTO husqvarna_id FROM customers WHERE name = 'Husqvarna';
    SELECT id INTO atlas_id FROM customers WHERE name = 'Atlas Copco';

    -- Get machine IDs
    SELECT id INTO m1_id FROM machines WHERE code = 'M1';
    SELECT id INTO m2_id FROM machines WHERE code = 'M2';
    SELECT id INTO m3_id FROM machines WHERE code = 'M3';
    SELECT id INTO m4_id FROM machines WHERE code = 'M4';
    SELECT id INTO m5_id FROM machines WHERE code = 'M5';
    SELECT id INTO m6_id FROM machines WHERE code = 'M6';
    SELECT id INTO m8_id FROM machines WHERE code = 'M8';
    SELECT id INTO m9_id FROM machines WHERE code = 'M9';

    -- Insert products
    -- Volvo Products
    INSERT INTO products (customer_id, name, sku, material_id, weight_per_unit, cycle_time, cavity_count, required_pressure, required_temperature, tool_id, compatible_machines, storage_cost_per_day) VALUES
    (volvo_id, 'Dashboard Air Vent', 'VOL-AV-001', abs_id, 45.5, 28, 4, 1500, 240, 'T-VOL-001', ARRAY[m1_id, m2_id, m3_id], 0.75),
    (volvo_id, 'Door Handle Cover', 'VOL-DH-002', pc_id, 32.0, 22, 2, 1800, 300, 'T-VOL-002', ARRAY[m2_id, m5_id], 0.60),
    (volvo_id, 'Cup Holder Insert', 'VOL-CH-003', pp_id, 28.5, 18, 8, 1200, 220, 'T-VOL-003', ARRAY[m1_id, m4_id, m6_id], 0.45);

    -- IKEA Products
    INSERT INTO products (customer_id, name, sku, material_id, weight_per_unit, cycle_time, cavity_count, required_pressure, required_temperature, tool_id, compatible_machines, storage_cost_per_day) VALUES
    (ikea_id, 'Drawer Runner Clip', 'IKE-DR-001', pp_id, 8.2, 12, 16, 1000, 200, 'T-IKE-001', ARRAY[m4_id, m6_id], 0.25),
    (ikea_id, 'Cabinet Hinge Base', 'IKE-HB-002', pa_id, 15.5, 20, 8, 1400, 270, 'T-IKE-002', ARRAY[m1_id, m3_id], 0.35),
    (ikea_id, 'Shelf Support Pin', 'IKE-SP-003', hdpe_id, 3.8, 8, 32, 800, 190, 'T-IKE-003', ARRAY[m4_id, m6_id], 0.15);

    -- Electrolux Products
    INSERT INTO products (customer_id, name, sku, material_id, weight_per_unit, cycle_time, cavity_count, required_pressure, required_temperature, tool_id, compatible_machines, storage_cost_per_day) VALUES
    (electrolux_id, 'Washing Machine Dial', 'ELX-WD-001', abs_id, 22.0, 16, 4, 1300, 235, 'T-ELX-001', ARRAY[m1_id, m3_id, m4_id], 0.40),
    (electrolux_id, 'Refrigerator Shelf Bracket', 'ELX-RB-002', pp_id, 35.5, 24, 4, 1100, 210, 'T-ELX-002', ARRAY[m1_id, m2_id], 0.55),
    (electrolux_id, 'Dishwasher Spray Arm Hub', 'ELX-SA-003', pa_id, 18.0, 15, 6, 1500, 275, 'T-ELX-003', ARRAY[m2_id, m3_id], 0.38);

    -- Husqvarna Products
    INSERT INTO products (customer_id, name, sku, material_id, weight_per_unit, cycle_time, cavity_count, required_pressure, required_temperature, tool_id, compatible_machines, storage_cost_per_day) VALUES
    (husqvarna_id, 'Chainsaw Handle Grip', 'HUS-HG-001', pp_id, 85.0, 35, 2, 1600, 230, 'T-HUS-001', ARRAY[m2_id, m5_id], 0.90),
    (husqvarna_id, 'Trimmer Guard', 'HUS-TG-002', hdpe_id, 120.0, 45, 1, 1400, 200, 'T-HUS-002', ARRAY[m2_id, m8_id], 1.10),
    (husqvarna_id, 'Mower Wheel Cap', 'HUS-WC-003', abs_id, 42.0, 22, 4, 1350, 245, 'T-HUS-003', ARRAY[m1_id, m3_id], 0.65);

    -- Atlas Copco Products
    INSERT INTO products (customer_id, name, sku, material_id, weight_per_unit, cycle_time, cavity_count, required_pressure, required_temperature, tool_id, compatible_machines, storage_cost_per_day) VALUES
    (atlas_id, 'Compressor Valve Cover', 'ATL-VC-001', pa_id, 55.0, 30, 2, 1900, 280, 'T-ATL-001', ARRAY[m2_id, m5_id, m8_id], 0.85),
    (atlas_id, 'Tool Housing Shell', 'ATL-TH-002', abs_id, 180.0, 50, 1, 2000, 250, 'T-ATL-002', ARRAY[m5_id, m8_id, m9_id], 1.50),
    (atlas_id, 'Pneumatic Fitting Cap', 'ATL-PF-003', pp_id, 12.0, 14, 12, 1100, 215, 'T-ATL-003', ARRAY[m4_id, m6_id], 0.30);
END $$;

-- ============================================
-- ORDERS (Demo orders - all start as pending)
-- Status is calculated dynamically based on production blocks
-- ============================================

DO $$
DECLARE
    prod_record RECORD;
    order_date DATE;
    i INTEGER;
BEGIN
    -- Create orders for each product
    FOR prod_record IN SELECT p.id as product_id, p.customer_id, p.name
                       FROM products p
    LOOP
        -- Create 2-4 orders per product
        FOR i IN 1..FLOOR(RANDOM() * 3 + 2)::INTEGER LOOP
            -- Random due date within next 30 days
            order_date := CURRENT_DATE + (RANDOM() * 30)::INTEGER;

            -- All orders start as pending - status is calculated based on production blocks
            INSERT INTO orders (customer_id, product_id, quantity, due_date, status, priority, notes)
            VALUES (
                prod_record.customer_id,
                prod_record.product_id,
                (FLOOR(RANDOM() * 9 + 1) * 1000)::INTEGER, -- 1000-10000 units
                order_date,
                'pending',
                5, -- Default priority
                NULL
            );
        END LOOP;
    END LOOP;
END $$;

-- ============================================
-- SETTINGS (Monolith single-row table with id='main')
-- ============================================
INSERT INTO settings (
    id,
    prediction_error_threshold,
    storage_cost_per_m3,
    employee_cost_per_hour,
    interest_rate,
    delivery_buffer_days,
    setup_time_minutes,
    work_hours_per_day,
    shifts_per_day,
    schedule_metrics
) VALUES (
    'main',
    25.00,
    5.00,
    350.00,
    3.50,
    2,
    45,
    16,
    2,
    '{}'
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PRODUCT FORECASTS (Demo forecasts for next 30 days)
-- ============================================

DO $$
DECLARE
    prod_record RECORD;
    v_forecast_date DATE;
BEGIN
    FOR prod_record IN SELECT id, customer_id FROM products LIMIT 10 LOOP
        FOR i IN 1..4 LOOP
            v_forecast_date := CURRENT_DATE + (i * 7);
            INSERT INTO product_forecasts (product_id, customer_id, forecast_date, predicted_quantity, confidence_level)
            VALUES (
                prod_record.id,
                prod_record.customer_id,
                v_forecast_date,
                (FLOOR(RANDOM() * 5 + 1) * 1000)::INTEGER,
                ROUND((RANDOM() * 0.3 + 0.6)::NUMERIC, 2) -- 0.6-0.9 confidence
            )
            ON CONFLICT (product_id, forecast_date) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- ============================================
-- PREDICTED ORDERS (System-generated predictions)
-- These are similar to actual orders but for future dates
-- with confidence scores based on historical patterns
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

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify data counts
SELECT 'materials' as table_name, COUNT(*) as count FROM materials
UNION ALL SELECT 'machines', COUNT(*) FROM machines
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'settings', COUNT(*) FROM settings
UNION ALL SELECT 'product_forecasts', COUNT(*) FROM product_forecasts
UNION ALL SELECT 'predicted_orders', COUNT(*) FROM predicted_orders
UNION ALL SELECT 'production_blocks', COUNT(*) FROM production_blocks;
