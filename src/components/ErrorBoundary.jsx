import { Component } from 'react'

// Catches render-time errors anywhere below it so a single bad component
// shows a friendly message instead of a blank white screen.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
          <div className="max-w-sm">
            <div className="text-5xl mb-3">🐉</div>
            <h1 className="text-xl font-bold text-gold mb-2">Something went wrong</h1>
            <p className="text-muted text-sm mb-4">
              A spell misfired. Try reloading the page — your data is safe in the cloud.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-gold text-ink font-semibold px-4 py-2"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
