# 15. Verification - Testing & QA Checklist

This document provides a comprehensive testing checklist for the Polhem MVP demo application. Complete all checks before considering the application production-ready.

---

## Pre-Testing Setup

Before running tests:

1. Ensure the application is running (`npm run dev` or deployed)
2. Have access to Supabase dashboard for data verification
3. Have a test user account in Clerk
4. Open browser developer tools (F12) for monitoring network requests

---

## 1. Authentication Flow

### 1.1 Sign In

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| Redirect to sign-in | Visit `/dashboard` without auth | Redirects to `/sign-in` | [ ] |
| Sign-in page loads | Visit `/sign-in` | Clerk sign-in component renders | [ ] |
| Email sign-in | Enter valid email/password | Successfully authenticates | [ ] |
| Invalid credentials | Enter wrong password | Shows error message | [ ] |
| Post-sign-in redirect | Complete sign-in | Redirects to `/dashboard` | [ ] |

### 1.2 Sign Up

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| Sign-up page loads | Visit `/sign-up` | Clerk sign-up component renders | [ ] |
| Create account | Enter new email/password | Account created successfully | [ ] |
| Post-sign-up redirect | Complete sign-up | Redirects to `/dashboard` | [ ] |

### 1.3 Sign Out

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| Sign out button | Click user menu > Sign out | Signs out and redirects | [ ] |
| Protected routes | Visit `/dashboard` after sign-out | Redirects to `/sign-in` | [ ] |

### 1.4 Session Persistence

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| Page refresh | Refresh dashboard page | Stays authenticated | [ ] |
| New tab | Open dashboard in new tab | Stays authenticated | [ ] |

---

## 2. Dashboard Page

### 2.1 Page Load

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| Dashboard renders | Navigate to `/dashboard` | Page loads without errors | [ ] |
| Loading state | Observe initial load | Shows loading spinner | [ ] |
| Data loads | Wait for data fetch | Stats cards populate | [ ] |

### 2.2 Stats Cards

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| Active orders count | Check "Active Orders" card | Shows correct count from DB | [ ] |
| Machines count | Check "Machines" card | Shows total machine count | [ ] |
| Products count | Check "Products" card | Shows total product count | [ ] |
| OEE display | Check "Current OEE" card | Shows percentage (0-100%) | [ ] |

### 2.3 Quick Actions

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| View Schedule link | Click "View Schedule" | Navigates to `/schedule` | [ ] |
| View Orders link | Click "View Orders" | Navigates to `/orders` | [ ] |

---

## 3. Orders Page

### 3.1 Page Load

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| Orders page renders | Navigate to `/orders` | Page loads without errors | [ ] |
| Orders list loads | Wait for data | Orders table/timeline populates | [ ] |

### 3.2 Order Display

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| Real orders shown | Check order list | Confirmed orders display | [ ] |
| Predicted orders shown | Check order list | Predicted orders display differently | [ ] |
| Order details | Click on an order | Shows order details modal | [ ] |

### 3.3 Order CRUD Operations

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| Create order | Click "Add Order" > Fill form > Save | New order appears in list | [ ] |
| Edit order | Click order > Edit > Change quantity > Save | Order updates | [ ] |
| Delete order | Click order > Delete > Confirm | Order removed from list | [ ] |

### 3.4 Filtering

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| Filter by customer | Select customer from dropdown | Only that customer's orders shown | [ ] |
| Filter by product | Select product from dropdown | Only that product's orders shown | [ ] |
| Clear filters | Clear all filters | All orders shown | [ ] |

---

## 4. Settings Page

### 4.1 Tab Navigation

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| Settings page renders | Navigate to `/settings` | Page loads with tabs | [ ] |
| Customers tab | Click "Customers" tab | Customer list displays | [ ] |
| Materials tab | Click "Materials" tab | Materials list displays | [ ] |
| Machines tab | Click "Machines" tab | Machines list displays | [ ] |
| Products tab | Click "Products" tab | Products list displays | [ ] |
| Predicted Orders tab | Click "Predicted Orders" tab | Predicted orders list displays | [ ] |

### 4.2 Customers

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| List customers | View Customers tab | All customers shown | [ ] |
| Edit customer | Click Edit > Change name > Save | Customer updates | [ ] |
| Validation | Try saving empty name | Shows validation error | [ ] |

