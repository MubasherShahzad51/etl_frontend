import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo })

    // Keep the console signal strong in dev.
    // eslint-disable-next-line no-console
    console.error('[UI crash]', error, errorInfo)
  }

  render() {
    const { error, errorInfo } = this.state
    if (!error) return this.props.children

    const message = error?.message || String(error)
    const stack = errorInfo?.componentStack || error?.stack || ''

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <div className="text-sm font-semibold">Something crashed while rendering.</div>
              <div className="text-xs text-slate-600 mt-0.5">
                This page shows the error so you don’t get a blank screen.
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="text-xs font-semibold text-slate-700">Error</div>
              <pre className="text-xs whitespace-pre-wrap break-words rounded-lg bg-slate-50 border border-slate-200 p-3 overflow-auto">
                {message}
              </pre>

              {stack ? (
                <>
                  <div className="text-xs font-semibold text-slate-700">Component stack</div>
                  <pre className="text-[11px] whitespace-pre-wrap break-words rounded-lg bg-slate-50 border border-slate-200 p-3 overflow-auto max-h-[40vh]">
                    {stack}
                  </pre>
                </>
              ) : null}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="text-xs font-semibold rounded-lg bg-indigo-600 text-white px-3 py-2 hover:bg-indigo-700"
                >
                  Reload
                </button>
                <button
                  type="button"
                  onClick={() => this.setState({ error: null, errorInfo: null })}
                  className="text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 px-3 py-2 hover:bg-slate-50"
                >
                  Try again
                </button>
              </div>

              <div className="text-xs text-slate-500">
                Also check DevTools Console for the full stack trace.
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
