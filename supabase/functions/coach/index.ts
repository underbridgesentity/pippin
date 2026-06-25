// Supabase Edge Function: coach
//
// Generates short, practical wellness recommendations (what to eat, how to move,
// a daily focus) from the user's goal, body stats, and today's progress, using
// Gemini 2.5 Flash-Lite. General wellness guidance only, never medical advice.
//
// Setup (the GEMINI_API_KEY secret is shared with analyze-meal):
//   supabase functions deploy coach
//
// On any error it returns 200 with a null plan so the app just hides the card.

const MODEL = 'gemini-2.5-flash-lite'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Ctx = {
  goal?: string
  bodyLine?: string
  calorieTarget?: number
  consumed?: number
  remaining?: number
  protein?: number
  carbs?: number
  fat?: number
  steps?: number
  stepsTarget?: number
  activeMinutes?: number
}

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ plan: null }, 405)

  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) return json({ plan: null })

  let ctx: Ctx
  try {
    ctx = (await req.json()) as Ctx
  } catch {
    return json({ plan: null }, 400)
  }

  const prompt = `You are Pippin's friendly wellness coach. Using the user's goal, stats, and today's progress, give short, practical, encouraging recommendations. This is GENERAL WELLNESS guidance, not medical or clinical advice: never diagnose, never prescribe, and avoid extreme or unsafe suggestions (no crash diets, no overtraining).

Return:
- eat: 2 or 3 specific food or meal ideas that fit the REMAINING calories today and support the goal. Each has a short title and a one-line detail (why it fits, with a rough calorie figure).
- move: one movement idea for today that fits the goal and what they have already done; short title + one-line detail.
- focus: one short focus tip for the day, under 12 words.

Be specific and grounded in their numbers. If they have already met their calorie target, suggest lighter options or stopping for the day. Keep a warm, motivating tone.

USER
- Goal: ${ctx.goal ?? 'general wellbeing'}
- ${ctx.bodyLine ?? 'stats not provided'}
- Calorie target: ${ctx.calorieTarget ?? '?'} kcal; consumed so far: ${ctx.consumed ?? 0}; remaining: ${ctx.remaining ?? '?'}
- Macros so far today: protein ${ctx.protein ?? 0}g, carbs ${ctx.carbs ?? 0}g, fat ${ctx.fat ?? 0}g
- Steps: ${ctx.steps ?? 0} of ${ctx.stepsTarget ?? '?'}; active minutes today: ${ctx.activeMinutes ?? 0}`

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          eat: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: { title: { type: 'STRING' }, detail: { type: 'STRING' } },
              required: ['title', 'detail'],
            },
          },
          move: {
            type: 'OBJECT',
            properties: { title: { type: 'STRING' }, detail: { type: 'STRING' } },
            required: ['title', 'detail'],
          },
          focus: { type: 'STRING' },
        },
        required: ['eat', 'move', 'focus'],
      },
    },
  }

  try {
    const r = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!r.ok) return json({ plan: null, error: `gemini ${r.status}` })
    const out = await r.json()
    const text: string = out?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'null'
    const plan = JSON.parse(text)
    return json({ plan })
  } catch (e) {
    return json({ plan: null, error: String(e) })
  }
})
