// src/components/PlanProvenanceChip.tsx
import { useEffect, useState } from 'react';
import { getProvenanceLog, clearProvenance } from '@/services/planService';
import { isOwnerUnlocked } from '@/services/planCache';

function timeAgo(ts: number): string {
  const ms = Date.now() - ts;
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h`;
  const d = Math.round(h / 24);
  return `${d}d`;
}

export default function PlanProvenanceChip() {
  const [owner, setOwner] = useState(isOwnerUnlocked());
  const [open, setOpen] = useState(false);
  const [list, setList] = useState(() => getProvenanceLog());

  useEffect(() => {
    const iv = setInterval(() => {
      setOwner(isOwnerUnlocked());
      setList(getProvenanceLog());
    }, 1500);
    return () => clearInterval(iv);
  }, []);

  if (!owner) return null;

  const last5 = list.slice(-5);
  const count = list.length;

  return (
    <div className="ml-2 relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="px-2 py-1 text-xs rounded border bg-white hover:bg-slate-50"
        title="View plan provenance (owner-only)"
      >
        Provenance ({count})
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow p-2 z-50 text-xs">
          <div className="flex items-center justify-between mb-2">
            <strong>Recent entries</strong>
            <button
              className="px-2 py-0.5 border rounded"
              onClick={() => { clearProvenance(); setList([]); }}
              title="Clear provenance log"
            >
              Clear
            </button>
          </div>
          {last5.length === 0 ? (
            <div className="opacity-60">No entries yet.</div>
          ) : (
            <ul className="space-y-1">
              {last5.map((e, i) => (
                <li key={i} className="border rounded px-2 py-1 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1 py-0.5 rounded bg-slate-200">{e.source}</span>
                    <span className="opacity-70">{timeAgo(e.ts)} ago</span>
                    <span className="ml-auto opacity-60">#{e.hash.slice(0,6)}</span>
                  </div>
                  {e.note && <div className="mt-1 opacity-80">{e.note}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
