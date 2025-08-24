// BEGIN: src/pages/DebugEngine.tsx
import { useEffect, useState } from 'react'

import example from 'mho/form/example.profile.json'
import { normalizeProfile } from 'mho/engine/normalize'
import { buildPlan } from 'mho/engine'
import { exportPlan } from 'mho/plan/export'

// Try to call the PDF exporter directly if the wrapper returns an empty blob
async function tryDirectExporter(plan: unknown, profile?: unknown): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PDF = await import("mho/plugins/exporters/PDF");
    const fn =
      (PDF as any).exportPlanToPDF ||
      (PDF as any).default ||
      (PDF as any).exportPDF ||
      null;
    if (typeof fn === "function") {
      const r = fn(plan, profile);
      if (r && typeof (r as Promise<any>).then === "function") {
        await r;
      }
      return true;
    }
  } catch (e) {
    console.warn("Direct PDF call failed:", e);
  }
  return false;
}

type GenState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "error"; errors: string[] }
  | { status: "done"; plan: any; normalized: any; whatsapp: string };

function isPromise<T = any>(v: any): v is Promise<T> {
  return v && typeof v.then === "function";
}

function formatWhatsApp(plan: any): string {
  try {
    const meta = plan?.meta || {};
    const targets = plan?.targets || {};
    const avoid: string[] = Array.isArray(plan?.avoid) ? plan.avoid : [];
    const prefer: string[] = Array.isArray(plan?.prefer) ? plan.prefer : [];
    const schedule: any[] = Array.isArray(plan?.schedule) ? plan.schedule : [];

    const lines: string[] = [];
    lines.push("*GloWell — Your Plan (Preview)*");
    if (meta.conditionsDetected && meta.conditionsDetected.length) {
      lines.push(`• Conditions: ${meta.conditionsDetected.join(", ")}`);
    }
    if (targets && Object.keys(targets).length) {
      lines.push("*Targets:*");
      Object.entries(targets).forEach(([k, v]) => {
        lines.push(`  - ${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`);
      });
    }
    if (prefer.length) lines.push(`*Prefer:* ${prefer.slice(0, 8).join(", ")}${prefer.length > 8 ? "…" : ""}`);
    if (avoid.length) lines.push(`*Avoid:* ${avoid.slice(0, 8).join(", ")}${avoid.length > 8 ? "…" : ""}`);

    if (schedule.length) {
      lines.push("*Schedule (sample):*");
      schedule.forEach((blk) => {
        const title = blk?.title || blk?.id || "Meal";
        const items = Array.isArray(blk?.items) ? blk.items.join(", ") : "";
        const guidance = blk?.guidance ? ` — ${blk.guidance}` : "";
        lines.push(`  • ${title}: ${items}${guidance}`);
      });
    }

    return lines.join("\n");
  } catch {
    return "Plan preview not available.";
  }
}

export default function DebugEngine() {
  const [state, setState] = useState<GenState>({ status: "idle" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setState({ status: "running" });
      try {
        const normalized = normalizeProfile(example as unknown);
        const out = buildPlan(normalized);
        const plan = isPromise(out) ? await out : out;
        const whatsapp = formatWhatsApp(plan);
        if (!mounted) return;
        setState({ status: "done", plan, normalized, whatsapp });
      } catch (e: any) {
        if (!mounted) return;
        setState({ status: "error", errors: [e?.message || "Engine error"] });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleExport() {
    if (state.status !== "done" || busy) return;
    try {
      setBusy(true);

      // 1) Try standard wrapper
      const blob = await exportPlan({ format: "pdf", plan: state.plan, profile: state.normalized });

      if (blob && blob.size > 0) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "GloWell-plan.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }

      // 2) Fallback: call exporter directly
      const ok = await tryDirectExporter(state.plan, state.normalized);
      if (ok) {
        alert("PDF export triggered. Check your browser downloads.");
        return;
      }

      // 3) Final fallback
      alert("PDF export did not return data. Please check the console and PDF exporter.");
    } catch (e) {
      console.error(e);
      alert("Export failed. Check console for details.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCopyWA() {
    if (state.status !== "done" || !state.whatsapp) return;
    try {
      await navigator.clipboard.writeText(state.whatsapp);
      alert("WhatsApp text copied");
    } catch {
      alert("Copy failed");
    }
  }

  return (
    <div style={{ padding: "1rem", maxWidth: 960, margin: "0 auto", lineHeight: 1.6 }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        GloWell — Engine Debug
      </h1>
      <p style={{ margin: "0 0 1rem" }}>
        Auto: <code>example.profile.json</code> → normalize → engine → plan → (optional) PDF.
      </p>

      {state.status === "idle" && <div>Idle…</div>}
      {state.status === "running" && <div>Running engine…</div>}
      {state.status === "error" && (
        <div style={{ color: "#b00020" }}>
          <b>Errors</b>
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(state.errors, null, 2)}</pre>
        </div>
      )}

      {state.status === "done" && (
        <>
          <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
            <button onClick={handleExport} disabled={busy} style={{ padding: "8px 12px", fontWeight: 600 }}>
              {busy ? "Exporting…" : "Export PDF"}
            </button>
            <button onClick={handleCopyWA} style={{ padding: "8px 12px", fontWeight: 600 }}>
              Copy WhatsApp Text
            </button>
          </div>

          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "1rem 0 0.5rem" }}>
            Plan (preview)
          </h2>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f7f7f7", padding: "0.75rem", border: "1px solid #eee", borderRadius: 6 }}>
            {JSON.stringify(state.plan, null, 2)}
          </pre>

          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "1rem 0 0.5rem" }}>
            WhatsApp Text
          </h2>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f7f7f7", padding: "0.75rem", border: "1px solid #eee", borderRadius: 6 }}>
            {state.whatsapp}
          </pre>

          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "1rem 0 0.5rem" }}>
            Normalized Profile
          </h2>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f7f7f7", padding: "0.75rem", border: "1px solid #eee", borderRadius: 6 }}>
            {JSON.stringify(state.normalized, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}
// END: src/pages/DebugEngine.tsx
