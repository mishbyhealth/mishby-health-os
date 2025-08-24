#!/usr/bin/env node
/**
 * GloWell — Comprehensive FINAL Blueprint (Detailed Edition)
 * File: install_universal_blueprint.mjs
 *
 * PURPOSE
 * - Turn your current GloWell repo into a complete, non-clinical wellness product.
 * - Safe to run multiple times. Default: never overwrites (creates ".new").
 * - Adds: compliance, form (with problems/symptoms + uploads), engine, plan UI, tracker,
 *   exporters (PDF/Excel/WhatsApp), storage service, cloud functions stubs, lint, docs, prompts.
 *
 * NON-CLINICAL RULE (India-safe, no permissions needed):
 * - You may collect clinical-like inputs (problems, symptoms, prescriptions, reports).
 * - You may process those internally (risk tags, neutral constraints).
 * - You MUST NOT generate clinical plans/recommendations. All outputs are neutral wellness guidance.
 * - ComplianceGuard redacts clinical terms and injects a visible disclaimer.
 *
 * FLAGS
 *   --add-core        Core engine (normalize, processForm, safeGenerate, plan schema)
 *   --add-compliance  Compliance guard + rules + strings + redFlags
 *   --add-form        HealthForm schema + UI skeleton (Multi-step, with problems/uploads)
 *   --add-uploads     Uploads pipeline (OCR/classify/parsers) + UI + storage + functions
 *   --add-trackers    Tracker dashboard shell
 *   --add-exporters   Exporters (PDF, Excel, WhatsApp)
 *   --add-docs        Docs (README blueprint, MIGRATION guide, PROMPT PACK)
 *   --patch-scripts   Patch package.json scripts (lint, demo)
 *   --dry-run         Show what would change (no writes)
 *   --backup          If file exists: write <file>.bak then OVERWRITE (dangerous)
 *
 *   (No flags)        Installs ALL modules safely (.new behavior)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const root       = __dirname;

const args = new Set(process.argv.slice(2));

const ALL_V1_FLAGS = [
  "--add-core","--add-compliance","--add-form","--add-uploads",
  "--add-trackers","--add-exporters","--add-docs","--patch-scripts",
  "--dry-run","--backup"
];

const ALL_V2_FLAGS = [
  "--add-intake-profile","--add-intake-schedule","--add-intake-body-activity",
  "--add-intake-nutrition-culture","--add-intake-meals-hydration","--add-intake-kitchen-budget",
  "--add-intake-medical","--add-labs-vitals","--add-ingest-uploads",
  "--add-repro-conditional","--add-traditional-dosha",
  "--add-goals-reminders","--add-notes",
  "--add-advanced-normalize-validate","--add-advanced-calcs","--add-risk-modes-flags",
  "--add-diet-filters-safety","--add-climate-context-circadian","--add-rule-engine-priority",
  "--add-repro-dosha-modifiers","--add-persistence-tests",
  "--add-plan-schemas-views",
  "--add-exporters-plus","--add-compliance-2","--add-docs-advanced",
  "--patch-scripts-advanced"
];

const ALL_FLAGS = [...ALL_V1_FLAGS, ...ALL_V2_FLAGS];

const DO_ALL      = ![...args].some(a => ALL_FLAGS.includes(a));
const DRY_RUN     = args.has("--dry-run");
const BACKUP_WRITE= args.has("--backup");

const MODES = {
  // V1
  core:        DO_ALL || args.has("--add-core"),
  compliance:  DO_ALL || args.has("--add-compliance"),
  form:        DO_ALL || args.has("--add-form"),
  uploads:     DO_ALL || args.has("--add-uploads"),
  trackers:    DO_ALL || args.has("--add-trackers"),
  exporters:   DO_ALL || args.has("--add-exporters"),
  docs:        DO_ALL || args.has("--add-docs"),
  scripts:     DO_ALL || args.has("--patch-scripts"),

  // V2
  intake_profile:           DO_ALL || args.has("--add-intake-profile"),
  intake_schedule:          DO_ALL || args.has("--add-intake-schedule"),
  intake_body_activity:     DO_ALL || args.has("--add-intake-body-activity"),

  intake_nutrition_culture: DO_ALL || args.has("--add-intake-nutrition-culture"),
  intake_meals_hydration:   DO_ALL || args.has("--add-intake-meals-hydration"),
  intake_kitchen_budget:    DO_ALL || args.has("--add-intake-kitchen-budget"),

  intake_medical:           DO_ALL || args.has("--add-intake-medical"),
  labs_vitals:              DO_ALL || args.has("--add-labs-vitals"),
  ingest_uploads:           DO_ALL || args.has("--add-ingest-uploads"),

  repro_conditional:        DO_ALL || args.has("--add-repro-conditional"),
  traditional_dosha:        DO_ALL || args.has("--add-traditional-dosha"),

  goals_reminders:          DO_ALL || args.has("--add-goals-reminders"),
  notes:                    DO_ALL || args.has("--add-notes"),

  adv_normalize_validate:   DO_ALL || args.has("--add-advanced-normalize-validate"),
  adv_calcs:                DO_ALL || args.has("--add-advanced-calcs"),
  risk_modes_flags:         DO_ALL || args.has("--add-risk-modes-flags"),
  diet_filters_safety:      DO_ALL || args.has("--add-diet-filters-safety"),
  climate_circadian:        DO_ALL || args.has("--add-climate-context-circadian"),
  rule_engine_priority:     DO_ALL || args.has("--add-rule-engine-priority"),
  repro_dosha_modifiers:    DO_ALL || args.has("--add-repro-dosha-modifiers"),
  persistence_tests:        DO_ALL || args.has("--add-persistence-tests"),

  plan_schemas_views:       DO_ALL || args.has("--add-plan-schemas-views"),

  exporters_plus:           DO_ALL || args.has("--add-exporters-plus"),
  compliance2:              DO_ALL || args.has("--add-compliance-2"),
  docs_advanced:            DO_ALL || args.has("--add-docs-advanced"),
  scripts_advanced:         DO_ALL || args.has("--patch-scripts-advanced"),
};

// ---- V2 gating & flags (opt-in) ----
// NOTE: V1 का default व्यवहार जैसा का तैसा रहेगा। V2 तभी चलेगा जब --enable-v2 या कोई v2-flag दिया जाए।
const V2_FLAGS = [
  "--add-intake-profile","--add-intake-schedule","--add-intake-body-activity",
  "--add-intake-nutrition-culture","--add-intake-meals-hydration","--add-intake-kitchen-budget",
  "--add-intake-medical","--add-labs-vitals","--add-ingest-uploads",
  "--add-repro-conditional","--add-traditional-dosha",
  "--add-goals-reminders","--add-notes",
  "--add-advanced-normalize-validate","--add-advanced-calcs","--add-risk-modes-flags",
  "--add-diet-filters-safety","--add-climate-context-circadian","--add-rule-engine-priority",
  "--add-repro-dosha-modifiers","--add-persistence-tests",
  "--add-plan-schemas-views",
  "--add-exporters-plus","--add-compliance-2","--add-docs-advanced",
  "--patch-scripts-advanced"
];

// V2 को चालू करने का गेट: --enable-v2 या कोई भी V2 flag
const ENABLE_V2 = args.has("--enable-v2") || [...args].some(a => V2_FLAGS.includes(a));

// V2 का DO_ALL: जब V2 enabled हो और कोई specific V2 flag न दिया हो
const DO_ALL_V2 = ENABLE_V2 && ![...args].some(a => V2_FLAGS.includes(a));

// V2 के मोड्स (सिर्फ़ ENABLE_V2 होने पर ही true होंगे)
const MODES_V2 = {
  intake_profile:            ENABLE_V2 && (DO_ALL_V2 || args.has("--add-intake-profile")),
  intake_schedule:           ENABLE_V2 && (DO_ALL_V2 || args.has("--add-intake-schedule")),
  intake_body_activity:      ENABLE_V2 && (DO_ALL_V2 || args.has("--add-intake-body-activity")),

  intake_nutrition_culture:  ENABLE_V2 && (DO_ALL_V2 || args.has("--add-intake-nutrition-culture")),
  intake_meals_hydration:    ENABLE_V2 && (DO_ALL_V2 || args.has("--add-intake-meals-hydration")),
  intake_kitchen_budget:     ENABLE_V2 && (DO_ALL_V2 || args.has("--add-intake-kitchen-budget")),

  intake_medical:            ENABLE_V2 && (DO_ALL_V2 || args.has("--add-intake-medical")),
  labs_vitals:               ENABLE_V2 && (DO_ALL_V2 || args.has("--add-labs-vitals")),
  ingest_uploads:            ENABLE_V2 && (DO_ALL_V2 || args.has("--add-ingest-uploads")),

  repro_conditional:         ENABLE_V2 && (DO_ALL_V2 || args.has("--add-repro-conditional")),
  traditional_dosha:         ENABLE_V2 && (DO_ALL_V2 || args.has("--add-traditional-dosha")),

  goals_reminders:           ENABLE_V2 && (DO_ALL_V2 || args.has("--add-goals-reminders")),
  notes:                     ENABLE_V2 && (DO_ALL_V2 || args.has("--add-notes")),

  adv_normalize_validate:    ENABLE_V2 && (DO_ALL_V2 || args.has("--add-advanced-normalize-validate")),
  adv_calcs:                 ENABLE_V2 && (DO_ALL_V2 || args.has("--add-advanced-calcs")),
  risk_modes_flags:          ENABLE_V2 && (DO_ALL_V2 || args.has("--add-risk-modes-flags")),
  diet_filters_safety:       ENABLE_V2 && (DO_ALL_V2 || args.has("--add-diet-filters-safety")),
  climate_circadian:         ENABLE_V2 && (DO_ALL_V2 || args.has("--add-climate-context-circadian")),
  rule_engine_priority:      ENABLE_V2 && (DO_ALL_V2 || args.has("--add-rule-engine-priority")),
  repro_dosha_modifiers:     ENABLE_V2 && (DO_ALL_V2 || args.has("--add-repro-dosha-modifiers")),
  persistence_tests:         ENABLE_V2 && (DO_ALL_V2 || args.has("--add-persistence-tests")),

  plan_schemas_views:        ENABLE_V2 && (DO_ALL_V2 || args.has("--add-plan-schemas-views")),
  exporters_plus:            ENABLE_V2 && (DO_ALL_V2 || args.has("--add-exporters-plus")),
  compliance2:               ENABLE_V2 && (DO_ALL_V2 || args.has("--add-compliance-2")),
  docs_advanced:             ENABLE_V2 && (DO_ALL_V2 || args.has("--add-docs-advanced")),
  scripts_advanced:          ENABLE_V2 && (DO_ALL_V2 || args.has("--patch-scripts-advanced")),
};

const ok   = (...a)=>console.log("✅",...a);
const log  = (...a)=>console.log("🔧",...a);
const warn = (...a)=>console.warn("⚠️ ",...a);

function rel(p){ return path.relative(root,p).split(path.sep).join("/"); }
function ensureDir(p){
  if (DRY_RUN) { log("[dry-run] mkdir -p", rel(p)); return; }
  if (!fs.existsSync(p)) { fs.mkdirSync(p, { recursive: true }); log("dir +", rel(p)); }
}
function copyToBak(abs){
  const bak = abs + ".bak";
  fs.copyFileSync(abs, bak);
  warn("backup ->", rel(bak));
}
function writeSmart(abs, content){
  if (DRY_RUN) { log("[dry-run] write", rel(abs)); return "dry"; }
  const exists = fs.existsSync(abs);
  if (!exists) {
    fs.writeFileSync(abs, content, "utf8"); ok("file +", rel(abs)); return "created";
  }
  if (BACKUP_WRITE) {
    copyToBak(abs);
    fs.writeFileSync(abs, content, "utf8");
    warn("overwrote (had .bak):", rel(abs));
    return "overwrote_with_bak";
  }
  const alt = abs.replace(/(\.\w+)?$/, (m)=>`.new${m||""}`);
  fs.writeFileSync(alt, content, "utf8");
  warn("exists → wrote", rel(alt));
  return "wrote_new";
}
function patchPackageJson(updater){
  const pkgPath = path.join(root, "package.json");
  if (!fs.existsSync(pkgPath)) { warn("package.json not found; skipping script patch."); return; }
  const pkg = JSON.parse(fs.readFileSync(pkgPath,"utf8"));
  const before = JSON.stringify(pkg);
  updater(pkg);
  const after  = JSON.stringify(pkg);
  if (before!==after) {
    if (!DRY_RUN) fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8");
    ok((DRY_RUN?"[dry-run] ":"")+"patched package.json");
  } else {
    log("package.json already OK");
  }
}

/* ------------------------------------------------------------------ */
/* Project Layout Detection                                           */
/* ------------------------------------------------------------------ */

