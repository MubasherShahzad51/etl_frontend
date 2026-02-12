import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  MapPin, 
  Users, 
  Filter,
  Grid,
  List,
  Map,
  Target,
  TrendingUp,
  Zap
} from 'lucide-react'
import { CompetitorCard, LoadingSpinner, EmptyState, Badge } from '../components/common'
import { RadiusSlider } from '../components/filters'
import { CompetitorMap } from '../components/maps'
import { DataTable } from '../components/tables'
import { formatNumber, fmtInt, hashToUnit, pct, simulateTrends, simulateUnits, splitModels, trendTone } from '../utils'

// Mock competitor data
const mockCompetitors = [
  {
    mc_dealer_id: '1002268',
    seller_name: 'Ganley Chevrolet of Aurora',
    distance_miles: 8.5,
    shared_makes: ['Chevrolet', 'GMC'],
    shared_models: ['Silverado', 'Sierra', 'Tahoe'],
    shared_model_sales: 320,
    competitor_rank: 1,
  },
  {
    mc_dealer_id: '1003456',
    seller_name: 'Capitol City Ford',
    distance_miles: 12.3,
    shared_makes: ['Ford'],
    shared_models: ['F-150', 'Explorer', 'Mustang'],
    shared_model_sales: 280,
    competitor_rank: 2,
  },
  {
    mc_dealer_id: '1004567',
    seller_name: 'Southern Toyota',
    distance_miles: 15.7,
    shared_makes: ['Toyota'],
    shared_models: ['Camry', 'RAV4', 'Tundra'],
    shared_model_sales: 245,
    competitor_rank: 3,
  },
  {
    mc_dealer_id: '1005678',
    seller_name: 'Metro Honda',
    distance_miles: 18.2,
    shared_makes: ['Honda'],
    shared_models: ['Civic', 'CR-V', 'Accord'],
    shared_model_sales: 210,
    competitor_rank: 4,
  },
  {
    mc_dealer_id: '1006789',
    seller_name: 'Delta Nissan',
    distance_miles: 22.5,
    shared_makes: ['Nissan'],
    shared_models: ['Altima', 'Rogue', 'Titan'],
    shared_model_sales: 180,
    competitor_rank: 5,
  },
  {
    mc_dealer_id: '1007890',
    seller_name: 'Bayou Motors',
    distance_miles: 25.8,
    shared_makes: ['Chevrolet', 'Ford', 'Toyota'],
    shared_models: ['Silverado', 'F-150', 'Tacoma'],
    shared_model_sales: 150,
    competitor_rank: 6,
  },
]

const mockTargetDealer = {
  mc_dealer_id: '1002806',
  seller_name: 'All Star Chevrolet North',
  city: 'Baton Rouge',
  state: 'LA',
}

const MODEL_CATALOG = {
  Chevrolet: ['Silverado', 'Tahoe', 'Equinox', 'Malibu', 'Traverse'],
  GMC: ['Sierra', 'Yukon', 'Terrain'],
  Cadillac: ['Escalade', 'XT5', 'CT5'],
  Ford: ['F-150', 'Explorer', 'Escape', 'Mustang'],
  Toyota: ['RAV4', 'Camry', 'Corolla', 'Highlander', 'Tacoma', 'Tundra'],
  Honda: ['CR-V', 'Civic', 'Accord', 'Pilot'],
  Nissan: ['Rogue', 'Altima', 'Titan'],
}

const baseForMake = (make) => Math.round(350 + hashToUnit(`base:${make}`) * 950)

