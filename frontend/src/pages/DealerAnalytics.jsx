import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Car,
  TrendingUp,
  Clock,
  PieChart,
  Users,
  ExternalLink,
  Share2,
  Download,
  Star,
  Zap
} from 'lucide-react'
import { MetricCard, LoadingSpinner, Badge } from '../components/common'
import { DataTable } from '../components/tables'
import { SalesTrendChart, MakeDistributionChart, SegmentBarChart } from '../components/charts'
import { formatNumber, formatPercentage, fmtInt, pct, simulateTrends, simulateUnits, splitModels, trendTone } from '../utils'

// Mock data
const mockDealer = {
  mc_dealer_id: '1002806',
  mc_location_id: '2',
  seller_name: 'All Star Chevrolet North',
  city: 'Baton Rouge',
  state: 'LA',
  zip: '70806',
  dealer_type: 'OEM',
  source: 'MarketCheck',
}

const mockKPIs = {
  total_sales: 5200,
  new_car_sales: 3100,
  used_car_sales: 2100,
  active_inventory: 156,
  avg_days_on_market: 32,
  inventory_turnover: 2.3,
  market_segment_share: 12.5,
  number_of_competitors_nearby: 8,
}

const mockTrendData = [
  { month: 'Jan', sales: 420, inventory: 140 },
  { month: 'Feb', sales: 380, inventory: 145 },
  { month: 'Mar', sales: 510, inventory: 155 },
  { month: 'Apr', sales: 490, inventory: 150 },
  { month: 'May', sales: 550, inventory: 160 },
  { month: 'Jun', sales: 620, inventory: 165 },
]

const mockMakeData = [
  { name: 'Chevrolet', value: 2340 },
  { name: 'GMC', value: 1560 },
  { name: 'Cadillac', value: 1300 },
]

const mockSegmentData = [
  { name: 'Truck', value: 1800 },
  { name: 'SUV', value: 1500 },
  { name: 'Sedan', value: 1200 },
  { name: 'Coupe', value: 500 },
  { name: 'Other', value: 200 },
]

const mockMakeModelData = [
  { id: 1, make: 'Chevrolet', model: 'Silverado', segment: 'Truck', sales: 450, inventory: 28, pct: 8.7 },
  { id: 2, make: 'Chevrolet', model: 'Malibu', segment: 'Sedan', sales: 320, inventory: 15, pct: 6.2 },
  { id: 3, make: 'GMC', model: 'Sierra', segment: 'Truck', sales: 280, inventory: 18, pct: 5.4 },
  { id: 4, make: 'Chevrolet', model: 'Tahoe', segment: 'SUV', sales: 250, inventory: 12, pct: 4.8 },
  { id: 5, make: 'Cadillac', model: 'Escalade', segment: 'SUV', sales: 180, inventory: 8, pct: 3.5 },
  { id: 6, make: 'Chevrolet', model: 'Equinox', segment: 'SUV', sales: 220, inventory: 20, pct: 4.2 },
  { id: 7, make: 'GMC', model: 'Yukon', segment: 'SUV', sales: 160, inventory: 10, pct: 3.1 },
  { id: 8, make: 'Chevrolet', model: 'Traverse', segment: 'SUV', sales: 190, inventory: 14, pct: 3.7 },
]

const MODEL_CATALOG = {
  Chevrolet: ['Silverado', 'Tahoe', 'Equinox', 'Malibu', 'Traverse'],
  GMC: ['Sierra', 'Yukon', 'Terrain'],
  Cadillac: ['Escalade', 'XT5', 'CT5'],
  Ford: ['F-150', 'Explorer', 'Escape', 'Mustang'],
  Toyota: ['RAV4', 'Camry', 'Corolla', 'Highlander'],
  Honda: ['CR-V', 'Civic', 'Accord', 'Pilot'],
  Nissan: ['Rogue', 'Altima', 'Titan'],
}

const peerDealers = [
  { id: 'peer-1', name: 'Ganley Chevrolet', type: 'competitor' },
  { id: 'peer-2', name: 'Capitol City Ford', type: 'competitor' },
  { id: 'peer-3', name: 'Southern Toyota', type: 'competitor' },
  { id: 'peer-4', name: 'Metro Honda', type: 'competitor' },
]


