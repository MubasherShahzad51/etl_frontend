import { useState } from 'react'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'

const FilterPanel = ({ filters, onApply, onReset, isOpen, onToggle }) => {
  const [localFilters, setLocalFilters] = useState(filters)
  const [expanded, setExpanded] = useState({})

  const handleChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleApply = () => {
    onApply(localFilters)
  }

  const handleReset = () => {
    const resetFilters = Object.keys(localFilters).reduce((acc, key) => {
      acc[key] = Array.isArray(localFilters[key]) ? [] : ''
      return acc
    }, {})
    setLocalFilters(resetFilters)
    onReset?.()
  }

  const toggleSection = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${isOpen ? '' : 'hidden'}`}>
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-900">Filters</span>
        </div>
        <button onClick={onToggle} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        {/* State Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <select
            value={localFilters.state || ''}
            onChange={(e) => handleChange('state', e.target.value)}
            className="select-field"
          >
            <option value="">All States</option>
            <option value="CA">California</option>
            <option value="TX">Texas</option>
            <option value="FL">Florida</option>
            <option value="NY">New York</option>
            <option value="LA">Louisiana</option>
          </select>
        </div>

        {/* Dealer Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dealer Type</label>
          <select
            value={localFilters.dealerType || ''}
            onChange={(e) => handleChange('dealerType', e.target.value)}
            className="select-field"
          >
            <option value="">All Types</option>
            <option value="OEM">OEM</option>
            <option value="Independent">Independent</option>
            <option value="Aggregator">Aggregator</option>
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <select
            value={localFilters.dateRange || 'last_30_days'}
            onChange={(e) => handleChange('dateRange', e.target.value)}
            className="select-field"
          >
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="last_90_days">Last 90 Days</option>
            <option value="last_year">Last Year</option>
          </select>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-gray-200 flex gap-2">
        <button onClick={handleReset} className="btn-secondary flex-1">
          Reset
        </button>
        <button onClick={handleApply} className="btn-primary flex-1">
          Apply
        </button>
      </div>
    </div>
  )
}

export default FilterPanel
