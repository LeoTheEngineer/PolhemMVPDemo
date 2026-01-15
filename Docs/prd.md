# Product Requirements Document (PRD)
# Polhem - Predictive Production Planning & Machine Optimization Platform

---

## Document Metadata

| Property | Value |
|----------|-------|
| Version | 1.0 |
| Status | Draft |
| Target | Demo MVP |
| Audience | AI-assisted development, developers |

---

## 1. Executive Summary

### 1.1 Product Overview

Polhem is a decision-support web application designed for **plastic injection molding contract manufacturers** operating in high-mix, low-volume (HMLV) environments. The platform integrates with existing ERP (Pyramid) and machine data systems (Rectron) to predict future demand, optimize batch sizes, and generate machine-level production schedules that maximize overall business performance.

### 1.2 Core Value Proposition

The system optimizes the entire production operation by:
- Reducing unnecessary tool and material switches
- Minimizing machine downtime
- Increasing OEE (Overall Equipment Effectiveness)
- Optimizing capital efficiency and inventory costs
- Enabling proactive changeover planning weeks in advance

### 1.3 Demo vs Production Scope

| Aspect | Demo | Production |
|--------|------|------------|
| Data Source | Boilerplate/hardcoded data | Pyramid ERP, Rectron integration |
| Calculations | Simple averages, constants, linear models | Statistical models, ML-based forecasting |
| Authentication | Clerk (single organization) | Full multi-tenant with RBAC |
| Optimization | Deterministic rule-based | Advanced optimization algorithms |

> **Note:** This PRD covers both demo requirements and production considerations. Demo-specific simplifications are marked with `[DEMO]`. Production enhancements are marked with `[PRODUCTION]`.

---

## 2. System Context & Integrations

### 2.1 Target Users

| User Role | Primary Use Case |
|-----------|------------------|
| Production Planner | Create and modify production schedules, view machine assignments |
| Sales/Planning | View demand forecasts, compare predictions vs customer forecasts |
| Management | Monitor OEE, capacity utilization, and capital efficiency |

### 2.2 External System Integrations

#### 2.2.1 Pyramid ERP `[PRODUCTION]`

| Data Type | Direction | Description |
|-----------|-----------|-------------|
| Customers | Read | Customer master data |
| Products | Read | Product specifications and configurations |
| Orders | Read | Historical and current order data |
| Order History | Read | Past orders for forecasting models |
| Inventory/Stock | Read | Current stock levels per product |
| Production Schedule | Write | Upload optimized schedules back to ERP |
| Materials | Read | Material costs and availability |

#### 2.2.2 Rectron Machine Integration `[PRODUCTION]`

| Data Type | Direction | Description |
|-----------|-----------|-------------|
| Machine Status | Read | Real-time machine availability |
| Production Metrics | Read | Actual cycle times, output quantities |
| Downtime Events | Read | Unplanned stops, maintenance windows |

#### 2.2.3 Demo Mode `[DEMO]`

All external integrations are simulated with:
- Pre-populated boilerplate data in Supabase
- Hardcoded values where calculations would occur
- Random/average-based outputs for display purposes

---

## 3. Core Problem Domain

### 3.1 Business Challenges

Plastic injection molding efficiency in HMLV environments is constrained by:

1. **Frequent Machine Switches** - Each product change requires tool changes
2. **High Setup Times** - Temperature, pressure, and material changes take time
3. **Reactive Planning** - Schedules respond to orders rather than anticipating them
4. **Order Uncertainty** - Customer forecasts don't always match actual orders

### 3.2 Key Production Constraint: Single Tool Per Product

A critical constraint in plastic injection molding is that **each product has exactly one tool (mold)**. This means:

- **Only one machine can produce a given product at any time**
- Production blocks for the same product cannot overlap in time
- Even if multiple machines are compatible, they cannot run the same product simultaneously
- This constraint must be enforced in both schedule generation and manual editing

This constraint significantly impacts scheduling optimization, as parallelization across machines is only possible for different products, not for scaling up production of a single product.

### 3.3 Optimization Trade-offs

| Factor | Benefit of Larger Batches | Cost of Larger Batches |
|--------|---------------------------|------------------------|
| OEE | Fewer tool switches, less downtime | - |
| Inventory | - | Capital tied up, storage costs |
| Flexibility | - | Less responsive to changes |

The system finds the optimal balance where:
```
(OEE gains) - (inventory costs) = maximized
```

---

## 4. Functional Requirements

### 4.1 Orders Module

#### 4.1.1 Purpose
Display a timeline view of historical orders, predicted orders, and customer forecasts for any customer-product combination.

#### 4.1.2 Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Customer/Product Selection | Dropdown search to select customer and product | P0 |
| Timeline Visualization | Horizontal timeline with weekly granularity | P0 |
| Order Type Differentiation | Visual distinction between real orders and predicted orders | P0 |
| Error Interval Display | Show prediction confidence as min/max range | P0 |
| Aggregated Summaries | Monthly and yearly totals for confirmed and predicted | P1 |
| Customer Forecast Comparison | Display customer's stated forecast alongside predictions | P1 |

#### 4.1.3 Order Display Data

For each order/prediction on the timeline:

| Field | Real Order | Predicted Order |
|-------|------------|-----------------|
| Quantity | Exact amount | Expected amount (median of range) |
| Date | Order date | Predicted week |
| Delivery Date | Actual delivery date | Expected delivery window |
| Error % | 0% | Calculated from historical variance |
| Min Quantity | N/A | `quantity * (1 - error%)` |
| Max Quantity | N/A | `quantity * (1 + error%)` |
| Status | Confirmed/Delivered | Reliable/Unreliable (based on threshold) |

#### 4.1.4 Error Calculation Logic

```
Error % = Weighted historical variance between customer forecasts and actual orders

- Weight newer data more heavily than older data
- Calculate per customer-product combination
- Error increases for dates further in the future
```

`[DEMO]` Use simple average of historical variance or constant values.

`[PRODUCTION]` Implement time-decay weighted variance model.

#### 4.1.5 Parameters Sub-tab

User-configurable parameters affecting order predictions:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| Max Error Threshold | Percentage (0-100%) | Predictions exceeding this error are marked unreliable | 25% |

Predictions exceeding the threshold:
- Display with visual warning indicator (red styling)
- Exclude from automatic production schedule generation
- Still visible for manual consideration

---

### 4.2 Models/Settings Module

#### 4.2.1 Purpose
Provide transparency into system models and allow configuration of key parameters that affect scheduling decisions.

#### 4.2.2 Model Categories

