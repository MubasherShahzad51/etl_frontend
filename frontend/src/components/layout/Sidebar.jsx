import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Building2, 
  Target, 
  FileBarChart,
  Settings,
  HelpCircle,
  ChevronRight,
  Zap,
  X
} from 'lucide-react'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & Stats' },
  { path: '/dealers', label: 'Dealers', icon: Building2, description: 'Search & Analyze' },
  { path: '/attribution', label: 'Attribution', icon: Target, description: 'Sales Attribution' },
  { path: '/reports', label: 'Reports', icon: FileBarChart, description: 'Market Reports' },
]

const bottomItems = [
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/help', label: 'Help & Support', icon: HelpCircle },
]

const Sidebar = ({ isOpen, isMobile, onClose }) => {
  const location = useLocation()

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-xl transition-all duration-300 ease-smooth z-40 ${
        isOpen 
          ? 'w-72 translate-x-0' 
          : '-translate-x-full w-72'
      } ${isMobile ? 'pt-4' : 'pt-20'}`}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Mobile close button */}
        {isMobile && (
          <div className="flex items-center justify-between px-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">Dealer Intel</span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}

        {/* Main navigation */}
        <nav className="flex-1 px-4 py-2 overflow-y-auto no-scrollbar">
          <p className="px-3 mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Main Menu
          </p>
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path))
              
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={isMobile ? onClose : undefined}
                    className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <div className={`p-2 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-white/20' 
                        : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}>
                      <item.icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${isActive ? 'text-white' : ''}`}>
                        {item.label}
                      </p>
                      <p className={`text-xs truncate ${
                        isActive ? 'text-white/70' : 'text-gray-400'
                      }`}>
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-all duration-200 ${
                      isActive 
                        ? 'text-white/70 translate-x-0' 
                        : 'text-gray-300 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                    }`} />
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Pro card */}
        <div className="px-4 py-4">
          <div className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl text-white shadow-lg shadow-primary-500/25">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5" />
              <span className="font-bold text-sm">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-white/80 mb-3">
              Get advanced analytics, unlimited reports, and priority support.
            </p>
            <button className="w-full py-2 bg-white text-primary-600 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors">
              Learn More
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>

        {/* Bottom navigation */}
        <nav className="px-4 py-4">
          <ul className="space-y-1">
            {bottomItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={isMobile ? onClose : undefined}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Version info */}
        <div className="px-6 py-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">Version 1.0.0</p>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-600 font-medium">Online</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
