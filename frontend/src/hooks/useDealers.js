import { useState, useCallback } from 'react'
import { dealerService } from '../services'

export const useDealers = () => {
  const [dealers, setDealers] = useState([])
  const [selectedDealer, setSelectedDealer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const searchDealers = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setDealers([])
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const result = await dealerService.searchDealers(query)
      setDealers(result || [])
    } catch (err) {
      setError(err.message)
      setDealers([])
    } finally {
      setLoading(false)
    }
  }, [])

  const selectDealer = useCallback((dealer) => {
    setSelectedDealer(dealer)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedDealer(null)
  }, [])

  return {
    dealers,
    selectedDealer,
    loading,
    error,
    searchDealers,
    selectDealer,
    clearSelection,
  }
}

export default useDealers