| Model | Purpose | Key Parameters |
|-------|---------|----------------|
| Storage Cost Model | Calculate inventory holding costs | Cost per m³, employee cost/hour, interest rate |
| Machine Setup Model | Estimate changeover times | Base setup time, material change time, temperature change time |
| Forecast Model | Predict future orders | Time window, weighting factors |
| Delivery Buffer Model | Ensure timely completion | Buffer days before delivery |

#### 4.2.3 Settings Parameters

| Parameter | Type | Unit | Description |
|-----------|------|------|-------------|
| `prediction_error_threshold` | Float | % | Max allowed prediction error (0-100) |
| `storage_cost_per_m3` | Float | SEK/m³/day | Cost to store one cubic meter per day |
| `employee_cost_per_hour` | Float | SEK/hour | Labor cost for warehouse operations |
| `interest_rate` | Float | % | Annual interest rate for tied-up capital |
| `delivery_buffer_days` | Integer | days | Days before delivery date order must be complete |

#### 4.2.4 Settings (Monolith Pattern)

The settings table uses a single-row monolith pattern with `id='main'`:
- All application settings are stored in one row
- Settings can be read and updated via API
- Changing settings affects schedule generation when regenerated
- Schedule metrics (OEE, total hours, etc.) are stored in `schedule_metrics` JSONB column

#### 4.2.5 Model Calculations

`[DEMO]` All models return simplified values:
- Storage cost: Constant or simple multiplication
- Setup time: Fixed base time + simple delta calculations
- Forecasts: Average of historical data or linear projection

`[PRODUCTION]` Statistical models with validated algorithms.

---

### 4.3 Machine Schedule / Results Module

#### 4.3.1 Purpose
Display and allow interactive editing of the production schedule across all machines with real-time OEE feedback.

#### 4.3.2 View Modes

**Mode 1: Per Machine (Default)**
- Rows: One row per machine
- Columns: Horizontal timeline (hourly granularity)
- Blocks: Production blocks showing product, customer, quantity

**Mode 2: Per Customer + Product**
- Rows: One row per customer-product combination (user can add multiple rows)
- Columns: Same horizontal timeline
- Blocks: Production blocks showing which machine is used, quantity
- Additional: Forecast vs actual markers on timeline
- **Important:** Due to the single-tool constraint (see section 3.2), blocks within a row **cannot overlap in time**. Each product can only be produced on one machine at a time, so the timeline for each customer-product row is sequential, not parallel.

#### 4.3.3 Time Configuration

| Setting | Demo Value | Production |
|---------|------------|------------|
| Granularity | Hourly | Configurable |
| Operating Hours | 06:00 - 20:00 (14 hours) | Per machine configuration |
| Days | Monday - Friday | Configurable per machine |

#### 4.3.4 Production Block Data

Each block displays/contains:

| Field | Display | Stored |
|-------|---------|--------|
| Product Name | Yes | FK reference |
| Customer Name | Yes | FK reference |
| Quantity | Yes | `batch_size` |
| Start Time | On hover/click | `start_time` |
| End Time | On hover/click | `end_time` |
| Machine Settings | On click (detail panel) | Via product FK |
| OEE Contribution | On click (detail panel) | Calculated |

#### 4.3.5 Stock Level Visualization

Display stock levels at key points on the timeline:

```
Timeline: ──────[Block A]─────────[Block B]────────[Order Due]─────
Stock:    100 → 100+5000=5100 → 5100+3000=8100 → 8100-10000=-1900 ⚠️
```

Show:
- Current in-stock (from product table)
- Stock after each production block (+)
- Stock after each order fulfillment (-)
- Warning if stock goes negative before order due date

#### 4.3.6 Interactive Editing

| Action | Behavior |
|--------|----------|
| Drag block horizontally | Move to different time slot on same machine |
| Drag block vertically | Move to different machine (if compatible) |
| Click block → Edit quantity | Modify batch size |
| Invalid placement | Visual rejection (red border, snap back) |

Compatibility rules for machine assignment:
- Machine pressure rating >= Product required pressure
- Machine temperature range includes Product temperature
- Machine material list includes Product material

#### 4.3.7 OEE Display

**Per Machine:**
```
OEE = (Scheduled Production Hours) / (Available Operating Hours) * 100

Example: 11 hours production / 14 hours available = 78.6%
```

**Global OEE:**
```
Global OEE = Sum(All Machine Production Hours) / Sum(All Machine Available Hours) * 100
```

Display locations:
- Per machine: Small indicator on left of each machine row
- Global: Top-right corner of the schedule view
- Updates in real-time as schedule is modified

#### 4.3.8 Schedule Generation

| Trigger | Action |
|---------|--------|
| "Generate Schedule" button | Create new optimal schedule based on current settings |
| Settings change detected | Prompt user to regenerate |
| New order received | Prompt user to regenerate |

Regeneration:
- Overwrites any manual edits to the production schedule
- Creates entirely new schedule optimized for current state
- User confirmation required before regenerating

`[DEMO]` Schedule generation uses simple rules:
- Group products by material to minimize switches
- Assign to first compatible machine with availability
- Basic bin-packing for time slots

`[PRODUCTION]` Advanced optimization considering:
- Setup time matrices
- Multi-objective optimization (OEE vs inventory)
- Constraint satisfaction for all machine/product compatibilities

---

## 5. Data Model

### 5.1 Entity Relationship Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  customers  │────<│  products   │────<│   orders    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           │            ┌─────────────────┐
                           ├───────────<│ predicted_orders│
                           │            └─────────────────┘
                           │                   │
                           │            ┌──────┴──────┐
                           │            │  settings   │
                           │            └──────┬──────┘
                           │                   │
                           │            ┌──────┴──────────────┐
                           │            │ production_schedule │
                           │            └──────┬──────────────┘
                           │                   │
                    ┌──────┴──────┐     ┌──────┴──────────┐
                    │  materials  │     │ production_block │
                    └─────────────┘     └────────┬─────────┘
                                                 │
                                          ┌──────┴──────┐
                                          │  machines   │
                                          └─────────────┘

