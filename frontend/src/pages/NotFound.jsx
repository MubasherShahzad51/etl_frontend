import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, Search, Sparkles } from 'lucide-react'

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative animate-fade-in-up">
        {/* 404 Number */}
        <div className="relative mb-8">
          <span className="text-[180px] md:text-[220px] font-black text-gray-100 select-none leading-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl shadow-2xl shadow-primary-500/30">
              <Search className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        {/* Text content */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          Page Not Found
        </h1>
        <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
          Oops! The page you're looking for doesn't exist or has been moved to a new location.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>

        {/* Helpful links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-400 mb-4">Or try one of these pages:</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { label: 'Dealers', path: '/dealers' },
              { label: 'Attribution', path: '/attribution' },
              { label: 'Reports', path: '/reports' },
            ].map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="text-primary-600 hover:text-primary-700 font-medium hover:underline transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound
