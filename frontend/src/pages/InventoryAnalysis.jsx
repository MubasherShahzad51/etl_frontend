import React, { useEffect, useMemo, useState } from 'react';
import { Card, MetricCard } from '../components/common';
import DashboardTable from '../components/common/DashboardTable';
import { MakeDistributionChart, SegmentBarChart } from '../components/charts';
import Papa from 'papaparse';


// Utility: Parse CSV robustly using PapaParse
function parseCsv(text) {
  if (!text) return [];
  const result = Papa.parse(text, { header: true, skipEmptyLines: true });
  // Normalize keys: trim, lowercase, replace spaces/underscores
  return result.data.map(row => {
    const norm = {};
    Object.entries(row).forEach(([k, v]) => {
      const key = k.trim().toLowerCase().replace(/\s+/g, '_');
      norm[key] = v;
    });
    return norm;
  });
}


const InventoryAnalysis = () => {
  const [dealers, setDealers] = useState([]);
  const [bodyStyles, setBodyStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    setLoading(true);
    const base = import.meta.env.BASE_URL || '/';
    Promise.all([
      fetch(`${base}dealer_sales_summary_simple.csv`).then(r => r.text()),
      fetch(`${base}Make_Model_BodyStyle.csv`).then(r => r.text()),
    ]).then(([dealerCsv, bodyCsv]) => {
      setDealers(parseCsv(dealerCsv));
      setBodyStyles(parseCsv(bodyCsv));
      setError('');
    }).catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);


  // Metrics
  const totalDealers = useMemo(() => {
    if (!dealers.length) return 0;
    // Prefer canonical_dealer_id, but fall back to other IDs if needed
    const ids = new Set(
      dealers.map(d => d.canonical_dealer_id || d.mc_dealer_id || d.mc_rooftop_id || d.mc_location_id),
    );
    return ids.size;
  }, [dealers]);

  const totalSales = useMemo(
    () => dealers.reduce((sum, d) => sum + Number(d.total_sales || 0), 0),
    [dealers],
  );

  const totalInventory = useMemo(
    () => dealers.reduce((sum, d) => sum + Number(d.active_inventory || 0), 0),
    [dealers],
  );

  const avgSalesPerDealer = totalDealers ? (totalSales / totalDealers) : 0;
  const invSalesRatio = totalSales ? (totalInventory / totalSales) : 0;

  // % of sales from top 10% dealers
  const marketConcentration = useMemo(() => {
    if (!dealers.length || !totalSales) return null;
    const sorted = [...dealers].sort((a, b) => Number(b.total_sales) - Number(a.total_sales));
    const top10 = sorted.slice(0, Math.ceil(sorted.length * 0.1));
    const topSales = top10.reduce((sum, d) => sum + Number(d.total_sales || 0), 0);
    return (topSales / totalSales) * 100;
  }, [dealers, totalSales]);

  // Classify dealers by inventory-to-sales ratio
  const dealerHealth = useMemo(() => {
    if (!dealers.length) {
      return {
        balanced: 0,
        overstock: 0,
        understock: 0,
        balancedPct: 0,
        overstockPct: 0,
        understockPct: 0,
      };
    }

    let balanced = 0;
    let overstock = 0;
    let understock = 0;

    dealers.forEach(d => {
      const inventory = Number(d.active_inventory || 0);
      const sales = Number(d.total_sales || 0);

      if (!inventory && !sales) return;

      const ratio = sales ? inventory / sales : Infinity;

      if (!Number.isFinite(ratio)) return;

      if (ratio < 0.9) {
        understock += 1;
      } else if (ratio > 1.1) {
        overstock += 1;
      } else {
        balanced += 1;
      }
    });

    const total = balanced + overstock + understock || 1;

    return {
      balanced,
      overstock,
      understock,
      balancedPct: (balanced / total) * 100,
      overstockPct: (overstock / total) * 100,
      understockPct: (understock / total) * 100,
    };
  }, [dealers]);

  // Make, Model, Segment distribution for charts
  const makeInventory = useMemo(() => {
    const map = {};
    dealers.forEach(d => {
      const makes = (d.top_5_makes || '').split('|').map(m => m.trim());
      const invs = (d.top_5_make_inventory || '').split('|').map(i => Number(i.trim() || 0));
      makes.forEach((make, idx) => {
        if (!map[make]) map[make] = 0;
        map[make] += invs[idx] || 0;
      });
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [dealers]);

  const modelInventory = useMemo(() => {
    const map = {};
    dealers.forEach(d => {
      const models = (d.top_5_models || '').split('|').map(m => m.trim());
      const invs = (d.top_5_model_inventory || '').split('|').map(i => Number(i.trim() || 0));
      models.forEach((model, idx) => {
        if (!map[model]) map[model] = 0;
        map[model] += invs[idx] || 0;
      });
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [dealers]);

  const segmentInventory = useMemo(() => {
    const map = {};
    dealers.forEach(d => {
      const makes = (d.top_5_makes || '').split('|').map(m => m.trim());
      const models = (d.top_5_models || '').split('|').map(m => m.trim());
      const invs = (d.top_5_model_inventory || '').split('|').map(i => Number(i.trim() || 0));
      models.forEach((model, idx) => {
        const make = makes[idx] || '';
        const body = bodyStyles.find(b => b.make === make && b.model === model);
        // bodyStyle column is normalized to "bodystyle" by parseCsv
        const rawSeg = body ? (body.bodystyle || body.bodyStyle || 'Other') : 'Other';
        const seg = (rawSeg || 'Other').toString();
        if (!map[seg]) map[seg] = 0;
        map[seg] += invs[idx] || 0;
      });
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [dealers, bodyStyles]);

  // Narrative summary for LLM / executives
  const marketSummary = useMemo(() => {
    if (!dealers.length || !totalSales || !totalInventory) {
      return 'No market data available yet. Check that the CSV files are accessible and loaded correctly.';
    }
    const pressureText = (() => {
      if (invSalesRatio > 1.1) {
        return 'inventory levels are high relative to sales, creating pricing pressure.';
      }
      if (invSalesRatio < 0.9) {
        return 'inventory is tight relative to sales, supporting stronger pricing power.';
      }
      return 'inventory is broadly in balance with sales, keeping pricing stable.';
    })();

    const concentrationText = typeof marketConcentration === 'number'
      ? `A small group of top dealers accounts for ${marketConcentration.toFixed(1)}% of total sales, indicating ${marketConcentration > 50 ? 'a winner-take-all dynamic' : 'a relatively distributed competitive landscape'}.`
      : '';

    const leadingSegment = segmentInventory[0]?.name;
    const segmentText = leadingSegment
      ? `${leadingSegment}s currently lead inventory share, `
      : '';

    return [
      `The market consists of ${totalDealers.toLocaleString()} active dealers with ${totalSales.toLocaleString()} vehicles sold and ${totalInventory.toLocaleString()} units in stock.`,
      segmentText,
      `and overall ${pressureText}`,
      concentrationText,
    ].join(' ').replace(/\s+/g, ' ').trim();
  }, [dealers, totalDealers, totalSales, totalInventory, invSalesRatio, marketConcentration, segmentInventory]);

  // Table: Top dealers by sales with velocity
  const topDealers = useMemo(() => {
    return [...dealers]
      .map(d => {
        const sales = Number(d.total_sales || 0);
        const inventory = Number(d.active_inventory || 0);
        const velocity = inventory ? sales / inventory : 0;
        return { ...d, sales, inventory, velocity };
      })
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);
  }, [dealers]);

  const maxTopSales = useMemo(
    () => topDealers.reduce((max, d) => Math.max(max, d.sales || 0), 0),
    [topDealers],
  );

  const maxTopInventory = useMemo(
    () => topDealers.reduce((max, d) => Math.max(max, d.inventory || 0), 0),
    [topDealers],
  );

  if (loading) return <div className="p-8 text-slate-500">Loading inventory data…</div>;
  if (error) return <div className="p-8 text-rose-600">{error}</div>;

  return (
    <div className="flex flex-col gap-4 p-4 min-h-0">
      <div>
        <h1 className="text-2xl font-bold mb-1">Inventory Analysis</h1>
        <p className="text-slate-500 text-sm">Supply depth and stock pressure</p>
      </div>
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-2">
        <button className={`px-3 py-1 rounded-lg text-[11px] font-semibold border ${tab === 'overview' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-900 border-slate-200'}`} onClick={() => setTab('overview')}>Overview</button>
        <button className={`px-3 py-1 rounded-lg text-[11px] font-semibold border ${tab === 'details' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-900 border-slate-200'}`} onClick={() => setTab('details')}>Details</button>
      </div>
      {tab === 'overview' && (
        <>
          {/* KPI Summary Strip – compact */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full">
            <MetricCard title="Total Sales" value={totalSales.toLocaleString()} size="compact" />
            <MetricCard title="Active Inventory" value={totalInventory.toLocaleString()} size="compact" />
            <MetricCard title="Inv/Sales Ratio" value={invSalesRatio.toFixed(2)} size="compact" />
            <MetricCard title="Total Dealers" value={totalDealers.toLocaleString()} size="compact" />
            <MetricCard title="Avg Sales/Dealer" value={avgSalesPerDealer.toFixed(1)} size="compact" />
          </div>
          {/* Inventory Overview: Composition and Insights */}
          <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-3 min-h-0">
            {/* Left: Composition Charts + State */}
            <div className="flex flex-col gap-3 min-h-0">
              {/* All charts in one block, 2x2 grid */}
                <Card className="p-2 w-full" style={{ height: 'auto', minHeight: 'unset', maxHeight: 'unset', overflow: 'visible' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-6">
                    <div className="h-[320px] w-full">
                      <SegmentBarChart
                        data={makeInventory.slice(0, 10)}
                        title="By Make"
                        compact
                        style={{ height: 300, width: '100%' }}
                      />
                    </div>
                    <div className="h-[320px] w-full">
                      <SegmentBarChart
                        data={modelInventory.slice(0, 10)}
                        title="By Model"
                        compact
                        style={{ height: 300, width: '100%' }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-6">
                    <div className="h-[320px] w-full">
                      <SegmentBarChart
                        data={segmentInventory.slice(0, 10)}
                        title="By Segment"
                        compact
                        style={{ height: 300, width: '100%' }}
                      />
                    </div>
                    <div className="h-[320px] w-full">
                      <SegmentBarChart
                        data={(() => {
                          const map = {};
                          dealers.forEach(d => {
                            const state = d.state || 'Unknown';
                            const inv = Number(d.active_inventory || 0);
                            if (!map[state]) map[state] = 0;
                            map[state] += inv;
                          });
                          return Object
                            .entries(map)
                            .map(([name, value]) => ({ name, value }))
                            .sort((a, b) => b.value - a.value)
                            .slice(0, 10);
                        })()}
                        title="Inventory by State"
                        compact
                        style={{ height: 300, width: '100%' }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            {/* Right: Insights Panels */}
            <div className="flex flex-col gap-4 min-h-0">
              {/* Inventory Health Summary */}
              <Card className="p-4">
                <h2 className="font-semibold mb-2">Inventory Health Summary</h2>
                <div className="text-xs text-slate-700">Dealer balance snapshot</div>
                <div className="flex gap-2 mt-2">
                  <div className="flex-1 text-center">
                    <div className="text-lg font-bold text-green-700">Balanced</div>
                    <div className="text-2xl font-bold">
                      {dealerHealth.balanced.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {dealerHealth.balancedPct.toFixed(0)}% of dealers
                    </div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-lg font-bold text-rose-700">Overstock</div>
                    <div className="text-2xl font-bold">
                      {dealerHealth.overstock.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {dealerHealth.overstockPct.toFixed(0)}% of dealers
                    </div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-lg font-bold text-yellow-600">Understock</div>
                    <div className="text-2xl font-bold">
                      {dealerHealth.understock.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {dealerHealth.understockPct.toFixed(0)}% of dealers
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Based on inventory-to-sales ratio thresholds: &lt;0.9 understock, 0.9–1.1 balanced, &gt;1.1 overstock.
                </div>
              </Card>
              {/* Market Concentration */}
              <Card className="p-4">
                <h2 className="font-semibold mb-2">Market Concentration</h2>
                <div className="text-xs text-slate-700">Share of sales from top 10% dealers</div>
                <div className="text-3xl font-bold text-blue-700 mt-2">
                  {typeof marketConcentration === 'number'
                    ? `${marketConcentration.toFixed(1)}%`
                    : '—'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Higher values indicate winner-take-all pressure.</div>
              </Card>
              {/* Inventory Highlights */}
              <Card className="p-4">
                <h2 className="font-semibold mb-2">Inventory Highlights</h2>
                <div className="text-xs text-slate-700">
                  Top make: <span className="font-bold">{makeInventory[0]?.name || '—'}</span>
                </div>
                <div className="text-xs text-slate-700">
                  Top segment: <span className="font-bold">{segmentInventory[0]?.name || '—'}</span>
                </div>
                <div className="text-xs text-slate-700">
                  Top model: <span className="font-bold">{modelInventory[0]?.name || '—'}</span>
                </div>
                <div className="text-xs text-slate-700">
                  Median Inv/Sales:{' '}
                  <span className="font-bold">
                    {(() => {
                      if (!dealers.length) return '—';
                      const ratios = dealers
                        .map(d => Number(d.active_inventory || 0) / (Number(d.total_sales || 1)))
                        .filter(v => isFinite(v))
                        .sort((a, b) => a - b);
                      const mid = Math.floor(ratios.length / 2);
                      return ratios.length % 2
                        ? ratios[mid].toFixed(2)
                        : ((ratios[mid - 1] + ratios[mid]) / 2).toFixed(2);
                    })()}
                  </span>
                </div>
              </Card>
              {/* Market Summary – directly under Inventory Highlights */}
              <Card className="p-4">
                <h2 className="font-semibold mb-1">Market Summary</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {marketSummary}
                </p>
              </Card>
            </div>
          </div>
        </>
      )}
      {tab === 'details' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Top Market Leaders (dashboard table) */}
          <DashboardTable
            title="Top Market Leaders"
            topRight="Sales velocity = total sales ÷ active inventory"
            wrap
            columns={[
              { key: 'rank', title: 'Rank', render: (_, i) => i + 1, className: 'w-10 whitespace-nowrap' },
              { key: 'dealer', title: 'Dealer', render: (r) => <div className="min-w-0 break-words"><div className="font-semibold text-slate-900">{(r.seller_name || '').split('|')[0]}</div><div className="text-[10px] text-slate-400">ID: {r.canonical_dealer_id || r.mc_dealer_id || '—'}</div></div>, className: 'w-36', cellClass: 'max-w-[12rem]' },
              { key: 'city', title: 'City / State', render: (r) => <div className="text-slate-700 break-words">{r.city || '—'}<div className="text-[10px] text-slate-400">{r.state || ''}</div></div>, className: 'w-28', cellClass: 'max-w-[9rem]' },
              { key: 'sales', title: 'Total Sales', render: (r) => (
                <div className="text-right">
                  <div className="font-semibold text-slate-900">{Number(r.sales).toLocaleString()}</div>
                  <div className="mt-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${maxTopSales ? (r.sales / maxTopSales) * 100 : 0}%` }} />
                  </div>
                </div>
              ), className: 'text-right w-28' },
              { key: 'inventory', title: 'Active Inventory', render: (r) => (
                <div className="text-right">
                  <div className="font-semibold text-slate-900">{Number(r.inventory).toLocaleString()}</div>
                  <div className="mt-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${maxTopInventory ? (r.inventory / maxTopInventory) * 100 : 0}%` }} />
                  </div>
                </div>
              ), className: 'text-right w-28' },
              { key: 'unique_models_count', title: 'Unique Models', render: (r) => Number(r.unique_models_count || 0).toLocaleString(), className: 'text-right w-16' },
              { key: 'velocity', title: 'Sales Velocity', render: (r) => {
                const velocity = Number(r.velocity || 0);
                let cls = 'text-amber-700';
                let label = 'Balanced';
                if (velocity > 1.2) { cls = 'text-emerald-700'; label = 'High'; }
                else if (velocity < 0.8) { cls = 'text-rose-700'; label = 'Slow'; }
                return (<div className="text-right"><span className={`font-semibold ${cls}`}>{velocity.toFixed(2)}</span><span className="ml-2 text-[10px] text-slate-400">{label}</span></div>);
              }, className: 'text-right w-20' },
            ]}
            rows={topDealers}
          />
          

          {/* Top Inventory Dealers (dashboard table) */}
          <DashboardTable
            title="Top Inventory Dealers"
            maxHeight={200}
            wrap
            columns={[
              { key: 'rank', title: 'Rank', render: (_, i) => i + 1, className: 'w-10 whitespace-nowrap' },
              { key: 'dealer', title: 'Dealer', render: (r) => <div className="min-w-0 break-words"><div className="font-semibold text-slate-900">{(r.seller_name || '').split('|')[0]}</div><div className="text-[10px] text-slate-400">ID: {r.canonical_dealer_id || r.mc_dealer_id || '—'}</div></div>, className: 'w-36', cellClass: 'max-w-[12rem]' },
              { key: 'city', title: 'City / State', render: (r) => <div className="text-slate-700 break-words">{r.city || '—'}<div className="text-[10px] text-slate-400">{r.state || ''}</div></div>, className: 'w-28', cellClass: 'max-w-[9rem]' },
              { key: 'inventory', title: 'Active Inventory', render: (r) => <div className="text-right font-semibold">{Number(r.inventory).toLocaleString()}</div>, className: 'text-right w-24' },
              { key: 'sales', title: 'Total Sales', render: (r) => <div className="text-right">{Number(r.sales).toLocaleString()}</div>, className: 'text-right w-24' },
              { key: 'unique_models_count', title: 'Unique Models', render: (r) => Number(r.unique_models_count || 0).toLocaleString(), className: 'text-right w-16' },
            ]}
            rows={[...dealers].map(d => ({ ...d, sales: Number(d.total_sales || 0), inventory: Number(d.active_inventory || 0) })).sort((a, b) => b.inventory - a.inventory).slice(0, 10)}
          />


          {/* Supply vs Demand Alignment (dashboard table) */}
            <DashboardTable
              title="Supply vs Demand Alignment"
              maxHeight={200}
              columns={[
                { key: 'state', title: 'State' },
                { key: 'dealers', title: 'Dealers', className: 'text-right w-24' },
                { key: 'inv', title: 'Inv', className: 'text-right w-28' },
                { key: 'invSales', title: 'Inv/Sales', className: 'text-right w-24', render: r => Number(r.invSales).toFixed(2) },
              ]}
              rows={(() => {
                const stateMap = {};
                dealers.forEach(d => {
                  const state = d.state || 'Unknown';
                  if (!stateMap[state]) stateMap[state] = { dealers: 0, sales: 0, inv: 0 };
                  stateMap[state].dealers += 1;
                  stateMap[state].sales += Number(d.total_sales || 0);
                  stateMap[state].inv += Number(d.active_inventory || 0);
                });
                return Object.entries(stateMap).map(([state, v]) => {
                  const invSales = v.sales ? v.inv / v.sales : 0;
                  return { state, dealers: v.dealers, inv: v.inv, invSales };
                }).sort((a, b) => b.invSales - a.invSales).slice(0, 8);
              })()}
            />

          {/* Slow-Moving Inventory Signals */}
          <DashboardTable
            title="Slow-Moving Inventory Signals"
            maxHeight={180}
            columns={[
              { key: 'dealer', title: 'Dealer' },
              { key: 'state', title: 'State', className: 'w-20' },
              { key: 'invSales', title: 'Inv/Sales', className: 'text-right w-24', render: r => Number(r.invSales).toFixed(2) },
              { key: 'inv', title: 'Inv', className: 'text-right w-24', render: r => Number(r.inv).toLocaleString() },
            ]}
            rows={[...dealers].map(d => ({ ...d, inv: Number(d.active_inventory || 0), sales: Number(d.total_sales || 0), invSales: Number(d.active_inventory || 0) / (Number(d.total_sales || 1)), dealer: (d.seller_name || '').split('|')[0], state: d.state || '' })).filter(d => d.sales > 0).sort((a, b) => b.invSales - a.invSales).slice(0, 8)}
          />

          {/* Fast-Moving Inventory Signals */}
          <DashboardTable
            title="Fast-Moving Inventory Signals"
            maxHeight={180}
            columns={[
              { key: 'dealer', title: 'Dealer' },
              { key: 'state', title: 'State', className: 'w-20' },
              { key: 'salesInv', title: 'Sales/Inv', className: 'text-right w-24', render: r => Number(r.salesInv).toFixed(2) },
              { key: 'sales', title: 'Sales', className: 'text-right w-28', render: r => Number(r.sales).toLocaleString() },
            ]}
            rows={[...dealers].map(d => ({ ...d, inv: Number(d.active_inventory || 0), sales: Number(d.total_sales || 0), salesInv: Number(d.total_sales || 0) / (Number(d.active_inventory || 1)), dealer: (d.seller_name || '').split('|')[0], state: d.state || '' })).filter(d => d.inv > 0).sort((a, b) => b.salesInv - a.salesInv).slice(0, 8)}
          />

          {/* Top Models (Inventory) */}
          <DashboardTable
            title="Top Models (Inventory)"
            maxHeight={160}
            columns={[
              { key: 'model', title: 'Model' },
              { key: 'seg', title: 'Seg' },
              { key: 'inv', title: 'Inv', className: 'text-right w-28', render: r => Number(r.inv).toLocaleString() },
            ]}
            rows={modelInventory.slice(0,5).map(row => {
              let foundMake = '';
              for (const d of dealers) {
                const models = (d.top_5_models || '').split('|').map(m => m.trim());
                const makes = (d.top_5_makes || '').split('|').map(m => m.trim());
                const idxModel = models.findIndex(m => m === row.name);
                if (idxModel !== -1 && makes[idxModel]) { foundMake = makes[idxModel]; break; }
              }
              const body = bodyStyles.find(b => (b.model === row.name) && (foundMake ? b.make === foundMake : true));
              const seg = body ? (body.bodystyle || body.bodyStyle || 'Other') : 'Other';
              return { model: row.name, seg, inv: row.value };
            })}
          />
        </div>
      )}
    </div>
  );
};

export default InventoryAnalysis;