┌───────────────────┐
│ product_forecasts │──────> customers, products
└───────────────────┘
```

### 5.2 Table Definitions

#### 5.2.1 `customers`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | Unique identifier |
| `name` | VARCHAR(255) | NOT NULL | Customer company name |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update time |

> **Note:** No personal data fields (email, phone, etc.) required for demo. `[PRODUCTION]` may add contact information, account manager FK, etc.

#### 5.2.2 `materials`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | Unique identifier |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | Material name (e.g., "ABS", "PP", "HDPE") |
| `cost_per_kg` | DECIMAL(10,2) | NOT NULL | Cost in SEK per kilogram |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |

#### 5.2.3 `products`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | Unique identifier |
| `customer_id` | UUID | FK → customers.id, NOT NULL | Owning customer |
| `name` | VARCHAR(255) | NOT NULL | Product name/identifier |
| `material_id` | UUID | FK → materials.id, NOT NULL | Required material |
| `order_interval` | ENUM | NOT NULL | Order frequency pattern |
| `temperature_celsius` | INTEGER | NOT NULL | Required mold temperature (°C) |
| `pressure_tons` | INTEGER | NOT NULL | Minimum machine pressure (tons) |
| `cycle_time_seconds` | DECIMAL(8,2) | NOT NULL | Average cycle time per unit |
| `in_stock` | INTEGER | DEFAULT 0 | Current inventory quantity |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update time |

**Order Interval Enum Values:**
- `day`
- `week`
- `month`
- `quarterly`
- `yearly`

#### 5.2.4 `orders`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | Unique identifier |
| `customer_id` | UUID | FK → customers.id, NOT NULL | Ordering customer |
| `product_id` | UUID | FK → products.id, NOT NULL | Ordered product |
| `quantity` | INTEGER | NOT NULL | Number of units ordered |
| `order_date` | DATE | NOT NULL | Date order was placed |
| `delivery_date` | DATE | NOT NULL | Required delivery date |
| `status` | ENUM | DEFAULT 'pending' | Order fulfillment status |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |

**Status Enum Values:**
- `pending` - Order placed, not yet fulfilled
- `in_production` - Currently being manufactured
- `completed` - Order fulfilled
- `delivered` - Shipped to customer

#### 5.2.5 `product_forecasts`

Customer-provided forecasts for future orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | Unique identifier |
| `customer_id` | UUID | FK → customers.id, NOT NULL | Forecasting customer |
| `product_id` | UUID | FK → products.id, NOT NULL | Forecasted product |
| `start_date` | DATE | NOT NULL | Forecast period start |
| `end_date` | DATE | NULL | Forecast period end (NULL = indefinite) |
| `quantity` | INTEGER | NOT NULL | Forecasted quantity for period |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |

> **Usage:** Compare customer's stated forecasts against system predictions and actual orders to calculate prediction error rates.

#### 5.2.6 `settings`

Monolith single-row table with `id='main'`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK, DEFAULT 'main' | Fixed identifier ('main') |
| `prediction_error_threshold` | DECIMAL(5,2) | NOT NULL, DEFAULT 25.00 | Max allowed error % (0-100) |
| `storage_cost_per_m3` | DECIMAL(10,2) | NOT NULL, DEFAULT 0 | SEK per m³ per day |
| `employee_cost_per_hour` | DECIMAL(10,2) | NOT NULL, DEFAULT 0 | SEK per hour |
| `interest_rate` | DECIMAL(5,2) | NOT NULL, DEFAULT 0 | Annual interest % |
| `delivery_buffer_days` | INTEGER | NOT NULL, DEFAULT 2 | Days before delivery |
| `setup_time_minutes` | INTEGER | NOT NULL, DEFAULT 45 | Default setup time |
| `work_hours_per_day` | INTEGER | NOT NULL, DEFAULT 16 | Working hours per day |
| `shifts_per_day` | INTEGER | NOT NULL, DEFAULT 2 | Number of shifts |
| `schedule_metrics` | JSONB | DEFAULT '{}' | Generated schedule metrics |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update time |

> **Constraint:** CHECK constraint ensures `id = 'main'` - only one row can exist.

#### 5.2.7 `predicted_orders`

System-generated predictions based on historical data and current settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | Unique identifier |
| `product_id` | UUID | FK → products.id, NOT NULL | Product |
| `customer_id` | UUID | FK → customers.id, NOT NULL | Customer |
| `predicted_quantity` | INTEGER | NOT NULL | Expected quantity |
| `predicted_date` | DATE | NOT NULL | Expected order date |
| `confidence_score` | DECIMAL(5,2) | NOT NULL | Prediction confidence (0-1) |
| `basis` | TEXT | NULL | Explanation for prediction |
| `matching_order_id` | UUID | FK → orders.id, NULL | Linked actual order if matched |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update time |

> **Matching:** When an actual order comes in that matches a prediction, `matching_order_id` is set to link them.

#### 5.2.8 `machines`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | Unique identifier |
| `number` | INTEGER | NOT NULL, UNIQUE | Machine number (1, 2, 3...) |
| `name` | VARCHAR(100) | NULL | Optional display name |
| `pressure_tons` | INTEGER | NOT NULL | Maximum pressure capacity (tons) |
| `temperature_min` | INTEGER | NOT NULL | Minimum temperature (°C) |
| `temperature_max` | INTEGER | NOT NULL | Maximum temperature (°C) |
| `operating_start` | TIME | DEFAULT '06:00' | Daily operating start time |
| `operating_end` | TIME | DEFAULT '20:00' | Daily operating end time |
| `is_active` | BOOLEAN | DEFAULT TRUE | Machine available for scheduling |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |

#### 5.2.9 `machine_materials`

Junction table for machine-material compatibility.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `machine_id` | UUID | FK → machines.id, PK | Machine reference |
| `material_id` | UUID | FK → materials.id, PK | Compatible material |

> **Constraint:** Composite primary key on (machine_id, material_id)

#### 5.2.10 `production_blocks`

Standalone table for production blocks. Schedule metrics are stored in `settings.schedule_metrics` JSONB column.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | Unique identifier |
| `machine_id` | UUID | FK → machines.id, NOT NULL | Assigned machine |
| `product_id` | UUID | FK → products.id, NOT NULL | Product to manufacture |
| `customer_id` | UUID | FK → customers.id, NOT NULL | Customer (denormalized for fast lookups) |
| `batch_size` | INTEGER | NOT NULL | Units to produce |
| `start_time` | TIMESTAMP | NOT NULL | Block start datetime |
| `end_time` | TIMESTAMP | NOT NULL | Block end datetime |
| `setup_time_minutes` | INTEGER | DEFAULT 0 | Setup time before production |
| `estimated_cost` | DECIMAL(10,2) | NULL | Material + labor cost |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |

> **Note:** Schedule-level metrics (total_oee, total_production_hours, etc.) are stored in `settings.schedule_metrics` JSONB column, updated when schedule is regenerated.

> **Validation:** On insert/update, verify:
>
> Machine compatibility:
> - `machines.pressure_tons >= products.pressure_tons`
> - `products.temperature_celsius BETWEEN machines.temperature_min AND machines.temperature_max`
> - Product's material exists in `machine_materials` for this machine
>
> Single-tool constraint:
> - No other `production_block` for the same `product_id` can have overlapping time range
> - `NOT EXISTS (SELECT 1 FROM production_blocks WHERE product_id = :product_id AND id != :this_id AND start_time < :end_time AND end_time > :start_time)`

---

## 6. User Interface Specifications

### 6.1 Global Design Principles

| Principle | Implementation |
|-----------|----------------|
| Style | Minimalist, no gradients, no advanced animations |
| Theme | Dark mode as default and only theme |
| Information Density | High density, professional appearance |
| Interactivity | Functional over decorative |

### 6.2 Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         Top Bar (optional)                       │
├──────────┬──────────────────────────────────────────────────────┤
│          │  Sub-tabs / Filters / Actions                        │
│  Sidebar │──────────────────────────────────────────────────────│
│          │                                                       │
│  - Orders│                   Main Content Area                   │
│  - Models│                                                       │
│  - Plan  │               (Tables, Charts, Timeline)              │
│          │                                                       │
│          │                                                       │
└──────────┴──────────────────────────────────────────────────────┘
```

