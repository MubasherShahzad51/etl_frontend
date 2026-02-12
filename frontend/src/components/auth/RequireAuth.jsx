import { Navigate, useLocation } from 'react-router-dom'

const FIXED_USERNAME = 'competitor_admin'
const FIXED_PASSWORD = 's7t6u5v4'

const RequireAuth = ({ children }) => {
  const location = useLocation()

  const apiUrl = typeof window !== 'undefined' ? window.localStorage.getItem('api_url') : null
  const username = typeof window !== 'undefined' ? window.localStorage.getItem('api_user') : null
  const password = typeof window !== 'undefined' ? window.localStorage.getItem('api_password') : null

  const isAuthed = Boolean(
    apiUrl &&
    String(username || '').trim() === FIXED_USERNAME &&
    String(password || '') === FIXED_PASSWORD
  )

  if (!isAuthed) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default RequireAuth
