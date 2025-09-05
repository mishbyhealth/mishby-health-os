// src/utils/dietLibrary.ts
// Minimal starter Diet Library. Add more dishes later — structure is ready.

export type DietType = "vegetarian" | "vegan" | "eggetarian" | "non_vegetarian" | "all_eater";
export type Cuisine =
  | "Gujarati" | "Punjabi" | "South Indian" | "Bengali" | "Rajasthani" | "North Indian" | "International Veg" | "Other";

export type MealSlot = "breakfast" | "midmorning" | "lunch" | "evening" | "dinner";

export type FoodItem = {
  id: string;
  name: string;
  diet: DietType;
  cuisine: Cuisine | "Generic";
  slots: MealSlot[];                // where it fits
  tags: string[];                   // e.g., ["veg","pitta_cool","kapha_light","protein","fiber"]
  avoidWith?: string[];             // e.g., ["milk+fish"]
  goodWith?: string[];              // e.g., ["jeera water","buttermilk"]
  kcalBand?: "low" | "medium" | "high";
};

export type DietFamily = {
  id: string;                       // e.g., "vegetarian|Gujarati"
  diet: DietType;
  cuisine: Cuisine | "Generic";
  defaults: {
    breakfast: string[];            // dish ids to prefer
    lunch: string[];
    evening: string[];
    dinner: string[];
    midmorning?: string[];
  }
};

// -------- Starter dishes (extend in future) --------

const DISHES: FoodItem[] = [
  // Gujarati veg
  { id:"poha", name:"Poha with peanuts", diet:"vegetarian", cuisine:"Gujarati",
    slots:["breakfast","midmorning"], tags:["veg","fiber","light","kapha_light","vata_grounding"], kcalBand:"medium", goodWith:["lemon"] },
  { id:"upma", name:"Vegetable upma", diet:"vegetarian", cuisine:"South Indian",
    slots:["breakfast"], tags:["veg","fiber","light","pitta_cool"], kcalBand:"medium" },
  { id:"moong_chilla", name:"Moong dal chilla + curd", diet:"vegetarian", cuisine:"North Indian",
    slots:["breakfast","evening"], tags:["protein","veg","kapha_light","pitta_cool"], kcalBand:"medium" },
  { id:"thepla_dahi", name:"Methi thepla + dahi", diet:"vegetarian", cuisine:"Gujarati",
    slots:["breakfast","evening"], tags:["veg","fiber","pitta_cool"], kcalBand:"medium", avoidWith:["dahi+fish"] },
  { id:"khichdi_kadhi", name:"Moong khichdi + kadhi", diet:"vegetarian", cuisine:"Gujarati",
    slots:["lunch","dinner"], tags:["veg","light","pitta_cool","vata_grounding"], kcalBand:"medium" },
  { id:"rotli_sabzi", name:"Phulka rotli + seasonal sabzi + salad", diet:"vegetarian", cuisine:"Gujarati",
    slots:["lunch","dinner"], tags:["veg","fiber","balanced"], kcalBand:"medium" },
  { id:"dal_rice", name:"Arhar dal + steamed rice + salad", diet:"vegetarian", cuisine:"North Indian",
    slots:["lunch","dinner"], tags:["veg","protein","pitta_cool"], kcalBand:"medium" },
  { id:"curd_rice", name:"Curd rice + cucumber", diet:"vegetarian", cuisine:"South Indian",
    slots:["lunch","dinner"], tags:["veg","pitta_cool","vata_grounding"], kcalBand:"medium" },
  { id:"buttermilk", name:"Masala chaas (buttermilk)", diet:"vegetarian", cuisine:"Gujarati",
    slots:["midmorning","lunch","evening"], tags:["pitta_cool","digestion"], kcalBand:"low" },
  { id:"sprouts_salad", name:"Sprouts salad", diet:"vegan", cuisine:"Generic",
    slots:["midmorning","evening"], tags:["protein","fiber","kapha_light"], kcalBand:"low" },
  { id:"veg_upkari", name:"Light sauté seasonal veg", diet:"vegan", cuisine:"Generic",
    slots:["lunch","dinner"], tags:["veg","fiber","kapha_light"], kcalBand:"low" },
  // Eggetarian add-ons
  { id:"masala_omelette", name:"Masala omelette + toast", diet:"eggetarian", cuisine:"North Indian",
    slots:["breakfast","evening"], tags:["protein"], kcalBand:"medium" },
];

