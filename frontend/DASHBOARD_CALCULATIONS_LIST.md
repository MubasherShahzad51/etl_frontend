# 📊 Dashboard.jsx Required Calculations

## 🎯 **Overview**

Based on Dashboard.jsx analysis, here are the calculations needed from 3 months of data (Oct, Nov, Dec).

---

## 📋 **Required Functions List**

### **1. KPI Metrics Functions**

#### `get_dashboard_kpis(scope='USA', state=None, time_range='30d')`
**Purpose:** Calculate key performance indicators for dashboard header

**Returns:**
- `total_dealers` - Unique canonical_dealer_id count
- `total_sales` - Sum of total_sales
- `active_inventory` - Sum of active_inventory  
- `inventory_to_sales_ratio` - active_inventory / total_sales
- `avg_sales_per_dealer` - total_sales / total_dealers
- `growth_pct` - Growth percentage (MoM or period-over-period)
- `market_direction` - 'positive', 'negative', or 'neutral'

**Data Sources:**
- `dealer_sales_summary_simple.csv` from each month (Oct, Nov, Dec)
- Filter by scope (USA vs State) and time_range

---

### **2. Trend Data Functions**

#### `get_sales_trend_series(scope='USA', state=None, time_range='30d')`
**Purpose:** Generate time series data for trend charts

**Returns:**
- Array of `{date, sales, inventory}` objects
- For 30d: daily data (if available) or monthly aggregated
- For 3m: monthly data (Oct, Nov, Dec)
- For 6m: monthly data (if we had 6 months, currently just 3)
- For yoy: year-over-year comparison (if we had previous year data)

**Data Sources:**
- Monthly `dealer_sales_summary_simple.csv` files
- Aggregate by month: Oct, Nov, Dec

**Calculation:**
- Sum total_sales per month
- Sum active_inventory per month
- Create date series based on time_range

---

### **3. Make Trends Functions**

#### `get_make_trends(scope='USA', state=None, time_range='30d')`
**Purpose:** Calculate make-level trends and rankings

**Returns:**
- Array of `{name, value, share, mom, qoq}` objects
- `name` - Make name
- `value` - Total inventory/sales for that make
- `share` - Percentage of total market
- `mom` - Month-over-Month growth % (Nov vs Oct, Dec vs Nov)
- `qoq` - Quarter-over-Quarter growth % (if applicable)

**Data Sources:**
- `dealer_sales_summary_simple.csv` → `top_5_makes` column (pipe-separated)
- `dealer_sales_summary_simple.csv` → `top_5_make_inventory` column (pipe-separated)
- Compare across months (Oct, Nov, Dec) to calculate MoM

**Calculation:**
- Parse `top_5_makes` and `top_5_make_inventory` from each dealer
- Aggregate by make across all dealers
- Calculate share: (make_total / all_makes_total) * 100
- Calculate MoM: Compare Nov vs Oct, Dec vs Nov
- Calculate QoQ: Compare Q4 (Oct+Nov+Dec) vs previous quarter (if available)

---

### **4. Model Rankings Functions**

#### `get_model_rankings(scope='USA', state=None, time_range='30d')`
**Purpose:** Rank models by sales/inventory with trends

**Returns:**
- `list` - Array of `{key, make, model, segment, units, share, mom, qoq}` objects
- `topMakes` - Array of top makes with values

**Data Sources:**
- `dealer_sales_summary_simple.csv` → `top_5_models` column
- `dealer_sales_summary_simple.csv` → `top_5_model_inventory` column
- `Make_Model_BodyStyle.csv` → For segment mapping

**Calculation:**
- Parse `top_5_models` and `top_5_model_inventory` from each dealer
- Match with make from `top_5_makes` (same index)
- Map to segment using `Make_Model_BodyStyle.csv`
- Aggregate by make+model combination
- Calculate share, MoM, QoQ trends
- Sort by units descending

---

### **5. Segment Share Functions**

#### `get_segment_share(scope='USA', state=None, time_range='30d')`
**Purpose:** Calculate segment distribution (SUV, Sedan, Truck, etc.)

**Returns:**
- Array of `{segment, value, share}` objects
- Sorted by value descending

**Data Sources:**
- `dealer_sales_summary_simple.csv` → `top_5_models` column
- `Make_Model_BodyStyle.csv` → Segment mapping

