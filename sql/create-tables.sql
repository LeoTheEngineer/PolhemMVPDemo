-- ============================================
-- POLHEM MVP DATABASE SCHEMA
-- Run this script in Supabase SQL Editor to create all tables
-- ============================================

-- Create custom enum types
CREATE TYPE order_interval_enum AS ENUM ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly');
CREATE TYPE order_status_enum AS ENUM ('pending', 'scheduled', 'in_production', 'completed', 'cancelled');

-- ============================================
-- CUSTOMERS TABLE
-- ============================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- MATERIALS TABLE
-- ============================================
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    cost_per_kg DECIMAL(10, 2) NOT NULL,
    density DECIMAL(8, 4),
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- ============================================
-- MACHINES TABLE
-- ============================================
CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    max_shot_weight DECIMAL(10, 2) NOT NULL,
    clamp_force INTEGER NOT NULL,
    max_pressure DECIMAL(10, 2) NOT NULL,
    max_temperature DECIMAL(10, 2) NOT NULL,
    compatible_materials TEXT[] DEFAULT '{}',
    hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 150.00,
    status VARCHAR(50) DEFAULT 'available',
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    material_id UUID REFERENCES materials(id),
    weight_per_unit DECIMAL(10, 4) NOT NULL,
    cycle_time INTEGER NOT NULL,
    cavity_count INTEGER NOT NULL DEFAULT 1,
    required_pressure DECIMAL(10, 2),
    required_temperature DECIMAL(10, 2),
    tool_id VARCHAR(100),
    compatible_machines UUID[] DEFAULT '{}',
    storage_cost_per_day DECIMAL(10, 2) DEFAULT 0.50,
    in_stock INTEGER NOT NULL DEFAULT 0,
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    due_date DATE NOT NULL,
    status order_status_enum DEFAULT 'pending',
    priority INTEGER DEFAULT 5,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PRODUCT_FORECASTS TABLE
-- ============================================
CREATE TABLE product_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    forecast_date DATE NOT NULL,
    predicted_quantity INTEGER NOT NULL,
    confidence_level DECIMAL(5, 2) DEFAULT 0.80,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, forecast_date)
);
ALTER TABLE product_forecasts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PREDICTED_ORDERS TABLE
-- ============================================
CREATE TABLE predicted_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    predicted_quantity INTEGER NOT NULL,
    predicted_date DATE NOT NULL,
    confidence_score DECIMAL(5, 2) NOT NULL,
    basis TEXT,
    matching_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE predicted_orders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PRODUCTION_BLOCKS TABLE (Standalone)
-- ============================================
CREATE TABLE production_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    batch_size INTEGER NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    setup_time_minutes INTEGER DEFAULT 0,
    estimated_cost DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE production_blocks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SETTINGS TABLE (Monolith - single row with id='main')
-- ============================================
CREATE TABLE settings (
    id TEXT PRIMARY KEY DEFAULT 'main',
    prediction_error_threshold DECIMAL(5, 2) NOT NULL DEFAULT 25.00,
    storage_cost_per_m3 DECIMAL(10, 2) NOT NULL DEFAULT 0,
    employee_cost_per_hour DECIMAL(10, 2) NOT NULL DEFAULT 0,
    interest_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
    delivery_buffer_days INTEGER NOT NULL DEFAULT 2,
    setup_time_minutes INTEGER NOT NULL DEFAULT 45,
    work_hours_per_day INTEGER NOT NULL DEFAULT 16,
    shifts_per_day INTEGER NOT NULL DEFAULT 2,
    schedule_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT settings_single_row CHECK (id = 'main')
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_due_date ON orders(due_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_products_customer_id ON products(customer_id);
CREATE INDEX idx_products_material_id ON products(material_id);
CREATE INDEX idx_production_blocks_machine_id ON production_blocks(machine_id);
CREATE INDEX idx_production_blocks_product_id ON production_blocks(product_id);
CREATE INDEX idx_production_blocks_customer_id ON production_blocks(customer_id);
CREATE INDEX idx_production_blocks_start_time ON production_blocks(start_time);
CREATE INDEX idx_predicted_orders_product_id ON predicted_orders(product_id);
CREATE INDEX idx_predicted_orders_customer_id ON predicted_orders(customer_id);
CREATE INDEX idx_predicted_orders_matching_order_id ON predicted_orders(matching_order_id);
CREATE INDEX idx_product_forecasts_product_id ON product_forecasts(product_id);
CREATE INDEX idx_product_forecasts_customer_id ON product_forecasts(customer_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON machines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predicted_orders_updated_at BEFORE UPDATE ON predicted_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Schema created successfully with RLS enabled on all tables.' AS status;
