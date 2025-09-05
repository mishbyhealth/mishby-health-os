import React from "react";

type Props = {
  children: React.ReactNode;
  name?: string; // optional label to identify which part failed
};
type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // keep last error in memory for quick debug
    try {
      const payload = {
        name: this.props.name ?? "ErrorBoundary",
        error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
        info: info.componentStack,
        at: new Date().toISOString(),
      };
      localStorage.setItem("glowell:lastError", JSON.stringify(payload));
      // eslint-disable-next-line no-console
      console.error("[GloWell ErrorBoundary]", payload);
    } catch {
      // ignore
    }
  }

  private reload = () => {
    this.setState({ hasError: false, message: undefined });
    location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <div className="gw-card tinted p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-2">Something broke here{this.props.name ? ` in ${this.props.name}` : ""}.</h2>
          <p className="text-sm opacity-80">
            The page threw an error. Header stays up so you can navigate. You can also reload the page.
          </p>
          {this.state.message && (
            <pre className="mt-3 p-3 rounded bg-black/5 overflow-auto text-xs">
              {this.state.message}
            </pre>
          )}
          <div className="mt-4 flex gap-2">
            <button onClick={this.reload} className="px-3 py-1 rounded-full border text-sm">Reload</button>
            <a href="/_ping" className="px-3 py-1 rounded-full border text-sm">Go to Ping</a>
          </div>
          <div className="mt-3 text-xs opacity-70">
            Tip: Open DevTools → Console for the full stack. Last error is stored as <code>localStorage["glowell:lastError"]</code>.
          </div>
        </div>
      </div>
    );
  }
}
