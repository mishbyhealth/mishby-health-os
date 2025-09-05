// src/utils/dosha.ts
export type DoshaScores = { kapha: number; pitta: number; vata: number }; // 1..10 each
export type DoshaLabel = string; // e.g., "Pitta-Vata" / "Tridoshic-balanced"

export function clamp(n: number, min=1, max=10){ return Math.max(min, Math.min(max, Math.round(n))); }

export function labelFromScores(s: DoshaScores): DoshaLabel {
  const arr = [
    { k: "Kapha", v: s.kapha },
    { k: "Pitta", v: s.pitta },
    { k: "Vata",  v: s.vata  },
  ].sort((a,b)=> b.v - a.v);
  if (arr[0].v === arr[2].v) return "Tridoshic-balanced";
  if (arr[0].v === arr[1].v) return `${arr[0].k}-${arr[1].k}`;
  return arr[0].k;
}

// Very light heuristic inference (can be expanded later).
// Inputs are optional signals; we bias gently.
export function inferDosha(opts: {
  concerns?: string[];         // e.g., ["stress","poor sleep","acidity","bloating","weight gain"]
  conditions?: string[];       // e.g., ["Hypertension","Diabetes","Thyroid"]
  habits?: string[];           // e.g., ["night_shifts","outside_food","low_protein"]
  wellbeing?: { stress?: number|null; sleepHours?: number|null; sleepQuality?: number|null };
}): DoshaScores {
  let kapha = 5, pitta = 5, vata = 5;

  const cset = new Set((opts.concerns||[]).map(x=>x.toLowerCase()));
  const cond = new Set((opts.conditions||[]).map(x=>x.toLowerCase()));
  const habits = new Set((opts.habits||[]).map(x=>x.toLowerCase()));

  // Stress/poor sleep/anxiety → Vata bias
  if (cset.has("stress") || cset.has("low mood") || cset.has("anxiety") || (opts.wellbeing?.sleepQuality||0) <= 2) vata += 2;
  if ((opts.wellbeing?.sleepHours||8) < 6) vata += 1;

  // Acidity/heat/anger → Pitta bias
  if (cset.has("acidity") || cset.has("heartburn") || cset.has("migraine")) pitta += 2;

  // Weight gain, congestion, lethargy → Kapha bias
  if (cset.has("weight gain") || cset.has("bloating") || cset.has("constipation")) kapha += 2;

  // Diabetes/dyslipidemia → mild Kapha tilt; Thyroid (hypo) → Kapha; HTN → Pitta
  if (cond.has("diabetes") || cond.has("prediabetes") || cond.has("dyslipidemia")) kapha += 1;
  if (cond.has("thyroid")) kapha += 1;
  if (cond.has("hypertension")) pitta += 1;

  // Night shifts → Vata; frequent outside food/spicy → Pitta
  if (habits.has("night_shifts")) vata += 1;
  if (habits.has("outside_food")) pitta += 1;

  return { kapha: clamp(kapha), pitta: clamp(pitta), vata: clamp(vata) };
}
