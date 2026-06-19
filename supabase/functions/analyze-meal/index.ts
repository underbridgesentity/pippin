// Supabase Edge Function: analyze-meal
//
// Identifies foods in a meal photo using Gemini 2.5 Flash-Lite, constrained to
// the app's food catalog (sent by the client). The Gemini API key never leaves
// the server. On any error it returns 200 with an empty list so the app falls
// back to manual logging instead of breaking.
//
// Setup:
//   supabase secrets set GEMINI_API_KEY=your_google_ai_studio_key
//   supabase functions deploy analyze-meal
//
// The client calls it with the Supabase anon key as a bearer token.

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
  if (!image || !catalog?.length) return json({ items: [] })

  const ids = new Set(catalog.map((c) => c.id))
  const list = catalog.map((c) => `- ${c.id}: ${c.name} (1 serving = ${c.serving})`).join('\n')
  const { mimeType, data } = splitDataUrl(image)

  const prompt = `You are a nutrition assistant for a food-logging app. The user photographed a meal.
From the CATALOG below, identify which foods appear in the photo and estimate how many servings of each are on the plate (a serving is the amount shown in parentheses).
Rules:
- Only use ids that appear in the catalog.
- If a visible food has no close match in the catalog, skip it.
- If the image shows no food, return an empty list.
- Estimate servings as a positive number; use 1 when unsure.

CATALOG:
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
              properties: { id: { type: 'STRING' }, servings: { type: 'NUMBER' } },
              required: ['id', 'servings'],
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
    const parsed = JSON.parse(text) as { items?: { id: string; servings: number }[] }
    const items = (parsed.items ?? [])
      .filter((i) => ids.has(i.id))
      .map((i) => ({ id: i.id, servings: Math.max(1, Math.round(i.servings || 1)) }))
    return json({ items })
  } catch (e) {
    return json({ error: String(e), items: [] })
  }
})
