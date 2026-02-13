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
    get_sales_inventory_trend,
    get_segment_share_of_sales,
    get_inventory_analysis_summary,
    get_inventory_analysis_structure_trends,
    get_inventory_analysis_leaders,
    get_inventory_analysis_top_inventory_holders,
    get_inventory_analysis_overstocked_dealers,
    get_inventory_analysis_understocked_dealers,
    get_inventory_analysis_efficient_managers,
    get_inventory_analysis_opportunity_states,
    get_inventory_analysis_territories,
    get_inventory_analysis_kpis_overview,
    get_inventory_analysis_health,
    get_inventory_analysis_chart_inventory_vs_sales_trend,
    get_inventory_analysis_chart_make_mix,
    get_inventory_analysis_chart_model_mix,
    get_inventory_analysis_chart_inventory_by_state,
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


## @app.get("/inventory_analysis/summary")
## def inventory_analysis_summary(
##     scope: str = "USA",
##     state: Optional[str] = None,
##     time_range: str = "30d",
##     _: None = Depends(_require_basic_auth),
## ):
##     exports_dir = os.getenv("EXPORTS_DIR")
##     data = get_inventory_analysis_summary(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
##     return {
##         "success": True,
##         "scope": scope,
##         "state": state,
##         "time_range": time_range,
##         **(data or {}),
##     }


## @app.get("/inventory_analysis/structure_trends")
## def inventory_analysis_structure_trends(
##     scope: str = "USA",
##     state: Optional[str] = None,
##     time_range: str = "30d",
##     top_n: int = 10,
##     _: None = Depends(_require_basic_auth),
## ):
##     exports_dir = os.getenv("EXPORTS_DIR")
##     data = get_inventory_analysis_structure_trends(
##         scope=scope,
##         state=state,
##         time_range=time_range,
##         exports_dir=exports_dir,
##         top_n=top_n,
##     )
##     return {
##         "success": True,
##         "scope": scope,
##         "state": state,
##         "time_range": time_range,
##         **(data or {}),
##     }


## @app.get("/inventory_analysis/leaders")
## def inventory_analysis_leaders(
##     scope: str = "USA",
##     state: Optional[str] = None,
##     time_range: str = "30d",
##     limit: int = 10,
##     _: None = Depends(_require_basic_auth),
## ):
##     # Deprecated: replaced by per-component endpoints below.
##     exports_dir = os.getenv("EXPORTS_DIR")
##     data = get_inventory_analysis_leaders(
##         scope=scope,
##         state=state,
##         time_range=time_range,
##         exports_dir=exports_dir,
##         limit=limit,
##     )
##     return {
##         "success": True,
##         "scope": scope,
##         "state": state,
##         "time_range": time_range,
##         **(data or {}),
##     }


# ===============================
# Inventory Analysis component APIs start here
# ===============================


@app.get("/inventory_analysis/territories")
def inventory_analysis_territories(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    data = get_inventory_analysis_territories(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    return {
        "success": True,
        "scope": scope,
        "state": state,
        "time_range": time_range,
        **(data or {}),
    }


@app.get("/inventory_analysis/kpis_overview")
def inventory_analysis_kpis_overview(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    data = get_inventory_analysis_kpis_overview(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    return {
        "success": True,
        "scope": scope,
        "state": state,
        "time_range": time_range,
        **(data or {}),
    }


@app.get("/inventory_analysis/health")
def inventory_analysis_health(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    data = get_inventory_analysis_health(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    return {
        "success": True,
        "scope": scope,
        "state": state,
        "time_range": time_range,
        **(data or {}),
    }


@app.get("/inventory_analysis/chart_inventory_vs_sales_trend")
def inventory_analysis_chart_inventory_vs_sales_trend(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    data = get_inventory_analysis_chart_inventory_vs_sales_trend(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    return {
        "success": True,
        "scope": scope,
        "state": state,
        "time_range": time_range,
        **(data or {}),
    }


@app.get("/inventory_analysis/chart_make_mix")
def inventory_analysis_chart_make_mix(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    top_n: int = 10,
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    data = get_inventory_analysis_chart_make_mix(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir, top_n=top_n)
    return {
        "success": True,
        "scope": scope,
        "state": state,
        "time_range": time_range,
        "top_n": top_n,
        **(data or {}),
    }


@app.get("/inventory_analysis/chart_model_mix")
def inventory_analysis_chart_model_mix(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    top_n: int = 10,
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    data = get_inventory_analysis_chart_model_mix(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir, top_n=top_n)
    return {
        "success": True,
        "scope": scope,
        "state": state,
        "time_range": time_range,
        "top_n": top_n,
        **(data or {}),
    }


@app.get("/inventory_analysis/chart_inventory_by_state")
def inventory_analysis_chart_inventory_by_state(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    top_n: int = 12,
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    data = get_inventory_analysis_chart_inventory_by_state(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir, top_n=top_n)
    return {
        "success": True,
        "scope": scope,
        "state": state,
        "time_range": time_range,
        "top_n": top_n,
        **(data or {}),
    }


@app.get("/inventory_analysis/top_inventory_holders")
def inventory_analysis_top_inventory_holders(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    limit: int = 10,
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    data = get_inventory_analysis_top_inventory_holders(
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
        **(data or {}),
    }


@app.get("/inventory_analysis/overstocked_dealers")
def inventory_analysis_overstocked_dealers(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    limit: int = 10,
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    data = get_inventory_analysis_overstocked_dealers(
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
        **(data or {}),
    }


@app.get("/inventory_analysis/understocked_dealers")
def inventory_analysis_understocked_dealers(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    limit: int = 10,
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    data = get_inventory_analysis_understocked_dealers(
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
        **(data or {}),
    }


@app.get("/inventory_analysis/efficient_managers")
def inventory_analysis_efficient_managers(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    limit: int = 10,
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    data = get_inventory_analysis_efficient_managers(
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
        **(data or {}),
    }


@app.get("/inventory_analysis/opportunity_states")
def inventory_analysis_opportunity_states(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    limit: int = 10,
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    data = get_inventory_analysis_opportunity_states(
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
        **(data or {}),
    }


@app.get("/dashboard/sales_inventory_trend")
def dashboard_sales_inventory_trend(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    _: None = Depends(_require_basic_auth),
):
    exports_dir = os.getenv("EXPORTS_DIR")
    rows = get_sales_inventory_trend(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
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
