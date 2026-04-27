import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Unknown frontend error"
    };
  }

  componentDidCatch(error) {
    console.error("Frontend render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
          <h1>Frontend Error</h1>
          <p>{this.state.message}</p>
          <p>Please refresh after the fix or clear browser local storage for this app.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
