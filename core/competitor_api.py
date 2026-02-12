from __future__ import annotations

import os
import secrets
from typing import Optional

from fastapi import FastAPI
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic
from fastapi.security import HTTPBasicCredentials

from core.competitor_analysis_service_clean import (
    get_dashboard_kpis,
    get_fastest_rising_dealers,
    get_market_highlights,
    get_segment_share_of_sales,
    get_market_direction,
    get_opportunities_risk,
    get_recent_activity,
    get_recommendations,
    get_top_trends,
    get_top_market_leaders,
    get_top_selling_models,
    get_total_sales,
)


app = FastAPI(title="Competitor API", version="0.1.0")

_security = HTTPBasic()
_AUTH_USER = "competitor_admin"
_AUTH_PASS = "s7t6u5v4"


def _require_basic_auth(credentials: HTTPBasicCredentials = Depends(_security)):
    ok_user = secrets.compare_digest(credentials.username or "", _AUTH_USER)
    ok_pass = secrets.compare_digest(credentials.password or "", _AUTH_PASS)
    if not (ok_user and ok_pass):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
            headers={"WWW-Authenticate": "Basic"},
        )

# CORS
# If CORS_ALLOW_ORIGINS is unset, default to allow all origins.
# This API uses header-based Basic Auth (not cookies), so allow_credentials is not required.
cors_env = os.getenv("CORS_ALLOW_ORIGINS")
if cors_env and cors_env.strip():
    allow_origins = [o.strip() for o in cors_env.split(",") if o.strip()]
    allow_credentials = True
else:
    allow_origins = ["*"]
    allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/dashboard/total_sales")
def dashboard_total_sales(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    _: None = Depends(_require_basic_auth),
):
    # Optional override if you ever want to point the backend elsewhere.
    exports_dir = os.getenv("EXPORTS_DIR")
    kpis = get_total_sales(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    return {
        "success": True,
        "scope": scope,
        "state": state,
        "time_range": time_range,
        "total_sales": kpis.total_sales,
    }


@app.get("/dashboard/kpis")
def dashboard_kpis(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    kpis = get_dashboard_kpis(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    return {
        "success": True,
        "scope": scope,
        "state": state,
        "time_range": time_range,
        "total_dealers": kpis.total_dealers,
        "total_sales": kpis.total_sales,
        "active_inventory": kpis.active_inventory,
        "inventory_to_sales": kpis.inventory_to_sales,
        "avg_sales_per_dealer": kpis.avg_sales_per_dealer,
        "sales_velocity": kpis.sales_velocity,
        "top_make": kpis.top_make,
        "market_share": kpis.market_share,
    }


@app.get("/dashboard/top_market_leaders")
def dashboard_top_market_leaders(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    limit: int = 10,
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    rows = get_top_market_leaders(
        scope=scope,
        state=state,
        time_range=time_range,
        exports_dir=exports_dir,
        limit=limit,
    )
    return {
        "success": True,
        "scope": scope,
        "state": state,
        "time_range": time_range,
        "rows": rows,
    }


@app.get("/dashboard/top_trends")
def dashboard_top_trends(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    data = get_top_trends(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    return {
        "success": True,
        "scope": scope,
        "state": state,
        "time_range": time_range,
        **(data or {}),
    }


@app.get("/dashboard/recent_activity")
def dashboard_recent_activity(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    rows = get_recent_activity(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    return {
        "success": True,
        "scope": scope,
        "state": state,
        "time_range": time_range,
        "rows": rows,
    }


@app.get("/dashboard/recommendations")
def dashboard_recommendations(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    data = get_recommendations(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    return {
        "success": True,
        "scope": scope,
        "state": state,
        "time_range": time_range,
        **(data or {}),
    }


@app.get("/dashboard/market_direction")
def dashboard_market_direction(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    data = get_market_direction(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    return {
        "success": True,
        "scope": scope,
        "state": state,
        "time_range": time_range,
        **(data or {}),
    }


@app.get("/dashboard/opportunities_risk")
def dashboard_opportunities_risk(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    data = get_opportunities_risk(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    return {
        "success": True,
        "scope": scope,
        "state": state,
        "time_range": time_range,
        **(data or {}),
    }


@app.get("/dashboard/market_highlights")
def dashboard_market_highlights(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    data = get_market_highlights(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    return {
        "success": True,
        "scope": scope,
        "state": state,
        "time_range": time_range,
        **(data or {}),
    }


@app.get("/dashboard/top_selling_models")
def dashboard_top_selling_models(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    top_models: int = 20,
    top_makes: int = 10,
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    data = get_top_selling_models(
        scope=scope,
        state=state,
        time_range=time_range,
        exports_dir=exports_dir,
        top_models=top_models,
        top_makes=top_makes,
    )
    return {
        "success": True,
        "scope": scope,
        "state": state,
        "time_range": time_range,
        "topMakes": data.get("topMakes", []),
        "models": data.get("models", []),
    }


@app.get("/dashboard/fastest_rising_dealers")
def dashboard_fastest_rising_dealers(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    limit: int = 10,
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    rows = get_fastest_rising_dealers(
        scope=scope,
        state=state,
        time_range=time_range,
        exports_dir=exports_dir,
        limit=limit,
    )
    return {
        "success": True,
        "scope": scope,
        "state": state,
        "time_range": time_range,
        "rows": rows,
    }


@app.get("/dashboard/segment_share_of_sales")
def dashboard_segment_share_of_sales(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    rows = get_segment_share_of_sales(
        scope=scope,
        state=state,
        time_range=time_range,
        exports_dir=exports_dir,
    )
    return {
        "success": True,
        "scope": scope,
        "state": state,
        "time_range": time_range,
        "rows": rows,
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8082"))
    uvicorn.run("core.competitor_api:app", host="0.0.0.0", port=port, reload=True)
