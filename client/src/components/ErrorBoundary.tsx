import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <p className="text-4xl">⚠️</p>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Something went wrong</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="px-4 py-2 bg-[#0b6e4f] text-white rounded-lg text-sm hover:bg-[#085a3f] transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
