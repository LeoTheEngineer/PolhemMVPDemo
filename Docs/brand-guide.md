# Polhem Demo Application - Brand & Design Guide

## Overview

This document defines the visual design system for the Polhem production planning demo application at `demo.polhem.net`. This is a **dashboard application** with high information density, interactive components, and data visualizations—distinct from the pitch website at `polhem.net`.

**Key Characteristics:**
- **Dark theme only** - No light mode toggle
- **Data-rich interface** - Tables, timelines, charts, forms
- **Professional simplicity** - Clean, minimal, modern
- **High information density** - Optimized for production planners
- **Interactive elements** - Drag & drop, hover states, tooltips

---

## Design Philosophy

### Guiding Principles

1. **Clarity Over Decoration:** Every element serves a purpose. No visual noise.
2. **Information Hierarchy:** Clear distinction between primary, secondary, and tertiary content.
3. **Consistent Spacing:** Use the defined spacing scale religiously.
4. **Minimal Animation:** Only animate to provide feedback or guide attention.
5. **Accessibility First:** WCAG 2.1 AA compliance minimum.

### Target Users

- Production planners
- Sales/planning teams
- Management reviewing forecasts and capacity

---

## Color Palette

### Primary Colors

```css
/* Dark Theme Foundation */
--color-background: #000000;           /* Page background */
--color-secondary-bg: #1A1A1A;         /* Cards, panels, sidebar */
--color-tertiary-bg: #2A2A2A;          /* Nested elements, hover states */

/* Accent Color - Use Sparingly */
--color-accent: #E25822;               /* Molten Mars Orange - Primary actions, highlights */
--color-accent-hover: #FF6B35;         /* Accent hover state */

/* Text Colors */
--color-text-primary: #FFFFFF;         /* Primary text, headings */
--color-text-secondary: #B0B0B0;       /* Secondary text, labels */
--color-text-muted: #666666;           /* Tertiary text, placeholders */

/* Semantic Colors */
--color-success: #22C55E;              /* Confirmed orders, positive states */
--color-warning: #F59E0B;              /* Predicted orders, caution states */
--color-error: #EF4444;                /* Errors, unreliable predictions */
--color-info: #3B82F6;                 /* Information, neutral highlights */

/* Border Colors */
--color-border: #333333;               /* Default borders */
--color-border-light: #444444;         /* Subtle borders, dividers */
```

### Color Usage Matrix

| Element | Color | Hex |
|---------|-------|-----|
| Page background | `background` | #000000 |
| Sidebar background | `secondary-bg` | #1A1A1A |
| Card background | `secondary-bg` | #1A1A1A |
| Table row hover | `tertiary-bg` | #2A2A2A |
| Primary buttons | `accent` | #E25822 |
| Secondary buttons | `secondary-bg` | #1A1A1A with border |
| Headings | `text-primary` | #FFFFFF |
| Body text | `text-secondary` | #B0B0B0 |
| Placeholder text | `text-muted` | #666666 |
| Real orders | `success` | #22C55E |
| Predicted orders | `warning` | #F59E0B |
| Unreliable predictions | `error` | #EF4444 |
| Borders | `border` | #333333 |

### Tailwind Configuration

Add to `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        background: '#000000',
        'secondary-bg': '#1A1A1A',
        'tertiary-bg': '#2A2A2A',
        accent: '#E25822',
        'accent-hover': '#FF6B35',
        'text-primary': '#FFFFFF',
        'text-secondary': '#B0B0B0',
        'text-muted': '#666666',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        border: '#333333',
        'border-light': '#444444',
      },
    },
  },
}
```

---

## Typography

### Font Family: D-DIN

A modern, geometric sans-serif font conveying precision and professionalism.

**Font Files (in `/public/fonts/`):**
- `D-DIN.otf` - Regular (400)
- `D-DIN-Bold.otf` - Bold (700)
- `D-DIN-Italic.otf` - Italic
- `D-DINCondensed.otf` - Condensed Regular
- `D-DINCondensed-Bold.otf` - Condensed Bold

