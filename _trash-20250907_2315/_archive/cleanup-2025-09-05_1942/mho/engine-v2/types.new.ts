/* mho2/engine-v2/types.ts */
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
};