// Supabase Edge Function: analyze-meal
//
// Identifies the foods and drinks in a meal photo using Gemini 2.5 Flash-Lite
// and estimates the calories + macros for each, for ANY meal — combinations,
// home-cooked plates, and packaged items (it reads visible nutrition labels).
// It is NOT limited to the app's food list: that list is passed only as a hint,
// so a detected food that clearly matches a known food comes back with a
// `catalogId` (the client then uses the app's exact numbers); everything else
// comes back as the model's best estimate.
//
// The Gemini API key never leaves the server. On any error it returns 200 with
// an empty list so the app falls back to manual logging instead of breaking.
//
// Setup:
//   supabase secrets set GEMINI_API_KEY=your_google_ai_studio_key
//   supabase functions deploy analyze-meal

const MODEL = 'gemini-2.5-flash-lite'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type CatalogItem = { id: string; name: string; serving: string }

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

function splitDataUrl(image: string): { mimeType: string; data: string } {
  const m = image.match(/^data:([^;]+);base64,(.*)$/)
  if (m) return { mimeType: m[1], data: m[2] }
  return { mimeType: 'image/jpeg', data: image }
}

function clampNum(v: unknown, min: number): number {
  const n = Math.round(Number(v))
  return Number.isFinite(n) ? Math.max(min, n) : min
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method not allowed', items: [] }, 405)

  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) return json({ error: 'analyzer not configured', items: [] })

  let body: { image?: string; catalog?: CatalogItem[] }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad request', items: [] }, 400)
  }

  const { image, catalog } = body
  if (!image) return json({ items: [] })

  const known = catalog ?? []
  const ids = new Set(known.map((c) => c.id))
  const list = known.map((c) => `- ${c.id}: ${c.name} (1 serving = ${c.serving})`).join('\n')
  const { mimeType, data } = splitDataUrl(image)

  const prompt = `You are a nutrition assistant for a food-logging app. Identify EVERY distinct food and drink visible in the photo. Be thorough:
- List each item separately, including combinations on one plate (e.g. eggs AND toast, or avocado AND tomato).
- Include packaged or branded items. If a nutrition label or packaging is visible, read it and use those numbers.
- Include drinks.

For each item, estimate the portion actually shown and its nutrition FOR THAT PORTION:
- servings: how many portions of this item are shown (default 1).
- kcal: calories for the shown portion.
- protein, carbs, fat: grams for the shown portion.
- emoji: one fitting emoji for the item.
- catalogId: set this ONLY if the item clearly matches one of the KNOWN FOODS listed below (use that food's id so we can apply our exact data). Otherwise omit catalogId and give your own best estimate.

Be realistic and give your best estimate rather than skipping an item. If the image shows no food or drink at all, return an empty list.

KNOWN FOODS (for catalogId matching only — you are NOT limited to these):
${list}`

  const payload = {
    contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data } }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          items: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                name: { type: 'STRING' },
                emoji: { type: 'STRING' },
                servings: { type: 'NUMBER' },
                kcal: { type: 'NUMBER' },
                protein: { type: 'NUMBER' },
                carbs: { type: 'NUMBER' },
                fat: { type: 'NUMBER' },
                catalogId: { type: 'STRING' },
              },
              required: ['name', 'servings', 'kcal', 'protein', 'carbs', 'fat'],
            },
          },
        },
        required: ['items'],
      },
    },
  }

  try {
    const r = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!r.ok) return json({ error: `gemini ${r.status}`, items: [] })
    const out = await r.json()
    const text: string = out?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{"items":[]}'
    const parsed = JSON.parse(text) as { items?: Array<Record<string, unknown>> }
    const items = (parsed.items ?? [])
      .map((i) => ({
        name: String(i.name ?? '').trim().slice(0, 80),
        emoji: typeof i.emoji === 'string' ? i.emoji.slice(0, 8) : '',
        servings: clampNum(i.servings, 1),
        kcal: clampNum(i.kcal, 0),
        protein: clampNum(i.protein, 0),
        carbs: clampNum(i.carbs, 0),
        fat: clampNum(i.fat, 0),
        catalogId: typeof i.catalogId === 'string' && ids.has(i.catalogId) ? i.catalogId : undefined,
      }))
      .filter((i) => i.name)
    return json({ items })
  } catch (e) {
    return json({ error: String(e), items: [] })
  }
})