const has = (p)=>fs.existsSync(path.join(root,p));
const pagesDir    = has("src/pages") ? "src/pages" : "src";
const featuresDir = has("features")  ? "features"  : "src/features";
const functionsSrc= has("functions/src") ? "functions/src" : "functions/src";
const isTS        = has("tsconfig.json") || globHasTS();
const featuresV2 = has("features-v2") ? "features-v2" : "src/features-v2";

function globHasTS(){
  try{
    // quick peek
    return fs.existsSync(path.join(root,"src")) && fs.readdirSync(path.join(root,"src")).some(n=>n.endsWith(".ts")||n.endsWith(".tsx"));
  }catch{ return false; }
}

/* ------------------------------------------------------------------ */
/* Template Contents                                                  */
/* ------------------------------------------------------------------ */

/** ================= Compliance (non-clinical) ==================== */

const complianceGuardTS = `/* mho/compliance/ComplianceGuard.ts
 * Filters out clinical terms from plan outputs and injects disclaimers.
 * Use this on EVERY user-facing plan/report.
 */
export type PlanLike = Record<string, any>;
type Rule = { pattern: string; flags?: string; replace?: string };
type Rules = { blockedTerms: Rule[]; requiredDisclaimers: { id: string; text: string }[] };
import rulesJson from "./nonClinical.rules.json" assert { type: "json" };
import { STRINGS } from "./strings";
const RULES = rulesJson as Rules;

function redactString(s: string): string {
  return (RULES.blockedTerms||[]).reduce((acc, r) => {
    const re = new RegExp(r.pattern, r.flags || "gi");
    return acc.replace(re, r.replace ?? "[redacted]");
  }, s);
}
function redactDeep(v: any): any {
  if (typeof v === "string") return redactString(v);
  if (Array.isArray(v)) return v.map(redactDeep);
  if (v && typeof v === "object") {
    const o: any = {};
    for (const k of Object.keys(v)) o[k] = redactDeep(v[k]);
    return o;
  }
  return v;
}
export const ComplianceGuard = {
  filterPlan<T extends PlanLike>(plan: T): T {
    const filtered:any = redactDeep(plan);
    filtered.meta = filtered.meta || {};
    filtered.meta.disclaimerId = filtered.meta.disclaimerId || "standard";
    filtered.meta.disclaimerText = filtered.meta.disclaimerText || STRINGS.disclaimer.en;
    return filtered as T;
  },
  filterText(text: string){ return redactString(text); },
  disclaimer(){ return STRINGS.disclaimer.en; }
};`;

const nonClinicalRulesJSON = `{
  "blockedTerms": [
    { "pattern": "\\\\b(dose|dosage|mg|mcg|tablet|capsule|titrate|bid|tid|qid)\\\\b" },
    { "pattern": "\\\\b(treat|cure|manage|therapy|contraindicated|diagnose|prescribe|prescription)\\\\b" },
    { "pattern": "\\\\b(diabetes|ckd|chronic kidney|renal|hypertension|bp|thyroid|pcod|pcos|asthma)\\\\b" },
    { "pattern": "\\\\b(targets?\\\\s*[:<=>])|\\\\b(k\\\\+|potassium|creatinine|hba1c|ldl|hdl|triglycerides)\\\\b" },
    { "pattern": "\\\\b(metformin|insulin|losartan|amlodipine|statin|atorvastatin|vitamin\\\\s*[a-z])\\\\b" }
  ],
  "requiredDisclaimers": [
    { "id": "standard", "text": "GloWell shares general wellness suggestions only. It is not medical advice and does not replace your doctor." }
  ]
}`;

const complianceStringsTS = `/* mho/compliance/strings.ts */
export const STRINGS = {
  disclaimer: {
    en: "GloWell shares general wellness suggestions only. It is not medical advice and does not replace your doctor.",
    hi: "GloWell केवल सामान्य वेलनेस सुझाव साझा करता है। यह चिकित्सीय सलाह नहीं है।"
  },
  banners: {
    seekCare: {
      en: "If you feel unwell or worried, please speak to a qualified professional.",
      hi: "यदि आप अस्वस्थ महसूस कर रहे हैं, तो कृपया किसी योग्य पेशेवर से संपर्क करें।"
    }
  }
};`;

const redFlagsJSON = `{
  "symptomCombos": [
    { "any": ["chest_pain","fainting","shortness_of_breath"], "action": "suppress_plan_and_banner" },
    { "any": ["severe_dizziness","vision_changes"], "action": "banner_only" }
  ]
}`;

/** ================= Plan & Engine (Core) ========================= */

const planSchemaTS = `/* mho/plan/schema.ts */
export type Plan = {
  meta: {
    generatedAtISO: string;
    locale: "en"|"hi";
    version: "v1";
    disclaimerId: "standard";
    disclaimerText?: string;
  };
  day: {
    wake: string;
    sleep: string;
    hydration: { schedule: string[]; notes: string[] };
    meals: Array<{ label:"Breakfast"|"Mid-morning"|"Lunch"|"Evening"|"Dinner"; ideas:string[]; avoid:string[]; portion_hint?:string }>;
    movement: { blocks: string[]; notes: string[] };
    mind: { practices: string[] };
  };
  educationNotes: string[];
  redFlags?: string[];
  shareables: { whatsappText: string };
};`;

const engineNormalizeTS = `/* mho/engine/normalize.ts */
export function normalize(form: any) {
  // normalize units / enums / times here (copy-paste friendly)
  return { ...form };
}`;

const engineProcessFormTS = `/* mho/engine/processForm.ts
 * Build a NON-CLINICAL plan from normalized data + neutral tags.
 */
import type { Plan } from "../plan/schema";
import { normalize } from "./normalize";

export async function buildPlan(formData: any): Promise<Plan> {
  const f = normalize(formData);
  const now = new Date().toISOString();

  const plan: Plan = {
    meta: { generatedAtISO: now, locale: f?.locale || "en", version: "v1", disclaimerId: "standard" },
    day: {
      wake: f?.schedule?.wake || "06:30",
      sleep: f?.schedule?.sleep || "22:30",
      hydration: {
        schedule: ["07:00","10:00","13:00","16:00","19:00"],
        notes: ["Sip regularly through the day."]
      },
      meals: [
        { label: "Breakfast",    ideas: ["Light, home-cooked options"], avoid: ["Very oily, very salty"] },
        { label: "Mid-morning",  ideas: ["Fruit or nuts"],              avoid: ["Heavy fried snacks"] },
        { label: "Lunch",        ideas: ["Balanced plate, vegetables"], avoid: ["Overly spicy, very salty"] },
        { label: "Evening",      ideas: ["Light snack if hungry"],      avoid: ["Deep-fried"] },
        { label: "Dinner",       ideas: ["Earlier, lighter dinner"],    avoid: ["Very late, heavy meals"] }
      ],
      movement: { blocks: ["Short relaxed walk (10–20 min)"], notes: ["Listen to your body."] },
      mind:     { practices: ["2–5 min calm breathing", "Gratitude note"] }
    },
    educationNotes: [
      "Prefer home-cooked, lightly seasoned meals.",
      "Keep a consistent sleep-wake schedule."
    ],
    shareables: { whatsappText: "Daily wellness plan: hydration sips, light meals, gentle walk, early sleep. (Non-clinical guidance)" }
  };

  // You can branch on neutral tags (culture, climate, problems/symptoms) here.

  return plan;
}`;

