import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { 
  FileBarChart, 
  Map, 
  TrendingUp, 
  Users, 
  Download,
  Calendar,
  Building2,
  ChevronRight
} from 'lucide-react'
import { Card, Badge, LoadingSpinner } from '../components/common'
import DashboardTable from '../components/common/DashboardTable'
import { SalesTrendChart, MakeDistributionChart, SegmentBarChart } from '../components/charts'

// Mock data
const mockRegionalData = [
  { month: 'Jan', sales: 12500 },
  { month: 'Feb', sales: 11800 },
  { month: 'Mar', sales: 14200 },
  { month: 'Apr', sales: 13900 },
  { month: 'May', sales: 15600 },
  { month: 'Jun', sales: 16800 },
]

const mockMakeData = [
  { name: 'Chevrolet', value: 8500 },
  { name: 'Ford', value: 7200 },
  { name: 'Toyota', value: 6800 },
  { name: 'Honda', value: 5400 },
  { name: 'GMC', value: 4200 },
]

const mockSegmentData = [
  { name: 'Truck', value: 12000 },
  { name: 'SUV', value: 10500 },
  { name: 'Sedan', value: 8200 },
  { name: 'Coupe', value: 3500 },
  { name: 'Van', value: 2800 },
]

const reportTypes = [
  {
    id: 'regional',
    title: 'Regional Market Overview',
    description: 'Comprehensive analysis of market performance by state or DMA',
    icon: Map,
    color: 'bg-blue-500',
  },
  {
    id: 'make-model',
    title: 'Make/Model Analysis',
    description: 'Deep dive into make and model performance across regions',
    icon: TrendingUp,
    color: 'bg-green-500',
  },
  {
    id: 'benchmark',
    title: 'Dealer Benchmarking',
    description: 'Compare dealers side-by-side on key performance metrics',
    icon: Users,
    color: 'bg-purple-500',
  },
]

const Reports = () => {
  const location = useLocation()

  const initialFilters = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const state = params.get('state')?.toUpperCase() || 'LA'
    const dateRange = params.get('dateRange') || 'last_30_days'
    return { state, dateRange }
  }, [location.search])

  const [selectedReport, setSelectedReport] = useState('regional')
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    state: initialFilters.state,
    dateRange: initialFilters.dateRange,
  })

  const handleGenerateReport = () => {
    setLoading(true)
    // Simulate report generation
    setTimeout(() => {
      setLoading(false)
    }, 1500)
  }

  const handleExport = (format) => {
    alert(`Exporting report as ${format}...`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market Reports</h1>
          <p className="text-gray-500 mt-1">Generate and analyze market intelligence reports</p>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportTypes.map((report) => (
          <button
            key={report.id}
            onClick={() => setSelectedReport(report.id)}
            className={`p-5 rounded-xl border-2 text-left transition-all ${
              selectedReport === report.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${report.color}`}>
                <report.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{report.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{report.description}</p>
              </div>
              {selectedReport === report.id && (
                <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                  <ChevronRight className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State/Region</label>
            <select
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
              className="select-field"
            >
              <option value="LA">Louisiana</option>
              <option value="TX">Texas</option>
              <option value="FL">Florida</option>
              <option value="CA">California</option>
              <option value="NY">New York</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="select-field"
            >
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_90_days">Last 90 Days</option>
              <option value="last_year">Last Year</option>
              <option value="ytd">Year to Date</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select className="select-field">
              <option value="interactive">Interactive Dashboard</option>
              <option value="pdf">PDF Report</option>
              <option value="excel">Excel Export</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <FileBarChart className="w-4 h-4" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Total Dealers</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">245</p>
            <p className="text-xs text-green-600 mt-1">+12% vs last period</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Total Sales</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">84,500</p>
            <p className="text-xs text-green-600 mt-1">+8% vs last period</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Avg Inventory</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">125</p>
            <p className="text-xs text-red-600 mt-1">-3% vs last period</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Market Coverage</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">92%</p>
            <p className="text-xs text-green-600 mt-1">+2% vs last period</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SalesTrendChart 
            data={mockRegionalData.map(d => ({ ...d, inventory: Math.round(d.sales * 0.02) }))} 
            title="Regional Sales Trend" 
            xKey="month"
          />
          <MakeDistributionChart data={mockMakeData} title="Sales by Make" />
        </div>

        <SegmentBarChart data={mockSegmentData} title="Sales by Vehicle Segment" />

        {/* Top Dealers Table */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Dealers</h3>
            <button
              onClick={() => handleExport('CSV')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
          <DashboardTable
            maxHeight={220}
            columns={[
              { key: 'rank', title: 'Rank', render: (_, i) => i + 1, className: 'w-12' },
              { key: 'dealer', title: 'Dealer', render: r => <div className="font-medium">{r.dealer}</div> },
              { key: 'location', title: 'Location' },
              { key: 'sales', title: 'Sales', className: 'text-right' },
              { key: 'inv', title: 'Inventory', className: 'text-right' },
              { key: 'share', title: 'Market Share', className: 'text-right' },
            ]}
            rows={[
              { dealer: 'All Star Chevrolet', location: 'Baton Rouge, LA', sales: '5,200', inv: '156', share: <Badge label="12.5%" color="green" /> },
              { dealer: 'Elite Ford of Texas', location: 'Houston, TX', sales: '4,800', inv: '142', share: <Badge label="11.2%" color="green" /> },
              { dealer: 'Bay Area Honda', location: 'Oakland, CA', sales: '4,350', inv: '128', share: <Badge label="10.4%" color="blue" /> },
              { dealer: 'Southern Toyota', location: 'Miami, FL', sales: '3,980', inv: '115', share: <Badge label="9.5%" color="blue" /> },
              { dealer: 'Ganley Chevrolet', location: 'Aurora, OH', sales: '3,650', inv: '98', share: <Badge label="8.7%" color="blue" /> },
            ]}
          />
        </div>
      </div>
    </div>
  )
}

export default Reports
