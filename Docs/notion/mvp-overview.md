# MVP Overview – Predictive Production Planning & Machine Optimization Platform

---

## Executive Summary

This system is a decision-support web application designed for **plastic injection molding contract manufacturers**. It integrates existing ERP and machine data to **predict future demand, optimize batch sizes, and generate machine-level production schedules** that maximize overall business performance rather than optimizing individual orders in isolation.

By combining historical order behavior, probabilistic demand forecasting, inventory economics, and machine-specific setup constraints, the platform enables manufacturers to:

- Reduce unnecessary tool and material switches
- Minimize machine downtime
- Increase OEE (Overall Equipment Effectiveness)
- Optimize capital efficiency and inventory
- Proactively plan machine changeovers weeks in advance

The result is higher throughput, lower operational friction, and increased revenue without additional machinery or staffing.

---

## System Context & Integrations

The MVP is designed to sit **on top of existing operational systems**, not replace them.

### Integrated Systems

- **ERP – Pyramide**
    - Customers
    - Products
    - Orders and order history
    - Delivery dates
    - Pricing and margins
- **Machine Integration – Rectron**
    - Machine capabilities (pressure, temperature, material compatibility)
    - Historical production data
    - Setup parameters
    - Runtime and downtime metrics

All analytics and optimization are performed using data already available in the organization.

---

## Core Problem Being Solved

CM (HMLV) injection molding efficiency is primarily constrained by:

1. **Frequent machine switches**
2. **High setup and preparation times**
3. **Reactive production planning**
4. **Uncertainty in customer order behavior**

While producing larger batches improves OEE, producing too early ties up capital and incurs storage costs. The challenge is not to optimize a single product or machine—but to **optimize the entire production system under uncertainty**.

---

## MVP Architecture – Logical Flow

The MVP consists of **four sequential optimization layers**, each building on the previous one.

---

## 1. Customer Order Behavior & Cancellation Risk Modeling

### Objective

Quantify how reliable future orders are for each customer and product.

### Approach

For each customer:

- Analyze historical order patterns
- Identify cancellation frequency and timing
- Build a probabilistic model estimating **likelihood of cancellation**

This creates a **customer-specific reliability profile** that feeds into demand forecasting.

**Value:**

Prevents the system from treating all future demand as equally reliable.

---

## 2. Product-Level Demand Forecasting Under Uncertainty

### Objective

Estimate how many units of each product will likely be ordered in future weeks—while accounting for cancellation risk.

### Approach

For each customer–product combination:

- Analyze historical weekly demand
- Apply a probabilistic forecasting method (e.g. Monte Carlo simulation)
- Predict weekly demand for the next ~16 weeks

For weeks with:

- High uncertainty
- Elevated cancellation probability

The forecasted quantity is **reduced or set to zero**, ensuring conservative planning.

### Output

A **time-phased demand curve per product**, representing *expected producible demand*, not optimistic sales projections.

---

## 3. Global Production Optimization (Inventory vs OEE)

### Objective

Determine **how much to produce and when**, across all products, to maximize total business value.

### Key Trade-offs Modeled

- **OEE Gains**
    - Larger batches reduce:
        - Tool switches
        - Machine setup frequency
        - Operator intervention
- **Inventory Costs**
    - Capital tied up in stock
    - Storage and handling costs
    - Risk of overproduction

### Optimization Logic

The system:

- Evaluates producing products X weeks ahead of delivery
- Quantifies:
    - Economic gains from improved OEE
    - Economic costs of early production
- Finds the **global optimum** where:
    
    ```
    (OEE gains – inventory costs) is maximized
    
    ```
    

### Output

A **weekly production requirement per product**, e.g.:

- Week 1: 10,000 units of Product ABC
- Week 2: 25,000 units of Product ABC
- Week 3: 0 units (uncertain demand)

This is a **business-optimal production plan**, not just a demand forecast.

---

## 4. Machine-Level Scheduling & Setup Optimization

