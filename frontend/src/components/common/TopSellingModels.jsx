import { useEffect, useMemo, useState } from 'react'

const hashToUnit = (str) => {
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 2 ** 32
}

const pseudoTrend = (key, { base = 2.0, swing = 10.0 } = {}) => {
  const u = hashToUnit(key)
  const sign = u > 0.18 ? 1 : -1
  const magnitude = base + (u * swing)
  return sign * magnitude
}

const trendClass = (v) => (v >= 0 ? 'text-emerald-600' : 'text-rose-600')
const pct = (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`

const fmtInt = (n) => {
  const v = Number(n || 0)
  return Math.round(v).toLocaleString()
}

const fmt = (n) => {
  const v = Number(n || 0)
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 10_000) return `${Math.round(v / 1_000)}K`
  return `${Math.round(v)}`
}

const makeTint = (make) => {
  const u = hashToUnit(`make:${make}`)
  const hue = Math.round(u * 360)
  return {
    backgroundColor: `hsla(${hue} 85% 96% / 0.95)`,
    borderColor: `hsla(${hue} 70% 82% / 0.9)`,
    color: `hsl(${hue} 42% 28%)`,
  }
}

const MODEL_CATALOG = {
  Ford: ['F-150', 'Explorer', 'Escape', 'Mustang'],
  Chevrolet: ['Silverado 1500', 'Tahoe', 'Equinox', 'Malibu'],
  Toyota: ['RAV4', 'Camry', 'Corolla', 'Highlander'],
  Honda: ['CR-V', 'Civic', 'Accord', 'Pilot'],
  Tesla: ['Model Y', 'Model 3', 'Model X'],
  Hyundai: ['IONIQ 5', 'Tucson', 'Elantra'],
  Ram: ['1500', '2500', 'ProMaster'],
  Lexus: ['RX 350', 'NX 350', 'ES 350'],
}

const getModelsForMake = (make) => {
  const list = MODEL_CATALOG[make]
  if (list && list.length) return list
  // fallback: generate a few deterministic placeholders
  return [
    `${make} Series A`,
    `${make} Series B`,
    `${make} Series C`,
  ]
}

const dateMultiplier = (dateRange) => {
  switch (dateRange) {
    case '3m': return 3
    case '6m': return 6
    case 'yoy': return 12
    case '30d':
    default: return 1
  }
}

const Sparkline = ({ values, tone = 'up' }) => {
  const xs = (values || []).map((v) => Number(v || 0))
  if (!xs.length) return null

  const w = 84
  const h = 20
  const padX = 2
  const padY = 2

  const min = Math.min(...xs)
  const max = Math.max(...xs)
  const range = Math.max(1e-9, max - min)

  const xAt = (i) => {
    if (xs.length === 1) return w / 2
    return padX + (i * (w - padX * 2)) / (xs.length - 1)
  }
  const yAt = (v) => {
    const t = (v - min) / range
    return padY + (1 - t) * (h - padY * 2)
  }

  const points = xs.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ')
  const first = xs[0]
  const last = xs[xs.length - 1]
  const direction = last >= first ? 'up' : 'down'
  const useTone = tone === 'auto' ? direction : tone
  const stroke = useTone === 'down' ? '#e11d48' : '#10b981'
  const fill = useTone === 'down' ? 'rgba(225, 29, 72, 0.12)' : 'rgba(16, 185, 129, 0.12)'

  const area = `${points} ${xAt(xs.length - 1)},${h - padY} ${xAt(0)},${h - padY}`

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="QoQ trend">
      <polyline points={area} fill={fill} stroke="none" />
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={xAt(xs.length - 1)} cy={yAt(last)} r="2.2" fill={stroke} />
    </svg>
  )
}

const TopSellingModels = ({
  marketLevel = 'USA',
  dateRange = '30d',
  topMakes = [],
  allMakes = [],
  makeTotals,
  topCount = 8,
  className = '',
}) => {
  const [selectedMake, setSelectedMake] = useState('All Makes')

  // Reset selection if scope changes and the make disappears.
  useEffect(() => {
    if (selectedMake === 'All Makes') return
    if (!allMakes.includes(selectedMake)) setSelectedMake('All Makes')
  }, [allMakes, selectedMake])

  const totalsMap = useMemo(() => {
    if (makeTotals instanceof Map) return makeTotals
    const m = new Map()
    if (makeTotals && typeof makeTotals === 'object') {
      for (const [k, v] of Object.entries(makeTotals)) m.set(k, v)
    }
    return m
  }, [makeTotals])

  const selectableMakes = useMemo(() => {
    const set = new Set(allMakes)
    // Ensure the dropdown isn't limited to top 5–10.
    for (const k of totalsMap.keys()) set.add(k)
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [allMakes, totalsMap])

  const topMakesDisplay = useMemo(() => {
    // Default view shows only top 5–10 makes by volume.
    return (topMakes || []).slice(0, Math.max(5, Math.min(10, topCount)))
  }, [topMakes, topCount])

  const makeTotal = useMemo(() => {
    if (selectedMake === 'All Makes') return 0
    return Number(totalsMap.get(selectedMake) || 0)
  }, [selectedMake, totalsMap])

  const models = useMemo(() => {
    const mult = dateMultiplier(dateRange)

    const makesToGenerate = selectedMake === 'All Makes'
      ? (topMakesDisplay.map((m) => m.name))
      : [selectedMake]

    const rows = []
    for (const make of makesToGenerate) {
      const makeVol = Number(totalsMap.get(make) || 0)
      const makeVolScaled = makeVol * mult
      const modelNames = getModelsForMake(make)
      const weights = modelNames.map((model) => 0.35 + hashToUnit(`${marketLevel}:${dateRange}:${make}:${model}:w`) * 0.9)
      const sumW = weights.reduce((s, w) => s + w, 0) || 1

      modelNames.forEach((model, idx) => {
        const units = Math.max(1, Math.round((makeVolScaled * (weights[idx] / sumW)) * 0.75))
        const mom = pseudoTrend(`${marketLevel}:${make}:${model}:mom`)
        const qoq = pseudoTrend(`${marketLevel}:${make}:${model}:qoq`, { base: 3.0, swing: 12.0 })
        const yoy = pseudoTrend(`${marketLevel}:${make}:${model}:yoy`, { base: 4.0, swing: 14.0 })
        rows.push({ make, model, units, mom, qoq, yoy })
      })
    }

    rows.sort((a, b) => b.units - a.units)
    return rows.slice(0, selectedMake === 'All Makes' ? topCount : Math.max(5, topCount))
  }, [selectedMake, totalsMap, topMakesDisplay, topCount, marketLevel, dateRange])

  const summaryRows = useMemo(() => {
    const mult = dateMultiplier(dateRange)

    return models.map((m) => {
      const last30 = Math.max(0, Math.round(m.units / mult))
      const last3m = Math.max(0, Math.round(m.units * (3 / mult)))
      const lastYear = Math.max(0, Math.round(m.units * (12 / mult)))

      const seed = `${marketLevel}:${dateRange}:${m.make}:${m.model}:qoqspark`
      const base = Math.max(1, last3m)
      const step = (m.qoq / 100) * 0.9
      const qoqSeries = Array.from({ length: 6 }).map((_, i) => {
        const wobble = (hashToUnit(`${seed}:${i}`) - 0.5) * 0.10
        const center = (6 - 1) / 2
        const factor = 1 + ((i - center) * step) + wobble
        return Math.max(0, Math.round(base * factor))
      })

      return {
        key: `${m.make}:${m.model}`,
        modelLabel: selectedMake === 'All Makes' ? `${m.make} ${m.model}` : m.model,
        unitsSold: Math.max(0, Math.round(m.units)),
        mom: m.mom,
        yoy: m.yoy,
        qoqSeries,
        last30,
        last3m,
        lastYear,
      }
    })
  }, [models, dateRange, marketLevel, selectedMake])

  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm flex flex-col ${className}`.trim()}>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div className="min-w-0">
          <h3 className="text-xs font-semibold text-gray-900">Top Selling Models</h3>
          <div className="text-[11px] text-gray-500 truncate">
            {selectedMake === 'All Makes'
              ? `All Makes • Top ${topMakesDisplay.length} makes by volume • ${marketLevel}`
              : `${selectedMake} • ${marketLevel}`}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[11px] text-slate-500">Make</span>
          <select
            value={selectedMake}
            onChange={(e) => setSelectedMake(e.target.value)}
            className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
            aria-label="Filter by make"
          >
            <option>All Makes</option>
            {selectableMakes.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedMake === 'All Makes' ? (
        <div className="mb-1.5">
          <div className="text-[11px] font-semibold text-slate-700 mb-1">Top Makes (by sales volume)</div>
          <div className="flex flex-wrap gap-1">
            {topMakesDisplay.map((m) => (
              <div
                key={m.name}
                style={makeTint(m.name)}
                className="px-2 py-0.5 rounded-full border text-[10px] leading-5 whitespace-nowrap"
              >
                <span className="font-semibold">{m.name}</span>
                <span className="opacity-70"> · {fmt(m.value)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[11px] font-semibold text-slate-700">Total sales ({dateRange})</div>
          <div className="text-[11px] font-semibold text-slate-900">{fmt(makeTotal * dateMultiplier(dateRange))}</div>
        </div>
      )}

      <div className="mt-1.5">
        <div className="text-[11px] font-semibold text-slate-700 mb-1.5">Summary Table</div>

        {/* Desktop/tablet: full table (no horizontal scroll in the component) */}
        <div className="hidden lg:block">
          <table className="w-full table-fixed">
            <thead>
              <tr className="text-[11px] text-slate-600 bg-slate-50 border-y border-slate-100">
                <th className="text-left font-semibold px-2 py-1.5 w-[22%]">Model</th>
                <th className="text-right font-semibold px-2 py-1.5 w-[9%]">Units Sold</th>
                <th className="text-right font-semibold px-2 py-1.5 w-[8%]">MoM %</th>
                <th className="text-center font-semibold px-2 py-1.5 w-[12%]">QoQ Trend</th>
                <th className="text-right font-semibold px-2 py-1.5 w-[8%]">YoY %</th>
                <th className="text-right font-semibold px-2 py-1.5 w-[14%]">Last 30 Days (Units)</th>
                <th className="text-right font-semibold px-2 py-1.5 w-[14%]">Last 3 Months (Units)</th>
                <th className="text-right font-semibold px-2 py-1.5 w-[13%]">Last Year (Units)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summaryRows.map((r) => (
                <tr key={r.key} className="text-[11px] hover:bg-slate-50">
                  <td className="px-2 py-1.5 text-slate-900 font-medium truncate">{r.modelLabel}</td>
                  <td className="px-2 py-1.5 text-right text-slate-900 tabular-nums">{fmtInt(r.unitsSold)}</td>
                  <td className={`px-2 py-1.5 text-right tabular-nums ${trendClass(r.mom)}`}>{pct(r.mom)}</td>
                  <td className="px-2 py-1.5 flex items-center justify-center">
                    <Sparkline values={r.qoqSeries} tone="auto" />
                  </td>
                  <td className={`px-2 py-1.5 text-right tabular-nums ${trendClass(r.yoy)}`}>{pct(r.yoy)}</td>
                  <td className="px-2 py-1.5 text-right text-slate-900 tabular-nums">{fmtInt(r.last30)}</td>
                  <td className="px-2 py-1.5 text-right text-slate-900 tabular-nums">{fmtInt(r.last3m)}</td>
                  <td className="px-2 py-1.5 text-right text-slate-900 tabular-nums">{fmtInt(r.lastYear)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile/smaller screens: stacked row layout (no horizontal scroll) */}
        <div className="lg:hidden space-y-1.5">
          {summaryRows.map((r) => (
            <div key={r.key} className="border border-slate-100 rounded-lg p-2">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="text-xs font-semibold text-slate-900 leading-snug">{r.modelLabel}</div>
                <div className="flex-shrink-0">
                  <Sparkline values={r.qoqSeries} tone="auto" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                <div className="text-slate-500">Units Sold</div>
                <div className="text-right tabular-nums text-slate-900">{fmtInt(r.unitsSold)}</div>

                <div className="text-slate-500">MoM %</div>
                <div className={`text-right tabular-nums ${trendClass(r.mom)}`}>{pct(r.mom)}</div>

                <div className="text-slate-500">YoY %</div>
                <div className={`text-right tabular-nums ${trendClass(r.yoy)}`}>{pct(r.yoy)}</div>

                <div className="text-slate-500">Last 30 Days (Units)</div>
                <div className="text-right tabular-nums text-slate-900">{fmtInt(r.last30)}</div>

                <div className="text-slate-500">Last 3 Months (Units)</div>
                <div className="text-right tabular-nums text-slate-900">{fmtInt(r.last3m)}</div>

                <div className="text-slate-500">Last Year (Units)</div>
                <div className="text-right tabular-nums text-slate-900">{fmtInt(r.lastYear)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TopSellingModels
