# GloWell — Deploy & QA (v7)

This repo ships the GloWell Health Plan MVP exactly as defined in **v7**.

---

## 1) Build & Deploy (Netlify)
- **Branch:** `clean-main`
- **Build cmd:** `npm run build`
- **Publish dir:** `dist`
- **Auto publish:** ON

### Clean redeploy
Netlify → **Deploys** → **Trigger deploy** → **Deploy project without cache**.

---

## 2) Cache-busting (for fresh UI)
- Always open with a fresh query param, e.g.  
  `https://mishbyhealth.com/health-plan?v=123456`
- Any 6 digits work; it forces a clean view.

---

## 3) Plans Page — v7 QA Checklist
- **Plan Title** field:
  - Saves to localStorage
  - Sets browser tab title
  - Appears only in PDF **filename** (not printed)
- **Buttons:** Help, Copy share link, Reset (Clear Data), Load sample plan, Import JSON, Export JSON
- **PDF Orientation chips:** Portrait / Landscape (last-used persists)
- **PDF Export:** Portrait + Landscape
  - Filename pattern: `GloWell_<PlanTitle>_YYYY-MM-DD_<FirstName>[_Landscape].pdf`
  - Header subtitle: `Prepared for <FirstName>`
  - Footer: `Page X of Y`
  - Printed page **does not** show the Plan Title text
- **Cards & Table:** Hydration, Movement (solid emerald headers); Meals table with zebra rows

---

## 4) Share Link
- Button copies fresh link:  
  `https://mishbyhealth.com/health-plan?v=<6 digits>`

---

## 5) Local Data
- Stored keys:
  - `glowell:plan`
  - `glowell:user` (first name)
  - `glowell:pdfOrientation`
- **Reset (Clear Data)** shows confirm dialog and clears these only.

---

## 6) Troubleshooting
- If styles/scripts look stale → use fresh `?v=######` and do a **Deploy without cache**.
- If PDF fails:
  1) Check console errors
  2) Ensure `mho/plugins/exporters/pdf.ts` exists
  3) Retry with short Plan Title (ASCII only)

---

## 7) Release Tagging
After a stable deploy:
```bash
git tag -a v1.0.0 -m "GloWell MVP (v7) stable"
git push --tags
