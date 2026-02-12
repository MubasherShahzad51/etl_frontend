import { useState } from 'react'
import { 
  Target, 
  Filter, 
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Search,
  X,
  Sparkles
} from 'lucide-react'
import { DataTable } from '../components/tables'
import { LoadingSpinner, Badge, EmptyState } from '../components/common'
import { formatNumber, formatCurrency, formatDate, formatPercentage } from '../utils'

// Mock attribution data
const mockAttributions = [
  {
    id: 1,
    vin: '1GCHK23G248148657',
    attribution_date: '2025-02-01',
    winning_dealer_id: '1002806',
    winning_dealer_name: 'All Star Chevrolet',
    final_score: 95.5,
    attribution_level: 'EXACT_MATCH',
    confidence_score: 95,
    make: 'Chevrolet',
    model: 'Silverado',
    year: 2024,
    price: 48500,
    competing_dealers_count: 12,
  },
  {
    id: 2,
    vin: '2FMPK4J91MBA12345',
    attribution_date: '2025-02-01',
    winning_dealer_id: '1003456',
    winning_dealer_name: 'Capitol City Ford',
    final_score: 87.3,
    attribution_level: 'HIGH_CONFIDENCE',
    confidence_score: 87,
    make: 'Ford',
    model: 'Explorer',
    year: 2024,
    price: 52000,
    competing_dealers_count: 8,
  },
  {
    id: 3,
    vin: '5TFBY5F10NX123456',
    attribution_date: '2025-01-31',
    winning_dealer_id: '1004567',
    winning_dealer_name: 'Southern Toyota',
    final_score: 78.9,
    attribution_level: 'MEDIUM_CONFIDENCE',
    confidence_score: 79,
    make: 'Toyota',
    model: 'Tundra',
    year: 2024,
    price: 45000,
    competing_dealers_count: 15,
  },
  {
    id: 4,
    vin: '1HGCV1F34NA789012',
    attribution_date: '2025-01-31',
    winning_dealer_id: '1005678',
    winning_dealer_name: 'Metro Honda',
    final_score: 92.1,
    attribution_level: 'EXACT_MATCH',
    confidence_score: 92,
    make: 'Honda',
    model: 'Accord',
    year: 2024,
    price: 32000,
    competing_dealers_count: 6,
  },
  {
    id: 5,
    vin: '1G1YY22G455678901',
    attribution_date: '2025-01-30',
    winning_dealer_id: '1002806',
    winning_dealer_name: 'All Star Chevrolet',
    final_score: 65.4,
    attribution_level: 'LOW_CONFIDENCE',
    confidence_score: 65,
    make: 'Chevrolet',
    model: 'Corvette',
    year: 2024,
    price: 68000,
    competing_dealers_count: 20,
  },
  {
    id: 6,
    vin: '3GNKBKRS9NS234567',
    attribution_date: '2025-01-30',
    winning_dealer_id: '1002268',
    winning_dealer_name: 'Ganley Chevrolet',
    final_score: 88.7,
    attribution_level: 'HIGH_CONFIDENCE',
    confidence_score: 89,
    make: 'Chevrolet',
    model: 'Traverse',
    year: 2024,
    price: 42000,
    competing_dealers_count: 10,
  },
]

