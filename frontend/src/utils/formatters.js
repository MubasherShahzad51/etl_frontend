// Format number with commas
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '-'
  return new Intl.NumberFormat('en-US').format(num)
}

// Format currency
export const formatCurrency = (num) => {
  if (num === null || num === undefined) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

// Format percentage
export const formatPercentage = (num, decimals = 1) => {
  if (num === null || num === undefined) return '-'
  return `${num.toFixed(decimals)}%`
}

// Format date
export const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Format distance
export const formatDistance = (miles) => {
  if (miles === null || miles === undefined) return '-'
  return `${miles.toFixed(1)} mi`
}

// Truncate text
export const truncateText = (text, maxLength = 30) => {
  if (!text) return ''
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
}

// Format trend value with sign
export const formatTrend = (value) => {
  if (value === null || value === undefined) return '-'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}
