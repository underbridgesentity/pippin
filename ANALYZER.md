# Meal photo analyzer (Gemini 2.5 Flash-Lite)

When a user snaps a meal, Fettle can identify the foods on the plate and pre-fill
them on the log screen for the user to confirm or edit. The user always reviews
before saving, and the bundled food database stays the source of truth for the
calorie and macro numbers, the model only does recognition.

It is **off by default** and degrades gracefully: if it is not turned on, or the
call fails, the user just logs the meal by hand (the normal flow).

## How it works

```
Capture photo (downscaled in the browser)
   -> POST /functions/v1/analyze-meal   (Supabase Edge Function, holds the key)
       -> Gemini 2.5 Flash-Lite, constrained to Fettle's food catalog
   <- { items: [{ id, servings }] }      (ids that exist in the catalog only)
Client maps ids -> bundled food DB -> pre-fills the log screen
```

The Gemini API key never reaches the browser. The client calls the Edge Function
with the Supabase anon key.

## One-time setup

1. **Get a key.** Create a Google AI Studio API key at
   [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

2. **Store it as a Supabase secret** (never in the app):

   ```
   supabase secrets set GEMINI_API_KEY=your_key
   ```

3. **Deploy the function:**

   ```
   supabase functions deploy analyze-meal
   ```

   (Source: [`supabase/functions/analyze-meal/index.ts`](supabase/functions/analyze-meal/index.ts).)

4. **Turn the feature on** by setting `VITE_MEAL_ANALYZER=on`:
   - Locally: add it to `.env.local` and restart `npm run dev`.
   - Production: add it in Vercel -> Settings -> Environment Variables, then redeploy.

That is it. With the flag off (or unset), the analyzer stays dormant and the app
behaves exactly as before.

## Cost

Gemini 2.5 Flash-Lite is roughly **$0.10 / 1M input tokens and $0.40 / 1M output
tokens**. A meal photo plus the catalog and a short JSON reply is on the order of
a few hundred to ~1,000 tokens, so the cost is a fraction of a cent per photo
(around $0.20 per 1,000 photos). Recognition accuracy, not price, is the thing to
watch, test it on real meal photos and adjust the prompt in the Edge Function if
needed.

## Swapping the model later

Only [`supabase/functions/analyze-meal/index.ts`](supabase/functions/analyze-meal/index.ts)
knows about Gemini. To move to a different vision model, change the endpoint and
request shape there; the client contract (`{ image, catalog } -> { items }`) and
the rest of the app stay the same.