**Calculation:**
- For each dealer, get models from `top_5_models`
- Match with make from `top_5_makes`
- Lookup segment from `Make_Model_BodyStyle.csv`
- Weight by `top_5_model_inventory`
- Aggregate by segment
- Calculate share percentage

---

### **6. Market Concentration Functions**

#### `get_market_concentration(scope='USA', state=None, time_range='30d')`
**Purpose:** Calculate how much top 10% dealers control

**Returns:**
- `concentration_pct` - Percentage of sales controlled by top 10% dealers

**Data Sources:**
- `dealer_sales_summary_simple.csv` → `total_sales` column

**Calculation:**
- Sort dealers by total_sales descending
- Take top 10% of dealers
- Sum their total_sales
- Calculate: (top_10_percent_sales / total_sales) * 100

---

### **7. Top Leaders Functions**

#### `get_top_leaders(scope='USA', state=None, time_range='30d', limit=10)`
**Purpose:** Get top performing dealers

**Returns:**
- Array of `{id, dealerName, make, location, totalSales, activeInventory, uniqueModels, salesVelocity}` objects

**Data Sources:**
- `dealer_sales_summary_simple.csv` → All columns

**Calculation:**
- Sort by `total_sales` descending
- Take top N dealers
- Calculate `salesVelocity` = total_sales / active_inventory
- Get top make from `top_5_makes` (first one)
- Format location as `{city}, {state}`

---

### **8. Fastest Rising Dealers Functions**

#### `get_fastest_rising_dealers(scope='USA', state=None, time_range='30d', limit=10)`
**Purpose:** Find dealers with highest growth

**Returns:**
- Array of `{id, dealerName, location, totalSales, growth, pctGrowth}` objects

**Data Sources:**
- `dealer_sales_summary_simple.csv` → `confirmed_sales`, `potential_sales` columns (if available)
- OR compare `total_sales` across months (Oct vs Nov, Nov vs Dec)

**Calculation:**
- If `confirmed_sales` and `potential_sales` exist:
  - `growth` = potential_sales - confirmed_sales
  - `pctGrowth` = (growth / confirmed_sales) * 100
- Else (compare months):
  - Compare Nov total_sales vs Oct total_sales
  - Compare Dec total_sales vs Nov total_sales
  - Calculate growth and percentage
- Sort by growth descending

---

### **9. Opportunity States Functions**

#### `get_opportunity_states(scope='USA', limit=10)`
**Purpose:** Rank states by opportunity score

**Returns:**
- Array of `{state, dealerCount, totalSales, totalInventory, ratio, score}` objects

**Data Sources:**
- `dealer_sales_summary_simple.csv` → Group by state

**Calculation:**
- Group dealers by `state`
- For each state:
  - `dealerCount` - Count unique dealers
  - `totalSales` - Sum of total_sales
  - `totalInventory` - Sum of active_inventory
  - `ratio` - totalInventory / totalSales
  - `score` - (totalSales / dealerCount) * (1 / ratio) - Higher is better
- Sort by score descending

---

### **10. Market Insights Functions**

#### `get_market_insights(scope='USA', state=None, time_range='30d')`
**Purpose:** Generate market insights and recommendations

**Returns:**
- `pattern` - 'sustained growth', 'seasonal pattern', or 'short-term spike'
- `shortTerm` - `{gaining: [...], losing: [...]}` - Segments gaining/losing
- `comparisons` - `{yoyPct, yoyAbs, currentSales, lastYearSales}` - YoY comparisons
- `focus` - `{topMake, topMakeShare}` - Top make info

**Data Sources:**
- Uses results from other functions
- Calculates variance/standard deviation from trend data

**Calculation:**
- Calculate mean and variance from trend series
- Coefficient of variation (CV) = std / mean
- Pattern based on CV:
  - CV < 0.22: 'sustained growth'
  - CV < 0.35: 'seasonal pattern'
  - Else: 'short-term spike'
- Identify gaining/losing segments from segment trends
- Calculate YoY if previous year data available

---

## 🔄 **Multi-Month Data Handling**

### **Data Loading Strategy:**

1. **Load all 3 months:**
   - `exports/Oct/dealer_sales_summary_simple.csv`
   - `exports/Nov/dealer_sales_summary_simple.csv`
   - `exports/Dec/dealer_sales_summary_simple.csv`

2. **Add month column:**
   - Tag each row with month (Oct, Nov, Dec)

