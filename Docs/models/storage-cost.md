# Storage Cost Model

## Purpose

The Storage Cost Model calculates the total cost of holding inventory in storage. This model is critical for production scheduling optimization because it quantifies the trade-off between producing larger batches (which reduces machine setup frequency but increases storage costs) versus smaller batches (which increases setup frequency but reduces capital tied up in inventory).

The model enables the scheduling algorithm to find the optimal batch size where:
```
(OEE gains from fewer setups) - (storage costs) = maximized profit
```

---

## Model Components

The Storage Cost Model consists of two primary cost components:

### 1. Capital Cost (Tied-Up Capital)

Capital tied up in inventory has an opportunity cost. Money invested in raw materials and finished goods sitting in storage cannot be used for other investments.

**Two perspectives on tied-up capital:**

| Metric | Description | Calculation |
|--------|-------------|-------------|
| Material Capital | Cost of raw materials in stored products | `product_count × material_cost_per_unit` |
| Revenue Capital | Potential revenue locked in finished goods | `product_count × sale_price_per_unit` |

The **interest cost** represents what this capital could have earned if invested elsewhere (or the actual borrowing cost if financed).

### 2. Operational Storage Cost

Physical costs of maintaining inventory:
- Warehouse space (cost per m³ or m²)
- Employee labor for inventory management
- Utilities, climate control
- Insurance
- Inventory handling equipment
- Shrinkage/damage risk

---

## Questions This Model Must Answer

| Question | Input Required | Output |
|----------|----------------|--------|
| How much does it cost to store X units of product Y for T time? | Product ID, quantity, duration | Total storage cost (SEK) |
| How much capital is tied up in X units of product Y? | Product ID, quantity | Capital amount (SEK) |
| What is the interest cost of holding X capital for T time? | Capital amount, duration, interest rate | Interest cost (SEK) |
| What is the total holding cost (storage + capital) for a batch? | Product ID, quantity, duration | Total holding cost (SEK) |

---

## Input Parameters

### Per-Product Parameters (from `products` table)

| Parameter | Type | Unit | Description |
|-----------|------|------|-------------|
| `material_cost` | Decimal | SEK | Raw material cost per unit |
| `sale_price` | Decimal | SEK | Sale price per unit |
| `volume_per_unit` | Decimal | m³ | Physical volume per unit (for space calculation) |
| `weight_per_unit` | Decimal | kg | Weight per unit (if relevant for handling) |

### Storage Parameters (from `settings` table)

| Parameter | Type | Unit | Description |
|-----------|------|------|-------------|
| `storage_cost_per_m3_per_day` | Decimal | SEK/m³/day | Cost of warehouse space |
| `storage_employee_hourly_cost` | Decimal | SEK/hour | Labor cost for inventory management |
| `storage_handling_hours_per_1000_units` | Decimal | hours | Labor time per 1000 units handled |
| `capital_interest_rate_annual` | Decimal | % | Annual interest rate for capital cost |

### Calculation Inputs

| Input | Type | Description |
|-------|------|-------------|
| `product_id` | UUID | Which product |
| `quantity` | Integer | Number of units |
| `storage_duration_days` | Integer | How long in storage |

---

## Output

### Storage Cost Breakdown

```javascript
{
  // Input echo
  product_id: "uuid",
  quantity: 5000,
  storage_duration_days: 14,

  // Capital calculations
  material_capital: 125000.00,      // quantity × material_cost
  revenue_capital: 250000.00,       // quantity × sale_price
  capital_interest_cost: 958.90,    // material_capital × (interest_rate / 365) × days

  // Operational storage calculations
  space_cost: 350.00,               // volume × storage_cost_per_m3_per_day × days
  handling_cost: 200.00,            // labor hours × hourly_cost

  // Totals
  total_operational_cost: 550.00,   // space_cost + handling_cost
  total_capital_cost: 958.90,       // interest on tied-up capital
  total_holding_cost: 1508.90,      // total_operational_cost + total_capital_cost

  // Per-unit metrics
  cost_per_unit_per_day: 0.0215     // total_holding_cost / quantity / days
}
```

---

## Open Questions (Factory Input Required)

Before implementing the production model, we need answers from the factory:

### Space & Facilities

| Question | Why We Need It |
|----------|----------------|
| What is the warehouse capacity (m³ or m²)? | To model storage constraints |
| Is there a maximum inventory level constraint? | Hard limit on batch sizes |
| Are there different storage zones with different costs? | May need zone-specific rates |
| Is climate control required for certain products? | Different cost rates |

### Capital & Financial

| Question | Why We Need It |
|----------|----------------|
| What interest rate should we use for capital cost? | Could be borrowing rate, opportunity cost, or company-specific |
| Is there a maximum capital they want tied up in inventory? | Constraint on total inventory value |
| Are there seasonal periods when capital is more constrained? | Time-varying constraints |
| Do they have financing costs for raw material purchases? | May affect material capital calculation |

### Labor & Operations

| Question | Why We Need It |
|----------|----------------|
| How many warehouse employees are there? | Labor cost baseline |
| What is the average hourly labor cost (including overhead)? | For handling cost calculation |
| How long does it take to receive, store, and retrieve products? | Handling time per unit |
| Are there fixed costs regardless of inventory level? | May need fixed + variable model |

### Other Costs

| Question | Why We Need It |
|----------|----------------|
| What is the insurance cost for stored goods? | Additional holding cost |
| What is the historical shrinkage/damage rate? | Risk cost factor |
| Are there any regulatory/compliance costs for storage? | Additional cost factors |

---

## Constraints to Model

The storage cost model should also track and enforce constraints:

| Constraint | Description | Parameter |
|------------|-------------|-----------|
| Max warehouse capacity | Physical limit on storage volume | `max_storage_volume_m3` |
| Max inventory value | Financial limit on tied-up capital | `max_inventory_value_sek` |
| Max storage duration | Some products may have shelf life | `max_storage_days` (per product) |
| Min safety stock | Minimum inventory to maintain | `min_safety_stock` (per product) |

---

## Statistical Considerations `[PRODUCTION]`

For production implementation, consider:

1. **Demand Variability** - Storage duration depends on when products are sold; higher demand variability = longer average storage time
2. **Lead Time Variability** - Buffer stock needed to handle supply chain variability
3. **Service Level Requirements** - Higher service levels require more safety stock
4. **ABC Analysis** - Different cost models for high-value vs. low-value products

---

## Demo Implementation `[DEMO]`

See PRD section on demo implementations for simplified calculation approach.

---

## Related Models

| Model | Relationship |
|-------|--------------|
| Schedule Generator | Uses storage cost to optimize batch sizes |
| Order Forecast | Predicts demand which affects storage duration |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-12 | Claude/Leo | Initial documentation |
