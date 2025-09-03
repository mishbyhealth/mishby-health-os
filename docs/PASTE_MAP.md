# PASTE_MAP.md — GloWell (Copy–Paste Guide)

**Goal:** Simple, one‑by‑one instructions for where to paste each file (and why).  
**You do:** Just copy each code block from my messages and put it exactly where shown below.  
**This guide matches your current v7 setup.**

---

## 0) Folder you should have
```
/ (project root)
├─ package.json
├─ netlify.toml
├─ public/
│  ├─ og.png
│  ├─ favicon.svg
│  ├─ apple-touch-icon.png
│  ├─ maintenance.html
│  └─ _redirects.* (see Maintenance Mode)
├─ src/
│  ├─ pages/
│  │  ├─ HealthPlan.tsx
│  │  └─ PlanView.tsx
│  └─ ...
├─ mho/
│  ├─ compliance/
│  │  ├─ ComplianceGuard.ts
│  │  ├─ nonClinical.rules.json
│  │  └─ strings.ts
│  ├─ engine/
│  │  ├─ normalize.ts
│  │  ├─ processForm.ts
│  │  └─ safeGenerate.ts
│  └─ plan/
│     └─ schema.ts
├─ features/ (some projects use src/features)
│  ├─ health-plan/
│  │  └─ MultiStepHealthForm.tsx
│  ├─ tracker/
│  │  └─ TrackerDashboard.tsx
│  └─ uploads/
│     ├─ UploadsConsent.tsx
│     └─ UploadsManager.tsx
├─ services/
│  └─ storage/
│     └─ uploadService.ts
├─ functions/
│  └─ src/
│     ├─ uploadsIngest.ts
│     └─ cleanupUploads.ts
├─ scripts/
│  ├─ Lock.ps1
│  ├─ Unlock.ps1
│  └─ nonclinical-lint.cjs
└─ docs/
   └─ PASTE_MAP.md  ← (this file)
```

> Note: If your project uses `features-v2` or `mho2/*`, keep them too. They are advanced v2 modules. You can paste those later when we enable v2.

---

## 1) serious files and *exact* locations

### A) SPA Routing (avoid 404 on refresh)
**Path:** `/netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```
**Notes:** Save as plain text (ASCII), no BOM. After deploy, refresh `/health-plan` should work.

---

### B) SEO / Metadata
**Path:** `/public/og.png` (1200×630) — replace to change social preview.  
**Path:** `/index.html` — global `<title>` + description are already present in v7.  
**Path:** `src/pages/HealthPlan.tsx` — uses `<Helmet>` to set page title based on plan title.

---

### C) Compliance (non‑wellness guard)
**Path:** `mho/compliance/ComplianceGuard.ts`  
**Path:** `mho/compliance/nonClinical.rules.json`  
**Path:** `mho/compliance/strings.ts`  
Purpose: Redacts wellness terms and injects disclaimers *everywhere* the plan text goes.

---

### D) Engine (safe plan generator)
**Path:** `mho/engine/normalize.ts`  
**Path:** `mho/engine/processForm.ts`  
**Path:** `mho/engine/safeGenerate.ts`  
Purpose: Converts form → neutral plan, then passes through ComplianceGuard.

---

### E) Plan Schema + View
**Path:** `mho/plan/schema.ts` (Type definitions)  
**Path:** `src/pages/PlanView.tsx` (UI: hydration, movement, meals in brand cards/table)

---

### F) Health Form (simple multi‑step)
**Path:** `features/health-plan/MultiStepHealthForm.tsx`  
Purpose: 5‑step intake; connects to generator on submit (we’ll wire this later).

---

### G) Uploads (optional for later)
**Paths:**  
- `features/uploads/UploadsManager.tsx`  
- `features/uploads/UploadsConsent.tsx`  
- `services/storage/uploadService.ts`  
- `functions/src/uploadsIngest.ts`, `functions/src/cleanupUploads.ts`  

---

### H) Trackers (shell UI)
**Path:** `features/tracker/TrackerDashboard.tsx`

---

### I) Exporters
**Paths:**  
- `mho/plugins/exporters/pdf.ts`  
- `mho/plugins/exporters/excel.ts`  
- `mho/plugins/exporters/whatsapp.ts`  

> In v7, PDF exporter already updated with Portrait/Landscape, filename pattern, and page numbers.

---

### J) Lint & Maintenance
**Path:** `scripts/nonclinical-lint.cjs`  
**Paths (Maintenance Mode):**  
- `public/_redirects.locked` → `/*  /maintenance.html  200`  
- `public/_redirects.open`   → *(empty file)*  
- `public/maintenance.html`  → a simple friendly page  
- `package.json` → has `"lock"` / `"unlock"` scripts which copy the correct redirects file

**Usage:**  
- Lock: `npm run lock` → wait → test in Incognito  
- Unlock: `npm run unlock` → wait → test in Incognito

---

## 2) Local storage keys (used by v7)
- `glowell:plan` → `{ meta:{ title }, ... }`
- `glowell:user` → `{ firstName }` (used for “Prepared for …” and PDF filename)
- `glowell:pdfOrientation` → `"portrait" | "landscape"`

---

## 3) Deploy runbook (short)
1. Commit & push to `clean-main`.
2. Netlify → **Deploys** → **Trigger deploy → Clear cache and deploy site**.
3. Test in Incognito with a cache‑busting query like `?v=35`:
   - `https://mishbyhealth.com/health-plan?v=35`
   - `https://mishbyhealth.netlify.app/health-plan?v=35`

---

## 4) Quick verify checklist after any change
- `/health-plan` opens with titled tab (if you set plan title on page).
- “Download (Landscape)” remembers orientation.
- Copy share link puts `https://mishbyhealth.com/health-plan?v=XXXXXX` in clipboard.
- PDF has **Page X of Y** footer; header subtitle shows if firstName is saved.
- Refreshing `/health-plan` does **not** 404 (redirect rule OK).

---

## 5) Troubleshooting
- **404 on deep links** → Check `netlify.toml` redirect present and saved as pure ASCII.
- **Old UI after deploy** → Re‑deploy with “**Clear cache and deploy site**”, then test with `?v=NNNN`.
- **Maintenance page not showing** → Run `npm run lock` and test in **Incognito**. For unlock, run `npm run unlock` similarly.
- **PDF name missing first name** → Open page top input and set your first name once; v7 caches it for filename.

---

## 6) Next suggested tasks (we’ll do these for you, one‑by‑one)
- Add `docs/README_DEPLOY.md` (tiny Netlify guide with pictures)
- Toast notifications on copy/reset (non‑breaking enhancement)
- Optional: header title inside the PDF (currently only in filename by design)
- Add 512×512 PNG icon to `site.webmanifest` for PWA install

