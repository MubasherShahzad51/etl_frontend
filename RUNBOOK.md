# Adcertify Automotive Analysis — Runbook

This document explains how to run the **FastAPI backend** + **React (Vite) frontend** and how to log in.

## URLs / Ports

- **Frontend (Web UI)**: `http://<server-ip>:5174` (recommended if `5173` is already used)
- **Backend (FastAPI)**: `http://<server-ip>:8082`
- **Swagger docs**: `http://<server-ip>:8082/docs`

## Login Credentials (fixed)

- **Username**: `competitor_admin`
- **Password**: `s7t6u5v4`

> Note: The login page auto-detects the backend API URL from the frontend host (it uses `http://<server-ip>:8082`).

---

## 1) Backend Setup (FastAPI)

### Prerequisites

- Python 3.10+ recommended

### Install dependencies

From the repo root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Run the backend (IMPORTANT: bind to 0.0.0.0)

From the repo root:

```bash
python3 -m uvicorn core.competitor_api:app --host 0.0.0.0 --port 8082
```

### Verify backend is running

Open in a browser:

- `http://<server-ip>:8082/health`
- `http://<server-ip>:8082/docs`

Test an authenticated endpoint (should return JSON):

```bash
curl -i -u competitor_admin:s7t6u5v4 "http://<server-ip>:8082/dashboard/kpis?scope=USA&time_range=30d"
```

Inventory Analysis endpoints (should return JSON):

```bash
curl -i -u competitor_admin:s7t6u5v4 "http://<server-ip>:8082/inventory_analysis/summary?scope=USA&time_range=30d"
curl -i -u competitor_admin:s7t6u5v4 "http://<server-ip>:8082/inventory_analysis/structure_trends?scope=USA&time_range=30d&top_n=10"
curl -i -u competitor_admin:s7t6u5v4 "http://<server-ip>:8082/inventory_analysis/leaders?scope=USA&time_range=30d&limit=10"
```

If you get `401 Unauthorized`, the credentials are wrong or you are running an old backend process.

---

## 2) Frontend Setup (React + Vite)

### Prerequisites

- Node.js 18+
- npm 8+

### Install dependencies

```bash
cd frontend
npm install
```

### Run the frontend (IMPORTANT: expose on network)

```bash
npm run dev:5173
```

If `5173` is already used by another frontend, run this app on `5174`:

```bash
npm run dev:5174
```

Vite will print a URL. Use the server IP:

- `http://<server-ip>:5174/`

---

## 3) Logging In

1. Open:
   - `http://<server-ip>:5173/`
2. You will be redirected to:
   - `http://<server-ip>:5173/login`
3. Click **Sign In**
   - Username/password are fixed and prefilled.
   - API URL is auto-detected.

If login fails, ensure:
- Backend is running on `0.0.0.0:8082`
- Port `8082` is reachable from your network

---

## 4) Running for other users (sharing the app)

Share:
- **Web URL**: `http://<server-ip>:5174/`
- **Username**: `competitor_admin`
- **Password**: `s7t6u5v4`

Requirements:
- Server must allow inbound connections to:
  - TCP `5173` (frontend)
  - TCP `8082` (backend)

---

## 5) Common Issues

### A) Dashboard shows fallback (old) data

This usually means API calls are failing (wrong backend URL or backend not reachable).

Fix:
- Ensure backend runs on `0.0.0.0:8082`
- Open `http://<server-ip>:8082/docs`

### B) Can open `/docs` but API calls fail

Make sure you are using the backend base URL **without** `/docs`:
- Correct: `http://<server-ip>:8082`
- Incorrect: `http://<server-ip>:8082/docs`

### C) CORS issues

If you access the frontend via IP, ensure backend CORS is configured to allow it.
(Backend is currently configured to allow all origins by default if `CORS_ALLOW_ORIGINS` is not set.)
