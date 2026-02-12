import { Menu, Bell, User, Search, X, Sparkles } from 'lucide-react'
import { useState } from 'react'

const Header = ({ toggleSidebar, sidebarOpen }) => {
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-50">
      {/* Glass background */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm" />
      
      <div className="relative flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left section */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 active:scale-95"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
            )}
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-gray-900 text-lg leading-tight">Dealer Intel</h1>
              <p className="text-xs text-gray-500 -mt-0.5">Analytics Platform</p>
            </div>
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-2xl mx-4 hidden md:block">
          <div className={`relative transition-all duration-300 ${searchFocused ? 'scale-[1.02]' : ''}`}>
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
              searchFocused ? 'text-primary-500' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="Search dealers, reports, analytics..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={`w-full pl-12 pr-4 py-3 bg-gray-50/80 border rounded-2xl 
                focus:outline-none focus:bg-white focus:border-primary-300 focus:ring-4 focus:ring-primary-500/10
                text-sm placeholder-gray-400 transition-all duration-300
                ${searchFocused ? 'border-primary-300 shadow-lg' : 'border-gray-200 hover:border-gray-300'}`}
            />
            <div className={`absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-400 font-medium transition-opacity duration-200 ${
              searchFocused ? 'opacity-0' : 'opacity-100'
            }`}>
              ⌘K
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Mobile search button */}
          <button className="md:hidden p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200">
            <Search className="w-5 h-5 text-gray-600" />
          </button>

          {/* Notifications */}
          <button className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 group">
            <Bell className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full border-2 border-white animate-pulse" />
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200 mx-1 hidden sm:block" />

          {/* User menu */}
          <button className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-gray-100 transition-all duration-200 group">
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200">
                <User className="w-5 h-5 text-gray-500" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-900 leading-tight">Admin</p>
              <p className="text-xs text-gray-500">Pro Plan</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