### 4.3 Materials

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| List materials | View Materials tab | All materials shown with type/color | [ ] |
| Edit material | Click Edit > Change cost > Save | Material updates | [ ] |
| Cost format | Check cost display | Shows currency format | [ ] |

### 4.4 Machines

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| List machines | View Machines tab | All machines shown with specs | [ ] |
| Edit machine | Click Edit > Change tonnage > Save | Machine updates | [ ] |
| Compatible materials | Check machine details | Shows material compatibility | [ ] |

### 4.5 Products

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| List products | View Products tab | All products shown | [ ] |
| Edit product | Click Edit > Change cycle time > Save | Product updates | [ ] |
| Product relationships | Check product details | Shows customer, material, compatible machines | [ ] |

### 4.6 Predicted Orders

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| List predicted orders | View Predicted Orders tab | All predictions shown | [ ] |
| Edit prediction | Click Edit > Change quantity > Save | Prediction updates | [ ] |
| Date display | Check date column | Dates formatted correctly | [ ] |

---

## 5. Schedule Page

### 5.1 Page Load

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| Schedule page renders | Navigate to `/schedule` | Page loads without errors | [ ] |
| Gantt chart renders | Wait for load | Gantt chart structure appears | [ ] |
| Machines as rows | Check Y-axis | All machines listed | [ ] |

### 5.2 Date Range Selection

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| Date picker opens | Click date range picker | Calendar opens | [ ] |
| Select start date | Click a start date | Date selected | [ ] |
| Select end date | Click an end date | Range selected | [ ] |
| Apply range | Confirm selection | Gantt updates to show range | [ ] |

### 5.3 Schedule Generation

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| Generate button visible | Check page | "Generate Schedule" button present | [ ] |
| Generate schedule | Click "Generate Schedule" | Production blocks created | [ ] |
| Blocks appear | After generation | Blocks visible on Gantt | [ ] |
| Machine assignment | Check blocks | Assigned to compatible machines | [ ] |
| No overlaps | Check same product blocks | Never overlap in time | [ ] |

### 5.4 Block Display

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| Block colors | View Gantt | Different products have different colors | [ ] |
| Block sizing | View blocks | Width represents duration | [ ] |
| Block tooltip | Hover over block | Shows product/order info | [ ] |

### 5.5 Day Cell Click (Hourly Modal)

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| Click empty day | Click on empty day cell | Hourly modal opens | [ ] |
| Hourly breakdown | Check modal | Shows 24-hour breakdown | [ ] |
| Short blocks visible | Check modal | Blocks < 16 hours visible in hours | [ ] |
| Close modal | Click outside or X | Modal closes | [ ] |

### 5.6 Block Click (Edit Modal)

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| Click block | Click on a production block | Edit modal opens | [ ] |
| Block info shown | Check modal | Shows product, order, machine | [ ] |
| Machine dropdown | Open machine dropdown | Shows compatible machines only | [ ] |
| Change machine | Select different machine > Save | Block moves to new machine | [ ] |
| Edit start time | Change start datetime > Save | Block position updates | [ ] |
| Edit end time | Change end datetime > Save | Block duration updates | [ ] |

### 5.7 Drag and Drop

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| Drag block | Click and drag a block | Block follows cursor | [ ] |
| Drop on compatible machine | Drop on valid machine row | Block moves to new machine | [ ] |
| Drop on incompatible machine | Drag over incompatible row | Row shows greyed/disabled | [ ] |
| Reject incompatible drop | Try to drop on incompatible | Block returns to original position | [ ] |
| Time shift on drop | Drop at different position | Block time updates | [ ] |

### 5.8 Manual Edit Tracking

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| Make manual edit | Drag or edit a block | Edit saves to database | [ ] |
| has_manual_edits flag | Check database after edit | `schedule_metrics.has_manual_edits = true` | [ ] |
| Warning on regenerate | Click "Generate Schedule" after edit | Shows warning about losing edits | [ ] |
| Confirm regenerate | Accept warning | Schedule regenerates, flag resets | [ ] |

### 5.9 OEE Display

| Test | Steps | Expected Result | Pass |
|------|-------|-----------------|------|
| OEE shown | Check schedule page | OEE percentage displayed | [ ] |
| OEE updates | After schedule change | OEE recalculates | [ ] |
| OEE per machine | Check detail view | Per-machine OEE shown | [ ] |

---

## 6. API Routes

