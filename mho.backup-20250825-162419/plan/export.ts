// mho/plan/export.ts
// Thin wrapper around plugins/exporters (e.g. PDF).
// Tolerant to different return types from PDF.exportPlanToPDF.

import * as PDF from "../plugins/exporters/PDF";

export type ExportFormat = "pdf";

export interface ExportOptions {
  format: ExportFormat;
  plan: unknown;
  profile?: unknown; // optional, ignored by current PDF impl
}

function toBlob(data: unknown): Blob {
  if (data instanceof Blob) return data;
  if (data == null) return new Blob([], { type: "application/pdf" });
  if (data instanceof Uint8Array) {
    // Normalize to ArrayBuffer and cast to BlobPart for wide TS/DOM lib compatibility
    const ab = data.buffer as ArrayBuffer;
    return new Blob([ab as unknown as BlobPart], { type: "application/pdf" });
  }
  if (data instanceof ArrayBuffer) {
    return new Blob([data as unknown as BlobPart], { type: "application/pdf" });
  }
  if (typeof data === "string") return new Blob([data], { type: "application/pdf" });
  // Fallback: JSON serialize (still mark as pdf for download handlers)
  try {
    return new Blob([JSON.stringify(data, null, 2)], { type: "application/pdf" });
  } catch {
    return new Blob([], { type: "application/pdf" });
  }
}

export async function exportPlan(opts: ExportOptions): Promise<Blob> {
  switch (opts.format) {
    case "pdf": {
      // Most implementations accept only (plan). If your exporter supports profile,
      // it can read from plan or global state.
      const out = await (PDF as any).exportPlanToPDF(opts.plan);
      return toBlob(out);
    }
    default:
      throw new Error(`Unsupported export format: ${opts.format}`);
  }
}
