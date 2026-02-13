from __future__ import annotations

import csv
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple


MONTHS_ORDER = ["Oct", "Nov", "Dec"]

SEGMENT_ORDER = ["SUV", "Sedan", "Truck", "Hatchback", "Coupe", "Wagon", "Convertible", "Van", "Other"]


_CSV_CACHE_LOCK = threading.Lock()
_CSV_CACHE: Dict[str, Tuple[float, List[Dict[str, str]]]] = {}

_FILTER_CACHE_LOCK = threading.Lock()
_FILTER_CACHE: Dict[Tuple[object, ...], object] = {}


def _read_csv_rows_cached(path: Path) -> List[Dict[str, str]]:
    key = str(path)
    mtime = path.stat().st_mtime

    with _CSV_CACHE_LOCK:
        cached = _CSV_CACHE.get(key)
        if cached and cached[0] == mtime:
            return cached[1]

    with path.open("r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    with _CSV_CACHE_LOCK:
        _CSV_CACHE[key] = (mtime, rows)

    return rows


@dataclass(frozen=True)
class DashboardKpis:
    total_dealers: int
    total_sales: float
    active_inventory: float
    inventory_to_sales: float
    avg_sales_per_dealer: float
    sales_velocity: float
    top_make: Optional[str]
    market_share: float


def _repo_root() -> Path:
    # core/ is at repo_root/core
    return Path(__file__).resolve().parents[1]


def _exports_root(exports_dir: Optional[str] = None) -> Path:
    if exports_dir:
        return Path(exports_dir).expanduser().resolve()
    return _repo_root() / "exports"


def _month_dirs(time_range: str) -> List[str]:
    tr = (time_range or "30d").strip().lower()
    if tr in ("30d", "30", "1m"):
        return ["Dec"]
    if tr in ("60d", "60", "2m"):
        return ["Nov", "Dec"]
    if tr in ("3m", "90d"):
        return ["Oct", "Nov", "Dec"]
    # Fallback: safest default is most recent month.
    return ["Dec"]


def _iter_sales_rows(exports_root: Path, months: Iterable[str]) -> Iterable[Dict[str, str]]:
    for m in months:
        p = exports_root / m / "dealer_sales_summary_simple.csv"
        if not p.exists():
            raise FileNotFoundError(f"Missing required file: {p}")
        for row in _read_csv_rows_cached(p):
            yield row


def _iter_make_model_rows(exports_root: Path, months: Iterable[str]) -> Iterable[Dict[str, str]]:
    for m in months:
        p = exports_root / m / "dealer_make_model_summary_simple.csv"
        if not p.exists():
            raise FileNotFoundError(f"Missing required file: {p}")
        for row in _read_csv_rows_cached(p):
            yield row


def _filtered_rows_cache_key(
    kind: str,
    exports_root: Path,
    months: List[str],
    apply_state_filter: bool,
    state_norm: str,
) -> Tuple[object, ...]:
    mtimes: List[Tuple[str, float]] = []
    if kind == "sales":
        for m in months:
            p = exports_root / m / "dealer_sales_summary_simple.csv"
            mtimes.append((str(p), p.stat().st_mtime))
    elif kind == "make_model":
        for m in months:
            p = exports_root / m / "dealer_make_model_summary_simple.csv"
            mtimes.append((str(p), p.stat().st_mtime))
    elif kind == "body_style_map":
        candidates = [
            exports_root / "Make_Model_BodyStyle.csv",
            exports_root / "Dec" / "Make_Model_BodyStyle.csv",
        ]
        path = next((p for p in candidates if p.exists()), None)
        if not path:
            mtimes.append(("__missing__", 0.0))
        else:
            mtimes.append((str(path), path.stat().st_mtime))
    else:
        mtimes.append(("__unknown__", 0.0))

    return (
        kind,
        str(exports_root),
        tuple(months),
        bool(apply_state_filter),
        state_norm or "",
        tuple(mtimes),
    )


def _get_sales_rows_filtered(
    exports_root: Path,
    months: List[str],
    apply_state_filter: bool,
    state_norm: str,
) -> List[Dict[str, str]]:
    key = _filtered_rows_cache_key("sales", exports_root, months, apply_state_filter, state_norm)
    with _FILTER_CACHE_LOCK:
        cached = _FILTER_CACHE.get(key)
        if isinstance(cached, list):
            return cached

    rows: List[Dict[str, str]] = []
    for row in _iter_sales_rows(exports_root, months):
        if apply_state_filter:
            row_state = (row.get("state") or "").strip().upper()
            if not state_norm or row_state != state_norm:
                continue
        rows.append(row)

    with _FILTER_CACHE_LOCK:
        _FILTER_CACHE[key] = rows
    return rows


def _get_make_model_rows_filtered(
    exports_root: Path,
    months: List[str],
    apply_state_filter: bool,
    state_norm: str,
) -> List[Dict[str, str]]:
    key = _filtered_rows_cache_key("make_model", exports_root, months, apply_state_filter, state_norm)
    with _FILTER_CACHE_LOCK:
        cached = _FILTER_CACHE.get(key)
        if isinstance(cached, list):
            return cached

    rows: List[Dict[str, str]] = []
    for row in _iter_make_model_rows(exports_root, months):
        if apply_state_filter:
            row_state = (row.get("state") or "").strip().upper()
            if not state_norm or row_state != state_norm:
                continue
        rows.append(row)

    with _FILTER_CACHE_LOCK:
        _FILTER_CACHE[key] = rows
    return rows


def _to_float(v) -> float:
    try:
        if v is None:
            return 0.0
        s = str(v).strip()
        if s == "":
            return 0.0
        return float(s)
    except Exception:
        return 0.0


def _normalize_segment(v: str) -> str:
    s = (v or "").strip().lower()
    if not s:
        return "Other"
    if "suv" in s or "cuv" in s or "sport utility" in s:
        return "SUV"
    if "sedan" in s:
        return "Sedan"
    if "truck" in s or "pickup" in s:
        return "Truck"
    if "hatch" in s:
        return "Hatchback"
    if "coupe" in s:
        return "Coupe"
    if "wagon" in s:
        return "Wagon"
    if "convert" in s:
        return "Convertible"
    if "van" in s or "minivan" in s:
        return "Van"
    return "Other"


def _load_body_style_map(exports_root: Path) -> Dict[Tuple[str, str], str]:
    # Prefer exports/Make_Model_BodyStyle.csv, fallback to exports/Dec/Make_Model_BodyStyle.csv
    candidates = [
        exports_root / "Make_Model_BodyStyle.csv",
        exports_root / "Dec" / "Make_Model_BodyStyle.csv",
    ]
    path = next((p for p in candidates if p.exists()), None)
    if not path:
        return {}

    key = _filtered_rows_cache_key("body_style_map", exports_root, ["__single__"], False, "")
    with _FILTER_CACHE_LOCK:
        cached = _FILTER_CACHE.get(key)
        if isinstance(cached, dict):
            return cached

    mapping: Dict[Tuple[str, str], str] = {}
    for row in _read_csv_rows_cached(path):
        make = (row.get("make") or row.get("Make") or "").strip()
        model = (row.get("model") or row.get("Model") or "").strip()
        bs = (row.get("bodyStyle") or row.get("BodyStyle") or row.get("body_style") or row.get("Body Style") or "").strip()
        if make and model and bs:
            mapping[(make.lower(), model.lower())] = bs

    with _FILTER_CACHE_LOCK:
        _FILTER_CACHE[key] = mapping
    return mapping


def get_total_sales(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
) -> DashboardKpis:
    """Compute Total Sales KPI.

    Source: exports/<Month>/dealer_sales_summary_simple.csv -> column `total_sales`.

    - scope=USA: all rows
    - scope=State: filter by `state`

    time_range:
    - 30d => Dec only
    - 60d => Nov+Dec
    - 3m => Oct+Nov+Dec
    """

    kpis = get_dashboard_kpis(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    return DashboardKpis(
        total_dealers=kpis.total_dealers,
        total_sales=kpis.total_sales,
        active_inventory=kpis.active_inventory,
        inventory_to_sales=kpis.inventory_to_sales,
        avg_sales_per_dealer=kpis.avg_sales_per_dealer,
        sales_velocity=kpis.sales_velocity,
        top_make=kpis.top_make,
        market_share=kpis.market_share,
    )


def get_dashboard_kpis(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
) -> DashboardKpis:
    """Compute all dashboard header KPIs from exports.

    Dealer-level KPIs come from:
      exports/<Month>/dealer_sales_summary_simple.csv

    Market share is computed as:
      top make's total_sales / overall total_sales, using
      exports/<Month>/dealer_make_model_summary_simple.csv grouped by neo_make.
    """

    exports_root = _exports_root(exports_dir)
    months = _month_dirs(time_range)

    sc = (scope or "USA").strip().lower()
    state_norm = (state or "").strip().upper()
    apply_state_filter = (sc == "state") or bool(state_norm)

    dealer_ids = set()
    total_sales = 0.0
    active_inventory = 0.0

    sales_rows = _get_sales_rows_filtered(exports_root, months, apply_state_filter, state_norm)
    for row in sales_rows:

        dealer_id = (row.get("canonical_dealer_id") or "").strip()
        if dealer_id:
            dealer_ids.add(dealer_id)

        total_sales += _to_float(row.get("total_sales"))
        active_inventory += _to_float(row.get("active_inventory"))

    total_dealers = len(dealer_ids)
    inventory_to_sales = (active_inventory / total_sales) if total_sales > 0 else 0.0
    avg_sales_per_dealer = (total_sales / total_dealers) if total_dealers > 0 else 0.0
    sales_velocity = (total_sales / active_inventory) if active_inventory > 0 else 0.0

    # Market share: top make share of total sales
    make_sales: Dict[str, float] = {}
    mm_rows = _get_make_model_rows_filtered(exports_root, months, apply_state_filter, state_norm)
    for row in mm_rows:
        make = (row.get("neo_make") or row.get("make") or "").strip()
        if not make:
            continue
        make_sales[make] = make_sales.get(make, 0.0) + _to_float(row.get("total_sales"))

    top_make = None
    top_make_sales = 0.0
    for make, s in make_sales.items():
        if s > top_make_sales:
            top_make_sales = s
            top_make = make

    market_share = ((top_make_sales / total_sales) * 100.0) if total_sales > 0 else 0.0

    return DashboardKpis(
        total_dealers=total_dealers,
        total_sales=total_sales,
        active_inventory=active_inventory,
        inventory_to_sales=inventory_to_sales,
        avg_sales_per_dealer=avg_sales_per_dealer,
        sales_velocity=sales_velocity,
        top_make=top_make,
        market_share=market_share,
    )


def get_sales_inventory_trend(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
) -> List[Dict]:
    """Return month-by-month totals for sales and inventory.

    This is used to power the Dashboard 'Sales vs Inventory Trend' chart.

    The returned series follows the same month selection rules as other KPIs:
    - 30d => Dec only
    - 60d => Nov+Dec
    - 3m  => Oct+Nov+Dec
    """

    exports_root = _exports_root(exports_dir)
    months = _month_dirs(time_range)

    sc = (scope or "USA").strip().lower()
    state_norm = (state or "").strip().upper()
    apply_state_filter = (sc == "state") or bool(state_norm)

    totals: Dict[str, Tuple[float, float]] = {}
    for m in months:
        rows = _get_sales_rows_filtered(exports_root, [m], apply_state_filter, state_norm)
        total_sales = 0.0
        active_inventory = 0.0
        for row in rows:
            total_sales += _to_float(row.get("total_sales"))
            active_inventory += _to_float(row.get("active_inventory"))
        totals[m] = (total_sales, active_inventory)

    full_axis = ["Oct", "Nov", "Dec"]
    out: List[Dict] = []
    for label in full_axis:
        if label in totals:
            s, inv = totals[label]
            out.append({"name": label, "sales": s, "inventory": inv})
        else:
            out.append({"name": label, "sales": None, "inventory": None})

    return out


# ===============================
# Inventory Analysis page APIs / functions start here
# ===============================


def _safe_text(v: object) -> str:
    return ("" if v is None else str(v)).strip()


def _pick_first(pipe_list: object) -> str:
    s = _safe_text(pipe_list)
    if not s:
        return ""
    for part in s.split("|"):
        p = part.strip()
        if p:
            return p
    return ""


def _parse_pipe_nums(pipe_list: object) -> List[float]:
    s = _safe_text(pipe_list)
    if not s:
        return []
    out: List[float] = []
    for part in s.split("|"):
        out.append(_to_float(part))
    return out


def _ratio_tone(ratio: float) -> str:
    if ratio < 0.9:
        return "Tight"
    if ratio <= 1.1:
        return "Balanced"
    return "Oversupply"


def _inventory_analysis_dealer_rows(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
) -> List[Dict]:
    exports_root = _exports_root(exports_dir)
    months = _month_dirs(time_range)

    sc = (scope or "USA").strip().lower()
    state_norm = (state or "").strip().upper()
    apply_state_filter = (sc == "state") or bool(state_norm)

    rows = _get_sales_rows_filtered(exports_root, months, apply_state_filter, state_norm)

    dealers = []
    for d in rows:
        sales = _to_float(d.get("total_sales"))
        inv = _to_float(d.get("active_inventory"))
        velocity = (sales / inv) if inv > 0 else 0.0
        ratio = (inv / sales) if sales > 0 else 999999.0
        unique_models = int(_to_float(d.get("unique_models_count")))

        dealer_name = _pick_first(d.get("seller_name")) or _safe_text(d.get("canonical_dealer_id")) or "—"
        city = _safe_text(d.get("city"))
        st = _safe_text(d.get("state"))
        city_state = f"{city}{(', ' + st) if st else ''}".strip() or "—"

        dealers.append(
            {
                "canonical_dealer_id": _safe_text(d.get("canonical_dealer_id")),
                "dealer": dealer_name,
                "cityState": city_state,
                "sales": sales,
                "inventory": inv,
                "inv": inv,
                "ratio": ratio,
                "velocity": velocity,
                "uniqueModels": unique_models,
                "state": st,
            }
        )

    return dealers


def get_inventory_analysis_top_inventory_holders(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
    limit: int = 10,
) -> Dict:
    dealers = _inventory_analysis_dealer_rows(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    top_inventory = sorted(dealers, key=lambda r: float(r.get("inventory") or 0.0), reverse=True)[: max(1, int(limit or 10))]
    max_top_inventory = max([float(r.get("inventory") or 0.0) for r in top_inventory], default=0.0)
    return {"rows": top_inventory, "maxTopInventory": max_top_inventory}


def get_inventory_analysis_overstocked_dealers(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
    limit: int = 10,
) -> Dict:
    dealers = _inventory_analysis_dealer_rows(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    overstocked = [r for r in dealers if float(r.get("sales") or 0.0) > 0 and float(r.get("ratio") or 0.0) > 1.3]
    overstocked.sort(key=lambda r: float(r.get("ratio") or 0.0), reverse=True)
    return {"rows": overstocked[: max(1, int(limit or 10))]}


def get_inventory_analysis_understocked_dealers(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
    limit: int = 10,
) -> Dict:
    dealers = _inventory_analysis_dealer_rows(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    understocked = [r for r in dealers if float(r.get("sales") or 0.0) > 0 and float(r.get("ratio") or 0.0) < 0.7]
    understocked.sort(key=lambda r: float(r.get("ratio") or 0.0))
    return {"rows": understocked[: max(1, int(limit or 10))]}


def get_inventory_analysis_efficient_managers(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
    limit: int = 10,
) -> Dict:
    dealers = _inventory_analysis_dealer_rows(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    # Keep "efficient" distinct from "understocked" / "overstocked" by focusing on near-balanced dealers,
    # then ranking by velocity (sales ÷ inventory).
    efficient = [
        r
        for r in dealers
        if float(r.get("inv") or 0.0) > 0
        and float(r.get("sales") or 0.0) > 0
        and 0.9 <= float(r.get("ratio") or 0.0) <= 1.1
    ]
    efficient.sort(key=lambda r: float(r.get("velocity") or 0.0), reverse=True)
    return {"rows": efficient[: max(1, int(limit or 10))]}


def get_inventory_analysis_opportunity_states(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
    limit: int = 10,
) -> Dict:
    dealers = _inventory_analysis_dealer_rows(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)

    state_map: Dict[str, Dict[str, object]] = {}
    for r in dealers:
        st = (r.get("state") or "").strip().upper() or "Unknown"
        if st == "Unknown":
            continue
        entry = state_map.get(st)
        if not entry:
            entry = {"dealerIds": set(), "sales": 0.0, "inv": 0.0}
            state_map[st] = entry
        did = (r.get("canonical_dealer_id") or "").strip()
        if did:
            entry["dealerIds"].add(did)
        entry["sales"] = float(entry["sales"]) + float(r.get("sales") or 0.0)
        entry["inv"] = float(entry["inv"]) + float(r.get("inv") or 0.0)

    opp_rows = []
    for st, v in state_map.items():
        dealers_count = len(v.get("dealerIds") or [])
        sales = float(v.get("sales") or 0.0)
        inv = float(v.get("inv") or 0.0)
        inv_sales = (inv / sales) if sales > 0 else 0.0
        score = ((sales / dealers_count) * (1 / inv_sales)) if (dealers_count > 0 and sales > 0 and inv_sales > 0) else 0.0
        opp_rows.append({"state": st, "dealers": dealers_count, "invSales": inv_sales, "score": score})
    opp_rows.sort(key=lambda r: float(r.get("score") or 0.0), reverse=True)
    return {"rows": opp_rows[: max(1, int(limit or 10))]}


def get_inventory_analysis_territories(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
) -> Dict:
    exports_root = _exports_root(exports_dir)
    months = _month_dirs(time_range)
    rows = _get_sales_rows_filtered(exports_root, months, False, "")
    state_set = set()
    for row in rows:
        st = (row.get("state") or "").strip().upper()
        if st:
            state_set.add(st)
    return {"states": sorted(state_set)}


def get_inventory_analysis_kpis_overview(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
) -> Dict:
    exports_root = _exports_root(exports_dir)
    months = _month_dirs(time_range)

    sc = (scope or "USA").strip().lower()
    state_norm = (state or "").strip().upper()
    apply_state_filter = (sc == "state") or bool(state_norm)

    sales_rows = _get_sales_rows_filtered(exports_root, months, apply_state_filter, state_norm)

    dealer_ids = set()
    total_sales = 0.0
    total_inventory = 0.0
    total_unique_models = 0.0

    risky = 0
    risky_total = 0

    sum_top_make_conc = 0.0
    top_make_conc_count = 0

    for row in sales_rows:
        dealer_id = (row.get("canonical_dealer_id") or "").strip() or (row.get("mc_dealer_id") or "").strip()
        if dealer_id:
            dealer_ids.add(dealer_id)

        s = _to_float(row.get("total_sales"))
        inv = _to_float(row.get("active_inventory"))
        total_sales += s
        total_inventory += inv
        total_unique_models += _to_float(row.get("unique_models_count"))

        if inv > 0:
            top5_inv = sum(_parse_pipe_nums(row.get("top_5_make_inventory")))
            pct = (top5_inv / inv) * 100.0 if inv > 0 else 0.0
            if 0 <= pct <= 100000:
                sum_top_make_conc += pct
                top_make_conc_count += 1

        if dealer_id and not (inv <= 0 and s <= 0):
            risky_total += 1
            if s > 0 and (inv / s) > 1.3:
                risky += 1

    total_dealers = len(dealer_ids)
    avg_inventory_per_dealer = (total_inventory / total_dealers) if total_dealers > 0 else 0.0
    inv_sales_ratio = (total_inventory / total_sales) if total_sales > 0 else 0.0
    avg_unique_models = (total_unique_models / total_dealers) if total_dealers > 0 else 0.0
    risk_pct = (risky / risky_total) * 100.0 if risky_total > 0 else 0.0
    top_make_conc_pct = (sum_top_make_conc / top_make_conc_count) if top_make_conc_count > 0 else 0.0

    inv_values = [_to_float(r.get("active_inventory")) for r in sales_rows]
    inv_values.sort(reverse=True)
    top_count = max(1, int((len(inv_values) * 0.1) + 0.9999)) if inv_values else 1
    top_inv = sum(inv_values[:top_count]) if inv_values else 0.0
    inv_concentration = (top_inv / total_inventory) * 100.0 if total_inventory > 0 else 0.0

    make_totals: Dict[str, float] = {}
    model_totals: Dict[Tuple[str, str], float] = {}
    segment_totals: Dict[str, float] = {}
    body_style_map = _load_body_style_map(exports_root)

    for row in sales_rows:
        makes = [p.strip() for p in _safe_text(row.get("top_5_makes")).split("|") if p.strip()]
        make_invs = _parse_pipe_nums(row.get("top_5_make_inventory"))
        for i, mk in enumerate(makes):
            make_totals[mk] = make_totals.get(mk, 0.0) + (make_invs[i] if i < len(make_invs) else 0.0)

        models = [p.strip() for p in _safe_text(row.get("top_5_models")).split("|") if p.strip()]
        model_invs = _parse_pipe_nums(row.get("top_5_model_inventory"))
        for i, mdl in enumerate(models):
            mk = makes[i] if i < len(makes) else ""
            inv = model_invs[i] if i < len(model_invs) else 0.0
            if mk and mdl:
                model_totals[(mk, mdl)] = model_totals.get((mk, mdl), 0.0) + inv
            bs = body_style_map.get((mk.lower(), mdl.lower()), "Other") if mk and mdl else "Other"
            seg = _normalize_segment(bs)
            segment_totals[seg] = segment_totals.get(seg, 0.0) + inv

    top_make = max(make_totals.items(), key=lambda kv: kv[1])[0] if make_totals else None
    top_segment = max(segment_totals.items(), key=lambda kv: kv[1])[0] if segment_totals else None

    market_summary = (
        f"The market consists of {total_dealers:,} active dealers with {int(round(total_sales)):,} vehicles sold and "
        f"{int(round(total_inventory)):,} units in stock."
    )

    return {
        "totalDealers": total_dealers,
        "totalSales": total_sales,
        "totalInventory": total_inventory,
        "avgInventoryPerDealer": avg_inventory_per_dealer,
        "invSalesRatio": inv_sales_ratio,
        "avgUniqueModels": avg_unique_models,
        "riskDealersPct": risk_pct,
        "topMakeConcentrationPct": top_make_conc_pct,
        "inventoryConcentrationPct": inv_concentration,
        "marketSummary": market_summary,
        "topMake": top_make,
        "topSegment": top_segment,
    }


def get_inventory_analysis_health(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
) -> Dict:
    dealers = _inventory_analysis_dealer_rows(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    health_under = 0
    health_bal = 0
    health_over = 0
    health_total = 0

    for r in dealers:
        inv = float(r.get("inv") or 0.0)
        sales = float(r.get("sales") or 0.0)
        if inv == 0 and sales == 0:
            continue
        ratio = (inv / sales) if sales > 0 else 999999.0
        if ratio < 0.9:
            health_under += 1
        elif ratio > 1.1:
            health_over += 1
        else:
            health_bal += 1
        health_total += 1

    health_total_safe = health_total or 1
    return {
        "dealerHealth": {
            "understock": health_under,
            "balanced": health_bal,
            "overstock": health_over,
            "understockPct": (health_under / health_total_safe) * 100.0,
            "balancedPct": (health_bal / health_total_safe) * 100.0,
            "overstockPct": (health_over / health_total_safe) * 100.0,
        }
    }


def get_inventory_analysis_chart_inventory_vs_sales_trend(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
) -> Dict:
    exports_root = _exports_root(exports_dir)
    months = _month_dirs(time_range)

    sc = (scope or "USA").strip().lower()
    state_norm = (state or "").strip().upper()
    apply_state_filter = (sc == "state") or bool(state_norm)

    trend = []
    for m in months:
        rows = _get_sales_rows_filtered(exports_root, [m], apply_state_filter, state_norm)
        inv = 0.0
        sales = 0.0
        for r in rows:
            inv += _to_float(r.get("active_inventory"))
            sales += _to_float(r.get("total_sales"))
        trend.append({"date": m, "inventory": inv, "sales": sales})
    return {"inventoryVsSalesTrend": trend}


def get_inventory_analysis_chart_make_mix(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
    top_n: int = 10,
) -> Dict:
    exports_root = _exports_root(exports_dir)
    months = _month_dirs(time_range)

    sc = (scope or "USA").strip().lower()
    state_norm = (state or "").strip().upper()
    apply_state_filter = (sc == "state") or bool(state_norm)

    sales_rows = _get_sales_rows_filtered(exports_root, months, apply_state_filter, state_norm)
    make_totals: Dict[str, float] = {}
    for row in sales_rows:
        makes = [p.strip() for p in _safe_text(row.get("top_5_makes")).split("|") if p.strip()]
        make_invs = _parse_pipe_nums(row.get("top_5_make_inventory"))
        for i, mk in enumerate(makes):
            make_totals[mk] = make_totals.get(mk, 0.0) + (make_invs[i] if i < len(make_invs) else 0.0)

    items = sorted(make_totals.items(), key=lambda kv: kv[1], reverse=True)[: max(1, int(top_n or 10))]
    out = [{"name": k, "value": v} for k, v in items]
    return {"makeMix": out}


def get_inventory_analysis_chart_model_mix(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
    top_n: int = 10,
) -> Dict:
    exports_root = _exports_root(exports_dir)
    months = _month_dirs(time_range)

    sc = (scope or "USA").strip().lower()
    state_norm = (state or "").strip().upper()
    apply_state_filter = (sc == "state") or bool(state_norm)

    sales_rows = _get_sales_rows_filtered(exports_root, months, apply_state_filter, state_norm)
    model_totals: Dict[str, float] = {}
    for row in sales_rows:
        models = [p.strip() for p in _safe_text(row.get("top_5_models")).split("|") if p.strip()]
        model_invs = _parse_pipe_nums(row.get("top_5_model_inventory"))
        for i, mdl in enumerate(models):
            model_totals[mdl] = model_totals.get(mdl, 0.0) + (model_invs[i] if i < len(model_invs) else 0.0)

    items = sorted(model_totals.items(), key=lambda kv: kv[1], reverse=True)[: max(1, int(top_n or 10))]
    out = [{"name": k, "value": v} for k, v in items]
    return {"modelMix": out}


def get_inventory_analysis_chart_inventory_by_state(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
    top_n: int = 12,
) -> Dict:
    dealers = _inventory_analysis_dealer_rows(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    state_map: Dict[str, Dict[str, float]] = {}
    for r in dealers:
        st = (r.get("state") or "").strip().upper()
        if not st:
            continue
        entry = state_map.get(st)
        if not entry:
            entry = {"inventory": 0.0, "sales": 0.0}
            state_map[st] = entry
        entry["inventory"] += float(r.get("inv") or 0.0)
        entry["sales"] += float(r.get("sales") or 0.0)

    rows = [{"name": st, "inventory": v["inventory"], "sales": v["sales"]} for st, v in state_map.items()]
    rows.sort(key=lambda r: float(r.get("inventory") or 0.0), reverse=True)
    return {"inventoryVsSalesByState": rows[: max(1, int(top_n or 12))]}


def get_inventory_analysis_summary(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
) -> Dict:
    exports_root = _exports_root(exports_dir)
    months = _month_dirs(time_range)

    sc = (scope or "USA").strip().lower()
    state_norm = (state or "").strip().upper()
    apply_state_filter = (sc == "state") or bool(state_norm)

    sales_rows = _get_sales_rows_filtered(exports_root, months, apply_state_filter, state_norm)

    dealer_ids = set()
    total_sales = 0.0
    total_inventory = 0.0
    total_unique_models = 0.0

    # Inventory health buckets
    health_under = 0
    health_bal = 0
    health_over = 0
    health_total = 0

    risky = 0
    risky_total = 0

    # For top-make concentration metric: avg over dealers of (top-5-make-inventory / inventory)
    sum_top_make_conc = 0.0
    top_make_conc_count = 0

    state_set = set()

    for row in sales_rows:
        dealer_id = (row.get("canonical_dealer_id") or "").strip() or (row.get("mc_dealer_id") or "").strip()
        if dealer_id:
            dealer_ids.add(dealer_id)

        st = (row.get("state") or "").strip().upper()
        if st:
            state_set.add(st)

        s = _to_float(row.get("total_sales"))
        inv = _to_float(row.get("active_inventory"))
        total_sales += s
        total_inventory += inv
        total_unique_models += _to_float(row.get("unique_models_count"))

        if inv > 0:
            top5_inv = sum(_parse_pipe_nums(row.get("top_5_make_inventory")))
            pct = (top5_inv / inv) * 100.0 if inv > 0 else 0.0
            if pct >= 0 and pct <= 100000:
                sum_top_make_conc += pct
                top_make_conc_count += 1

        if inv == 0 and s == 0:
            continue

        ratio = (inv / s) if s > 0 else 999999.0
        if ratio < 0.9:
            health_under += 1
        elif ratio > 1.1:
            health_over += 1
        else:
            health_bal += 1
        health_total += 1

        if dealer_id and not (inv <= 0 and s <= 0):
            risky_total += 1
            if s > 0 and (inv / s) > 1.3:
                risky += 1

    total_dealers = len(dealer_ids)
    avg_inventory_per_dealer = (total_inventory / total_dealers) if total_dealers > 0 else 0.0
    inv_sales_ratio = (total_inventory / total_sales) if total_sales > 0 else 0.0
    avg_unique_models = (total_unique_models / total_dealers) if total_dealers > 0 else 0.0
    risk_pct = (risky / risky_total) * 100.0 if risky_total > 0 else 0.0
    top_make_conc_pct = (sum_top_make_conc / top_make_conc_count) if top_make_conc_count > 0 else 0.0

    health_total_safe = health_total or 1
    dealer_health = {
        "understock": health_under,
        "balanced": health_bal,
        "overstock": health_over,
        "understockPct": (health_under / health_total_safe) * 100.0,
        "balancedPct": (health_bal / health_total_safe) * 100.0,
        "overstockPct": (health_over / health_total_safe) * 100.0,
    }

    # Inventory concentration: top 10% dealers hold what % of total inventory?
    inv_values = []
    for row in sales_rows:
        inv_values.append(_to_float(row.get("active_inventory")))
    inv_values.sort(reverse=True)
    top_count = max(1, int((len(inv_values) * 0.1) + 0.9999)) if inv_values else 1
    top_inv = sum(inv_values[:top_count]) if inv_values else 0.0
    inv_concentration = (top_inv / total_inventory) * 100.0 if total_inventory > 0 else 0.0

    # Top make + top segment (inventory) from dealer rows (uses top_5* fields)
    make_totals: Dict[str, float] = {}
    model_totals: Dict[Tuple[str, str], float] = {}
    segment_totals: Dict[str, float] = {}
    body_style_map = _load_body_style_map(exports_root)

    for row in sales_rows:
        makes = [p.strip() for p in _safe_text(row.get("top_5_makes")).split("|") if p.strip()]
        make_invs = _parse_pipe_nums(row.get("top_5_make_inventory"))
        for i, mk in enumerate(makes):
            make_totals[mk] = make_totals.get(mk, 0.0) + (make_invs[i] if i < len(make_invs) else 0.0)

        models = [p.strip() for p in _safe_text(row.get("top_5_models")).split("|") if p.strip()]
        model_invs = _parse_pipe_nums(row.get("top_5_model_inventory"))
        for i, mdl in enumerate(models):
            mk = makes[i] if i < len(makes) else ""
            inv = model_invs[i] if i < len(model_invs) else 0.0
            if mk and mdl:
                model_totals[(mk, mdl)] = model_totals.get((mk, mdl), 0.0) + inv
            # segment from body style mapping
            bs = body_style_map.get((mk.lower(), mdl.lower()), "Other") if mk and mdl else "Other"
            seg = _normalize_segment(bs)
            segment_totals[seg] = segment_totals.get(seg, 0.0) + inv

    top_make = max(make_totals.items(), key=lambda kv: kv[1])[0] if make_totals else None
    top_segment = max(segment_totals.items(), key=lambda kv: kv[1])[0] if segment_totals else None

    pressure_label = _ratio_tone(inv_sales_ratio)

    market_summary = (
        f"The market consists of {total_dealers:,} active dealers with {int(round(total_sales)):,} vehicles sold and "
        f"{int(round(total_inventory)):,} units in stock."
    )

    return {
        "totalDealers": total_dealers,
        "totalSales": total_sales,
        "totalInventory": total_inventory,
        "avgInventoryPerDealer": avg_inventory_per_dealer,
        "invSalesRatio": inv_sales_ratio,
        "avgUniqueModels": avg_unique_models,
        "riskDealersPct": risk_pct,
        "topMakeConcentrationPct": top_make_conc_pct,
        "inventoryConcentrationPct": inv_concentration,
        "dealerHealth": dealer_health,
        "pressureLabel": pressure_label,
        "marketSummary": market_summary,
        "topMake": top_make,
        "topSegment": top_segment,
        "states": sorted(state_set),
    }


def get_inventory_analysis_structure_trends(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
    top_n: int = 10,
) -> Dict:
    exports_root = _exports_root(exports_dir)
    months = _month_dirs(time_range)

    sc = (scope or "USA").strip().lower()
    state_norm = (state or "").strip().upper()
    apply_state_filter = (sc == "state") or bool(state_norm)

    # Inventory vs sales trend (aggregate per month)
    trend = []
    for m in months:
        rows = _get_sales_rows_filtered(exports_root, [m], apply_state_filter, state_norm)
        inv = 0.0
        sales = 0.0
        for r in rows:
            inv += _to_float(r.get("active_inventory"))
            sales += _to_float(r.get("total_sales"))
        trend.append({"date": m, "inventory": inv, "sales": sales})

    # Mix charts from dealer rows using top_5 fields (inventory)
    make_totals: Dict[str, float] = {}
    model_totals: Dict[str, float] = {}
    segment_totals: Dict[str, float] = {}
    body_style_map = _load_body_style_map(exports_root)

    sales_rows = _get_sales_rows_filtered(exports_root, months, apply_state_filter, state_norm)
    for row in sales_rows:
        makes = [p.strip() for p in _safe_text(row.get("top_5_makes")).split("|") if p.strip()]
        make_invs = _parse_pipe_nums(row.get("top_5_make_inventory"))
        for i, mk in enumerate(makes):
            make_totals[mk] = make_totals.get(mk, 0.0) + (make_invs[i] if i < len(make_invs) else 0.0)

        models = [p.strip() for p in _safe_text(row.get("top_5_models")).split("|") if p.strip()]
        model_invs = _parse_pipe_nums(row.get("top_5_model_inventory"))
        for i, mdl in enumerate(models):
            inv = model_invs[i] if i < len(model_invs) else 0.0
            model_totals[mdl] = model_totals.get(mdl, 0.0) + inv

            mk = makes[i] if i < len(makes) else ""
            bs = body_style_map.get((mk.lower(), mdl.lower()), "Other") if mk and mdl else "Other"
            seg = _normalize_segment(bs)
            segment_totals[seg] = segment_totals.get(seg, 0.0) + inv

    make_mix = sorted(
        [{"name": k, "value": v} for k, v in make_totals.items()], key=lambda r: float(r.get("value") or 0.0), reverse=True
    )[: max(1, int(top_n or 10))]
    model_mix = sorted(
        [{"name": k, "value": v} for k, v in model_totals.items()], key=lambda r: float(r.get("value") or 0.0), reverse=True
    )[: max(1, int(top_n or 10))]
    segment_mix = [{"name": seg, "value": segment_totals.get(seg, 0.0)} for seg in SEGMENT_ORDER]

    # Inventory vs sales by state
    by_state: Dict[str, Dict[str, float]] = {}
    for row in sales_rows:
        st = (row.get("state") or "").strip().upper()
        if not st:
            continue
        cur = by_state.get(st)
        if not cur:
            cur = {"inventory": 0.0, "sales": 0.0}
            by_state[st] = cur
        cur["inventory"] = float(cur["inventory"]) + _to_float(row.get("active_inventory"))
        cur["sales"] = float(cur["sales"]) + _to_float(row.get("total_sales"))

    by_state_rows = [
        {"name": st, "inventory": float(v.get("inventory") or 0.0), "sales": float(v.get("sales") or 0.0)}
        for st, v in by_state.items()
    ]
    by_state_rows.sort(key=lambda r: float(r.get("inventory") or 0.0), reverse=True)

    return {
        "inventoryVsSalesTrend": trend,
        "makeMix": make_mix,
        "modelMix": model_mix,
        "segmentMix": segment_mix,
        "inventoryVsSalesByState": by_state_rows[:12],
    }


def get_inventory_analysis_leaders(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
    limit: int = 10,
) -> Dict:
    exports_root = _exports_root(exports_dir)
    months = _month_dirs(time_range)

    sc = (scope or "USA").strip().lower()
    state_norm = (state or "").strip().upper()
    apply_state_filter = (sc == "state") or bool(state_norm)

    rows = _get_sales_rows_filtered(exports_root, months, apply_state_filter, state_norm)

    dealers = []
    for d in rows:
        sales = _to_float(d.get("total_sales"))
        inv = _to_float(d.get("active_inventory"))
        velocity = (sales / inv) if inv > 0 else 0.0
        ratio = (inv / sales) if sales > 0 else 999999.0
        unique_models = int(_to_float(d.get("unique_models_count")))

        dealer_name = _pick_first(d.get("seller_name")) or _safe_text(d.get("canonical_dealer_id")) or "—"
        city = _safe_text(d.get("city"))
        st = _safe_text(d.get("state"))
        city_state = f"{city}{(', ' + st) if st else ''}".strip() or "—"

        dealers.append(
            {
                "canonical_dealer_id": _safe_text(d.get("canonical_dealer_id")),
                "dealer": dealer_name,
                "cityState": city_state,
                "sales": sales,
                "inventory": inv,
                "inv": inv,
                "ratio": ratio,
                "velocity": velocity,
                "uniqueModels": unique_models,
                "state": st,
            }
        )

    # Top inventory holders
    top_inventory = sorted(dealers, key=lambda r: float(r.get("inventory") or 0.0), reverse=True)[: max(1, int(limit or 10))]
    max_top_inventory = max([float(r.get("inventory") or 0.0) for r in top_inventory], default=0.0)

    # Overstocked dealers (Inv/Sales > 1.3)
    overstocked = [r for r in dealers if float(r.get("sales") or 0.0) > 0 and float(r.get("ratio") or 0.0) > 1.3]
    overstocked.sort(key=lambda r: float(r.get("ratio") or 0.0), reverse=True)
    overstocked = overstocked[: max(1, int(limit or 10))]

    # Efficient inventory managers (highest sales/inv)
    efficient = [r for r in dealers if float(r.get("inv") or 0.0) > 0]
    efficient.sort(key=lambda r: float(r.get("velocity") or 0.0), reverse=True)
    efficient = efficient[: max(1, int(limit or 10))]

    # Opportunity by state (same logic as InventoryAnalysis.jsx)
    state_map: Dict[str, Dict[str, object]] = {}
    for r in dealers:
        st = (r.get("state") or "").strip().upper() or "Unknown"
        if st == "Unknown":
            continue
        entry = state_map.get(st)
        if not entry:
            entry = {"dealerIds": set(), "sales": 0.0, "inv": 0.0}
            state_map[st] = entry
        did = (r.get("canonical_dealer_id") or "").strip()
        if did:
            entry["dealerIds"].add(did)
        entry["sales"] = float(entry["sales"]) + float(r.get("sales") or 0.0)
        entry["inv"] = float(entry["inv"]) + float(r.get("inv") or 0.0)

    opp_rows = []
    for st, v in state_map.items():
        dealers_count = len(v.get("dealerIds") or [])
        sales = float(v.get("sales") or 0.0)
        inv = float(v.get("inv") or 0.0)
        inv_sales = (inv / sales) if sales > 0 else 0.0
        score = ((sales / dealers_count) * (1 / inv_sales)) if (dealers_count > 0 and sales > 0 and inv_sales > 0) else 0.0
        opp_rows.append({"state": st, "dealers": dealers_count, "invSales": inv_sales, "score": score})
    opp_rows.sort(key=lambda r: float(r.get("score") or 0.0), reverse=True)
    opp_rows = opp_rows[: max(1, int(limit or 10))]

    return {
        "topInventoryHolders": top_inventory,
        "overstockedDealers": overstocked,
        "efficientManagers": efficient,
        "opportunityStates": opp_rows,
        "maxTopInventory": max_top_inventory,
    }


def get_top_market_leaders(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
    limit: int = 10,
) -> List[Dict]:
    exports_root = _exports_root(exports_dir)
    months_all = _month_dirs(time_range)

    last_month = months_all[-1] if months_all else "Dec"
    months_last30 = [last_month]
    months_last3m = months_all[-3:] if len(months_all) >= 3 else (months_all if months_all else [last_month])

    prev_month = None
    if last_month == "Dec":
        prev_month = "Nov"
    elif last_month == "Nov":
        prev_month = "Oct"
    elif len(months_all) > 1:
        prev_month = months_all[-2]

    sc = (scope or "USA").strip().lower()
    state_norm = (state or "").strip().upper()
    apply_state_filter = (sc == "state") or bool(state_norm)

    def load_totals(months: List[str]) -> Dict[str, Dict[str, object]]:
        totals: Dict[str, Dict[str, object]] = {}
        sales_rows = _get_sales_rows_filtered(exports_root, months, apply_state_filter, state_norm)
        for row in sales_rows:
            dealer_id = (row.get("canonical_dealer_id") or "").strip() or (row.get("mc_dealer_id") or "").strip()
            if not dealer_id:
                continue

            cur = totals.get(dealer_id)
            if not cur:
                cur = {
                    "dealer_id": dealer_id,
                    "dealer_name": (row.get("seller_name") or "").strip(),
                    "city": (row.get("city") or "").strip(),
                    "state": (row.get("state") or "").strip(),
                    "make": "",
                    "total_sales": 0.0,
                    "active_inventory": 0.0,
                    "unique_models": 0.0,
                }
                totals[dealer_id] = cur

            if not cur.get("make"):
                makes_raw = (row.get("top_5_makes") or "").strip()
                first_make = makes_raw.split("|")[0].split(",")[0].strip() if makes_raw else ""
                cur["make"] = first_make

            cur["total_sales"] = float(cur["total_sales"]) + _to_float(row.get("total_sales"))
            cur["active_inventory"] = float(cur["active_inventory"]) + _to_float(row.get("active_inventory"))
            cur["unique_models"] = max(float(cur["unique_models"]), _to_float(row.get("unique_models_count")))

        return totals

    totals_all = load_totals(months_all)
    totals_last30 = load_totals(months_last30)
    totals_last3m = load_totals(months_last3m)
    totals_prev = load_totals([prev_month]) if prev_month else {}

    leaders = list(totals_all.values())
    leaders.sort(key=lambda d: float(d.get("total_sales") or 0.0), reverse=True)
    leaders = leaders[: max(1, int(limit or 10))]

    out = []
    for d in leaders:
        dealer_id = (d.get("dealer_id") or "").strip()
        inv = float(d.get("active_inventory") or 0.0)
        sales = float(d.get("total_sales") or 0.0)
        sales_last30 = float((totals_last30.get(dealer_id) or {}).get("total_sales") or 0.0)
        sales_last3m = float((totals_last3m.get(dealer_id) or {}).get("total_sales") or 0.0)
        sales_prev = float((totals_prev.get(dealer_id) or {}).get("total_sales") or 0.0)
        mom = ((sales_last30 - sales_prev) / sales_prev * 100.0) if sales_prev > 0 else 0.0
        out.append(
            {
                "dealerName": d.get("dealer_name") or d.get("dealer_id"),
                "make": d.get("make") or "",
                "location": f"{d.get('city')}, {d.get('state')}",
                "totalSales": sales,
                "mom": mom,
                "last30": sales_last30,
                "last3m": sales_last3m,
                "activeInventory": inv,
                "uniqueModels": int(float(d.get("unique_models") or 0.0)),
                "salesVelocity": (sales / inv) if inv > 0 else 0.0,
            }
        )
    return out


def get_top_selling_models(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
    top_models: int = 20,
    top_makes: int = 10,
) -> Dict[str, List[Dict]]:
    """Return top makes + top make-model rows.

    - last_30_days: Dec
    - last_3_months: Oct+Nov+Dec
    - mom: (Dec - Nov) / Nov * 100 when Nov exists
    """

    exports_root = _exports_root(exports_dir)
    sc = (scope or "USA").strip().lower()
    state_norm = (state or "").strip().upper()
    apply_state_filter = (sc == "state") or bool(state_norm)

    months_all = _month_dirs(time_range)
    last_month = months_all[-1] if months_all else "Dec"
    months_last30 = [last_month]
    months_last3m = months_all if months_all else [last_month]

    prev_month = None
    if last_month == "Dec":
        prev_month = "Nov"
    elif last_month == "Nov":
        prev_month = "Oct"
    elif len(months_all) > 1:
        prev_month = months_all[-2]

    def load_make_model_totals(months: List[str]) -> Tuple[Dict[str, float], Dict[Tuple[str, str], float]]:
        make_totals: Dict[str, float] = {}
        model_totals: Dict[Tuple[str, str], float] = {}
        mm_rows = _get_make_model_rows_filtered(exports_root, months, apply_state_filter, state_norm)
        for row in mm_rows:
            make = (row.get("neo_make") or row.get("make") or "").strip()
            model = (row.get("neo_model") or row.get("model") or "").strip()
            if not make or not model:
                continue
            sales = _to_float(row.get("total_sales"))
            make_totals[make] = make_totals.get(make, 0.0) + sales
            key = (make, model)
            model_totals[key] = model_totals.get(key, 0.0) + sales
        return make_totals, model_totals

    makes_30, models_30 = load_make_model_totals(months_last30)
    makes_3m, models_3m = load_make_model_totals(months_last3m)
    models_prev: Dict[Tuple[str, str], float] = {}
    if prev_month:
        _, models_prev = load_make_model_totals([prev_month])

    top_makes_rows = [
        {"name": k, "value": v}
        for k, v in sorted(makes_30.items(), key=lambda kv: kv[1], reverse=True)[: max(1, int(top_makes or 8))]
    ]

    rows = []
    for (make, model), dec_sales in models_30.items():
        last30 = dec_sales
        last3m = models_3m.get((make, model), dec_sales)
        prev_sales = models_prev.get((make, model), 0.0)
        mom = ((last30 - prev_sales) / prev_sales * 100.0) if prev_sales > 0 else 0.0
        rows.append(
            {
                "key": f"{make} {model}",
                "make": make,
                "model": model,
                "units": last30,
                "mom": mom,
                "last30": last30,
                "last3m": last3m,
            }
        )
    rows.sort(key=lambda r: float(r.get("units") or 0.0), reverse=True)
    rows = rows[: max(1, int(top_models or 8))]

    return {"topMakes": top_makes_rows, "models": rows}


def get_fastest_rising_dealers(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
    limit: int = 10,
) -> List[Dict]:
    exports_root = _exports_root(exports_dir)
    months = _month_dirs(time_range)

    sc = (scope or "USA").strip().lower()
    state_norm = (state or "").strip().upper()
    apply_state_filter = (sc == "state") or bool(state_norm)

    by_dealer: Dict[str, Dict[str, object]] = {}

    sales_rows = _get_sales_rows_filtered(exports_root, months, apply_state_filter, state_norm)
    for row in sales_rows:

        dealer_id = (row.get("canonical_dealer_id") or "").strip() or (row.get("mc_dealer_id") or "").strip()
        if not dealer_id:
            continue

        cur = by_dealer.get(dealer_id)
        if not cur:
            cur = {
                "dealer_id": dealer_id,
                "dealerName": (row.get("seller_name") or "").strip() or dealer_id,
                "location": f"{(row.get('city') or '').strip()}, {(row.get('state') or '').strip()}".strip(", "),
                "confirmed": 0.0,
                "potential": 0.0,
                "totalSales": 0.0,
            }
            by_dealer[dealer_id] = cur

        cur["confirmed"] = float(cur["confirmed"]) + _to_float(row.get("confirmed_sales"))
        cur["potential"] = float(cur["potential"]) + _to_float(row.get("potential_sales"))
        cur["totalSales"] = float(cur["totalSales"]) + _to_float(row.get("total_sales"))

    rows = []
    for d in by_dealer.values():
        confirmed = float(d.get("confirmed") or 0.0)
        potential = float(d.get("potential") or 0.0)
        growth = potential - confirmed
        pct_growth = ((growth / confirmed) * 100.0) if confirmed > 0 else 0.0
        rows.append(
            {
                "dealerName": d.get("dealerName"),
                "location": d.get("location"),
                "totalSales": float(d.get("totalSales") or 0.0),
                "growth": growth,
                "pctGrowth": pct_growth,
            }
        )

    rows.sort(key=lambda r: float(r.get("growth") or 0.0), reverse=True)
    return rows[: max(1, int(limit or 10))]


def get_segment_share_of_sales(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
) -> List[Dict]:
    exports_root = _exports_root(exports_dir)
    months = _month_dirs(time_range)

    sc = (scope or "USA").strip().lower()
    state_norm = (state or "").strip().upper()
    apply_state_filter = (sc == "state") or bool(state_norm)

    body_style_map = _load_body_style_map(exports_root)
    totals: Dict[str, float] = {}

    mm_rows = _get_make_model_rows_filtered(exports_root, months, apply_state_filter, state_norm)
    for row in mm_rows:

        make = (row.get("neo_make") or row.get("make") or "").strip()
        model = (row.get("neo_model") or row.get("model") or "").strip()
        if not make or not model:
            continue

        bs = body_style_map.get((make.lower(), model.lower()), "Other")
        seg = _normalize_segment(bs)
        totals[seg] = totals.get(seg, 0.0) + _to_float(row.get("total_sales"))

    total = sum(totals.values()) or 1.0
    out = []
    for seg in SEGMENT_ORDER:
        v = totals.get(seg, 0.0)
        out.append({"segment": seg, "value": v, "share": (v / total) * 100.0})
    return out


def get_dashboard_insights(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
) -> Dict:
    exports_root = _exports_root(exports_dir)
    months = _month_dirs(time_range)

    sc = (scope or "USA").strip().lower()
    state_norm = (state or "").strip().upper()
    apply_state_filter = (sc == "state") or bool(state_norm)

    cache_key = (
        "dashboard_insights",
        _filtered_rows_cache_key("sales", exports_root, months, apply_state_filter, state_norm),
        _filtered_rows_cache_key("make_model", exports_root, months, apply_state_filter, state_norm),
        _filtered_rows_cache_key("body_style_map", exports_root, ["__single__"], False, ""),
    )
    with _FILTER_CACHE_LOCK:
        cached = _FILTER_CACHE.get(cache_key)
        if isinstance(cached, dict):
            return cached

    # Market concentration (top 10% dealer share of sales)
    dealer_sales: Dict[str, float] = {}
    dealer_states: Dict[str, str] = {}
    total_sales = 0.0
    sales_rows = _get_sales_rows_filtered(exports_root, months, apply_state_filter, state_norm)
    for row in sales_rows:

        dealer_id = (row.get("canonical_dealer_id") or "").strip() or (row.get("mc_dealer_id") or "").strip()
        if not dealer_id:
            continue
        s = _to_float(row.get("total_sales"))
        total_sales += s
        dealer_sales[dealer_id] = dealer_sales.get(dealer_id, 0.0) + s
        st = (row.get("state") or "").strip().upper()
        if st:
            dealer_states[dealer_id] = st

    concentration = 0.0
    if dealer_sales and total_sales > 0:
        values = sorted(dealer_sales.values(), reverse=True)
        top_count = max(1, int((len(values) * 0.1) + 0.9999))
        top_sales = sum(values[:top_count])
        concentration = (top_sales / total_sales) * 100.0

    # Top make trends (MoM based on Nov vs Dec when available)
    def _make_totals_for_month(month: str) -> Tuple[Dict[str, float], float]:
        totals: Dict[str, float] = {}
        total = 0.0
        mm_rows = _get_make_model_rows_filtered(exports_root, [month], apply_state_filter, state_norm)
        for row in mm_rows:
            make = (row.get("neo_make") or row.get("make") or "").strip() or "Unknown"
            v = _to_float(row.get("total_sales"))
            totals[make] = totals.get(make, 0.0) + v
            total += v
        return totals, total

    latest_month = months[-1] if months else "Dec"
    prev_month = "Nov" if latest_month == "Dec" else (months[-2] if len(months) > 1 else None)

    latest_totals, latest_total = _make_totals_for_month(latest_month)
    prev_totals: Dict[str, float] = {}
    if prev_month:
        prev_totals, _ = _make_totals_for_month(prev_month)

    make_trends = []
    for make, val in latest_totals.items():
        prev = prev_totals.get(make, 0.0)
        mom = ((val - prev) / prev * 100.0) if prev > 0 else 0.0
        share = (val / latest_total * 100.0) if latest_total > 0 else 0.0
        make_trends.append({"name": make, "value": val, "share": share, "mom": mom})
    make_trends.sort(key=lambda r: float(r.get("value") or 0.0), reverse=True)
    make_trends = make_trends[:6]

    focus_make = make_trends[0] if make_trends else None

    # Segment highlights (current share + growing/declining MoM)
    def _segment_share_for_month(month: str) -> Dict[str, float]:
        body_style_map = _load_body_style_map(exports_root)
        totals: Dict[str, float] = {}
        mm_rows = _get_make_model_rows_filtered(exports_root, [month], apply_state_filter, state_norm)
        for row in mm_rows:

            make = (row.get("neo_make") or row.get("make") or "").strip()
            model = (row.get("neo_model") or row.get("model") or "").strip()
            if not make or not model:
                continue

            bs = body_style_map.get((make.lower(), model.lower()), "Other")
            seg = _normalize_segment(bs)
            totals[seg] = totals.get(seg, 0.0) + _to_float(row.get("total_sales"))

        total = sum(totals.values()) or 1.0
        return {seg: (totals.get(seg, 0.0) / total) * 100.0 for seg in SEGMENT_ORDER}

    # Current segment share for the latest month
    seg_map_now = _segment_share_for_month(latest_month)
    top_segment = max(seg_map_now.items(), key=lambda kv: kv[1])[0] if seg_map_now else None

    growing_segment = None
    declining_segment = None
    if prev_month:
        seg_prev_map = _segment_share_for_month(prev_month)
        deltas = []
        for seg in SEGMENT_ORDER:
            deltas.append((seg, seg_map_now.get(seg, 0.0) - seg_prev_map.get(seg, 0.0)))
        deltas.sort(key=lambda x: x[1], reverse=True)
        growing_segment = deltas[0][0] if deltas else None
        declining_segment = deltas[-1][0] if deltas else None

    # Opportunity state (simple score: sales / inv_to_sales)
    state_totals: Dict[str, Dict[str, float]] = {}
    for row in sales_rows:
        st = (row.get("state") or "").strip().upper() or "Unknown"
        entry = state_totals.get(st) or {"sales": 0.0, "inv": 0.0}
        entry["sales"] += _to_float(row.get("total_sales"))
        entry["inv"] += _to_float(row.get("active_inventory"))
        state_totals[st] = entry

    top_opportunity_state = None
    best_score = None
    for st, v in state_totals.items():
        sales = float(v.get("sales") or 0.0)
        inv = float(v.get("inv") or 0.0)
        ratio = (inv / sales) if sales > 0 else 999999.0
        score = sales / max(0.25, ratio)
        if best_score is None or score > best_score:
            best_score = score
            top_opportunity_state = st

    # Comparisons (no YoY source available in exports; keep placeholders)
    kpis = get_dashboard_kpis(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    comparisons = {
        "currentSales": kpis.total_sales,
        "lastYearSales": kpis.total_sales,
        "yoyAbs": 0.0,
        "yoyPct": 0.0,
    }

    result = {
        "concentration": concentration,
        "make_trends": make_trends,
        "focus_make": focus_make,
        "top_segment": top_segment,
        "top_growing_segment": growing_segment,
        "top_declining_segment": declining_segment,
        "top_opportunity_state": top_opportunity_state,
        "comparisons": comparisons,
    }

    with _FILTER_CACHE_LOCK:
        _FILTER_CACHE[cache_key] = result
    return result


def get_top_trends(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
) -> Dict:
    data = get_dashboard_insights(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    return {
        "make_trends": data.get("make_trends", []),
        "focus_make": data.get("focus_make"),
    }


def get_market_highlights(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
) -> Dict:
    data = get_dashboard_insights(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    return {
        "concentration": data.get("concentration", 0.0),
        "top_segment": data.get("top_segment"),
        "top_growing_segment": data.get("top_growing_segment"),
        "top_declining_segment": data.get("top_declining_segment"),
        "top_opportunity_state": data.get("top_opportunity_state"),
        "comparisons": data.get("comparisons") or {},
    }


def get_recent_activity(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
) -> List[Dict]:
    trends = get_top_trends(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    highlights = get_market_highlights(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    kpis = get_dashboard_kpis(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)

    focus_make = trends.get("focus_make") or {}
    make_name = focus_make.get("name") or "Top make"
    make_mom = float(focus_make.get("mom") or 0.0)

    ratio = float(kpis.inventory_to_sales or 0.0)
    ratio_label = "balanced"
    if ratio < 0.9:
        ratio_label = "undersupply"
    elif ratio > 1.1:
        ratio_label = "oversupply"

    concentration = float(highlights.get("concentration") or 0.0)
    top_state = highlights.get("top_opportunity_state") or "N/A"

    period = "Last 30 days" if (time_range or "").strip().lower() in ("30d", "30", "1m") else "Last 3 months"
    mom_txt = f"{abs(make_mom):.1f}%"
    mom_dir = "up" if make_mom >= 0 else "down"

    return [
        {"id": "a1", "text": f"{make_name} momentum is {mom_dir} {mom_txt}", "time": period},
        {"id": "a2", "text": f"Inventory pressure is {ratio_label} at {ratio:.2f}", "time": "Today"},
        {"id": "a3", "text": f"Top 10% dealers control {concentration:.1f}% of sales", "time": "This week"},
        {"id": "a4", "text": f"Opportunity leader: {top_state}", "time": "This week"},
    ]


def get_recommendations(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
) -> Dict:
    highlights = get_market_highlights(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    kpis = get_dashboard_kpis(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)

    top_segment = highlights.get("top_segment") or "N/A"
    top_state = highlights.get("top_opportunity_state") or "N/A"
    concentration = float(highlights.get("concentration") or 0.0)

    ratio = float(kpis.inventory_to_sales or 0.0)
    ratio_label = "balanced supply"
    if ratio > 1.1:
        ratio_label = "oversupply pressure"
    elif ratio < 0.9:
        ratio_label = "tight inventory"

    text = (
        f"Market demand remains centered on {top_segment}, with {ratio_label}. "
        f"A small group of dealers controls {concentration:.1f}% of total sales. "
        f"Top opportunity states include {top_state}, reflecting strong sales per dealer and efficient turnover."
    )
    return {"text": text}


def get_market_direction(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
) -> Dict:
    trends = get_top_trends(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    focus_make = trends.get("focus_make") or {}
    growth_pct = float(focus_make.get("mom") or 0.0)
    if growth_pct >= 2:
        label = "Positive (growing)"
    elif growth_pct <= -2:
        label = "Negative (declining)"
    else:
        label = "Neutral (stable)"
    return {"label": label, "growth_pct": growth_pct}


def get_opportunities_risk(
    scope: str = "USA",
    state: Optional[str] = None,
    time_range: str = "30d",
    exports_dir: Optional[str] = None,
) -> Dict:
    highlights = get_market_highlights(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)
    kpis = get_dashboard_kpis(scope=scope, state=state, time_range=time_range, exports_dir=exports_dir)

    ratio = float(kpis.inventory_to_sales or 0.0)
    ratio_label = "balanced"
    if ratio < 0.9:
        ratio_label = "undersupply"
    elif ratio > 1.1:
        ratio_label = "oversupply"

    return {
        "top_opportunity_state": highlights.get("top_opportunity_state") or "N/A",
        "inventory_pressure": ratio_label,
        "concentration": float(highlights.get("concentration") or 0.0),
    }
