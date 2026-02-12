import { useLocation } from 'react-router-dom'

import TopNav from './TopNav'

const Layout = ({ children }) => {
  const location = useLocation()
  const isDashboard = location.pathname === '/'
  const hideTopNav = location.pathname === '/login'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-100/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-100/20 rounded-full blur-3xl" />
      </div>

      {!hideTopNav && <TopNav />}

      <main
        className={
          hideTopNav
            ? 'min-h-screen pt-0 pb-0 px-0 relative z-10 w-full'
            : isDashboard
              ? 'h-screen pt-14 pb-2 px-3 sm:px-5 lg:px-8 relative z-10 w-full overflow-hidden'
              : 'min-h-screen pt-16 pb-4 px-3 sm:px-5 lg:px-8 relative z-10 w-full'
        }
      >
        <div className={isDashboard ? 'w-full h-full overflow-hidden' : 'w-full'}>
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout
