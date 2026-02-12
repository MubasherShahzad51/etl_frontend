import api from './api'

export const attributionService = {
  // Get attributions for a dealer
  getAttributions: async (dealerId, dateRange = 'last_30_days') => {
    const response = await api.get('/attributions', {
      params: { dealer_id: dealerId, date_range: dateRange }
    })
    return response.data
  },

  // Get attribution details by VIN
  getAttributionByVin: async (vin) => {
    const response = await api.get(`/attribution/vin/${vin}`)
    return response.data
  },
}

export default attributionService
