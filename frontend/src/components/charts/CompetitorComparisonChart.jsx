import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-gray-100 text-xs">
        <p className="font-semibold text-gray-900">{data.payload.subject}</p>
        <p className="text-xs text-gray-600">
          <span className="font-bold">{data.value}%</span>
        </p>
      </div>
    )
  }
  return null
}

const CompetitorComparisonChart = ({ data = [], competitors = [], title = 'Competitive Position' }) => {
  const defaultData = [
    { subject: 'Market Share', value: 65 },
    { subject: 'Price Comp', value: 72 },
    { subject: 'Inventory', value: 55 },
    { subject: 'Customer Sat', value: 80 },
    { subject: 'Response Time', value: 68 },
  ]

  const chartData = data.length > 0 ? data : defaultData

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <h3 className="text-xs font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <PolarGrid strokeDasharray="2 2" stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 9 }} />
            <PolarRadiusAxis tick={{ fill: '#9ca3af', fontSize: 8 }} angle={90} domain={[0, 100]} />
            <Radar
              name="Your Performance"
              dataKey="value"
              stroke="#7c3aed"
              fill="#7c3aed"
              fillOpacity={0.3}
              isAnimationActive={false}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      {competitors.length > 0 && (
        <div className="mt-3 border-t border-gray-100 pt-2">
          <div className="text-[11px] text-gray-500 mb-1">Nearby competitors</div>
          <ul className="space-y-1">
            {competitors.slice(0, 4).map((c) => (
              <li key={c.id} className="flex items-center justify-between text-xs">
                <span className="text-gray-700 truncate pr-2">{c.name}</span>
                <span className="text-gray-500">{c.distance_miles} mi</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default CompetitorComparisonChart
