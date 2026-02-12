import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BarChart3, Eye, EyeOff, Globe, Lock, User } from 'lucide-react'

const FIXED_USERNAME = 'competitor_admin'
const FIXED_PASSWORD = 's7t6u5v4'

const isHttpUrl = (value) => {
  try {
    const u = new URL(String(value || ''))
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

const normalizeApiUrl = (value) => {
  const v = String(value || '').trim()
  if (!v) return ''
  if (!isHttpUrl(v)) return v
  try {
    const u = new URL(v)
    return `${u.protocol}//${u.host}`
  } catch {
    return v.replace(/\/+$/, '')
  }
}

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = useMemo(() => {
    const from = location.state?.from?.pathname
    return typeof from === 'string' && from.length ? from : '/'
  }, [location.state])

  const [apiUrl, setApiUrl] = useState('')
  const [username, setUsername] = useState(FIXED_USERNAME)
  const [password, setPassword] = useState(FIXED_PASSWORD)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [allowApiUrlEdit, setAllowApiUrlEdit] = useState(false)

  useEffect(() => {
    const savedApiUrl = window.localStorage.getItem('api_url') || ''
    const protocol = window.location?.protocol || 'http:'
    const host = window.location?.hostname || 'localhost'
    const derived = `${protocol}//${host}:8082`

    // If you're accessing from another machine (host is not localhost),
    // never keep a previously saved localhost API URL.
    const savedIsLocalhost = /^https?:\/\/localhost(:\d+)?$/i.test(savedApiUrl)
    const hostIsLocalhost = host === 'localhost' || host === '127.0.0.1'
    setAllowApiUrlEdit(hostIsLocalhost)

    if (!hostIsLocalhost) {
      setApiUrl(derived)
    } else if (savedApiUrl && !savedIsLocalhost) {
      setApiUrl(savedApiUrl)
    } else {
      setApiUrl(savedApiUrl || derived)
    }

    setUsername(FIXED_USERNAME)
    setPassword(FIXED_PASSWORD)
  }, [])

  const onSubmit = (e) => {
    e.preventDefault()
    setError('')

    const normalized = normalizeApiUrl(apiUrl)

    if (!normalized || !isHttpUrl(normalized)) {
      setError('Please enter a valid API URL (http/https).')
      return
    }
    const run = async () => {
      try {
        const credentials = btoa(`${FIXED_USERNAME}:${FIXED_PASSWORD}`)
        const res = await fetch(`${normalized}/dashboard/kpis?scope=USA&time_range=30d`, {
          headers: {
            Authorization: `Basic ${credentials}`,
          },
        })

        if (!res.ok) {
          setError(`API check failed (HTTP ${res.status}). Use backend URL like http://<server>:8082 (do not include /docs). If 401: backend auth rejected. If 404: wrong base URL/port. If 0: backend not reachable.`)
          return
        }

        const contentType = res.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) {
          setError('Invalid API response (expected JSON). Make sure API URL points to FastAPI backend like http://<server>:8082')
          return
        }

        const data = await res.json().catch(() => null)
        if (!data || data.success !== true) {
          setError('API check returned unexpected payload. Make sure API URL points to FastAPI backend like http://<server>:8082')
          return
        }

        window.localStorage.setItem('api_url', normalized)
        window.localStorage.setItem('api_user', FIXED_USERNAME)
        window.localStorage.setItem('api_password', FIXED_PASSWORD)

        navigate(redirectTo, { replace: true })
      } catch (err) {
        setError('API request failed (network error). Backend not reachable. Check that the backend is running and port 8082 is open.')
      }
    }

    run()
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-indigo-50/40 to-white flex items-center justify-center px-4 py-10">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,0.16),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.16),transparent_45%)]" />
        <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="absolute -top-48 -right-48 w-[620px] h-[620px] bg-indigo-200/35 rounded-full blur-3xl" />
        <div className="absolute -bottom-52 -left-52 w-[680px] h-[680px] bg-purple-200/30 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 ring-1 ring-white/50">
            <BarChart3 className="w-7 h-7" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Adcertify Automotive Analysis</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to access your dashboard</p>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white/90 backdrop-blur-xl shadow-2xl shadow-slate-300/40 ring-1 ring-white/60">
          <div className="p-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> API URL
                </label>
                <input
                  value={apiUrl}
                  readOnly={!allowApiUrlEdit}
                  onChange={allowApiUrlEdit ? (e) => setApiUrl(e.target.value) : undefined}
                  placeholder="Auto-detected"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                  <User className="w-4 h-4" /> Username
                </label>
                <input
                  value={username}
                  readOnly
                  placeholder="Enter your username"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Password
                </label>
                <div className="mt-2 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    readOnly
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-slate-50 text-slate-500"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-xl shadow-indigo-500/25 hover:opacity-95 transition active:scale-[0.99] ring-1 ring-indigo-700/20"
              >
                Sign In →
              </button>

              <div className="pt-2">
                <div className="flex items-start gap-2 text-[11px] text-slate-500">
                  <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <p>
                    Your credentials are stored in your browser session and cleared when you log out.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-slate-400">
          Dashboard v1.0 · Built with React
        </div>
      </div>
    </div>
  )
}

export default Login