const engineSafeGenerateTS = `/* mho/engine/safeGenerate.ts */
import { ComplianceGuard } from "../compliance/ComplianceGuard";
import type { Plan } from "../plan/schema";
import { buildPlan } from "./processForm";

export async function generateSafePlan(formData:any): Promise<Plan>{
  const raw = await buildPlan(formData);
  return ComplianceGuard.filterPlan(raw as unknown as Plan);
}`;

/** ================= Health Form (schema + UI) ==================== */

const healthFormSchemaJSON = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "GloWell Health Form (Non-Clinical)",
  "type": "object",
  "properties": {
    "locale": { "type": "string", "enum": ["en","hi"] },
    "profile": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "age": { "type": "number", "minimum": 0, "maximum": 120 },
        "sex": { "type": "string", "enum": ["male","female","other"] }
      },
      "additionalProperties": true
    },
    "lifestyle": {
      "type": "object",
      "properties": {
        "dietType": { "type": "string", "enum": ["vegan","veg","eggetarian","pescatarian","non-veg","mixed"] },
        "religion": { "type": "string", "enum": ["", "jain", "sattvic", "halal", "kosher"] },
        "allergies": { "type": "array", "items": { "type": "string" } },
        "preferences": { "type": "array", "items": { "type": "string" } }
      },
      "additionalProperties": true
    },
    "schedule": {
      "type": "object",
      "properties": {
        "wake": { "type": "string", "pattern": "^[0-2][0-9]:[0-5][0-9]$" },
        "sleep": { "type": "string", "pattern": "^[0-2][0-9]:[0-5][0-9]$" }
      },
      "additionalProperties": true
    },
    "problems": {
      "type": "array",
      "description": "Any known conditions (self-reported; purely informational).",
      "items": { "type": "string" }
    },
    "symptoms": {
      "type": "array",
      "description": "Current problems/symptoms in your own words.",
      "items": { "type": "string" }
    },
    "uploads": {
      "type": "object",
      "properties": {
        "prescriptions": { "type": "array", "items": { "type": "string", "description": "storage path/URL" } },
        "labReports":    { "type": "array", "items": { "type": "string" } },
        "otherDocs":     { "type": "array", "items": { "type": "string" } }
      },
      "additionalProperties": true
    },
    "goals": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["lifestyle"],
  "additionalProperties": true
}`;

const healthFormUItsx = `/* ${featuresDir}/health-plan/MultiStepHealthForm.tsx
 * Minimal, copy-paste friendly 5-step form skeleton
 * Steps: Basics -> Lifestyle -> Schedule -> Problems/Symptoms -> Uploads -> Review
 */
import React, { useState } from "react";

type FormData = any;

const Step = ({children}:{children:React.ReactNode}) => (
  <div className="p-4 border rounded-md space-y-4">{children}</div>
);

