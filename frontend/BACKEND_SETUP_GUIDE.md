# 🚀 Backend Setup Guide for ETL Frontend

## 📊 **Overview**

This guide shows how to create a backend API for the `etl_frontend` that supports **multi-month data** (Oct, Nov, Dec).

---

## 📁 **Data Structure**

Your data is organized like this:
```
etl_frontend/
├── exports/
│   ├── Oct/
│   │   ├── dealer_make_model_summary_simple.csv
│   │   └── dealer_sales_summary_simple.csv
│   ├── Nov/
│   │   ├── dealer_make_model_summary_simple.csv
│   │   └── dealer_sales_summary_simple.csv
│   ├── Dec/
│   │   ├── dealer_make_model_summary_simple.csv
│   │   ├── dealer_sales_summary_simple.csv
│   │   └── Make_Model_BodyStyle.csv
│   └── Make_Model_BodyStyle.csv
```

---

## 🏗️ **Backend Architecture**

```
Multi-Month Data Files (exports/Oct, Nov, Dec/)
    ↓
Multi-Month Service (loads all months, supports time filtering)
    ↓
FastAPI Backend (etl_api.py)
    ↓
Frontend Services (api.js, dealerService.js, etc.)
```

---

## 📝 **Step 1: Create Multi-Month Service**

**File:** `etl_backend_service.py` (create in project root or `core/` folder)

This service extends the existing `competitor_analysis_service_clean.py` to support multiple months.

---

## 📝 **Step 2: Create FastAPI Backend**

**File:** `etl_api.py` (create in project root)

This creates all the API endpoints the frontend expects.

---

## 📝 **Step 3: Update Frontend Configuration**

**File:** `.env` in `etl_frontend/` folder

Set the API URL to point to your backend.

---

## 🎯 **Quick Start**

1. **Create the backend service file** (see code below)
2. **Create the API file** (see code below)
3. **Run the backend:** `python etl_api.py`
4. **Update frontend .env:** Point to `http://localhost:8082` (or your port)
5. **Start frontend:** `cd etl_frontend && npm run dev`

---

## 📋 **Required Endpoints**

Based on `src/services/*.js`, the frontend expects:

| Endpoint | Method | Service File | Purpose |
|----------|--------|--------------|---------|
| `/search/dealers` | GET | dealerService.js | Search dealers |
| `/dealer/makes_models` | GET | dealerService.js | Get makes/models |
| `/dealer/kpis` | GET | dealerService.js | Get dealer KPIs |
| `/dealer/filtered_analytics` | GET | dealerService.js | Filtered analytics |
| `/dealer_analytics` | GET | dealerService.js | Full analytics |
| `/competitor_analysis` | GET | competitorService.js | Competitor analysis |
| `/market_overview` | GET | competitorService.js | Market overview |
| `/regional_analysis` | GET | competitorService.js | Regional analysis |
| `/attributions` | GET | attributionService.js | Attribution records |
| `/attribution/vin/{vin}` | GET | attributionService.js | Attribution by VIN |

---

## 🔧 **Implementation Details**

See the code files below for complete implementation.
