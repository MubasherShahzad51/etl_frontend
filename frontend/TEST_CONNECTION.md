# 🧪 Testing the Connection

## ✅ **Complete Setup**

### **1. Backend Files Created:**
- `etl_backend_service.py` - Service with `get_total_dealers()` function
- `etl_api.py` - FastAPI endpoint at `/api/dashboard/total_dealers`

### **2. Start Backend:**

```bash
# From project root
python etl_api.py
```

Backend will run on: `http://localhost:8082`

### **3. Test the Endpoint:**

#### **Test 1: USA Scope, 30 days**
```bash
curl "http://localhost:8082/api/dashboard/total_dealers?scope=USA&time_range=30d"
```

#### **Test 2: USA Scope, 3 months**
```bash
curl "http://localhost:8082/api/dashboard/total_dealers?scope=USA&time_range=3m"
```

#### **Test 3: State Scope (California)**
```bash
curl "http://localhost:8082/api/dashboard/total_dealers?scope=State&state=CA&time_range=30d"
```

#### **Test 4: Health Check**
```bash
curl "http://localhost:8082/health"
```

### **4. Expected Response:**

```json
{
  "success": true,
  "total_dealers": 1250,
  "scope": "USA",
  "state": null,
  "time_range": "30d",
  "months_included": ["Dec"],
  "total_rows": 1500,
  "states_count": 50,
  "message": "Successfully calculated total dealers for USA scope, 30d time range",
  "timestamp": "2024-01-15 10:30:00"
}
```

### **5. Connect Frontend:**

Update `NEWFRONTEND/etl_frontend/src/services/api.js` or create a test:

```javascript
// Test in browser console or add to Dashboard.jsx
fetch('http://localhost:8082/api/dashboard/total_dealers?scope=USA&time_range=30d')
  .then(r => r.json())
  .then(data => console.log('Total Dealers:', data.total_dealers))
```

### **6. Update Frontend Service (Optional):**

Add to `NEWFRONTEND/etl_frontend/src/services/dealerService.js`:

```javascript
// Get total dealers
getTotalDealers: async (scope = 'USA', state = null, timeRange = '30d') => {
  const params = { scope, time_range: timeRange }
  if (state) params.state = state
  const response = await api.get('/api/dashboard/total_dealers', { params })
  return response.data
}
```

---

## 🔍 **Troubleshooting**

### **Issue: Data not loading**
- Check that CSV files exist in `NEWFRONTEND/etl_frontend/exports/Oct/`, `Nov/`, `Dec/`
- Check file names: `dealer_sales_summary_simple.csv`
- Check logs in terminal when starting backend

### **Issue: CORS errors**
- Backend has CORS enabled by default
- If issues, set `CORS_ALLOW_ORIGINS=http://localhost:5173` in `.env`

### **Issue: Port already in use**
- Change port in `etl_api.py` line: `port=8082` to another port
- Update frontend API URL accordingly

---

## 📊 **What This Function Does:**

1. **Loads data** from `exports/Oct/`, `Nov/`, `Dec/` folders
2. **Filters by scope:**
   - `USA` = All states
   - `State` = Specific state (requires `state` parameter)
3. **Filters by time_range:**
   - `30d` = Uses Dec data only (most recent)
   - `3m` = Combines Oct + Nov + Dec
4. **Counts unique dealers** using `canonical_dealer_id`
5. **Returns structured response** with all details

---

## ✅ **Next Steps:**

Once this works, you can add more functions following the same pattern:
- `get_total_sales()`
- `get_active_inventory()`
- `get_dashboard_kpis()` (combines all KPIs)
- etc.
