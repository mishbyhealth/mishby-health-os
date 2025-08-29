# GloWell Advanced Engine v2 — Index (v7)

This folder contains the minimal, versioned authoring surface for the engine.

## Files
- **[PROMPTS.md](./PROMPTS.md)** — canonical prompts and response blocks.
- **[MIGRATION.md](./MIGRATION.md)** — how to upgrade content without breaking the app.
- **[README.md](./README.md)** — concepts, glossary, and authoring notes.

> Older drafts/alternates are parked in `../_archive/` for reference only.

---

## Editing Rules (per v7)
1. Keep each edit **atomic** and commit with a clear message.
2. Never delete prior guidance; **append** and tag with a date if needed.
3. If a change alters app behavior, record a one-line note in **MIGRATION.md**.

---

## Quick Checks before a PR
- [ ] Links in this index open the right files
- [ ] PROMPTS examples copy/paste into app without edits
- [ ] MIGRATION contains a one-line note for any breaking change

---

## Versioning
Tag stable releases after deploy:
```bash
git tag -a v1.0.0 -m "GloWell MVP (v7) stable"
git push --tags