### 6.1 GET Endpoints

Test each endpoint returns data:

| Endpoint | Expected | Pass |
|----------|----------|------|
| `GET /api/customers` | Array of customers | [ ] |
| `GET /api/materials` | Array of materials | [ ] |
| `GET /api/machines` | Array of machines | [ ] |
| `GET /api/products` | Array of products | [ ] |
| `GET /api/orders` | Array of orders | [ ] |
| `GET /api/predicted-orders` | Array of predicted orders | [ ] |
| `GET /api/production-blocks` | Array of blocks | [ ] |
| `GET /api/settings` | Settings object | [ ] |
| `GET /api/health` | Health status | [ ] |

### 6.2 POST Endpoints

| Endpoint | Test | Expected | Pass |
|----------|------|----------|------|
| `POST /api/orders` | Create order with valid data | Returns new order | [ ] |
| `POST /api/orders` | Create with missing fields | Returns 400 error | [ ] |
| `POST /api/production-blocks` | Create block with valid data | Returns new block | [ ] |
| `POST /api/production-blocks/generate` | Generate schedule | Returns generated blocks | [ ] |

### 6.3 PUT Endpoints

| Endpoint | Test | Expected | Pass |
|----------|------|----------|------|
| `PUT /api/customers` | Update customer | Returns updated customer | [ ] |
| `PUT /api/materials` | Update material | Returns updated material | [ ] |
| `PUT /api/machines` | Update machine | Returns updated machine | [ ] |
| `PUT /api/products` | Update product | Returns updated product | [ ] |
| `PUT /api/orders` | Update order | Returns updated order | [ ] |
| `PUT /api/predicted-orders` | Update prediction | Returns updated prediction | [ ] |
| `PUT /api/production-blocks` | Update block | Returns updated block | [ ] |
| `PUT /api/settings` | Update settings | Returns updated settings | [ ] |

### 6.4 DELETE Endpoints

| Endpoint | Test | Expected | Pass |
|----------|------|----------|------|
| `DELETE /api/orders` | Delete order | Returns success | [ ] |
| `DELETE /api/production-blocks` | Delete block | Returns success | [ ] |

### 6.5 Error Handling

| Test | Expected | Pass |
|------|----------|------|
| Invalid ID format | Returns 400 with message | [ ] |
| Non-existent ID | Returns 404 | [ ] |
| Missing required fields | Returns 400 with validation errors | [ ] |
| Unauthenticated request | Returns 401 | [ ] |

---

## 7. Database Verification

### 7.1 Seed Data Integrity

Verify in Supabase:

| Table | Check | Pass |
|-------|-------|------|
| `customers` | Has 4 customers | [ ] |
| `materials` | Has 5 materials | [ ] |
| `machines` | Has 10 machines | [ ] |
| `products` | Has ~16 products linked correctly | [ ] |
| `orders` | Has confirmed orders | [ ] |
| `predicted_orders` | Has predicted orders | [ ] |
| `settings` | Has 1 row with id='main' | [ ] |

### 7.2 Relationship Integrity

| Check | Query | Pass |
|-------|-------|------|
| Products have valid customers | All `customer_id` exist in customers | [ ] |
| Products have valid materials | All `material_id` exist in materials | [ ] |
| Orders have valid products | All `product_id` exist in products | [ ] |
| Production blocks have valid orders | All `order_id` exist in orders | [ ] |
| Production blocks have valid machines | All `machine_id` exist in machines | [ ] |

### 7.3 Data Consistency

```sql
-- Check for orphaned records
SELECT * FROM orders WHERE product_id NOT IN (SELECT id FROM products);
SELECT * FROM production_blocks WHERE machine_id NOT IN (SELECT id FROM machines);

-- Check for duplicate production blocks
SELECT order_id, machine_id, start_time, COUNT(*) 
FROM production_blocks 
GROUP BY order_id, machine_id, start_time 
HAVING COUNT(*) > 1;

-- Check for overlapping blocks on same machine
-- (This would be a more complex query)
```

---

## 8. UI/UX Verification

### 8.1 Responsive Design

| Viewport | Test | Pass |
|----------|------|------|
| Desktop (1920x1080) | All pages render correctly | [ ] |
| Laptop (1366x768) | All pages render correctly | [ ] |
| Tablet (768x1024) | Layout adapts, usable | [ ] |
| Mobile (375x667) | Sidebar collapses, content accessible | [ ] |

