// netlify/functions/plan.js
// Non-clinical, deterministic plan stub for GloWell
// Endpoint (default): /.netlify/functions/plan

const allowOrigin = '*';

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': allowOrigin,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');

    // Expected input (lenient):
    // { intakeSummary: {...}, aggregates: { d7: {...}, d14: {...}, d30: {...} } }
    const { intakeSummary = {}, aggregates = {} } = body;

    // Build a deterministic, non-clinical plan.
    // This is a stable stub — does not call external AI.
    const packs_applied = Array.isArray(intakeSummary.packs_applied)
      ? intakeSummary.packs_applied
      : [];

    // Simple time helpers
    const now = new Date();
    const toHm = (d) =>
      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    const mkTime = (h, m = 0) => {
      const d = new Date(now);
      d.setHours(h, m, 0, 0);
      return toHm(d);
    };

    // Hydration pulses (deterministic schedule)
    const hydration = [
      { time: mkTime(6, 30), ml: 250, note: 'Morning sip' },
      { time: mkTime(9, 30), ml: 300, note: 'Mid-morning' },
      { time: mkTime(12, 0), ml: 300, note: 'Pre-lunch' },
      { time: mkTime(15, 30), ml: 300, note: 'Afternoon' },
      { time: mkTime(18, 0), ml: 250, note: 'Evening' },
    ];

    // Meals scaffold (neutral, non-clinical)
    const meals = {
      breakfast: [
        'Warm water + light seasonal fruit',
        'Simple whole-grain option (idli/poha/oats) — small portion',
      ],
      lunch: [
        'Balanced plate: grain + dal/beans + 2 veg + salad',
        'Yogurt/chaas if suits you (avoid if advised otherwise)',
      ],
      dinner: [
        'Earlier, lighter dinner',
        'More veggies; modest grain; avoid heavy fried foods late night',
      ],
      snacks: [
        'Handful nuts/seeds or fruit; avoid packaged sweets/fried snacks',
      ],
    };

    // Movement (gentle baseline)
    const movement = [
      '10–15 min easy walk after main meals (as suits you)',
      'Light mobility or stretching 1× daily',
      'Sunlight exposure when feasible',
    ];

    // Dosha notes (neutral text; no diagnosis)
    const dosha_notes =
      'Observe daily Dosha sliders in Tracker. If a trend persists (e.g., more heat/dryness/heaviness), gently balance with cooling/hydrating/light routines as personally suitable.';

    const tips = [
      'Prioritize earlier sleep time; keep wake time consistent.',
      'Aim for steady hydration through the day, not chugging at night.',
      'Keep meals simple, mostly home-made; add seasonal produce.',
      'Short, frequent movement beats intense rare workouts.',
      'If red-flag symptoms occur, please consider a clinician.',
    ];

    const disclaimers = [
      'GloWell provides non-clinical, general wellness guidance.',
      'This is not medical advice, diagnosis, or treatment.',
      'Consult a qualified clinician for medical concerns.',
    ];

    const response = {
      packs_applied,
      hydration,
      meals,
      movement,
      tips,
      dosha_notes,
      disclaimers,
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': allowOrigin,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify(response),
    };
  } catch (err) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': allowOrigin,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Invalid JSON', detail: String(err?.message || err) }),
    };
  }
};