### Type Scale

| Element | Size | Weight | Line Height | Tailwind Class |
|---------|------|--------|-------------|----------------|
| Page Title | 32px | 700 | 1.2 | `text-[32px] font-bold leading-tight` |
| Section Title | 24px | 700 | 1.3 | `text-2xl font-bold` |
| Card Title | 18px | 600 | 1.4 | `text-lg font-semibold` |
| Table Header | 14px | 600 | 1.4 | `text-sm font-semibold uppercase` |
| Body Large | 16px | 400 | 1.6 | `text-base` |
| Body | 14px | 400 | 1.5 | `text-sm` |
| Caption | 12px | 400 | 1.4 | `text-xs` |
| Label | 12px | 500 | 1.2 | `text-xs font-medium uppercase tracking-wide` |

### Typography Usage Examples

```jsx
{/* Page Title */}
<h1 className="text-[32px] font-bold leading-tight text-text-primary">
  Orders
</h1>

{/* Section Title */}
<h2 className="text-2xl font-bold text-text-primary">
  Order Timeline
</h2>

{/* Card Title */}
<h3 className="text-lg font-semibold text-text-primary">
  Customer Forecast
</h3>

{/* Table Header */}
<th className="text-sm font-semibold uppercase text-text-secondary tracking-wide">
  Order Date
</th>

{/* Body Text */}
<p className="text-sm text-text-secondary leading-relaxed">
  Select a customer and product to view the order timeline.
</p>

{/* Label */}
<label className="text-xs font-medium uppercase tracking-wide text-text-muted">
  Customer
</label>
```

---

## Spacing System

Use a consistent 4px base unit for all spacing.

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Inline spacing, icon gaps |
| `space-2` | 8px | Tight spacing, list items |
| `space-3` | 12px | Standard spacing, form fields |
| `space-4` | 16px | Component padding |
| `space-5` | 20px | Section gaps |
| `space-6` | 24px | Card padding |
| `space-8` | 32px | Section padding |
| `space-10` | 40px | Large gaps |
| `space-12` | 48px | Page sections |

### Tailwind Mapping

```
space-1  = p-1, m-1, gap-1    (4px)
space-2  = p-2, m-2, gap-2    (8px)
space-3  = p-3, m-3, gap-3    (12px)
space-4  = p-4, m-4, gap-4    (16px)
space-5  = p-5, m-5, gap-5    (20px)
space-6  = p-6, m-6, gap-6    (24px)
space-8  = p-8, m-8, gap-8    (32px)
space-10 = p-10, m-10, gap-10 (40px)
space-12 = p-12, m-12, gap-12 (48px)
```

### Spacing Guidelines

- **Card padding:** `p-6` (24px)
- **Card internal gap:** `gap-4` (16px)
- **Form field gap:** `gap-3` (12px)
- **Table cell padding:** `px-4 py-3` (16px horizontal, 12px vertical)
- **Button padding:** `px-4 py-2` (16px horizontal, 8px vertical)
- **Icon + text gap:** `gap-2` (8px)
- **Section margin:** `mb-8` (32px)

---

## Layout Structure

### Application Shell

```
┌──────────────────────────────────────────────────────────────────┐
│                           HEADER (64px)                          │
├────────────┬─────────────────────────────────────────────────────┤
│            │                                                     │
│  SIDEBAR   │                    MAIN CONTENT                     │
│   (240px)  │                                                     │
│            │  ┌───────────────────────────────────────────────┐  │
│  - Orders  │  │              TOP BAR (Filters)                │  │
│  - Models  │  ├───────────────────────────────────────────────┤  │
│  - Schedule│  │                                               │  │
│            │  │              CONTENT AREA                     │  │
│            │  │                                               │  │
│            │  │                                               │  │
│            │  │                                               │  │
│            │  └───────────────────────────────────────────────┘  │
│            │                                                     │
└────────────┴─────────────────────────────────────────────────────┘
```

