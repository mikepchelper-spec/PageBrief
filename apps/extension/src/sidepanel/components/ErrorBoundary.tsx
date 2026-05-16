import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('PageBrief error boundary:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="m-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <p className="font-semibold">Something broke.</p>
          <p className="mt-1 font-mono text-xs">{this.state.error.message}</p>
          <button
            className="btn-secondary mt-3"
            onClick={() => this.setState({ error: null })}
          >
            Reset
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
