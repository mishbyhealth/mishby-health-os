// src/utils/archetypes.ts
export type ArchetypeId =
  | "student_early"
  | "student_regular"
  | "student_college"
  | "office_9_5"
  | "office_10_6"
  | "office_12_8"
  | "shift_worker"
  | "remote_wfh"
  | "field_sales"
  | "shop_business"
  | "homemaker"
  | "retired"
  | "custom";

export type ArchetypeTimes = {
  wake: string;           // "06:00"
  leave?: string;         // when leaving home (optional)
  return?: string;        // when returning (optional)
  lunch?: string;         // default lunch time
  dinner?: string;        // default dinner time
  commuteMins?: number;   // total commute minutes/day
  breaks?: Array<{ label: string; from: string; to: string }>; // e.g., school recess
};

export type Archetype = { id: ArchetypeId; label: string; defaults: ArchetypeTimes };

export const ARCHETYPES: Archetype[] = [
  { id: "student_early", label: "Student • Early bus", defaults: { wake: "05:30", leave: "06:00", return: "13:30", lunch: "13:45", dinner: "20:00", breaks: [{label:"Recess", from:"10:30", to:"10:45"}] } },
  { id: "student_regular", label: "Student • Regular school", defaults: { wake: "06:30", leave: "07:30", return: "15:30", lunch: "13:30", dinner: "20:15", breaks: [{label:"Recess", from:"11:15", to:"11:30"}] } },
  { id: "student_college", label: "Student • College", defaults: { wake: "07:00", leave: "08:30", return: "17:30", lunch: "13:30", dinner: "20:30" } },
  { id: "office_9_5", label: "Office • 9–5", defaults: { wake: "06:45", leave: "08:30", return: "18:00", lunch: "13:00", dinner: "20:30", commuteMins: 60, breaks: [{label:"Tea",from:"11:00",to:"11:10"},{label:"Tea",from:"16:30",to:"16:40"}] } },
  { id: "office_10_6", label: "Office • 10–6", defaults: { wake: "07:30", leave: "09:30", return: "19:00", lunch: "13:30", dinner: "21:00", commuteMins: 60 } },
  { id: "office_12_8", label: "Office • 12–8", defaults: { wake: "08:30", leave: "11:00", return: "20:30", lunch: "14:00", dinner: "21:30", commuteMins: 60 } },
  { id: "shift_worker", label: "Shift worker", defaults: { wake: "12:00", leave: "20:00", return: "06:00", lunch: "00:30", dinner: "07:00" } },
  { id: "remote_wfh", label: "Remote / WFH", defaults: { wake: "07:30", lunch: "13:30", dinner: "20:30" } },
  { id: "field_sales", label: "Field • Sales/Marketing", defaults: { wake: "06:30", leave: "08:00", return: "19:30", lunch: "13:30", dinner: "21:00", commuteMins: 120 } },
  { id: "shop_business", label: "Shop / Business", defaults: { wake: "06:30", leave: "09:30", return: "21:30", lunch: "14:00", dinner: "22:00" } },
  { id: "homemaker", label: "Homemaker / Care", defaults: { wake: "06:00", lunch: "13:00", dinner: "20:30" } },
  { id: "retired", label: "Senior / Retired", defaults: { wake: "06:30", lunch: "13:00", dinner: "19:30" } },
  { id: "custom", label: "Custom", defaults: { wake: "07:00", lunch: "13:30", dinner: "20:30" } },
];

export function getArchetype(id: ArchetypeId): Archetype {
  return ARCHETYPES.find(a => a.id === id) || ARCHETYPES[0];
}