### Header Specification

- **Height:** 64px
- **Background:** `secondary-bg` (#1A1A1A)
- **Position:** Fixed top
- **Z-index:** 50
- **Content:** Logo (left), User menu (right)
- **Border:** Bottom border `border-b border-border`

```jsx
<header className="fixed top-0 left-0 right-0 z-50 h-16 bg-secondary-bg border-b border-border flex items-center justify-between px-6">
  <img src="/logo.svg" alt="Polhem" className="h-8 w-auto" />
  <div className="flex items-center gap-4">
    {/* User menu */}
  </div>
</header>
```

### Sidebar Specification

- **Width:** 240px (collapsible to 64px on mobile)
- **Background:** `secondary-bg` (#1A1A1A)
- **Position:** Fixed left, below header
- **Border:** Right border `border-r border-border`
- **Padding:** `p-4`

```jsx
<aside className="fixed left-0 top-16 bottom-0 w-60 bg-secondary-bg border-r border-border p-4">
  <nav className="space-y-1">
    {/* Navigation items */}
  </nav>
</aside>
```

### Main Content Area

- **Margin left:** 240px (sidebar width)
- **Margin top:** 64px (header height)
- **Padding:** `p-8` (32px)
- **Background:** `background` (#000000)
- **Max width:** None (full width)

```jsx
<main className="ml-60 mt-16 p-8 min-h-screen bg-background">
  {/* Page content */}
</main>
```

---

## Components

### Navigation Item

```jsx
function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-lg
        text-sm font-medium transition-colors duration-150
        ${active
          ? 'bg-accent text-white'
          : 'text-text-secondary hover:bg-tertiary-bg hover:text-text-primary'
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
```

### Card Component

```jsx
function Card({ title, children, className = '' }) {
  return (
    <div className={`bg-secondary-bg rounded-lg border border-border ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
```

### Button Variants

#### Primary Button (Accent)

```jsx
<button className="
  bg-accent hover:bg-accent-hover
  text-white font-semibold
  px-4 py-2 rounded-md
  transition-colors duration-150
">
  Generate Schedule
</button>
```

#### Secondary Button (Outline)

```jsx
<button className="
  bg-transparent hover:bg-tertiary-bg
  text-text-primary
  border border-border hover:border-text-muted
  px-4 py-2 rounded-md
  transition-colors duration-150
">
  Reset Filters
</button>
```

#### Ghost Button

```jsx
<button className="
  bg-transparent hover:bg-tertiary-bg
  text-text-secondary hover:text-text-primary
  px-4 py-2 rounded-md
  transition-colors duration-150
">
  Cancel
</button>
```

#### Destructive Button

```jsx
<button className="
  bg-error hover:bg-error/90
  text-white font-semibold
  px-4 py-2 rounded-md
  transition-colors duration-150
">
  Delete
</button>
```

### Form Elements

#### Select/Dropdown

```jsx
<div className="space-y-2">
  <label className="text-xs font-medium uppercase tracking-wide text-text-muted">
    Customer
  </label>
  <select className="
    w-full bg-tertiary-bg text-text-primary
    border border-border rounded-md
    px-4 py-2.5 text-sm
    focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent
    transition-colors duration-150
  ">
    <option value="">Select customer...</option>
    <option value="1">Volvo</option>
    <option value="2">Scania</option>
  </select>
</div>
```

#### Input Field

```jsx
<div className="space-y-2">
  <label className="text-xs font-medium uppercase tracking-wide text-text-muted">
    Parameter Value
  </label>
  <input
    type="text"
    className="
      w-full bg-tertiary-bg text-text-primary
      border border-border rounded-md
      px-4 py-2.5 text-sm
      placeholder:text-text-muted
      focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent
      transition-colors duration-150
    "
    placeholder="Enter value..."
  />
</div>
```

#### Slider

```jsx
<div className="space-y-2">
  <div className="flex justify-between items-center">
    <label className="text-xs font-medium uppercase tracking-wide text-text-muted">
      Error Threshold
    </label>
    <span className="text-sm text-text-primary font-semibold">25%</span>
  </div>
  <input
    type="range"
    min="0"
    max="100"
    className="
      w-full h-2 bg-tertiary-bg rounded-full appearance-none
      [&::-webkit-slider-thumb]:appearance-none
      [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
      [&::-webkit-slider-thumb]:rounded-full
      [&::-webkit-slider-thumb]:bg-accent
      [&::-webkit-slider-thumb]:cursor-pointer
    "
  />
</div>
```

### Data Table

```jsx
<div className="bg-secondary-bg rounded-lg border border-border overflow-hidden">
  <table className="w-full">
    <thead>
      <tr className="border-b border-border bg-tertiary-bg">
        <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-text-secondary">
          Customer
        </th>
        <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-text-secondary">
          Product
        </th>
        <th className="px-4 py-3 text-right text-sm font-semibold uppercase tracking-wide text-text-secondary">
          Quantity
        </th>
        <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-text-secondary">
          Status
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-border">
      <tr className="hover:bg-tertiary-bg transition-colors duration-100">
        <td className="px-4 py-3 text-sm text-text-primary">Volvo</td>
        <td className="px-4 py-3 text-sm text-text-secondary">Product A</td>
        <td className="px-4 py-3 text-sm text-text-primary text-right font-mono">10,000</td>
        <td className="px-4 py-3">
          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-success/20 text-success">
            Confirmed
          </span>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Status Badges

```jsx
{/* Confirmed/Real Order */}
<span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-success/20 text-success">
  Confirmed
</span>

{/* Predicted Order */}
<span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-warning/20 text-warning">
  Predicted
</span>

{/* Unreliable Prediction */}
<span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-error/20 text-error">
  Unreliable
</span>

{/* Active */}
<span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-info/20 text-info">
  Active
</span>
```

### Tooltip

```jsx
<div className="relative group">
  <button className="text-text-muted hover:text-text-secondary">
    {/* Info icon or element */}
  </button>
  <div className="
    absolute z-50 invisible group-hover:visible
    bg-secondary-bg border border-border rounded-md
    px-3 py-2 text-sm text-text-secondary
    shadow-lg whitespace-nowrap
    bottom-full left-1/2 -translate-x-1/2 mb-2
  ">
    Tooltip content
    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-secondary-bg" />
  </div>
</div>
```

### Modal/Dialog

```jsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

  {/* Modal */}
  <div className="relative bg-secondary-bg rounded-lg border border-border shadow-xl w-full max-w-md mx-4">
    {/* Header */}
    <div className="px-6 py-4 border-b border-border">
      <h2 className="text-lg font-semibold text-text-primary">Modal Title</h2>
    </div>

    {/* Content */}
    <div className="p-6">
      {/* Modal content */}
    </div>

    {/* Footer */}
    <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
      <button className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors">
        Cancel
      </button>
      <button className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-md transition-colors">
        Confirm
      </button>
    </div>
  </div>
</div>
```

---

## Timeline Components

### Order Timeline (Horizontal)

For the Orders tab timeline visualization:

```jsx
<div className="relative">
  {/* Timeline axis */}
  <div className="flex items-end gap-1 overflow-x-auto pb-4">
    {weeks.map((week, index) => (
      <div key={week} className="flex flex-col items-center min-w-[80px]">
        {/* Order block */}
        <div className={`
          w-16 rounded-t-md transition-all duration-200
          ${order.type === 'real'
            ? 'bg-success'
            : order.isReliable
              ? 'bg-warning'
              : 'bg-error/50'
          }
        `}
        style={{ height: `${(order.quantity / maxQuantity) * 200}px` }}
        >
          {/* Tooltip on hover */}
        </div>

        {/* Week label */}
        <span className="mt-2 text-xs text-text-muted">W{week}</span>
      </div>
    ))}
  </div>

  {/* Timeline line */}
  <div className="absolute bottom-4 left-0 right-0 h-px bg-border" />
</div>
```

### Error Band Visualization

For showing prediction uncertainty:

```jsx
<div className="relative h-40">
  {/* Error band (semi-transparent) */}
  <div
    className="absolute bg-warning/20 rounded"
    style={{
      bottom: `${lowerBound}%`,
      height: `${upperBound - lowerBound}%`,
      left: '0',
      right: '0'
    }}
  />

  {/* Baseline prediction line */}
  <div
    className="absolute left-0 right-0 h-0.5 bg-warning"
    style={{ bottom: `${baseline}%` }}
  />
</div>
```

---

## Machine Schedule Components

### Schedule Block (Gantt-style)

```jsx
function ScheduleBlock({ block, onClick }) {
  return (
    <div
      onClick={() => onClick(block)}
      className={`
        absolute rounded cursor-pointer
        transition-all duration-150
        hover:brightness-110 hover:shadow-lg
        ${block.isConfirmed ? 'bg-success' : 'bg-warning'}
      `}
      style={{
        left: `${block.startPercent}%`,
        width: `${block.widthPercent}%`,
        height: '40px',
        top: '4px'
      }}
    >
      <div className="px-2 py-1 truncate">
        <span className="text-xs font-semibold text-white">{block.productName}</span>
        <span className="text-xs text-white/80 ml-1">{block.customerName}</span>
      </div>
    </div>
  )
}
```

### Machine Row

```jsx
function MachineRow({ machine, blocks, timeRange }) {
  return (
    <div className="flex items-stretch border-b border-border">
      {/* Machine label */}
      <div className="w-32 flex-shrink-0 px-4 py-3 bg-secondary-bg border-r border-border">
        <div className="text-sm font-semibold text-text-primary">{machine.name}</div>
        <div className="text-xs text-text-muted">OEE: {machine.oee}%</div>
      </div>

      {/* Timeline area */}
      <div className="flex-1 relative h-12 bg-tertiary-bg/30">
        {blocks.map(block => (
          <ScheduleBlock key={block.id} block={block} />
        ))}
      </div>
    </div>
  )
}
```

### OEE Indicator

```jsx
function OEEIndicator({ value, size = 'default' }) {
  const getColor = (v) => {
    if (v >= 85) return 'text-success';
    if (v >= 60) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className={`
      ${size === 'large' ? 'text-3xl' : 'text-lg'}
      font-bold font-mono
      ${getColor(value)}
    `}>
      {value.toFixed(1)}%
    </div>
  )
}
```

---

## Animations & Transitions

### Standard Transitions

```css
/* All interactive elements */
transition-colors duration-150

/* Cards and elevated elements */
transition-all duration-200

/* Modal/overlay appearance */
transition-opacity duration-200

/* Slide animations */
transition-transform duration-300
```

### Hover Effects

```jsx
{/* Cards */}
className="transition-all duration-200 hover:border-border-light hover:shadow-lg"

{/* Table rows */}
className="hover:bg-tertiary-bg transition-colors duration-100"

{/* Buttons */}
className="hover:brightness-110 transition-all duration-150"

{/* Links */}
className="hover:text-accent transition-colors duration-150"
```

### Loading States

```jsx
{/* Skeleton loader */}
<div className="animate-pulse">
  <div className="h-4 bg-tertiary-bg rounded w-3/4 mb-2" />
  <div className="h-4 bg-tertiary-bg rounded w-1/2" />
</div>

{/* Spinner */}
<div className="w-5 h-5 border-2 border-text-muted border-t-accent rounded-full animate-spin" />
```

---

## Responsive Breakpoints

```css
/* Mobile: < 640px (default) */
/* Tablet: >= 640px (sm:) */
/* Desktop: >= 1024px (lg:) */
/* Large Desktop: >= 1280px (xl:) */
```

### Responsive Patterns

```jsx
{/* Sidebar - Hidden on mobile, visible on desktop */}
<aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-60 ...">

{/* Mobile navigation - Bottom bar on mobile */}
<nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-secondary-bg border-t border-border">

{/* Grid layouts */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

{/* Content padding */}
<main className="p-4 lg:p-8">
```

---

## Accessibility

### Focus States

```css
/* All focusable elements */
focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background

/* Alternative for inputs */
focus:border-accent focus:ring-1 focus:ring-accent
```

### Color Contrast Requirements

| Combination | Ratio | WCAG Level |
|-------------|-------|------------|
| text-primary on background | 21:1 | AAA |
| text-secondary on background | 9.1:1 | AAA |
| text-primary on secondary-bg | 15.3:1 | AAA |
| accent on background | 4.5:1 | AA |
| success on background | 5.7:1 | AA |
| warning on background | 4.6:1 | AA |

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Tab order should follow visual flow
- Custom components need `role` and `aria-*` attributes
- Schedule blocks support keyboard drag & drop (Arrow keys + Enter)

---

## Icon Guidelines

### Icon Library

Use Lucide React icons (already installed with shadcn/ui).

**Allowed icons (functional only):**
- Navigation: `ChevronDown`, `ChevronRight`, `Menu`, `X`
- Actions: `Plus`, `Trash2`, `Edit`, `Download`, `Upload`
- Status: `Check`, `AlertTriangle`, `Info`, `AlertCircle`
- UI: `Search`, `Filter`, `Settings`, `Calendar`

**Icon Sizing:**
- Inline with text: `w-4 h-4` (16px)
- Navigation: `w-5 h-5` (20px)
- Feature icons: `w-6 h-6` (24px)

**Icon Styling:**
```jsx
import { ChevronDown, Check, AlertTriangle } from 'lucide-react'

{/* Default icon */}
<ChevronDown className="w-4 h-4 text-text-muted" />

{/* Success icon */}
<Check className="w-4 h-4 text-success" />

{/* Warning icon */}
<AlertTriangle className="w-4 h-4 text-warning" />
```

---

## Tab-Specific Guidelines

### Orders Tab

- Primary view: Timeline visualization per customer+product
- Dropdowns for customer/product selection at top
- Timeline shows weeks as minimum unit
- Real orders: Green bars/blocks
- Predicted orders: Orange bars with error band
- Unreliable predictions: Faded red, excluded visual indicator
- Aggregated summaries: Monthly/yearly totals in card below timeline
- Customer forecast comparison: Separate card showing forecast vs actual/predicted

### Models/Settings Tab

- Card-based layout for each model/parameter set
- Table or list view of parameters within each model
- Editable fields for user-configurable parameters
- Read-only styling for system parameters
- Active settings indicator (badge or highlight)
- Quick-switch between settings presets

### Schedule Tab

- Full-width timeline view (Gantt-style)
- Toggle between "Per Machine" and "Per Customer+Product" views
- Filter bar at top: Time range, machines, customers, products
- Machine rows on left (or customer+product rows)
- Timeline blocks are draggable
- OEE displayed per machine (left column) and globally (top-right)
- Conflicts/overlaps: Red border or warning indicator
- Click block opens detail panel/modal

---

## Design Checklist

Before shipping any component:

- [ ] Uses colors from defined palette only
- [ ] Typography follows type scale
- [ ] Spacing follows 4px grid
- [ ] All interactive elements have hover states
- [ ] Focus states are visible and accessible
- [ ] Component works at all breakpoints
- [ ] Color contrast meets WCAG AA minimum
- [ ] Loading states are implemented
- [ ] Error states are designed
- [ ] Empty states are designed

---

**Design System Version:** 1.0
**Last Updated:** 2026-01-12
**Application:** Polhem Demo (demo.polhem.net)
**Theme:** Dark only
