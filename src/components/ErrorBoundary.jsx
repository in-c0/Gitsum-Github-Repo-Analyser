import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[gitsum] render error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-state" role="alert">
          <h2>This page hit an unexpected error.</h2>
          <p>Reload to try again. If it keeps happening, open an issue on GitHub with the repository you were viewing.</p>
          <div className="error-actions">
            <button type="button" className="btn-secondary" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
