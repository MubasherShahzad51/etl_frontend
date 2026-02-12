import { MapPin, Car, TrendingUp, ChevronRight, Star } from 'lucide-react'
import { formatNumber } from '../../utils'

const DealerCard = ({ dealer, onClick, showStats = true, compact = false }) => {
  const getTypeStyles = (type) => {
    switch(type) {
      case 'OEM':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
      case 'Independent':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
    }
  }

  return (
    <div
      onClick={() => onClick?.(dealer)}
      className={`group relative bg-white ${compact ? 'rounded-xl' : 'rounded-2xl'} border border-gray-100 overflow-hidden
        transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 hover:border-gray-200 cursor-pointer`}
    >
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className={compact ? 'p-3' : 'p-5'}>
        <div className={compact ? 'flex items-start justify-between mb-2' : 'flex items-start justify-between mb-3'}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors ${compact ? 'text-[13px]' : 'text-lg'}`}>
                {dealer.seller_name || dealer.name}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <MapPin className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} flex-shrink-0`} />
              <span className={`${compact ? 'text-[11px]' : 'text-sm'} truncate`}>
                {dealer.city}, {dealer.state} {dealer.zip}
              </span>
            </div>
          </div>
          <ChevronRight className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all flex-shrink-0`} />
        </div>

        <div className={compact ? 'flex items-center gap-2 mb-2' : 'flex items-center gap-2 mb-4'}>
          <span className={`${compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} rounded-full font-semibold shadow-sm ${getTypeStyles(dealer.dealer_type)}`}>
            {dealer.dealer_type || 'Dealer'}
          </span>
          <span className={`${compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} bg-gray-100 text-gray-600 rounded-full font-medium`}>
            ID: {dealer.mc_dealer_id}
          </span>
        </div>

        {showStats && (
          <>
            <div className={`h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent ${compact ? 'my-2' : 'my-4'}`} />
            
            <div className={compact ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 gap-4'}>
              <div className={`group/stat flex items-center ${compact ? 'gap-2 p-2 rounded-lg' : 'gap-3 p-3 rounded-xl'} bg-gradient-to-br from-emerald-50 to-emerald-50/50 transition-all duration-200 hover:shadow-md`}>
                <div className={`${compact ? 'p-1.5 rounded-md' : 'p-2 rounded-lg'} bg-white shadow-sm`}>
                  <Car className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-emerald-600`} />
                </div>
                <div>
                  <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-gray-500 font-medium`}>Inventory</p>
                  <p className={`font-semibold text-gray-900 ${compact ? 'text-[13px]' : 'text-lg'}`}>
                    {formatNumber(dealer.active_inventory || dealer.inventory || 0)}
                  </p>
                </div>
              </div>
              
              <div className={`group/stat flex items-center ${compact ? 'gap-2 p-2 rounded-lg' : 'gap-3 p-3 rounded-xl'} bg-gradient-to-br from-blue-50 to-blue-50/50 transition-all duration-200 hover:shadow-md`}>
                <div className={`${compact ? 'p-1.5 rounded-md' : 'p-2 rounded-lg'} bg-white shadow-sm`}>
                  <TrendingUp className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} />
                </div>
                <div>
                  <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-gray-500 font-medium`}>Sales</p>
                  <p className={`font-semibold text-gray-900 ${compact ? 'text-[13px]' : 'text-lg'}`}>
                    {formatNumber(dealer.total_sales || dealer.sales || 0)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  )
}

export default DealerCard