### 8.2 Loading States

| Page | Loading indicator shown | Pass |
|------|------------------------|------|
| Dashboard | [ ] |
| Orders | [ ] |
| Settings | [ ] |
| Schedule | [ ] |

### 8.3 Empty States

| Scenario | Empty state message shown | Pass |
|----------|--------------------------|------|
| No orders | [ ] |
| No production blocks | [ ] |
| No search results | [ ] |

### 8.4 Error States

| Scenario | Error message shown | Pass |
|----------|---------------------|------|
| API failure | Toast/alert shown | [ ] |
| Form validation error | Field-level error shown | [ ] |
| Network error | Appropriate message | [ ] |

### 8.5 Accessibility

| Check | Pass |
|-------|------|
| Keyboard navigation works | [ ] |
| Focus indicators visible | [ ] |
| Form labels present | [ ] |
| Buttons have accessible names | [ ] |
| Color contrast adequate | [ ] |

---

## 9. Performance

### 9.1 Page Load Times

| Page | Target | Actual | Pass |
|------|--------|--------|------|
| Dashboard | < 2s | ___ s | [ ] |
| Orders | < 2s | ___ s | [ ] |
| Settings | < 2s | ___ s | [ ] |
| Schedule | < 3s | ___ s | [ ] |

### 9.2 API Response Times

| Endpoint | Target | Actual | Pass |
|----------|--------|--------|------|
| GET /api/orders | < 500ms | ___ ms | [ ] |
| GET /api/production-blocks | < 500ms | ___ ms | [ ] |
| POST /api/production-blocks/generate | < 5s | ___ s | [ ] |

### 9.3 Bundle Size

```bash
npm run build
# Check .next/analyze (if bundle analyzer installed)
```

| Metric | Target | Actual | Pass |
|--------|--------|--------|------|
| First Load JS | < 200KB | ___ KB | [ ] |
| Largest Page JS | < 300KB | ___ KB | [ ] |

---

## 10. Security

### 10.1 Authentication

| Check | Pass |
|-------|------|
| API routes require authentication | [ ] |
| Clerk middleware configured correctly | [ ] |
| No API keys exposed in client code | [ ] |

### 10.2 Data Security

| Check | Pass |
|-------|------|
| SUPABASE_SECRET not in client bundle | [ ] |
| CLERK_SECRET_KEY not in client bundle | [ ] |
| HTTPS enforced in production | [ ] |

### 10.3 Input Validation

| Check | Pass |
|-------|------|
| SQL injection prevented (parameterized queries) | [ ] |
| XSS prevented (React auto-escaping) | [ ] |
| Form inputs validated server-side | [ ] |

---

## 11. Browser Compatibility

Test in multiple browsers:

| Browser | Version | Basic Functionality | Pass |
|---------|---------|---------------------|------|
| Chrome | Latest | [ ] | [ ] |
| Firefox | Latest | [ ] | [ ] |
| Safari | Latest | [ ] | [ ] |
| Edge | Latest | [ ] | [ ] |

---

## 12. Final Checklist

### 12.1 Core Functionality

- [ ] User can sign in and sign out
- [ ] Dashboard shows accurate statistics
- [ ] Orders page displays and edits orders
- [ ] Settings page manages all entities
- [ ] Schedule page generates and displays schedule
- [ ] Drag-drop moves blocks between machines
- [ ] OEE calculates correctly

### 12.2 Data Integrity

- [ ] All seed data present
- [ ] CRUD operations persist correctly
- [ ] Schedule generation creates valid blocks
- [ ] No duplicate or orphaned records

### 12.3 Production Readiness

- [ ] No console errors in production
- [ ] All environment variables set
- [ ] Health check endpoint responding
- [ ] SSL certificate valid
- [ ] Custom domain working (if configured)

---

## Test Results Summary

| Category | Passed | Failed | Total |
|----------|--------|--------|-------|
| Authentication | | | |
| Dashboard | | | |
| Orders | | | |
| Settings | | | |
| Schedule | | | |
| API Routes | | | |
| Database | | | |
| UI/UX | | | |
| Performance | | | |
| Security | | | |
| **TOTAL** | | | |

---

## Known Issues / Notes

Document any issues found during testing:

1. _Issue description_ - _Severity_ - _Status_
2. ...

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Tester | | | |
| Product Owner | | | |
