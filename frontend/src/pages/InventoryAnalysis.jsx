import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  Building2,
  ChevronRight,
  Globe2,
  Layers,
  LineChart,
  Package,
  Scale,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, MetricCard } from '../components/common';
import DashboardTable from '../components/common/DashboardTable';
import { SegmentBarChart } from '../components/charts';
import TerritoryFilters from '../components/filters/TerritoryFilters';
import api from '../services/api';


const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmtInt = (v) => Math.round(toNumber(v)).toLocaleString();


const fmtPct = (v, digits = 1) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return `${n.toFixed(digits)}%`;
};

const safeText = (v) => String(v || '').trim();

const ratioTone = (ratio) => {
  if (!Number.isFinite(ratio)) return { label: '—', cls: 'bg-slate-50 border-slate-200 text-slate-600' };
  if (ratio < 0.9) return { label: 'Tight', cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' };
  if (ratio <= 1.1) return { label: 'Balanced', cls: 'bg-amber-50 border-amber-200 text-amber-700' };
  return { label: 'Oversupply', cls: 'bg-rose-50 border-rose-200 text-rose-700' };
};

const COLORS = ['#6366f1', '#0ea5e9', '#f59e0b', '#22c55e', '#f43f5e', '#a21caf', '#e11d48', '#0d9488', '#facc15', '#64748b'];

const chartTooltipStyle = {
  background: 'rgba(255,255,255,0.95)',
  border: '1px solid rgb(226 232 240)',
  borderRadius: 10,
  padding: 10,
  fontSize: 11,
};


const InventoryAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scope, setScope] = useState('USA');
  const [territoryState, setTerritoryState] = useState('');
  const [timeRange, setTimeRange] = useState('30d');

  const [summary, setSummary] = useState(null);
  const [structure, setStructure] = useState(null);
  const [leaders, setLeaders] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');

    const load = async () => {
      try {
        const params = { scope, time_range: timeRange };
        if (String(scope || '').toLowerCase() === 'state') params.state = territoryState;

        const [
          resTerritories,
          resKpis,
          resHealth,
          resTrend,
          resMakeMix,
          resModelMix,
          resByState,
          resTopInv,
          resOver,
          resUnder,
          resEff,
          resOpp,
        ] = await Promise.all([
          api.get('/inventory_analysis/territories', { params: { time_range: timeRange } }),
          api.get('/inventory_analysis/kpis_overview', { params }),
          api.get('/inventory_analysis/health', { params }),
          api.get('/inventory_analysis/chart_inventory_vs_sales_trend', { params }),
          api.get('/inventory_analysis/chart_make_mix', { params: { ...params, top_n: 10 } }),
          api.get('/inventory_analysis/chart_model_mix', { params: { ...params, top_n: 10 } }),
          api.get('/inventory_analysis/chart_inventory_by_state', { params: { ...params, top_n: 12 } }),
          api.get('/inventory_analysis/top_inventory_holders', { params: { ...params, limit: 10 } }),
          api.get('/inventory_analysis/overstocked_dealers', { params: { ...params, limit: 10 } }),
          api.get('/inventory_analysis/understocked_dealers', { params: { ...params, limit: 10 } }),
          api.get('/inventory_analysis/efficient_managers', { params: { ...params, limit: 10 } }),
          api.get('/inventory_analysis/opportunity_states', { params: { ...params, limit: 10 } }),
        ]);

        if (!alive) return;

        const t = resTerritories?.data;
        const k = resKpis?.data;
        const h = resHealth?.data;
        const trend = resTrend?.data;
        const makeMix = resMakeMix?.data;
        const modelMix = resModelMix?.data;
        const byState = resByState?.data;
        const topInv = resTopInv?.data;
        const over = resOver?.data;
        const under = resUnder?.data;
        const eff = resEff?.data;
        const opp = resOpp?.data;

        if (!t?.success || !k?.success || !h?.success || !trend?.success || !makeMix?.success || !modelMix?.success || !byState?.success || !topInv?.success || !over?.success || !under?.success || !eff?.success || !opp?.success) {
          throw new Error('API returned unexpected payload');
        }

        const statesList = Array.isArray(t?.states) ? t.states : [];
        setSummary({
          ...k,
          ...h,
          states: statesList,
        });
        setStructure({
          ...(trend || {}),
          ...(makeMix || {}),
          ...(modelMix || {}),
          ...(byState || {}),
        });
        setLeaders({
          topInventoryHolders: Array.isArray(topInv?.rows) ? topInv.rows : [],
          overstockedDealers: Array.isArray(over?.rows) ? over.rows : [],
          understockedDealers: Array.isArray(under?.rows) ? under.rows : [],
          efficientManagers: Array.isArray(eff?.rows) ? eff.rows : [],
          opportunityStates: Array.isArray(opp?.rows) ? opp.rows : [],
          maxTopInventory: topInv?.maxTopInventory,
        });

        // If no state is selected yet, default to first returned state so filters work.
        if (String(scope || '').toLowerCase() === 'state') {
          if (!territoryState && statesList.length) setTerritoryState(statesList[0]);
        }
      } catch (e) {
        if (!alive) return;
        setError('Failed to load inventory analysis from API');
        setSummary(null);
        setStructure(null);
        setLeaders(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    load();
    return () => { alive = false; };
  }, [scope, territoryState, timeRange]);

  const states = useMemo(() => {
    const list = summary?.states;
    return Array.isArray(list) ? list : [];
  }, [summary]);

  const totalDealers = toNumber(summary?.totalDealers);
  const totalSales = toNumber(summary?.totalSales);
  const totalInventory = toNumber(summary?.totalInventory);
  const avgInventoryPerDealer = toNumber(summary?.avgInventoryPerDealer);
  const invSalesRatio = toNumber(summary?.invSalesRatio);
  const avgUniqueModels = toNumber(summary?.avgUniqueModels);
  const riskDealersPct = toNumber(summary?.riskDealersPct);
  const topMakeConcentrationPct = toNumber(summary?.topMakeConcentrationPct);
  const inventoryConcentrationPct = toNumber(summary?.inventoryConcentrationPct);
  const dealerHealth = summary?.dealerHealth || { understock: 0, balanced: 0, overstock: 0, understockPct: 0, balancedPct: 0, overstockPct: 0 };

  const makeInventory = useMemo(() => (Array.isArray(structure?.makeMix) ? structure.makeMix : []), [structure]);
  const modelInventory = useMemo(() => (Array.isArray(structure?.modelMix) ? structure.modelMix : []), [structure]);
  const segmentInventory = useMemo(() => (Array.isArray(structure?.segmentMix) ? structure.segmentMix : []), [structure]);
  const inventoryVsSalesSeries = useMemo(() => (Array.isArray(structure?.inventoryVsSalesTrend) ? structure.inventoryVsSalesTrend : []), [structure]);
  const inventoryByStateSeries = useMemo(() => (Array.isArray(structure?.inventoryVsSalesByState) ? structure.inventoryVsSalesByState : []), [structure]);

  const marketSummary = summary?.marketSummary || '';
  const topInventoryHolders = leaders?.topInventoryHolders || [];
  const overstockedDealers = leaders?.overstockedDealers || [];
  const understockedDealers = leaders?.understockedDealers || leaders?.understocked_dealers || leaders?.understocked || [];
  const efficientManagers = leaders?.efficientManagers || [];
  const opportunityStates = leaders?.opportunityStates || [];
  const maxTopInventory = toNumber(leaders?.maxTopInventory);

  const invRatioTone = ratioTone(invSalesRatio);

  const daysInRange = useMemo(() => {
    if (timeRange === '60d') return 60;
    if (timeRange === '3m') return 90;
    return 30;
  }, [timeRange]);

  const daysOfSupply = (inventory, sales) => {
    const inv = toNumber(inventory);
    const s = toNumber(sales);
    if (inv <= 0 || s <= 0) return null;
    return (inv / s) * daysInRange;
  };

  const getInv = (r) => toNumber(r?.inv ?? r?.inventory ?? r?.total_inventory ?? r?.totalInventory);
  const getSales = (r) => toNumber(r?.sales ?? r?.total_sales ?? r?.totalSales);
  const getRatio = (r) => toNumber(r?.ratio ?? r?.invSales ?? r?.inv_sales ?? r?.inv_sales_ratio ?? r?.invSalesRatio);

  const derivedUnderstockedDealers = useMemo(() => {
    if (Array.isArray(understockedDealers) && understockedDealers.length) return understockedDealers;
    const pool = [];
    const add = (rows) => {
      if (!Array.isArray(rows)) return;
      rows.forEach((r) => {
        const inv = getInv(r);
        const sales = getSales(r);
        if (!inv || !sales) return;
        const ratio = inv / sales;
        pool.push({ ...r, inv, sales, ratio });
      });
    };
    add(topInventoryHolders);
    add(efficientManagers);
    add(overstockedDealers);

    const seen = new Set();
    const unique = [];
    for (const r of pool) {
      const k = String(r?.canonical_dealer_id || r?.dealer || '').toLowerCase();
      if (!k || seen.has(k)) continue;
      seen.add(k);
      unique.push(r);
    }

    return unique
      .filter((r) => Number.isFinite(r.ratio) && r.ratio > 0 && r.ratio < 0.7)
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 10);
  }, [understockedDealers, topInventoryHolders, efficientManagers, overstockedDealers]);

  if (loading) return <div className="p-8 text-slate-500">Loading inventory data…</div>;
  if (error) return <div className="p-8 text-rose-600">{error}</div>;

  return (
    <div className="flex flex-col gap-3 p-3 min-h-0">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-100 bg-indigo-50 text-indigo-700 text-[11px] font-semibold">
              <Sparkles className="w-4 h-4" />
              Inventory Dashboard
              <ChevronRight className="w-4 h-4" />
              Supply Health & Risk
            </div>
            <h1 className="text-2xl font-bold mt-2 text-slate-900">Inventory Analysis</h1>
            <p className="text-slate-500 text-sm max-w-2xl">
              State of inventory, who is stocked/understocked, and where opportunity & risk exist across dealers and regions.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <div className={`px-3 py-2 rounded-xl border text-xs font-semibold ${invRatioTone.cls}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  Inventory Pressure
                </div>
                <div className="tabular-nums">{invSalesRatio.toFixed(2)}</div>
              </div>
              <div className="mt-1 text-[11px] opacity-80">{invRatioTone.label}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)_340px] gap-2 min-h-0 items-start">
        <div className="flex flex-col gap-2 min-h-0">
          <div className="rounded-2xl border border-gray-100 bg-white p-2">
            <TerritoryFilters
              scope={scope}
              state={territoryState}
              dateRange={timeRange}
              states={states}
              onChange={({ scope: s, state, dateRange }) => {
                if (s) setScope(s);
                if (state !== undefined) setTerritoryState(state);
                if (dateRange) setTimeRange(dateRange);
              }}
            />
          </div>

          <Card className="p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-700" />
                <div>
                  <div className="text-sm font-bold text-slate-900">Inventory Performance Overview</div>
                  <div className="text-[11px] text-slate-500 leading-snug">Core question: Is the supply side healthy, efficient, and balanced?</div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500">time range: <span className="font-semibold text-slate-700">{timeRange}</span></div>
            </div>

            <div className="mt-2 grid grid-cols-2 lg:grid-cols-3 gap-2">
              <MetricCard
                title="Total Active Inventory"
                value={fmtInt(totalInventory)}
                icon={Boxes}
                iconColor="text-indigo-700"
                iconBg="bg-indigo-50"
                gradient
                size="compact"
              />
              <MetricCard
                title="Avg Inventory / Dealer"
                value={fmtInt(avgInventoryPerDealer)}
                icon={Building2}
                iconColor="text-sky-700"
                iconBg="bg-sky-50"
                gradient
                size="compact"
              />
              <MetricCard
                title="Inventory-to-Sales Ratio"
                value={invSalesRatio.toFixed(2)}
                icon={Scale}
                iconColor={invRatioTone.label === 'Oversupply' ? 'text-rose-700' : invRatioTone.label === 'Tight' ? 'text-emerald-700' : 'text-amber-700'}
                iconBg={invRatioTone.label === 'Oversupply' ? 'bg-rose-50' : invRatioTone.label === 'Tight' ? 'bg-emerald-50' : 'bg-amber-50'}
                gradient
                size="compact"
              />
              <MetricCard
                title="Inventory Diversity Index"
                value={fmtInt(avgUniqueModels)}
                icon={Layers}
                iconColor="text-emerald-700"
                iconBg="bg-emerald-50"
                gradient
                size="compact"
              />
              <MetricCard
                title="% Dealers at Inventory Risk"
                value={fmtPct(riskDealersPct, 0)}
                icon={ShieldAlert}
                iconColor={riskDealersPct > 20 ? 'text-rose-700' : 'text-amber-700'}
                iconBg={riskDealersPct > 20 ? 'bg-rose-50' : 'bg-amber-50'}
                gradient
                size="compact"
              />
              <MetricCard
                title="Top Make Concentration"
                value={fmtPct(topMakeConcentrationPct, 0)}
                icon={Package}
                iconColor="text-violet-700"
                iconBg="bg-violet-50"
                gradient
                size="compact"
              />
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-700" />
                <div className="text-sm font-bold text-slate-900">Inventory Health</div>
              </div>
              <div className="text-[11px] text-slate-500">Top 10% dealers</div>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2">
                <div className="text-[10px] text-emerald-700 font-semibold">Understock</div>
                <div className="text-base font-bold text-emerald-900 tabular-nums leading-tight">{fmtInt(dealerHealth.understock)}</div>
                <div className="text-[10px] text-emerald-700/70">{Number(dealerHealth.understockPct || 0).toFixed(0)}%</div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-2">
                <div className="text-[10px] text-amber-700 font-semibold">Balanced</div>
                <div className="text-base font-bold text-amber-900 tabular-nums leading-tight">{fmtInt(dealerHealth.balanced)}</div>
                <div className="text-[10px] text-amber-700/70">{Number(dealerHealth.balancedPct || 0).toFixed(0)}%</div>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-2">
                <div className="text-[10px] text-rose-700 font-semibold">Overstock</div>
                <div className="text-base font-bold text-rose-900 tabular-nums leading-tight">{fmtInt(dealerHealth.overstock)}</div>
                <div className="text-[10px] text-rose-700/70">{Number(dealerHealth.overstockPct || 0).toFixed(0)}%</div>
              </div>
            </div>

            <div className="mt-2 text-[11px] text-slate-500">
              Thresholds:
              <span className="font-semibold text-slate-700"> &lt;0.9</span> tight,
              <span className="font-semibold text-slate-700"> 0.9–1.1</span> balanced,
              <span className="font-semibold text-slate-700"> &gt;1.1</span> oversupply.
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-3 min-h-0">
          <Card className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-700" />
                <div>
                  <div className="text-sm font-bold text-slate-900">Leaders & Opportunities</div>
                  <div className="text-[11px] text-slate-500">Top holders, overstock risk, and efficiency benchmarks</div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500">Top 10% dealers</div>
            </div>

            <div className="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-3">
              <div className="flex flex-col gap-3">
                <DashboardTable
                  title="Top Inventory Holders"
                  topRight="Highest active inventory"
                  wrap
                  maxHeight={180}
                  columns={[
                    { key: 'rank', title: '#', render: (_, i) => i + 1, className: 'w-10 whitespace-nowrap' },
                    {
                      key: 'dealer', title: 'Dealer', render: (r) => (
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 break-words">{r.dealer}</div>
                        </div>
                      ), className: 'w-44', cellClass: 'max-w-[18rem]'
                    },
                    { key: 'cityState', title: 'City / State', render: (r) => <div className="text-slate-700 break-words">{r.cityState}</div>, className: 'w-28' },
                    {
                      key: 'inventory', title: 'Inv', render: (r) => <div className="text-right font-semibold text-slate-900">{fmtInt(r.inventory)}</div>, className: 'text-right w-20'
                    },
                    { key: 'daysSupply', title: 'Days', render: (r) => <div className="text-right tabular-nums">{daysOfSupply(r.inventory, r.sales) ? daysOfSupply(r.inventory, r.sales).toFixed(0) : '—'}</div>, className: 'text-right w-16' },
                  ]}
                  rows={topInventoryHolders}
                />

                <DashboardTable
                  title="Efficient Inventory Managers"
                  topRight="Sales ÷ Inventory"
                  wrap
                  maxHeight={180}
                  columns={[
                    { key: 'rank', title: '#', render: (_, i) => i + 1, className: 'w-10 whitespace-nowrap' },
                    { key: 'dealer', title: 'Dealer', render: (r) => <div className="font-semibold text-slate-900 break-words">{r.dealer}</div>, className: 'w-44', cellClass: 'max-w-[18rem]' },
                    { key: 'cityState', title: 'City', render: (r) => <div className="text-slate-700 break-words">{r.cityState}</div>, className: 'w-28' },
                    {
                      key: 'velocity', title: 'Velocity', render: (r) => <div className="text-right tabular-nums">{Number(r.velocity || 0).toFixed(2)}</div>, className: 'text-right w-20'
                    },
                    { key: 'daysSupply', title: 'Days', render: (r) => <div className="text-right tabular-nums">{daysOfSupply(r.inv, r.sales) ? daysOfSupply(r.inv, r.sales).toFixed(0) : '—'}</div>, className: 'text-right w-16' },
                  ]}
                  rows={efficientManagers}
                />
              </div>

              <div className="flex flex-col gap-3">
                <DashboardTable
                  title="Overstocked Dealers"
                  topRight="Inv/Sales > 1.3"
                  wrap
                  maxHeight={180}
                  columns={[
                    { key: 'rank', title: '#', render: (_, i) => i + 1, className: 'w-10 whitespace-nowrap' },
                    { key: 'dealer', title: 'Dealer', render: (r) => <div className="font-semibold text-slate-900 break-words">{r.dealer}</div>, className: 'w-44', cellClass: 'max-w-[18rem]' },
                    { key: 'cityState', title: 'City', render: (r) => <div className="text-slate-700 break-words">{r.cityState}</div>, className: 'w-28' },
                    {
                      key: 'ratio', title: 'Inv/Sales', render: (r) => <div className="text-right tabular-nums text-rose-700 font-semibold">{getRatio(r).toFixed(2)}</div>, className: 'text-right w-20'
                    },
                    { key: 'daysSupply', title: 'Days', render: (r) => <div className="text-right tabular-nums">{daysOfSupply(getInv(r), getSales(r)) ? daysOfSupply(getInv(r), getSales(r)).toFixed(0) : '—'}</div>, className: 'text-right w-16' },
                  ]}
                  rows={overstockedDealers}
                />

                <DashboardTable
                  title="Understocked Dealers"
                  topRight="Inv/Sales < 0.7"
                  wrap
                  maxHeight={180}
                  columns={[
                    { key: 'rank', title: '#', render: (_, i) => i + 1, className: 'w-10 whitespace-nowrap' },
                    { key: 'dealer', title: 'Dealer', render: (r) => <div className="font-semibold text-slate-900 break-words">{r.dealer}</div>, className: 'w-44', cellClass: 'max-w-[18rem]' },
                    { key: 'cityState', title: 'City', render: (r) => <div className="text-slate-700 break-words">{r.cityState}</div>, className: 'w-28' },
                    {
                      key: 'ratio', title: 'Inv/Sales', render: (r) => <div className="text-right tabular-nums text-emerald-700 font-semibold">{getRatio(r).toFixed(2)}</div>, className: 'text-right w-20'
                    },
                    { key: 'daysSupply', title: 'Days', render: (r) => <div className="text-right tabular-nums">{daysOfSupply(getInv(r), getSales(r)) ? daysOfSupply(getInv(r), getSales(r)).toFixed(0) : '—'}</div>, className: 'text-right w-16' },
                  ]}
                  rows={derivedUnderstockedDealers}
                />
              </div>
            </div>
          </Card>
        </div>

        <aside className="flex flex-col gap-3 min-h-0">
          <Card className="p-4 max-h-[560px] overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-700" />
                <div className="text-sm font-bold text-slate-900">Key Insights</div>
              </div>
              <div className="text-[11px] text-slate-500">LLM insights</div>
            </div>

            <div className="mt-3 flex flex-col gap-3 overflow-auto max-h-[500px] pr-1">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] text-slate-600 leading-relaxed">{marketSummary}</div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-[11px] font-semibold text-slate-700">Specs</div>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <div className="text-[11px] text-slate-600"><span className="font-semibold text-slate-700">Scope:</span> {safeText(scope) === 'State' ? (safeText(territoryState) || 'State') : 'National'}</div>
                  <div className="text-[11px] text-slate-600"><span className="font-semibold text-slate-700">Top Make:</span> {safeText(summary?.topMake) || makeInventory[0]?.name || '—'}</div>
                  <div className="text-[11px] text-slate-600"><span className="font-semibold text-slate-700">Top Segment:</span> {safeText(summary?.topSegment) || segmentInventory[0]?.name || '—'}</div>
                  <div className="text-[11px] text-slate-600"><span className="font-semibold text-slate-700">Risk threshold:</span> Inv/Sales &gt; 1.3</div>
                </div>
              </div>

              <div>
                <DashboardTable
                  title="Top States by Inventory Opportunity"
                  topRight="Opportunity Index"
                  wrap
                  maxHeight={180}
                  columns={[
                    { key: 'rank', title: '#', render: (_, i) => i + 1, className: 'w-10 whitespace-nowrap' },
                    {
                      key: 'state', title: 'State', render: (r) => (
                        <div className="inline-flex items-center gap-2">
                          <Globe2 className="w-4 h-4 text-indigo-700" />
                          <span className="font-semibold text-slate-900">{r.state}</span>
                        </div>
                      ), className: 'w-20'
                    },
                    { key: 'score', title: 'Score', render: (r) => <div className="text-right tabular-nums font-semibold text-indigo-700">{Number(r.score || 0).toFixed(0)}</div>, className: 'text-right w-20' },
                    { key: 'invSales', title: 'Inv/Sales', render: (r) => <div className="text-right tabular-nums">{Number(r.invSales || 0).toFixed(2)}</div>, className: 'text-right w-20' },
                    { key: 'dealers', title: 'Dealers', render: (r) => <div className="text-right">{fmtInt(r.dealers)}</div>, className: 'text-right w-20' },
                  ]}
                  rows={opportunityStates}
                />
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-700 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-rose-800">Risk signal</div>
                    <div className="text-[11px] text-rose-700/90 leading-relaxed">
                      {riskDealersPct > 20
                        ? 'A high share of dealers are at inventory risk (Inv/Sales > 1.3). Prioritize turn strategies and targeted de-stocking.'
                        : 'Inventory risk is contained, but monitor states with high Inv/Sales and dealer-level outliers.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </aside>

        <Card className="p-4 lg:col-span-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <LineChart className="w-4 h-4 text-indigo-700" />
              <div>
                <div className="text-sm font-bold text-slate-900">Inventory Structure &amp; Trends</div>
                <div className="text-[11px] text-slate-500">Supply balance, mix, concentration, and regional imbalance</div>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-lg border text-[11px] font-semibold ${invRatioTone.cls}`}>{invRatioTone.label}</div>
          </div>

          <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900">Inventory vs Sales Trend</div>
                <div className="text-[11px] text-slate-500">(aggregate)</div>
              </div>
              <div className="h-48 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryVsSalesSeries} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="inventory" name="Inventory" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="sales" name="Sales" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <SegmentBarChart data={makeInventory.slice(0, 10)} title="Inventory Mix by Make (Top 10)" compact />
              <SegmentBarChart data={modelInventory.slice(0, 10)} title="Inventory Mix by Model (Top 10)" compact />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900">Inventory Distribution Analysis</div>
                <div className="text-[11px] text-slate-500">Top 10% dealers</div>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-3 items-center">
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Pie
                        data={[
                          { name: 'Top 10% dealers', value: inventoryConcentrationPct },
                          { name: 'Others', value: Math.max(0, 100 - inventoryConcentrationPct) },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={42}
                        outerRadius={58}
                        paddingAngle={2}
                      >
                        <Cell fill="#4f46e5" />
                        <Cell fill="#cbd5e1" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-bold text-slate-900 tabular-nums">{inventoryConcentrationPct.toFixed(1)}%</div>
                  <div className="text-[11px] text-slate-500 mt-1">% of inventory held by top 10% dealers.</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                      <div className="text-[10px] text-slate-500">Total Dealers</div>
                      <div className="text-sm font-bold text-slate-900">{fmtInt(totalDealers)}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                      <div className="text-[10px] text-slate-500">Total Inventory</div>
                      <div className="text-sm font-bold text-slate-900">{fmtInt(totalInventory)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 lg:col-span-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900">Inventory vs Sales by State</div>
                <div className="text-[11px] text-slate-500">Top states by inventory</div>
              </div>
              <div className="h-60 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryByStateSeries} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={40} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="inventory" name="Inventory" fill="#0284c7" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="sales" name="Sales" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InventoryAnalysis;
