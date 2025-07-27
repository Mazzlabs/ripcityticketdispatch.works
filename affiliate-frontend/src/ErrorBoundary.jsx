import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-800 flex items-center justify-center px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-black/50 border border-red-500/30 rounded-lg p-8">
              <h1 className="text-4xl font-bold text-white mb-4">
                <span className="text-red-500">Rip City Gaming</span> - Temporarily Unavailable
              </h1>
              <p className="text-xl text-gray-300 mb-6">
                We're experiencing technical difficulties. Please try refreshing the page.
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors mr-4"
                >
                  Refresh Page
                </button>
                <a
                  href="https://stake.us/?c=RIPCITYTICKETS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-block"
                >
                  Go to Stake.us
                </a>
              </div>
              <div className="mt-8 text-center">
                <p className="text-gray-400 text-sm">Use promo code: <span className="text-red-400 font-mono">RIPCITYTICKETS</span></p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;