### 6.3 Navigation Structure

**Primary Navigation (Left Sidebar):**
1. **Orders** - Order timeline and predictions
2. **Models** (or "Settings") - Model parameters and configuration
3. **Schedule** (or "Plan" / "Results") - Production schedule visualization

**Secondary Navigation (Top of each view):**
- Sub-tabs specific to each primary tab
- Filters and search
- Primary actions (e.g., "Regenerate Schedule")

### 6.4 Tab-Specific UI

#### 6.4.1 Orders Tab

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Customer ▼]  [Product ▼]                    [Parameters ⚙]│
├─────────────────────────────────────────────────────────────┤
│ Customer Forecast: 1,000,000 units/year                     │
│ Confirmed YTD: 450,000  |  Predicted Remaining: 520,000     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ◀ 2025                        2026                    ▶    │
│  W48  W49  W50  W51  W52 │ W01  W02  W03  W04  W05  W06     │
│  ┌──┐ ┌──┐           ┌──┐│┌────┐    ┌────┐    ┌────┐        │
│  │▓▓│ │▓▓│           │▓▓││░░░░│    │░░░░│    │░░░░│        │
│  │5K│ │5K│           │5K││4-6K│    │4-6K│    │3-5K│        │
│  └──┘ └──┘           └──┘│└────┘    └────┘    └────┘        │
│                          │          ⚠ 32%                    │
│  ▓ = Confirmed Order     │  ░ = Predicted (with range)      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Visual Indicators:**
- Confirmed orders: Solid fill, distinct color (e.g., blue)
- Predicted orders (reliable): Semi-transparent fill (e.g., light blue)
- Predicted orders (unreliable): Warning color (e.g., red/orange) with warning icon
- Error range: Whisker lines or band around predicted quantity

#### 6.4.2 Models/Settings Tab

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Model Settings                                    [Save]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─ Forecast Model ─────────────────────────────────────────┐│
│ │ Max Prediction Error Threshold    [====|====] 25%        ││
│ │ Description: Predictions with higher error are marked    ││
│ │ unreliable and excluded from automatic scheduling.       ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌─ Storage Cost Model ─────────────────────────────────────┐│
│ │ Storage Cost (per m³/day)         [___150___] SEK        ││
│ │ Employee Cost (per hour)          [___350___] SEK        ││
│ │ Interest Rate (annual)            [====|====] 5.5%       ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌─ Delivery Model ─────────────────────────────────────────┐│
│ │ Delivery Buffer                   [____2____] days       ││
│ │ Description: Orders complete this many days before       ││
│ │ delivery date.                                           ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 6.4.3 Schedule Tab

**Layout (Per Machine View):**
```
┌─────────────────────────────────────────────────────────────┐
│ View: [● Per Machine ○ Per Product]  Filter: [Machines ▼]   │
│ Week: [◀ W02 2026 ▶]   Global OEE: ████████░░ 82%          │
├─────────────────────────────────────────────────────────────┤
│        │ Mon 6    12    18 │ Tue 6    12    18 │ Wed ...    │
├────────┼───────────────────┼───────────────────┼───────────│
│ M1 85% │ ▓▓▓▓▓▓▓▓░░░░░░░░ │ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░ │            │
│        │ [Prod A - 5K]     │ [Prod B - 8K]     │            │
├────────┼───────────────────┼───────────────────┼───────────│
│ M2 71% │ ░░░▓▓▓▓▓▓▓▓▓▓░░░ │ ▓▓▓▓▓▓░░░░░░░░░░ │            │
│        │ [Prod C - 3K]     │ [Prod A - 2K]     │            │
├────────┼───────────────────┼───────────────────┼───────────│
│ M3 92% │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░ │            │
│        │ [Prod D - 12K]    │ [Prod D - 10K]    │            │
└────────┴───────────────────┴───────────────────┴───────────┘
```

**Block Interaction:**
- Hover: Tooltip with product, customer, quantity, times
- Click: Detail panel with full specifications
- Drag: Move block to new time or machine (validates compatibility)

**Layout (Per Customer+Product View):**
```
┌─────────────────────────────────────────────────────────────┐
│ View: [○ Per Machine ● Per Product]  Add Row: [+ Product]   │
├─────────────────────────────────────────────────────────────┤
│              │ W01        W02        W03        W04         │
├──────────────┼─────────────────────────────────────────────│
│ Volvo/Prod A │ [M1: 5K]   [M1: 8K]             [M2: 3K]    │
│ Stock: 12K   │ ↑15K      ↑20K       📦-10K    ↑23K         │
│              │           │          │ Order                 │
├──────────────┼─────────────────────────────────────────────│
│ Scania/Prod B│      [M3: 4K]   [M3: 6K]                     │
│ Stock: 2K    │      ↑6K       ↑12K            📦-8K        │
└──────────────┴─────────────────────────────────────────────┘
```

---

## 7. Technical Architecture

### 7.1 Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Next.js (App Router) | React-based, server components |
| Styling | Tailwind CSS | Dark theme, utility-first |
| Authentication | Clerk | Simple auth for demo |
| Database | Supabase (PostgreSQL) | Hosted, includes Row Level Security |
| Hosting | DigitalOcean App Platform | Container-based deployment |
| DNS/CDN | Cloudflare | Domain management, caching, DDoS protection |
| Version Control | GitHub | Repository hosting |

