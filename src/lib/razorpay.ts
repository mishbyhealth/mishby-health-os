// src/lib/razorpay.ts
export async function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-sdk")) return resolve(true);
    const s = document.createElement("script");
    s.id = "razorpay-sdk";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

type OpenCheckoutOpts = {
  amountInPaise: number; // 100 INR => 10000
  name?: string;
  email?: string;
  contact?: string;
  notes?: Record<string, string>;
};

export async function openRazorpayCheckout(opts: OpenCheckoutOpts) {
  const ok = await loadRazorpay();
  if (!ok) throw new Error("Razorpay SDK failed to load");

  const key = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;
  if (!key) throw new Error("Missing VITE_RAZORPAY_KEY_ID in .env");

  // NOTE: यह client-side MVP है; production में server-side order बनाइए (v9 open tasks):contentReference[oaicite:3]{index=3}।
  const rzOpts: any = {
    key,
    amount: opts.amountInPaise,
    currency: "INR",
    name: "GloWell",
    description: "Support GloWell — Live Naturally.",
    prefill: {
      name: opts.name || "",
      email: opts.email || "",
      contact: opts.contact || "",
    },
    notes: opts.notes || {},
    theme: { color: "#0ea5a4" },
  };

  // @ts-ignore
  const rzp = new window.Razorpay(rzOpts);
  rzp.open();
}
