# GloWell — Health Plan MVP (v7)

This repo contains the **non-wellness wellness app** defined in the v7 blueprint.

---

## 🌿 Features (v7)
- Plans page with **Title left, buttons right**
- **Hydration / Movement** cards, **Meals** table with zebra rows
- **Sample plan** loader
- **Import / Export JSON** for backup/restore
- **Reset with confirm** dialog
- **PDF Export** (Portrait + Landscape):
  - Filename: `GloWell_<PlanTitle>_YYYY-MM-DD_<FirstName>[ _Landscape].pdf`
  - Header subtitle: `Prepared for <FirstName>`
  - Footer: `Page X of Y`

---

## 📂 Key Structure
- `src/` — app code
- `mho/plugins/exporters/pdf.ts` — PDF engine
- `docs/advanced-engine-v2/` — canonical prompts, migration, readme
- `docs/_archive/` — drafts (not live)
- `docs/PLANS_QA_CHECKLIST.md` — 30-sec QA
- `docs/README_DEPLOY.md` — deploy & ops guide
- `CONTRIBUTING.md` — rules for contributors
- `RELEASE_NOTES.md` — history

---

## 🚀 Deploy
- Hosted: [https://mishbyhealth.com](https://mishbyhealth.com)
- Build: `npm run build`
- Deploy without cache for fresh UI

Open with cache-buster:

