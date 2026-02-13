import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const COLORS = ['#4f46e5', '#0284c7', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#14b8a6', '#22c55e', '#fb7185', '#64748b']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-gray-100 text-[11px]">
        <div className="font-semibold text-gray-900 mb-1">{label}</div>
        <div className="text-[11px] text-gray-600">
          <span className="font-bold">{payload[0].value?.toLocaleString()}</span> units
        </div>
        <div className="text-[11px] text-gray-500">
          {((payload[0].value / (payload[0].payload.total || 1)) * 100).toFixed(1)}%
        </div>
      </div>
    )
  }
  return null
}

const SegmentBarChart = ({ data, title = 'Segment Distribution', compact = false }) => {
  return (
    <div className={`bg-white ${compact ? 'rounded-xl p-3' : 'rounded-2xl p-6'} border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300`}>
      <h3 className={`${compact ? 'text-xs mb-2' : 'text-lg mb-6'} font-bold text-gray-900`}>{title}</h3>
      <div className={compact ? 'h-40' : 'h-[420px]'}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.slice(0, 10).map(item => ({ ...item, total: data.reduce((sum, i) => sum + (i.value || 0), 0) }))}
            layout="horizontal"
            margin={{ top: 20, right: 20, left: 20, bottom: 30 }}
            barCategoryGap="30%"
            barGap={8}
          >
            <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#334155', fontSize: compact ? 10 : 13, fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={compact ? 26 : 38}
            />
            <YAxis
              dataKey="value"
              tick={{ fill: '#64748b', fontSize: compact ? 11 : 15, fontWeight: 700 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
              width={compact ? 40 : 60}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
            <Bar
              dataKey="value"
              radius={[8, 8, 0, 0]}
              barSize={compact ? 18 : 32}
              minPointSize={4}
            >
              {data.slice(0, 10).map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default SegmentBarChart
