import { useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  { label: 'Sales Map', path: '/sales-map' },
  { label: 'Trend Analysis', path: '/trend-analysis' },
  { label: 'Inventory Analysis', path: '/inventory-analysis' },
]

const AnalyticsSubnav = () => {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="w-full">
      <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 shadow-sm">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default AnalyticsSubnav
