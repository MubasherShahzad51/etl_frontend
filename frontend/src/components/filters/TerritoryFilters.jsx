import { Filter } from 'lucide-react'

const TerritoryFilters = ({
  scope,
  state,
  dateRange,
  states = [],
  onChange,
  onOpenDetails,
}) => {
  const set = (next) => {
    if (!onChange) return
    onChange({ scope, state, dateRange, ...next })
  }

  return (
    <div className="bg-white rounded-2xl p-2 border border-gray-100">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <Filter className="w-4 h-4 text-indigo-700" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 leading-none">Territory</h4>
            <div className="text-[11px] text-slate-500 mt-0.5 leading-none truncate">Scope and time span</div>
          </div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block min-w-0">
          <div className="text-[11px] text-slate-500">Territory</div>
          <select
            value={scope === 'USA' ? 'USA' : state}
            onChange={(e) => {
              const v = e.target.value
              if (v === 'USA') {
                set({ scope: 'USA' })
              } else {
                set({ scope: 'State', state: v })
              }
            }}
            className="mt-1 w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-300"
          >
            <option value="USA">(National)</option>
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label className="block min-w-0">
          <div className="text-[11px] text-slate-500">Date</div>
          <select
            value={dateRange}
            onChange={(e) => set({ dateRange: e.target.value })}
            className="mt-1 w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-300"
          >
            <option value="30d">Last 30 days</option>
            <option value="3m">Last 3 months</option>
          </select>
        </label>
      </div>
    </div>
  )
}

export default TerritoryFilters
