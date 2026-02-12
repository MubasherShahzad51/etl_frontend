import { TrendingUp, TrendingDown } from 'lucide-react'

const StatCard = ({ label, value, trend, trendValue, compareText, icon: Icon, bgColor = 'bg-gradient-to-br from-blue-50 to-blue-100/50' }) => {
  const isPositive = trend === 'up'

  return (
    <div className={`${bgColor} rounded-2xl p-6 border border-gray-200`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-2">{label}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        </div>
        {Icon && <Icon className="w-6 h-6 text-gray-400" />}
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            isPositive 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trendValue}
          </div>
        )}
      </div>
      
      {compareText && (
        <p className="text-xs text-gray-500">{compareText}</p>
      )}
    </div>
  )
}

export default StatCard
