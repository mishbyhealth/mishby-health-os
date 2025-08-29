// src/utils/toast.ts
let container: HTMLDivElement | null = null;

function ensureContainer() {
  if (container && document.body.contains(container)) return container;
  container = document.createElement("div");
  container.id = "gw-toast-container";
  container.style.position = "fixed";
  container.style.right = "16px";
  container.style.bottom = "16px";
  container.style.zIndex = "2147483647";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "8px";
  document.body.appendChild(container);
  return container;
}

export function toast(message: string, opts?: { duration?: number }) {
  const dur = Math.max(1000, opts?.duration ?? 2200);
  const parent = ensureContainer();
  const el = document.createElement("div");
  el.setAttribute("role", "status");
  el.style.transition = "all 250ms ease";
  el.style.opacity = "0";
  el.style.transform = "translateY(6px)";
  el.className =
    "rounded-xl px-3 py-2 shadow-lg border border-gray-200 bg-white text-gray-800 text-sm";
  el.textContent = message;

  parent.appendChild(el);
  requestAnimationFrame(() => {
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  });

  window.setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(6px)";
    window.setTimeout(() => {
      if (el.parentElement) el.parentElement.removeChild(el);
    }, 250);
  }, dur);
}
