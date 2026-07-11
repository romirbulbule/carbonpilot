import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('CarbonPilot crashed:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <AlertTriangle size={32} className="mb-4 text-amber-400" />
        <h1 className="mb-2 text-lg font-semibold text-slate-100">Something went wrong</h1>
        <p className="mb-1 text-sm text-slate-400">
          CarbonPilot hit an unexpected error. Your run history and settings are safe — a reload should fix it.
        </p>
        <p className="mb-6 max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-900/60 px-3 py-2 text-left text-xs text-slate-600">
          {this.state.error?.message || String(this.state.error)}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
        >
          <RotateCcw size={14} />
          Reload
        </button>
      </div>
    )
  }
}