### 7.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Cloudflare                               │
│                    (DNS, CDN, DDoS Protection)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DigitalOcean App Platform                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Next.js Application                   │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │    │
│  │  │    Pages     │  │     API      │  │   Server     │   │    │
│  │  │  (React UI)  │  │   Routes     │  │  Components  │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐
│      Clerk       │  │   Supabase   │  │    Pyramid       │
│ (Authentication) │  │  (Database)  │  │ (ERP) [PROD]     │
└──────────────────┘  └──────────────┘  └──────────────────┘
```

### 7.3 Supabase Configuration

#### 7.3.1 Project Setup
- Region: EU (Frankfurt) - closest to Swedish customers
- Plan: Free tier sufficient for demo
- Row Level Security: Disabled for demo `[DEMO]`, enabled for production

#### 7.3.2 Database Migrations
- Use Supabase migrations for schema versioning
- Seed file for boilerplate demo data

### 7.4 Authentication Flow

```
User → Clerk Sign-in → JWT Token → Next.js Middleware → Protected Routes
                                         │
                                         ▼
                              Supabase Client (with token)
```

`[DEMO]` Single organization, all authenticated users have full access.

`[PRODUCTION]` Implement organization-based multi-tenancy with RLS policies.

---

## 8. Demo Data Specifications

### 8.1 Data Quantities

| Entity | Count | Notes |
|--------|-------|-------|
| Customers | 4 | Swedish manufacturing companies |
| Products per Customer | 3-5 (random) | ~16 total products |
| Materials | 5 | Common injection molding plastics |
| Machines | 10 | Varying capacities |
| Historical Orders per Customer | 30-50 | Past 12 months |
| Product Forecasts | 1 per customer | Annual forecasts |
| Settings | 2 | "Default" and "Aggressive" |

### 8.2 Sample Data

#### 8.2.1 Customers
```
1. Volvo Cars - Automotive components
2. Scania AB - Truck parts
3. Electrolux - Home appliance parts
4. IKEA Components - Furniture hardware
```

#### 8.2.2 Materials
```
1. ABS (Acrylonitrile Butadiene Styrene) - 25 SEK/kg
2. PP (Polypropylene) - 15 SEK/kg
3. HDPE (High-Density Polyethylene) - 18 SEK/kg
4. PA (Polyamide/Nylon) - 45 SEK/kg
5. PC (Polycarbonate) - 55 SEK/kg
```

#### 8.2.3 Machines
```
M1:  50 tons,  40-120°C, [ABS, PP, HDPE]
M2:  50 tons,  40-120°C, [ABS, PP, HDPE]
M3: 100 tons,  60-180°C, [ABS, PP, PA]
M4: 100 tons,  60-180°C, [ABS, PP, PA]
M5: 150 tons,  80-220°C, [ABS, PA, PC]
M6: 150 tons,  80-220°C, [ABS, PA, PC]
M7: 250 tons, 100-280°C, [PA, PC]
M8: 250 tons, 100-280°C, [PA, PC]
M9: 500 tons, 120-300°C, [PA, PC]
M10: 500 tons, 120-300°C, [PA, PC]
```

#### 8.2.4 Historical Order Generation Rules

For each customer-product:
1. Base the order interval on product's `order_interval` setting
2. Generate orders for past 12 months
3. Add realistic variance (±20%) to quantities
4. Some orders in past should be marked `completed`/`delivered`
5. A few orders in near future marked `pending`

---

## 9. Calculation Logic

### 9.1 OEE Calculation

```typescript
// Per machine for a time period
function calculateMachineOEE(machine: Machine, blocks: ProductionBlock[]): number {
  const availableHours = getOperatingHours(machine) * numberOfDays;
  const productionHours = blocks.reduce((sum, block) =>
    sum + getBlockDuration(block), 0);

  return (productionHours / availableHours) * 100;
}

// Global OEE
function calculateGlobalOEE(machines: Machine[], allBlocks: ProductionBlock[]): number {
  const totalAvailable = machines.reduce((sum, m) =>
    sum + getOperatingHours(m) * numberOfDays, 0);
  const totalProduction = allBlocks.reduce((sum, b) =>
    sum + getBlockDuration(b), 0);

  return (totalProduction / totalAvailable) * 100;
}
```

`[DEMO]` Operating hours fixed at 14 hours/day (06:00-20:00).

### 9.2 Stock Level Calculation

```typescript
function calculateStockAtTime(
  product: Product,
  targetTime: Date,
  blocks: ProductionBlock[],
  orders: Order[]
): number {
  let stock = product.in_stock; // Starting inventory

  // Add completed production blocks before target time
  const completedBlocks = blocks.filter(b =>
    b.product_id === product.id && b.end_time <= targetTime);
  stock += completedBlocks.reduce((sum, b) => sum + b.batch_size, 0);

  // Subtract fulfilled orders before target time
  const fulfilledOrders = orders.filter(o =>
    o.product_id === product.id && o.delivery_date <= targetTime);
  stock -= fulfilledOrders.reduce((sum, o) => sum + o.quantity, 0);

  return stock;
}
```

### 9.3 Prediction Error Calculation

```typescript
function calculatePredictionError(
  customerId: string,
  productId: string,
  historicalOrders: Order[],
  customerForecasts: ProductForecast[]
): number {
  // [DEMO] Simple implementation
  // Calculate average variance between forecast and actual for past periods

  const relevantOrders = historicalOrders.filter(o =>
    o.customer_id === customerId && o.product_id === productId);
  const relevantForecasts = customerForecasts.filter(f =>
    f.customer_id === customerId && f.product_id === productId);

  if (relevantForecasts.length === 0) return 0.2; // Default 20%

  // Compare forecasted vs actual quantities
  // Weight recent data more heavily
  // Return percentage error

  return calculatedError;
}
```

`[DEMO]` Return simple average or constant values (15-35% range).

`[PRODUCTION]` Implement time-decay weighted variance with statistical confidence intervals.

### 9.4 Schedule Generation

**Key Constraint:** Due to single-tool-per-product limitation, the same product cannot be scheduled on multiple machines simultaneously. All blocks for a given product must be sequential in time.

```typescript
function generateSchedule(
  settings: Settings,
  predictedOrders: PredictedOrder[],
  confirmedOrders: Order[],
  machines: Machine[],
  products: Product[]
): ProductionSchedule {
  // [DEMO] Simple deterministic algorithm

  // 1. Combine confirmed + reliable predicted orders
  const ordersToSchedule = [
    ...confirmedOrders,
    ...predictedOrders.filter(p => p.is_reliable)
  ];

  // 2. Group by material to minimize switches
  const groupedByMaterial = groupBy(ordersToSchedule, o =>
    products.find(p => p.id === o.product_id).material_id);

  // 3. Track last end time per product (single-tool constraint)
  const productLastEndTime: Map<string, Date> = new Map();

  // 4. For each group, assign to compatible machines
  for (const [materialId, orders] of groupedByMaterial) {
    const compatibleMachines = machines.filter(m =>
      isCompatible(m, materialId));

    // Simple first-fit bin packing with single-tool constraint
    for (const order of orders) {
      const productId = order.product_id;

      // Block cannot start before previous block for same product ends
      const earliestStart = productLastEndTime.get(productId) || new Date();

      const machine = findFirstAvailable(compatibleMachines, order, earliestStart);
      const block = createBlock(machine, order, earliestStart);

      // Update last end time for this product
      productLastEndTime.set(productId, block.end_time);
    }
  }

  // 5. Calculate schedule metrics
  return {
    blocks: allBlocks,
    total_oee: calculateGlobalOEE(...),
    // ... other metrics
  };
}
```

---

## 10. API Endpoints

### 10.1 Endpoint Overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/customers` | List all customers |
| GET | `/api/customers/[id]/products` | List products for customer |
| GET | `/api/orders` | List orders with filters |
| GET | `/api/predicted-orders` | List all predicted orders |
| GET | `/api/settings` | Get settings (single row with id='main') |
| PUT | `/api/settings` | Update settings parameters |
| GET | `/api/production-blocks` | Get all production blocks |
| POST | `/api/production-blocks/generate` | Regenerate production schedule (clears and recreates blocks) |
| PUT | `/api/production-blocks/[id]` | Update production block (drag/drop) |
| GET | `/api/machines` | List all machines |