3. **Filtering:**
   - By scope: USA (all states) or specific state
   - By time_range:
     - `30d` - Use most recent month (Dec) or last 30 days if daily data available
     - `3m` - Aggregate all 3 months (Oct + Nov + Dec)
     - `6m` - Not available (only have 3 months)
     - `yoy` - Not available (need previous year data)

4. **Trend Calculations:**
   - **MoM (Month-over-Month):**
     - Nov vs Oct: `((Nov_value - Oct_value) / Oct_value) * 100`
     - Dec vs Nov: `((Dec_value - Nov_value) / Nov_value) * 100`
   - **QoQ (Quarter-over-Quarter):**
     - Q4 (Oct+Nov+Dec) vs Q3 (if available)
   - **3-Month Average:**
     - Average of Oct, Nov, Dec values

---

## 📊 **Data Structure Examples**

### **Input Data Structure:**
```python
# From dealer_sales_summary_simple.csv
{
    'canonical_dealer_id': '123',
    'mc_dealer_id': 456,
    'mc_location_id': 789,
    'seller_name': 'ABC Motors',
    'city': 'Los Angeles',
    'state': 'CA',
    'total_sales': 150,
    'active_inventory': 200,
    'top_5_makes': 'Toyota|Honda|Ford',
    'top_5_make_inventory': '80|60|40',
    'top_5_models': 'Camry|Accord|F-150',
    'top_5_model_inventory': '50|40|30',
    'unique_models_count': 25,
    # ... other columns
}
```

### **Output Data Structure Examples:**

**KPI Response:**
```python
{
    'total_dealers': 1250,
    'total_sales': 45000,
    'active_inventory': 55000,
    'inventory_to_sales_ratio': 1.22,
    'avg_sales_per_dealer': 36.0,
    'growth_pct': 5.2,
    'market_direction': 'positive'
}
```

**Trend Series Response:**
```python
[
    {'date': '2024-10-01', 'sales': 14000, 'inventory': 18000},
    {'date': '2024-11-01', 'sales': 15000, 'inventory': 19000},
    {'date': '2024-12-01', 'sales': 16000, 'inventory': 18000}
]
```

**Make Trends Response:**
```python
[
    {
        'name': 'Toyota',
        'value': 12000,
        'share': 26.7,
        'mom': 3.5,  # Nov vs Oct
        'qoq': 8.2   # Q4 vs Q3 (if available)
    },
    # ... more makes
]
```

---

## 🎯 **Priority Order for Implementation**

1. **High Priority (Core Dashboard):**
   - ✅ `get_dashboard_kpis()` - KPI tiles
   - ✅ `get_sales_trend_series()` - Trend charts
   - ✅ `get_make_trends()` - Top Trends section
   - ✅ `get_model_rankings()` - Top Selling Models table
   - ✅ `get_segment_share()` - Segment Share chart

2. **Medium Priority (Supporting Data):**
   - ✅ `get_market_concentration()` - Concentration metric
   - ✅ `get_top_leaders()` - Top Market Leaders table
   - ✅ `get_fastest_rising_dealers()` - Fastest Rising table
   - ✅ `get_opportunity_states()` - Top States by Opportunity

3. **Lower Priority (Advanced Features):**
   - ✅ `get_market_insights()` - Market Highlights and insights

---

## 📝 **Notes**

- **Time Range Support:**
  - `30d` - Use Dec data (most recent month)
  - `3m` - Aggregate Oct + Nov + Dec
  - `6m` - Not available (only 3 months of data)
  - `yoy` - Not available (need previous year)

- **Scope Filtering:**
  - `USA` - All states
  - `State` - Filter by specific state (e.g., 'CA', 'TX')

- **Data Aggregation:**
  - When aggregating months, sum numeric values (sales, inventory)
  - For unique counts (dealers, models), use set operations

- **Trend Calculations:**
  - MoM requires comparing adjacent months
  - QoQ requires comparing quarters (if we had Q3 data)
  - Growth % = ((new - old) / old) * 100

---

## 🔧 **Next Steps**

1. Create `etl_backend_service.py` with these functions
2. Each function should:
   - Load data from appropriate month folders
   - Filter by scope and time_range
   - Perform calculations
   - Return structured data
3. Create `etl_api.py` with endpoints calling these functions
4. Map endpoints to frontend service calls
