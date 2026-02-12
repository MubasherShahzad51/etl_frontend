import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react'

const DealerPerformanceScorecard = ({ metrics: customMetrics }) => {
  const metrics = customMetrics || [
    { label: 'Pricing', value: 82, status: 'good' },
    { label: 'Inventory', value: 65, status: 'warning' },
    { label: 'Satisfaction', value: 88, status: 'good' },
    { label: 'Response Time', value: 72, status: 'ok' },
  ]

  const overallScore = Math.round(metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length)

  const getColor = (status) => {
    if (status === 'good') return 'text-green-600'
    if (status === 'warning') return 'text-amber-600'
    return 'text-blue-600'
  }

  const getBgColor = (status) => {
    if (status === 'good') return 'bg-green-50'
    if (status === 'warning') return 'bg-amber-50'
    return 'bg-blue-50'
  }

  const getBarColor = (status) => {
    if (status === 'good') return 'bg-green-600'
    if (status === 'warning') return 'bg-amber-600'
    return 'bg-blue-600'
  }

  const getOverallBgColor = () => {
    if (overallScore >= 80) return 'from-green-50 to-green-100/50'
    if (overallScore >= 70) return 'from-blue-50 to-blue-100/50'
    return 'from-amber-50 to-amber-100/50'
  }

  const getOverallTextColor = () => {
    if (overallScore >= 80) return 'text-green-600'
    if (overallScore >= 70) return 'text-blue-600'
    return 'text-amber-600'
  }

  return (
    <div className="w-full">
      {/* Overall Score */}
      <div className={`bg-gradient-to-br ${getOverallBgColor()} rounded-lg p-2.5 mb-3 border border-gray-200`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 mb-0.5">Overall Health Score</p>
            <h2 className={`text-2xl font-bold ${getOverallTextColor()}`}>{overallScore}</h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600 mb-0.5">Status</p>
            <div className="flex items-center gap-0.5">
              {overallScore >= 80 ? (
                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
              ) : overallScore >= 70 ? (
                <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span className="text-xs font-semibold text-gray-700">
                {overallScore >= 80 ? 'Excellent' : overallScore >= 70 ? 'Good' : 'Needs Work'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div>
        <h3 className="text-xs font-semibold text-gray-900 mb-2.5">Performance Metrics</h3>
        <div className="grid grid-cols-2 gap-2">
          {metrics.map((m) => (
            <div key={m.label} className={`${getBgColor(m.status)} p-2 rounded-lg border border-gray-200`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">{m.label}</span>
                <span className={`text-sm font-bold ${getColor(m.status)}`}>{m.value}</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full transition-all ${getBarColor(m.status)}`}
                  style={{ width: `${m.value}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                {m.status === 'good' ? '✓ On Track' : m.status === 'warning' ? '⚠ Needs Attention' : '→ Monitor'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-2.5 pt-2 border-t border-gray-200 text-xs text-gray-600 space-y-0.5">
        <p><strong>Key Insight:</strong> Inventory management needs improvement.</p>
        <p><strong>Recommendation:</strong> Focus on inventory optimization to boost performance.</p>
      </div>
    </div>
  )
}

export default DealerPerformanceScorecard