### 10.2 Response Formats

All endpoints return JSON with consistent structure:

```typescript
// Success
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-01-12T10:30:00Z"
  }
}

// Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Machine not compatible with product material"
  }
}
```

---

## 11. Non-Functional Requirements

### 11.1 Performance

| Metric | Target | Notes |
|--------|--------|-------|
| Page Load | < 2s | Initial load with data |
| Schedule Render | < 500ms | For 10 machines, 1 week view |
| Block Drag/Drop | < 100ms | Visual feedback |
| Schedule Regeneration | < 5s | `[DEMO]` can be slower |

### 11.2 Browser Support

| Browser | Version |
|---------|---------|
| Chrome | Latest 2 versions |
| Firefox | Latest 2 versions |
| Safari | Latest 2 versions |
| Edge | Latest 2 versions |

### 11.3 Accessibility

`[DEMO]` Basic accessibility only:
- Keyboard navigation for main actions
- Sufficient color contrast in dark theme
- Focus indicators

`[PRODUCTION]` Full WCAG 2.1 AA compliance.

---

## 12. Future Considerations

### 12.1 Production System Enhancements

| Feature | Description |
|---------|-------------|
| Pyramid Integration | Real-time sync with ERP for orders, inventory |
| Rectron Integration | Live machine status and production metrics |
| Multi-tenancy | Support multiple manufacturing customers |
| Advanced Forecasting | ML-based prediction models |
| What-if Scenarios | Compare multiple schedule alternatives |
| Mobile View | Responsive design for floor managers |
| Notifications | Alerts for schedule conflicts, low stock |
| Audit Log | Track all changes to settings and schedules |
| Export | Generate reports, export to Excel/PDF |

### 12.2 Scalability Considerations

- Move calculation logic to background jobs for large datasets
- Implement caching for complex queries
- Consider dedicated optimization service for production

---

## 13. Glossary

| Term | Definition |
|------|------------|
| OEE | Overall Equipment Effectiveness - measure of machine utilization |
| HMLV | High-Mix Low-Volume - manufacturing environment with many products in small batches |
| Setup Time | Time required to change a machine from one product to another |
| Cycle Time | Time to produce one unit of a product |
| Production Block | A scheduled period of production for one product on one machine |
| Predicted Order | System-generated forecast of future customer order |
| Delivery Buffer | Safety margin before required delivery date |
| Pressure (tons) | Clamping force of injection molding machine |
| Tool/Mold | Physical mold used to shape plastic; one tool per product, cannot be shared simultaneously |
| Single-Tool Constraint | Limitation that each product has one tool, preventing parallel production on multiple machines |

---

## 14. Demo Model Implementations `[DEMO]`

This section provides specific, implementable calculation logic for the demo. These are intentionally simplified versions of the production models. For full model documentation including production considerations, see `Docs/models/`.

### 14.1 Storage Cost Model - Demo Implementation

**Purpose:** Calculate the cost of storing inventory.

**Demo Approach:** Simple linear calculation based on settings parameters.

```javascript
/**
 * Calculate storage cost for a batch
 * @param {number} quantity - Number of units
 * @param {number} daysInStorage - Expected storage duration
 * @param {object} product - Product with material_cost, volume_per_unit
 * @param {object} settings - Settings with storage_cost_per_m3, interest_rate
 * @returns {object} Cost breakdown
 */
function calculateStorageCost(quantity, daysInStorage, product, settings) {
  // Capital tied up = quantity × material cost per unit
  const capitalTiedUp = quantity * product.material_cost;

  // Interest cost = capital × (annual rate / 365) × days
  const dailyInterestRate = settings.interest_rate / 100 / 365;
  const interestCost = capitalTiedUp * dailyInterestRate * daysInStorage;

  // Space cost = volume × cost per m³ per day × days
  // Assume 0.001 m³ per unit if volume_per_unit not specified
  const volumePerUnit = product.volume_per_unit || 0.001;
  const totalVolume = quantity * volumePerUnit;
  const spaceCost = totalVolume * settings.storage_cost_per_m3 * daysInStorage;

  // Total holding cost
  const totalCost = interestCost + spaceCost;

  return {
    capital_tied_up: capitalTiedUp,
    interest_cost: Math.round(interestCost * 100) / 100,
    space_cost: Math.round(spaceCost * 100) / 100,
    total_cost: Math.round(totalCost * 100) / 100,
    cost_per_unit: Math.round((totalCost / quantity) * 100) / 100
  };
}
```

**Default Values (if not in settings):**
- `storage_cost_per_m3`: 150 SEK/m³/day
- `interest_rate`: 5% annual
- `volume_per_unit`: 0.001 m³ (1 liter)