### Objective

Translate production quantities into an **optimal machine schedule** that minimizes downtime and switching.

### Constraints Considered

- Machine capabilities (pressure, temperature, material)
- Tool compatibility
- Setup differences between consecutive products
- Preparation time when switching tools/materials/settings
- Available machine hours

### Setup Time Modeling

The system models:

- Setup cost between Product A → Product B on Machine X
- Initial setup cost when machine starts idle
- Reduced setup when:
    - Same material
    - Similar temperature/pressure
    - Shared tooling characteristics

### Optimization Outcome

Products are assigned to machines such that:

- All technical constraints are met
- Setup transitions are minimized
- Machines run longer, more stable production sequences

---

## Final Outputs

### 1. Optimized Machine Schedule

- Which machine runs which product
- Exact time windows
- Expected setup times

### 2. Forward-Looking Changeover Plan

- Tool switches planned weeks in advance
- Enables “ställare” to prepare proactively
- Further reduces downtime beyond algorithmic optimization

### 3. Business KPIs Improved

- Lower average switches per machine per day
- Lower average downtime per switch

Result:

- Higher OEE
- Improved cash flow and inventory efficiency

---

## Adaptive Re-Optimization and System Responsiveness

### How Changes Propagate Through the System

The platform is designed as a **continuously adaptive optimization system**, not a static planning tool. Any material change in operational conditions or business inputs automatically triggers a controlled re-optimization process to ensure that all outputs remain globally optimal.

Rather than manually adjusting individual schedules, the system recalculates downstream decisions in a structured and predictable way.

---

### Changes in Machine Availability

**Examples**

- Machine breakdown
- Planned maintenance
- Temporary capacity reduction or increase

**System Response**

- The affected machine is removed or capacity-adjusted in the machine model
- The **entire machine scheduling optimization is regenerated**
- Products are reassigned across remaining machines based on:
    - Capability constraints
    - Setup time minimization
    - Available machine hours

**Outcome**

- A new machine schedule that remains optimal under the updated capacity constraints
- No partial or local fixes—optimization is always system-wide

---

### Changes in Customer or Order Data

**Examples**

- Order cancellations
- New orders
- New customers or products
- Updated delivery dates or quantities

**System Response**

1. Customer behavior and cancellation risk models are updated
2. Product-level demand forecasts are regenerated
3. The **global production optimization** is recalculated
4. A new production plan is produced
5. The **machine schedule is regenerated** based on the updated production plan

**Outcome**

- Production quantities reflect the latest business reality
- Machine schedules always align with the most current demand signals
- Inventory risk and overproduction are actively minimized

---

### Key Principle: Global Consistency Over Local Adjustments

The system never performs isolated adjustments (e.g. “just move this order to another machine”).

Instead, it always recomputes the **entire optimization chain**, ensuring that:

- OEE remains maximized
- Downtime remains minimized
- Capital efficiency is preserved
- Decisions stay aligned with overall business objectives

This guarantees that the solution remains optimal not just for individual machines or products, but for the **entire operation as a unified system**.

---

## Business Value Summary

This system:

- Converts historical data into **actionable production decisions**
- Optimizes for the **entire operation**, not individual orders
- Increases revenue without additional capital expenditure
- Creates predictability for production, maintenance, and staffing
- Scales with the business as volumes and machine fleets grow

It is not a reporting tool—it is a **decision engine**.

---

## MVP Scope Clarification

For the MVP:

- The system is delivered as a **web application**
- Focus is on:
    - Data ingestion
    - Forecasting
    - Optimization logic
    - Schedule generation
- UI and technical architecture can evolve later

---

## Clarifications (Optional for Next Step)

Everything is conceptually clear. Items that can be defined later but may affect modeling depth:

1. Time granularity (hourly vs daily machine scheduling)
2. Whether partial production of an order is allowed
3. Shelf-life constraints for materials/products (if any)
4. Penalty cost for late delivery vs early production

None of these block the MVP overview.