import api from './api'

export const dealerService = {
  // Search dealers by name or ID
  searchDealers: async (query, limit = 10) => {
    // Log the outgoing request for debugging in development
    try {
      const url = `${api.defaults.baseURL || ''}/search/dealers?q=${encodeURIComponent(query)}&limit=${limit}`
      console.debug('[dealerService] GET', url)
    } catch (e) {
      // ignore
    }
    const response = await api.get('/search/dealers', {
      params: { q: query, limit }
    })
    console.debug('[dealerService] response', response?.data?.length)
    return response.data
  },

  // Get dealer makes and models
  getDealerMakesModels: async (dealerId, rooftopId) => {
    const response = await api.get('/dealer/makes_models', {
      params: { dealer_id: dealerId, rooftop_id: rooftopId }
    })
    return response.data
  },

  // Get dealer KPIs
  getDealerKPIs: async (dealerId, rooftopId) => {
    const response = await api.get('/dealer/kpis', {
      params: { dealer_id: dealerId, rooftop_id: rooftopId }
    })
    return response.data
  },

  // Get filtered dealer analytics
  getDealerAnalytics: async (dealerId, rooftopId, filters = {}) => {
    const response = await api.get('/dealer/filtered_analytics', {
      params: { 
        dealer_id: dealerId, 
        rooftop_id: rooftopId,
        ...filters
      }
    })
    return response.data
  },

  // Get comprehensive dealer analytics
  getFullDealerAnalytics: async () => {
    const response = await api.get('/dealer_analytics')
    return response.data
  },
}

export default dealerService
