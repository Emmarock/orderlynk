import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Catches render/commit/effect errors anywhere below it so a single bad callback
 * (e.g. "n is not a function") no longer white-screens the whole app. On catch it
 * logs the error together with the React component stack — which names the actual
 * component that threw, even in a production build — under a grep-able [ErrorBoundary] tag.
 */
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] caught:', error.message)
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] stack:', error.stack)
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] componentStack:', info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>Something went wrong.</h1>
          <p style={{ marginTop: 8, color: '#666' }}>
            The page hit an unexpected error. Check the browser console for details
            (look for the <code>[ErrorBoundary]</code> logs).
          </p>
          <button
            style={{ marginTop: 16, padding: '8px 16px', cursor: 'pointer' }}
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
