# Lead Dashboard — Project Documentation

This document explains how the lead performance dashboard works: where data comes from, how metrics are calculated, and what each chart and card shows.

---

## Table of contents

1. [Project overview](#1-project-overview)
2. [Architecture & data flow](#2-architecture--data-flow)
3. [Data model](#3-data-model)
4. [Loading data (Google Sheets)](#4-loading-data-google-sheets)
5. [Core formulas & terminology](#5-core-formulas--terminology)
6. [Dashboard layout](#6-dashboard-layout)
7. [Overview section](#7-overview-section)
8. [Forecast section](#8-forecast-section)
9. [Lead Performance section](#9-lead-performance-section)
10. [Hire Rates section](#10-hire-rates-section)
11. [Cost & Spend section](#11-cost--spend-section)
12. [Source Analysis section](#12-source-analysis-section)
13. [AI forecast explanations](#13-ai-forecast-explanations)
14. [Static vs live data](#14-static-vs-live-data)
15. [Environment variables](#15-environment-variables)
16. [File reference](#16-file-reference)

---

## 1. Project overview

**Lead Dashboard** is a Next.js app that visualizes monthly recruiting performance: lead volume, hires by source stream, hire rates, ad spend, and cost per hire (CPH). It is built with:

- **Next.js 16** (App Router, server components for data fetch)
- **React 19** + **Chart.js** / **react-chartjs-2** for charts
- **Google Sheets** as the live data source (optional)
- **OpenAI** (optional) for forecast narrative explanations

Main entry points:

| Route | File | Purpose |
|-------|------|---------|
| `/` | `src/app/page.tsx` | Main dashboard |
| `/dashboard/leads` | `src/app/dashboard/leads/page.tsx` | Same dashboard (alternate route) |
| `/api/forecast-explain` | `src/app/api/forecast-explain/route.ts` | GPT explanations for forecast rows |

---

## 2. Architecture & data flow

```
Google Sheet (or MOCK_DATA)
        │
        ▼
fetchLeadsData()          ← server-side, on page load
        │
        ▼
LeadsDataRow[]            ← one object per month
        │
        ▼
DashboardContent          ← client shell with sidebar sections
        │
        ├── KPI cards
        ├── Charts (Chart.js)
        └── ForecastCard  → POST /api/forecast-explain (optional AI)
```

1. **Server**: `fetchLeadsData()` runs when the page loads and returns `{ data, error? }`.
2. **Client**: `DashboardContent` receives `data` and passes it to each chart/card as props.
3. **Exception**: `HireRateBySourceChart` uses **built-in static data** and does not receive sheet data.

If the sheet fetch fails but `LEADS_SHEET_ID` is set, the app still renders using `MOCK_DATA` and surfaces the error only if you hit Retry (the page shows data with a fallback).

---

## 3. Data model

Defined in `src/types/leads.ts`:

| Field | Type | Meaning |
|-------|------|---------|
| `month` | string | Display label, e.g. `"Jan 2026"` |
| `leads` | number | Total leads received that month |
| `hired` | number | Total drivers hired (all streams) |
| `hired_by_leads` | number | Hires attributed to the **Leads** pipeline |
| `hired_by_leadbase` | number | Hires from **Lead Base** (existing database) |
| `hired_by_referral` | number | Hires from **Referral** |
| `hire_rate_pct` | number | Overall hire rate % (see formula below) |
| `ad_spend_usd` | number | Ad spend in USD for the month |
| `high_band` | number | Derived lead-volume high target (sheet mode only) |
| `normal_band` | number | Derived lead-volume normal target |
| `low_band` | number | Derived lead-volume low target |

### Hire streams (not marketing channels)

The sheet tracks three **internal hire streams**:

- **Leads** — new leads from paid/organic acquisition
- **Lead Base** — re-engaged or existing contacts in the database
- **Referral** — referred candidates

These are different from **marketing channels** (Instagram, Facebook, etc.) shown in `HireRateBySourceChart`, which use separate static data.

---

## 4. Loading data (Google Sheets)

**File**: `src/utils/fetchLeadsData.ts`

### When `LEADS_SHEET_ID` is not set

Returns hardcoded `MOCK_DATA` (Jan–Jun 2026 sample rows).

### When `LEADS_SHEET_ID` is set

Fetches the **Main** tab via Google Visualization API:

```
https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:json&sheet=Main
```

### Sheet column mapping

Columns are matched **by header label** (not fixed column index):

| Sheet column | Maps to |
|--------------|---------|
| `Month` | Month number 1–12 → converted to `"Jan 2026"` style label |
| `Total Leads` | `leads` |
| `Hired Total` | `hired` |
| `Hired by Leads` | `hired_by_leads` |
| `Hired by Lead Base` | `hired_by_leadbase` |
| `Hired by Referral` | `hired_by_referral` |
| `Amount Spent` | `ad_spend_usd` |

### Row filtering

Rows where `leads === 0` are dropped (months not yet started in the report).

### Computed on fetch

```text
hire_rate_pct = leads > 0 ? round((hired / leads) * 100, 1 decimal) : 0
```

### Performance bands (sheet mode)

The sheet does not include High/Normal/Low lead targets. They are **derived from historical average**:

```text
avgLeads     = sum(leads) / number_of_months
normal_band  = round(avgLeads)
high_band    = round(avgLeads * 1.25)
low_band     = round(avgLeads * 0.7)
```

> **Note:** `PerformanceBandsChart` uses **fixed** targets (400 / 300 / 200), not the `high_band` / `normal_band` / `low_band` fields on each row. Those row fields are stored but not currently used by any chart.

### Month label logic

`Month` is stored as 1–12. The year is inferred:

- If the month index is **after** the current calendar month → use **last year**
- Otherwise → use **current year**

---

## 5. Core formulas & terminology

All percentages are rounded to **1 decimal place** unless noted.

### Hire rates

| Metric | Formula | Used in |
|--------|---------|---------|
| **Overall hire rate** | `(hired / leads) × 100` | `hire_rate_pct`, most “overall” views |
| **Leads-only hire rate** | `(hired_by_leads / leads) × 100` | Leads stream charts & cards |
| **Lead Base hire rate** | `(hired_by_leadbase / leads) × 100` | Lead Base charts (denominator is still **total leads**) |
| **Source share of hires** | `(hired_by_X / hired) × 100` | Breakdown card, stacked hire charts |

### Cost per hire (CPH)

| Metric | Formula |
|--------|---------|
| **CPH (leads only)** | `ad_spend_usd / hired_by_leads` (0 if no leads hires) |
| **CPH (Lead Base only)** | `ad_spend_usd / hired_by_leadbase` |
| **CPH (overall)** | `ad_spend_usd / hired` |

CPH values are typically **rounded to the nearest dollar**.

### Period aggregates (summary cards)

Across all months in `data`:

```text
totalLeads      = sum(leads)
totalHired      = sum(hired)
hiredFromLeads  = sum(hired_by_leads)
totalSpend      = sum(ad_spend_usd)

leadHireRate    = (hiredFromLeads / totalLeads) × 100    ← leads stream only
overallRate     = (totalHired / totalLeads) × 100
avgCostPerHire  = round(totalSpend / hiredFromLeads)      ← leads stream CPH
avgLeadsPerMonth = round(totalLeads / month_count)
```

### Performance band thresholds (fixed in UI)

These are **hardcoded targets** in chart components, not read from the sheet:

| Chart | Max / High | Normal | Min / Low |
|-------|------------|--------|-----------|
| Lead volume (`PerformanceBandsChart`) | 400 | 300 | 200 |
| Hire rate — all sources (`HireRateBandsChart`) | 15% | 6% (standard) | 4% (min) |
| Hire rate — all sources | Market avg max: **7%** | | |
| Hire rate — leads only (`HireRateLeadsOnlyBandsChart`) | 10% | 4% | 3% |
| Hire rate — leads only | Market avg max: **5%** | | |
| Hire rate — Lead Base (`LeadBaseBandsChart`) | 5% | 2% | 1% |
| Ad spend (`SpendingBandsChart`) | $2,000 | $1,500 | $1,000 |
| Ad spend chart bands (`AdSpendChart`) | $2,000 / 15% | $1,500 / 7% | $1,000 / 4% |

Spend bands assume ~**$5 cost per lead** (200 leads → $1,000, 300 → $1,500, 400 → $2,000).

---

## 6. Dashboard layout

**File**: `src/components/LeadsDashboard/DashboardContent.tsx`

The dashboard uses a **sidebar** with six sections:

| Section ID | Label | Components |
|------------|-------|------------|
| `overview` | Overview | Summary card, Breakdown card, Monthly data viewer |
| `forecast` | Forecast | 3-month forecast table + AI insights |
| `performance` | Lead Performance | Performance bands (leads), Hire rate bands (all), Leads & hire rate chart |
| `hire-rates` | Hire Rates | Leads-only bands, Lead Base bands, Hire rate by source (static) |
| `cost-spend` | Cost & Spend | Spending bands, Ad spend chart, CPH leads, CPH overall |
| `sources` | Source Analysis | Hires by source chart, Hire rate by source (static) |

---

## 7. Overview section

### 7.1 Lead → hire conversion (`HireRateSummaryCard`)

**File**: `HireRateSummaryCard.tsx`

**Purpose:** Period summary for the **Leads pipeline only** (excludes Lead Base and Referral from the hero rate).

| Display | Calculation |
|---------|-------------|
| Hero **Lead → hire rate** | `(sum(hired_by_leads) / sum(leads)) × 100` |
| **Total hired from leads** | `sum(hired_by_leads)` |
| **Total leads** | `sum(leads)` |
| **Avg leads/month** | `round(totalLeads / months)` |
| **Avg cost per hire** | `round(totalSpend / hiredFromLeads)` |

---

### 7.2 Hiring rate by source (`HireRateBreakdownCard`)

**File**: `HireRateBreakdownCard.tsx`

**Purpose:** Overall conversion plus how total hires split across the three streams.

| Display | Calculation |
|---------|-------------|
| **Overall hire rate** | `(sum(hired) / sum(leads)) × 100` |
| **Total hired** | `sum(hired)` |
| Per-stream **count** | `sum(hired_by_leads)`, `sum(hired_by_leadbase)`, `sum(hired_by_referral)` |
| Per-stream **share %** | `(stream_hires / totalHired) × 100` |

The bar under each stream shows its share of total hires.

---

### 7.3 Monthly data viewer (`MonthOverMonthCard`)

**File**: `MonthOverMonthCard.tsx` (default export is named `MonthDataCard` in code)

**Purpose:** Multi-select month picker and a metrics table for side-by-side comparison.

**Per selected month**, each row is computed as:

| Metric | Calculation |
|--------|-------------|
| Total leads | `leads` |
| Hired — Leads / LB / Referral | `hired_by_*` |
| Total hired | `hired` |
| Hire rate (leads only) | `(hired_by_leads / leads) × 100` |
| Hire rate (Lead Base only) | `(hired_by_leadbase / leads) × 100` |
| Overall hire rate | `hire_rate_pct` |
| Ad spend | `ad_spend_usd` |
| CPH (leads only) | `ad_spend_usd / hired_by_leads` |
| CPH (Lead Base only) | `ad_spend_usd / hired_by_leadbase` |

Default selection: **latest month only**.

---

## 8. Forecast section

### 8.1 3-month forecast (`ForecastCard`)

**File**: `ForecastCard.tsx`

**Purpose:** Project the next 3 months using a **weighted moving average + linear trend** on the last up to 4 months of real data.

#### Step 1 — Recent window

```text
recent = last 4 months of data (or fewer if less data exists)
```

#### Step 2 — Weights (normalized)

For 4 months, raw weights are `[0.10, 0.20, 0.30, 0.40]` (older → newer).  
If fewer months exist, take the last N weights and renormalize to sum to 1.

```text
weightedAvg(values) = sum(value[i] × weight[i])
```

#### Step 3 — Linear slope

```text
slope(arr) = (arr[last] - arr[first]) / (length - 1)    // 0 if only one point
```

Applied to: leads, ad spend, leads hire rate, Lead Base hire rate, overall hire rate.

#### Step 4 — Forecast for month offset 1, 2, 3

```text
leads      = max(0, round(baseLeads     + slope_leads   × offset))
adSpend    = max(0,     baseSpend     + slope_spend   × offset))
leadsRate  = max(0,     baseLeadsRate + slope_leadsR  × offset))
lbRate     = max(0,     baseLBRate    + slope_lbR     × offset))
overallRate= max(0,     baseOverall   + slope_overall × offset))

hiredLeads  = round(leads × leadsRate / 100)
hiredLB     = round(leads × lbRate / 100)
hiredRef    = last month's hired_by_referral (held flat)
totalHired  = hiredLeads + hiredLB + hiredRef

cphLeads  = adSpend / hiredLeads   (if hiredLeads > 0)
cphLB     = adSpend / hiredLB      (if hiredLB > 0)
```

#### Trend badges

Compare forecast value vs **last actual month**:

- Green ↑ / Red ↓ based on direction
- For spend and CPH, **lower is better** (`invert: true`)
- “Stable” if change is below a threshold (0.5 for %, 50 for spend, 10 for CPH)

---

## 9. Lead Performance section

### 9.1 Performance bands — monthly leads (`PerformanceBandsChart`)

**Chart type:** Line chart

| Series | Value |
|--------|-------|
| High target | Fixed **400** |
| Normal target | Fixed **300** |
| Low target | Fixed **200** |
| **Current** | `leads` per month |

**Summary pills:**

| Pill | Logic |
|------|-------|
| Avg monthly leads | `round(mean(leads))` |
| Months above normal | count where `leads > 300` |
| Months below low | count where `leads < 200` |
| Budget corrections | count where `ad_spend_usd > avgSpend × 1.1` |

---

### 9.2 Performance bands — hire rate, all sources (`HireRateBandsChart`)

**Chart type:** Line chart

| Series | Value |
|--------|-------|
| Max | **15%** |
| Market avg max | **7%** |
| Normal | **6%** |
| Min | **4%** |
| **All-sources rate** | `hire_rate_pct` |

**Summary pills:**

| Pill | Logic |
|------|-------|
| Avg overall hire rate | `mean(hire_rate_pct)` |
| Months above market max | `hire_rate_pct >= 7%` |
| Months at normal | `6% <= rate < 7%` |
| Months below min | `rate < 4%` |

---

### 9.3 Leads & hire rate per month (`LeadsHireRateChart`)

**Chart type:** Combo bar + line (dual Y-axis)

| Series | Axis | Value |
|--------|------|-------|
| Leads (bars) | Left | `leads` |
| Hire rate % (line) | Right | `hire_rate_pct` (= overall rate) |

Tooltip for hire rate also shows `hired` count for that month.

---

## 10. Hire Rates section

### 10.1 Performance bands — hire rate, leads only (`HireRateLeadsOnlyBandsChart`)

**Chart type:** Line chart

| Series | Value |
|--------|-------|
| Max | **10%** |
| Market avg max | **5%** |
| Normal | **4%** |
| Low | **3%** |
| **Leads-only rate** | `(hired_by_leads / leads) × 100` |

---

### 10.2 Performance bands — hire rate, Lead Base (`LeadBaseBandsChart`)

**Chart type:** Line chart

| Series | Value |
|--------|-------|
| Max | **5%** |
| Normal | **2%** |
| Low | **1%** |
| **Lead Base rate** | `(hired_by_leadbase / leads) × 100` |

---

### 10.3 Hire rate by source — marketing channels (`HireRateBySourceChart`)

**File**: `HireRateBySourceChart.tsx`  
**Data:** **Static only** — not connected to Google Sheets or other dashboard totals.

**Chart type:** Grouped bar chart (months on X-axis)

**Sources:** Instagram, Facebook, LinkedIn, Indeed, Referral

**Per source per month:**

```text
hire_rate_pct = round((hired / leads) × 100, 1 decimal)
```

Tooltip: `5.0% (3 hired / 60 leads)`

Marked with a **“Static data”** badge in the UI.

---

## 11. Cost & Spend section

### 11.1 Performance bands — monthly spending (`SpendingBandsChart`)

**Chart type:** Line chart

| Series | Value |
|--------|-------|
| Max | **$2,000** |
| Normal | **$1,500** |
| Min | **$1,000** |
| **Current** | `ad_spend_usd` |

**Summary pills:** avg spend, months above normal, below min, over max.

---

### 11.2 Ad spend · hire rate (`AdSpendChart`)

**Chart type:** Dual-axis line chart

| Series | Left axis ($) | Right axis (%) |
|--------|---------------|----------------|
| Ad spend | `ad_spend_usd` | — |
| Hire rate | — | `hire_rate_pct` |
| Spend bands | $1,000 / $1,500 / $2,000 | — |
| Rate bands | — | 4% / 7% / 15% |

Reference band lines are hidden from tooltips; actual spend and rate lines are shown.

---

### 11.3 Cost per hire — leads only (`CostPerHireChart`)

**Chart type:** Area line chart

```text
CPH = round(ad_spend_usd / hired_by_leads)   // 0 if no hires
```

**Summary pills:** average CPH, best month (lowest CPH), best/worst CPH values.

---

### 11.4 Cost per hire — overall (`OverallCostPerHireChart`)

**Chart type:** Area line chart

```text
CPH = round(ad_spend_usd / hired)   // all sources
```

Same pill logic as leads-only CPH chart.

---

## 12. Source Analysis section

### 12.1 Hires by source — count & hire rate (`HiresBySourceChart`)

**Chart type:** Stacked bar + dual line (combo)

**Left Y-axis (stacked bars — hire counts):**

| Bar | Value |
|-----|-------|
| Leads | `hired_by_leads` |
| Lead Base | `hired_by_leadbase` |
| Referral | `hired_by_referral` |

**Right Y-axis (lines — hire rates):**

| Line | Formula |
|------|---------|
| Leads hire rate % | `(hired_by_leads / leads) × 100` |
| Overall hire rate % | `hire_rate_pct` |

**Tooltip (bars):** shows count + `% of month's hires` = `(bar_value / hired) × 100`

---

### 12.2 Hire rate by source — marketing (`HireRateBySourceChart`)

Same static chart as in [§10.3](#103-hire-rate-by-source--marketing-channels-hireratebysourcechart). Appears in both **Hire Rates** and **Source Analysis** sections.

---

## 13. AI forecast explanations

**Endpoint:** `POST /api/forecast-explain`  
**Requires:** `OPENAI_API_KEY` in environment

When a forecast month tab is opened, `ForecastCard` sends:

- **history:** last 4 months of actual metrics
- **forecast:** projected values for the selected month

GPT-4o-mini returns one sentence per metric (JSON). Results are cached per forecast month index for the session.

If the API key is missing or the call fails, the table still shows numeric forecasts; the AI column shows an error or dash.

---

## 14. Static vs live data

| Component | Data source |
|-----------|-------------|
| All cards and charts except below | `fetchLeadsData()` → Google Sheet or `MOCK_DATA` |
| `HireRateBySourceChart` | Inline `STATIC_DATA` in the component file |

**Important:** Marketing channel data (Instagram, Facebook, etc.) does **not** affect totals, KPIs, or any other chart. Replacing it later should only touch `HireRateBySourceChart.tsx`.

---

## 15. Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `LEADS_SHEET_ID` | No | Google Spreadsheet ID. If unset, uses mock data. |
| `OPENAI_API_KEY` | No | Enables AI insight column in the forecast table. |

Example `.env.local`:

```env
LEADS_SHEET_ID=your_spreadsheet_id_here
OPENAI_API_KEY=sk-...
```

The sheet must be **published or accessible** to the visualization endpoint (typically public read or shared appropriately).

---

## 16. File reference

```
src/
├── app/
│   ├── page.tsx                          # Main dashboard page
│   ├── dashboard/leads/page.tsx          # Alternate dashboard route
│   └── api/forecast-explain/route.ts     # OpenAI forecast explanations
├── components/LeadsDashboard/
│   ├── DashboardContent.tsx              # Layout, sidebar, section routing
│   ├── HireRateSummaryCard.tsx           # Overview: leads-only conversion
│   ├── HireRateBreakdownCard.tsx         # Overview: stream breakdown
│   ├── MonthOverMonthCard.tsx            # Overview: monthly data table
│   ├── ForecastCard.tsx                  # 3-month forecast + AI
│   ├── PerformanceBandsChart.tsx         # Lead volume vs bands
│   ├── HireRateBandsChart.tsx            # Overall hire rate vs bands
│   ├── LeadsHireRateChart.tsx            # Leads bars + hire rate line
│   ├── HireRateLeadsOnlyBandsChart.tsx   # Leads stream hire rate bands
│   ├── LeadBaseBandsChart.tsx            # Lead Base hire rate bands
│   ├── SpendingBandsChart.tsx            # Ad spend vs bands
│   ├── AdSpendChart.tsx                  # Spend + rate dual-axis
│   ├── CostPerHireChart.tsx              # CPH leads only
│   ├── OverallCostPerHireChart.tsx       # CPH overall
│   ├── HiresBySourceChart.tsx            # Stacked hires by stream
│   ├── HireRateBySourceChart.tsx         # Static marketing channel rates
│   └── HireRateCompositionChart.tsx      # (exists, not mounted in dashboard)
├── types/leads.ts                        # LeadsDataRow interface
└── utils/fetchLeadsData.ts               # Sheet fetch + mock fallback
```

### Unused component

`HireRateCompositionChart.tsx` shows **stacked % share** of hires by stream (Leads / Lead Base / Referral) plus overall hire rate line. It is implemented but **not currently rendered** in `DashboardContent`. To add it, import it into a section in `DashboardContent.tsx`.

---

## Quick formula cheat sheet

```text
Overall hire rate     = hired ÷ leads × 100
Leads hire rate       = hired_by_leads ÷ leads × 100
Lead Base hire rate   = hired_by_leadbase ÷ leads × 100
Stream share of hires = hired_by_X ÷ hired × 100
CPH (leads)           = ad_spend_usd ÷ hired_by_leads
CPH (overall)         = ad_spend_usd ÷ hired
Channel hire rate     = channel_hired ÷ channel_leads × 100   (static chart only)
```

---

*Last updated to match the codebase layout with sidebar sections and static marketing source chart.*