const Attribution = () => {
  const [loading] = useState(false)
  const [attributions] = useState(mockAttributions)
  const [filters, setFilters] = useState({
    dateRange: 'last_30_days',
    confidenceLevel: '',
    dealer: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  const getConfidenceBadge = (level) => {
    const badges = {
      'EXACT_MATCH': { label: 'Exact Match', color: 'green' },
      'HIGH_CONFIDENCE': { label: 'High', color: 'blue' },
      'MEDIUM_CONFIDENCE': { label: 'Medium', color: 'yellow' },
      'LOW_CONFIDENCE': { label: 'Low', color: 'red' },
    }
    const badge = badges[level] || { label: level, color: 'gray' }
    return <Badge label={badge.label} color={badge.color} dot />
  }

  const columns = [
    { 
      key: 'vin', 
      label: 'VIN', 
      sortable: true,
      render: (value) => (
        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{value.slice(0, 10)}...</span>
      )
    },
    { 
      key: 'attribution_date', 
      label: 'Date', 
      sortable: true,
      render: (value) => formatDate(value)
    },
    { 
      key: 'make', 
      label: 'Vehicle', 
      sortable: true,
      render: (_, row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.year} {row.make}</p>
          <p className="text-sm text-gray-500">{row.model}</p>
        </div>
      )
    },
    { 
      key: 'price', 
      label: 'Price', 
      sortable: true,
      render: (value) => <span className="font-semibold">{formatCurrency(value)}</span>
    },
    { 
      key: 'winning_dealer_name', 
      label: 'Attributed Dealer', 
      sortable: true,
      render: (value) => <span className="font-medium text-primary-600">{value}</span>
    },
    { 
      key: 'final_score', 
      label: 'Score', 
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-3">
          <div className="w-20 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                value >= 90 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 
                value >= 70 ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 
                value >= 50 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 
                'bg-gradient-to-r from-rose-500 to-rose-400'
              }`}
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-sm font-bold text-gray-900 w-12">{value.toFixed(1)}</span>
        </div>
      )
    },
    { 
      key: 'attribution_level', 
      label: 'Confidence', 
      sortable: true,
      render: (value) => getConfidenceBadge(value)
    },
    { 
      key: 'competing_dealers_count', 
      label: 'Competitors', 
      sortable: true,
      render: (value) => (
        <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-sm font-medium">{value}</span>
      )
    },
  ]

  const stats = {
    total: attributions.length,
    exactMatch: attributions.filter(a => a.attribution_level === 'EXACT_MATCH').length,
    highConfidence: attributions.filter(a => a.attribution_level === 'HIGH_CONFIDENCE').length,
    avgScore: attributions.length > 0 
      ? (attributions.reduce((sum, a) => sum + a.final_score, 0) / attributions.length).toFixed(1)
      : 0,
  }

  const handleExport = () => {
    const headers = ['VIN', 'Date', 'Make', 'Model', 'Year', 'Price', 'Dealer', 'Score', 'Confidence']
    const rows = attributions.map(a => [
      a.vin, a.attribution_date, a.make, a.model, a.year, a.price,
      a.winning_dealer_name, a.final_score, a.attribution_level
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'attributions.csv'
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-rose-500 rounded-2xl p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Target className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Vehicle Attribution</h1>
              <p className="text-white/80">Track and analyze sold vehicle attributions</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-5 py-2.5 bg-white/20 backdrop-blur-sm rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button
              onClick={handleExport}
              className="px-5 py-2.5 bg-white text-rose-600 rounded-xl font-semibold hover:bg-white/90 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Attributions', value: stats.total, icon: Target, color: 'blue', bg: 'bg-blue-100' },
          { label: 'Exact Matches', value: stats.exactMatch, icon: CheckCircle, color: 'emerald', bg: 'bg-emerald-100' },
          { label: 'High Confidence', value: stats.highConfidence, icon: Sparkles, color: 'purple', bg: 'bg-purple-100' },
          { label: 'Avg Score', value: stats.avgScore, icon: TrendingUp, color: 'orange', bg: 'bg-orange-100' },
        ].map((stat, index) => (
          <div 
            key={stat.label}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg animate-fade-in-down">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <h3 className="font-bold text-gray-900">Filters</h3>
            </div>
            <button 
              onClick={() => setShowFilters(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="label">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="select-field"
              >
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="last_90_days">Last 90 Days</option>
                <option value="last_year">Last Year</option>
              </select>
            </div>
            <div>
              <label className="label">Confidence Level</label>
              <select
                value={filters.confidenceLevel}
                onChange={(e) => setFilters({ ...filters, confidenceLevel: e.target.value })}
                className="select-field"
              >
                <option value="">All Levels</option>
                <option value="EXACT_MATCH">Exact Match</option>
                <option value="HIGH_CONFIDENCE">High Confidence</option>
                <option value="MEDIUM_CONFIDENCE">Medium Confidence</option>
                <option value="LOW_CONFIDENCE">Low Confidence</option>
              </select>
            </div>
            <div>
              <label className="label">Dealer</label>
              <select
                value={filters.dealer}
                onChange={(e) => setFilters({ ...filters, dealer: e.target.value })}
                className="select-field"
              >
                <option value="">All Dealers</option>
                <option value="1002806">All Star Chevrolet</option>
                <option value="1003456">Capitol City Ford</option>
                <option value="1004567">Southern Toyota</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Attribution Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : attributions.length > 0 ? (
        <DataTable
          columns={columns}
          data={attributions}
          sortable={true}
          paginated={true}
          pageSize={10}
        />
      ) : (
        <EmptyState
          icon={Target}
          title="No attributions found"
          description="Try adjusting your filters to see attribution records"
        />
      )}
    </div>
  )
}

export default Attribution
