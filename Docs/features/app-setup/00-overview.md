# Polhem MVP - App Setup Instructions

## Overview

This folder contains step-by-step implementation instructions for the Polhem production planning demo application. Each file is numbered and should be executed **in sequential order** by a coding agent.

**Target:** A fully functional demo application deployable to DigitalOcean App Platform.

---

## Project Summary

Polhem is a decision-support web application for plastic injection molding manufacturers. The demo showcases:

- **Orders View:** Timeline of real and predicted orders with editing capability
- **Settings View:** Configuration tables for materials, machines, products, customers, and model parameters
- **Schedule View:** Interactive Gantt chart with drag-drop production block management

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.1 (App Router) |
| UI | React 19, Tailwind CSS, shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Clerk |
| Hosting | DigitalOcean App Platform |

---

## Execution Order

Execute these files **in order**. Each file builds upon the previous ones.

| # | File | Purpose | Est. Time |
|---|------|---------|-----------|
| 01 | `01-critical-fixes.md` | Fix bugs in existing Supabase module | 15 min |
| 02 | `02-environment-setup.md` | Configure environment variables and install dependencies | 10 min |
| 03 | `03-database-setup.md` | Run SQL scripts to create tables | 15 min |
| 04 | `04-seed-data-updates.md` | Add predicted_orders and forecasts to seed data | 20 min |
| 05 | `05-lib-utilities.md` | Create lib/supabase.js wrapper and utility functions | 20 min |
| 05b | `05b-rate-limiting.md` | Rate limiting module for API protection | 15 min |
| 06 | `07-business-models.md` | Implement simplified calculation models | 45 min |
| 07 | `06-api-routes.md` | Implement all API routes with rate limiting | 1.5 hours |
| 08 | `08-layout-components.md` | Create Sidebar, Header, Dashboard layout | 30 min |
| 09 | `09-shared-components.md` | Create reusable UI components | 45 min |
| 10 | `10-dashboard-page.md` | Implement main dashboard | 30 min |
| 11 | `11-orders-page.md` | Implement Orders tab with timeline | 1.5 hours |
| 12 | `12-settings-page.md` | Implement Settings tab with 5 table components | 2 hours |
| 13 | `13-schedule-page.md` | Implement Schedule tab with drag-drop Gantt | 3 hours |
| 14 | `14-deployment.md` | Configure DigitalOcean deployment | 20 min |
| 15 | `15-verification.md` | Testing checklist and QA | 15 min |

**Important:** Execute `07-business-models.md` BEFORE `06-api-routes.md` because the API routes import from the models.

**Total Estimated Time:** ~12.5 hours

---

## Dependency Map

```
01-critical-fixes
       │
       ▼
02-environment-setup
       │
       ▼
03-database-setup ──► 04-seed-data-updates
       │
       ▼
05-lib-utilities
       │
       ▼
05b-rate-limiting
       │
       ▼
07-business-models
       │
       ▼
06-api-routes (imports from models)
       │
       ▼
08-layout-components
       │
       ▼
09-shared-components
       │
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
10-dashboard    11-orders      12-settings
                                     │
                                     ▼
                              13-schedule
                                     │
                                     ▼
                              14-deployment
                                     │
                                     ▼
                              15-verification
```

---

## Prerequisites

Before starting, ensure you have:

- [ ] Node.js 20+ installed
- [ ] npm or yarn package manager
- [ ] A Supabase account with a project created
- [ ] A Clerk account with an application created
- [ ] Access to the project repository

---

## Key Decisions (Demo Simplifications)

These decisions apply throughout all implementation files:

| Aspect | Demo Approach |
|--------|---------------|
| **Schedule Generation** | Sequential machine assignment (no optimization) |
| **OEE Calculation** | Simple ratio: production hours / available hours |
| **Predictions** | Pre-seeded data, no ML models |
| **Storage Cost** | Simple linear calculation |
| **Data Tables** | Read + Edit only (no delete), except Orders and Predicted Orders which have full CRUD |
| **Theme** | Dark mode only |

---

## File Conventions

Each instruction file follows this format:

1. **Purpose** - What this file accomplishes
2. **Prerequisites** - What must be completed first
3. **Files to Create/Edit** - List of file paths
4. **Implementation** - Step-by-step code with exact file paths
5. **Verification** - How to confirm success

---

## Important Notes

- All code blocks are **copy-paste ready**
- File paths are **absolute from project root**
- Each file should be fully completed before moving to the next
- If a step fails, fix it before proceeding

---

## Quick Reference: Project Structure

```
polhem-mvp-demo/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.js
│   │   └── sign-up/[[...sign-up]]/page.js
│   ├── (dashboard)/
│   │   ├── layout.js
│   │   ├── dashboard/page.js
│   │   ├── orders/page.js
│   │   ├── settings/page.js
│   │   └── schedule/page.js
│   ├── api/
│   │   ├── customers/route.js
│   │   ├── materials/route.js
│   │   ├── machines/route.js
│   │   ├── products/route.js
│   │   ├── orders/route.js
│   │   ├── predicted-orders/route.js
│   │   ├── production-blocks/route.js
│   │   └── settings/route.js
│   ├── layout.js
│   ├── page.js
│   └── globals.css
├── components/
│   ├── ui/                    (shadcn components)
│   ├── layout/
│   │   ├── Sidebar.js
│   │   └── Header.js
│   ├── shared/
│   │   ├── LoadingSpinner.js
│   │   ├── EmptyState.js
│   │   ├── DataTable.js
│   │   └── ConfirmDialog.js
│   ├── orders/
│   │   ├── OrderTimeline.js
│   │   ├── OrderCard.js
│   │   └── OrderEditModal.js
│   ├── settings/
│   │   ├── MaterialsTable.js
│   │   ├── MachinesTable.js
│   │   ├── ProductsTable.js
│   │   ├── CustomersTable.js
│   │   ├── PredictedOrdersTable.js
│   │   └── ModelSettings.js
│   └── schedule/
│       ├── ScheduleGantt.js
│       ├── ProductionBlock.js
│       ├── BlockEditModal.js
│       └── HourlyModal.js
├── lib/
│   ├── supabase.js
│   ├── utils.js
│   └── constants.js
├── models/
│   ├── storage-cost.js
│   ├── machine-prep.js
│   ├── order-forecast.js
│   └── schedule-generator.js
├── Modules/
│   └── supabase.js            (existing, to be fixed)
├── sql/
│   ├── drop-tables.sql
│   ├── create-tables.sql
│   ├── seed-data.sql
│   └── functions.sql
├── Docs/
│   └── features/app-setup/    (this folder)
├── .env.local
├── middleware.js
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## Getting Help

If you encounter issues:

1. Check the **Verification** section of each file
2. Review the error message carefully
3. Ensure all prerequisites are met
4. Check that previous steps completed successfully

---

**Start with:** `01-critical-fixes.md`
