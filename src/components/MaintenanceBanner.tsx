// src/components/MaintenanceBanner.tsx
import { useEffect, useState } from 'react';
import { initLockFromStorage, isLocked, onLockChange } from '@/utils/lock';

export default function MaintenanceBanner() {
  const [locked, setLocked] = useState<boolean>(() => isLocked());

  useEffect(() => {
    initLockFromStorage();
    setLocked(isLocked());
    return onLockChange(setLocked);
  }, []);

  if (!locked) return null;

  // Non-clinical, neutral notice. Read-only mode.
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full z-[60] sticky top-0 left-0 right-0 bg-amber-100 text-amber-900 border-b border-amber-200 px-4 py-2 text-sm"
    >
      <div className="max-w-6xl mx-auto flex items-center gap-2">
        <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 shrink-0" />
        <strong>Maintenance Mode</strong>
        <span className="opacity-90">— App is read-only. Saving, edits, and plan generation are temporarily disabled.</span>
      </div>
    </div>
  );
}
