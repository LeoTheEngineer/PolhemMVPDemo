# Machine Prep Model

## Purpose

The Machine Prep Model calculates the time required to transition a machine from its current state to the state required to produce a different product. This is critical for production scheduling optimization because minimizing total prep time across all machines directly improves OEE (Overall Equipment Effectiveness).

The model enables the scheduling algorithm to:
1. **Sequence products optimally** - Group similar products together to minimize state changes
2. **Assign products to machines** - Choose machines that require minimal state changes
3. **Calculate realistic schedules** - Account for actual prep time between production blocks

---

## Core Concept: Machine State

A machine's "state" is defined by the configuration required to produce a specific product:

| State Parameter | Description | Example |
|-----------------|-------------|---------|
| Tool (Mold) | The physical mold installed | Tool #A-2847 |
| Temperature | Operating temperature | 220°C |
| Pressure | Injection pressure | 850 tons |
| Material | Plastic material loaded | ABS Black |

When switching from Product A to Product B, the machine must transition from State A to State B. Each parameter change takes time.

---

## Questions This Model Must Answer

| Question | Input Required | Output |
|----------|----------------|--------|
| How long to switch Machine X from Product A to Product B? | Machine ID, current product, target product | Prep time (minutes) |
| What is the optimal product sequence for Machine X? | Machine ID, list of products | Ordered product list |
| Which machine requires least prep time for Product Y? | Product ID, list of available machines | Best machine ID + prep time |
| What is the total prep time for a given schedule? | Full schedule | Total prep minutes |

---

## Input Parameters

### Machine State Parameters (Current vs. Target)

| Parameter | Type | Unit | Source |
|-----------|------|------|--------|
| `current_tool_id` | UUID | - | Current production block or machine status |
| `target_tool_id` | UUID | - | Target product's required tool |
| `current_temperature` | Integer | °C | Machine's current operating temp |
| `target_temperature` | Integer | °C | Target product's required temp |
| `current_pressure` | Integer | tons | Machine's current pressure setting |
| `target_pressure` | Integer | tons | Target product's required pressure |
| `current_material_id` | UUID | - | Material currently loaded |
| `target_material_id` | UUID | - | Target product's required material |

### Prep Time Constants (from `settings` table)

| Parameter | Type | Unit | Description |
|-----------|------|------|-------------|
| `base_tool_change_minutes` | Integer | minutes | Fixed time to change any tool |
| `material_change_minutes` | Integer | minutes | Time to purge and load new material |
| `temperature_change_minutes_per_10c` | Integer | minutes | Time per 10°C temperature change |
| `pressure_change_minutes` | Integer | minutes | Time to adjust pressure (if significant) |
| `warmup_minutes` | Integer | minutes | Machine warmup time after major changes |

---

## Output

### Prep Time Breakdown

```javascript
{
  // Input echo
  machine_id: "uuid",
  from_product_id: "uuid",    // or null if machine is idle
  to_product_id: "uuid",

  // State comparison
  state_changes: {
    tool_change: true,         // Different tool required
    material_change: false,    // Same material
    temperature_delta: 30,     // °C difference (absolute)
    pressure_delta: 50,        // tons difference (absolute)
  },

  // Time breakdown (minutes)
  time_breakdown: {
    tool_change_time: 45,      // Base tool change time
    material_change_time: 0,   // No material change needed
    temperature_change_time: 9, // 30°C ÷ 10 × 3 min
    pressure_change_time: 0,   // Negligible
    warmup_time: 15,           // Post-change warmup
  },

  // Total
  total_prep_time_minutes: 69,

  // Efficiency metrics
  prep_time_hours: 1.15,
  prep_time_as_production_loss: 0.082  // As fraction of 14-hour day
}
```

---

## Prep Time Calculation Logic

### Additive Model (Baseline)

Total prep time is the sum of individual change times:

```
total_prep_time =
    (tool_change ? base_tool_change_minutes : 0)
  + (material_change ? material_change_minutes : 0)
  + (|temp_delta| / 10 × temperature_change_minutes_per_10c)
  + (pressure_change ? pressure_change_minutes : 0)
  + (major_change ? warmup_minutes : 0)
```

