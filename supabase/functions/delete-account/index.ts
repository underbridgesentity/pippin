// Supabase Edge Function: delete-account
//
// Permanently erases the SIGNED-IN user: their Storage photos, then the auth
// user (which cascades to profiles, user_state, posts, reactions, comments and
// friendships via ON DELETE CASCADE). Required for App Store Guideline 5.1.1(v)
// and POPIA/GDPR data erasure.
//
// The uid is derived from the caller's verified JWT, never from the body, so a
// user can only ever delete themselves. SUPABASE_SERVICE_ROLE_KEY is injected
// automatically by the platform.
//
// Deploy: supabase functions deploy delete-account

import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!serviceKey) return json({ error: 'not configured' }, 500)

  // Identify the caller from their JWT (anon client scoped to their token).
  const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: userData, error: userErr } = await asUser.auth.getUser()
  const uid = userData?.user?.id
  if (userErr || !uid) return json({ error: 'not signed in' }, 401)

  // Privileged client for the actual erasure.
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  // 1. Remove the user's Storage photos (not covered by DB cascade).
  const { data: files } = await admin.storage.from('post-photos').list(uid, { limit: 1000 })
  if (files && files.length) {
    const paths = files.map((f) => `${uid}/${f.name}`)
    await admin.storage.from('post-photos').remove(paths)
  }

  // 2. Delete the auth user; DB rows cascade from auth.users.
  const { error: delErr } = await admin.auth.admin.deleteUser(uid)
  if (delErr) return json({ error: delErr.message }, 500)

  return json({ ok: true })
})
