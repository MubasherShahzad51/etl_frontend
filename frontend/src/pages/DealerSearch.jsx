import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Filter, Grid, List, MapPin, SlidersHorizontal, X } from 'lucide-react'
import { SearchInput, DealerCard, LoadingSpinner, EmptyState } from '../components/common'
import { dealerService } from '../services'

const toNumber = (value) => {
  if (value === null || value === undefined) return 0
  const cleaned = String(value).replace(/[^0-9.-]/g, '')
  const num = Number(cleaned)
  return Number.isFinite(num) ? num : 0
}

const parseCsv = (text) => {
  if (!text) return []
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        field += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      row.push(field)
      field = ''
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') i += 1
      row.push(field)
      if (row.length > 1 || row[0]) rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }

  if (!rows.length) return []
  const headers = rows.shift().map((h) => h.trim())
  return rows.map((cols) => {
    const record = {}
    headers.forEach((h, idx) => {
      record[h] = cols[idx] ?? ''
    })
    return record
  })
}

const DealerSearch = () => {
  const navigate = useNavigate()
  const [allDealers, setAllDealers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    state: '',
    dealerType: '',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [displayDealers, setDisplayDealers] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 25

  const stateOptions = useMemo(() => {
    const set = new Set(allDealers.map((d) => d.state).filter(Boolean))
    return Array.from(set).sort()
  }, [allDealers])

  const dealerTypeOptions = useMemo(() => {
    const set = new Set(allDealers.map((d) => d.dealer_type).filter(Boolean))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [allDealers])

  const filterDealers = useCallback((rows, { query, state, dealerType }) => {
    let filtered = [...rows]
    if (state) filtered = filtered.filter((d) => d.state === state)
    if (dealerType) filtered = filtered.filter((d) => d.dealer_type === dealerType)
    if (query && query.length >= 2) {
      const q = query.toLowerCase()
      filtered = filtered.filter((d) => (
        d.seller_name?.toLowerCase().includes(q) ||
        d.city?.toLowerCase().includes(q) ||
        d.state?.toLowerCase().includes(q) ||
        d.mc_dealer_id?.toLowerCase().includes(q)
      ))
    }
    return filtered
  }, [])

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoading(true)
        const text = await fetch('/dealer_sales_summary_simple.csv').then((r) => r.text())
        if (!active) return
        const rows = parseCsv(text)
        const mapped = rows.map((d) => ({
          canonical_dealer_id: d.canonical_dealer_id,
          mc_dealer_id: d.mc_dealer_id,
          mc_location_id: d.mc_location_id,
          seller_name: d.seller_name,
          city: d.city,
          state: d.state,
          zip: d.zip,
          dealer_type: d.dealer_type,
          active_inventory: toNumber(d.active_inventory),
          total_sales: toNumber(d.total_sales),
        }))
        setAllDealers(mapped)
        setDisplayDealers(mapped)
        setCurrentPage(1)
        setError('')
      } catch (err) {
        if (!active) return
        setError('Unable to load dealer data.')
        setAllDealers([])
        setDisplayDealers([])
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  const handleSearch = useCallback(async (query) => {
    const q = (query || '').trim()
    setSearchQuery(q)
    console.debug('[DealerSearch] handleSearch', q)

    // If a backend API is configured, prefer server-side suggestions.
    if (q.length >= 2 && (import.meta.env.VITE_API_URL || '').length) {
      try {
        console.debug('[DealerSearch] using backend search')
        setLoading(true)
        const results = await dealerService.searchDealers(q, 50)
        setSuggestions(results.slice(0, 6))
        // Show backend results in list view so search is consistent.
        setDisplayDealers(results)
        setCurrentPage(1)
        return
      } catch (err) {
        console.warn('[DealerSearch] backend search failed, falling back', err)
        // Fall back to client-side filtering below
        // console.warn('Backend search failed, falling back to CSV filter', err)
      } finally {
        setLoading(false)
      }
    }
    console.debug('[DealerSearch] using client-side CSV filter')
    // Fallback: client-side CSV filtering (existing behavior)
    const filtered = filterDealers(allDealers, {
      query: q,
      state: filters.state,
      dealerType: filters.dealerType,
    })
    setDisplayDealers(filtered)
    setSuggestions(q.length >= 2 ? filtered.slice(0, 6) : [])
    setCurrentPage(1)
  }, [allDealers, filters.dealerType, filters.state, filterDealers])

  const handleSelectDealer = (dealer) => {
    navigate(`/dealer/${dealer.mc_dealer_id}/${dealer.mc_location_id}`)
  }

  const handleApplyFilters = () => {
    const filtered = filterDealers(allDealers, {
      query: searchQuery,
      state: filters.state,
      dealerType: filters.dealerType,
    })
    setDisplayDealers(filtered)
    setCurrentPage(1)
    setShowFilters(false)
  }

  const handleResetFilters = () => {
    setFilters({ state: '', dealerType: '' })
    const filtered = filterDealers(allDealers, {
      query: searchQuery,
      state: '',
      dealerType: '',
    })
    setDisplayDealers(filtered)
    setCurrentPage(1)
  }

  const dealersToShow = displayDealers
  const totalPages = Math.max(1, Math.ceil(dealersToShow.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const startIdx = (safePage - 1) * pageSize
  const endIdx = startIdx + pageSize
  const visibleDealers = dealersToShow.slice(startIdx, endIdx)
  const hasActiveFilters = filters.state || filters.dealerType

  const pageItems = useMemo(() => {
    const pages = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i += 1) pages.push(i)
      return pages
    }

    const windowStart = Math.max(2, safePage - 1)
    const windowEnd = Math.min(totalPages - 1, safePage + 1)
    pages.push(1)
    if (windowStart > 2) pages.push('...')
    for (let i = windowStart; i <= windowEnd; i += 1) pages.push(i)
    if (windowEnd < totalPages - 1) pages.push('...')
    pages.push(totalPages)
    return pages
  }, [safePage, totalPages])

  return (
    <div className="space-y-4 text-xs">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[16px] sm:text-[18px] font-semibold text-gray-900">Dealer Search</h1>
          <p className="text-[11px] text-gray-500 mt-1">Find and analyze dealers across your market</p>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full font-semibold">
            Showing {dealersToShow.length ? startIdx + 1 : 0}-{Math.min(endIdx, dealersToShow.length)} of {dealersToShow.length} dealers
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Search by dealer name, city, or ID..."
            onSearch={handleSearch}
            loading={loading}
            suggestions={suggestions}
            onSelect={handleSelectDealer}
            size="compact"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all duration-200 ${
              showFilters || hasActiveFilters
                ? 'bg-primary-50 text-primary-600 border-2 border-primary-200'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                {(filters.state ? 1 : 0) + (filters.dealerType ? 1 : 0)}
              </span>
            )}
          </button>
          
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'grid' 
                  ? 'bg-white shadow-sm text-primary-600' 
                  : 'hover:bg-gray-200 text-gray-500'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'list' 
                  ? 'bg-white shadow-sm text-primary-600' 
                  : 'hover:bg-gray-200 text-gray-500'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-lg animate-fade-in-down">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold text-gray-900">Filters</h3>
            </div>
            <button 
              onClick={() => setShowFilters(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">State</label>
              <select
                value={filters.state}
                onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                className="select-field"
              >
                <option value="">All States</option>
                {stateOptions.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Dealer Type</label>
              <select
                value={filters.dealerType}
                onChange={(e) => setFilters({ ...filters, dealerType: e.target.value })}
                className="select-field"
              >
                <option value="">All Types</option>
                {dealerTypeOptions.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-3">
              <button 
                onClick={handleResetFilters} 
                className="flex-1 btn-secondary py-2"
              >
                Reset
              </button>
              <button 
                onClick={handleApplyFilters} 
                className="flex-1 btn-primary py-2"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 animate-fade-in">
          <p className="text-rose-700 font-medium">{error}</p>
        </div>
      )}

      {/* Results Grid/List */}
      {!loading && dealersToShow.length > 0 && (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
          : 'space-y-3'
        }>
          {visibleDealers.map((dealer, index) => (
            <div
              key={`${dealer.mc_dealer_id}_${dealer.mc_location_id}`}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <DealerCard
                dealer={dealer}
                onClick={handleSelectDealer}
                showStats={viewMode === 'grid'}
                compact
              />
            </div>
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[11px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            disabled={safePage === 1}
          >
            Prev
          </button>
          <div className="flex items-center gap-1">
            {pageItems.map((item, idx) => (
              item === '...'
                ? <span key={`ellipsis-${idx}`} className="px-2 text-[11px] text-gray-400">...</span>
                : (
                  <button
                    key={`page-${item}`}
                    onClick={() => setCurrentPage(item)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                      item === safePage
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {item}
                  </button>
                )
            ))}
          </div>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[11px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            disabled={safePage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && dealersToShow.length === 0 && (
        <EmptyState
          icon={MapPin}
          title="No dealers found"
          description="Try adjusting your search or filters to find dealers"
          action={handleResetFilters}
          actionLabel="Reset Filters"
        />
      )}
    </div>
  )
}

export default DealerSearch