Where `major_change` = tool change OR material change OR temperature delta > threshold.

### Considerations for Production Model

| Factor | Impact | Notes |
|--------|--------|-------|
| Parallel operations | Some changes can happen simultaneously | Tool change + temp change may overlap |
| Operator skill | Experienced operators may be faster | Could model as efficiency factor |
| Machine age/condition | Older machines may take longer | Machine-specific multiplier |
| Time of day | Night shifts may have fewer resources | Shift-based adjustments |

---

## Open Questions (Factory Input Required)

Before implementing the production model, we need answers from the factory:

### Tool Changes

| Question | Why We Need It |
|----------|----------------|
| How long does a typical tool change take? | Base time for tool_change |
| Does tool change time vary by tool size/weight? | May need size-based formula |
| Are there tools that are faster/slower to change? | Tool-specific modifiers |
| How many operators are needed for a tool change? | Labor constraint |

### Material Changes

| Question | Why We Need It |
|----------|----------------|
| How long does it take to purge the old material? | Part of material_change time |
| How long to load and prime new material? | Part of material_change time |
| Are some material transitions faster than others? | Material transition matrix |
| Is there waste/scrap during material changes? | Cost factor |

### Temperature Changes

| Question | Why We Need It |
|----------|----------------|
| How fast can machines heat up (°C per minute)? | Heating rate |
| How fast can machines cool down (°C per minute)? | Cooling rate (usually slower) |
| Is there a maximum safe temperature change rate? | Constraint |
| Do large temperature changes require additional warmup? | Warmup threshold |

### Pressure Changes

| Question | Why We Need It |
|----------|----------------|
| Are pressure changes instantaneous or do they take time? | Whether to model |
| Are there calibration steps after pressure changes? | Additional time |

### General Process

| Question | Why We Need It |
|----------|----------------|
| What is the sequence of operations in a changeover? | Accurate time modeling |
| Which operations can be done in parallel? | Reduce total time calculation |
| Are there quality checks after changeover? | Additional time before production |
| What causes changeover delays/variations? | Variability modeling |

---

## State Similarity Optimization

The key optimization insight: **products with similar states should be scheduled sequentially**.

### Similarity Score

Calculate a "distance" between two product states:

```
state_distance(A, B) =
    w1 × (tool_different ? 1 : 0)
  + w2 × (material_different ? 1 : 0)
  + w3 × normalized_temp_difference
  + w4 × normalized_pressure_difference
```

Where `w1, w2, w3, w4` are weights reflecting the relative time cost of each change.

### Optimal Sequencing

Given products [A, B, C, D] to produce on one machine, find the sequence that minimizes total prep time. This is a variant of the Traveling Salesman Problem (TSP).

For small sets: brute force
For larger sets: greedy heuristic or optimization algorithm

---

## Constraints

| Constraint | Description | Parameter |
|------------|-------------|-----------|
| Machine compatibility | Not all machines can run all products | `products.required_pressure`, `machines.pressure_tons` |
| Material compatibility | Machines may have material restrictions | `machines.materials[]` array |
| Tool availability | Only one machine can use a tool at a time | Enforced in schedule |
| Operator availability | Tool changes may require specific personnel | `[PRODUCTION]` |

---

## Statistical Considerations `[PRODUCTION]`

For production implementation, consider:

1. **Prep Time Variability** - Actual prep times vary; model as distribution, not point estimate
2. **Learning Effects** - Operators may get faster with repeated changeovers
3. **Equipment Degradation** - Prep times may increase as equipment ages
4. **Historical Calibration** - Use actual recorded prep times to calibrate model

---

## Demo Implementation `[DEMO]`

See PRD section on demo implementations for simplified calculation approach.

---

## Related Models

| Model | Relationship |
|-------|--------------|
| Schedule Generator | Uses prep time to sequence products and assign machines |
| OEE Calculator | Prep time reduces available production time |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-12 | Claude/Leo | Initial documentation |
