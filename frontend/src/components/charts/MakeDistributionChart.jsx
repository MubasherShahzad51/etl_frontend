import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'

const COLORS = ['#6366f1', '#0ea5e9', '#f59e0b', '#22c55e', '#f43f5e', '#a21caf', '#e11d48', '#0d9488', '#facc15', '#64748b']

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-gray-100 text-[11px]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.payload.fill }} />
          <span className="font-semibold text-gray-900">{data.name}</span>
        </div>
        <p className="text-[11px] text-gray-600">
          <span className="font-bold">{data.value?.toLocaleString()}</span> units
        </p>
        <p className="text-[11px] text-gray-500">
          {((data.value / (data.payload.total || 1)) * 100).toFixed(1)}%
        </p>
      </div>
    )
  }
  return null
}


const MakeDistributionChart = ({ data = [], title = 'Make Distribution', compact = false, horizontal = false }) => {
  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
  // Always show at least 5 bars (with 0 if missing)
  const paddedData = [...data];
  while (paddedData.length < 5) paddedData.push({ name: '', value: 0 });
  const dataWithTotal = paddedData.map(item => ({ ...item, total }));

  return (
    <div className={`bg-white ${compact ? 'rounded-lg p-2' : 'rounded-xl p-3'} border border-gray-100 shadow-md h-full flex flex-col`}>
      <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
        <h3 className={`${compact ? 'text-[10px]' : 'text-[11px]'} font-semibold text-gray-900`}>{title}</h3>
        <span className={`${compact ? 'text-[8px]' : 'text-[9px]'} text-gray-400`}>{total} total</span>
      </div>
      <div className={`w-full flex-1 ${compact ? 'min-h-20' : 'min-h-40'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dataWithTotal}
            layout={horizontal ? 'vertical' : 'horizontal'}
            margin={horizontal ? { top: 4, right: 30, left: 10, bottom: 4 } : { top: 16, right: 10, left: 10, bottom: 24 }}
            barCategoryGap={horizontal ? '20%' : '30%'}
            barGap={horizontal ? 8 : 8}
          >
            <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
            {horizontal ? (
              <>
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: compact ? 7 : 10 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: compact ? 7 : 10 }} tickLine={false} axisLine={false} width={compact ? 60 : 80} />
              </>
            ) : (
              <>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: compact ? 7 : 12, fontWeight: 600 }} tickLine={false} axisLine={false} angle={-15} textAnchor="end" height={compact ? 26 : 38} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: compact ? 7 : 10 }} tickLine={false} axisLine={false} width={compact ? 22 : 32} />
              </>
            )}
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              radius={horizontal ? [0, 8, 8, 0] : [8, 8, 8, 8]}
              isAnimationActive={true}
              barSize={compact ? 10 : 18}
              minPointSize={4}
              label={({ x, y, width, height, value }) =>
                value > 0 ? (
                  horizontal ? (
                    <text
                      x={x + width + 8}
                      y={y + height / 2 + 2}
                      textAnchor="start"
                      fontSize={compact ? 8 : 12}
                      fontWeight="bold"
                      fill="#334155"
                    >
                      {value.toLocaleString()}
                    </text>
                  ) : (
                    <text
                      x={x + width / 2}
                      y={y - 8}
                      textAnchor="middle"
                      fontSize={compact ? 8 : 12}
                      fontWeight="bold"
                      fill="#334155"
                    >
                      {value.toLocaleString()}
                    </text>
                  )
                ) : null
              }
            >
              {dataWithTotal.map((entry, index) => (
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
  );
};

export default MakeDistributionChart
