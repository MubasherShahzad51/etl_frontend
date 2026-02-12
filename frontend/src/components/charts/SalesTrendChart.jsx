import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const CustomTooltip = ({ active, payload, label, valueFormatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-gray-100 text-xs">
        <p className="font-semibold text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-bold">{valueFormatter(entry.value)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const SalesTrendChart = ({
  data = [],
  title = 'Sales Trend',
  timeLabel = 'Last 30 days',
  compact = false,
  xKey = 'day',
  showInventory = 'auto',
  valueFormatter,
}) => {
  const hasInventory = showInventory === 'auto'
    ? data.some((d) => d.inventory !== undefined)
    : Boolean(showInventory)
  const formatValue = valueFormatter || ((v) => Number(v).toLocaleString())

  return (
    <div className={`bg-white ${compact ? 'rounded-lg p-2' : 'rounded-xl p-3'} border border-gray-100 shadow-sm h-full flex flex-col`}>
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <h3 className={`${compact ? 'text-[11px]' : 'text-xs'} font-semibold text-gray-900`}>{title}</h3>
        <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-gray-400`}>{timeLabel}</span>
      </div>
      {hasInventory && !compact && (
        <div className="flex items-center gap-3 text-[9px] text-slate-500 mb-1">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500" /> Sales
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-500" /> Inventory
          </span>
        </div>
      )}
      <div className={`w-full flex-1 ${compact ? 'min-h-20' : 'min-h-40'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#f0f0f0" vertical={false} />
            <XAxis 
              dataKey={xKey}
              interval={Math.max(0, Math.floor((data.length || 1) / 5))}
              tick={{ fill: '#9ca3af', fontSize: compact ? 8 : 9 }}
              tickLine={false}
              axisLine={false}
              height={compact ? 14 : 20}
            />
            <YAxis 
              tick={{ fill: '#9ca3af', fontSize: compact ? 8 : 9 }}
              tickLine={false}
              axisLine={false}
              width={compact ? 24 : 30}
              tickFormatter={(v) => formatValue(v)}
            />
            <Tooltip content={<CustomTooltip valueFormatter={formatValue} />} cursor={{ stroke: '#e5e7eb' }} />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#7c3aed"
              strokeWidth={compact ? 2 : 2.5}
              dot={false}
              activeDot={{ r: compact ? 3 : 4, fill: '#7c3aed' }}
              name="Sales"
              isAnimationActive={false}
            />
            {hasInventory && (
              <Line
                type="monotone"
                dataKey="inventory"
                stroke="#0ea5e9"
                strokeWidth={compact ? 2 : 2.5}
                dot={false}
                activeDot={{ r: compact ? 3 : 4, fill: '#0ea5e9' }}
                name="Inventory"
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default SalesTrendChart