const DealerAnalytics = () => {
  const { dealerId, rooftopId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [dealer] = useState(mockDealer)
  const [kpis, setKpis] = useState(null)
  const [makeModels] = useState(mockMakeModelData)

  const [analysisScope, setAnalysisScope] = useState('Dealer') // Dealer | State
  const [dateRange, setDateRange] = useState('30d') // 30d | 3m | 6m | yoy
  const [selectedMake, setSelectedMake] = useState('All Makes')

  const availableMakes = useMemo(() => {
    const set = new Set(makeModels.map((r) => r.make))
    for (const m of mockMakeData) set.add(m.name)
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [makeModels])

  const makeBaseTotals = useMemo(() => {
    const totals = new Map()
    for (const r of makeModels) totals.set(r.make, (totals.get(r.make) || 0) + r.sales)
    for (const m of mockMakeData) totals.set(m.name, Math.max(totals.get(m.name) || 0, m.value))
    return totals
  }, [makeModels])

  const makeSummary = useMemo(() => {
    const levelSeed = `${dealer.mc_dealer_id}:${dealer.state}:${analysisScope}:${dateRange}`
    const stateDealerCount = Math.max(3, peerDealers.length + 1)
    const rows = availableMakes.map((make) => {
      const base = makeBaseTotals.get(make) || 500
      const dealerUnits = simulateUnits(`${levelSeed}:${make}:dealer`, base, dateRange)

      const stateAvgDealerUnits = simulateUnits(`${levelSeed}:${make}:stateAvgDealer`, Math.round(base * 0.92), dateRange)
      const stateTopCompetitorUnits = simulateUnits(`${levelSeed}:${make}:stateTopCompetitor`, Math.round(base * 1.08), dateRange)
      const usAvgDealerUnits = simulateUnits(`usAvg:${make}:${dateRange}`, Math.round(base * 0.88), dateRange)
      const usTopDealerUnits = simulateUnits(`usTop:${make}:${dateRange}`, Math.round(base * 1.18), dateRange)

      const stateUnits = simulateUnits(`${levelSeed}:${make}:stateTotal`, base * stateDealerCount, dateRange)
      const units = analysisScope === 'State' ? stateUnits : dealerUnits
      const { mom, qoq, yoy } = simulateTrends(`${levelSeed}:${make}`)

      return {
        id: make,
        make,
        units,
        dealerUnits,
        stateAvgDealerUnits,
        stateTopCompetitorUnits,
        usAvgDealerUnits,
        usTopDealerUnits,
        stateDealerCount,
        mom,
        qoq,
        yoy,
      }
    })

    const total = rows.reduce((s, r) => s + r.units, 0) || 1
    const enriched = rows
      .map((r) => ({
        ...r,
        share: (r.units / total) * 100,
        dealerVsStateAvg: r.stateAvgDealerUnits > 0 ? ((r.dealerUnits / r.stateAvgDealerUnits) - 1) * 100 : 0,
        dealerVsTopCompetitor: r.stateTopCompetitorUnits > 0 ? ((r.dealerUnits / r.stateTopCompetitorUnits) - 1) * 100 : 0,
        dealerVsUsAvg: r.usAvgDealerUnits > 0 ? ((r.dealerUnits / r.usAvgDealerUnits) - 1) * 100 : 0,
        statePerDealer: r.stateDealerCount > 0 ? (r.units / r.stateDealerCount) : r.units,
        statePerDealerVsUsAvg: r.usAvgDealerUnits > 0
          ? (((r.stateDealerCount > 0 ? (r.units / r.stateDealerCount) : r.units) / r.usAvgDealerUnits) - 1) * 100
          : 0,
        statePerDealerVsUsTop: r.usTopDealerUnits > 0
          ? (((r.stateDealerCount > 0 ? (r.units / r.stateDealerCount) : r.units) / r.usTopDealerUnits) - 1) * 100
          : 0,
      }))
      .sort((a, b) => b.units - a.units)

    return { total, rows: enriched }
  }, [availableMakes, makeBaseTotals, analysisScope, dateRange, dealer.mc_dealer_id, dealer.state])

  const modelRows = useMemo(() => {
    const levelSeed = `${dealer.mc_dealer_id}:${dealer.state}:${analysisScope}:${dateRange}`
    const makes = selectedMake === 'All Makes' ? makeSummary.rows.slice(0, 6).map((r) => r.make) : [selectedMake]
    const rows = []

    for (const make of makes) {
      const makeRow = makeSummary.rows.find((r) => r.make === make)
      const makeUnits = analysisScope === 'State'
        ? (makeRow?.units || 0)
        : (makeRow?.dealerUnits || 0)

      const models = MODEL_CATALOG[make] || ['Model A', 'Model B', 'Model C']
      const splits = splitModels(`${levelSeed}:${make}`, makeUnits, models)
      const totalMake = splits.reduce((s, r) => s + r.units, 0) || 1

      splits.forEach((m) => {
        const { mom, qoq, yoy } = simulateTrends(`${levelSeed}:${make}:${m.model}`)
        rows.push({
          id: `${make}:${m.model}`,
          make,
          model: m.model,
          units: m.units,
          contribution: (m.units / totalMake) * 100,
          mom,
          qoq,
          yoy,
        })
      })
    }

    return rows.sort((a, b) => b.units - a.units)
  }, [analysisScope, dateRange, dealer.mc_dealer_id, dealer.state, makeSummary.rows, selectedMake])

  const trending = useMemo(() => {
    const gaining = [...modelRows]
      .sort((a, b) => (b.yoy + b.qoq + b.mom) - (a.yoy + a.qoq + a.mom))
      .slice(0, 5)
    const declining = [...modelRows]
      .sort((a, b) => (a.yoy + a.qoq + a.mom) - (b.yoy + b.qoq + b.mom))
      .slice(0, 5)
    return { gaining, declining }
  }, [modelRows])

  // Use fetched KPIs when available, otherwise fall back to mock data for layout
  const displayKPIs = kpis || mockKPIs

  // Load real KPIs from backend when dealerId is present
  useEffect(() => {
    let active = true
    const loadKPIs = async () => {
      if (!dealerId) return
      try {
        setLoading(true)
        const result = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/dealer/kpis?dealer_id=${encodeURIComponent(dealerId)}`)
        if (!active) return
        if (!result.ok) throw new Error('Failed to fetch KPIs')
        const data = await result.json()
        setKpis(data)
      } catch (err) {
        // keep mock KPIs if fetch fails
        setKpis(mockKPIs)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadKPIs()
    return () => { active = false }
  }, [dealerId])

  const dealerLeaderboard = useMemo(() => {
    const seed = `${dealer.mc_dealer_id}:${dealer.state}:${dateRange}`
    const make = selectedMake === 'All Makes' ? (makeSummary.rows[0]?.make || 'Chevrolet') : selectedMake
    const base = makeBaseTotals.get(make) || 500
    const targetUnits = simulateUnits(`${seed}:${make}:target`, base, dateRange)

    const peers = peerDealers.map((p) => {
      const units = simulateUnits(`${seed}:${make}:${p.id}`, base * 0.9, dateRange)
      const { mom, qoq, yoy } = simulateTrends(`${seed}:${make}:${p.id}`)
      return { id: p.id, dealer: p.name, units, mom, qoq, yoy, isTarget: false }
    })
    const { mom, qoq, yoy } = simulateTrends(`${seed}:${make}:target`)

    const rows = [
      { id: 'target', dealer: dealer.seller_name, units: targetUnits, mom, qoq, yoy, isTarget: true },
      ...peers,
    ].sort((a, b) => b.units - a.units)

    return { make, rows: rows.map((r, idx) => ({ ...r, rank: idx + 1 })) }
  }, [dealer.mc_dealer_id, dealer.state, dealer.seller_name, dateRange, selectedMake, makeSummary.rows, makeBaseTotals])

  const makeColumns = useMemo(() => {
    const base = [
      { key: 'make', label: 'Make', sortable: true },
      {
        key: 'units',
        label: analysisScope === 'State' ? 'Units Sold (State)' : 'Units Sold (Dealer)',
        sortable: true,
        render: (v) => <span className="font-semibold">{fmtInt(v)}</span>
      },
      {
        key: 'share',
        label: 'Share',
        sortable: true,
        render: (v) => <span className="font-medium">{pct(v)}</span>
      },
      { key: 'mom', label: 'MoM', sortable: true, render: (v) => <span className={trendTone(v)}>{pct(v)}</span> },
      { key: 'qoq', label: 'QoQ', sortable: true, render: (v) => <span className={trendTone(v)}>{pct(v)}</span> },
      { key: 'yoy', label: 'YoY', sortable: true, render: (v) => <span className={trendTone(v)}>{pct(v)}</span> },
    ]

    if (analysisScope === 'State') {
      return [
        ...base,
        { key: 'statePerDealerVsUsAvg', label: 'State vs U.S. Avg (per dealer)', sortable: true, render: (v) => <span className={trendTone(v)}>{pct(v)}</span> },
        { key: 'statePerDealerVsUsTop', label: 'State vs U.S. Top (per dealer)', sortable: true, render: (v) => <span className={trendTone(v)}>{pct(v)}</span> },
      ]
    }

    return [
      ...base,
      { key: 'dealerVsStateAvg', label: 'Dealer vs State Avg', sortable: true, render: (v) => <span className={trendTone(v)}>{pct(v)}</span> },
      { key: 'dealerVsTopCompetitor', label: 'Dealer vs Top Competitor', sortable: true, render: (v) => <span className={trendTone(v)}>{pct(v)}</span> },
      { key: 'dealerVsUsAvg', label: 'Dealer vs U.S. Avg', sortable: true, render: (v) => <span className={trendTone(v)}>{pct(v)}</span> },
    ]
  }, [analysisScope])

  const computedHighlights = useMemo(() => {
    const topMake = makeSummary.rows[0]
    const topModel = modelRows[0]
    const top3Share = makeSummary.rows.slice(0, 3).reduce((s, r) => s + (r.share || 0), 0)
    const concentration = top3Share >= 65 ? 'High' : top3Share >= 50 ? 'Moderate' : 'Low'

    return {
      topMakeName: topMake?.make || '—',
      topMakeShare: topMake ? pct(topMake.share) : '—',
      topModelName: topModel ? `${topModel.make} ${topModel.model}` : '—',
      topModelUnits: topModel ? `${fmtInt(topModel.units)} units` : '—',
      concentration,
    }
  }, [makeSummary.rows, modelRows])

  const modelColumns = [
    { key: 'make', label: 'Make', sortable: true },
    { key: 'model', label: 'Model', sortable: true },
    { key: 'units', label: 'Units', sortable: true, render: (v) => <span className="font-semibold">{fmtInt(v)}</span> },
    {
      key: 'contribution',
      label: 'Contribution',
      sortable: true,
      render: (v) => (
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, v))}%` }}
            />
          </div>
          <span className="text-sm font-medium">{pct(v)}</span>
        </div>
      )
    },
    { key: 'mom', label: 'MoM', sortable: true, render: (v) => <span className={trendTone(v)}>{pct(v)}</span> },
    { key: 'qoq', label: 'QoQ', sortable: true, render: (v) => <span className={trendTone(v)}>{pct(v)}</span> },
    { key: 'yoy', label: 'YoY', sortable: true, render: (v) => <span className={trendTone(v)}>{pct(v)}</span> },
  ]

  const dealerColumns = [
    { key: 'rank', label: 'Rank', sortable: true },
    {
      key: 'dealer',
      label: 'Dealer',
      sortable: true,
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${row.isTarget ? 'text-primary-700' : 'text-gray-900'}`}>{v}</span>
          {row.isTarget && <Badge label="You" color="primary" size="sm" />}
        </div>
      )
    },
    { key: 'units', label: 'Units', sortable: true, render: (v) => <span className="font-semibold">{fmtInt(v)}</span> },
    { key: 'mom', label: 'MoM', sortable: true, render: (v) => <span className={trendTone(v)}>{pct(v)}</span> },
    { key: 'qoq', label: 'QoQ', sortable: true, render: (v) => <span className={trendTone(v)}>{pct(v)}</span> },
    { key: 'yoy', label: 'YoY', sortable: true, render: (v) => <span className={trendTone(v)}>{pct(v)}</span> },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-16px)] w-full overflow-hidden text-[11px] p-1">
      <div className="flex flex-col gap-1 h-full min-h-0">

        {/* ── Row 1: Header Card ── */}
        <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm flex-none">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-500 via-primary-400 to-accent-500" />
          <div className="p-2">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <button
                  onClick={() => navigate('/dealers')}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors mt-1"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-500" />
                </button>
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-[13px] font-semibold text-gray-900">{dealer.seller_name}</h1>
                    <Badge label={dealer.dealer_type} color="primary" size="sm" />
                    <Badge label={dealer.source} color="gray" size="sm" />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-[10px]">{dealer.city}, {dealer.state} {dealer.zip}</span>
                    </div>
                    <span className="text-gray-300 hidden sm:inline">•</span>
                    <span className="text-[10px] font-mono bg-gray-100 px-2 py-0.5 rounded">
                      ID: {dealer.mc_dealer_id}_{dealer.mc_location_id}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pl-12 lg:pl-0">
                <button className="btn-secondary py-1.5 flex items-center gap-2 text-[10px]">
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Share</span>
                </button>
                <button className="btn-secondary py-1.5 flex items-center gap-2 text-[10px]">
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  onClick={() => navigate(`/dealer/${dealerId}/${rooftopId}/competitors`)}
                  className="btn-primary py-1.5 flex items-center gap-2 text-[10px]"
                >
                  <Users className="w-3.5 h-3.5" />
                  View Competitors
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 2: KPI Grid (4 primary MetricCards) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 flex-none">
          <MetricCard
            title="Total Sales (YTD)"
            value={formatNumber(kpis.total_sales)}
            trend={12.5}
            icon={TrendingUp}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-100"
            size="compact"
          />
          <MetricCard
            title="Active Inventory"
            value={formatNumber(kpis.active_inventory)}
            trend={-3.2}
            icon={Car}
            iconColor="text-blue-500"
            iconBg="bg-blue-100"
            size="compact"
          />
          <MetricCard
            title="Days on Market"
            value={kpis.avg_days_on_market}
            icon={Clock}
            iconColor="text-purple-500"
            iconBg="bg-purple-100"
            size="compact"
          />
          <MetricCard
            title="Market Share"
            value={formatPercentage(kpis.market_segment_share)}
            trend={5.1}
            icon={PieChart}
            iconColor="text-orange-500"
            iconBg="bg-orange-100"
            size="compact"
          />
        </div>

        {/* ── Row 3: Secondary Stats (4 simple stat cards) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 flex-none">
          {[
            { label: 'New Car Sales', value: formatNumber(kpis.new_car_sales), color: 'emerald' },
            { label: 'Used Car Sales', value: formatNumber(kpis.used_car_sales), color: 'blue' },
            { label: 'Inventory Turnover', value: `${kpis.inventory_turnover}x`, color: 'purple' },
            { label: 'Nearby Competitors', value: kpis.number_of_competitors_nearby, color: 'orange' },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-gray-100 p-2 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <p className="text-[9px] text-gray-500 font-medium">{stat.label}</p>
              <p className="text-[12px] font-semibold text-gray-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ── Row 4: 3 Charts + Quick Insights — all in ONE ROW, same height ── */}
        <div className="flex gap-1 flex-none items-stretch" style={{ height: '300px' }}>

          {/* Chart 1: Sales vs Inventory Trend */}
          <div className="flex-1 min-w-0 h-full">
            <SalesTrendChart
              data={mockTrendData}
              title="Sales vs Inventory Trend"
              timeLabel="Monthly"
              xKey="month"
              showInventory
            />
          </div>

          {/* Chart 2: Sales by Make */}
          <div className="flex-1 min-w-0 h-full">
            <MakeDistributionChart data={mockMakeData} title="Sales by Make" compact />
          </div>

          {/* Chart 3: Sales by Segment */}
          <div className="flex-1 min-w-0 h-full overflow-hidden" style={{ minHeight: 0 }}>
            <div className="h-full w-full [&>*]:!h-full [&>*]:!max-h-full">
              <SegmentBarChart data={mockSegmentData} title="Sales by Segment" compact />
            </div>
          </div>

          {/* Quick Insights — fixed width, same height as charts */}
          <div className="w-[210px] flex-none h-full bg-white rounded-2xl border border-gray-100 p-1.5 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 mb-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <h3 className="text-[11px] font-semibold text-gray-900">Quick Insights</h3>
            </div>
            <div className="space-y-1.5">
              {[
                { label: 'Top Selling Make', value: computedHighlights.topMakeName, sub: `${computedHighlights.topMakeShare} of total`, icon: Star },
                { label: 'Top Selling Model', value: computedHighlights.topModelName, sub: computedHighlights.topModelUnits, icon: TrendingUp },
                { label: 'Top Segment', value: 'Truck', sub: '35% market share', icon: Car },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-1 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 bg-white rounded-lg shadow-sm">
                      <item.icon className="w-3 h-3 text-gray-500" />
                    </div>
                    <span className="text-[8.5px] text-gray-600 font-medium">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8.5px] font-semibold text-gray-900">{item.value}</span>
                    <p className="text-[7.5px] text-gray-400 leading-none mt-0.5">{item.sub}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between p-1 bg-amber-50 rounded-lg">
                <span className="text-[8.5px] text-gray-600 font-medium">Market Concentration</span>
                <Badge label={computedHighlights.concentration} color={computedHighlights.concentration === 'High' ? 'red' : computedHighlights.concentration === 'Moderate' ? 'yellow' : 'green'} size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Rows 5–7: Make & Model Sales Analysis ── */}
        <div className="flex flex-col gap-1 flex-1 min-h-0">
          <div className="flex items-center justify-between flex-none">
            <h2 className="text-[11px] font-semibold text-gray-900">Make & Model Sales Analysis</h2>
            <button className="text-[9px] text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              Export Data
            </button>
          </div>

          {/* Filters bar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-1.5 shadow-sm flex-none">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <div className="text-[8.5px] font-semibold text-gray-700">Scope</div>
                  <select
                    value={analysisScope}
                    onChange={(e) => setAnalysisScope(e.target.value)}
                    className="mt-0.5 text-[9px] border border-gray-200 rounded-lg px-2 py-0.5 bg-white"
                  >
                    <option value="Dealer">Dealer</option>
                    <option value="State">State</option>
                  </select>
                </div>
                <div>
                  <div className="text-[8.5px] font-semibold text-gray-700">Date range</div>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="mt-0.5 text-[9px] border border-gray-200 rounded-lg px-2 py-0.5 bg-white"
                  >
                    <option value="30d">Last 30 days</option>
                    <option value="3m">Last 3 months</option>
                    <option value="6m">Last 6 months</option>
                    <option value="yoy">Year-over-Year</option>
                  </select>
                </div>
                <div>
                  <div className="text-[8.5px] font-semibold text-gray-700">Make</div>
                  <select
                    value={selectedMake}
                    onChange={(e) => setSelectedMake(e.target.value)}
                    className="mt-0.5 text-[9px] border border-gray-200 rounded-lg px-2 py-0.5 bg-white"
                  >
                    <option>All Makes</option>
                    {availableMakes.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="text-[8.5px] text-gray-500">
                <span className="font-semibold text-gray-900">{dealer.state}</span> + <span className="font-semibold text-gray-900">U.S.</span> benchmarks included for comparisons
              </div>
            </div>
          </div>

          {/* Tables: Make-level + Top trending */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
            <div className="space-y-1">
              <h3 className="text-[10px] font-semibold text-gray-900">Make-level performance</h3>
              <div className="overflow-auto">
                <DataTable
                  columns={makeColumns}
                  data={makeSummary.rows}
                  sortable={true}
                  paginated={true}
                  pageSize={3}
                  density="compact"
                />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-[10px] font-semibold text-gray-900">Top trending models</h3>
              <div className="bg-white rounded-2xl border border-gray-100 p-1.5 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <div className="text-[9px] font-bold text-emerald-700 mb-1">Gaining</div>
                    <div className="space-y-2">
                      {trending.gaining.slice(0, 2).map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-1 rounded-lg bg-emerald-50/60 border border-emerald-100">
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 truncate text-[9px]">{m.make} {m.model}</div>
                            <div className="text-[8px] text-gray-500">{fmtInt(m.units)} units • {pct(m.contribution)} of make</div>
                          </div>
                          <div className="text-[8px] font-semibold text-emerald-700">{pct(m.yoy)} YoY</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-rose-700 mb-1">Declining</div>
                    <div className="space-y-2">
                      {trending.declining.slice(0, 2).map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-1 rounded-lg bg-rose-50/60 border border-rose-100">
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 truncate text-[9px]">{m.make} {m.model}</div>
                            <div className="text-[8px] text-gray-500">{fmtInt(m.units)} units • {pct(m.contribution)} of make</div>
                          </div>
                          <div className="text-[8px] font-semibold text-rose-700">{pct(m.yoy)} YoY</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tables: Model-level + Dealer leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
            <div className="space-y-1">
              <h3 className="text-[10px] font-semibold text-gray-900">Model-level breakdown</h3>
              <div className="overflow-auto">
                <DataTable
                  columns={modelColumns}
                  data={modelRows}
                  sortable={true}
                  paginated={true}
                  pageSize={3}
                  density="compact"
                />
              </div>
            </div>

            <div className="space-y-1 ">
              <h3 className="text-[10px] font-semibold text-gray-900">Dealer performance (leaderboard)</h3>
              <div className="text-[9px] text-gray-500">Comparing dealers on <span className="font-semibold text-gray-900">{dealerLeaderboard.make}</span></div>
              <div className="overflow-auto">
                <DataTable
                  columns={dealerColumns}
                  data={dealerLeaderboard.rows}
                  sortable={true}
                  paginated={false}
                  density="compact"
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default DealerAnalytics
