// netlify/functions/plan.js
// v14 stub: deterministic, non-clinical daily plan (safe fallback when AI is off/unavailable)

exports.handler = async function (_event, _context) {
  try {
    const body = _event.body ? JSON.parse(_event.body) : {};
    const basics = body?.basics || {};
    const name = (basics.name || "Friend").toString();

    // simple deterministic hash from input to vary tips a bit
    const seed = JSON.stringify(body || {}).length % 3;

    const hydrTips = [
      "Start your day with 1 glass of water.",
      "Carry a bottle; sip regularly through the day.",
      "Avoid large gulps right before meals."
    ];
    const mealTips = [
      "Prefer home-style, minimally processed meals.",
      "Add one seasonal fruit in the day.",
      "Mind the plate: half veggies, quarter grains, quarter proteins."
    ];
    const moveTips = [
      "Take 10-min light walk after meals.",
      "Stretch shoulders/neck 2–3 times daily.",
      "Sit less, stand more: 2–3 mini-stands each hour."
    ];

    const response = {
      source: "template",          // owner-only metadata (UI should hide from users)
      person: { name },
      hydration: {
        targetLiters: 2.2,        // neutral default; your client can override by weight/climate
        pulses: [ "08:00", "11:00", "14:00", "17:00", "20:00" ],
        tips: [ hydrTips[seed] ]
      },
      meals: {
        pattern: "3 meals + 1 light snack",
        tips: [ mealTips[(seed + 1) % 3] ]
      },
      movement: {
        plan: [
          { time: "Morning",  activity: "Brisk walk 15–20 min" },
          { time: "Midday",   activity: "2-min stretch break" },
          { time: "Evening",  activity: "Light stroll 10–15 min" }
        ],
        tips: [ moveTips[(seed + 2) % 3] ]
      },
      tips: [
        "Sleep at regular times; avoid heavy screens late night.",
        "Breathe easy: 5 slow breaths when stressed."
      ],
      generatedAt: new Date().toISOString()
    };

    return { statusCode: 200, body: JSON.stringify(response) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "plan-failure", detail: String(e) }) };
  }
};