const CompetitorAnalysis = () => {
  const { dealerId, rooftopId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [radius, setRadius] = useState(25)
  const [viewMode, setViewMode] = useState('grid')
  const [selectedMakes, setSelectedMakes] = useState([])

  const [dateRange, setDateRange] = useState('30d') // 30d | 3m | 6m | yoy
  const [analysisMake, setAnalysisMake] = useState('All Makes')

  const availableMakes = ['Chevrolet', 'Ford', 'Toyota', 'Honda', 'GMC', 'Nissan']

  const competitors = useMemo(() => {
    const byRadius = mockCompetitors.filter((c) => c.distance_miles <= radius)
    if (!selectedMakes.length) return byRadius
    return byRadius.filter((c) => c.shared_makes?.some((m) => selectedMakes.includes(m)))
  }, [radius, selectedMakes])

  const effectiveMakeForModels = useMemo(() => {
    if (analysisMake !== 'All Makes') return analysisMake
    if (selectedMakes.length === 1) return selectedMakes[0]
    if (availableMakes.includes('Chevrolet')) return 'Chevrolet'
    return availableMakes[0]
  }, [analysisMake, availableMakes, selectedMakes])

  const toggleMake = (make) => {
    setSelectedMakes(prev => 
      prev.includes(make) 
        ? prev.filter(m => m !== make)
        : [...prev, make]
    )
  }

  const summaryStats = {
    totalCompetitors: competitors.length,
    highThreat: competitors.filter(c => c.competitor_rank <= 3).length,
    avgDistance: competitors.length > 0 
      ? (competitors.reduce((sum, c) => sum + c.distance_miles, 0) / competitors.length).toFixed(1)
      : 0,
    totalSharedSales: competitors.reduce((sum, c) => sum + c.shared_model_sales, 0),
  }

  const makeComparison = useMemo(() => {
    const seed = `${mockTargetDealer.mc_dealer_id}:${mockTargetDealer.state}:${dateRange}`
    const makes = analysisMake === 'All Makes' ? availableMakes : [analysisMake]

    const rows = makes.map((make) => {
      const base = baseForMake(make)
      const targetUnits = simulateUnits(`${seed}:target:${make}`, base, dateRange)
      const targetTrends = simulateTrends(`${seed}:target:${make}`)

      const usAvgUnits = simulateUnits(`usAvg:${make}:${dateRange}`, Math.round(base * 0.88), dateRange)

      const competitorUnits = competitors.map((c) => ({
        id: c.mc_dealer_id,
        name: c.seller_name,
        units: simulateUnits(`${seed}:comp:${c.mc_dealer_id}:${make}`, base * 0.9, dateRange),
        trends: simulateTrends(`${seed}:comp:${c.mc_dealer_id}:${make}`),
      }))

      const best = competitorUnits.sort((a, b) => b.units - a.units)[0]
      const bestUnits = best?.units ?? 0
      const bestName = best?.name ?? '—'
      const bestYoY = best?.trends?.yoy ?? 0

      return {
        id: make,
        make,
        targetUnits,
        usAvgUnits,
        youVsUsAvg: usAvgUnits > 0 ? ((targetUnits / usAvgUnits) - 1) * 100 : 0,
        bestCompetitor: bestName,
        bestUnits,
        gapPct: bestUnits > 0 ? ((targetUnits / bestUnits) - 1) * 100 : 0,
        targetYoY: targetTrends.yoy,
        bestYoY,
      }
    })

    return rows.sort((a, b) => b.targetUnits - a.targetUnits)
  }, [analysisMake, availableMakes, competitors, dateRange])

  const competitorLeaderboard = useMemo(() => {
    const seed = `${mockTargetDealer.mc_dealer_id}:${mockTargetDealer.state}:${dateRange}`
    const make = effectiveMakeForModels
    const base = baseForMake(make)

    const targetUnits = simulateUnits(`${seed}:target:${make}`, base, dateRange)
    const targetTrends = simulateTrends(`${seed}:target:${make}`)

    const rows = [
      {
        id: 'target',
        dealer: mockTargetDealer.seller_name,
        units: targetUnits,
        ...targetTrends,
        isTarget: true,
      },
      ...competitors.map((c) => {
        const units = simulateUnits(`${seed}:comp:${c.mc_dealer_id}:${make}`, base * 0.9, dateRange)
        const trends = simulateTrends(`${seed}:comp:${c.mc_dealer_id}:${make}`)
        return {
          id: c.mc_dealer_id,
          dealer: c.seller_name,
          units,
          ...trends,
          isTarget: false,
        }
      })
    ]
      .sort((a, b) => b.units - a.units)
      .map((r, idx) => ({ ...r, rank: idx + 1 }))

    return { make, rows }
  }, [competitors, dateRange, effectiveMakeForModels])

  const modelOverlap = useMemo(() => {
    const seed = `${mockTargetDealer.mc_dealer_id}:${mockTargetDealer.state}:${dateRange}`
    const make = effectiveMakeForModels
    const base = baseForMake(make)
    const makeUnits = simulateUnits(`${seed}:target:${make}`, base, dateRange)

    const modelsFromCatalog = MODEL_CATALOG[make] || []
    const modelsFromCompetitors = new Set()
    competitors.forEach((c) => c.shared_models?.forEach((m) => modelsFromCompetitors.add(m)))

    const models = Array.from(new Set([...
      modelsFromCatalog,
      ...Array.from(modelsFromCompetitors),
    ])).slice(0, 10)

    const splits = splitModels(`${seed}:target:${make}`, makeUnits, models.length ? models : ['Model A', 'Model B', 'Model C'])
    const totalMake = splits.reduce((s, r) => s + r.units, 0) || 1

    const rows = splits.map((m) => {
      const { mom, qoq, yoy } = simulateTrends(`${seed}:target:${make}:${m.model}`)

      const competitorAvgUnits = competitors.length
        ? Math.round(competitors.reduce((s, c) => {
          const baseModel = Math.round(base * 0.55)
          return s + simulateUnits(`${seed}:comp:${c.mc_dealer_id}:${make}:${m.model}`, baseModel, dateRange)
        }, 0) / competitors.length)
        : 0

      const usAvgUnits = simulateUnits(`usAvg:${make}:${m.model}:${dateRange}`, Math.round(base * 0.5), dateRange)

      return {
        id: `${make}:${m.model}`,
        model: m.model,
        targetUnits: m.units,
        competitorAvgUnits,
        gapPct: competitorAvgUnits > 0 ? ((m.units / competitorAvgUnits) - 1) * 100 : 0,
        usAvgUnits,
        youVsUsAvg: usAvgUnits > 0 ? ((m.units / usAvgUnits) - 1) * 100 : 0,
        contribution: (m.units / totalMake) * 100,
        mom,
        qoq,
        yoy,
      }
    })

    return { make, rows: rows.sort((a, b) => b.targetUnits - a.targetUnits) }
  }, [competitors, dateRange, effectiveMakeForModels])

  const makeColumns = [
    { key: 'make', label: 'Make', sortable: true },
    { key: 'targetUnits', label: 'Your Units', sortable: true, render: (v) => <span className="font-semibold">{fmtInt(v)}</span> },
    { key: 'usAvgUnits', label: 'U.S. Avg', sortable: true, render: (v) => <span className="font-semibold">{fmtInt(v)}</span> },
    { key: 'youVsUsAvg', label: 'You vs U.S. Avg', sortable: true, render: (v) => <span className={trendTone(v)}>{pct(v)}</span> },
    { key: 'bestCompetitor', label: 'Best Competitor', sortable: true },
    { key: 'bestUnits', label: 'Best Units', sortable: true, render: (v) => <span className="font-semibold">{fmtInt(v)}</span> },
    { key: 'gapPct', label: 'You vs Best', sortable: true, render: (v) => <span className={trendTone(v)}>{pct(v)}</span> },
    { key: 'targetYoY', label: 'Your YoY', sortable: true, render: (v) => <span className={trendTone(v)}>{pct(v)}</span> },
    { key: 'bestYoY', label: 'Best YoY', sortable: true, render: (v) => <span className={trendTone(v)}>{pct(v)}</span> },
  ]

  const leaderboardColumns = [
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

  const modelColumns = [
    { key: 'model', label: 'Model', sortable: true },
    { key: 'targetUnits', label: 'Your Units', sortable: true, render: (v) => <span className="font-semibold">{fmtInt(v)}</span> },
    { key: 'competitorAvgUnits', label: 'Competitor Avg', sortable: true, render: (v) => <span className="font-semibold">{fmtInt(v)}</span> },
    { key: 'gapPct', label: 'You vs Avg', sortable: true, render: (v) => <span className={trendTone(v)}>{pct(v)}</span> },
    { key: 'usAvgUnits', label: 'U.S. Avg', sortable: true, render: (v) => <span className="font-semibold">{fmtInt(v)}</span> },
    { key: 'youVsUsAvg', label: 'You vs U.S. Avg', sortable: true, render: (v) => <span className={trendTone(v)}>{pct(v)}</span> },
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-500/20 rounded-full blur-3xl" />
        
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            onClick={() => navigate(`/dealer/${dealerId}/${rooftopId}`)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">Competitor Analysis</h1>
            <p className="text-white/70">
              Analyzing competitors within <span className="text-white font-semibold">{radius} miles</span> radius
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge label={`${competitors.length} competitors`} color="blue" />
          </div>
        </div>
      </div>

      {/* Make/Model Competitive Analysis */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Make & Model Competitive Analysis</h2>
            <p className="text-sm text-gray-500">Deterministic trends and units (mock) with competitor + U.S. benchmarks</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-700">Date range</div>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white"
              >
                <option value="30d">Last 30 days</option>
                <option value="3m">Last 3 months</option>
                <option value="6m">Last 6 months</option>
                <option value="yoy">Year-over-Year</option>
              </select>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-700">Make</div>
              <select
                value={analysisMake}
                onChange={(e) => setAnalysisMake(e.target.value)}
                className="mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white"
              >
                <option>All Makes</option>
                {availableMakes.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900">Make ranking (you vs best competitor)</h3>
            <DataTable
              columns={makeColumns}
              data={makeComparison}
              sortable={true}
              paginated={true}
              pageSize={6}
            />
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900">Dealer leaderboard ({competitorLeaderboard.make})</h3>
            <DataTable
              columns={leaderboardColumns}
              data={competitorLeaderboard.rows}
              sortable={true}
              paginated={false}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900">Model overlap ({modelOverlap.make})</h3>
          <DataTable
            columns={modelColumns}
            data={modelOverlap.rows}
            sortable={true}
            paginated={true}
            pageSize={8}
          />
        </div>
      </div>

      {/* Competitors */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Competitors</h2>
            <p className="text-sm text-gray-500">Tune radius + make filters, then review the grid/list/map</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge label={`${competitors.length} competitors`} color="blue" />
            <Badge label={`${summaryStats.highThreat} high threat`} color={summaryStats.highThreat > 0 ? 'red' : 'gray'} />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Competitors', value: summaryStats.totalCompetitors, icon: Users, color: 'blue' },
            { label: 'High Threat', value: summaryStats.highThreat, icon: Target, color: 'red' },
            { label: 'Avg Distance', value: `${summaryStats.avgDistance} mi`, icon: MapPin, color: 'purple' },
            { label: 'Shared Sales', value: formatNumber(summaryStats.totalSharedSales), icon: TrendingUp, color: 'emerald' },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${
                    stat.color === 'red' ? 'text-rose-600' : 'text-gray-900'
                  }`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${
                  stat.color === 'blue' ? 'bg-blue-100' :
                  stat.color === 'red' ? 'bg-rose-100' :
                  stat.color === 'purple' ? 'bg-purple-100' :
                  'bg-emerald-100'
                }`}>
                  <stat.icon className={`w-5 h-5 ${
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'red' ? 'text-rose-600' :
                    stat.color === 'purple' ? 'text-purple-600' :
                    'text-emerald-600'
                  }`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Radius Slider */}
            <div className="lg:col-span-1">
              <RadiusSlider
                value={radius}
                onChange={setRadius}
                min={15}
                max={50}
              />
            </div>

            {/* Make Filter */}
            <div className="lg:col-span-1">
              <label className="text-sm font-semibold text-gray-700 block mb-3">
                Filter by Make
              </label>
              <div className="flex flex-wrap gap-2">
                {availableMakes.map((make) => (
                  <button
                    key={make}
                    onClick={() => toggleMake(make)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      selectedMakes.includes(make)
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {make}
                  </button>
                ))}
              </div>
            </div>

            {/* View Toggle */}
            <div className="lg:col-span-1 flex items-end justify-end">
              <div className="flex bg-gray-100 rounded-xl p-1">
                {[
                  { mode: 'grid', icon: Grid, label: 'Grid' },
                  { mode: 'list', icon: List, label: 'List' },
                  { mode: 'map', icon: Map, label: 'Map' },
                ].map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`p-3 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                      viewMode === mode
                        ? 'bg-white shadow-sm text-primary-600'
                        : 'hover:bg-gray-200 text-gray-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Map View */}
        {!loading && viewMode === 'map' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-[500px]">
              <CompetitorMap
                targetDealer={mockTargetDealer}
                competitors={competitors}
                radius={radius}
                center={[-91.1871, 30.4515]} // Baton Rouge, LA
                zoom={9}
              />
            </div>
          </div>
        )}

        {/* Competitor Grid/List */}
        {!loading && viewMode !== 'map' && competitors.length > 0 && (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {competitors.map((competitor, index) => (
              <div
                key={competitor.mc_dealer_id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CompetitorCard competitor={competitor} />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && competitors.length === 0 && (
          <EmptyState
            icon={Users}
            title="No competitors found"
            description={`No competing dealers found within ${radius} miles. Try increasing the radius.`}
          />
        )}
      </div>
    </div>
  )
}

export default CompetitorAnalysis
