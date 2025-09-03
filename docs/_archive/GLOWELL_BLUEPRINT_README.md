# GloWell Blueprint (Detailed)
This repo uses a non-wellness wellness architecture. You may collect problems/symptoms and uploads (prescriptions/reports), process them internally, but **never** output wellness advice.
## Modules
- Compliance guard (redactor + disclaimers)
- Health Form (schema + multi-step UI)
- Engine (normalize → process → safeGenerate)
- Plan UI (PlanView), Trackers
- Uploads pipeline (OCR/classify/parsers) + UI + storage + functions
- Exporters (PDF/Excel/WhatsApp)
- Lint (nonclinical)
## Wire-up Quickstart
- Submit handler:
```ts
import { generateSafePlan } from "mho/engine/safeGenerate";
const plan = await generateSafePlan(formData);
```
- Render Plan:
```tsx
import PlanView from "@/pages/PlanView";
<PlanView plan={plan}/>
```
- Export:
```ts
import { exportPlanPDF } from "mho/plugins/exporters/pdf";
```
## Legal
GloWell provides general wellness suggestions only; not wellness advice.