---

### 14.2 Machine Prep Model - Demo Implementation

**Purpose:** Calculate time to switch a machine from one product to another.

**Demo Approach:** Additive model with fixed times per change type.

```javascript
/**
 * Calculate prep/setup time between two products on a machine
 * @param {object} fromProduct - Current product (null if machine idle)
 * @param {object} toProduct - Target product
 * @param {object} machine - Machine being used
 * @returns {object} Prep time breakdown in minutes
 */
function calculatePrepTime(fromProduct, toProduct, machine) {
  // Constants (in minutes) - would come from settings in production
  const BASE_TOOL_CHANGE_MINUTES = 45;
  const MATERIAL_CHANGE_MINUTES = 30;
  const TEMPERATURE_CHANGE_PER_10C = 1;
  const WARMUP_MINUTES = 15;

  // If machine is idle (no current product), just return tool setup + warmup
  if (!fromProduct) {
    return {
      tool_change_time: BASE_TOOL_CHANGE_MINUTES,
      material_change_time: 0,
      temperature_change_time: 0,
      warmup_time: WARMUP_MINUTES,
      total_minutes: BASE_TOOL_CHANGE_MINUTES + WARMUP_MINUTES
    };
  }

  // Same product = no setup needed
  if (fromProduct.id === toProduct.id) {
    return {
      tool_change_time: 0,
      material_change_time: 0,
      temperature_change_time: 0,
      warmup_time: 0,
      total_minutes: 0
    };
  }

  // Calculate each change type
  const toolChangeTime = BASE_TOOL_CHANGE_MINUTES; // Always change tool for different product

  const materialChangeTime =
    fromProduct.material_id !== toProduct.material_id
      ? MATERIAL_CHANGE_MINUTES
      : 0;

  const tempDelta = Math.abs(
    fromProduct.temperature_celsius - toProduct.temperature_celsius
  );
  const temperatureChangeTime = Math.ceil(tempDelta / 10) * TEMPERATURE_CHANGE_PER_10C;

  // Warmup needed if tool or material changed
  const warmupTime =
    (toolChangeTime > 0 || materialChangeTime > 0)
      ? WARMUP_MINUTES
      : 0;

  const totalMinutes =
    toolChangeTime + materialChangeTime + temperatureChangeTime + warmupTime;

  return {
    tool_change_time: toolChangeTime,
    material_change_time: materialChangeTime,
    temperature_change_time: temperatureChangeTime,
    warmup_time: warmupTime,
    total_minutes: totalMinutes
  };
}
```

**Constants Used:**
| Parameter | Demo Value | Notes |
|-----------|------------|-------|
| Base tool change | 45 min | Fixed for any tool swap |
| Material change | 30 min | Purge + load time |
| Temperature change | 3 min per 10°C | Linear scaling |
| Warmup time | 15 min | After major changes |

---

### 14.3 Order Forecast Model - Demo Implementation

**Purpose:** Predict future orders and calculate prediction error.

**Demo Approach:** Use historical average with fixed error growth over time.

```javascript
/**
 * Generate order forecast for a customer-product combination
 * @param {string} customerId - Customer UUID
 * @param {string} productId - Product UUID
 * @param {array} historicalOrders - Past orders for this customer-product
 * @param {object} product - Product with order_interval
 * @param {number} horizonWeeks - How many weeks ahead to forecast (default: 16)
 * @param {number} errorThreshold - Max acceptable error % (from settings)
 * @returns {object} Forecast with predictions array
 */
function generateForecast(
  customerId,
  productId,
  historicalOrders,
  product,
  horizonWeeks = 16,
  errorThreshold = 25
) {
  // Filter to relevant orders
  const relevantOrders = historicalOrders.filter(
    o => o.customer_id === customerId && o.product_id === productId
  );

  // Calculate average order quantity (simple mean)
  const avgQuantity = relevantOrders.length > 0
    ? Math.round(
        relevantOrders.reduce((sum, o) => sum + o.quantity, 0) / relevantOrders.length
      )
    : 1000; // Default if no history

  // Calculate base error from historical variance
  // [DEMO] Use simple standard deviation / mean, minimum 10%
  let baseError = 0.15; // Default 15%
  if (relevantOrders.length > 1) {
    const mean = avgQuantity;
    const variance = relevantOrders.reduce(
      (sum, o) => sum + Math.pow(o.quantity - mean, 2), 0
    ) / relevantOrders.length;
    const stdDev = Math.sqrt(variance);
    baseError = Math.max(0.10, Math.min(0.50, stdDev / mean)); // Clamp 10-50%
  }

  // Determine order frequency in weeks based on order_interval
  const intervalWeeks = {
    'day': 0.2,      // ~1-2 per week
    'week': 1,
    'month': 4,
    'quarterly': 13,
    'yearly': 52
  }[product.order_interval] || 2;

  // Generate predictions for each interval within horizon
  const predictions = [];
  const today = new Date();
  let weekOffset = intervalWeeks; // Start from first expected order

  while (weekOffset <= horizonWeeks) {
    // Error grows with time: base_error * (1 + 0.03 * weeks)
    const errorGrowthFactor = 1 + (0.03 * weekOffset);
    const errorPercentage = Math.round(baseError * errorGrowthFactor * 100 * 10) / 10;

    // Calculate min/max range
    const errorDecimal = errorPercentage / 100;
    const minQuantity = Math.round(avgQuantity * (1 - errorDecimal));
    const maxQuantity = Math.round(avgQuantity * (1 + errorDecimal));

    // Determine reliability based on threshold
    const isReliable = errorPercentage <= errorThreshold;

    // Calculate week start date
    const weekStartDate = new Date(today);
    weekStartDate.setDate(weekStartDate.getDate() + (weekOffset * 7));

    predictions.push({
      week_offset: weekOffset,
      week_start_date: weekStartDate.toISOString().split('T')[0],
      predicted_quantity: avgQuantity,
      error_percentage: errorPercentage,
      min_quantity: minQuantity,
      max_quantity: maxQuantity,
      is_reliable: isReliable
    });

    weekOffset += intervalWeeks;
  }

  return {
    customer_id: customerId,
    product_id: productId,
    generated_at: new Date().toISOString(),
    base_average_quantity: avgQuantity,
    base_error_percentage: Math.round(baseError * 100 * 10) / 10,
    predictions: predictions,
    reliable_count: predictions.filter(p => p.is_reliable).length,
    unreliable_count: predictions.filter(p => !p.is_reliable).length
  };
}
```

**Demo Calculation Summary:**

