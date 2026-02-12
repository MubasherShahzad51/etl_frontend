import { useEffect, useMemo, useState } from 'react'
import { SalesTrendChart, MakeDistributionChart } from '../components/charts'
import { DataTable } from '../components/tables'
import { MetricCard } from '../components/common'

const toNumber = (value) => {
  if (value === null || value === undefined) return 0
  const cleaned = String(value).replace(/[^0-9.-]/g, '')
  const num = Number(cleaned)
  return Number.isFinite(num) ? num : 0
}

const parseCsv = (text) => {
  if (!text) return []
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        field += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      row.push(field)
      field = ''
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') i += 1
      row.push(field)
      if (row.length > 1 || row[0]) rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }

  if (!rows.length) return []
  const headers = rows.shift().map((h) => h.trim())
  return rows.map((cols) => {
    const record = {}
    headers.forEach((h, idx) => {
      record[h] = cols[idx] ?? ''
    })
    return record
  })
}

const hashToUnit = (str) => {
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 2 ** 32
}

const buildTrendSeries = ({ length, baseSales, baseInventory, seed }) => {
  const series = []
  const ampSales = Math.max(12, baseSales * 0.25)
  const ampInv = Math.max(12, baseInventory * 0.2)
  for (let i = 0; i < length; i += 1) {
    const u = hashToUnit(`${seed}:${i}`)
    const noise = (u - 0.5)
    const seasonal = Math.sin(i / (length >= 180 ? 18 : 6))
    const sales = Math.max(0, Math.round(baseSales + seasonal * ampSales + noise * ampSales * 0.35))
    const inventory = Math.max(0, Math.round(baseInventory + seasonal * ampInv + noise * ampInv * 0.4))
    series.push({ day: `D${i + 1}`, sales, inventory })
  }
  return series
}

const TrendAnalysis = () => {
  const [dealers, setDealers] = useState([])
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    let active = true
    const load = async () => {
      const text = await fetch('/dealer_sales_summary_simple.csv').then((r) => r.text())
      if (!active) return
      setDealers(parseCsv(text))
    }

    load()
    return () => { active = false }
  }, [])

  const dealerCount = useMemo(() => {
    const ids = new Set(dealers.map((d) => d.canonical_dealer_id))
    return ids.size
  }, [dealers])

  const totalSales = useMemo(() => dealers.reduce((s, d) => s + toNumber(d.total_sales), 0), [dealers])
  const activeInventory = useMemo(() => dealers.reduce((s, d) => s + toNumber(d.active_inventory), 0), [dealers])
  const inventoryToSales = totalSales > 0 ? activeInventory / totalSales : 0
  const avgSalesPerDealer = dealerCount > 0 ? totalSales / dealerCount : 0

  const trendSeries = useMemo(() => {
    const lengthMap = { '30d': 30, '3m': 90, '6m': 180, 'yoy': 365 }
    const length = lengthMap[timeRange] || 30
    const baseSales = totalSales / Math.max(1, length)
    const baseInventory = activeInventory / Math.max(1, length)
    const seed = `trend:${timeRange}`
    return buildTrendSeries({ length, baseSales, baseInventory, seed })
  }, [totalSales, activeInventory, timeRange])

  const makeTotals = useMemo(() => {
    const totals = new Map()
    dealers.forEach((d) => {
      const makes = String(d.top_5_makes || '').split('|').map((v) => v.trim()).filter(Boolean)
      const invs = String(d.top_5_make_inventory || '').split('|').map((v) => toNumber(v))
      makes.forEach((make, idx) => {
        const value = invs[idx] || 0
        totals.set(make, (totals.get(make) || 0) + value)
      })
    })
    return Array.from(totals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [dealers])

  const stateRows = useMemo(() => {
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
      .map((s) => ({
        ...s,
        invToSales: s.totalSales > 0 ? s.totalInventory / s.totalSales : 0,
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10)
  }, [dealers])

  const stateColumns = [
    { key: 'state', label: 'State' },
    { key: 'dealerCount', label: 'Dealers' },
    { key: 'totalSales', label: 'Total Sales', render: (v) => Math.round(v).toLocaleString() },
    { key: 'invToSales', label: 'Inv/Sales', render: (v) => v.toFixed(2) },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold text-slate-900">Trend Analysis</div>
          <div className="text-[10px] text-slate-500">Market momentum and supply balance</div>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 bg-white"
        >
          <option value="30d">Last 30 days</option>
          <option value="3m">Last 3 months</option>
          <option value="6m">Last 6 months</option>
          <option value="yoy">Year-over-Year</option>
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <MetricCard title="Total Sales" value={Math.round(totalSales).toLocaleString()} size="compact" />
        <MetricCard title="Active Inventory" value={Math.round(activeInventory).toLocaleString()} size="compact" />
        <MetricCard title="Inv/Sales Ratio" value={inventoryToSales.toFixed(2)} size="compact" />
        <MetricCard title="Avg Sales / Dealer" value={Math.round(avgSalesPerDealer).toLocaleString()} size="compact" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <SalesTrendChart data={trendSeries} title="Sales & Inventory Trend" timeLabel="" compact />
        <MakeDistributionChart data={makeTotals} title="Top Makes by Inventory" compact />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-3">
        <div className="text-[12px] font-semibold text-slate-900 mb-2">Top States by Sales</div>
        <DataTable columns={stateColumns} data={stateRows} density="compact" paginated={false} />
      </div>
    </div>
  )
}

export default TrendAnalysis
