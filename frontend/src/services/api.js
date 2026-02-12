import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8082',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add authentication to all requests
api.interceptors.request.use(
  (config) => {
    const apiUrl = window?.localStorage?.getItem('api_url')
    const username = window?.localStorage?.getItem('api_user') || import.meta.env.VITE_API_USER || 'competitor_admin'
    const password = window?.localStorage?.getItem('api_password') || import.meta.env.VITE_API_PASSWORD || 's7t6u5v4'
    if (apiUrl) config.baseURL = apiUrl
    if (username && password) {
      const credentials = btoa(`${username}:${password}`)
      config.headers.Authorization = `Basic ${credentials}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'An error occurred'
    console.error('API Error:', message)
    return Promise.reject(error)
  }
)

export default api
