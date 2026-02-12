import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ErrorBoundary from './components/common/ErrorBoundary'
import Dashboard from './pages/Dashboard'
import DealerSearch from './pages/DealerSearch'
import DealerAnalytics from './pages/DealerAnalytics'
import CompetitorAnalysis from './pages/CompetitorAnalysis'
import Attribution from './pages/Attribution'
import Reports from './pages/Reports'
import SalesMap from './pages/SalesMap'
import TrendAnalysis from './pages/TrendAnalysis'
import AIInsights from './pages/AIInsights'
import NotFound from './pages/NotFound'
import InventoryAnalysis from './pages/InventoryAnalysis'
import Login from './pages/Login'
import RequireAuth from './components/auth/RequireAuth'

function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/dealers" element={<RequireAuth><DealerSearch /></RequireAuth>} />
          <Route path="/dealer/:dealerId/:rooftopId" element={<RequireAuth><DealerAnalytics /></RequireAuth>} />
          <Route path="/dealer/:dealerId/:rooftopId/competitors" element={<RequireAuth><CompetitorAnalysis /></RequireAuth>} />
          <Route path="/sales-map" element={<RequireAuth><SalesMap /></RequireAuth>} />
          <Route path="/trend-analysis" element={<RequireAuth><TrendAnalysis /></RequireAuth>} />
          <Route path="/ai-insights" element={<RequireAuth><AIInsights /></RequireAuth>} />
          <Route path="/attribution" element={<RequireAuth><Attribution /></RequireAuth>} />
          <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
          <Route path="/inventory-analysis" element={<RequireAuth><InventoryAnalysis /></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  )
}

export default App
