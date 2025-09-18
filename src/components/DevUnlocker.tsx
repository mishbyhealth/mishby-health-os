// src/components/DevUnlocker.tsx
// DEV-ONLY: force-enable form interactions even if some UI tries to block them.
import * as React from "react";

function enableNode(n: Element) {
  try {
    (n as HTMLElement).style.pointerEvents = "auto";
    n.removeAttribute("inert");
    n.removeAttribute("aria-disabled");
    (n as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLButtonElement).disabled = false as any;
    (n as HTMLInputElement | HTMLTextAreaElement).readOnly = false as any;
  } catch {}
}

function walkAncestors(el: Element | null, hops = 8) {
  let p: Element | null = el;
  for (let i = 0; i < hops && p; i++) {
    enableNode(p);
    p = p.parentElement;
  }
}

export default function DevUnlocker() {
  React.useEffect(() => {
    // CSS overrides (non-destructive, dev-only)
    const style = document.createElement("style");
    style.setAttribute("data-dev-unlocker", "true");
    style.textContent = `
      [data-maintenance="true"] { pointer-events: auto !important; }
      [data-maintenance="true"] input,
      [data-maintenance="true"] textarea,
      [data-maintenance="true"] select,
      [data-maintenance="true"] button { pointer-events: auto !important; }

      .wizard-tint, .maintenance-mask, .gw-wizard-mask { pointer-events: none !important; }
      .wizard-tint input, .wizard-tint textarea, .wizard-tint select, .wizard-tint button { pointer-events: auto !important; }

      fieldset[disabled] * { pointer-events: auto !important; }
    `;
    document.head.appendChild(style);

    const unlock = () => {
      try {
        localStorage.setItem("glowell:lock", "false");
        document.documentElement.removeAttribute("data-maintenance");
        (document.body as any).style.pointerEvents = "auto";
      } catch {}

      try {
        // enable common controls
        document
          .querySelectorAll<HTMLElement>("input, textarea, select, button, fieldset, form, .card, .panel")
          .forEach((el) => {
            // if fieldset, drop disabled
            if (el.tagName.toLowerCase() === "fieldset") {
              (el as HTMLFieldSetElement).disabled = false;
            }
            enableNode(el);
            walkAncestors(el, 8);
          });

        // kill obvious blockers/overlays
        document
          .querySelectorAll<HTMLElement>('[inert], [aria-disabled="true"], .overlay, .mask, .backdrop, .veil, .blocker')
          .forEach((el) => {
            el.style.pointerEvents = "none";
            el.removeAttribute("inert");
            el.removeAttribute("aria-disabled");
          });
      } catch {}
    };

    // run now + keep it running
    unlock();
    const interval = window.setInterval(unlock, 700);

    const mo = new MutationObserver(() => unlock());
    try {
      mo.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
    } catch {}

    return () => {
      window.clearInterval(interval);
      try { mo.disconnect(); } catch {}
      try {
        const s = document.querySelector('style[data-dev-unlocker="true"]');
        if (s) s.remove();
      } catch {}
    };
  }, []);

  return null;
}
