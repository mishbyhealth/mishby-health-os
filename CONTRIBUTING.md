# Contributing (GloWell v7)

This repo ships the Health Plan MVP exactly as defined in **v7**. Keep changes small, reviewable, and aligned with the blueprint.

---

## Ground Rules (must read)
1) **Blueprint first:** Follow `docs/advanced-engine-v2/` and `docs/PASTE_MAP.md`.  
2) **No visual/palette changes** unless a new blueprint version explicitly requires it.  
3) **Atomic commits:** One logical change per commit.  
4) **Docs-first for breaking behavior:** If UI/PDF behavior changes, add a one-liner to `docs/advanced-engine-v2/MIGRATION.md`.

---

## Branches & PRs
- **Default branch:** `clean-main`  
- Create feature branches: `feat/<short>`, `fix/<short>`, `docs/<short>`  
- Open PR with:
  - Brief description (what/why)
  - Checklist ticked (see below)
  - Links to any updated docs

**Do not** merge without the 30-second QA checklist green.

---

## Commit Message Style
- Use conventional form:
  - `feat: ...` (new functionality)
  - `fix: ...` (bug)
  - `docs: ...` (docs only)
  - `refactor: ...` (no behavior change)
  - `style: ...` (formatting/CSS only)
- Keep it short (~50 chars in subject).

---

## Files & Structure
- **App code:** `src/**`
- **Exporter:** `mho/plugins/exporters/pdf.ts`
- **Docs (canonical):** `docs/advanced-engine-v2/` (README / MIGRATION / PROMPTS)
- **Docs index:** `docs/README.md`, `docs/advanced-engine-v2/INDEX.md`
- **Archive (non-live):** `docs/_archive/` (read-only)
- **Ops & QA:** `docs/README_DEPLOY.md`, `docs/PLANS_QA_CHECKLIST.md`, `docs/PASTE_MAP.md`

---

## QA Before Merge (30 seconds)
Open Incognito with a fresh cache buster:
`https://mishbyhealth.com/health-plan?v=123456`

- Layout tidy: Title+Tip left, buttons right; orientation+download row neat
- Sample/Import/Export working
- Reset shows confirm dialog
- PDF Portrait & Landscape: filename, header “Prepared for <Name>”, footer “Page X of Y”, no printed Plan Title text

If any box fails, fix or update docs before merging.

---

## Versioning & Tags
After a stable deploy:
```bash
git tag -a v1.0.0 -m "GloWell MVP (v7) stable"
git push --tags

