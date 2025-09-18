export async function mockPlan() {
  return {
    source: "template",
    person: { name: "Friend" },
    hydration: {
      targetLiters: 2.2,
      pulses: ["08:00", "11:00", "14:00", "17:00", "20:00"],
      tips: ["Start your day with 1 glass of water."]
    },
    meals: {
      pattern: "3 meals + 1 light snack",
      tips: ["Prefer home-style, minimally processed meals."]
    },
    movement: {
      plan: [
        { time: "Morning", activity: "Brisk walk 15–20 min" },
        { time: "Midday", activity: "2-min stretch break" },
        { time: "Evening", activity: "Light stroll 10–15 min" }
      ],
      tips: ["Take 10-min light walk after meals."]
    },
    tips: [
      "Sleep at regular times; avoid heavy screens late night.",
      "Breathe easy: 5 slow breaths when stressed."
    ],
    generatedAt: new Date().toISOString()
  };
}
