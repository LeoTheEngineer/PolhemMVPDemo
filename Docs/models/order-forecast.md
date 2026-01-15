# Order Forecast Model

## Purpose

The Order Forecast Model predicts future orders for each customer-product combination based on historical order data. This is the foundation of the entire production planning system—without forecasts, we can only react to orders rather than plan proactively.

The model enables:
1. **Proactive scheduling** - Plan production before orders arrive
2. **Batch optimization** - Combine predicted demand into efficient production runs
3. **Capacity planning** - Anticipate busy periods and allocate resources
4. **Customer comparison** - Compare our predictions vs. customer-stated forecasts

---

## Core Concept: Forecast with Error

Every prediction has uncertainty. The model outputs not just "predicted quantity" but also an "error percentage" that represents confidence in the prediction.

```
Predicted Order:
  - Quantity: 5,000 units
  - Error: 15%
  - Range: 4,250 - 5,750 units (quantity ± error%)
  - Week: 2026-W08
```

**Key principle:** Error increases as we predict further into the future. A prediction for next week is more reliable than a prediction for next quarter.

---

## Questions This Model Must Answer

| Question | Input Required | Output |
|----------|----------------|--------|
| What will Customer X order of Product Y in the next T weeks? | Customer ID, Product ID, time horizon | List of predicted orders with quantities and errors |
| How reliable is our prediction for time T? | Customer ID, Product ID, time offset | Error percentage |
| How accurate have our past predictions been vs. customer forecasts? | Customer ID, Product ID | Historical accuracy metrics |
| Which predictions exceed the reliability threshold? | Settings threshold | List of unreliable predictions |

---

## Input Parameters

### Historical Data (from `orders` table)

| Data | Description | Usage |
|------|-------------|-------|
| Past orders | All historical orders for customer+product | Pattern detection |
| Order dates | When orders were placed | Timing patterns |
| Order quantities | How much was ordered | Volume patterns |
| Delivery dates | When orders were fulfilled | Lead time patterns |

### Customer Forecast Data (from `product_forecasts` table)

| Data | Description | Usage |
|------|-------------|-------|
| `forecast_quantity` | Customer's stated forecast for the year | Baseline comparison |
| `forecast_year` | Which year the forecast applies to | Time matching |

### Forecast Parameters (from `settings` table)

| Parameter | Type | Unit | Description |
|-----------|------|------|-------------|
| `prediction_error_threshold` | Decimal | % | Maximum acceptable error before marking unreliable |
| `forecast_horizon_weeks` | Integer | weeks | How far ahead to forecast (default: 16 weeks / 4 months) |

---

## Output

### Predicted Orders List

```javascript
{
  // Input echo
  customer_id: "uuid",
  product_id: "uuid",
  generated_at: "2026-01-12T10:30:00Z",
  settings_id: "uuid",

  // Forecast results
  predictions: [
    {
      week: "2026-W03",                // ISO week
      week_start_date: "2026-01-13",   // Monday of that week
      predicted_quantity: 5000,         // Expected order quantity
      error_percentage: 8.5,            // Confidence interval (±%)
      min_quantity: 4575,               // quantity × (1 - error)
      max_quantity: 5425,               // quantity × (1 + error)
      is_reliable: true,                // error < threshold
      confidence_level: "high"          // high/medium/low based on error
    },
    {
      week: "2026-W04",
      week_start_date: "2026-01-20",
      predicted_quantity: 5000,
      error_percentage: 12.3,
      min_quantity: 4385,
      max_quantity: 5615,
      is_reliable: true,
      confidence_level: "medium"
    },
    {
      week: "2026-W07",
      week_start_date: "2026-02-10",
      predicted_quantity: 4500,
      error_percentage: 32.1,           // Exceeds 25% threshold
      min_quantity: 3055,
      max_quantity: 5945,
      is_reliable: false,               // Marked unreliable
      confidence_level: "low"
    }
    // ... more weeks
  ],

  // Aggregated metrics
  aggregates: {
    total_predicted_quantity: 45000,    // Sum of all predictions
    average_error_percentage: 18.5,     // Average across predictions
    reliable_predictions_count: 12,     // Count where is_reliable = true
    unreliable_predictions_count: 4     // Count where is_reliable = false
  },

  // Customer forecast comparison
  customer_comparison: {
    customer_annual_forecast: 250000,   // What customer said
    our_annual_prediction: 234000,      // Our extrapolated prediction
    variance_percentage: -6.4           // We predict 6.4% less than customer forecast
  }
}
```

---

## Error Calculation Logic

### Historical Error Analysis

Error percentage is calculated by comparing past customer forecasts to actual orders:

```
For each historical year:
  forecast_error = |customer_forecast - actual_orders| / customer_forecast × 100

Example:
  Year 2024: Customer forecast = 100,000, Actual orders = 80,000
  Error = |100,000 - 80,000| / 100,000 × 100 = 20%

  Year 2025: Customer forecast = 120,000, Actual orders = 115,000
  Error = |120,000 - 115,000| / 120,000 × 100 = 4.2%
```

### Time-Decay Weighting

More recent years should have higher weight:

