import React from 'react'

export default function DashboardTable({ title, columns = [], rows = [], compact = true, topRight, maxHeight = 220, wrap = false }) {
  const headerClass = compact ? 'text-xs' : 'text-sm'
  const cellClassBase = compact ? 'px-2 py-1 text-[12px]' : 'px-3 py-2'

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-100 p-3">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
        </div>
        {topRight && <div className="text-xs text-slate-500">{topRight}</div>}
      </div>

      <div style={{ maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight, overflowY: 'auto', overflowX: wrap ? 'hidden' : 'auto' }}>
        <table className={`w-full table-fixed ${compact ? 'text-sm' : 'text-base'}`}>
          <thead className="bg-slate-50">
            <tr className={`${headerClass} text-slate-600`}>
              {columns.map(col => (
                <th key={col.key} className={`${cellClassBase} text-left ${wrap ? 'whitespace-normal break-words' : 'whitespace-nowrap'} ${col.className || ''}`}>{col.title}</th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.map((r, i) => (
              <tr key={r.id || i} className="hover:bg-slate-50">
                {columns.map(col => (
                  <td key={col.key} className={`${cellClassBase} align-middle ${wrap ? 'whitespace-normal break-words' : 'whitespace-nowrap'} ${col.className || ''} ${col.cellClass || ''}`}>
                    {col.render ? col.render(r, i) : (r[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
