import { AlertCircle, TrendingUp, Users, BarChart3 } from 'lucide-react'

const RecentActivityFeed = ({ compact = true } = {}) => {
  const activities = [
    { type: 'sale', icon: TrendingUp, text: '5 Silverados sold', time: '2h ago', color: 'text-green-600' },
    { type: 'competitor', icon: AlertCircle, text: 'Ganley dropped prices by 5%', time: '4h ago', color: 'text-red-600' },
    { type: 'market', icon: BarChart3, text: 'Market share up to 32.5%', time: '6h ago', color: 'text-blue-600' },
    { type: 'customer', icon: Users, text: '12 new leads from website', time: '8h ago', color: 'text-purple-600' },
    { type: 'sale', icon: TrendingUp, text: '3 F-150s sold', time: '1d ago', color: 'text-green-600' },
  ]

  return (
    <div className={compact ? 'h-full' : 'bg-white rounded-xl border border-gray-100 p-3 shadow-sm h-full'}>
      <h3 className="text-xs font-semibold text-gray-900 mb-2">Recent Activity</h3>

      <div className="space-y-2">
        {activities.map((activity, idx) => {
          const Icon = activity.icon
          return (
            <div key={idx} className="flex items-start gap-2 pb-2 border-b border-gray-100 last:border-0 last:pb-0">
              <Icon className={`w-3.5 h-3.5 ${activity.color} flex-shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-800 line-clamp-2">{activity.text}</p>
                <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
              </div>
            </div>
          )
        })}
      </div>

      <button className="w-full mt-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition">
        View all activity
      </button>
    </div>
  )
}

export default RecentActivityFeed
