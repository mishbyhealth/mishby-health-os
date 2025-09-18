// src/components/OwnerBar.tsx
import { useEffect, useState } from 'react';
import MaintenanceBanner from '@/components/MaintenanceBanner';
import { isLocked, setLocked, initLockFromStorage, onLockChange } from '@/utils/lock';

function isOwnerUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  // Owner session gate (kept simple; aligns with v14 Owner PIN unlock that sets a session flag)
  return window.localStorage.getItem('glowell:owner:unlocked') === '1';
}

export default function OwnerBar() {
  const [locked, setLockedState] = useState<boolean>(() => isLocked());
  const [owner, setOwner] = useState<boolean>(() => isOwnerUnlocked());

  useEffect(() => {
    initLockFromStorage();
    setLockedState(isLocked());
    setOwner(isOwnerUnlocked());
    const off = onLockChange(setLockedState);
    const iv = setInterval(() => setOwner(isOwnerUnlocked()), 1500);
    return () => { off(); clearInterval(iv); };
  }, []);

  const toggleLock = () => {
    if (!owner) return;
    const next = !locked;
    setLocked(next);
    setLockedState(next);
  };

  return (
    <>
      {/* Global maintenance banner sits above everything when locked */}
      <MaintenanceBanner />

      {/* Thin owner bar with status + controls (shown always; controls gated) */}
      <div className="w-full bg-slate-50 border-b border-slate-200 text-slate-700 text-xs">
        <div className="max-w-6xl mx-auto px-3 py-1 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${locked ? 'bg-amber-100 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${locked ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            {locked ? 'Maintenance: ON (read-only)' : 'Maintenance: OFF (normal)'}
          </span>

          <span className="opacity-60">Owner:</span>
          <span className={`px-2 py-0.5 rounded ${owner ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-slate-100 border border-slate-200 text-slate-600'}`}>
            {owner ? 'Unlocked' : 'Locked'}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              disabled={!owner}
              onClick={toggleLock}
              className={`px-2 py-1 rounded border text-xs ${owner
                ? 'bg-white hover:bg-slate-50 border-slate-300'
                : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}
              aria-disabled={!owner}
              title={owner ? 'Toggle Maintenance Lock' : 'Unlock Owner session in Settings to toggle lock'}
            >
              {locked ? 'Disable Maintenance' : 'Enable Maintenance'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
