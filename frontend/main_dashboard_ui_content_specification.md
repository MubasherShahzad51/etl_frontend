# Main Dashboard – UI Content Specification

This document defines **what information appears on the MAIN DASHBOARD page** of the Adcertify Automotive Market Intelligence Platform **as implemented in this repo today**, plus what remains as future scope.

Design principles:
- Laptop-first (dense layout)
- Minimal font sizes
- No empty space
- Data-dense, decision-focused
- Metrics + insights + comparisons on one screen

Layout/fit rule (implemented):
- The dashboard uses a single-viewport layout with internal scroll areas for dense tables and panels.
- The page itself does not scroll; sections are sized to fit within the viewport.

---

## 1. Top Header (Thin, Always Visible)

**Purpose:** Global navigation and fast access

- **Logo (Left):**
  - Brand shown in the global nav header (TopNav): **Adcertify**

- **Global Search Bar (Center):**
  - Placeholder: `Search dealer, ZIP, model, report…`
  - Supports:
    - Dealer name
    - ZIP code
    - Make / Model
  - Note: In the current implementation this is a UI-only input (no backend search wired yet).

- **Top-right Actions (Right):**
  - Notifications + profile menu (UI-only).
  - No dealer selector lives in the TopNav.

**Dashboard-specific controls (not in TopNav):**
- **Territory Filters panel (left column):** Scope + State + Time Range
  - Scope: State | USA
  - Time Range: 30d / 3m / 6m / YoY (default: 30d)

Implementation notes:
- Location: `src/components/layout/TopNav.jsx` (brand + global search)
- Location: `src/pages/Dashboard.jsx` (Territory Filters)

---

## 2. KPI Summary Strip (One Row, Small Cards)

**Purpose:** Immediate market status (numbers first, visuals second)

The current implementation shows **5 compact KPI tiles**:

- **Total Dealers** (count)
- **Total Sales** (aggregate)
- **Active Inventory** (aggregate)
- **Inventory-to-Sales** (ratio + badge)
- **Avg Sales / Dealer**

Status / future scope:
- Pump-In / Pump-Out are specified in the desired template, but are not implemented yet.

---

## 3. Left Column – Insights & Tasks

Current layout includes these blocks:
- Territory Filters panel
- Market Concentration
- Top Trends
- Market Highlights

### 3.1 Top Trends (High Priority – Instructor Requirement)

**Title:** Top Selling Insights (Based on Filters)

Show **3–5 compact rows**.

Each row:
- Small text
- Arrow or tiny bar indicator

Current status:
- Implemented as a compact **table of top makes** with MoM / QoQ / YoY signals.
- Updates based on Scope + State + Time Range (mock-derived).

---

### 3.2 Market Highlights

**Purpose:** Quick market signals based on current filters.

Current status:
- Shows top opportunity state + score
- Inventory pressure (ratio + badge)
- Top segment + share
- Market concentration
- Avg sales / dealer

---

## 4. Center Section – Core Visual Area

Current center column blocks:
- Top Selling Models (table)
- Top Market Leaders (table, includes sales velocity)
- Fastest Rising Dealers (table)
- Top States by Opportunity (table)

### 4.1 Territory / Market Map (Future Scope)

**Purpose:** Competitor discovery & territory awareness

- Dealer map with:
  - Current dealer (highlighted)
  - Competitor locations
  - **25-mile radius circle**

- Controls:
  - Map / Satellite toggle

- Legend:
  - Your dealership
  - Top competitor
  - Other competitors

Current status:
- A competitor map component exists in the codebase (`src/components/maps/CompetitorMap.jsx`), but is not used on the Market Dashboard.

---

### 4.2 Compact Analytics Charts (Small, Supporting Role)

Current status:
- The dashboard intentionally avoids large charts.
- Deep-dive charting is routed through **Reports**.

> Charts must support numbers, not replace them.

---

## 5. Right Column – Assistance & Context

### 5.1 Assistant (Compact Search)

- Title: **How may I help you?**
- Search input with `Ask` action button
- UI-only (no AI backend wired yet)

---

## 6. Bottom Section

- No separate bottom section is rendered on the dashboard.

---

## 7. Global Filter Behavior

All dashboard sections update dynamically based on:
- Scope (State | USA)
- State (when Scope = State)
- Time range (30d / 3m / 6m / YoY)

---

## 8. Design & UX Rules (Mandatory)

- Small, consistent font sizes
- No empty whitespace
- No oversized charts
- Neutral color palette (blue, gray, soft green/red)
- Dense but readable layout
- Optimized for laptop screens

Notes on current implementation:
- KPI strip and right-side assistant card were resized to stay compact.
- Dashboard avoids large empty areas by adding dense content blocks.
- Market Highlights and Share & Momentum render multiple rows (when available) to reduce unused vertical space:
  - Market Highlights typically shows up to 4 “Demand gaining” + 4 “Caution signals” rows.
  - Share & Momentum shows up to 5 brands in “Brand share” and up to 3 items each in “Rising” and “At risk”.
- The center analytics area is configured to stretch vertically (flex/grid `min-h-0` / `flex-1`) so it can use available height instead of leaving blank space.
- The app is wrapped in an Error Boundary to surface runtime/render errors as an on-page message instead of a blank screen.

---

## One-Line Purpose of the Dashboard

> Provide a fast, complete view of the market—what is selling, where opportunity exists, and the overall market health—all on a single screen.

---

# How to Run (Local)

Requirements:
- Node.js (18+ recommended)
- npm

Commands:
1. From the `frontend/` directory, install deps: `npm install`
2. Start dev server: `npm run dev`
3. Open the printed local URL (Vite will choose a free port if 5173 is busy, e.g. `http://localhost:5174/` or `http://localhost:5175/`)

Optional (port control):
- Force a port: `VITE_PORT=5173 npm run dev`
- Use strict ports:
  - `npm run dev:5173`
  - `npm run dev:5174`

# How to Use (Mock Mode)

- Use **Territory Filters** to switch Scope (USA/State/Dealer) and time range.
- When Scope = Dealer, use the **Dealer selector** in the hero to switch between mock dealers.
- When Scope = Dealer, change **Radius** to see the competitor set shrink/expand (distance filter).
- Observe these update when switching dealers:
  - KPI tiles (Total Sales / Growth / Active Dealers / Top Make)
  - Competitor Comparison chart (Dealer scope)
  - Dealer Health Score metrics (Dealer scope)
  - Dealer Snapshot counts (Dealer scope)
  - Top Trends + Market Direction + Recommendations (market signals)

# How to Connect Real Data (Future)

When backend endpoints are ready, replace mock objects in `src/pages/Dashboard.jsx` with API calls via services in `src/services/*` and/or hooks in `src/hooks/*`.

Minimum real API data needed to fully replace mock mode:
- Dealer details (name/city/state/zip)
- Competitor list with distance + market share
- Sales trend (time series)
- Make/model distribution
- Pump-in / pump-out (optional but recommended per spec)
- Dealer performance metrics (pricing/inventory/satisfaction/response time)

