import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, User, LogOut, Settings } from 'lucide-react'
import { useState } from 'react'

const TopNav = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const apiUrl = typeof window !== 'undefined' ? window.localStorage.getItem('api_url') : null
  const username = typeof window !== 'undefined' ? window.localStorage.getItem('api_user') : null
  const password = typeof window !== 'undefined' ? window.localStorage.getItem('api_password') : null
  const isAuthed = Boolean(apiUrl && username && password)

  const nav = [
    { name: 'Overview', path: '/' },
    { name: 'Dealers', path: '/dealers' },
    { name: 'Sales Map', path: '/sales-map' },
    { name: 'Trend Analysis', path: '/trend-analysis' },
    { name: 'Inventory Analysis', path: '/inventory-analysis' },
    { name: 'AI Insights', path: '/ai-insights' }
  ]

  const isActive = (p) => location.pathname === p

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white font-bold shadow-md">AD</div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-slate-900">Adcertify Automotive Analysis</div>
              <div className="text-xs text-slate-500 -mt-0.5">Dealer Intelligence</div>
            </div>
          </div>

          {/* Primary nav */}
          <div className="hidden md:flex flex-1 justify-center">
            <nav className="flex items-center gap-1">
              {nav.map((n) => (
                <button
                  key={n.path}
                  onClick={() => navigate(n.path)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive(n.path) ? 'text-indigo-700 bg-indigo-50' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  {n.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => {
                  if (!isAuthed) {
                    navigate('/login')
                    return
                  }
                  setProfileOpen(!profileOpen)
                }}
                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-slate-50"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-yellow-400 flex items-center justify-center text-white font-semibold text-sm">AD</div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-sm text-slate-800">{isAuthed ? 'Admin' : 'Admin login'}</span>
                  <span className="text-xs text-slate-400 -mt-0.5">{isAuthed ? 'Admin' : 'Sign in'}</span>
                </div>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-md shadow-lg py-1">
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-gray-50 flex items-center gap-2"><User className="w-4 h-4" />Profile</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-gray-50 flex items-center gap-2"><Settings className="w-4 h-4" />Settings</button>
                  <div className="border-t my-1" />
                  <button
                    onClick={() => {
                      window.localStorage.removeItem('api_url')
                      window.localStorage.removeItem('api_user')
                      window.localStorage.removeItem('api_password')
                      setProfileOpen(false)
                      navigate('/login')
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />Log out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-md hover:bg-slate-50">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile panel */}
        {mobileOpen && (
          <div className="md:hidden mt-2 pb-3 border-t border-gray-100">
            <div className="px-2 space-y-1">
              {nav.map((i) => (
                <button key={i.name} onClick={() => { navigate(i.path); setMobileOpen(false) }} className="w-full text-left px-4 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-50">{i.name}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default TopNav
