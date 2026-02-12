import { useEffect, useMemo, useState } from 'react'

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

const AIInsights = () => {
  const [dealers, setDealers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoading(true)
        const text = await fetch('/dealer_sales_summary_simple.csv').then((r) => r.text())
        if (!active) return
        setDealers(parseCsv(text))
        setError('')
      } catch (err) {
        if (!active) return
        setError('Unable to load AI insight data.')
        setDealers([])
      } finally {
        if (active) setLoading(false)
      }
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

  const concentration = useMemo(() => {
    if (!dealers.length) return 0
    const sorted = [...dealers].sort((a, b) => toNumber(b.total_sales) - toNumber(a.total_sales))
    const topCount = Math.max(1, Math.ceil(sorted.length * 0.1))
    const topSales = sorted.slice(0, topCount).reduce((s, d) => s + toNumber(d.total_sales), 0)
    return totalSales > 0 ? (topSales / totalSales) * 100 : 0
  }, [dealers, totalSales])

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
      .slice(0, 5)
  }, [dealers])

  const topMake = useMemo(() => {
    const totals = new Map()
    dealers.forEach((d) => {
      const makes = String(d.top_5_makes || '').split('|').map((v) => v.trim()).filter(Boolean)
      const invs = String(d.top_5_make_inventory || '').split('|').map((v) => toNumber(v))
      makes.forEach((make, idx) => {
        const value = invs[idx] || 0
        totals.set(make, (totals.get(make) || 0) + value)
      })
    })
    const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1])
    return sorted[0]?.[0] || 'N/A'
  }, [dealers])

  const summaryText = useMemo(() => {
    if (!dealers.length) return 'No market data available.'
    const topState = opportunityStates[0]?.state || 'N/A'
    const ratioLabel = inventoryToSales > 1.1
      ? 'oversupply pressure'
      : inventoryToSales < 0.9
        ? 'tight inventory'
        : 'balanced supply'
    return `Market demand is steady with ${ratioLabel}. Top opportunity states include ${topState}, while ${topMake} remains the leading make by inventory depth. A concentrated group of dealers controls ${concentration.toFixed(1)}% of total sales.`
  }, [dealers.length, opportunityStates, inventoryToSales, topMake, concentration])

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[14px] font-semibold text-slate-900">AI Insights</div>
        <div className="text-[10px] text-slate-500">Automated market narrative and signals</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="bg-white rounded-2xl border border-gray-100 p-2">
          <div className="text-[10px] text-slate-500">Total Dealers</div>
          <div className="text-[12px] font-semibold text-slate-900">{dealerCount.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-2">
          <div className="text-[10px] text-slate-500">Total Sales</div>
          <div className="text-[12px] font-semibold text-slate-900">{Math.round(totalSales).toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-2">
          <div className="text-[10px] text-slate-500">Inventory / Sales</div>
          <div className="text-[12px] font-semibold text-slate-900">{inventoryToSales.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-2">
          <div className="text-[10px] text-slate-500">Top Opportunity</div>
          <div className="text-[12px] font-semibold text-slate-900">{opportunityStates[0]?.state || 'N/A'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl border border-gray-100 p-3 lg:col-span-2">
          <div className="text-[12px] font-semibold text-slate-900 mb-2">Market Summary</div>
          <p className="text-[11px] text-slate-600 leading-relaxed">{summaryText}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3">
          <div className="text-[12px] font-semibold text-slate-900 mb-2">Opportunity Signals</div>
          <ul className="space-y-1 text-[11px] text-slate-600">
            {opportunityStates.slice(0, 3).map((s) => (
              <li key={s.state}>• {s.state} score {Math.round(s.score).toLocaleString()}</li>
            ))}
            <li>• Leading make: {topMake}</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <div className="bg-white rounded-2xl border border-gray-100 p-3">
          <div className="text-[12px] font-semibold text-slate-900 mb-2">Risk Signals</div>
          <ul className="space-y-1 text-[11px] text-slate-600">
            <li>• Inventory pressure: {inventoryToSales > 1.1 ? 'Oversupply' : inventoryToSales < 0.9 ? 'Undersupply' : 'Balanced'}</li>
            <li>• Market concentration: {concentration.toFixed(1)}% of sales from top 10%</li>
            <li>• Dealer count: {dealerCount.toLocaleString()} active dealers</li>
          </ul>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3">
          <div className="text-[12px] font-semibold text-slate-900 mb-2">Suggested Actions</div>
          <ul className="space-y-1 text-[11px] text-slate-600">
            <li>• Prioritize {opportunityStates[0]?.state || 'top'} for expansion focus</li>
            <li>• Monitor inventory-to-sales weekly for price pressure</li>
            <li>• Rebalance make mix toward {topMake}</li>
          </ul>
        </div>
      </div>

      {loading && <div className="text-[10px] text-slate-500">Loading insights…</div>}
      {error && <div className="text-[10px] text-rose-600">{error}</div>}
    </div>
  )
}

export default AIInsights
