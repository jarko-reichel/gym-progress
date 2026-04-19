import { Component, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    // eslint-disable-next-line no-console
    console.error('App error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="m-4 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-100">
          <h2 className="mb-2 text-lg font-semibold">Niečo sa pokazilo</h2>
          <p className="mb-3 text-sm">{this.state.error.message}</p>
          <button className="btn-primary" onClick={() => location.reload()}>
            Obnoviť aplikáciu
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