// -------- Starter families --------
const FAMILIES: DietFamily[] = [
  {
    id:"vegetarian|Gujarati",
    diet:"vegetarian", cuisine:"Gujarati",
    defaults:{
      breakfast:["poha","thepla_dahi","moong_chilla"],
      midmorning:["buttermilk","sprouts_salad"],
      lunch:["rotli_sabzi","khichdi_kadhi","dal_rice"],
      evening:["sprouts_salad","thepla_dahi"],
      dinner:["khichdi_kadhi","curd_rice","rotli_sabzi"]
    }
  },
  {
    id:"vegetarian|South Indian",
    diet:"vegetarian", cuisine:"South Indian",
    defaults:{
      breakfast:["upma","moong_chilla"],
      midmorning:["buttermilk","sprouts_salad"],
      lunch:["curd_rice","dal_rice","veg_upkari"],
      evening:["sprouts_salad"],
      dinner:["curd_rice","dal_rice","veg_upkari"]
    }
  },
  {
    id:"vegan|Generic",
    diet:"vegan", cuisine:"Generic",
    defaults:{
      breakfast:["moong_chilla"],
      midmorning:["sprouts_salad"],
      lunch:["veg_upkari","dal_rice"],
      evening:["sprouts_salad"],
      dinner:["veg_upkari","dal_rice"]
    }
  },
  {
    id:"eggetarian|North Indian",
    diet:"eggetarian", cuisine:"North Indian",
    defaults:{
      breakfast:["masala_omelette","moong_chilla"],
      midmorning:["sprouts_salad"],
      lunch:["dal_rice","rotli_sabzi"],
      evening:["masala_omelette","sprouts_salad"],
      dinner:["dal_rice","rotli_sabzi"]
    }
  }
];

// -------- API --------
export function getDietFamily(diet: DietType, cuisine: Cuisine | "Generic"): DietFamily {
  const id = `${diet}|${cuisine}`;
  return FAMILIES.find(f=>f.id===id)
      || FAMILIES.find(f=>f.diet===diet && f.cuisine==="Generic")
      || FAMILIES[0];
}

export function pickDishesForSlot(diet: DietType, cuisine: Cuisine | "Generic", slot: MealSlot): FoodItem[] {
  const fam = getDietFamily(diet, cuisine);
  const poolIds = fam.defaults[slot] || [];
  const fromPool = DISHES.filter(d => poolIds.includes(d.id));
  if (fromPool.length) return fromPool;
  // fallback: any dish matching slot + diet
  return DISHES.filter(d => d.diet===diet && d.slots.includes(slot));
}

// Simple filters by dosha tendency and pack constraints
export function filterByDosha(items: FoodItem[], doshaLabel: string): FoodItem[] {
  if (doshaLabel.toLowerCase().includes("pitta")) {
    return items.filter(i=> !i.tags.includes("very_spicy")).concat(items.filter(i=> i.tags.includes("pitta_cool")));
  }
  if (doshaLabel.toLowerCase().includes("kapha")) {
    return items.filter(i=> !i.kcalBand || i.kcalBand!=="high").concat(items.filter(i=> i.tags.includes("kapha_light")));
  }
  if (doshaLabel.toLowerCase().includes("vata")) {
    return items.concat(items.filter(i=> i.tags.includes("vata_grounding")));
  }
  return items;
}

export function applyAvoidCombos(items: FoodItem[], activeAvoid: string[]): FoodItem[] {
  if (!activeAvoid.length) return items;
  return items.filter(i => !i.avoidWith?.some(bad => activeAvoid.includes(bad)));
}

export function allDishes(): FoodItem[] { return DISHES; }