```
weighted_error = Σ(year_error × weight) / Σ(weight)

Where weight decreases for older data:
  - Current year-1: weight = 1.0
  - Current year-2: weight = 0.7
  - Current year-3: weight = 0.5
  - Current year-4: weight = 0.3
```

### Error Scaling by Time Horizon

Error increases for predictions further in the future:

```
prediction_error(week_offset) = base_error × (1 + growth_factor × week_offset)

Example with base_error = 10%, growth_factor = 0.02:
  - Week 1: 10% × (1 + 0.02 × 1) = 10.2%
  - Week 4: 10% × (1 + 0.02 × 4) = 10.8%
  - Week 8: 10% × (1 + 0.02 × 8) = 11.6%
  - Week 16: 10% × (1 + 0.02 × 16) = 13.2%
```

---

## Forecast Generation Logic

### Pattern Detection

The model should detect and use:

| Pattern | Description | Example |
|---------|-------------|---------|
| Average quantity | Typical order size | ~5,000 units per order |
| Order frequency | How often they order | Every 2 weeks |
| Seasonality | Patterns by time of year | Higher in Q4 |
| Trend | Growth or decline over time | +5% year-over-year |

### Quantity Prediction

For each future time period:

```
predicted_quantity =
    base_quantity
  × seasonality_factor(week)
  × trend_factor(weeks_from_now)
  × (customer_forecast / historical_average)  // Adjust to customer expectations
```

### Timing Prediction

Predict when orders will occur based on historical order frequency:

```
If customer typically orders every 2 weeks:
  - Predict orders at week 0, 2, 4, 6, 8, ...
  - With some uncertainty in exact timing
```

---

## Reliability Classification

| Error % | Confidence Level | Is Reliable | UI Treatment |
|---------|------------------|-------------|--------------|
| 0-15% | High | Yes | Green, included in auto-schedule |
| 15-25% | Medium | Yes | Orange, included with caution |
| 25%+ | Low | No | Red, excluded from auto-schedule |

The threshold (default 25%) is configurable in settings.

**Important:** Unreliable predictions are:
- Still displayed in the UI (user can see them)
- Marked with visual warning indicator
- Excluded from automatic schedule generation
- Available for manual scheduling consideration

---

## Open Questions (Factory Input Required)

Before implementing the production model, we need answers from the factory:

### Historical Data

| Question | Why We Need It |
|----------|----------------|
| How many years of order history do we have? | More data = better forecasts |
| Is the historical data clean and complete? | Data quality affects accuracy |
| Were there any anomalous periods (COVID, supply issues)? | May need to exclude outliers |
| How far back should we look for patterns? | Recency vs. data quantity trade-off |

### Customer Forecasts

| Question | Why We Need It |
|----------|----------------|
| Do all customers provide annual forecasts? | Availability of comparison data |
| How often do customers update their forecasts? | Forecast freshness |
| At what granularity do customers forecast (annual, quarterly, monthly)? | Matching time periods |
| How reliable have customer forecasts been historically? | Weight we should give them |

### Order Patterns

| Question | Why We Need It |
|----------|----------------|
| Do customers have regular ordering schedules? | Predictable timing |
| Are there known seasonal patterns? | Seasonality factors |
| Do order sizes vary significantly? | Quantity uncertainty |
| Are there leading indicators before orders (POs, inquiries)? | Early signals |

### Business Rules

| Question | Why We Need It |
|----------|----------------|
| What error threshold should we use for reliability? | Default setting |
| How far ahead should we forecast by default? | Forecast horizon |
| Should some customers/products have different thresholds? | Customer-specific settings |
| What happens when predictions are unreliable? | Business process |

---

## Statistical Models to Consider `[PRODUCTION]`

We have not yet decided on the specific statistical model. Options include:

| Model | Pros | Cons | Complexity |
|-------|------|------|------------|
| Simple Moving Average | Easy to implement, interpretable | Doesn't capture trends/seasonality | Low |
| Exponential Smoothing | Captures recent trends | Requires parameter tuning | Medium |
| ARIMA | Handles trends and seasonality | Complex, requires expertise | High |
| Prophet (Facebook) | Good for business time series | External dependency | Medium |
| Machine Learning (XGBoost) | Can capture complex patterns | Requires significant data | High |

**Recommendation for Demo:** Simple Moving Average or Exponential Smoothing
**Recommendation for Production:** Prophet or Exponential Smoothing with seasonality

---

## Constraints

| Constraint | Description | Implementation |
|------------|-------------|----------------|
| Minimum order size | Some products have minimum order quantities | `products.min_order_quantity` |
| Maximum forecast horizon | Don't predict too far ahead | `settings.forecast_horizon_weeks` |
| Data requirements | Need minimum history for forecasting | Check for N+ historical orders |

---

## Demo Implementation `[DEMO]`

See PRD section on demo implementations for simplified calculation approach.

---

## Related Models

| Model | Relationship |
|-------|--------------|
| Schedule Generator | Uses forecasts to plan production |
| Storage Cost | Forecasts determine how long products may be stored |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-12 | Claude/Leo | Initial documentation |
