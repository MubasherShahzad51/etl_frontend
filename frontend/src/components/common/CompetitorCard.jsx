import { MapPin, AlertTriangle, ChevronRight, Swords } from 'lucide-react'
import { formatDistance, formatNumber } from '../../utils'

const CompetitorCard = ({ competitor, onClick }) => {
  const getThreatLevel = (rank) => {
    if (rank <= 3) return { 
      label: 'High Threat', 
      color: 'from-rose-500 to-red-600',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-700',
      borderColor: 'border-rose-200',
      ringColor: 'ring-rose-500/20'
    }
    if (rank <= 6) return { 
      label: 'Medium', 
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200',
      ringColor: 'ring-amber-500/20'
    }
    return { 
      label: 'Low', 
      color: 'from-emerald-500 to-green-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      ringColor: 'ring-emerald-500/20'
    }
  }

  const threat = getThreatLevel(competitor.competitor_rank || 99)

  return (
    <div
      onClick={() => onClick?.(competitor)}
      className={`group relative bg-white rounded-2xl border overflow-hidden
        transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${threat.borderColor}`}
    >
      {/* Top gradient bar */}
      <div className={`h-1.5 bg-gradient-to-r ${threat.color}`} />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                {competitor.seller_name}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">
                {formatDistance(competitor.distance_miles)} away
              </span>
            </div>
          </div>
          
          {/* Rank badge */}
          <div className={`relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${threat.color} shadow-lg`}>
            <span className="text-2xl font-bold text-white">
              #{competitor.competitor_rank || '-'}
            </span>
            <div className={`absolute -inset-1 rounded-2xl ${threat.ringColor} ring-4 opacity-50`} />
          </div>
        </div>

        {/* Threat level badge */}
        <div className="mb-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${threat.bgColor} ${threat.textColor}`}>
            <Swords className="w-3.5 h-3.5" />
            {threat.label}
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-gray-50 rounded-xl group-hover:bg-gray-100 transition-colors">
            <p className="text-2xl font-bold text-gray-900">
              {competitor.shared_makes?.length || 0}
            </p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Shared Makes</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl group-hover:bg-gray-100 transition-colors">
            <p className="text-2xl font-bold text-gray-900">
              {competitor.shared_models?.length || 0}
            </p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Shared Models</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl group-hover:bg-gray-100 transition-colors">
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(competitor.shared_model_sales || 0)}
            </p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Shared Sales</p>
          </div>
        </div>

        {/* Competing makes */}
        {competitor.shared_makes?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-2">Competing Makes</p>
            <div className="flex flex-wrap gap-1.5">
              {competitor.shared_makes.slice(0, 4).map((make) => (
                <span 
                  key={make}
                  className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {make}
                </span>
              ))}
              {competitor.shared_makes.length > 4 && (
                <span className="px-2.5 py-1 bg-primary-50 text-primary-600 text-xs font-medium rounded-lg">
                  +{competitor.shared_makes.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* View details hint */}
      <div className="flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-400 text-sm font-medium 
        group-hover:bg-primary-50 group-hover:text-primary-600 transition-all duration-300">
        <span>View Details</span>
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  )
}

export default CompetitorCard
