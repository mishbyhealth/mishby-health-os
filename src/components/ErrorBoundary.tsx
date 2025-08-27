import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: any; info?: any };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: undefined, info: undefined };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    this.setState({ info });
    console.error("App crashed:", error, info);
  }
  render() {
    if (this.state.hasError) {
      const msg =
        this.state.error?.message ||
        (typeof this.state.error === "string" ? this.state.error : String(this.state.error));
      const stack = this.state.error?.stack || "";
      const comp = this.state.info?.componentStack || "";
      return (
        <div style={{ padding: 16 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 6 }}>App crashed</h2>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{msg || "Unknown error"}</div>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, opacity: 0.9, marginBottom: 8 }}>
            {stack}
          </pre>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, opacity: 0.7 }}>
            {comp}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
