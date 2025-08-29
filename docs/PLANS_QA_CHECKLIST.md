# Plans Page — 30-Second QA (v7)

Open in Incognito with a fresh cache-busting query:
`https://mishbyhealth.com/health-plan?v=123456`

## Layout
- [ ] Title block on the **left** (comfortable width), Tip directly below it
- [ ] Buttons on the **right** in a neat row (wraps only on small screens)
- [ ] Below that: Orientation chips + Download buttons in a single tidy row
- [ ] Cards: **Hydration**, **Movement** with solid emerald headers
- [ ] Table: **Meals** with zebra rows

## Title / Local Storage
- [ ] Typing **Plan Title** updates tab title
- [ ] Refresh page — the title persists (localStorage)

## Share
- [ ] **Copy share link** copies `…/health-plan?v=<6 digits>`

## Sample / Import / Export
- [ ] **Load sample plan** fills content
- [ ] **Export JSON** downloads a file
- [ ] **Import JSON** restores the same plan from that file

## Reset (safety)
- [ ] Clicking **Reset (Clear Data)** shows a confirmation dialog
- [ ] On Confirm, local data clears (title, name, orientation)

## PDF (Portrait + Landscape)
Run once each:
- [ ] Filename format: `GloWell_<PlanTitle>_YYYY-MM-DD_<FirstName>[ _Landscape].pdf`
- [ ] Header subtitle: `Prepared for <FirstName>`
- [ ] Footer: `Page X of Y`
- [ ] Printed page does **not** show the Plan Title text

> If any box fails, note it here and fix with a single PR. This checklist is aligned with **v7**.
