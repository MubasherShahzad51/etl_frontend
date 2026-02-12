import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Papa from 'papaparse'
import api from '../services/api'
import { DataTable } from '../components/tables'
import TerritoryFilters from '../components/filters/TerritoryFilters'

import DashboardTable from '../components/common/DashboardTable'

import { kpiIcons } from '../components/common/kpiIcons'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  LabelList,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const toNumber = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const splitList = (v) => {
  if (!v) return []
  if (Array.isArray(v)) return v
  return String(v)
    .split(/[,|]/g)
    .map((s) => s.trim())
    .filter(Boolean)
}

const normalizeKey = (make, model) => {
  const m = String(make || '').trim().toLowerCase()
  const mo = String(model || '').trim().toLowerCase()
  const key = `${m} ${mo}`.trim()
  return key || ''
}

const normalizeSegment = (segment) => {
  const s = String(segment || '').trim().toLowerCase()
  if (!s) return 'Other'
  if (s.includes('truck')) return 'Trucks'
  if (s.includes('suv') || s.includes('cuv')) return 'SUVs'
  if (s.includes('van')) return 'Vans'
  if (s.includes('coupe')) return 'Coupes'
  if (s.includes('convert')) return 'Convertibles'
  if (s.includes('wagon')) return 'Wagons'
  if (s.includes('hatch')) return 'Hatchbacks'
  if (s.includes('sedan')) return 'Sedans'
  if (s.includes('ev') || s.includes('electric')) return 'EVs'
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

const SEGMENT_ORDER = ['Trucks', 'SUVs', 'Sedans', 'Hatchbacks', 'Wagons', 'Coupes', 'Convertibles', 'Vans', 'EVs', 'Other']

const parseCsv = (text) => {
  const result = Papa.parse(String(text || ''), {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })
  const rows = Array.isArray(result.data) ? result.data : []
  return rows.map((r) => {
    const row = {}
    for (const [k, v] of Object.entries(r || {})) {
      row[String(k || '').trim()] = typeof v === 'string' ? v.trim() : v
    }
    row.make = row.make ?? row.Make ?? row.MAKE ?? ''
    row.model = row.model ?? row.Model ?? row.MODEL ?? ''
    row.bodyStyle = row.bodyStyle ?? row.body_style ?? row.BodyStyle ?? row['Body Style'] ?? ''
    return row
  })
}

const hashToUnit = (str) => {
  const s = String(str || '')
  let h = 2166136261
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

const pseudoTrend = (seed, { base = 0, swing = 1 } = {}) => {
  const u = hashToUnit(seed)
  return base + (u - 0.5) * 2 * swing
}

const velocityTone = (v) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return 'border-slate-200 text-slate-600 bg-slate-50'
  if (n > 1.2) return 'border-emerald-200 text-emerald-700 bg-emerald-50'
  if (n >= 0.8) return 'border-amber-200 text-amber-700 bg-amber-50'
  return 'border-rose-200 text-rose-700 bg-rose-50'
}

const buildTrendSeries = ({ length = 30, baseSales = 0, baseInventory = 0, seed = '' }) => {
  const out = []
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  const swingSales = Math.max(1, baseSales * 0.25)
  const swingInv = Math.max(1, baseInventory * 0.2)
  for (let i = length - 1; i >= 0; i -= 1) {
    const t = now - i * dayMs
    const d = new Date(t)
    const label = `${d.getMonth() + 1}/${d.getDate()}`
    const s = Math.max(0, baseSales + pseudoTrend(`${seed}:sales:${i}`, { base: 0, swing: swingSales }))
    const inv = Math.max(0, baseInventory + pseudoTrend(`${seed}:inv:${i}`, { base: 0, swing: swingInv }))
    out.push({ date: label, sales: Math.round(s), inventory: Math.round(inv) })
  }
  return out
}

const segmentValueLabel = (props) => {
  const { x, y, width, height, value } = props
  const v = Number(value)
  if (!Number.isFinite(v)) return null
  const rounded = v >= 10 ? v.toFixed(0) : v >= 1 ? v.toFixed(1) : v.toFixed(2)
  const text = `${rounded}%`

  const pad = 10
  const isSmall = width < 84
  const fill = isSmall ? '#334155' : '#ffffff'
  const tx = isSmall ? (x + width + pad) : (x + width - pad)
  const anchor = isSmall ? 'start' : 'end'
  const ty = y + height / 2 + 4

  return (
    <text x={tx} y={ty} textAnchor={anchor} fill={fill} fontWeight={700} fontSize={12}>
      {text}
    </text>
  )
}

const highlightTone = (key) => {
  if (key === 'top_segment') return 'border-indigo-200 bg-indigo-50 text-indigo-700'
  if (key === 'concentration') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (key === 'inv_sales') return 'border-slate-200 bg-slate-50 text-slate-700'
  if (key === 'opportunity') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (key === 'growing') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (key === 'declining') return 'border-rose-200 bg-rose-50 text-rose-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

const fmtInt = (n) => {
  const v = Number(n || 0)
  return Math.round(v).toLocaleString()
}

const fmtDelta = (n) => {
  const v = Number(n || 0)
  const s = v >= 0 ? '+' : ''
  return `${s}${fmtInt(v)}`
}

const pct = (v) => {
  if (v === 0) return '0%'
  const s = v > 0 ? '+' : ''
  return `${s}${v.toFixed(1)}%`
}

const trendClass = (v) => (v >= 0 ? 'text-emerald-600' : 'text-rose-600')

const toneToStroke = (tone) => {
  switch (tone) {
    case 'emerald': return '#059669'
    case 'rose': return '#e11d48'
    case 'amber': return '#d97706'
    case 'sky': return '#0284c7'
    case 'indigo': return '#4f46e5'
    case 'slate': return '#64748b'
    case 'auto':
    default: return '#4f46e5'
  }
}

const MiniSpark = ({ data = [], tone = 'auto', width = 84, height = 12 }) => {
  const pts = Array.isArray(data) ? data : []
  const n = pts.length
  if (n < 2) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#e2e8f0" strokeWidth="2" />
      </svg>
    )
  }

  const values = pts.map((d) => Number(d?.sales ?? d?.value ?? 0))
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const span = Math.max(1e-6, maxV - minV)

  const dx = width / (n - 1)
  const yFor = (v) => {
    const t = (v - minV) / span
    const y = height - (t * (height - 2)) - 1
    return Number.isFinite(y) ? y : height / 2
  }

  const points = values
    .map((v, i) => `${(i * dx).toFixed(2)},${yFor(v).toFixed(2)}`)
    .join(' ')

  const stroke = toneToStroke(tone)

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline fill="none" stroke={stroke} strokeWidth="2" points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const MarketDashboard = () => {
  const navigate = useNavigate()
  const [scope, setScope] = useState('USA')
  const [territoryState, setTerritoryState] = useState('')
  const [timeRange, setTimeRange] = useState('30d')
  const [dealers, setDealers] = useState([])
  const [bodyStyleMap, setBodyStyleMap] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoading(true)
        const [dealerText, bodyText] = await Promise.all([
          fetch('/dealer_sales_summary_simple.csv').then((r) => r.text()),
          fetch('/Make_Model_BodyStyle.csv').then((r) => r.text()),
        ])

        if (!active) return

        const dealerRows = parseCsv(dealerText)
        const bodyRows = parseCsv(bodyText)
        const map = new Map()
        bodyRows.forEach((row) => {
          const key = normalizeKey(row.make, row.model)
          if (!key || !row.bodyStyle) return
          map.set(key, row.bodyStyle)
        })

        setBodyStyleMap(map)
        setDealers(dealerRows)
        setError('')
      } catch (err) {
        if (!active) return
        setError('Unable to load market data.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])


  const states = useMemo(() => {
    const set = new Set(dealers.map((d) => d.state).filter(Boolean))
    return Array.from(set).sort()
  }, [dealers])

  useEffect(() => {
    if (!territoryState && states.length) setTerritoryState(states[0])
  }, [territoryState, states])

  const filteredDealers = useMemo(() => {
    if (scope === 'USA') return dealers
    return dealers.filter((d) => d.state === territoryState)
  }, [dealers, scope, territoryState])

  const [apiKpis, setApiKpis] = useState(null)
  const [apiTopModels, setApiTopModels] = useState(null)
  const [apiLeaders, setApiLeaders] = useState(null)
  const [apiFastestRising, setApiFastestRising] = useState(null)
  const [apiSegmentShare, setApiSegmentShare] = useState(null)
  const [apiTopTrends, setApiTopTrends] = useState(null)
  const [apiMarketHighlights, setApiMarketHighlights] = useState(null)
  const [apiRecentActivity, setApiRecentActivity] = useState(null)
  const [apiRecommendations, setApiRecommendations] = useState(null)
  const [apiMarketDirection, setApiMarketDirection] = useState(null)
  const [apiOppRisk, setApiOppRisk] = useState(null)

  useEffect(() => {
    let alive = true
    const loadKpis = async () => {
      try {
        const params = { scope, time_range: timeRange }
        if (scope === 'State') params.state = territoryState
        const res = await api.get('/dashboard/kpis', { params })
        const data = res?.data
        if (!alive) return
        if (data && data.success) {
          setApiError('')
          setApiKpis({
            total_dealers: Number(data.total_dealers),
            total_sales: Number(data.total_sales),
            active_inventory: Number(data.active_inventory),
            inventory_to_sales: Number(data.inventory_to_sales),
            avg_sales_per_dealer: Number(data.avg_sales_per_dealer),
            sales_velocity: Number(data.sales_velocity),
            top_make: data.top_make || null,
            market_share: Number(data.market_share),
          })
        }
      } catch (e) {
        if (!alive) return
        setApiError('Dashboard API not reachable or unauthorized. Showing fallback data.')
        console.error('Failed to load /dashboard/kpis', e)
      }
    }
    loadKpis()
    return () => { alive = false }
  }, [scope, territoryState, timeRange])

  useEffect(() => {
    let alive = true
    const loadRecent = async () => {
      try {
        const params = { scope, time_range: timeRange }
        if (scope === 'State') params.state = territoryState
        const res = await api.get('/dashboard/recent_activity', { params })
        const data = res?.data
        if (!alive) return
        if (data && data.success) {
          setApiError('')
          setApiRecentActivity(Array.isArray(data.rows) ? data.rows : [])
        }
      } catch (e) {
        if (!alive) return
        setApiError('Dashboard API not reachable or unauthorized. Showing fallback data.')
        console.error('Failed to load /dashboard/recent_activity', e)
      }
    }
    loadRecent()
    return () => { alive = false }
  }, [scope, territoryState, timeRange])

  useEffect(() => {
    let alive = true
    const loadRecs = async () => {
      try {
        const params = { scope, time_range: timeRange }
        if (scope === 'State') params.state = territoryState
        const res = await api.get('/dashboard/recommendations', { params })
        const data = res?.data
        if (!alive) return
        if (data && data.success) {
          setApiRecommendations({ text: data.text || '' })
        }
      } catch (e) {
        if (!alive) return
      }
    }
    loadRecs()
    return () => { alive = false }
  }, [scope, territoryState, timeRange])

  useEffect(() => {
    let alive = true
    const loadDir = async () => {
      try {
        const params = { scope, time_range: timeRange }
        if (scope === 'State') params.state = territoryState
        const res = await api.get('/dashboard/market_direction', { params })
        const data = res?.data
        if (!alive) return
        if (data && data.success) {
          setApiMarketDirection({ label: data.label || '', growthPct: Number(data.growth_pct) })
        }
      } catch (e) {
        if (!alive) return
      }
    }
    loadDir()
    return () => { alive = false }
  }, [scope, territoryState, timeRange])

  useEffect(() => {
    let alive = true
    const loadOpp = async () => {
      try {
        const params = { scope, time_range: timeRange }
        if (scope === 'State') params.state = territoryState
        const res = await api.get('/dashboard/opportunities_risk', { params })
        const data = res?.data
        if (!alive) return
        if (data && data.success) {
          setApiOppRisk({
            topState: data.top_opportunity_state || null,
            inventoryPressure: data.inventory_pressure || null,
            concentration: Number(data.concentration),
          })
        }
      } catch (e) {
        if (!alive) return
      }
    }
    loadOpp()
    return () => { alive = false }
  }, [scope, territoryState, timeRange])

  useEffect(() => {
    let alive = true
    const loadTopTrends = async () => {
      try {
        const params = { scope, time_range: timeRange }
        if (scope === 'State') params.state = territoryState
        const res = await api.get('/dashboard/top_trends', { params })
        const data = res?.data
        if (!alive) return
        if (data && data.success) {
          setApiTopTrends(data)
        }
      } catch (e) {
        if (!alive) return
      }
    }
    loadTopTrends()
    return () => { alive = false }
  }, [scope, territoryState, timeRange])

  useEffect(() => {
    let alive = true
    const loadMarketHighlights = async () => {
      try {
        const params = { scope, time_range: timeRange }
        if (scope === 'State') params.state = territoryState
        const res = await api.get('/dashboard/market_highlights', { params })
        const data = res?.data
        if (!alive) return
        if (data && data.success) {
          setApiMarketHighlights(data)
        }
      } catch (e) {
        if (!alive) return
      }
    }
    loadMarketHighlights()
    return () => { alive = false }
  }, [scope, territoryState, timeRange])

  useEffect(() => {
    let alive = true
    const loadModels = async () => {
      try {
        const params = { scope, time_range: timeRange, top_models: 20, top_makes: 10 }
        if (scope === 'State') params.state = territoryState
        const res = await api.get('/dashboard/top_selling_models', { params })
        const data = res?.data
        if (!alive) return
        if (data && data.success) {
          setApiTopModels({
            topMakes: Array.isArray(data.topMakes) ? data.topMakes : [],
            models: Array.isArray(data.models) ? data.models : [],
          })
        }
      } catch (e) {
        if (!alive) return
      }
    }
    loadModels()
    return () => { alive = false }
  }, [scope, territoryState, timeRange])

  useEffect(() => {
    let alive = true
    const loadLeaders = async () => {
      try {
        const params = { scope, time_range: timeRange, limit: 10 }
        if (scope === 'State') params.state = territoryState
        const res = await api.get('/dashboard/top_market_leaders', { params })
        const data = res?.data
        if (!alive) return
        if (data && data.success) {
          setApiLeaders(Array.isArray(data.rows) ? data.rows : [])
        }
      } catch (e) {
        if (!alive) return
      }
    }
    loadLeaders()
    return () => { alive = false }
  }, [scope, territoryState, timeRange])

  useEffect(() => {
    let alive = true
    const loadRising = async () => {
      try {
        const params = { scope, time_range: timeRange, limit: 10 }
        if (scope === 'State') params.state = territoryState
        const res = await api.get('/dashboard/fastest_rising_dealers', { params })
        const data = res?.data
        if (!alive) return
        if (data && data.success) {
          setApiFastestRising(Array.isArray(data.rows) ? data.rows : [])
        }
      } catch (e) {
        if (!alive) return
      }
    }
    loadRising()
    return () => { alive = false }
  }, [scope, territoryState, timeRange])

  useEffect(() => {
    let alive = true
    const loadSegments = async () => {
      try {
        const params = { scope, time_range: timeRange }
        if (scope === 'State') params.state = territoryState
        const res = await api.get('/dashboard/segment_share_of_sales', { params })
        const data = res?.data
        if (!alive) return
        if (data && data.success) {
          setApiSegmentShare(Array.isArray(data.rows) ? data.rows : [])
        }
      } catch (e) {
        if (!alive) return
      }
    }
    loadSegments()
    return () => { alive = false }
  }, [scope, territoryState, timeRange])

  const dealerCountComputed = useMemo(() => {
    const ids = new Set(filteredDealers.map((d) => d.canonical_dealer_id))
    return ids.size
  }, [filteredDealers])

  const totalSalesComputed = useMemo(() => filteredDealers.reduce((s, d) => s + toNumber(d.total_sales), 0), [filteredDealers])
  const activeInventoryComputed = useMemo(() => filteredDealers.reduce((s, d) => s + toNumber(d.active_inventory), 0), [filteredDealers])
  const inventoryToSalesComputed = totalSalesComputed > 0 ? activeInventoryComputed / totalSalesComputed : 0
  const avgSalesPerDealerComputed = dealerCountComputed > 0 ? totalSalesComputed / dealerCountComputed : 0

  // Use API KPIs when available; otherwise fall back to computed values
  const dealerCount = apiKpis?.total_dealers ?? dealerCountComputed
  const totalSales = apiKpis?.total_sales ?? totalSalesComputed
  const activeInventory = apiKpis?.active_inventory ?? activeInventoryComputed
  const inventoryToSales = apiKpis?.inventory_to_sales ?? inventoryToSalesComputed
  const avgSalesPerDealer = apiKpis?.avg_sales_per_dealer ?? avgSalesPerDealerComputed

  const timeLabel = useMemo(() => {
    switch (timeRange) {
      case '3m': return 'Last 3 months'
      case '6m': return 'Last 6 months'
      case 'yoy': return 'Year-over-Year'
      case '30d':
      default: return 'Last 30 days'
    }
  }, [timeRange])

  const trendSeries = useMemo(() => {
    const lengthMap = { '30d': 30, '3m': 90, '6m': 180, 'yoy': 365 }
    const length = lengthMap[timeRange] || 30
    const baseSales = totalSales / Math.max(1, length)
    const baseInventory = activeInventory / Math.max(1, length)
    const seed = `${scope}:${territoryState}:${timeRange}`
    return buildTrendSeries({ length, baseSales, baseInventory, seed })
  }, [totalSales, activeInventory, scope, territoryState, timeRange])

  const growthPct = useMemo(() => {
    if (!trendSeries.length) return 0
    const n = trendSeries.length
    const w = Math.max(3, Math.round(n * 0.15))
    const first = trendSeries.slice(0, w).reduce((s, d) => s + d.sales, 0) / w
    const last = trendSeries.slice(n - w).reduce((s, d) => s + d.sales, 0) / w
    if (first <= 0) return 0
    return ((last - first) / first) * 100
  }, [trendSeries])

  const marketDirection = useMemo(() => {
    if (growthPct >= 2) return { label: 'Positive (growing)', tone: 'text-emerald-700', chip: 'bg-emerald-50 border-emerald-100' }
    if (growthPct <= -2) return { label: 'Negative (declining)', tone: 'text-rose-700', chip: 'bg-rose-50 border-rose-100' }
    return { label: 'Neutral (stable)', tone: 'text-slate-700', chip: 'bg-slate-50 border-slate-100' }
  }, [growthPct])

  const makeTrends = useMemo(() => {
    if (Array.isArray(apiTopTrends?.make_trends) && apiTopTrends.make_trends.length) return apiTopTrends.make_trends
    const totals = new Map()
    filteredDealers.forEach((d) => {
      const makes = splitList(d.top_5_makes)
      const invs = splitList(d.top_5_make_inventory).map((v) => toNumber(v))
      makes.forEach((make, idx) => {
        const value = invs[idx] || 0
        totals.set(make, (totals.get(make) || 0) + value)
      })
    })

    const total = Array.from(totals.values()).reduce((s, v) => s + v, 0) || 1
    return Array.from(totals.entries())
      .map(([name, value]) => {
        const share = (value / total) * 100
        const mom = pseudoTrend(`${scope}:${territoryState}:${name}:mom`, { base: 1.2, swing: 6.0 })
        const qoq = pseudoTrend(`${scope}:${territoryState}:${name}:qoq`, { base: 2.0, swing: 8.0 })
        return { name, value, share, mom, qoq }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [apiTopTrends, filteredDealers, scope, territoryState])

  const focusMake = apiTopTrends?.focus_make || makeTrends[0]

  const modelRank = useMemo(() => {
    if (apiTopModels?.models?.length) {
      const list = apiTopModels.models.map((m) => {
        const make = String(m.make || '').trim()
        const model = String(m.model || '').trim()
        const key = `${make} ${model}`.trim()
        const segment = normalizeSegment(bodyStyleMap.get(normalizeKey(make, model)) || 'Other')
        return {
          key,
          make,
          model,
          segment,
          units: Math.round(toNumber(m.units)),
          share: Number.isFinite(Number(m.share)) ? Number(m.share) : 0,
          mom: toNumber(m.mom),
          qoq: 0,
        }
      })
      return { list, topMakes: Array.isArray(apiTopModels.topMakes) ? apiTopModels.topMakes : [] }
    }
    const totals = new Map()
    const makeTotals = new Map()
    filteredDealers.forEach((d) => {
      const makes = splitList(d.top_5_makes)
      const makeInvs = splitList(d.top_5_make_inventory).map((v) => toNumber(v))
      makes.forEach((make, idx) => {
        const value = makeInvs[idx] || 0
        makeTotals.set(make, (makeTotals.get(make) || 0) + value)
      })

      const models = splitList(d.top_5_models)
      const modelInvs = splitList(d.top_5_model_inventory).map((v) => toNumber(v))
      models.forEach((model, idx) => {
        const make = makes[idx] || ''
        const key = `${make} ${model}`.trim()
        const value = modelInvs[idx] || 0
        totals.set(key, (totals.get(key) || 0) + value)
      })
    })

    const total = Array.from(totals.values()).reduce((s, v) => s + v, 0) || 1
    const list = Array.from(totals.entries())
      .map(([label, value]) => {
        const mom = pseudoTrend(`${scope}:${territoryState}:${label}:mom`, { base: 1.2, swing: 7.5 })
        const qoq = pseudoTrend(`${scope}:${territoryState}:${label}:qoq`, { base: 1.8, swing: 9 })
        const [make, ...modelParts] = label.split(' ')
        const model = modelParts.join(' ')
        const segment = normalizeSegment(bodyStyleMap.get(normalizeKey(make, model)) || 'Other')
        return {
          key: label,
          make,
          model,
          segment,
          units: Math.round(value),
          share: (value / total) * 100,
          mom,
          qoq,
        }
      })
      .sort((a, b) => b.units - a.units)

    const topMakes = Array.from(makeTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)

    return { list, topMakes }
  }, [apiTopModels, filteredDealers, scope, territoryState, bodyStyleMap])

  const gainingModels = useMemo(() => modelRank.list.filter((m) => (m.mom + m.qoq) > 0).slice(0, 4), [modelRank])
  const losingModels = useMemo(() => modelRank.list.filter((m) => (m.mom + m.qoq) < 0).slice(0, 4), [modelRank])

  const segmentShare = useMemo(() => {
    const totals = new Map()
    filteredDealers.forEach((d) => {
      const makes = splitList(d.top_5_makes)
      const models = splitList(d.top_5_models)
      const invs = splitList(d.top_5_model_inventory).map((v) => toNumber(v))
      models.forEach((model, idx) => {
        const make = makes[idx] || ''
        const key = normalizeKey(make, model)
        const segment = normalizeSegment(bodyStyleMap.get(key) || 'Other')
        const weight = invs[idx] || 0
        totals.set(segment, (totals.get(segment) || 0) + weight)
      })
    })

    const total = Array.from(totals.values()).reduce((s, v) => s + v, 0) || 1
    const bodySegments = new Set(Array.from(bodyStyleMap.values()).map((s) => normalizeSegment(s)))
    const ordered = [...SEGMENT_ORDER, ...Array.from(bodySegments).filter((s) => !SEGMENT_ORDER.includes(s))]

    return ordered.map((segment) => {
      const value = totals.get(segment) || 0
      return { segment, value, share: (value / total) * 100 }
    })
  }, [filteredDealers, bodyStyleMap])

  const concentration = useMemo(() => {
    if (Number.isFinite(Number(apiMarketHighlights?.concentration))) return Number(apiMarketHighlights.concentration)
    if (!filteredDealers.length) return 0
    const sorted = [...filteredDealers].sort((a, b) => toNumber(b.total_sales) - toNumber(a.total_sales))
    const topCount = Math.max(1, Math.ceil(sorted.length * 0.1))
    const topSales = sorted.slice(0, topCount).reduce((s, d) => s + toNumber(d.total_sales), 0)
    return totalSales > 0 ? (topSales / totalSales) * 100 : 0
  }, [apiMarketHighlights, filteredDealers, totalSales])

  const topLeaders = useMemo(() => {
    if (Array.isArray(apiLeaders) && apiLeaders.length) return apiLeaders
    return [...filteredDealers]
      .sort((a, b) => toNumber(b.total_sales) - toNumber(a.total_sales))
      .slice(0, 10)
      .map((d) => {
        const velocity = toNumber(d.active_inventory) > 0 ? (toNumber(d.total_sales) / toNumber(d.active_inventory)) : 0
        return {
          dealerName: d.seller_name,
          make: (splitList(d.top_5_makes)[0] || '').trim(),
          location: `${d.city}, ${d.state}`,
          totalSales: toNumber(d.total_sales),
          activeInventory: toNumber(d.active_inventory),
          uniqueModels: toNumber(d.unique_models_count),
          salesVelocity: velocity,
        }
      })
  }, [apiLeaders, filteredDealers])

  const fastestRising = useMemo(() => {
    if (Array.isArray(apiFastestRising) && apiFastestRising.length) return apiFastestRising
    return [...filteredDealers]
      .map((d) => {
        const confirmed = toNumber(d.confirmed_sales)
        const potential = toNumber(d.potential_sales)
        const growth = potential - confirmed
        const pctGrowth = confirmed > 0 ? (growth / confirmed) * 100 : 0
        return {
          id: d.canonical_dealer_id,
          dealerName: d.seller_name,
          location: `${d.city}, ${d.state}`,
          totalSales: toNumber(d.total_sales),
          growth,
          pctGrowth,
        }
      })
      .sort((a, b) => b.growth - a.growth)
      .slice(0, 10)
  }, [apiFastestRising, filteredDealers])

  const segmentShareChartData = useMemo(() => {
    if (Array.isArray(apiSegmentShare) && apiSegmentShare.length) {
      return apiSegmentShare.map((r) => ({ name: r.segment, value: Number(r.share) || 0 }))
    }
    const top = segmentShare
      .filter((s) => s.segment && Number.isFinite(Number(s.share)))
      .map((s) => ({ name: s.segment, value: Number(s.share) }))
    if (top.length) return top
    return [
      { name: 'SUV', value: 45 },
      { name: 'Sedan', value: 28 },
      { name: 'Truck', value: 18 },
      { name: 'Hatchback', value: 6 },
      { name: 'Coupe', value: 1 },
      { name: 'Wagon', value: 0.5 },
      { name: 'Convertible', value: 0.3 },
      { name: 'Van', value: 0.2 },
    ]
  }, [apiSegmentShare, segmentShare])

  const opportunityStates = useMemo(() => {
    const map = new Map()
    dealers.forEach((d) => {
      const state = d.state || 'Unknown'
      const entry = map.get(state) || { state, totalSales: 0, totalInventory: 0, dealerCount: 0 }
      entry.totalSales += toNumber(d.total_sales)
      entry.totalInventory += toNumber(d.active_inventory)
      entry.dealerCount += 1
      map.set(state, entry)
    })

    return Array.from(map.values())
      .map((s) => {
        const ratio = s.totalSales > 0 ? s.totalInventory / s.totalSales : 0
        const score = s.dealerCount > 0 && ratio > 0 ? (s.totalSales / s.dealerCount) * (1 / ratio) : 0
        return { ...s, ratio, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
  }, [dealers])

  const summaryText = useMemo(() => {
    const topSegment = segmentShare[0]?.segment || 'N/A'
    const topState = opportunityStates[0]?.state || 'N/A'
    const ratioLabel = inventoryToSales > 1.1
      ? 'oversupply pressure'
      : inventoryToSales < 0.9
        ? 'tight inventory'
        : 'balanced supply'
    return `Market demand remains centered on ${topSegment}, with ${ratioLabel}. A small group of dealers controls ${concentration.toFixed(1)}% of total sales. Top opportunity states include ${topState}, reflecting strong sales per dealer and efficient turnover.`
  }, [segmentShare, opportunityStates, inventoryToSales, concentration])

  const ratioBadge = inventoryToSales < 0.9
    ? { label: 'Undersupply', tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
    : inventoryToSales > 1.1
      ? { label: 'Oversupply', tone: 'bg-rose-50 text-rose-700 border-rose-100' }
      : { label: 'Balanced', tone: 'bg-amber-50 text-amber-700 border-amber-100' }

  const salesVelocityKpi = apiKpis?.sales_velocity ?? (activeInventory > 0 ? (totalSales / activeInventory) : 0)
  const salesVelocityTextTone = velocityTone(salesVelocityKpi).split(' ').find((c) => c.startsWith('text-')) || 'text-slate-700'

  const recentActivity = useMemo(() => {
    if (Array.isArray(apiRecentActivity) && apiRecentActivity.length) return apiRecentActivity
    const topMakeLabel = focusMake?.name || 'Top make'
    const topState = apiMarketHighlights?.top_opportunity_state || opportunityStates[0]?.state || 'N/A'
    return [
      { id: 'a1', text: `${topMakeLabel} momentum is ${growthPct >= 0 ? 'up' : 'down'} ${Math.abs(growthPct).toFixed(1)}%`, time: `Last ${timeLabel.toLowerCase()}` },
      { id: 'a2', text: `Inventory pressure is ${ratioBadge.label.toLowerCase()} at ${inventoryToSales.toFixed(2)}`, time: 'Today' },
      { id: 'a3', text: `Top 10% dealers control ${concentration.toFixed(1)}% of sales`, time: 'This week' },
      { id: 'a4', text: `Opportunity leader: ${topState}`, time: 'This week' },
    ]
  }, [apiRecentActivity, apiMarketHighlights, focusMake, growthPct, timeLabel, ratioBadge.label, inventoryToSales, concentration, opportunityStates])

  const recommendationsText = apiRecommendations?.text || summaryText

  const marketDirectionDisplay = useMemo(() => {
    if (apiMarketDirection?.label) {
      const g = Number(apiMarketDirection.growthPct)
      if (g >= 2) return { label: apiMarketDirection.label, tone: 'text-emerald-700', chip: 'bg-emerald-50 border-emerald-100', pct: g }
      if (g <= -2) return { label: apiMarketDirection.label, tone: 'text-rose-700', chip: 'bg-rose-50 border-rose-100', pct: g }
      return { label: apiMarketDirection.label, tone: 'text-slate-700', chip: 'bg-slate-50 border-slate-100', pct: g }
    }
    return { label: marketDirection.label, tone: marketDirection.tone, chip: marketDirection.chip, pct: growthPct }
  }, [apiMarketDirection, marketDirection.label, marketDirection.tone, marketDirection.chip, growthPct])

  const leaderColumns = [
    { key: 'dealerName', label: 'Dealer Name' },
    { key: 'make', label: 'Make' },
    { key: 'location', label: 'City / State' },
    { key: 'totalSales', label: 'Total Sales', render: (v) => fmtInt(v) },
    { key: 'activeInventory', label: 'Active Inventory', render: (v) => fmtInt(v) },
    { key: 'uniqueModels', label: 'Unique Models' },
    {
      key: 'salesVelocity', label: 'Sales Velocity', render: (v) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] ${velocityTone(v)}`}>{v.toFixed(2)}</span>
      )
    },
  ]

  const risingColumns = [
    { key: 'dealerName', label: 'Dealer Name' },
    { key: 'location', label: 'City / State' },
    { key: 'totalSales', label: 'Total Sales', render: (v) => fmtInt(v) },
    {
      key: 'growth', label: 'Growth', render: (v, row) => (
        <span className={`font-semibold ${v >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
          {v >= 0 ? '▲' : '▼'} {fmtInt(Math.abs(v))} ({row.pctGrowth >= 0 ? '+' : ''}{row.pctGrowth.toFixed(1)}%)
        </span>
      )
    },
  ]

  const stateColumns = [
    { key: 'state', label: 'State' },
    { key: 'dealerCount', label: 'Dealers' },
    { key: 'totalSales', label: 'Total Sales', render: (v) => fmtInt(v) },
    { key: 'ratio', label: 'Inv/Sales', render: (v) => v.toFixed(2) },
    { key: 'score', label: 'Opportunity', render: (v) => fmtInt(v) },
  ]

  const pieData = [
    { name: 'Top 10% Dealers', value: concentration },
    { name: 'Remaining Dealers', value: Math.max(0, 100 - concentration) },
  ]

  // Minimal marketInsights for Market Highlights compatibility
  const marketInsights = useMemo(() => {
    if (apiMarketHighlights?.comparisons) {
      return {
        shortTerm: {
          gaining: apiMarketHighlights.top_growing_segment ? [{ segment: apiMarketHighlights.top_growing_segment }] : [],
          losing: apiMarketHighlights.top_declining_segment ? [{ segment: apiMarketHighlights.top_declining_segment }] : [],
        },
        comparisons: {
          yoyPct: toNumber(apiMarketHighlights.comparisons.yoyPct),
          yoyAbs: toNumber(apiMarketHighlights.comparisons.yoyAbs),
          currentSales: toNumber(apiMarketHighlights.comparisons.currentSales),
          lastYearSales: toNumber(apiMarketHighlights.comparisons.lastYearSales),
        },
      }
    }
    // Fallbacks using already computed values
    return {
      shortTerm: {
        gaining: segmentShare.length ? [{ segment: segmentShare[0].segment }] : [],
        losing: segmentShare.length > 1 ? [{ segment: segmentShare[1].segment }] : [],
      },
      comparisons: {
        yoyPct: 0,
        yoyAbs: 0,
        currentSales: totalSales,
        lastYearSales: totalSales, // No YoY data, fallback to current
      },
    }
  }, [apiMarketHighlights, segmentShare, totalSales])
  return (
    <div className="w-full h-[calc(100vh-16px)] overflow-hidden text-xs p-3 flex flex-col gap-3">
      <div className="shrink-0">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-indigo-50/70 via-white to-emerald-50/50 p-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-[14px] sm:text-[15px] font-semibold text-slate-900">{scope === 'USA' ? 'U.S. Market Overview' : `${territoryState} Market Overview`}</h1>
              <div className="text-[10px] text-slate-600">National automotive market insights • {timeLabel}</div>
            </div>

            {apiError ? (
              <div className="hidden md:flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] text-rose-700">
                <span className="font-semibold">API</span>
                <span className="opacity-70">{window?.localStorage?.getItem('api_url') || '—'}</span>
                <span className="opacity-60">•</span>
                <span className="font-medium">{apiError}</span>
              </div>
            ) : apiKpis ? (
              <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] text-emerald-700">
                <span className="font-semibold">API Connected</span>
                <span className="opacity-70">{window?.localStorage?.getItem('api_url') || '—'}</span>
              </div>
            ) : null}
          </div>

          <div className="mt-2 w-full overflow-x-auto">
            <div className="min-w-[1240px] grid grid-cols-7 gap-3 md:gap-4 lg:gap-5 items-stretch">
              {/* Total Dealers */}
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2.5 flex flex-col items-center justify-center h-[84px] md:h-[92px] lg:h-[100px]">
                <span className="inline-flex items-center justify-center w-8 h-8 mb-1">{kpiIcons.dealers}</span>
                <div className="text-[10px] leading-none text-slate-600">Total Dealers</div>
                <div className="mt-0.5 text-[15px] leading-none font-semibold tabular-nums">{fmtInt(dealerCount)}</div>
              </div>
              {/* Total Sales */}
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2.5 flex flex-col items-center justify-center h-[84px] md:h-[92px] lg:h-[100px]">
                <span className="inline-flex items-center justify-center w-8 h-8 mb-1">{kpiIcons.sales}</span>
                <div className="text-[10px] leading-none text-slate-600">Total Sales</div>
                <div className="mt-0.5 text-[15px] leading-none font-semibold tabular-nums">{fmtInt(totalSales)}</div>
              </div>
              {/* Active Inventory */}
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2.5 flex flex-col items-center justify-center h-[84px] md:h-[92px] lg:h-[100px]">
                <span className="inline-flex items-center justify-center w-8 h-8 mb-1">{kpiIcons.inventory}</span>
                <div className="text-[10px] leading-none text-slate-600">Active Inventory</div>
                <div className="mt-0.5 text-[15px] leading-none font-semibold tabular-nums">{fmtInt(activeInventory)}</div>
              </div>
              {/* Inv/Sales Ratio */}
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2.5 flex flex-col items-center justify-center h-[84px] md:h-[92px] lg:h-[100px]">
                <span className="inline-flex items-center justify-center w-8 h-8 mb-1">{kpiIcons.ratio}</span>
                <div className="text-[10px] leading-none text-slate-600">Inventory-to-Sales</div>
                <div className="mt-0.5 text-[15px] leading-none font-semibold tabular-nums">{inventoryToSales.toFixed(2)}</div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full border ${ratioBadge.tone}`}>{ratioBadge.label}</span>
              </div>
              {/* Avg Sales / Dealer */}
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2.5 flex flex-col items-center justify-center h-[84px] md:h-[92px] lg:h-[100px]">
                <span className="inline-flex items-center justify-center w-8 h-8 mb-1">{kpiIcons.sales}</span>
                <div className="text-[10px] leading-none text-slate-600">Avg Sales / Dealer</div>
                <div className="mt-0.5 text-[15px] leading-none font-semibold tabular-nums">{fmtInt(avgSalesPerDealer)}</div>
              </div>

              {/* Sales Velocity */}
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2.5 flex flex-col items-center justify-center h-[84px] md:h-[92px] lg:h-[100px]">
                <span className="inline-flex items-center justify-center w-8 h-8 mb-1">{kpiIcons.velocity}</span>
                <div className="text-[10px] leading-none text-slate-600">Sales Velocity</div>
                <div className={`mt-0.5 text-[15px] leading-none font-semibold tabular-nums ${salesVelocityTextTone}`}>{salesVelocityKpi.toFixed(2)}</div>
              </div>

              {/* Market Share */}
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2.5 flex flex-col items-center justify-center h-[84px] md:h-[92px] lg:h-[100px]">
                <span className="inline-flex items-center justify-center w-8 h-8 mb-1">{kpiIcons.share}</span>
                <div className="text-[10px] leading-none text-slate-600">Market Share</div>
                <div className="mt-0.5 text-[15px] leading-none font-semibold tabular-nums">{Number.isFinite(apiKpis?.market_share) ? `${apiKpis.market_share.toFixed(1)}%` : (focusMake ? `${focusMake.share.toFixed(1)}%` : '—')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)_280px] gap-3 flex-1 min-h-0 overflow-hidden">
        <aside className="flex flex-col gap-3 min-h-0 overflow-hidden">
          <TerritoryFilters
            scope={scope}
            state={territoryState}
            dateRange={timeRange}
            states={states}
            onChange={({ scope: s, state, dateRange }) => {
              if (s) setScope(s)
              if (state) setTerritoryState(state)
              if (dateRange) setTimeRange(dateRange)
            }}
            onOpenDetails={() => {
              const qs = new URLSearchParams()
              qs.set('scope', scope)
              if (scope === 'State') qs.set('state', territoryState)
              qs.set('dateRange', timeRange)
              navigate(`/reports?${qs.toString()}`)
            }}
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-2.5">
            <div className="text-[11px] text-slate-500">Market Concentration</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">Top 10% dealers control {concentration.toFixed(1)}% of sales</div>
            <div className="text-[11px] text-slate-500">Competition intensity signal</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-1 flex flex-col min-h-0 max-h-[210px]">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[12px] font-semibold text-slate-900">Top Trends</h3>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-slate-100">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-[9.5px] text-slate-600">
                    <th className="text-left font-semibold px-2 py-1">Make</th>
                    <th className="text-right font-semibold px-2 py-1">MoM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[10px]">
                  {makeTrends.slice(0, 5).map((m) => (
                    <tr key={m.name} className="hover:bg-slate-50">
                      <td className="px-2 py-1 font-medium text-slate-900 truncate">{m.name}</td>
                      <td className="px-2 py-1 text-right tabular-nums">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full border text-[9px] font-semibold ${m.mom >= 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{pct(m.mom)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-[9.5px]">
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-1.5">
                <div className="text-slate-500">Focus make</div>
                <div className="font-semibold text-slate-900 truncate">{focusMake ? `${focusMake.name} (${focusMake.share.toFixed(1)}%)` : '—'}</div>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-1.5">
                <div className="text-slate-500">Inventory/Sales</div>
                <div className="font-semibold text-slate-900">{inventoryToSales.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-1 min-h-[250px]">
            <div className="text-[12px] font-semibold text-slate-900">Market Highlights</div>
            <div className="text-[10px] text-slate-500">Key signals • {scope === 'USA' ? 'USA' : territoryState}</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] min-h-[220px]">
              {/* Top segment */}
              <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                <div className="text-slate-500">Top segment</div>
                <div className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${highlightTone('top_segment')}`}>{apiMarketHighlights?.top_segment || segmentShare[0]?.segment || '—'}</div>
              </div>
              {/* Concentration */}
              <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                <div className="text-slate-500">Concentration</div>
                <div className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${highlightTone('concentration')}`}>{concentration?.toFixed ? concentration.toFixed(1) : '—'}%</div>
              </div>
              {/* Inv/Sales */}
              <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                <div className="text-slate-500">Inv/Sales</div>
                <div className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${highlightTone('inv_sales')}`}>{inventoryToSales?.toFixed ? inventoryToSales.toFixed(2) : '—'}</div>
              </div>
              {/* Top opportunity */}
              <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                <div className="text-slate-500">Top opportunity</div>
                <div className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${highlightTone('opportunity')}`}>{apiMarketHighlights?.top_opportunity_state || opportunityStates?.[0]?.state || '—'}</div>
              </div>
              {/* Top Growing Segment */}
              <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                <div className="text-slate-500">Top Growing Segment</div>
                <div className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${highlightTone('growing')}`}>{apiMarketHighlights?.top_growing_segment || marketInsights?.shortTerm?.gaining?.[0]?.segment || '—'}</div>
              </div>
              {/* Top Declining Segment */}
              <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                <div className="text-slate-500">Top Declining Segment</div>
                <div className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${highlightTone('declining')}`}>{apiMarketHighlights?.top_declining_segment || marketInsights?.shortTerm?.losing?.[0]?.segment || '—'}</div>
              </div>
              {/* Summary Row */}
              <div className="col-span-2 text-[9px] text-slate-600 mt-1">
                <span>Current: {marketInsights?.comparisons ? fmtInt(marketInsights.comparisons.currentSales) : '—'} | Last Year: {marketInsights?.comparisons ? fmtInt(marketInsights.comparisons.lastYearSales) : '—'}</span>
              </div>
            </div>
          </div>

        </aside>

        <main className="flex flex-col gap-3 min-h-0 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)] gap-3 flex-1 min-h-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-1.5 flex flex-col min-h-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[12px] font-semibold text-slate-900">Top Selling Models</div>
                  <div className="text-[10px] text-slate-500">All makes • {scope === 'USA' ? 'USA' : territoryState}</div>
                </div>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {(apiTopModels?.topMakes?.length ? apiTopModels.topMakes : modelRank.topMakes).map((m) => (
                  <span key={m.name} className="text-[9.5px] px-1.5 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                    {m.name}: {fmtInt(m.value)}
                  </span>
                ))}
              </div>
              <div className="mt-1 flex-1 min-h-0 overflow-y-auto rounded-xl border border-slate-100">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[9.5px] text-slate-600">
                      <th className="text-left font-semibold px-2 py-1">Model</th>
                      <th className="text-right font-semibold px-2 py-1">Units</th>
                      <th className="text-right font-semibold px-2 py-1">MoM</th>
                      <th className="text-right font-semibold px-2 py-1">Last 30 Days</th>
                      <th className="text-right font-semibold px-2 py-1">Last 3 Months</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[10px]">
                    {(apiTopModels?.models?.length ? apiTopModels.models : modelRank.list)
                      .slice(0, 15)
                      .map((m) => (
                        <tr key={m.key} className="hover:bg-slate-50">
                          <td className="px-2 py-1 font-medium text-slate-900 truncate">{m.make} {m.model}</td>
                          <td className="px-2 py-1 text-right tabular-nums">{fmtInt(m.units)}</td>
                          <td className={`px-2 py-1 text-right tabular-nums ${trendClass(m.mom)}`}>{pct(m.mom)}</td>
                          <td className="px-2 py-1 text-right tabular-nums">{fmtInt(m.last30 ?? m.units)}</td>
                          <td className="px-2 py-1 text-right tabular-nums">{fmtInt(m.last3m ?? (m.units * 3))}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-1.5 flex flex-col min-h-0">
              <h3 className="text-[12px] font-semibold text-slate-900 mb-1.5">Top Market Leaders</h3>
              <div className="flex-1 min-h-0 overflow-y-auto">
                <DataTable columns={leaderColumns} data={topLeaders} sortable paginated={false} density="compact" tableLayout="fixed" />
              </div>
              <div className="mt-1 text-[9.5px] text-slate-500">
                Sales velocity legend: <span className="text-emerald-700">High &gt; 1.2</span> · <span className="text-amber-700">Average 0.8–1.2</span> · <span className="text-rose-700">Slow &lt; 0.8</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)] gap-3 flex-1 min-h-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-1 flex flex-col min-h-0 max-h-[315px]">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <div className="text-[12px] font-semibold text-slate-900">Fastest Rising Dealers</div>
                  <div className="text-[9.5px] text-slate-500">Momentum leaders • {timeLabel}</div>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                <DataTable columns={risingColumns} data={fastestRising} sortable paginated={false} density="compact" />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col min-h-0 max-h-[315px]">
              <div className="mb-2">
                <div className="text-[13px] font-semibold text-slate-900">Segment Share of Sales</div>
                <div className="text-[10px] text-slate-500">Shows what buyers want - Critical for strategy</div>
              </div>

              <div className="flex-1 min-h-0">
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={segmentShareChartData}
                      margin={{ top: 6, right: 28, left: 16, bottom: 6 }}
                    >
                      <CartesianGrid horizontal={false} vertical={false} />
                      <XAxis type="number" tickLine={false} axisLine={false} hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={140}
                        tick={{ fill: '#374151', fontSize: 13, fontWeight: 700 }}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={14}
                        interval={0}
                      />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Bar dataKey="value" barSize={22} radius={10} background={{ fill: '#f1f5f9' }} barGap={6} barCategoryGap="14%">
                        {['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#a78bfa', '#06b6d4', '#fb7185', '#64748b'].map((c, i) => (
                          <Cell key={c} fill={c} />
                        ))}
                        <LabelList dataKey="value" content={segmentValueLabel} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

        </main>

        <aside className="flex flex-col gap-2 min-h-0 overflow-hidden">
          <div className="rounded-2xl border border-slate-200 bg-white p-2 min-h-[120px]">
            <div className="text-[11px] text-slate-500">Recent Activity</div>
            <div className="mt-2 space-y-2">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-2">
                  <div className="text-[11px] text-slate-700 leading-tight">{item.text}</div>
                  <div className="text-[10px] text-slate-400 whitespace-nowrap">{item.time}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-2">
            <div className="text-[11px] text-slate-500">Recommendations</div>
            <div className="mt-1 text-[12px] text-slate-700 leading-relaxed">{summaryText}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-2">
            <div className="text-[11px] text-slate-500">Market Direction</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{marketDirection.label}</div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${marketDirection.chip} ${marketDirection.tone}`}>
                {growthPct >= 0 ? '+' : ''}{growthPct.toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-500">Based on recent sales trend</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-2">
            <div className="text-[11px] text-slate-500">Opportunities & Risk</div>
            <ul className="mt-2 space-y-1 text-[11px] text-slate-700">
              <li>• Opportunity state: {opportunityStates[0]?.state || 'N/A'} (score {fmtInt(opportunityStates[0]?.score || 0)})</li>
              <li>• Inventory pressure: {ratioBadge.label.toLowerCase()}</li>
              <li>• Concentration: {concentration.toFixed(1)}% of sales from top 10%</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] text-slate-400">Assistant</div>
                <div className="text-[12px] font-semibold text-slate-900">How may I help you?</div>
              </div>
              <button className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">Show</button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="search"
                  placeholder="Ask about market share, inventory..."
                  className="w-full rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                />
              </div>
              <button className="text-[10px] px-3 py-1.5 rounded-full bg-indigo-600 text-white font-semibold">Ask</button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-[9.5px]">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-1">
                <div className="text-slate-500">Try asking</div>
                <div className="text-slate-700">"Top opportunity state"</div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-1">
                <div className="text-slate-500">Try asking</div>
                <div className="text-slate-700">"Inventory pressure"</div>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-[9.5px]">
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-1">
                <div className="text-slate-500">Top segment</div>
                <div className="font-semibold text-slate-900">{segmentShare[0]?.segment || 'N/A'}</div>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-1">
                <div className="text-slate-500">Inventory/Sales</div>
                <div className="font-semibold text-slate-900">{inventoryToSales.toFixed(2)}</div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-[9.5px] text-slate-500">
              <span>Scope: {scope}</span>
              <span>{timeLabel}</span>
            </div>
          </div>
        </aside>
      </div>

      {loading && (
        <div className="text-[11px] text-slate-500">Loading market data…</div>
      )}
      {error && (
        <div className="text-[11px] text-rose-600">{error}</div>
      )}
    </div>
  );
}

export default MarketDashboard;