| Calculation | Demo Formula |
|-------------|--------------|
| Predicted Quantity | Simple average of historical orders |
| Base Error | Standard deviation / mean (clamped 10-50%) |
| Error Growth | `base_error × (1 + 0.03 × weeks_ahead)` |
| Reliability | `error_percentage <= settings.prediction_error_threshold` |
| Order Timing | Based on `product.order_interval` field |

**Error Growth Example:**
| Weeks Ahead | Base 15% Error Becomes |
|-------------|------------------------|
| 1 | 15.5% |
| 4 | 16.8% |
| 8 | 18.6% |
| 12 | 20.4% |
| 16 | 22.2% |

---

### 14.4 Schedule Generation - Demo Implementation

**Purpose:** Create production schedule assigning orders to machines.

**Demo Approach:** Greedy first-fit algorithm with material grouping.

```javascript
/**
 * Generate production schedule
 * @param {array} ordersToSchedule - Combined confirmed + reliable predicted orders
 * @param {array} machines - Available machines
 * @param {array} products - Product catalog
 * @param {object} settings - Current settings
 * @returns {object} Production schedule with blocks
 */
function generateSchedule(ordersToSchedule, machines, products, settings) {
  const blocks = [];
  const machineTimelines = {}; // Track end time per machine
  const productLastEndTime = {}; // Track end time per product (single-tool constraint)

  // Initialize machine timelines
  machines.forEach(m => {
    machineTimelines[m.id] = new Date(); // Start from now
  });

  // Group orders by material to minimize switches
  const ordersByMaterial = {};
  ordersToSchedule.forEach(order => {
    const product = products.find(p => p.id === order.product_id);
    const materialId = product.material_id;
    if (!ordersByMaterial[materialId]) {
      ordersByMaterial[materialId] = [];
    }
    ordersByMaterial[materialId].push({ ...order, product });
  });

  // Process each material group
  Object.entries(ordersByMaterial).forEach(([materialId, orders]) => {
    // Find compatible machines for this material
    const compatibleMachines = machines.filter(m =>
      m.materials && m.materials.includes(materialId)
    );

    if (compatibleMachines.length === 0) return;

    // Sort orders by delivery date (earliest first)
    orders.sort((a, b) => new Date(a.delivery_date) - new Date(b.delivery_date));

    orders.forEach(order => {
      const product = order.product;

      // Find earliest possible start (respecting single-tool constraint)
      const productEarliest = productLastEndTime[product.id] || new Date();

      // Find first available machine with capacity
      let bestMachine = null;
      let bestStartTime = null;

      for (const machine of compatibleMachines) {
        // Check machine compatibility
        if (machine.pressure_tons < product.pressure_tons) continue;
        if (product.temperature_celsius < machine.temperature_min) continue;
        if (product.temperature_celsius > machine.temperature_max) continue;

        // Calculate potential start time (max of machine availability and product constraint)
        const machineAvailable = machineTimelines[machine.id];
        const startTime = new Date(Math.max(machineAvailable, productEarliest));

        if (!bestMachine || startTime < bestStartTime) {
          bestMachine = machine;
          bestStartTime = startTime;
        }
      }

      if (!bestMachine) return; // No compatible machine found

      // Calculate production duration
      const quantity = order.quantity || order.predicted_quantity;
      const cycleTimeHours = (product.cycle_time_seconds * quantity) / 3600;
      const setupMinutes = 45; // Simplified - always assume tool change
      const totalHours = cycleTimeHours + (setupMinutes / 60);

      // Calculate end time
      const endTime = new Date(bestStartTime);
      endTime.setHours(endTime.getHours() + totalHours);

      // Create block
      blocks.push({
        machine_id: bestMachine.id,
        product_id: product.id,
        customer_id: order.customer_id,
        batch_size: quantity,
        start_time: bestStartTime.toISOString(),
        end_time: endTime.toISOString(),
        setup_time_minutes: setupMinutes
      });

      // Update timelines
      machineTimelines[bestMachine.id] = endTime;
      productLastEndTime[product.id] = endTime;
    });
  });

  return {
    blocks: blocks,
    generated_at: new Date().toISOString()
  };
}
```

---

### 14.5 OEE Calculation - Demo Implementation

```javascript
/**
 * Calculate OEE for a machine over a time period
 * @param {object} machine - Machine with operating_start, operating_end
 * @param {array} blocks - Production blocks for this machine
 * @param {number} numberOfDays - Days in the period
 * @returns {number} OEE percentage
 */
function calculateMachineOEE(machine, blocks, numberOfDays) {
  // Calculate available hours (default 06:00-20:00 = 14 hours)
  const startHour = parseInt(machine.operating_start?.split(':')[0]) || 6;
  const endHour = parseInt(machine.operating_end?.split(':')[0]) || 20;
  const dailyHours = endHour - startHour;
  const availableHours = dailyHours * numberOfDays;

  // Calculate production hours from blocks
  const productionHours = blocks.reduce((sum, block) => {
    const start = new Date(block.start_time);
    const end = new Date(block.end_time);
    const hours = (end - start) / (1000 * 60 * 60);
    return sum + hours;
  }, 0);

  // OEE = production / available
  const oee = availableHours > 0
    ? (productionHours / availableHours) * 100
    : 0;

  return Math.round(oee * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate global OEE across all machines
 */
function calculateGlobalOEE(machines, allBlocks, numberOfDays) {
  let totalAvailable = 0;
  let totalProduction = 0;

  machines.forEach(machine => {
    const machineBlocks = allBlocks.filter(b => b.machine_id === machine.id);
    const startHour = parseInt(machine.operating_start?.split(':')[0]) || 6;
    const endHour = parseInt(machine.operating_end?.split(':')[0]) || 20;
    const dailyHours = endHour - startHour;

    totalAvailable += dailyHours * numberOfDays;

    totalProduction += machineBlocks.reduce((sum, block) => {
      const start = new Date(block.start_time);
      const end = new Date(block.end_time);
      return sum + (end - start) / (1000 * 60 * 60);
    }, 0);
  });

  const oee = totalAvailable > 0
    ? (totalProduction / totalAvailable) * 100
    : 0;

  return Math.round(oee * 10) / 10;
}
```

---

## 15. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-12 | Claude/Leo | Initial draft |
| 1.1 | 2026-01-12 | Claude/Leo | Added single-tool constraint documentation (section 3.2, validation rules, schedule generation logic) |
| 1.2 | 2026-01-12 | Claude/Leo | Added demo model implementations (section 14) with concrete calculation logic |

