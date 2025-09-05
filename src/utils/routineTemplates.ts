// src/utils/routineTemplates.ts
import type { ArchetypeTimes } from "./archetypes";

export type ScheduleBlock = { at: string; type: "hydration"|"meal"|"movement"|"focus"|"winddown"; label: string; meta?: any };

export function buildRoutineSchedule(times: ArchetypeTimes, opts?: { goal?: string }): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = [];

  // Hydration anchors
  if (times.wake) blocks.push({ at: times.wake, type:"hydration", label:"Warm water (200–300 ml)", meta:{ temp:"warm" } });

  // Breakfast ~45–90 mins after wake (if no leave, align to wake)
  const bAt = times.leave ? minusMinutes(times.leave, 30) : addMinutes(times.wake || "07:00", 60);
  blocks.push({ at: bAt, type:"meal", label:"Breakfast" });

  // Mid-morning hydration
  blocks.push({ at: addMinutes(bAt, 120), type:"hydration", label:"Water / chaas" });

  // Movement micro-block before lunch (if office/student)
  const preLunchMove = minusMinutes(times.lunch || "13:30", 20);
  blocks.push({ at: preLunchMove, type:"movement", label:"Walk 10–15 min" });

  // Lunch
  if (times.lunch) blocks.push({ at: times.lunch, type:"meal", label:"Lunch" });

  // Afternoon hydration
  blocks.push({ at: addMinutes(times.lunch || "13:30", 120), type:"hydration", label:"Water" });

  // Evening move
  const ret = times.return || "18:30";
  blocks.push({ at: addMinutes(ret, 15), type:"movement", label:"Walk 15–20 min" });

  // Evening snack
  blocks.push({ at: addMinutes(ret, 45), type:"meal", label:"Evening snack" });

  // Dinner
  if (times.dinner) blocks.push({ at: times.dinner, type:"meal", label:"Dinner" });

  // Wind-down
  blocks.push({ at: addMinutes(times.dinner || "20:30", 60), type:"winddown", label:"Screen-off / relax" });

  return blocks.sort((a,b)=> a.at.localeCompare(b.at));
}

function addMinutes(hhmm: string, mins: number): string {
  const [h,m] = hhmm.split(":").map(Number);
  const t = (h*60 + m + mins + 24*60) % (24*60);
  return pad(Math.floor(t/60))+":"+pad(t%60);
}
function minusMinutes(hhmm: string, mins: number): string { return addMinutes(hhmm, -mins); }
function pad(n:number){ return String(n).padStart(2,"0"); }
