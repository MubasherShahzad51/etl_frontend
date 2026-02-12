import { useState, useEffect, useRef } from 'react'
import { Search, X, MapPin, Building2 } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'

const SearchInput = ({ 
  placeholder = 'Search...', 
  onSearch, 
  loading = false,
  suggestions = [],
  onSelect,
  debounceMs = 300,
  size = 'default'
}) => {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (query.length >= 2) {
      timeoutRef.current = setTimeout(() => {
        onSearch?.(query)
      }, debounceMs)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query, onSearch, debounceMs])

  useEffect(() => {
    if (suggestions.length > 0 && query.length >= 2) {
      setShowSuggestions(true)
    }
  }, [suggestions, query])

  const handleClear = () => {
    setQuery('')
    setShowSuggestions(false)
    onSearch?.('')
    inputRef.current?.focus()
  }

  const handleSelect = (item) => {
    onSelect?.(item)
    setShowSuggestions(false)
    setQuery('')
  }

  const isCompact = size === 'compact'

  return (
    <div className="relative">
      <div className={`relative transition-all duration-300 ${focused ? 'transform scale-[1.01]' : ''}`}>
        {/* Glow effect */}
        <div className={`absolute -inset-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl blur-lg opacity-0 transition-opacity duration-300 ${
          focused ? 'opacity-20' : ''
        }`} />
        
        <div className="relative">
          <Search className={`absolute ${isCompact ? 'left-3 w-4 h-4' : 'left-4 w-5 h-5'} top-1/2 -translate-y-1/2 transition-colors duration-200 ${
            focused ? 'text-primary-500' : 'text-gray-400'
          }`} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setFocused(true)
              if (suggestions.length > 0) setShowSuggestions(true)
            }}
            onBlur={() => {
              setFocused(false)
              // Allow suggestion clicks to register before closing.
              setTimeout(() => setShowSuggestions(false), 120)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (query.trim().length >= 2) onSearch?.(query.trim())
                setShowSuggestions(false)
              }
              if (e.key === 'Escape') {
                setShowSuggestions(false)
              }
            }}
            placeholder={placeholder}
            className={`w-full ${isCompact ? 'pl-9 pr-9 py-2.5 text-xs rounded-xl' : 'pl-12 pr-12 py-4 text-sm rounded-2xl'} bg-white border-2
              text-gray-900 placeholder-gray-400 font-medium
              transition-all duration-300
              focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10
              ${focused ? 'border-primary-300 shadow-xl shadow-gray-200/50' : 'border-gray-200 hover:border-gray-300 shadow-sm'}`}
          />
          
          {/* Loading or Clear button */}
          <div className={`absolute ${isCompact ? 'right-2' : 'right-4'} top-1/2 -translate-y-1/2 flex items-center gap-2`}>
            {loading && <LoadingSpinner size="sm" />}
            {query && !loading && (
              <button
                onClick={handleClear}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className={`${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-gray-400 hover:text-gray-600`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          className={`absolute z-50 w-full mt-2 bg-white border border-gray-200 ${isCompact ? 'rounded-xl' : 'rounded-2xl'} shadow-2xl shadow-gray-200/50 overflow-hidden animate-fade-in-down`}
          onMouseLeave={() => setShowSuggestions(false)}
        >
          <div className="p-2">
            {suggestions.map((item, index) => (
              <button
                key={item.mc_dealer_id || index}
                onClick={() => handleSelect(item)}
                className={`w-full ${isCompact ? 'px-3 py-2 rounded-lg' : 'px-4 py-3 rounded-xl'} text-left hover:bg-gray-50 flex items-center gap-4 transition-all duration-200 group`}
              >
                <div className={`${isCompact ? 'p-2 rounded-lg' : 'p-2.5 rounded-xl'} bg-primary-50 group-hover:bg-primary-100 transition-colors`}>
                  <Building2 className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} text-primary-600`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors ${isCompact ? 'text-xs' : ''}`}>
                    {item.seller_name || item.name}
                  </p>
                  <div className={`flex items-center gap-1 text-gray-500 ${isCompact ? 'text-[11px]' : 'text-sm'}`}>
                    <MapPin className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                    <span>{item.city}, {item.state}</span>
                    <span className="text-gray-300 mx-1">•</span>
                    <span className="text-gray-400">ID: {item.mc_dealer_id}</span>
                  </div>
                </div>
                <span className={`${isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} rounded-lg font-semibold ${
                  item.dealer_type === 'OEM' 
                    ? 'bg-blue-100 text-blue-700' 
                    : item.dealer_type === 'Independent'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {item.dealer_type || 'Dealer'}
                </span>
              </button>
            ))}
          </div>
          
          {/* Footer hint */}
          <div className={`px-4 ${isCompact ? 'py-2' : 'py-3'} bg-gray-50 border-t border-gray-100`}>
            <p className={`text-gray-500 text-center ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
              Press <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 font-mono text-xs">Enter</kbd> to search or click a result
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchInput
