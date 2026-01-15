# Polhem MVP Demo

A production planning and scheduling application designed for plastic injection molding manufacturers. This demo showcases how manufacturers can manage orders, predict future demand, and optimize their production schedules.

## What is Polhem?

Polhem helps manufacturing companies plan their production more efficiently by:

- Tracking customer orders and their due dates
- Predicting future orders based on historical patterns
- Automatically generating production schedules
- Visualizing machine utilization and capacity

## Application Overview

### Dashboard

The main overview page showing key metrics at a glance:
- Total customers, products, and machines
- Pending and scheduled orders
- Today's production activity
- Overall equipment effectiveness (OEE)

### Orders

View and manage all customer orders in a visual timeline:

- **Real Orders** (Green) - Confirmed orders from customers
- **Predicted Orders** (Yellow) - System-predicted future orders based on patterns
- **Unreliable Predictions** (Red) - Low-confidence predictions shown for reference only

Each order displays:
- Quantity to produce
- Due date
- Current status (Pending, Scheduled, In Production, Completed)

Order statuses are automatically calculated based on the production schedule - no manual status updates needed.

### Schedule

The production schedule page where you can:

- **Generate Schedule** - Automatically create production blocks based on orders
- **View Timeline** - See which machines are running which products and when
- **Drag & Drop** - Manually adjust production blocks if needed
- **Regenerate** - Clear and recalculate the entire schedule

Production blocks are automatically split across multiple work days when needed, respecting work hour boundaries (6:00 AM - 10:00 PM).

### Settings

Manage all system data and configuration:

- **Materials** - Raw materials used in production (ABS, Polypropylene, etc.)
- **Machines** - Injection molding machines with specifications and hourly rates
- **Products** - Product catalog with cycle times, mold information, and compatible machines
- **Customers** - Customer database
- **Predicted Orders** - View and manage system-generated order predictions
- **Model Settings** - Configure system parameters like work hours, setup times, and thresholds

## Key Concepts

### Order Status Flow

1. **Pending** - Order received, no production scheduled yet
2. **Scheduled** - Production block created for future date
3. **In Production** - Currently being manufactured
4. **Completed** - Production finished

### Reliable vs Unreliable Predictions

- **Reliable** (confidence >= 75%) - Included in production scheduling
- **Unreliable** (confidence < 75%) - Shown for visual reference only, not scheduled

### Production Blocks

A production block represents a scheduled manufacturing run:
- Assigned to a specific machine
- Has a start and end time
- Produces a specific quantity of a product
- Automatically respects machine compatibility

## Technical Stack

- **Frontend**: Next.js 16 with React 19
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk
- **Styling**: Tailwind CSS v4
- **Deployment**: DigitalOcean App Platform

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see below)
4. Run development server: `npm run dev`
5. Open http://localhost:3005

## Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

---

*This is a demo/MVP application for demonstration purposes.*
