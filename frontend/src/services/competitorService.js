import api from './api'

export const competitorService = {
  // Get competitor analysis for a dealer
  getCompetitorAnalysis: async (dealerId, radius = 25, makes = [], models = []) => {
    const params = { 
      dealer_id: dealerId, 
      radius 
    }
    if (makes.length > 0) params.makes = makes.join(',')
    if (models.length > 0) params.models = models.join(',')
    
    const response = await api.get('/competitor_analysis', { params })
    return response.data
  },

  // Get market overview
  getMarketOverview: async (state, dma) => {
    const response = await api.get('/market_overview', {
      params: { state, dma }
    })
    return response.data
  },

  // Get regional analysis
  getRegionalAnalysis: async (region) => {
    const response = await api.get('/regional_analysis', {
      params: { region }
    })
    return response.data
  },
}

export default competitorService
