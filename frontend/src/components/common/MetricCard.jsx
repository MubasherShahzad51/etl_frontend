import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const MetricCard = ({
  title,
  value,
  trend,
  trendLabel,
  icon: Icon,
  iconColor = 'text-primary-500',
  iconBg = 'bg-primary-50',
  gradient = false,
  className = '',
  size = 'default'
}) => {
  const getTrendIcon = () => {
    if (!trend && trend !== 0) return null
    if (trend > 0) return <ArrowUpRight className="w-4 h-4" />
    if (trend < 0) return <ArrowDownRight className="w-4 h-4" />
    return <Minus className="w-4 h-4" />
  }

  const getTrendColor = () => {
    if (!trend && trend !== 0) return 'text-gray-500 bg-gray-100'
    if (trend > 0) return 'text-emerald-600 bg-emerald-50'
    if (trend < 0) return 'text-rose-600 bg-rose-50'
    return 'text-gray-500 bg-gray-100'
  }

  const formatTrend = (value) => {
    if (!value && value !== 0) return '-'
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const isCompact = size === 'compact'

  return (
    <div className={`group relative overflow-hidden bg-white ${isCompact ? 'rounded-lg p-2 min-h-[88px]' : 'rounded-2xl p-6'} border border-gray-100 
      transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 hover:border-gray-200
      ${gradient ? 'bg-gradient-to-br from-white to-gray-50/50' : ''} ${className}`}
    >
      {/* Decorative gradient blob */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-0 
        group-hover:opacity-100 transition-opacity duration-500 ${iconBg}`} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className={`${isCompact ? 'text-[10px] leading-snug min-h-[28px] overflow-hidden' : 'text-sm'} font-medium text-gray-500 ${isCompact ? 'mb-0.5' : 'mb-1'}`}
          >
            {title}
          </p>
          <p className={`${isCompact ? 'text-[13px] min-h-[20px] whitespace-nowrap leading-none' : 'text-3xl'} font-bold text-gray-900 tracking-tight tabular-nums leading-tight`}>{value}</p>

          {(trend !== undefined || trendLabel) && (
            <div className={`${isCompact ? 'mt-2' : 'mt-3'} flex items-center gap-2`}>
              {trend !== undefined && (
                <span className={`inline-flex items-center gap-1 ${isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'} rounded-full font-semibold ${getTrendColor()}`}>
                  {getTrendIcon()}
                  {formatTrend(trend)}
                </span>
              )}
              {trendLabel && (
                <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-gray-400`}>{trendLabel}</span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div className={`${isCompact ? 'p-1.5 rounded-lg' : 'p-3.5 rounded-2xl'} ${iconBg} shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
            <Icon className={`${isCompact ? 'w-4 h-4' : 'w-6 h-6'} ${iconColor}`} />
          </div>
        )}
      </div>

      {/* Bottom highlight line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${trend > 0 ? 'from-emerald-500 to-emerald-400' :
        trend < 0 ? 'from-rose-500 to-rose-400' :
          'from-primary-500 to-primary-400'
        } opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    </div>
  )
}

export default MetricCard