export default function MultiStepHealthForm({onSubmit}:{onSubmit:(data:FormData)=>void}){
  const [step,setStep]=useState(0);
  const [data,setData]=useState<FormData>({ locale:"en", lifestyle:{}, schedule:{}, problems:[], symptoms:[], uploads:{} });

  const next = ()=> setStep(s=>Math.min(s+1,5));
  const prev = ()=> setStep(s=>Math.max(s-1,0));
  const done = ()=> onSubmit(data);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">GloWell Health Form (Non-Clinical)</h2>

      {step===0 && <Step>
        <h3 className="font-medium">Basics</h3>
        <label className="block">Name <input className="border px-2 py-1 w-full" onChange={e=>setData({...data, profile:{...(data.profile||{}), name:e.target.value}})} /></label>
        <label className="block">Age <input type="number" className="border px-2 py-1 w-full" onChange={e=>setData({...data, profile:{...(data.profile||{}), age:+e.target.value}})} /></label>
        <label className="block">Sex
          <select className="border px-2 py-1 w-full" onChange={e=>setData({...data, profile:{...(data.profile||{}), sex:e.target.value}})}>
            <option value="">Select</option><option>male</option><option>female</option><option>other</option>
          </select>
        </label>
      </Step>}

      {step===1 && <Step>
        <h3 className="font-medium">Lifestyle</h3>
        <label className="block">Diet Type
          <select className="border px-2 py-1 w-full" onChange={e=>setData({...data, lifestyle:{...(data.lifestyle||{}), dietType:e.target.value}})}>
            <option value="">Select</option><option>vegan</option><option>veg</option><option>eggetarian</option><option>pescatarian</option><option>non-veg</option><option>mixed</option>
          </select>
        </label>
        <label className="block">Religion
          <select className="border px-2 py-1 w-full" onChange={e=>setData({...data, lifestyle:{...(data.lifestyle||{}), religion:e.target.value}})}>
            <option value="">None</option><option>jain</option><option>sattvic</option><option>halal</option><option>kosher</option>
          </select>
        </label>
      </Step>}

      {step===2 && <Step>
        <h3 className="font-medium">Schedule</h3>
        <label className="block">Wake (HH:MM) <input className="border px-2 py-1 w-full" placeholder="06:30" onChange={e=>setData({...data, schedule:{...(data.schedule||{}), wake:e.target.value}})} /></label>
        <label className="block">Sleep (HH:MM) <input className="border px-2 py-1 w-full" placeholder="22:30" onChange={e=>setData({...data, schedule:{...(data.schedule||{}), sleep:e.target.value}})} /></label>
      </Step>}

      {step===3 && <Step>
        <h3 className="font-medium">Problems & Symptoms (Non-Clinical)</h3>
        <label className="block">Known problems (comma separated)
          <input className="border px-2 py-1 w-full" onChange={e=>setData({...data, problems:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)})} />
        </label>
        <label className="block">Current symptoms (comma separated)
          <input className="border px-2 py-1 w-full" onChange={e=>setData({...data, symptoms:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)})} />
        </label>
      </Step>}

      {step===4 && <Step>
        <h3 className="font-medium">Uploads</h3>
        <p className="text-sm opacity-70">Upload doctor prescriptions, lab/blood reports, or other health docs. Used only to shape neutral wellness suggestions. Not medical advice.</p>
        <input type="file" multiple />
        {/* Wire to your storage service; save paths into data.uploads */}
      </Step>}

      {step===5 && <Step>
        <h3 className="font-medium">Review & Consent</h3>
        <p className="text-sm">By submitting, you agree this app shares general wellness suggestions only (non-clinical).</p>
        <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">{JSON.stringify(data,null,2)}</pre>
      </Step>}

      <div className="flex gap-2">
        <button className="px-3 py-1 border rounded" onClick={prev} disabled={step===0}>Back</button>
        {step<5 ? <button className="px-3 py-1 border rounded" onClick={next}>Next</button> :
          <button className="px-3 py-1 border rounded bg-black text-white" onClick={done}>Submit</button>}
      </div>
    </div>
  );
}
`;

const planViewTSX = `/* ${pagesDir}/PlanView.tsx */
import React from "react";
export default function PlanView({plan}:{plan:any}){
  const d = plan?.day || {};
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Your Daily Wellness Plan</h2>
      <p className="text-sm opacity-70">{plan?.meta?.disclaimerText || "Non-clinical general wellness suggestions."}</p>
      <div className="grid md:grid-cols-2 gap-4">
        <section className="p-3 border rounded">
          <h3 className="font-medium mb-2">Hydration</h3>
          <ul className="list-disc pl-5">{(d.hydration?.schedule||[]).map((t:string,i:number)=><li key={i}>{t}</li>)}</ul>
          <div className="text-sm opacity-70">{(d.hydration?.notes||[]).join(" • ")}</div>
        </section>
        <section className="p-3 border rounded">
          <h3 className="font-medium mb-2">Movement</h3>
          <ul className="list-disc pl-5">{(d.movement?.blocks||[]).map((b:string,i:number)=><li key={i}>{b}</li>)}</ul>
          <div className="text-sm opacity-70">{(d.movement?.notes||[]).join(" • ")}</div>
        </section>
        <section className="p-3 border rounded md:col-span-2">
          <h3 className="font-medium mb-2">Meals</h3>
          <ul className="list-disc pl-5">
            {(d.meals||[]).map((m:any,i:number)=><li key={i}><b>{m.label}:</b> {(m.ideas||[]).join(", ")} <i className="opacity-70">(avoid: {(m.avoid||[]).join(", ")})</i></li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}`;

/** ================= Uploads Pipeline ============================ */

const ocrTS = `/* mho/engine/extractors/ocr.ts */ export async function ocr(_p:string){ return ""; }`;
const classifyTS = `/* mho/engine/extractors/classify.ts */ export type DocType="prescription"|"lab"|"discharge"|"other"; export function classify(t:string):DocType{ t=t.toLowerCase(); if(t.includes("glucose")||t.includes("hemoglobin")) return "lab"; if(t.includes("rx")||t.includes("sig")) return "prescription"; if(t.includes("discharge")) return "discharge"; return "other"; }`;
const labParserTS = `/* mho/engine/extractors/labParser.ts */ export function labParser(t:string){ const L=t.toLowerCase(); const riskTags:string[]=[]; const notes:string[]=[]; if(L.includes("potassium")) riskTags.push("avoid_very_salty"); return {riskTags, cautionNotes:notes}; }`;
const rxParserTS = `/* mho/engine/extractors/rxParser.ts */ export function rxParser(_t:string){ return {riskTags:["keep_consistent_meal_times"], cautionNotes:[]}; }`;
const dischargeParserTS = `/* mho/engine/extractors/dischargeParser.ts */ export function dischargeParser(_t:string){ return {riskTags:["rest_priority","gentle_movement_only"], cautionNotes:[]}; }`;

const uploadsManagerTSX = `/* ${featuresDir}/uploads/UploadsManager.tsx */
import React, { useState } from "react";
export default function UploadsManager(){
  const [files,setFiles]=useState<File[]>([]);
  return (<div className="p-4 space-y-3">
    <h2 className="text-xl font-semibold">Health Documents</h2>
    <input type="file" multiple onChange={e=>setFiles(Array.from(e.target.files||[]))}/>
    <ul className="list-disc pl-5">{files.map((f,i)=><li key={i}>{f.name}</li>)}</ul>
    <p className="text-sm opacity-70">Uploads help shape neutral wellness suggestions. Not medical advice.</p>
  </div>);
}`;

const uploadsConsentTSX = `/* ${featuresDir}/uploads/UploadsConsent.tsx */
import React from "react";
export default function UploadsConsent(){
  return (<div className="p-4 space-y-2">
    <h3 className="font-medium">Consent for Using Uploads</h3>
    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked/> Allow using uploads to adjust suggestions</label>
    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked/> Store uploads for later reference</label>
    <label className="flex items-center gap-2">Auto-delete after <input className="border px-2 py-1 w-16" defaultValue={90}/> days</label>
  </div>);
}`;

const uploadServiceTS = `/* services/storage/uploadService.ts */
export async function uploadFile(file: File, dest: string){ return { path: dest }; }
export async function deleteFile(_path: string){ /* delete */ }
export async function getSignedUrl(path: string){ return path; }`;

const fnUploadsIngestTS = `/* ${functionsSrc}/uploadsIngest.ts */
export async function uploadsIngest(storagePath:string){
  // 1) OCR -> text  2) classify  3) parse to neutral tags  4) store tags JSON (internal only)
}`;

const fnCleanupUploadsTS = `/* ${functionsSrc}/cleanupUploads.ts */
export async function cleanupUploads(){
  // delete old uploads by retention policy
}`;

/** ================= Trackers ==================================== */

const trackerDashboardTSX = `/* ${featuresDir}/tracker/TrackerDashboard.tsx */
import React from "react";
export default function TrackerDashboard(){
  return (<div className="p-4 grid gap-4 md:grid-cols-2">
    <div className="p-4 border rounded">Hydration (trend)</div>
    <div className="p-4 border rounded">Sleep (trend)</div>
    <div className="p-4 border rounded">Mood (trend)</div>
    <div className="p-4 border rounded">Menstrual/Vitals (logs)</div>
  </div>);
}`;

/** ================= Exporters =================================== */

const exportersPDFTS = `/* mho/plugins/exporters/pdf.ts */
import { ComplianceGuard } from "../../compliance/ComplianceGuard";
export async function exportPlanPDF(plan:any){
  const safe = ComplianceGuard.filterPlan(plan);
  // Replace with real pdf-lib; keeping a JSON blob for now:
  return new Blob([JSON.stringify(safe,null,2)],{type:"application/pdf"});
}`;

const exportersExcelTS = `/* mho/plugins/exporters/excel.ts */
import { ComplianceGuard } from "../../compliance/ComplianceGuard";
export async function exportPlanExcel(plan:any){
  const safe = ComplianceGuard.filterPlan(plan);
  const csv = "Disclaimer," + JSON.stringify(safe.meta?.disclaimerText||"") + "\\n";
  return new Blob([csv],{type:"text/csv"});
}`;

const exportersWhatsAppTS = `/* mho/plugins/exporters/whatsapp.ts */
import { ComplianceGuard } from "../../compliance/ComplianceGuard";
export function buildWhatsAppText(plan:any){
  const safe = ComplianceGuard.filterPlan(plan);
  return safe?.shareables?.whatsappText || "Daily wellness suggestions (non-clinical).";
}`;

/** ================= Lint & Docs & Prompts ======================= */

const nonclinicalLintCJS = `/* scripts/nonclinical-lint.cjs */
const fs=require("fs"), path=require("path");
const rulesPath=path.join(process.cwd(),"mho","compliance","nonClinical.rules.json");
if(!fs.existsSync(rulesPath)){ console.log("nonClinical.rules.json not found. Skip."); process.exit(0); }
const rules=JSON.parse(fs.readFileSync(rulesPath,"utf8"));
const patterns=(rules.blockedTerms||[]).map(r=>new RegExp(r.pattern, r.flags||"gi"));
function walk(d){ const out=[]; for(const e of fs.readdirSync(d,{withFileTypes:true})) {
  const p=path.join(d,e.name); if(e.isDirectory()) out.push(...walk(p));
  else if(/\.(ts|tsx|js|jsx|md|txt|json)$/i.test(e.name)) out.push(p);
} return out;}
const roots=["src","mho"].filter(r=>fs.existsSync(r));
let bad=false;
for(const r of roots){ for(const f of walk(path.join(process.cwd(),r))){
  const txt=fs.readFileSync(f,"utf8"); for(const re of patterns){ if(re.test(txt)){ console.error("Clinical term in:",f); bad=true; } }
}}
process.exit(bad?1:0);`;

const docsReadme = `# GloWell Blueprint (Detailed)
This repo uses a non-clinical wellness architecture. You may collect problems/symptoms and uploads (prescriptions/reports), process them internally, but **never** output clinical advice.
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
\`\`\`ts
import { generateSafePlan } from "mho/engine/safeGenerate";
const plan = await generateSafePlan(formData);
\`\`\`
- Render Plan:
\`\`\`tsx
import PlanView from "@/pages/PlanView";
<PlanView plan={plan}/>
\`\`\`
- Export:
\`\`\`ts
import { exportPlanPDF } from "mho/plugins/exporters/pdf";
\`\`\`
## Legal
GloWell provides general wellness suggestions only; not medical advice.`;

const docsMigration = `# Migration Steps
1) Commit your current repo.
2) Run: \`node install_universal_blueprint.mjs\`
3) Review any \`.new\` files and merge.
4) Wire submit handler to \`generateSafePlan\`.
5) Add Uploads components if needed.
6) Run lint: \`npm run glowell:lint:nonclinical\`
7) Export a test PDF and verify disclaimer text.`;

const docsPromptPack = `# Prompt Pack (Copy-Paste)
1) "Act as a senior app architect. I have a non-clinical wellness app. Given my form schema below, propose a React form component and a TypeScript validator."
2) "Extend my HealthForm so that on submit it calls processForm.ts, validates inputs, and saves results in Firebase."
3) "Given this plan JSON shape, generate a PlanView with Tailwind, and a button to export PDF."
4) "Write a Firebase Function that runs OCR on uploaded files and returns a neutral \`riskTags\` array."
5) "Add a WhatsApp share text builder for the plan, respecting ComplianceGuard."
6) "Scan my code for clinical terms and fix them to neutral phrasing."
7) "Refactor my \`normalize.ts\` to handle time zone offsets and unit conversions."
8) "Create an \`UploadManager\` that uploads files to Firebase Storage and saves signed URLs."
9) "Style the MultiStepHealthForm with a green/beige theme and accessible labels."
10) "Write unit tests that validate nonclinical redaction rules against sample strings."`;

/** ================= Compliance v2 (namespaced) =================== */

const compliance2TS = `/* mho2/compliance/ComplianceGuard2.ts
 * Redacts clinical wording and injects non-clinical disclaimers (v2 namespace).
 */
export type AnyObj = Record<string, any>;
type Rule = { pattern: string; flags?: string; replace?: string };
type Rules = { blockedTerms: Rule[]; requiredDisclaimers: { id: string; text: string }[] };
import rulesJson from "./nonClinical.v2.rules.json" assert { type: "json" };
import { STRINGS2 } from "./strings2";
const RULES = rulesJson as Rules;

function redactString(s: string): string {
  return (RULES.blockedTerms||[]).reduce((acc, r) => {
    const re = new RegExp(r.pattern, r.flags || "gi");
    return acc.replace(re, r.replace ?? "[redacted]");
  }, s);
}
function redactDeep(v: any): any {
  if (typeof v === "string") return redactString(v);
  if (Array.isArray(v)) return v.map(redactDeep);
  if (v && typeof v === "object") {
    const out: AnyObj = {};
    for (const k of Object.keys(v)) out[k] = redactDeep(v[k]);
    return out;
  }
  return v;
}
export const ComplianceGuard2 = {
  filter<T extends AnyObj>(o: T): T {
    const f:any = redactDeep(o);
    f.meta = f.meta || {};
    f.meta.disclaimerId = f.meta.disclaimerId || "standard_v2";
    f.meta.disclaimerText = f.meta.disclaimerText || STRINGS2.disclaimer.en;
    return f as T;
  },
  disclaimer(){ return STRINGS2.disclaimer.en; }
};`;

const compliance2RulesJSON = {
  "blockedTerms": [
    { "pattern": "\\\\b(diagnose|prescribe|therapy|dose|dosage|mg|contraindicated)\\\\b" },
    { "pattern": "\\\\b(diabetes|renal|ckd|hypertension|bp|hba1c|ldl|hdl|triglycerides|potassium|creatinine)\\\\b" }
  ],
  "requiredDisclaimers": [
    { "id": "standard_v2", "text": "This app shares general wellness suggestions only. It is not medical advice." }
  ]
};

const compliance2StringsTS = `/* mho2/compliance/strings2.ts */
export const STRINGS2 = {
  disclaimer: {
    en: "This app shares general wellness suggestions only. It is not medical advice.",
    hi: "यह ऐप केवल सामान्य वेलनेस सुझाव साझा करता है। यह चिकित्सीय सलाह नहीं है।"
  }
};`;

/** ================= Advanced Engine v2 (namespaced) ============== */

const v2TypesTS = `/* mho2/engine-v2/types.ts */
export type TimeHHmm = string;
export type ISODate = string;

export type IntakeProfile = {
  account?: { fullName?: string; email?: string; };
  localization?: { language?: string; timezone?: string; units?: "metric"|"imperial" };
  demographics?: { dob?: ISODate; age?: number; sex?: "male"|"female"|"intersex/other"|"prefer_not_to_say"; gender?: string; country?: string; region?: string; city?: string; };
  environment?: { locationType?: "city"|"town"|"village"|"coastal"|"hilly"; climateSeason?: string; aqiSensitivity?: boolean };
};
export type ScheduleBlock = { start: TimeHHmm; end: TimeHHmm; label?: string };
export type IntakeSchedule = {
  wakeTime?: TimeHHmm; sleepTime?: TimeHHmm;
  workPattern?: "day_shift"|"night_shift"|"rotating"|"mixed_other";
  workOrSchoolBlocks?: ScheduleBlock[];
  routineVariations?: Record<string, any>;
  sleepQuality?: number; stressLevel?: number;
};
export type BodyActivity = {
  heightCm?: number; weightKg?: number;
  activityLevel?: "sedentary"|"light"|"moderate"|"active"|"very_active";
  recentActivitySample?: { type?: string; durationMin?: number; caloriesKcal?: number };
};
export type NutritionCulture = {
  dietType?: "vegetarian"|"eggetarian"|"pescatarian"|"non_vegetarian"|"vegan"|"mixed"|"other";
  culturalRules?: ("jain"|"sattvic"|"halal"|"kosher"|"none"|"other")[];
  allergies?: string[]; dislikes?: string[]; preferences?: string[];
  cuisineTags?: string[]; fastingPatterns?: string[];
};
export type MealsHydration = {
  mealsPerDay?: number;
  mealTimes?: { breakfast?: TimeHHmm; lunch?: TimeHHmm; snack?: TimeHHmm; dinner?: TimeHHmm };
  waterIntakeLPerDay?: number;
};
export type KitchenBudget = { kitchenTools?: string[]; cookingSkills?: string; pantryBasics?: string[]; budgetTier?: "low"|"mid"|"high" };
export type MedicalBundle = {
  conditions?: string[]; symptoms?: string[];
  medications?: { name:string; dosage?:string; frequency?:string; notes?:string }[];
  disabilitiesOrMobilityLimits?: string[];
};
export type LabsVitals = {
  bp?: { systolic?: number; diastolic?: number }; pulseHr?: number;
  glucoseFasting?: number; glucosePostPrandial?: number; hba1c?: number;
  cholesterolTotal?: number; ldl?: number; hdl?: number; triglycerides?: number;
  creatinine?: number; potassium?: number; sodium?: number; tsh?: number; vitaminB12?: number; vitaminD?: number;
  lastTestDate?: ISODate; weightMeasurementDate?: ISODate;
};
export type ReproBundle = {
  menstrualStatus?: "regular"|"irregular"|"menopause";
  cycleDates?: Record<string, ISODate>;
  pregnant?: boolean; trimester?: 1|2|3; lmpDate?: ISODate;
};
export type DoshaBundle = { doshaType?: "vata"|"pitta"|"kapha"|"mixed"; doshaScores?: { vata?:number; pitta?:number; kapha?:number } };
export type GoalsReminders = {
  primaryGoal?: "general_wellness"|"weight_loss"|"muscle_gain"|"heart_health"|"bp_control"|"sugar_control"|"kidney_safe"|"sleep"|"stress"|"hydration"|"energy"|"custom";
  secondaryGoals?: string[]; goalTitle?: string; goalCurrentValue?: number; goalTargetValue?: number; goalStartDate?: ISODate; goalEndDate?: ISODate;
  remindersEnabled?: boolean; reminderTime?: TimeHHmm;
};
export type NotesOnly = { userNotes?: string };

export type IntakeV2 = {
  profile?: IntakeProfile;
  schedule?: IntakeSchedule;
  body?: BodyActivity;
  nutrition?: NutritionCulture;
  meals?: MealsHydration;
  kitchen?: KitchenBudget;
  medical?: MedicalBundle;
  labs?: LabsVitals;
  repro?: ReproBundle;
  dosha?: DoshaBundle;
  goals?: GoalsReminders;
  notes?: NotesOnly;
};`;

const v2NormalizeTS = `/* mho2/engine-v2/normalize.ts */
import type { IntakeV2 } from "./types";

export function normalizeV2(input:any): IntakeV2 {
  const v = { ...(input||{}) };
  const out: IntakeV2 = v;
  out.meals = out.meals || {};
  if (out.meals.mealsPerDay==null) out.meals.mealsPerDay = 4;
  return out;
}`;

/** A strict, plain-English cross-field validator */
const v2ValidateTS = `/* mho2/engine-v2/validate.ts */
import type { IntakeV2 } from "./types";

export type ValidationIssue = { path: string; message: string };

export function validateV2(i: IntakeV2): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const w = i?.schedule?.wakeTime, s = i?.schedule?.sleepTime;
  if (w && s && w===s) issues.push({ path: "schedule.sleepTime", message: "Sleep time must differ from wake time." });
  const mpd = i?.meals?.mealsPerDay;
  if (mpd!=null && (mpd<3 || mpd>6)) issues.push({ path:"meals.mealsPerDay", message:"Meals per day should be 3–6." });
  const h = i?.body?.heightCm;
  if (h!=null && (h<50||h>250)) issues.push({ path:"body.heightCm", message:"Height must be 50–250 cm." });
  const wkg = i?.body?.weightKg;
  if (wkg!=null && (wkg<10||wkg>350)) issues.push({ path:"body.weightKg", message:"Weight must be 10–350 kg." });
  if (i?.repro?.pregnant && !i?.repro?.trimester) issues.push({ path:"repro.trimester", message:"Trimester is required if pregnant." });
  if (i?.goals?.goalEndDate && i?.goals?.goalStartDate && (new Date(i.goals.goalEndDate) < new Date(i.goals.goalStartDate))){
    issues.push({ path:"goals.goalEndDate", message:"End date must be after start date." });
  }
  return issues;
}`;

/** Neutral calculations */
const v2CalcsTS = `/* mho2/engine-v2/calcs.ts */
export function bmi(weightKg:number, heightCm:number){
  if(!weightKg||!heightCm) return null;
  const m=heightCm/100;
  return +(weightKg/(m*m)).toFixed(1);
}
export function bmrMifflin(sex:string, age:number, heightCm:number, weightKg:number){
  if([age,heightCm,weightKg].some(v=>v==null)) return null;
  const base = 10*weightKg + 6.25*heightCm - 5*age;
  return (sex==="male") ? base + 5 : base - 161;
}
export function tdee(bmr:number|null, activity:"sedentary"|"light"|"moderate"|"active"|"very_active"){
  if(!bmr) return null;
  const map:any={sedentary:1.2,light:1.375,moderate:1.55,active:1.725,very_active:1.9};
  return +(bmr*(map[activity]||1.2)).toFixed(0);
}`;

/** Modes/flags demo */
const v2ModesTS = `/* mho2/engine-v2/modes.ts */
import type { IntakeV2 } from "./types";

export type ModeFlags = {
  lowGlycemic?:boolean;
  lowSodium?:boolean;
  lowPotassium?:boolean;
  minor?:boolean;
  pregnancy?:boolean;
};

export function computeModes(i: IntakeV2): ModeFlags {
  const m: ModeFlags = {};
  const age = i?.profile?.demographics?.age;
  if (typeof age==="number" && age<18) m.minor = true;
  if (i?.repro?.pregnant) m.pregnancy = true;
  if ((i?.medical?.conditions||[]).some(c=>/sugar|glyc/i.test(c))) m.lowGlycemic = true;
  if ((i?.medical?.conditions||[]).some(c=>/bp|pressure|salt/i.test(c))) m.lowSodium = true;
  if ((i?.medical?.conditions||[]).some(c=>/kidney|renal|potassium/i.test(c))) m.lowPotassium = true;
  return m;
}`;

/** Plan schema + safe builder */
const v2PlanSchemaTS = `/* mho2/plan-v2/schema.ts */
export type PlanV2 = {
  meta: {
    generatedAtISO: string;
    locale: "en"|"hi";
    version:"v2";
    disclaimerId:"standard_v2";
    disclaimerText?:string;
  };
  day: {
    wake: string;
    sleep: string;
    hydration: { schedule: string[]; notes: string[]; };
    meals: Array<{ label:string; ideas:string[]; avoid:string[]; tags?:string[] }>;
    movement: { blocks: string[]; notes: string[]; };
    mind: { practices: string[] };
  };
  rationale: string[];
  variants?: any[];
  shareables?: { whatsappText?: string };
};`;

const v2BuildPlanTS = `/* mho2/engine-v2/buildPlan.ts */
import type { IntakeV2 } from "./types";
import type { PlanV2 } from "../plan-v2/schema";

export function buildNeutralPlanV2(i: IntakeV2): PlanV2 {
  const now = new Date().toISOString();
  const wake = i?.schedule?.wakeTime || "06:30";
  const sleep= i?.schedule?.sleepTime || "22:30";
  return {
    meta: { generatedAtISO: now, locale: (i?.profile?.localization?.language==="hi"?"hi":"en"), version:"v2", disclaimerId:"standard_v2" },
    day: {
      wake, sleep,
      hydration: { schedule: ["07:00","10:00","13:00","16:00","19:00"], notes: ["Sip regularly across the day."] },
      meals: [
        { label:"Breakfast", ideas:["Light, home-style options"], avoid:["Very oily"], tags:["light"] },
        { label:"Mid-morning", ideas:["Whole fruit / handful nuts"], avoid:["Deep-fried"], tags:["snack"] },
        { label:"Lunch", ideas:["Balanced plate, seasonal veg"], avoid:["Overly salty"], tags:["main"] },
        { label:"Evening", ideas:["Simple snack if hungry"], avoid:["Heavy fried"], tags:["snack"] },
        { label:"Dinner", ideas:["Earlier & lighter dinner"], avoid:["Very late meals"], tags:["main"] }
      ],
      movement: { blocks:["Easy walk (10–20 min)"], notes:["Move at a comfortable pace."] },
      mind: { practices:["2–5 min calm breathing","Gratitude note"] }
    },
    rationale: ["Neutral day structure with hydration, balanced meals, gentle movement."]
  };
}`;

/** Safe generate wrapper */
const v2SafeGenerateTS = `/* mho2/engine-v2/safeGenerate.ts */
import { ComplianceGuard2 } from "../compliance/ComplianceGuard2";
import type { IntakeV2 } from "./types";
import { normalizeV2 } from "./normalize";
import { validateV2 } from "./validate";
import { buildNeutralPlanV2 } from "./buildPlan";
import type { PlanV2 } from "../plan-v2/schema";

export function generateSafePlanV2(input:any): { plan: PlanV2|null; issues: {path:string;message:string}[] } {
  const norm = normalizeV2(input);
  const issues = validateV2(norm);
  if (issues.length) return { plan: null, issues };
  const raw = buildNeutralPlanV2(norm);
  const safe = ComplianceGuard2.filter(raw);
  return { plan: safe, issues: [] };
}`;

/** ================= Gorgeous UI (Tailwind, accessible) ========== */

/* Health Form (Multi-step, elegant cards, progress) */
const prettyFormTSX = `/* \${featuresV2}/health-plan-advanced/PrettyHealthFormV2.tsx
Beautiful multi-step form (neutral, non-clinical)
Big cards, soft shadows, rounded-2xl, gradient header
Step progress with icons, keyboard-accessible controls
Minimal dependencies: React + TailwindCSS */
import React, { useMemo, useState } from "react";
type Any = any;
const steps = [
  { key:"profile", title:"Profile", desc:"Your basic details & locale" },
  { key:"lifestyle",title:"Lifestyle", desc:"Diet, culture, preferences" },
  { key:"schedule", title:"Schedule", desc:"Wake, sleep & work blocks" },
  { key:"medical", title:"Health Info",desc:"Conditions, symptoms (optional)" },
  { key:"uploads", title:"Uploads", desc:"Reports/notes (optional)" },
  { key:"review", title:"Review", desc:"Confirm & generate" }
];

function Card({children}:{children:React.ReactNode}) {
  return <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-lg border border-gray-100">{children}</div>;
}
function Label({children}:{children:React.ReactNode}){ return <label className="text-sm font-medium text-gray-700">{children}</label>; }
function Input(props: React.InputHTMLAttributes<HTMLInputElement>){ return <input {...props} className={"mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 "+(props.className||"")} />; }
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>){ return <select {...props} className={"mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 "+(props.className||"")} />; }

export default function PrettyHealthFormV2({onSubmit}:{onSubmit:(data:Any)=>void}){
  const [step,setStep]=useState(0);
  const [data,setData]=useState<any>({
    profile:{ localization:{ language:"en" } },
    nutrition:{}, schedule:{}, medical:{}, uploads:{}, meals:{},
  });
  const pct = useMemo(()=>Math.round((step/(steps.length-1))*100),[step]);
  const next=()=>setStep(s=>Math.min(s+1, steps.length-1));
  const prev=()=>setStep(s=>Math.max(s-1, 0));
  const submit=()=>onSubmit(data);

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="text-center">
          <h1 className="text-2xl md:text-3xl font-semibold text-emerald-900">Wellness Intake (V2)</h1>
          <p className="text-gray-600 mt-1">Neutral, non-clinical. Helps tailor general wellness suggestions.</p>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
            <div className="h-2 bg-emerald-400 transition-all" style={{width:\`\${pct}%\`}}/>
          </div>
          <div className="mt-2 text-xs text-gray-500">{steps[step].title} • {steps[step].desc}</div>
        </header>

        {/* Step Content */}
        <Card>
          {step===0 && <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input placeholder="Your name" onChange={e=>setData({...data, profile:{...(data.profile||{}), account:{...(data.profile?.account||{}), fullName:e.target.value}})}/>
            </div>
            <div>
              <Label>Language</Label>
              <Select defaultValue="en" onChange={e=>setData({...data, profile:{...(data.profile||{}), localization:{...(data.profile?.localization||{}), language:e.target.value}})}>
                <option value="en">English</option><option value="hi">हिन्दी</option>
              </Select>
            </div>
            <div>
              <Label>Country</Label>
              <Input placeholder="India" onChange={e=>setData({...data, profile:{...(data.profile||{}), demographics:{...(data.profile?.demographics||{}), country:e.target.value}})}/>
            </div>
            <div>
              <Label>City</Label>
              <Input placeholder="Ahmedabad" onChange={e=>setData({...data, profile:{...(data.profile||{}), demographics:{...(data.profile?.demographics||{}), city:e.target.value}})}/>
            </div>
          </div>}

          {step===1 && <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Diet Type</Label>
              <Select onChange={e=>setData({...data, nutrition:{...(data.nutrition||{}), dietType:e.target.value}})}>
                <option value="">Select</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="eggetarian">Eggetarian</option>
                <option value="pescatarian">Pescatarian</option>
                <option value="non_vegetarian">Non-vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="mixed">Mixed</option>
              </Select>
            </div>
            <div>
              <Label>Allergies (comma separated)</Label>
              <Input placeholder="peanut, milk" onChange={e=>setData({...data, nutrition:{...(data.nutrition||{}), allergies:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}})}/>
            </div>
            <div className="md:col-span-2">
              <Label>Preferences (likes)</Label>
              <Input placeholder="idli, dal, salad" onChange={e=>setData({...data, nutrition:{...(data.nutrition||{}), preferences:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}})}/>
            </div>
          </div>}

          {step===2 && <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Wake Time (HH:MM)</Label>
              <Input placeholder="06:30" onChange={e=>setData({...data, schedule:{...(data.schedule||{}), wakeTime:e.target.value}})}/>
            </div>
            <div>
              <Label>Sleep Time (HH:MM)</Label>
              <Input placeholder="22:30" onChange={e=>setData({...data, schedule:{...(data.schedule||{}), sleepTime:e.target.value}})}/>
            </div>
            <div>
              <Label>Meals per day (3–6)</Label>
              <Input type="number" min={3} max={6} defaultValue={4} onChange={e=>setData({...data, meals:{...(data.meals||{}), mealsPerDay:+e.target.value}})}/>
            </div>
          </div>}

          {step===3 && <div className="grid gap-4">
            <div>
              <Label>Known problems (free text, optional)</Label>
              <Input placeholder="e.g., trouble sleeping" onChange={e=>setData({...data, medical:{...(data.medical||{}), conditions:e.target.value? e.target.value.split(',').map(s=>s.trim()):[]}})}/>
            </div>
            <div>
              <Label>Current symptoms (optional)</Label>
              <Input placeholder="e.g., tiredness, stiffness" onChange={e=>setData({...data, medical:{...(data.medical||{}), symptoms:e.target.value? e.target.value.split(',').map(s=>s.trim()):[]}})}/>
            </div>
          </div>}

          {step===4 && <div className="space-y-3">
            <p className="text-sm text-gray-600">Upload health docs (optional). Used to shape **neutral** wellness suggestions. Not medical advice.</p>
            <Input type="file" multiple />
          </div>}

          {step===5 && <div className="space-y-2">
            <p className="text-sm text-gray-600">Review your entries. By submitting you agree to receive **non-clinical** general wellness suggestions.</p>
            <pre className="bg-gray-50 rounded-lg p-3 text-xs overflow-auto max-h-64">{JSON.stringify(data, null, 2)}</pre>
          </div>}
        </Card>

        <div className="flex items-center justify-between">
          <button className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50" onClick={prev} disabled={step===0}>Back</button>
          {step<steps.length-1
            ? <button className="px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow" onClick={next}>Next</button>
            : <button className="px-5 py-2 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 shadow" onClick={submit}>Submit</button>}
        </div>
      </div>
    </div>
  );
}`;

/* Plan View (pretty v2) */
const prettyPlanTSX = `/* \${pagesDir}/PlanViewV2.tsx
Elegant daily plan surface (neutral) */
import React from "react";

function Section({title,children}:{title:string;children:React.ReactNode}){
  return (
    <section className="bg-white/90 backdrop-blur border border-gray-100 rounded-2xl shadow p-5">
      <h3 className="text-lg font-semibold text-emerald-900 mb-3">{title}</h3>
      {children}
    </section>
  );
}

export default function PlanViewV2({plan}:{plan:any}){
  const d = plan?.day||{};
  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-emerald-900">Your Wellness Day</h2>
          <p className="text-gray-600 mt-1">{plan?.meta?.disclaimerText || "General wellness suggestions only (non-clinical)."}</p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <Section title="Hydration">
            <ul className="space-y-2">
              {(d.hydration?.schedule||[]).map((t:string,i:number)=>(
                <li key={i} className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"/><span className="font-medium">{t}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-gray-600 mt-2">{(d.hydration?.notes||[]).join(" • ")}</p>
          </Section>

          <Section title="Movement">
            <ul className="list-disc pl-6">
              {(d.movement?.blocks||[]).map((b:string,i:number)=> <li key={i}>{b}</li>)}
            </ul>
            <p className="text-sm text-gray-600 mt-2">{(d.movement?.notes||[]).join(" • ")}</p>
          </Section>

          <Section title="Meals" >
            <div className="space-y-3">
              {(d.meals||[]).map((m:any,i:number)=>(
                <div key={i} className="p-3 rounded-xl border border-gray-100 bg-white shadow-sm">
                  <div className="font-medium text-emerald-800">{m.label}</div>
                  <div className="text-sm text-gray-700">Ideas: {(m.ideas||[]).join(", ")}</div>
                  <div className="text-xs text-gray-500 italic">Avoid: {(m.avoid||[]).join(", ")}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Mindfulness">
            <ul className="list-disc pl-6">
              {(d.mind?.practices||[]).map((p:string,i:number)=> <li key={i}>{p}</li>)}
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}`;

/** ================= Uploads v2 (namespaced) ====================== */

/* Extractors (stubs) */
const v2OCR = `/* mho2/uploads-v2/ocr.ts */
export async function ocrV2(_p:string){ return ""; }`;

const v2Classify = `/* mho2/uploads-v2/classify.ts */
export type DocType="prescription"|"lab"|"discharge"|"other";
export function classifyV2(t:string):DocType{
  t=t.toLowerCase();
  if(t.includes("glucose")||t.includes("hemoglobin")) return "lab";
  if(t.includes("rx")||t.includes("sig")) return "prescription";
  if(t.includes("discharge")) return "discharge";
  return "other";
}`;

/* Neutral parsers (stubs) */
const v2LabParser = `/* mho2/uploads-v2/labParser.ts */
export function labParserV2(_t:string){
  return { riskTags:["neutral_tag_lab"], notes:[] };
}`;

const v2RxParser = `/* mho2/uploads-v2/rxParser.ts */
export function rxParserV2(_t:string){
  return { riskTags:["neutral_tag_rx"], notes:[] };
}`;

const v2Discharge = `/* mho2/uploads-v2/dischargeParser.ts */
export function dischargeParserV2(_t:string){
  return { riskTags:["rest_priority"], notes:[] };
}`;

/* Beautiful uploads UI */
const v2UploadsUI = `/* \${featuresV2}/uploads-v2/UploadsBeautifulV2.tsx */
import React, { useState } from "react";
export default function UploadsBeautifulV2(){
  const [files,setFiles]=useState<File[]>([]);
  return (
    <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-lg border border-gray-100">
      <h3 className="text-lg font-semibold text-emerald-900 mb-2">Health Documents</h3>
      <p className="text-sm text-gray-600 mb-3">Optional uploads to refine neutral suggestions. Not medical advice.</p>
      <input
        type="file"
        multiple
        onChange={e=>setFiles(Array.from(e.target.files||[]))}
        className="block w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
      />
      <ul className="list-disc pl-6 mt-3 text-sm">{files.map((f,i)=><li key={i}>{f.name}</li>)}</ul>
    </div>
  );
}`;

/* services-v2 storage */
const v2UploadService = `/* services-v2/storage/uploadService.v2.ts */
export async function uploadFileV2(file: File, dest: string){ return { path: dest }; }
export async function deleteFileV2(_path: string){ /* delete */ }
export async function getSignedUrlV2(path: string){ return path; }`;

/* functions stubs (namespaced) */
const v2FnIngest = `/* \${functionsSrc}/uploadsIngestV2.ts */
export async function uploadsIngestV2(storagePath:string){
  // OCR -> classify -> parse to neutral tags -> store JSON (internal only)
}`;

const v2FnCleanup = `/* \${functionsSrc}/cleanupUploadsV2.ts */
export async function cleanupUploadsV2(){
  // delete old uploads by retention
}`;

/** ================= Exporters v2 (namespaced) ==================== */

const v2ExportPDF = `/* mho2/plugins/exporters/pdf.v2.ts */
import { ComplianceGuard2 } from "../../compliance/ComplianceGuard2";
export async function exportPlanPDFv2(plan:any){
  const safe = ComplianceGuard2.filter(plan);
  // Placeholder: integrate real PDF lib later
  return new Blob([JSON.stringify(safe,null,2)], { type:"application/pdf" });
}`; 

const v2ExportCSV = `/* mho2/plugins/exporters/csv.v2.ts */
import { ComplianceGuard2 } from "../../compliance/ComplianceGuard2";
export async function exportPlanCSVv2(plan:any){
  const safe = ComplianceGuard2.filter(plan);
  const rows = [["Disclaimer", safe?.meta?.disclaimerText||""]];
  const csv = rows.map(r=>r.map(x=>JSON.stringify(x??"")).join(",")).join("\\n");
  return new Blob([csv],{type:"text/csv"});
}`; 

const v2ExportWA = `/* mho2/plugins/exporters/whatsapp.v2.ts */
import { ComplianceGuard2 } from "../../compliance/ComplianceGuard2";
export function buildWhatsAppTextV2(plan:any){
  const safe = ComplianceGuard2.filter(plan);
  return safe?.shareables?.whatsappText || "Neutral daily wellness outline (non-clinical).";
}`;


/** ================= Docs v2 (namespaced) ======================== */

const v2DocsREADME = `# Advanced Engine V2 (Namespaced)
- Beautiful, accessible UI for form and plan (Tailwind-based)
- Non-clinical engine & compliance v2 (mho2/*)
- Coexists with v1 without collisions

## Quickstart
1) Use \`PrettyHealthFormV2\` to collect data.
2) Call \`generateSafePlanV2(data)\`.
3) Render with \`PlanViewV2\`.
4) Export via v2 exporters (PDF/CSV/WhatsApp).`;

const v2DocsMIGRATE = `# Migration (V2)
- Files live under \`mho2/\`, \`features-v2/\`, \`services-v2/*\`.
- Does not overwrite v1 counterparts.
- Use v2 scripts to lint and preview.`;

const v2DocsPROMPTS = `# Prompt Pack (V2)
- "Add fields to PrettyHealthFormV2 with inline validation hints."
- "Wire generateSafePlanV2 to my submit handler and show PlanViewV2."
- "Create a function to OCR uploads and store neutral tags (v2)."`;


/** ================= Lint v2 (namespaced) ======================== */

const v2Lint = `/* scripts/nonclinical-lint.v2.cjs */
const fs=require("fs"), path=require("path");
const rulesPath=path.join(process.cwd(),"mho2","compliance","nonClinical.v2.rules.json");
if(!fs.existsSync(rulesPath)){ console.log("v2 rules not found. Skip."); process.exit(0); }
const rules=JSON.parse(fs.readFileSync(rulesPath,"utf8"));
const patterns=(rules.blockedTerms||[]).map(r=>new RegExp(r.pattern, r.flags||"gi"));
function walk(d){ const out=[]; for(const e of fs.readdirSync(d,{withFileTypes:true})) {
  const p=path.join(d,e.name);
  if(e.isDirectory()) out.push(...walk(p));
  else if(/\\.(ts|tsx|js|jsx|md|txt|json)$/i.test(e.name)) out.push(p);
} return out;}
const roots=["src","mho2","features-v2"].filter(r=>fs.existsSync(r));
let bad=false;
for(const r of roots){
  for(const f of walk(path.join(process.cwd(),r))){
    const txt=fs.readFileSync(f,"utf8");
    for(const re of patterns){ if(re.test(txt)){ console.error("Clinical term in:",f); bad=true; } }
  }
}
process.exit(bad?1:0);`;

/* ------------------------------------------------------------------ */
/* Writers                                                            */
/* ------------------------------------------------------------------ */

/* ================= Writers for V2 ================== */

function writeCompliance2(){
  ensureDir(path.join(root,"mho2/compliance"));
  writeSmart(path.join(root,"mho2/compliance/ComplianceGuard2.ts"), compliance2TS);
  writeSmart(path.join(root,"mho2/compliance/nonClinical.v2.rules.json"), compliance2RulesJSON);
  writeSmart(path.join(root,"mho2/compliance/strings2.ts"), compliance2StringsTS);
  ok("Compliance v2 ready.");
}

function writeEngineV2(){
  ensureDir(path.join(root,"mho2/engine-v2"));
  writeSmart(path.join(root,"mho2/engine-v2/types.ts"), v2TypesTS);
  writeSmart(path.join(root,"mho2/engine-v2/normalize.ts"), v2NormalizeTS);
  writeSmart(path.join(root,"mho2/engine-v2/validate.ts"), v2ValidateTS);
  writeSmart(path.join(root,"mho2/engine-v2/calcs.ts"), v2CalcsTS);
  writeSmart(path.join(root,"mho2/engine-v2/modes.ts"), v2ModesTS);

  ensureDir(path.join(root,"mho2/plan-v2"));
  writeSmart(path.join(root,"mho2/plan-v2/schema.ts"), v2PlanSchemaTS);
  writeSmart(path.join(root,"mho2/engine-v2/buildPlan.ts"), v2BuildPlanTS);
  writeSmart(path.join(root,"mho2/engine-v2/safeGenerate.ts"), v2SafeGenerateTS);
  ok("Engine v2 ready.");
}

function writeBeautifulUI(){
  ensureDir(path.join(root, featuresV2, "health-plan-advanced"));
  writeSmart(path.join(root, featuresV2, "health-plan-advanced/PrettyHealthFormV2.tsx"), prettyFormTSX);
  writeSmart(path.join(root, pagesDir, "PlanViewV2.tsx"), prettyPlanTSX);
  ok("Beautiful UI (Form + Plan) ready.");
}

function writeUploadsV2(){
  ensureDir(path.join(root,"mho2/uploads-v2"));
  writeSmart(path.join(root,"mho2/uploads-v2/ocr.ts"), v2OCR);
  writeSmart(path.join(root,"mho2/uploads-v2/classify.ts"), v2Classify);
  writeSmart(path.join(root,"mho2/uploads-v2/labParser.ts"), v2LabParser);
  writeSmart(path.join(root,"mho2/uploads-v2/rxParser.ts"), v2RxParser);
  writeSmart(path.join(root,"mho2/uploads-v2/dischargeParser.ts"), v2Discharge);

  ensureDir(path.join(root, featuresV2, "uploads-v2"));
  writeSmart(path.join(root, featuresV2, "uploads-v2/UploadsBeautifulV2.tsx"), v2UploadsUI);

  ensureDir(path.join(root,"services-v2/storage"));
  writeSmart(path.join(root,"services-v2/storage/uploadService.v2.ts"), v2UploadService);

  ensureDir(path.join(root, functionsSrc));
  writeSmart(path.join(root, functionsSrc, "uploadsIngestV2.ts"), v2FnIngest);
  writeSmart(path.join(root, functionsSrc, "cleanupUploadsV2.ts"), v2FnCleanup);
  ok("Uploads v2 pipeline ready.");
}

function writeExportersV2(){
  ensureDir(path.join(root,"mho2/plugins/exporters"));
  writeSmart(path.join(root,"mho2/plugins/exporters/pdf.v2.ts"), v2ExportPDF);
  writeSmart(path.join(root,"mho2/plugins/exporters/csv.v2.ts"), v2ExportCSV);
  writeSmart(path.join(root,"mho2/plugins/exporters/whatsapp.v2.ts"), v2ExportWA);
  ok("Exporters v2 ready.");
}

function writeDocsV2(){
  ensureDir(path.join(root,"docs"));
  writeSmart(path.join(root,"docs/ADV_ENGINE_V2_README.md"), v2DocsREADME);
  writeSmart(path.join(root,"docs/ADV_ENGINE_V2_MIGRATION.md"), v2DocsMIGRATE);
  writeSmart(path.join(root,"docs/ADV_ENGINE_V2_PROMPTS.md"), v2DocsPROMPTS);
  ok("Docs v2 ready.");
}

function patchScriptsV2(){
  ensureDir(path.join(root,"scripts"));
  writeSmart(path.join(root,"scripts/nonclinical-lint.v2.cjs"), v2Lint);
  patchPackageJson((pkg)=>{
    pkg.scripts = pkg.scripts || {};
    pkg.scripts["glowell:lint:nonclinical:v2"] = pkg.scripts["glowell:lint:nonclinical:v2"] || "node scripts/nonclinical-lint.v2.cjs";
    pkg.scripts["glowell:plan:preview:v2"] || "echo 'Use generateSafePlanV2(formData) to preview v2 plan.'";
    pkg.scripts["glowell:engine:test:v2"] || "echo 'Add your jest/vitest config to test engine-v2.'";
  });
  ok("Scripts v2 patched.");
}

function writeCompliance(){
  ensureDir(path.join(root,"mho/compliance"));
  writeSmart(path.join(root,"mho/compliance/ComplianceGuard.ts"), complianceGuardTS);
  writeSmart(path.join(root,"mho/compliance/nonClinical.rules.json"), nonClinicalRulesJSON);
  writeSmart(path.join(root,"mho/compliance/strings.ts"), complianceStringsTS);
  writeSmart(path.join(root,"mho/compliance/redFlags.json"), redFlagsJSON);
  ok("Compliance module ready.");
}
function writeCore(){
  ensureDir(path.join(root,"mho/plan"));
  writeSmart(path.join(root,"mho/plan/schema.ts"), planSchemaTS);
  ensureDir(path.join(root,"mho/engine"));
  writeSmart(path.join(root,"mho/engine/normalize.ts"), engineNormalizeTS);
  writeSmart(path.join(root,"mho/engine/processForm.ts"), engineProcessFormTS);
  writeSmart(path.join(root,"mho/engine/safeGenerate.ts"), engineSafeGenerateTS);
  ok("Core engine ready.");
}
function writeForm(){
  ensureDir(path.join(root,"mho/form"));
  writeSmart(path.join(root,"mho/form/healthForm.schema.json"), healthFormSchemaJSON);
  ensureDir(path.join(root, featuresDir, "health-plan"));
  writeSmart(path.join(root, featuresDir, "health-plan/MultiStepHealthForm.tsx"), healthFormUItsx);
  ensureDir(path.join(root, pagesDir));
  writeSmart(path.join(root, pagesDir, "PlanView.tsx"), planViewTSX);
  ok("Form (schema + UI) and PlanView ready.");
}
function writeUploads(){
  ensureDir(path.join(root,"mho/engine/extractors"));
  writeSmart(path.join(root,"mho/engine/extractors/ocr.ts"), ocrTS);
  writeSmart(path.join(root,"mho/engine/extractors/classify.ts"), classifyTS);
  writeSmart(path.join(root,"mho/engine/extractors/labParser.ts"), labParserTS);
  writeSmart(path.join(root,"mho/engine/extractors/rxParser.ts"), rxParserTS);
  writeSmart(path.join(root,"mho/engine/extractors/dischargeParser.ts"), dischargeParserTS);

  ensureDir(path.join(root, featuresDir, "uploads"));
  writeSmart(path.join(root, featuresDir, "uploads/UploadsManager.tsx"), uploadsManagerTSX);
  writeSmart(path.join(root, featuresDir, "uploads/UploadsConsent.tsx"), uploadsConsentTSX);

  ensureDir(path.join(root,"services/storage"));
  writeSmart(path.join(root,"services/storage/uploadService.ts"), uploadServiceTS);

  ensureDir(path.join(root, functionsSrc));
  writeSmart(path.join(root, functionsSrc, "uploadsIngest.ts"), fnUploadsIngestTS);
  writeSmart(path.join(root, functionsSrc, "cleanupUploads.ts"), fnCleanupUploadsTS);

  ok("Uploads pipeline ready.");
}
function writeTrackers(){
  ensureDir(path.join(root, featuresDir, "tracker"));
  writeSmart(path.join(root, featuresDir, "tracker/TrackerDashboard.tsx"), trackerDashboardTSX);
  ok("Trackers ready.");
}
function writeExporters(){
  ensureDir(path.join(root,"mho/plugins/exporters"));
  writeSmart(path.join(root,"mho/plugins/exporters/pdf.ts"), exportersPDFTS);
  writeSmart(path.join(root,"mho/plugins/exporters/excel.ts"), exportersExcelTS);
  writeSmart(path.join(root,"mho/plugins/exporters/whatsapp.ts"), exportersWhatsAppTS);
  ok("Exporters ready.");
}
function writeDocs(){
  ensureDir(path.join(root,"docs"));
  writeSmart(path.join(root,"docs/GLOWELL_BLUEPRINT_README.md"), docsReadme);
  writeSmart(path.join(root,"docs/MIGRATION_STEPS.md"), docsMigration);
  writeSmart(path.join(root,"docs/PROMPT_PACK.md"), docsPromptPack);
  ok("Docs & prompt pack ready.");
}
function writeScripts(){
  ensureDir(path.join(root,"scripts"));
  writeSmart(path.join(root,"scripts/nonclinical-lint.cjs"), nonclinicalLintCJS);
  patchPackageJson((pkg)=>{
    pkg.scripts = pkg.scripts || {};
    pkg.scripts["glowell:lint:nonclinical"] = pkg.scripts["glowell:lint:nonclinical"] || "node scripts/nonclinical-lint.cjs";
    pkg.scripts["glowell:plan:demo"] = pkg.scripts["glowell:plan:demo"] || "echo \"Use generateSafePlan(formData) to preview output.\"";
  });
  ok("Dev scripts patched.");
}

/* ------------------------------------------------------------------ */
/* Run                                                                */
/* ------------------------------------------------------------------ */

(function main(){
  log("GloWell FINAL blueprint installer (Detailed Edition) starting…", DRY_RUN?"[dry-run]":"");
  if (MODES.compliance) writeCompliance();
  if (MODES.core)       writeCore();
  if (MODES.form)       writeForm();
  if (MODES.uploads)    writeUploads();
  if (MODES.trackers)   writeTrackers();
  if (MODES.exporters)  writeExporters();
  if (MODES.docs)       writeDocs();
  if (MODES.scripts)    writeScripts();
  ok("All done. Default never overwrites (writes .new). Use --backup to overwrite with .bak.");
})();

  // --- V2 Writers (only if enabled flags) ---
  if (MODES.compliance2) writeCompliance2();
  if (MODES.adv_normalize_validate || MODES.adv_calcs || MODES.risk_modes_flags ||
      MODES.diet_filters_safety || MODES.climate_circadian || MODES.rule_engine_priority ||
      MODES.repro_dosha_modifiers || MODES.persistence_tests || MODES.plan_schemas_views) {
    writeEngineV2();
  }
  if (MODES.intake_profile || MODES.intake_schedule || MODES.intake_body_activity ||
      MODES.intake_nutrition_culture || MODES.intake_meals_hydration || MODES.intake_kitchen_budget ||
      MODES.intake_medical || MODES.labs_vitals || MODES.repro_conditional ||
      MODES.traditional_dosha || MODES.goals_reminders || MODES.notes || MODES.plan_schemas_views) {
    writeBeautifulUI();
  }
  if (MODES.ingest_uploads) writeUploadsV2();
  if (MODES.exporters_plus) writeExportersV2();
  if (MODES.docs_advanced) writeDocsV2();
  if (MODES.scripts_advanced) patchScriptsV2();
