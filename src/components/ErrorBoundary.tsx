// src/components/ErrorBoundary.tsx
import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: any; info?: any };

const CRASH_KEY = "glowell:last-crash";

function buildCrashDetails(error?: any, info?: any) {
  const details = [
    "[GloWell Crash Report]",
    `Time: ${new Date().toISOString()}`,
    error ? `Error: ${String(error)}` : "",
    error?.stack ? `Stack:\n${error.stack}` : "",
    info?.componentStack ? `Component Stack:\n${info.componentStack}` : "",
    `UserAgent: ${navigator.userAgent}`,
    `URL: ${location.href}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  return details;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    // Persist last crash so we can show a tiny banner next boot
    try {
      const details = buildCrashDetails(error, info);
      window.localStorage.setItem(CRASH_KEY, details);
    } catch {}
    this.setState({ info });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, info: undefined });
    window.location.reload();
  };

  enableSafeMode = () => {
    try {
      window.localStorage.setItem("glowell:safe-boot", "true");
    } catch {}
    if (!window.location.hash.includes("safe")) {
      window.location.hash = "#safe";
    }
    window.location.reload();
  };

  copyError = async () => {
    const details = buildCrashDetails(this.state.error, this.state.info);
    try {
      await navigator.clipboard.writeText(details);
      alert("Crash details copied. You can paste them here in chat.");
    } catch {
      console.log(details);
      alert("Could not copy automatically. Details printed to console.");
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    // Minimal inline styles to avoid any broken CSS
    const box: React.CSSProperties = {
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      padding: "24px",
      maxWidth: 900,
      margin: "40px auto",
      borderRadius: 14,
      boxShadow: "0 10px 24px rgba(0,0,0,0.1)",
      background: "#fff",
      color: "#111",
      lineHeight: 1.5,
    };
    const h1: React.CSSProperties = { margin: "0 0 12px 0", fontSize: 24 };
    const pre: React.CSSProperties = {
      background: "#f6f8fa",
      padding: 12,
      borderRadius: 10,
      overflow: "auto",
      maxHeight: 260,
      fontSize: 12,
    };
    const row: React.CSSProperties = { display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" };
    const btn: React.CSSProperties = {
      padding: "10px 14px",
      borderRadius: 10,
      border: "1px solid #d0d7de",
      background: "#f6f8fa",
      cursor: "pointer",
    };

    return (
      <div style={box}>
        <h1 style={h1}>Something went wrong — but you’re safe.</h1>
        <p>
          GloWell caught a crash and paused rendering. You can try a quick retry or
          enter <b>Safe Mode</b> which boots a minimal shell so you can keep working.
        </p>

        <div style={row}>
          <button style={btn} onClick={this.handleRetry}>🔁 Retry</button>
          <button style={btn} onClick={this.enableSafeMode}>🛟 Enter Safe Mode</button>
          <button style={btn} onClick={this.copyError}>📋 Copy error details</button>
        </div>

        <h3 style={{ marginTop: 16 }}>Error</h3>
        <pre style={pre}>{String(this.state.error ?? "Unknown error")}</pre>

        {this.state.error?.stack && (
          <>
            <h3>Stack</h3>
            <pre style={pre}>{this.state.error.stack}</pre>
          </>
        )}

        {this.state.info?.componentStack && (
          <>
            <h3>Component trace</h3>
            <pre style={pre}>{this.state.info.componentStack}</pre>
          </>
        )}
      </div>
    );
  }
}
