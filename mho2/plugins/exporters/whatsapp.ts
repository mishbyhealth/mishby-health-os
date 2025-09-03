// File: mho2/plugins/exporters/whatsapp.ts
export function buildWhatsAppText(plan: any) {
  const d = plan?.day || {};
  const lines = [
    "Daily wellness (non-wellness):",
    `Wake: ${d.wake || "-"}`,
    `Sleep: ${d.sleep || "-"}`,
    `Hydration: ${(d.hydration?.schedule || []).join(", ") || "-"}`,
    `Movement: ${(d.movement?.blocks || []).join(" | ") || "-"}`,
  ];
  return lines.join("\n");
}

export function shareOnWhatsApp(plan: any) {
  const text = encodeURIComponent(buildWhatsAppText(plan));
  // Web endpoint (works even if desktop app outdated)
  const webUrl = `https://web.whatsapp.com/send?text=${text}`;
  const apiUrl = `https://api.whatsapp.com/send?text=${text}`;
  const waMe  = `https://wa.me/?text=${text}`;

  const w = window.open(webUrl, "_blank");
  // if popup blocked or web not available, try api / wa.me
  setTimeout(() => {
    if (!w || w.closed) window.open(apiUrl, "_blank");
  }, 800);
  setTimeout(() => {
    if (!w || w.closed) window.open(waMe, "_blank");
  }, 1600);
}

export async function copyShareText(plan: any) {
  const t = buildWhatsAppText(plan);
  try {
    await navigator.clipboard.writeText(t);
    alert("Text copied. Paste into WhatsApp.");
  } catch {
    // fallback textarea
    const ta = document.createElement("textarea");
    ta.value = t; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); document.body.removeChild(ta);
    alert("Text copied. Paste into WhatsApp.");
  }
}
