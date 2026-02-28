'use client';

import React from 'react';

type FallbackProps = {
  error: Error;
  resetErrorBoundary: () => void;
};

type Props = {
  children: React.ReactNode;
  /** Static fallback element. Ignored if `fallbackRender` is provided. */
  fallback?: React.ReactNode;
  /** Render-prop fallback — receives the error and a reset function. */
  fallbackRender?: (props: FallbackProps) => React.ReactNode;
  /** Called when the boundary resets (e.g. on "Try again"). */
  onReset?: () => void;
  /** Called when an error is caught. */
  onError?: (error: Error, info: React.ErrorInfo) => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info);
  }

  resetErrorBoundary = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallbackRender) {
        return this.props.fallbackRender({
          error: this.state.error,
          resetErrorBoundary: this.resetErrorBoundary,
        });
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <DefaultFallback error={this.state.error} resetErrorBoundary={this.resetErrorBoundary} />;
    }

    return this.props.children;
  }
}

function DefaultFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-3">
        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>
      <h2 className="text-sm font-medium text-gray-900 mb-1">Something went wrong</h2>
      <p className="text-xs text-gray-500 mb-4 max-w-sm text-center">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-md hover:bg-hover transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
