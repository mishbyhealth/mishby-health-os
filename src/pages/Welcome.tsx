import { Link } from "react-router-dom";

export default function Welcome() {
  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <div className="gw-card tinted p-6 md:p-10 rounded-2xl">
        <h1 className="text-2xl md:text-4xl font-bold mb-3">Welcome to GloWell</h1>
        <p className="text-sm md:text-base opacity-80">
          Live Naturally. Heal Holistically. Choose a path to get started — fill the Health Form,
          open your Dashboard, or preview a demo Health Plan.
        </p>

        <div className="mt-6 grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link to="/health-form" className="block gw-card p-4 rounded-xl hover:opacity-90">
            <h2 className="font-semibold mb-1">📝 Health Form</h2>
            <p className="text-sm opacity-80">Enter your details to generate a personalized plan.</p>
          </Link>

          <Link to="/dashboard" className="block gw-card p-4 rounded-xl hover:opacity-90">
            <h2 className="font-semibold mb-1">📊 Dashboard</h2>
            <p className="text-sm opacity-80">See quick stats, latest plan and shortcuts.</p>
          </Link>

          <a href="/health-plan#demo" className="block gw-card p-4 rounded-xl hover:opacity-90">
            <h2 className="font-semibold mb-1">🧪 Demo Plan</h2>
            <p className="text-sm opacity-80">Open a safe, read-only demo health plan.</p>
          </a>

          <Link to="/plans" className="block gw-card p-4 rounded-xl hover:opacity-90">
            <h2 className="font-semibold mb-1">📚 Plans History</h2>
            <p className="text-sm opacity-80">Browse saved plans and exports.</p>
          </Link>

          <Link to="/subscription" className="block gw-card p-4 rounded-xl hover:opacity-90">
            <h2 className="font-semibold mb-1">💎 Subscription</h2>
            <p className="text-sm opacity-80">Free, Silver, Gold, Platinum — choose benefits.</p>
          </Link>

          <Link to="/settings" className="block gw-card p-4 rounded-xl hover:opacity-90">
            <h2 className="font-semibold mb-1">⚙️ Settings</h2>
            <p className="text-sm opacity-80">Timezone, language, diet and feature flags.</p>
          </Link>
        </div>

        <div className="mt-8 text-xs opacity-70">
          Tip: Use the theme button in the header to cycle 7 pastel themes. 🔒 Lock switch enables
          read-only mode for safe demos.
        </div>
      </div>
    </div>
  );
}
